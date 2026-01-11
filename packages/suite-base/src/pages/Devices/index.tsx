// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  AddOutlined,
  DeleteOutlined,
  DevicesOutlined,
  EditOutlined,
  LinkOutlined,
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
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  InputAdornment,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useMemo, useState, MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { makeStyles } from "tss-react/mui";

import Stack from "@lichtblick/suite-base/components/Stack";
import { ConfirmDialog, RenameDialog } from "@lichtblick/suite-base/components/dialogs";
import { useWorkspaceActions } from "@lichtblick/suite-base/context/Workspace/useWorkspaceActions";

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

type DeviceStatus = "online" | "offline" | "error";

interface Device {
  id: string;
  name: string;
  type: string;
  status: DeviceStatus;
  ipAddress: string;
  lastSeen: Date;
  topics?: number;
}

const mockDevices: Device[] = [
  {
    id: "1",
    name: "Robot-01",
    type: "ROS 2",
    status: "online",
    ipAddress: "192.168.1.101",
    lastSeen: new Date(),
    topics: 24,
  },
  {
    id: "2",
    name: "Sensor-Hub-A",
    type: "WebSocket",
    status: "online",
    ipAddress: "192.168.1.102",
    lastSeen: new Date(),
    topics: 8,
  },
  {
    id: "3",
    name: "Navigation-Unit",
    type: "ROS 1",
    status: "offline",
    ipAddress: "192.168.1.103",
    lastSeen: new Date(Date.now() - 3600000),
    topics: 12,
  },
  {
    id: "4",
    name: "Camera-System",
    type: "Velodyne",
    status: "error",
    ipAddress: "192.168.1.104",
    lastSeen: new Date(Date.now() - 1800000),
    topics: 4,
  },
];

function formatLastSeen(date: Date): string {
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
  const { dialogActions } = useWorkspaceActions();

  const [searchQuery, setSearchQuery] = useState("");
  const [devices, setDevices] = useState<Device[]>(mockDevices);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | undefined>(undefined);
  const [selectedDevice, setSelectedDevice] = useState<Device | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);

  const filteredDevices = useMemo(() => {
    if (!searchQuery.trim()) {
      return devices;
    }
    const query = searchQuery.toLowerCase();
    return devices.filter(
      (device) =>
        device.name.toLowerCase().includes(query) ||
        device.type.toLowerCase().includes(query) ||
        device.ipAddress.includes(query),
    );
  }, [devices, searchQuery]);

  const handleOpenConnection = useCallback(() => {
    dialogActions.dataSource.open("connection");
    void navigate("/view");
  }, [dialogActions.dataSource, navigate]);

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
    (newName: string) => {
      if (selectedDevice) {
        setDevices((prev) =>
          prev.map((d) => (d.id === selectedDevice.id ? { ...d, name: newName } : d)),
        );
      }
      setRenameDialogOpen(false);
      setSelectedDevice(undefined);
    },
    [selectedDevice],
  );

  const handleRenameCancel = useCallback(() => {
    setRenameDialogOpen(false);
    setSelectedDevice(undefined);
  }, []);

  const handleDeleteClick = useCallback(() => {
    setDeleteDialogOpen(true);
    setMenuAnchor(undefined);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (selectedDevice) {
      setDevices((prev) => prev.filter((d) => d.id !== selectedDevice.id));
    }
    setDeleteDialogOpen(false);
    setSelectedDevice(undefined);
  }, [selectedDevice]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setSelectedDevice(undefined);
  }, []);

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
            <Button variant="outlined" startIcon={<RefreshOutlined />}>
              {t("refresh")}
            </Button>
            <Button
              variant="contained"
              startIcon={<AddOutlined />}
              onClick={handleOpenConnection}
            >
              {t("addDevice")}
            </Button>
          </Stack>
        </Stack>
      </div>

      <div className={classes.content}>
        {isEmpty ? (
          <div className={classes.emptyState}>
            <DevicesOutlined className={classes.emptyIcon} />
            <Typography variant="h6" color="text.secondary">
              {t("noDevices")}
            </Typography>
            <Typography variant="body2" color="text.secondary" maxWidth={400}>
              {t("noDevicesDescription")}
            </Typography>
            <Button
              variant="contained"
              startIcon={<LinkOutlined />}
              onClick={handleOpenConnection}
            >
              {t("addDevice")}
            </Button>
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
              {filteredDevices.map((device) => (
                <Card
                  key={device.id}
                  className={cx(classes.deviceCard, {
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
                          <Typography variant="body2">{device.ipAddress}</Typography>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">
                            {t("topics")}
                          </Typography>
                          <Typography variant="body2">{device.topics ?? "-"}</Typography>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">
                            {t("lastSeen")}
                          </Typography>
                          <Typography variant="body2">{formatLastSeen(device.lastSeen)}</Typography>
                        </Stack>
                      </Stack>

                      <Chip
                        label={t(device.status)}
                        size="small"
                        color={getStatusChipColor(device.status)}
                        className={classes.statusChip}
                      />
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </div>
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
    </Stack>
  );
}
