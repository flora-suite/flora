// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  AddOutlined,
  BuildOutlined,
  CalendarTodayOutlined,
  CloseOutlined,
  DeleteOutlined,
  DevicesOutlined,
  EditOutlined,
  EventNoteOutlined,
  MoreVertOutlined,
  SearchOutlined,
  SystemUpdateAltOutlined,
  WarningAmberOutlined,
} from "@mui/icons-material";
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  Link,
  Menu,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState, MouseEvent, ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { makeStyles } from "tss-react/mui";

import { LoginRequiredPlaceholder } from "@lichtblick/suite-base/components/LoginRequiredPlaceholder";
import Stack from "@lichtblick/suite-base/components/Stack";
import { ConfirmDialog } from "@lichtblick/suite-base/components/dialogs";
import { useAuth } from "@lichtblick/suite-base/context/AuthContext";
import { useDevices } from "@lichtblick/suite-base/context/DeviceContext";
import { useEvents } from "@lichtblick/suite-base/context/EventContext";
import { useCurrentOrganizationId } from "@lichtblick/suite-base/context/OrganizationContext";
import type { Device } from "@lichtblick/suite-base/services/IDeviceService";
import type { DeviceEvent, EventType } from "@lichtblick/suite-base/services/IEventService";

const useStyles = makeStyles()((theme) => ({
  root: {
    height: "100%",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    padding: theme.spacing(3),
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  content: {
    flex: 1,
    overflow: "auto",
    padding: theme.spacing(3),
  },
  loadingState: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    minHeight: 400,
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    minHeight: 400,
    textAlign: "center",
    gap: theme.spacing(2),
  },
  emptyIcon: {
    fontSize: 80,
    color: theme.palette.text.disabled,
  },
  filters: {
    display: "flex",
    gap: theme.spacing(2),
    flexWrap: "wrap",
    alignItems: "center",
  },
  searchField: {
    minWidth: 300,
  },
  filterSelect: {
    minWidth: 150,
  },
  tableContainer: {
    marginTop: theme.spacing(2),
  },
  eventTypeChip: {
    fontWeight: 600,
  },
  metadataCell: {
    maxWidth: 200,
  },
  metadataChip: {
    margin: theme.spacing(0.25),
  },
  descriptionCell: {
    maxWidth: 300,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  dialogContent: {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(2),
    minWidth: 400,
  },
  formField: {
    marginTop: theme.spacing(1),
  },
}));

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
}

function EventTypeIcon({ eventType }: { eventType: EventType }): React.JSX.Element {
  switch (eventType) {
    case "maintenance":
      return <BuildOutlined fontSize="small" />;
    case "upgrade":
      return <SystemUpdateAltOutlined fontSize="small" />;
    case "repair":
      return <WarningAmberOutlined fontSize="small" />;
    case "replacement":
      return <DevicesOutlined fontSize="small" />;
    case "inspection":
      return <SearchOutlined fontSize="small" />;
    case "other":
      return <EventNoteOutlined fontSize="small" />;
  }
}

export function EventsPage(): React.JSX.Element {
  const { classes } = useStyles();
  const { t } = useTranslation("pages");
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const currentOrganizationId = useCurrentOrganizationId();

  const { eventService } = useEvents();
  const { fetchDevices } = useDevices();

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<EventType | "all">("all");
  const [deviceFilter, setDeviceFilter] = useState<string>("all");
  const [events, setEvents] = useState<DeviceEvent[]>([]);
  const [devices, setDevices] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | undefined>(undefined);
  const [selectedEvent, setSelectedEvent] = useState<DeviceEvent | undefined>(undefined);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state for create/edit
  const [formDeviceId, setFormDeviceId] = useState("");
  const [formEventType, setFormEventType] = useState<EventType>("maintenance");
  const [formDescription, setFormDescription] = useState("");
  const [formStartTime, setFormStartTime] = useState("");
  const [formDuration, setFormDuration] = useState("");
  const [formMetadataKey, setFormMetadataKey] = useState("");
  const [formMetadataValue, setFormMetadataValue] = useState("");
  const [formMetadata, setFormMetadata] = useState<Record<string, string>>({});

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Load devices (only if authenticated)
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    const loadDevices = async () => {
      try {
        const response = await fetchDevices({ orgId: currentOrganizationId, pageSize: 100 });
        setDevices(response.data.map((d: Device) => ({ id: d.id, name: d.name })));
      } catch (err) {
        console.warn("Failed to load devices:", err);
      }
    };
    void loadDevices();
  }, [fetchDevices, isAuthenticated, currentOrganizationId]);

  // Load events
  const loadEvents = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const query: Parameters<typeof eventService.getEvents>[0] = {
        orgId: currentOrganizationId,
        pageSize: 100,
      };
      if (deviceFilter !== "all") {
        query.deviceId = deviceFilter;
      }
      if (typeFilter !== "all") {
        query.eventType = typeFilter;
      }
      if (searchQuery.trim()) {
        query.search = searchQuery.trim();
      }
      const response = await eventService.getEvents(query);
      setEvents(response.events);
    } catch (err) {
      console.warn("Failed to load events:", err);
      setError(err instanceof Error ? err.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, [eventService, deviceFilter, typeFilter, searchQuery, isAuthenticated, currentOrganizationId]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents, currentOrganizationId]);

  const filteredEvents = useMemo(() => {
    // Since we're filtering server-side now, just return the events
    // But keep client-side search for faster UX
    if (!searchQuery.trim()) {
      return events;
    }
    const query = searchQuery.toLowerCase();
    return events.filter(
      (event) =>
        event.description.toLowerCase().includes(query) ||
        (event.deviceName?.toLowerCase().includes(query) ?? false) ||
        event.createdBy.toLowerCase().includes(query),
    );
  }, [events, searchQuery]);

  // Paginated events
  const paginatedEvents = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredEvents.slice(start, start + rowsPerPage);
  }, [filteredEvents, page, rowsPerPage]);

  const handleChangePage = useCallback((_event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const handleMenuOpen = useCallback((e: MouseEvent<HTMLElement>, event: DeviceEvent) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
    setSelectedEvent(event);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuAnchor(undefined);
    setSelectedEvent(undefined);
  }, []);

  const handleOpenCreateDialog = useCallback(() => {
    setFormDeviceId("");
    setFormEventType("maintenance");
    setFormDescription("");
    setFormStartTime(new Date().toISOString().slice(0, 16));
    setFormDuration("30");
    setFormMetadata({});
    setFormMetadataKey("");
    setFormMetadataValue("");
    setCreateDialogOpen(true);
  }, []);

  const handleCloseCreateDialog = useCallback(() => {
    setCreateDialogOpen(false);
  }, []);

  const handleAddMetadata = useCallback(() => {
    if (formMetadataKey.trim() && formMetadataValue.trim()) {
      setFormMetadata((prev) => ({
        ...prev,
        [formMetadataKey.trim()]: formMetadataValue.trim(),
      }));
      setFormMetadataKey("");
      setFormMetadataValue("");
    }
  }, [formMetadataKey, formMetadataValue]);

  const handleRemoveMetadata = useCallback((key: string) => {
    setFormMetadata((prev) => {
      const newMetadata = { ...prev };
      delete newMetadata[key];
      return newMetadata;
    });
  }, []);

  const handleCreateEvent = useCallback(async () => {
    if (!formDeviceId || !formDescription.trim()) {
      return;
    }

    setCreating(true);
    try {
      await eventService.createEvent({
        deviceId: formDeviceId,
        eventType: formEventType,
        description: formDescription,
        startTime: new Date(formStartTime).toISOString(),
        duration: parseInt(formDuration, 10) || 30,
        metadata: formMetadata,
      });
      setCreateDialogOpen(false);
      void loadEvents();
    } catch (err) {
      console.warn("Failed to create event:", err);
      setError(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setCreating(false);
    }
  }, [
    eventService,
    formDeviceId,
    formEventType,
    formDescription,
    formStartTime,
    formDuration,
    formMetadata,
    loadEvents,
  ]);

  const handleDeleteClick = useCallback(() => {
    setDeleteDialogOpen(true);
    setMenuAnchor(undefined);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedEvent) {
      return;
    }

    try {
      await eventService.deleteEvent(selectedEvent.id);
      setDeleteDialogOpen(false);
      setSelectedEvent(undefined);
      void loadEvents();
    } catch (err) {
      console.warn("Failed to delete event:", err);
      setError(err instanceof Error ? err.message : "Failed to delete event");
    }
  }, [eventService, selectedEvent, loadEvents]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setSelectedEvent(undefined);
  }, []);

  const getEventTypeColor = (
    eventType: EventType,
  ): "primary" | "secondary" | "warning" | "error" | "info" | "success" => {
    switch (eventType) {
      case "maintenance":
        return "primary";
      case "upgrade":
        return "success";
      case "repair":
        return "warning";
      case "replacement":
        return "secondary";
      case "inspection":
        return "info";
      case "other":
        return "primary";
    }
  };

  const isEmpty = events.length === 0 && !loading;

  // Show login required placeholder if not authenticated
  if (!authLoading && !isAuthenticated) {
    return (
      <Stack className={classes.root}>
        <LoginRequiredPlaceholder />
      </Stack>
    );
  }

  return (
    <Stack className={classes.root}>
      <div className={classes.header}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack gap={0.5}>
            <Typography variant="h5">{t("eventsTitle")}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t("eventsDescription")}
            </Typography>
          </Stack>
          <Button
            variant="contained"
            startIcon={<AddOutlined />}
            onClick={handleOpenCreateDialog}
          >
            {t("createEvent")}
          </Button>
        </Stack>
      </div>

      <div className={classes.content}>
        {error && (
          <Alert severity="error" onClose={() => { setError(undefined); }} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <div className={classes.loadingState}>
            <CircularProgress />
          </div>
        ) : isEmpty ? (
          <div className={classes.emptyState}>
            <EventNoteOutlined className={classes.emptyIcon} />
            <Typography variant="h6" color="text.secondary">
              {t("noEvents")}
            </Typography>
            <Typography variant="body2" color="text.secondary" maxWidth={400}>
              {t("noEventsDescription")}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddOutlined />}
              onClick={handleOpenCreateDialog}
            >
              {t("createEvent")}
            </Button>
          </div>
        ) : (
          <Stack gap={2}>
            <div className={classes.filters}>
              <TextField
                className={classes.searchField}
                size="small"
                placeholder={t("searchEvents")}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchOutlined fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <FormControl size="small" className={classes.filterSelect}>
                <InputLabel>{t("device")}</InputLabel>
                <Select
                  value={deviceFilter}
                  label={t("device")}
                  onChange={(e) => {
                    setDeviceFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="all">{t("allDevices")}</MenuItem>
                  {devices.map((device) => (
                    <MenuItem key={device.id} value={device.id}>
                      {device.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" className={classes.filterSelect}>
                <InputLabel>{t("eventType")}</InputLabel>
                <Select
                  value={typeFilter}
                  label={t("eventType")}
                  onChange={(e) => {
                    setTypeFilter(e.target.value as EventType | "all");
                    setPage(0);
                  }}
                >
                  <MenuItem value="all">{t("allTypes")}</MenuItem>
                  <MenuItem value="maintenance">{t("maintenance")}</MenuItem>
                  <MenuItem value="upgrade">{t("upgrade")}</MenuItem>
                  <MenuItem value="repair">{t("repair")}</MenuItem>
                  <MenuItem value="replacement">{t("replacement")}</MenuItem>
                  <MenuItem value="inspection">{t("inspection")}</MenuItem>
                  <MenuItem value="other">{t("other")}</MenuItem>
                </Select>
              </FormControl>
            </div>

            <TableContainer component={Paper} className={classes.tableContainer}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t("eventType")}</TableCell>
                    <TableCell>{t("device")}</TableCell>
                    <TableCell>{t("description")}</TableCell>
                    <TableCell>{t("startTime")}</TableCell>
                    <TableCell>{t("duration")}</TableCell>
                    <TableCell>{t("metadata")}</TableCell>
                    <TableCell>{t("createdBy")}</TableCell>
                    <TableCell align="right">{t("actions")}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedEvents.map((event) => (
                    <TableRow key={event.id} hover>
                      <TableCell>
                        <Chip
                          icon={<EventTypeIcon eventType={event.eventType} />}
                          label={t(event.eventType)}
                          size="small"
                          color={getEventTypeColor(event.eventType)}
                          className={classes.eventTypeChip}
                        />
                      </TableCell>
                      <TableCell>
                        <Link
                          component="button"
                          variant="body2"
                          onClick={() => {
                            void navigate(`/devices/${event.deviceId}?tab=events`);
                          }}
                          sx={{ cursor: "pointer" }}
                        >
                          {event.deviceName ?? "Unknown Device"}
                        </Link>
                      </TableCell>
                      <TableCell className={classes.descriptionCell}>
                        <Tooltip title={event.description}>
                          <Typography variant="body2">{event.description}</Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" gap={0.5}>
                          <CalendarTodayOutlined fontSize="small" color="action" />
                          <Typography variant="body2">
                            {formatDateTime(event.startTime)}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDuration(event.duration)}
                        </Typography>
                      </TableCell>
                      <TableCell className={classes.metadataCell}>
                        <Stack direction="row" flexWrap="wrap">
                          {Object.entries(event.metadata)
                            .slice(0, 2)
                            .map(([key, value]) => (
                              <Chip
                                key={key}
                                label={`${key}: ${value}`}
                                size="small"
                                variant="outlined"
                                className={classes.metadataChip}
                              />
                            ))}
                          {Object.keys(event.metadata).length > 2 && (
                            <Chip
                              label={`+${Object.keys(event.metadata).length - 2}`}
                              size="small"
                              variant="outlined"
                              className={classes.metadataChip}
                            />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {event.createdBy}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            handleMenuOpen(e, event);
                          }}
                        >
                          <MoreVertOutlined fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={filteredEvents.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
                labelRowsPerPage={t("rowsPerPage")}
              />
            </TableContainer>

            {filteredEvents.length === 0 && (
              <Stack alignItems="center" padding={4}>
                <Typography color="text.secondary">{t("noMatchingEvents")}</Typography>
              </Stack>
            )}
          </Stack>
        )}
      </div>

      {/* Context Menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
        <MenuItem onClick={handleMenuClose}>
          <Stack direction="row" alignItems="center" gap={1}>
            <EditOutlined fontSize="small" />
            {t("edit")}
          </Stack>
        </MenuItem>
        <MenuItem onClick={handleDeleteClick}>
          <Stack direction="row" alignItems="center" gap={1} style={{ color: "error.main" }}>
            <DeleteOutlined fontSize="small" color="error" />
            {t("delete")}
          </Stack>
        </MenuItem>
      </Menu>

      <ConfirmDialog
        open={deleteDialogOpen}
        title={t("deleteEvent")}
        message={t("deleteEventConfirm")}
        confirmLabel={t("delete")}
        variant="error"
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={handleDeleteCancel}
      />

      {/* Create Event Dialog */}
      <Dialog open={createDialogOpen} onClose={handleCloseCreateDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            {t("createEvent")}
            <IconButton size="small" onClick={handleCloseCreateDialog}>
              <CloseOutlined />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <div className={classes.dialogContent}>
            <FormControl fullWidth className={classes.formField}>
              <InputLabel>{t("device")}</InputLabel>
              <Select
                value={formDeviceId}
                label={t("device")}
                onChange={(e) => {
                  setFormDeviceId(e.target.value);
                }}
              >
                {devices.map((device) => (
                  <MenuItem key={device.id} value={device.id}>
                    {device.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth className={classes.formField}>
              <InputLabel>{t("eventType")}</InputLabel>
              <Select
                value={formEventType}
                label={t("eventType")}
                onChange={(e) => {
                  setFormEventType(e.target.value as EventType);
                }}
              >
                <MenuItem value="maintenance">{t("maintenance")}</MenuItem>
                <MenuItem value="upgrade">{t("upgrade")}</MenuItem>
                <MenuItem value="repair">{t("repair")}</MenuItem>
                <MenuItem value="replacement">{t("replacement")}</MenuItem>
                <MenuItem value="inspection">{t("inspection")}</MenuItem>
                <MenuItem value="other">{t("other")}</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label={t("description")}
              multiline
              rows={3}
              value={formDescription}
              onChange={(e) => {
                setFormDescription(e.target.value);
              }}
              className={classes.formField}
            />

            <TextField
              fullWidth
              label={t("startTime")}
              type="datetime-local"
              value={formStartTime}
              onChange={(e) => {
                setFormStartTime(e.target.value);
              }}
              className={classes.formField}
              slotProps={{
                inputLabel: { shrink: true },
              }}
            />

            <TextField
              fullWidth
              label={t("durationMinutes")}
              type="number"
              value={formDuration}
              onChange={(e) => {
                setFormDuration(e.target.value);
              }}
              className={classes.formField}
            />

            {/* Metadata section */}
            <Typography variant="subtitle2" sx={{ mt: 2 }}>
              {t("metadata")}
            </Typography>
            <Stack direction="row" gap={1}>
              <TextField
                size="small"
                label={t("key")}
                value={formMetadataKey}
                onChange={(e) => {
                  setFormMetadataKey(e.target.value);
                }}
                sx={{ flex: 1 }}
              />
              <TextField
                size="small"
                label={t("value")}
                value={formMetadataValue}
                onChange={(e) => {
                  setFormMetadataValue(e.target.value);
                }}
                sx={{ flex: 1 }}
              />
              <Button variant="outlined" onClick={handleAddMetadata}>
                {t("add")}
              </Button>
            </Stack>
            <Stack direction="row" flexWrap="wrap" gap={0.5}>
              {Object.entries(formMetadata).map(([key, value]) => (
                <Chip
                  key={key}
                  label={`${key}: ${value}`}
                  size="small"
                  onDelete={() => {
                    handleRemoveMetadata(key);
                  }}
                />
              ))}
            </Stack>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog}>{t("cancel")}</Button>
          <Button
            variant="contained"
            onClick={() => void handleCreateEvent()}
            disabled={!formDeviceId || !formDescription.trim() || creating}
          >
            {creating ? <CircularProgress size={20} /> : t("create")}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
