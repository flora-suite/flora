// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  AddOutlined,
  ArrowBackOutlined,
  BlockOutlined,
  BookmarksOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  ErrorOutlined,
  InfoOutlined,
  InsertDriveFileOutlined,
  MoreVertOutlined,
  PlayArrowOutlined,
  SettingsOutlined,
  SignalWifi4BarOutlined,
  SignalWifiOffOutlined,
  SmartToyOutlined,
  WarningAmberOutlined,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  IconButton,
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
import { useCallback, useEffect, useMemo, useState, MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { makeStyles } from "tss-react/mui";

import Stack from "@lichtblick/suite-base/components/Stack";
import {
  ConfirmDialog,
  RenameDialog,
  UploadDataDialog,
} from "@lichtblick/suite-base/components/dialogs";

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
  agentStatus: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
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
}));

type DeviceStatus = "online" | "offline" | "error";
type TabValue = "recordings" | "events" | "properties" | "agent";

interface Device {
  id: string;
  name: string;
  type: string;
  status: DeviceStatus;
  ipAddress: string;
  lastSeen: Date;
  topics?: number;
  firmwareVersion?: string;
  serialNumber?: string;
  model?: string;
  location?: string;
}

interface Recording {
  id: string;
  name: string;
  format: "mcap" | "bag";
  size: number;
  duration: number;
  createdAt: Date;
  topicCount: number;
}

type EventSeverity = "info" | "warning" | "critical";

interface DeviceEvent {
  id: string;
  severity: EventSeverity;
  message: string;
  timestamp: Date;
  source: string;
}

interface AgentInfo {
  version: string;
  status: "running" | "stopped" | "error";
  uptime: number;
  lastHeartbeat: Date;
  cpuUsage: number;
  memoryUsage: number;
}

// Mock data
const mockDevice: Device = {
  id: "1",
  name: "Robot-01",
  type: "ROS 2",
  status: "online",
  ipAddress: "192.168.1.101",
  lastSeen: new Date(),
  topics: 24,
  firmwareVersion: "2.1.0",
  serialNumber: "SN-2024-001234",
  model: "Flora Bot Pro",
  location: "Building A, Floor 2",
};

const mockRecordings: Recording[] = [
  {
    id: "1",
    name: "sensor_data_2024.mcap",
    format: "mcap",
    size: 256 * 1024 * 1024,
    duration: 3600,
    createdAt: new Date("2024-12-01T10:30:00"),
    topicCount: 12,
  },
  {
    id: "2",
    name: "navigation_test.bag",
    format: "bag",
    size: 128 * 1024 * 1024,
    duration: 1800,
    createdAt: new Date("2024-11-28T14:15:00"),
    topicCount: 8,
  },
];

const mockEvents: DeviceEvent[] = [
  {
    id: "1",
    severity: "warning",
    message: "LiDAR sensor temperature above normal threshold (65°C)",
    timestamp: new Date(Date.now() - 300000),
    source: "lidar_driver",
  },
  {
    id: "2",
    severity: "info",
    message: "Navigation goal reached successfully",
    timestamp: new Date(Date.now() - 600000),
    source: "nav2_controller",
  },
  {
    id: "3",
    severity: "critical",
    message: "Emergency stop triggered by obstacle detection",
    timestamp: new Date(Date.now() - 900000),
    source: "safety_controller",
  },
];

const mockAgent: AgentInfo = {
  version: "1.2.3",
  status: "running",
  uptime: 86400 * 3,
  lastHeartbeat: new Date(),
  cpuUsage: 12.5,
  memoryUsage: 45.2,
};

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
  const secs = seconds % 60;

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

function formatTimestamp(date: Date): string {
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatUptime(seconds: number): string {
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

function SeverityIcon({ severity }: { severity: EventSeverity }): React.JSX.Element {
  switch (severity) {
    case "info":
      return <InfoOutlined color="info" fontSize="small" />;
    case "warning":
      return <WarningAmberOutlined color="warning" fontSize="small" />;
    case "critical":
      return <ErrorOutlined color="error" fontSize="small" />;
  }
}

export function DeviceDetailPage(): React.JSX.Element {
  const { classes } = useStyles();
  const { t } = useTranslation("pages");
  const navigate = useNavigate();
  const { deviceId } = useParams<{ deviceId: string }>();
  const [searchParams] = useSearchParams();

  const initialTab = (searchParams.get("tab") as TabValue) || "recordings";
  const [activeTab, setActiveTab] = useState<TabValue>(initialTab);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deviceName, setDeviceName] = useState(mockDevice.name);

  // Update tab when URL search params change
  useEffect(() => {
    const tabParam = searchParams.get("tab") as TabValue;
    if (tabParam && ["recordings", "events", "properties", "agent"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // In real implementation, fetch device by deviceId
  const device = useMemo(() => {
    // Mock: return the mock device regardless of ID
    return mockDevice;
  }, []);

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

  const handleUploadConfirm = useCallback(
    (_file: File, _uploadDeviceId: string) => {
      // In real implementation, upload the file to the device
      console.warn("Upload file to device:", _uploadDeviceId);
      setUploadDialogOpen(false);
    },
    [],
  );

  const handleUploadCancel = useCallback(() => {
    setUploadDialogOpen(false);
  }, []);

  const handleAddEvent = useCallback(() => {
    // Navigate to events page with device pre-selected, or open create event dialog
    void navigate("/events");
  }, [navigate]);

  const handleDisableDevice = useCallback(() => {
    setDisableDialogOpen(true);
    setMenuAnchor(undefined);
  }, []);

  const handleDisableConfirm = useCallback(() => {
    // In real implementation, disable the device
    console.warn("Disable device:", deviceId);
    setDisableDialogOpen(false);
  }, [deviceId]);

  const handleDisableCancel = useCallback(() => {
    setDisableDialogOpen(false);
  }, []);

  const handleRenameDevice = useCallback(() => {
    setRenameDialogOpen(true);
    setMenuAnchor(undefined);
  }, []);

  const handleRenameConfirm = useCallback((newName: string) => {
    setDeviceName(newName);
    setRenameDialogOpen(false);
  }, []);

  const handleRenameCancel = useCallback(() => {
    setRenameDialogOpen(false);
  }, []);

  const handleDeleteDevice = useCallback(() => {
    setDeleteDialogOpen(true);
    setMenuAnchor(undefined);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    // In real implementation, delete the device
    console.warn("Delete device:", deviceId);
    setDeleteDialogOpen(false);
    void navigate("/devices");
  }, [deviceId, navigate]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
  }, []);

  const handlePlayRecording = useCallback(
    (_recording: Recording) => {
      void navigate("/view");
    },
    [navigate],
  );

  const handleDownloadRecording = useCallback((_recording: Recording) => {
    // In real implementation, trigger download
    console.warn("Download recording:", _recording.name);
  }, []);

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

  const getSeverityChipColor = (severity: EventSeverity): "info" | "warning" | "error" => {
    switch (severity) {
      case "info":
        return "info";
      case "warning":
        return "warning";
      case "critical":
        return "error";
    }
  };

  const getAgentStatusColor = (status: AgentInfo["status"]): "success" | "default" | "error" => {
    switch (status) {
      case "running":
        return "success";
      case "stopped":
        return "default";
      case "error":
        return "error";
    }
  };

  const renderRecordingsTab = () => (
    <Stack gap={2}>
      <Stack direction="row" justifyContent="flex-end">
        <Button
          variant="contained"
          startIcon={<CloudUploadOutlined />}
          onClick={handleUploadData}
        >
          {t("uploadData")}
        </Button>
      </Stack>
      {mockRecordings.length === 0 ? (
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
                <TableCell>{t("size")}</TableCell>
                <TableCell>{t("duration")}</TableCell>
                <TableCell>{t("topics")}</TableCell>
                <TableCell>{t("createdAt")}</TableCell>
                <TableCell align="right">{t("actions")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockRecordings.map((recording) => (
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
                  <TableCell>{formatFileSize(recording.size)}</TableCell>
                  <TableCell>{formatDuration(recording.duration)}</TableCell>
                  <TableCell>{recording.topicCount}</TableCell>
                  <TableCell>{formatDate(recording.createdAt)}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" gap={0.5} justifyContent="flex-end">
                      <Tooltip title={t("play")}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => {
                            handlePlayRecording(recording);
                          }}
                        >
                          <PlayArrowOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t("download")}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            handleDownloadRecording(recording);
                          }}
                        >
                          <DownloadOutlined fontSize="small" />
                        </IconButton>
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

  const renderEventsTab = () => (
    <Stack gap={2}>
      <Stack direction="row" justifyContent="flex-end">
        <Button
          variant="contained"
          startIcon={<AddOutlined />}
          onClick={handleAddEvent}
        >
          {t("addEvent")}
        </Button>
      </Stack>
      {mockEvents.length === 0 ? (
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
                <TableCell>{t("severity")}</TableCell>
                <TableCell>{t("message")}</TableCell>
                <TableCell>{t("source")}</TableCell>
                <TableCell>{t("timestamp")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockEvents.map((event) => (
                <TableRow key={event.id} hover>
                  <TableCell>
                    <Chip
                      icon={<SeverityIcon severity={event.severity} />}
                      label={t(event.severity as "info" | "warning" | "error")}
                      size="small"
                      color={getSeverityChipColor(event.severity)}
                      className={classes.severityChip}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{event.message}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {event.source}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{formatTimestamp(event.timestamp)}</Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  );

  const renderPropertiesTab = () => (
    <Paper sx={{ padding: 3 }}>
      <Stack gap={0}>
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
          <Typography>{device.ipAddress}</Typography>
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
          <Typography className={classes.propertyLabel}>{t("topics")}</Typography>
          <Typography>{device.topics ?? "-"}</Typography>
        </div>
        <div className={classes.propertyRow}>
          <Typography className={classes.propertyLabel}>{t("lastSeen")}</Typography>
          <Typography>{formatTimestamp(device.lastSeen)}</Typography>
        </div>
      </Stack>
    </Paper>
  );

  const renderAgentTab = () => (
    <Stack gap={3}>
      <Paper className={classes.agentCard}>
        <Stack gap={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" alignItems="center" gap={2}>
              <SmartToyOutlined color="primary" />
              <Typography variant="h6">{t("floraAgent")}</Typography>
            </Stack>
            <Chip
              label={t(mockAgent.status)}
              size="small"
              color={getAgentStatusColor(mockAgent.status)}
              className={classes.statusChip}
            />
          </Stack>

          <Box>
            <div className={classes.propertyRow}>
              <Typography className={classes.propertyLabel}>{t("agentVersion")}</Typography>
              <Typography>v{mockAgent.version}</Typography>
            </div>
            <div className={classes.propertyRow}>
              <Typography className={classes.propertyLabel}>{t("uptime")}</Typography>
              <Typography>{formatUptime(mockAgent.uptime)}</Typography>
            </div>
            <div className={classes.propertyRow}>
              <Typography className={classes.propertyLabel}>{t("lastHeartbeat")}</Typography>
              <Typography>{formatTimestamp(mockAgent.lastHeartbeat)}</Typography>
            </div>
            <div className={classes.propertyRow}>
              <Typography className={classes.propertyLabel}>{t("cpuUsage")}</Typography>
              <Typography>{mockAgent.cpuUsage.toFixed(1)}%</Typography>
            </div>
            <div className={classes.propertyRow}>
              <Typography className={classes.propertyLabel}>{t("memoryUsage")}</Typography>
              <Typography>{mockAgent.memoryUsage.toFixed(1)}%</Typography>
            </div>
          </Box>

          <Stack direction="row" gap={1}>
            <Button variant="outlined" size="small" disabled={mockAgent.status !== "running"}>
              {t("restartAgent")}
            </Button>
            <Button variant="outlined" size="small">
              {t("viewLogs")}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );

  return (
    <Stack className={classes.root}>
      <div className={classes.header}>
        <Stack direction="row" alignItems="center">
          <IconButton className={classes.backButton} onClick={handleBack}>
            <ArrowBackOutlined />
          </IconButton>
          <StatusIcon status={device.status} />
          <Stack gap={0.25} style={{ marginLeft: 16 }}>
            <Typography variant="h5">{deviceName}</Typography>
            <Typography variant="body2" color="text.secondary">
              {device.type} • {device.ipAddress}
            </Typography>
          </Stack>
          <Chip
            label={t(device.status)}
            color={getStatusChipColor(device.status)}
            size="small"
            className={classes.statusChip}
            sx={{ ml: 2 }}
          />
          <IconButton onClick={handleMenuOpen} sx={{ ml: 1 }}>
            <MoreVertOutlined />
          </IconButton>
        </Stack>
      </div>

      {/* More Actions Menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
        <MenuItem onClick={handleDisableDevice}>
          <Stack direction="row" alignItems="center" gap={1}>
            <BlockOutlined fontSize="small" />
            {t("disable")}
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
          </Tabs>
        </div>

        <div className={classes.tabContent}>
          {activeTab === "recordings" && renderRecordingsTab()}
          {activeTab === "events" && renderEventsTab()}
          {activeTab === "properties" && renderPropertiesTab()}
          {activeTab === "agent" && renderAgentTab()}
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        title={t("deleteDevice")}
        message={t("deleteDeviceConfirm", { name: deviceName })}
        confirmLabel={t("delete")}
        variant="error"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      <ConfirmDialog
        open={disableDialogOpen}
        title={t("disableDevice")}
        message={t("disableDeviceConfirm", { name: deviceName })}
        confirmLabel={t("disable")}
        variant="warning"
        onConfirm={handleDisableConfirm}
        onCancel={handleDisableCancel}
      />

      <RenameDialog
        open={renameDialogOpen}
        title={t("renameDevice")}
        label={t("deviceName")}
        initialValue={deviceName}
        onConfirm={handleRenameConfirm}
        onCancel={handleRenameCancel}
      />

      <UploadDataDialog
        open={uploadDialogOpen}
        devices={[{ id: device.id, name: deviceName }]}
        selectedDeviceId={device.id}
        onConfirm={handleUploadConfirm}
        onCancel={handleUploadCancel}
      />
    </Stack>
  );
}
