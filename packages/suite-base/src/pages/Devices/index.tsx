// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  BlockOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  DevicesOutlined,
  EditOutlined,
  MoreVertOutlined,
  RefreshOutlined,
  SearchOutlined,
  SettingsOutlined,
  SignalWifiOffOutlined,
  SignalWifi4BarOutlined,
  VisibilityOutlined,
  WarningAmberOutlined,
} from "@mui/icons-material";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Pagination,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState, MouseEvent, ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { makeStyles } from "tss-react/mui";

import { LoginRequiredPlaceholder } from "@lichtblick/suite-base/components/LoginRequiredPlaceholder";
import Stack from "@lichtblick/suite-base/components/Stack";
import { ConfirmDialog, RenameDialog } from "@lichtblick/suite-base/components/dialogs";
import { useAuth } from "@lichtblick/suite-base/context/AuthContext";
import { useDevices } from "@lichtblick/suite-base/context/DeviceContext";
import { useCurrentOrganizationId } from "@lichtblick/suite-base/context/OrganizationContext";
import { Device, DeviceStatus } from "@lichtblick/suite-base/services/IDeviceService";

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
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    minHeight: 400,
    gap: theme.spacing(2),
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
  deviceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: theme.spacing(2),
  },
  deviceCard: {
    cursor: "pointer",
    transition: theme.transitions.create(["box-shadow", "border-color"]),
    "&:hover": {
      boxShadow: theme.shadows[4],
    },
  },
  deviceCardDisabled: {
    opacity: 0.6,
  },
  deviceCardOnline: {
    borderLeft: `4px solid ${theme.palette.success.main}`,
  },
  deviceCardOffline: {
    borderLeft: `4px solid ${theme.palette.text.disabled}`,
  },
  deviceCardError: {
    borderLeft: `4px solid ${theme.palette.error.main}`,
  },
  statusChip: {
    fontWeight: 600,
  },
  searchField: {
    maxWidth: 400,
  },
  actionButtons: {
    gap: theme.spacing(1),
  },
}));

function formatLastSeen(dateString: string | undefined): string {
  if (!dateString) {
    return "Never";
  }

  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) {
    return "Just now";
  }
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  }
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  }
  return date.toLocaleDateString();
}

function StatusIcon({ status }: { status: DeviceStatus }): React.JSX.Element {
  switch (status) {
    case "online":
      return <SignalWifi4BarOutlined color="success" />;
    case "offline":
      return <SignalWifiOffOutlined color="disabled" />;
    case "error":
      return <WarningAmberOutlined color="error" />;
  }
}

export function DevicesPage(): React.JSX.Element {
  const { classes, cx } = useStyles();
  const { t } = useTranslation("pages");
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const currentOrganizationId = useCurrentOrganizationId();

  const {
    devices,
    isLoading,
    error,
    fetchDevices,
    updateDevice,
    enableDevice,
    disableDevice,
    deleteDevice,
    refreshDevices,
    clearError,
  } = useDevices();

  const [searchQuery, setSearchQuery] = useState("");
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | undefined>(undefined);
  const [selectedDevice, setSelectedDevice] = useState<Device | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string | undefined>(undefined);

  // Pagination state
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  // Fetch devices on mount and when organization changes (only if authenticated)
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    fetchDevices({ orgId: currentOrganizationId }).catch(() => {
      // Errors are handled by DeviceProvider, nothing to do here
    });
  }, [fetchDevices, isAuthenticated, currentOrganizationId]);

  const filteredDevices = useMemo(() => {
    if (!searchQuery.trim()) {
      return devices;
    }
    const query = searchQuery.toLowerCase();
    return devices.filter(
      (device) =>
        device.name.toLowerCase().includes(query) ||
        device.type.toLowerCase().includes(query) ||
        (device.ipAddress?.includes(query) ?? false),
    );
  }, [devices, searchQuery]);

  // Paginated devices
  const paginatedDevices = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredDevices.slice(start, start + itemsPerPage);
  }, [filteredDevices, page, itemsPerPage]);

  const totalPages = Math.ceil(filteredDevices.length / itemsPerPage);

  const handleChangePage = useCallback((_event: ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleRefresh = useCallback(async () => {
    try {
      await refreshDevices();
      setSnackbarMessage(t("devicesRefreshed"));
    } catch {
      // Error is handled by context
    }
  }, [refreshDevices, t]);

  const handleMenuOpen = useCallback((event: MouseEvent<HTMLElement>, device: Device) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setSelectedDevice(device);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuAnchor(undefined);
    setSelectedDevice(undefined);
  }, []);

  const handleViewDevice = useCallback(
    (device: Device) => {
      void navigate(`/devices/${device.id}`);
    },
    [navigate],
  );

  const handleRenameClick = useCallback(() => {
    setRenameDialogOpen(true);
    setMenuAnchor(undefined);
  }, []);

  const handleRenameConfirm = useCallback(
    async (newName: string) => {
      if (selectedDevice) {
        try {
          await updateDevice(selectedDevice.id, { name: newName });
          setSnackbarMessage(t("deviceRenamed"));
        } catch {
          // Error is handled by context
        }
      }
      setRenameDialogOpen(false);
      setSelectedDevice(undefined);
    },
    [selectedDevice, updateDevice, t],
  );

  const handleRenameCancel = useCallback(() => {
    setRenameDialogOpen(false);
    setSelectedDevice(undefined);
  }, []);

  const handleToggleEnabled = useCallback(async () => {
    if (selectedDevice) {
      try {
        if (selectedDevice.enabled) {
          await disableDevice(selectedDevice.id);
          setSnackbarMessage(t("deviceDisabled"));
        } else {
          await enableDevice(selectedDevice.id);
          setSnackbarMessage(t("deviceEnabled"));
        }
      } catch {
        // Error is handled by context
      }
    }
    handleMenuClose();
  }, [selectedDevice, enableDevice, disableDevice, handleMenuClose, t]);

  const handleDeleteClick = useCallback(() => {
    setDeleteDialogOpen(true);
    setMenuAnchor(undefined);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (selectedDevice) {
      try {
        await deleteDevice(selectedDevice.id);
        setSnackbarMessage(t("deviceDeleted"));
      } catch {
        // Error is handled by context
      }
    }
    setDeleteDialogOpen(false);
    setSelectedDevice(undefined);
  }, [selectedDevice, deleteDevice, t]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setSelectedDevice(undefined);
  }, []);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbarMessage(undefined);
  }, []);

  const handleCloseError = useCallback(() => {
    clearError();
  }, [clearError]);

  const isEmpty = devices.length === 0;

  const getStatusChipColor = (status: DeviceStatus): "success" | "default" | "error" => {
    switch (status) {
      case "online":
        return "success";
      case "offline":
        return "default";
      case "error":
        return "error";
    }
  };

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
            <Typography variant="h5">{t("devicesTitle")}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t("devicesDescription")}
            </Typography>
          </Stack>
          <Stack direction="row" className={classes.actionButtons}>
            <Button
              variant="outlined"
              startIcon={<RefreshOutlined />}
              onClick={handleRefresh}
              disabled={isLoading}
            >
              {t("refresh")}
            </Button>
          </Stack>
        </Stack>
      </div>

      <div className={classes.content}>
        {isLoading && isEmpty ? (
          <div className={classes.loadingState}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              {t("loadingDevices")}
            </Typography>
          </div>
        ) : isEmpty ? (
          <div className={classes.emptyState}>
            <DevicesOutlined className={classes.emptyIcon} />
            <Typography variant="h6" color="text.secondary">
              {t("noDevices")}
            </Typography>
            <Typography variant="body2" color="text.secondary" maxWidth={400}>
              {t("noDevicesDescription")}
            </Typography>
          </div>
        ) : (
          <Stack gap={3}>
            <TextField
              className={classes.searchField}
              size="small"
              placeholder={t("searchDevices")}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
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

            <div className={classes.deviceGrid}>
              {paginatedDevices.map((device) => (
                <Card
                  key={device.id}
                  className={cx(classes.deviceCard, {
                    [classes.deviceCardDisabled]: !device.enabled,
                    [classes.deviceCardOnline]: device.status === "online",
                    [classes.deviceCardOffline]: device.status === "offline",
                    [classes.deviceCardError]: device.status === "error",
                  })}
                  onClick={() => {
                    handleViewDevice(device);
                  }}
                >
                  <CardContent>
                    <Stack gap={2}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Stack direction="row" alignItems="center" gap={1.5}>
                          <StatusIcon status={device.status} />
                          <Stack gap={0.25}>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {device.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {device.type}
                            </Typography>
                          </Stack>
                        </Stack>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            handleMenuOpen(e, device);
                          }}
                        >
                          <MoreVertOutlined fontSize="small" />
                        </IconButton>
                      </Stack>

                      <Stack gap={1}>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">
                            {t("ipAddress")}
                          </Typography>
                          <Typography variant="body2">{device.ipAddress ?? "-"}</Typography>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">
                            {t("topics")}
                          </Typography>
                          <Typography variant="body2">{device.rosTopicCount ?? "-"}</Typography>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">
                            {t("lastSeen")}
                          </Typography>
                          <Typography variant="body2">{formatLastSeen(device.lastSeen)}</Typography>
                        </Stack>
                      </Stack>

                      <Stack direction="row" gap={1}>
                        <Chip
                          label={t(device.status)}
                          size="small"
                          color={getStatusChipColor(device.status)}
                          className={classes.statusChip}
                        />
                        {!device.enabled && (
                          <Chip label={t("disabled")} size="small" color="warning" />
                        )}
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </div>

            {totalPages > 1 && (
              <Stack direction="row" justifyContent="center" padding={2}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handleChangePage}
                  color="primary"
                />
              </Stack>
            )}
          </Stack>
        )}
      </div>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
        <MenuItem
          onClick={() => {
            if (selectedDevice) {
              handleViewDevice(selectedDevice);
            }
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <VisibilityOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t("viewDetails")}</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleRenameClick}>
          <ListItemIcon>
            <EditOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t("rename")}</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <SettingsOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t("configure")}</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleToggleEnabled}>
          <ListItemIcon>
            {selectedDevice?.enabled ? (
              <BlockOutlined fontSize="small" color="warning" />
            ) : (
              <CheckCircleOutlined fontSize="small" color="success" />
            )}
          </ListItemIcon>
          <ListItemText>
            {selectedDevice?.enabled ? t("disableDevice") : t("enableDevice")}
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteClick}>
          <ListItemIcon>
            <DeleteOutlined fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: "error.main" }}>{t("delete")}</ListItemText>
        </MenuItem>
      </Menu>

      <ConfirmDialog
        open={deleteDialogOpen}
        title={t("deleteDevice")}
        message={t("deleteDeviceConfirm", { name: selectedDevice?.name ?? "" })}
        confirmLabel={t("delete")}
        variant="error"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      <RenameDialog
        open={renameDialogOpen}
        title={t("renameDevice")}
        label={t("deviceName")}
        initialValue={selectedDevice?.name ?? ""}
        onConfirm={handleRenameConfirm}
        onCancel={handleRenameCancel}
      />

      <Snackbar
        open={snackbarMessage != undefined}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
      />

      <Snackbar open={error != undefined} autoHideDuration={6000} onClose={handleCloseError}>
        <Alert onClose={handleCloseError} severity="error" variant="filled">
          {error}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
