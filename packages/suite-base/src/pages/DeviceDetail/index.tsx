// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  AddOutlined,
  ArrowBackOutlined,
  BlockOutlined,
  BookmarksOutlined,
  CheckCircleOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  ErrorOutlined,
  InfoOutlined,
  InsertDriveFileOutlined,
  MemoryOutlined,
  MoreVertOutlined,
  PlayArrowOutlined,
  RefreshOutlined,
  SettingsOutlined,
  SignalWifi4BarOutlined,
  SignalWifiOffOutlined,
  SmartToyOutlined,
  StorageOutlined,
  WarningAmberOutlined,
} from "@mui/icons-material";
import {
  Button,
  Chip,
  CircularProgress,
  IconButton,
  LinearProgress,
  Menu,
  MenuItem,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState, MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { makeStyles } from "tss-react/mui";

import { LoginRequiredPlaceholder } from "@lichtblick/suite-base/components/LoginRequiredPlaceholder";
import Stack from "@lichtblick/suite-base/components/Stack";
import {
  ConfirmDialog,
  RenameDialog,
  UploadDataDialog,
} from "@lichtblick/suite-base/components/dialogs";
import { useAuth } from "@lichtblick/suite-base/context/AuthContext";
import { useDevices } from "@lichtblick/suite-base/context/DeviceContext";
import { useCurrentOrganizationId } from "@lichtblick/suite-base/context/OrganizationContext";
import { usePlayerSelection } from "@lichtblick/suite-base/context/PlayerSelectionContext";
import { useRecordings } from "@lichtblick/suite-base/context/RecordingContext";
import {
  Device,
  DeviceAgentInfo,
  DeviceStatus,
  AgentStatus,
  DeviceEvent,
  DeviceEventType,
} from "@lichtblick/suite-base/services/IDeviceService";
import type { Recording } from "@lichtblick/suite-base/services/IRecordingService";

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
  backButton: {
    marginRight: theme.spacing(1),
  },
  statusChip: {
    fontWeight: 600,
    marginLeft: theme.spacing(2),
  },
  content: {
    flex: 1,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  tabsContainer: {
    borderBottom: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
  },
  tabContent: {
    flex: 1,
    overflow: "auto",
    padding: theme.spacing(3),
  },
  propertyPaper: {
    padding: theme.spacing(3),
  },
  propertyRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: theme.spacing(1.5, 0),
    borderBottom: `1px solid ${theme.palette.divider}`,
    "&:last-child": {
      borderBottom: "none",
    },
  },
  propertyLabel: {
    color: theme.palette.text.secondary,
    fontWeight: 500,
  },
  agentCard: {
    padding: theme.spacing(3),
    marginBottom: theme.spacing(2),
  },
  agentStatusRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  severityChip: {
    fontWeight: 600,
    minWidth: 80,
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing(6),
    textAlign: "center",
    gap: theme.spacing(2),
  },
  emptyIcon: {
    fontSize: 64,
    color: theme.palette.text.disabled,
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    padding: theme.spacing(6),
  },
  errorContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    padding: theme.spacing(6),
    gap: theme.spacing(2),
  },
  systemInfoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: theme.spacing(2),
    marginTop: theme.spacing(2),
  },
  systemInfoCard: {
    padding: theme.spacing(2),
    textAlign: "center",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginTop: theme.spacing(1),
  },
  moreButton: {
    marginLeft: theme.spacing(1),
  },
}));

type TabValue = "recordings" | "events" | "properties" | "agent";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.round(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTimestamp(dateStr: string | undefined): string {
  if (!dateStr) {
    return "-";
  }
  const date = new Date(dateStr);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatUptime(seconds: number | undefined): string {
  if (seconds == undefined) {
    return "-";
  }
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
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

function EventTypeIcon({ eventType }: { eventType: DeviceEventType }): React.JSX.Element {
  switch (eventType) {
    case "maintenance":
      return <SettingsOutlined fontSize="small" />;
    case "upgrade":
      return <CloudUploadOutlined fontSize="small" />;
    case "repair":
      return <WarningAmberOutlined fontSize="small" />;
    case "replacement":
      return <RefreshOutlined fontSize="small" />;
    case "inspection":
      return <InfoOutlined fontSize="small" />;
    case "other":
      return <BookmarksOutlined fontSize="small" />;
  }
}

function getEventTypeChipColor(eventType: DeviceEventType): "primary" | "secondary" | "warning" | "error" | "info" | "success" {
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
}

function getStatusChipColor(status: DeviceStatus): "success" | "default" | "error" {
  switch (status) {
    case "online":
      return "success";
    case "offline":
      return "default";
    case "error":
      return "error";
  }
}

function getAgentStatusColor(status: AgentStatus | undefined): "success" | "default" | "error" {
  switch (status) {
    case "running":
      return "success";
    case "stopped":
      return "default";
    case "error":
      return "error";
    default:
      return "default";
  }
}

export function DeviceDetailPage(): React.JSX.Element {
  const { classes } = useStyles();
  const { t } = useTranslation("pages");
  const navigate = useNavigate();
  const { deviceId } = useParams<{ deviceId: string }>();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    fetchDevice,
    updateDevice,
    enableDevice,
    disableDevice,
    deleteDevice,
    getDeviceAgentInfo,
    fetchDeviceEvents,
  } = useDevices();
  const { recordingService } = useRecordings();
  const { selectSource } = usePlayerSelection();
  const currentOrganizationId = useCurrentOrganizationId();

  const initialTab = (searchParams.get("tab") as TabValue) || "properties";
  const [activeTab, setActiveTab] = useState<TabValue>(initialTab);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // Device state
  const [device, setDevice] = useState<Device | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  // Agent info state
  const [agentInfo, setAgentInfo] = useState<DeviceAgentInfo | undefined>(undefined);
  const [agentLoading, setAgentLoading] = useState(false);

  // Recordings state
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [recordingsLoading, setRecordingsLoading] = useState(false);

  // Events state
  const [events, setEvents] = useState<DeviceEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  // Fetch device details (only if authenticated)
  useEffect(() => {
    if (!deviceId || !isAuthenticated) {
      if (!isAuthenticated) {
        setLoading(false);
      }
      return;
    }

    const loadDevice = async () => {
      setLoading(true);
      setError(undefined);
      try {
        const data = await fetchDevice(deviceId);
        setDevice(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load device";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void loadDevice();
  }, [deviceId, fetchDevice, isAuthenticated]);

  // Fetch recordings when recordings tab is selected
  useEffect(() => {
    if (activeTab !== "recordings" || !deviceId || !isAuthenticated) {
      return;
    }

    const loadRecordings = async () => {
      setRecordingsLoading(true);
      try {
        const result = await recordingService.getRecordings({ deviceId });
        setRecordings(result.recordings);
      } catch (err) {
        console.error("Failed to fetch recordings:", err);
      } finally {
        setRecordingsLoading(false);
      }
    };

    void loadRecordings();
  }, [activeTab, deviceId, recordingService, isAuthenticated]);

  // Fetch events when events tab is selected
  useEffect(() => {
    if (activeTab !== "events" || !deviceId || !isAuthenticated) {
      return;
    }

    const loadEvents = async () => {
      setEventsLoading(true);
      try {
        const result = await fetchDeviceEvents(deviceId);
        setEvents(result.data);
      } catch (err) {
        console.error("Failed to fetch events:", err);
      } finally {
        setEventsLoading(false);
      }
    };

    void loadEvents();
  }, [activeTab, deviceId, fetchDeviceEvents, isAuthenticated]);

  // Fetch agent info when agent tab is selected
  useEffect(() => {
    if (activeTab !== "agent" || !deviceId || !device || !isAuthenticated) {
      return;
    }

    const loadAgentInfo = async () => {
      setAgentLoading(true);
      try {
        const data = await getDeviceAgentInfo(deviceId);
        setAgentInfo(data);
      } catch (err) {
        console.error("Failed to fetch agent info:", err);
      } finally {
        setAgentLoading(false);
      }
    };

    void loadAgentInfo();
  }, [activeTab, deviceId, getDeviceAgentInfo, device, isAuthenticated]);

  // Update tab when URL search params change
  useEffect(() => {
    const tabParam = searchParams.get("tab") as TabValue;
    if (tabParam && ["recordings", "events", "properties", "agent"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleBack = useCallback(() => {
    void navigate("/devices");
  }, [navigate]);

  const handleTabChange = useCallback((_event: React.SyntheticEvent, newValue: TabValue) => {
    setActiveTab(newValue);
  }, []);

  const handleMenuOpen = useCallback((event: MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuAnchor(undefined);
  }, []);

  const handleUploadData = useCallback(() => {
    setUploadDialogOpen(true);
  }, []);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<
    | {
        currentFileIndex: number;
        totalFiles: number;
        currentFileProgress: number;
        overallProgress: number;
        currentFileName: string;
      }
    | undefined
  >(undefined);
  const [uploadError, setUploadError] = useState<string | undefined>(undefined);

  const handleUploadConfirm = useCallback(
    async (files: File[], uploadDeviceId: string) => {
      try {
        setUploading(true);
        setUploadError(undefined);

        const totalFiles = files.length;
        const newRecordings: typeof recordings = [];

        for (let i = 0; i < files.length; i++) {
          const file = files[i]!;

          setUploadProgress({
            currentFileIndex: i,
            totalFiles,
            currentFileProgress: 0,
            overallProgress: Math.round((i / totalFiles) * 100),
            currentFileName: file.name,
          });

          const newRecording = await recordingService.uploadRecording(
            file,
            {
              deviceId: uploadDeviceId,
              orgId: currentOrganizationId,
            },
            (progress) => {
              const fileProgress = progress.percentage;
              const overallProgress = Math.round(((i + fileProgress / 100) / totalFiles) * 100);
              setUploadProgress({
                currentFileIndex: i,
                totalFiles,
                currentFileProgress: fileProgress,
                overallProgress,
                currentFileName: file.name,
              });
            },
          );
          newRecordings.push(newRecording);
        }

        // Add all new recordings to the list if we're on the recordings tab
        if (activeTab === "recordings" && newRecordings.length > 0) {
          setRecordings((prev) => [...newRecordings.reverse(), ...prev]);
        }
        setUploadDialogOpen(false);
      } catch (err) {
        console.error("Failed to upload recording:", err);
        const message = err instanceof Error ? err.message : "Failed to upload recording";
        setUploadError(message);
      } finally {
        setUploading(false);
        setUploadProgress(undefined);
      }
    },
    [recordingService, activeTab, currentOrganizationId],
  );

  const handleUploadCancel = useCallback(() => {
    setUploadDialogOpen(false);
  }, []);

  const handleAddEvent = useCallback(() => {
    void navigate("/events");
  }, [navigate]);

  const handleDisableDevice = useCallback(() => {
    setDisableDialogOpen(true);
    setMenuAnchor(undefined);
  }, []);

  const handleDisableConfirm = useCallback(async () => {
    if (!deviceId || !device) {
      return;
    }

    try {
      if (device.enabled) {
        const updated = await disableDevice(deviceId);
        setDevice(updated);
      } else {
        const updated = await enableDevice(deviceId);
        setDevice(updated);
      }
    } catch (err) {
      console.error("Failed to toggle device enabled state:", err);
    } finally {
      setDisableDialogOpen(false);
    }
  }, [deviceId, disableDevice, enableDevice, device]);

  const handleDisableCancel = useCallback(() => {
    setDisableDialogOpen(false);
  }, []);

  const handleRenameDevice = useCallback(() => {
    setRenameDialogOpen(true);
    setMenuAnchor(undefined);
  }, []);

  const handleRenameConfirm = useCallback(
    async (newName: string) => {
      if (!deviceId) {
        return;
      }

      try {
        const updated = await updateDevice(deviceId, { name: newName });
        setDevice(updated);
      } catch (err) {
        console.error("Failed to rename device:", err);
      } finally {
        setRenameDialogOpen(false);
      }
    },
    [deviceId, updateDevice],
  );

  const handleRenameCancel = useCallback(() => {
    setRenameDialogOpen(false);
  }, []);

  const handleDeleteDevice = useCallback(() => {
    setDeleteDialogOpen(true);
    setMenuAnchor(undefined);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deviceId) {
      return;
    }

    try {
      await deleteDevice(deviceId);
      void navigate("/devices");
    } catch (err) {
      console.error("Failed to delete device:", err);
    } finally {
      setDeleteDialogOpen(false);
    }
  }, [deviceId, deleteDevice, navigate]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
  }, []);

  const handlePlayRecording = useCallback(
    async (recording: Recording) => {
      try {
        const downloadUrl = await recordingService.getDownloadUrl(recording.id);
        selectSource("remote-file", {
          type: "connection",
          params: { url: downloadUrl },
        });
        void navigate("/view");
      } catch (err) {
        console.error("Failed to open recording:", err);
      }
    },
    [navigate, recordingService, selectSource],
  );

  const handleDownloadRecording = useCallback(async (recording: Recording) => {
    try {
      const blob = await recordingService.downloadRecording(recording.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = recording.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download recording:", err);
    }
  }, [recordingService]);

  const handleRefreshAgentInfo = useCallback(async () => {
    if (!deviceId) {
      return;
    }

    setAgentLoading(true);
    try {
      const data = await getDeviceAgentInfo(deviceId);
      setAgentInfo(data);
    } catch (err) {
      console.error("Failed to refresh agent info:", err);
    } finally {
      setAgentLoading(false);
    }
  }, [deviceId, getDeviceAgentInfo]);

  const renderRecordingsTab = () => {
    if (recordingsLoading) {
      return (
        <div className={classes.loadingContainer}>
          <CircularProgress />
        </div>
      );
    }

    return (
      <Stack gap={2}>
        <Stack direction="row" justifyContent="flex-end">
          <Button variant="contained" startIcon={<CloudUploadOutlined />} onClick={handleUploadData}>
            {t("uploadData")}
          </Button>
        </Stack>
        {recordings.length === 0 ? (
          <div className={classes.emptyState}>
            <InsertDriveFileOutlined className={classes.emptyIcon} />
            <Typography variant="h6" color="text.secondary">
              {t("noRecordings")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("noDeviceRecordingsDescription")}
            </Typography>
          </div>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t("fileName")}</TableCell>
                  <TableCell>{t("status")}</TableCell>
                  <TableCell>{t("size")}</TableCell>
                  <TableCell>{t("duration")}</TableCell>
                  <TableCell>{t("startTime")}</TableCell>
                  <TableCell>{t("endTime")}</TableCell>
                  <TableCell>{t("topics")}</TableCell>
                  <TableCell>{t("createdAt")}</TableCell>
                  <TableCell align="right">{t("actions")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recordings.map((recording) => (
                  <TableRow key={recording.id} hover>
                    <TableCell>
                      <Stack direction="row" alignItems="center" gap={1}>
                        <InsertDriveFileOutlined fontSize="small" color="action" />
                        <Typography variant="body2">{recording.name}</Typography>
                        <Chip
                          label={recording.format}
                          size="small"
                          color={recording.format === "mcap" ? "primary" : "default"}
                        />
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={t(recording.status)}
                        size="small"
                        color={recording.status === "ready" ? "success" : recording.status === "error" ? "error" : "default"}
                      />
                    </TableCell>
                    <TableCell>{formatFileSize(recording.size)}</TableCell>
                    <TableCell>{recording.duration ? formatDuration(Math.round(recording.duration)) : "-"}</TableCell>
                    <TableCell>{recording.startTime ? formatDate(new Date(recording.startTime)) : "-"}</TableCell>
                    <TableCell>{recording.endTime ? formatDate(new Date(recording.endTime)) : "-"}</TableCell>
                    <TableCell>{recording.topicCount ?? "-"}</TableCell>
                    <TableCell>{formatDate(new Date(recording.createdAt))}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" gap={0.5} justifyContent="flex-end">
                        <Tooltip title={t("play")}>
                          <span>
                            <IconButton
                              size="small"
                              color="primary"
                              disabled={recording.status !== "ready"}
                              onClick={() => {
                                void handlePlayRecording(recording);
                              }}
                            >
                              <PlayArrowOutlined fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title={t("download")}>
                          <span>
                            <IconButton
                              size="small"
                              disabled={recording.status !== "ready"}
                              onClick={() => {
                                void handleDownloadRecording(recording);
                              }}
                            >
                              <DownloadOutlined fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Stack>
    );
  };

  const renderEventsTab = () => {
    if (eventsLoading) {
      return (
        <div className={classes.loadingContainer}>
          <CircularProgress />
        </div>
      );
    }

    return (
      <Stack gap={2}>
        <Stack direction="row" justifyContent="flex-end">
          <Button variant="contained" startIcon={<AddOutlined />} onClick={handleAddEvent}>
            {t("addEvent")}
          </Button>
        </Stack>
        {events.length === 0 ? (
          <div className={classes.emptyState}>
            <BookmarksOutlined className={classes.emptyIcon} />
            <Typography variant="h6" color="text.secondary">
              {t("noEvents")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("noDeviceEventsDescription")}
            </Typography>
          </div>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t("eventType")}</TableCell>
                  <TableCell>{t("description")}</TableCell>
                  <TableCell>{t("startTime")}</TableCell>
                  <TableCell>{t("duration")}</TableCell>
                  <TableCell>{t("createdBy")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id} hover>
                    <TableCell>
                      <Chip
                        icon={<EventTypeIcon eventType={event.eventType} />}
                        label={t(event.eventType)}
                        size="small"
                        color={getEventTypeChipColor(event.eventType)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{event.description}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatTimestamp(event.startTime)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {event.duration < 60 ? `${event.duration}m` : `${Math.floor(event.duration / 60)}h ${event.duration % 60}m`}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {event.createdBy}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Stack>
    );
  };

  const renderPropertiesTab = () => {
    if (!device) {
      return undefined;
    }

    return (
      <Paper className={classes.propertyPaper}>
        <Stack gap={0}>
          <div className={classes.propertyRow}>
            <Typography className={classes.propertyLabel}>{t("deviceId")}</Typography>
            <Typography fontFamily="monospace">{device.id}</Typography>
          </div>
          <div className={classes.propertyRow}>
            <Typography className={classes.propertyLabel}>{t("deviceName")}</Typography>
            <Typography>{device.name}</Typography>
          </div>
          <div className={classes.propertyRow}>
            <Typography className={classes.propertyLabel}>{t("deviceType")}</Typography>
            <Typography>{device.type}</Typography>
          </div>
          <div className={classes.propertyRow}>
            <Typography className={classes.propertyLabel}>{t("ipAddress")}</Typography>
            <Typography>{device.ipAddress ?? "-"}</Typography>
          </div>
          <div className={classes.propertyRow}>
            <Typography className={classes.propertyLabel}>{t("model")}</Typography>
            <Typography>{device.model ?? "-"}</Typography>
          </div>
          <div className={classes.propertyRow}>
            <Typography className={classes.propertyLabel}>{t("serialNumber")}</Typography>
            <Typography>{device.serialNumber ?? "-"}</Typography>
          </div>
          <div className={classes.propertyRow}>
            <Typography className={classes.propertyLabel}>{t("firmwareVersion")}</Typography>
            <Typography>{device.firmwareVersion ?? "-"}</Typography>
          </div>
          <div className={classes.propertyRow}>
            <Typography className={classes.propertyLabel}>{t("location")}</Typography>
            <Typography>{device.location ?? "-"}</Typography>
          </div>
          <div className={classes.propertyRow}>
            <Typography className={classes.propertyLabel}>{t("enabled")}</Typography>
            <Chip
              label={device.enabled ? t("yes") : t("no")}
              size="small"
              color={device.enabled ? "success" : "default"}
            />
          </div>
          <div className={classes.propertyRow}>
            <Typography className={classes.propertyLabel}>{t("lastSeen")}</Typography>
            <Typography>{formatTimestamp(device.lastSeen)}</Typography>
          </div>
          <div className={classes.propertyRow}>
            <Typography className={classes.propertyLabel}>{t("createdAt")}</Typography>
            <Typography>{formatTimestamp(device.createdAt)}</Typography>
          </div>
        </Stack>
      </Paper>
    );
  };

  const renderAgentTab = () => {
    if (agentLoading) {
      return (
        <div className={classes.loadingContainer}>
          <CircularProgress />
        </div>
      );
    }

    // Use device data if agentInfo is not available
    const agentVersion = agentInfo?.agentInfo.version ?? device?.agentVersion;
    const agentStatus = agentInfo?.agentInfo.status ?? device?.agentStatus;
    const uptime = agentInfo?.agentInfo.uptime ?? device?.agentUptime;
    const lastHeartbeat = agentInfo?.agentInfo.lastHeartbeat ?? device?.lastSeen;
    const cpuUsage = agentInfo?.systemInfo.cpuUsage ?? device?.cpuUsage;
    const memoryUsage = agentInfo?.systemInfo.memoryUsage ?? device?.memoryUsage;
    const diskUsage = agentInfo?.systemInfo.diskUsage ?? device?.diskUsage;
    const rosDistro = agentInfo?.systemInfo.rosDistro ?? device?.rosDistro;
    const rosNodeCount = agentInfo?.systemInfo.rosNodeCount ?? device?.rosNodeCount;
    const rosTopicCount = agentInfo?.systemInfo.rosTopicCount ?? device?.rosTopicCount;

    return (
      <Stack gap={3}>
        <Paper className={classes.agentCard}>
          <Stack gap={2}>
            <div className={classes.agentStatusRow}>
              <Stack direction="row" alignItems="center" gap={2}>
                <SmartToyOutlined color="primary" />
                <Typography variant="h6">{t("floraAgent")}</Typography>
              </Stack>
              <Stack direction="row" alignItems="center" gap={1}>
                <Chip
                  label={agentStatus ? t(agentStatus) : t("unknown")}
                  size="small"
                  color={getAgentStatusColor(agentStatus)}
                  className={classes.statusChip}
                />
                <Tooltip title={t("refresh")}>
                  <IconButton size="small" onClick={handleRefreshAgentInfo}>
                    <RefreshOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </div>

            <Stack gap={0}>
              <div className={classes.propertyRow}>
                <Typography className={classes.propertyLabel}>{t("agentVersion")}</Typography>
                <Typography>{agentVersion ? `v${agentVersion}` : "-"}</Typography>
              </div>
              <div className={classes.propertyRow}>
                <Typography className={classes.propertyLabel}>{t("uptime")}</Typography>
                <Typography>{formatUptime(uptime)}</Typography>
              </div>
              <div className={classes.propertyRow}>
                <Typography className={classes.propertyLabel}>{t("lastHeartbeat")}</Typography>
                <Typography>{formatTimestamp(lastHeartbeat)}</Typography>
              </div>
            </Stack>
          </Stack>
        </Paper>

        {/* System Resources */}
        <Paper className={classes.agentCard}>
          <Typography variant="h6" gutterBottom>
            {t("systemResources")}
          </Typography>
          <div className={classes.systemInfoGrid}>
            <Paper variant="outlined" className={classes.systemInfoCard}>
              <MemoryOutlined color="primary" />
              <Typography variant="body2" color="text.secondary">
                {t("cpuUsage")}
              </Typography>
              <Typography variant="h5">{cpuUsage != undefined ? `${cpuUsage.toFixed(1)}%` : "-"}</Typography>
              {cpuUsage != undefined && (
                <LinearProgress
                  variant="determinate"
                  value={cpuUsage}
                  className={classes.progressBar}
                  color={cpuUsage > 80 ? "error" : cpuUsage > 60 ? "warning" : "primary"}
                />
              )}
            </Paper>

            <Paper variant="outlined" className={classes.systemInfoCard}>
              <MemoryOutlined color="primary" />
              <Typography variant="body2" color="text.secondary">
                {t("memoryUsage")}
              </Typography>
              <Typography variant="h5">
                {memoryUsage != undefined ? `${memoryUsage.toFixed(1)}%` : "-"}
              </Typography>
              {memoryUsage != undefined && (
                <LinearProgress
                  variant="determinate"
                  value={memoryUsage}
                  className={classes.progressBar}
                  color={memoryUsage > 80 ? "error" : memoryUsage > 60 ? "warning" : "primary"}
                />
              )}
            </Paper>

            <Paper variant="outlined" className={classes.systemInfoCard}>
              <StorageOutlined color="primary" />
              <Typography variant="body2" color="text.secondary">
                {t("diskUsage")}
              </Typography>
              <Typography variant="h5">
                {diskUsage != undefined ? `${diskUsage.toFixed(1)}%` : "-"}
              </Typography>
              {diskUsage != undefined && (
                <LinearProgress
                  variant="determinate"
                  value={diskUsage}
                  className={classes.progressBar}
                  color={diskUsage > 80 ? "error" : diskUsage > 60 ? "warning" : "primary"}
                />
              )}
            </Paper>
          </div>
        </Paper>

        {/* ROS Info */}
        {(rosDistro ?? rosNodeCount ?? rosTopicCount) && (
          <Paper className={classes.agentCard}>
            <Typography variant="h6" gutterBottom>
              ROS
            </Typography>
            <Stack gap={0}>
              <div className={classes.propertyRow}>
                <Typography className={classes.propertyLabel}>{t("rosDistro")}</Typography>
                <Typography>{rosDistro ?? "-"}</Typography>
              </div>
              <div className={classes.propertyRow}>
                <Typography className={classes.propertyLabel}>{t("rosNodes")}</Typography>
                <Typography>{rosNodeCount ?? "-"}</Typography>
              </div>
              <div className={classes.propertyRow}>
                <Typography className={classes.propertyLabel}>{t("rosTopics")}</Typography>
                <Typography>{rosTopicCount ?? "-"}</Typography>
              </div>
            </Stack>
          </Paper>
        )}
      </Stack>
    );
  };

  // Show login required placeholder if not authenticated
  if (!authLoading && !isAuthenticated) {
    return (
      <Stack className={classes.root}>
        <LoginRequiredPlaceholder />
      </Stack>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className={classes.loadingContainer}>
        <CircularProgress />
      </div>
    );
  }

  // Error state
  if (error || !device) {
    return (
      <div className={classes.errorContainer}>
        <ErrorOutlined color="error" style={{ fontSize: 64 }} />
        <Typography variant="h6" color="error">
          {error ?? t("deviceNotFound")}
        </Typography>
        <Button variant="contained" onClick={handleBack}>
          {t("backToDevices")}
        </Button>
      </div>
    );
  }

  return (
    <Stack className={classes.root}>
      <div className={classes.header}>
        <Stack direction="row" alignItems="center">
          <IconButton className={classes.backButton} onClick={handleBack}>
            <ArrowBackOutlined />
          </IconButton>
          <StatusIcon status={device.status} />
          <Stack gap={0.25} style={{ marginLeft: 16, flex: 1 }}>
            <Typography variant="h5">{device.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {device.type} {device.ipAddress && `• ${device.ipAddress}`}
            </Typography>
          </Stack>
          <Chip
            label={t(device.status)}
            color={getStatusChipColor(device.status)}
            size="small"
            className={classes.statusChip}
          />
          {!device.enabled && (
            <Chip label={t("disabled")} color="warning" size="small" className={classes.statusChip} />
          )}
          <IconButton onClick={handleMenuOpen} className={classes.moreButton}>
            <MoreVertOutlined />
          </IconButton>
        </Stack>
      </div>

      {/* More Actions Menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
        <MenuItem onClick={handleDisableDevice}>
          <Stack direction="row" alignItems="center" gap={1}>
            {device.enabled ? (
              <>
                <BlockOutlined fontSize="small" />
                {t("disable")}
              </>
            ) : (
              <>
                <CheckCircleOutlined fontSize="small" />
                {t("enable")}
              </>
            )}
          </Stack>
        </MenuItem>
        <MenuItem onClick={handleRenameDevice}>
          <Stack direction="row" alignItems="center" gap={1}>
            <EditOutlined fontSize="small" />
            {t("rename")}
          </Stack>
        </MenuItem>
        <MenuItem onClick={handleDeleteDevice}>
          <Stack direction="row" alignItems="center" gap={1} style={{ color: "error.main" }}>
            <DeleteOutlined fontSize="small" color="error" />
            {t("delete")}
          </Stack>
        </MenuItem>
      </Menu>

      <div className={classes.content}>
        <div className={classes.tabsContainer}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab
              icon={<SettingsOutlined />}
              iconPosition="start"
              label={t("properties")}
              value="properties"
            />
            <Tab
              icon={<SmartToyOutlined />}
              iconPosition="start"
              label={t("agent")}
              value="agent"
            />
            <Tab
              icon={<InsertDriveFileOutlined />}
              iconPosition="start"
              label={t("recordings")}
              value="recordings"
            />
            <Tab
              icon={<BookmarksOutlined />}
              iconPosition="start"
              label={t("events")}
              value="events"
            />
          </Tabs>
        </div>

        <div className={classes.tabContent}>
          {activeTab === "properties" && renderPropertiesTab()}
          {activeTab === "agent" && renderAgentTab()}
          {activeTab === "recordings" && renderRecordingsTab()}
          {activeTab === "events" && renderEventsTab()}
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        title={t("deleteDevice")}
        message={t("deleteDeviceConfirm", { name: device.name })}
        confirmLabel={t("delete")}
        variant="error"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      <ConfirmDialog
        open={disableDialogOpen}
        title={device.enabled ? t("disableDevice") : t("enableDevice")}
        message={
          device.enabled
            ? t("disableDeviceConfirm", { name: device.name })
            : t("enableDeviceConfirm", { name: device.name })
        }
        confirmLabel={device.enabled ? t("disable") : t("enable")}
        variant="warning"
        onConfirm={handleDisableConfirm}
        onCancel={handleDisableCancel}
      />

      <RenameDialog
        open={renameDialogOpen}
        title={t("renameDevice")}
        label={t("deviceName")}
        initialValue={device.name}
        onConfirm={handleRenameConfirm}
        onCancel={handleRenameCancel}
      />

      <UploadDataDialog
        open={uploadDialogOpen}
        devices={[{ id: device.id, name: device.name }]}
        selectedDeviceId={device.id}
        uploading={uploading}
        uploadProgress={uploadProgress}
        error={uploadError}
        onConfirm={handleUploadConfirm}
        onCancel={handleUploadCancel}
      />
    </Stack>
  );
}
