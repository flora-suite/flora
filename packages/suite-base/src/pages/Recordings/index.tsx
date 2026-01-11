// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  CloudUploadOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FolderOpenOutlined,
  InsertDriveFileOutlined,
  PlayArrowOutlined,
  SearchOutlined,
} from "@mui/icons-material";
import {
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { makeStyles } from "tss-react/mui";

import Stack from "@lichtblick/suite-base/components/Stack";
import { ConfirmDialog } from "@lichtblick/suite-base/components/dialogs";
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
  uploadCard: {
    border: `2px dashed ${theme.palette.divider}`,
    backgroundColor: theme.palette.action.hover,
    cursor: "pointer",
    transition: theme.transitions.create(["border-color", "background-color"]),
    "&:hover": {
      borderColor: theme.palette.primary.main,
      backgroundColor: theme.palette.action.selected,
    },
  },
  uploadContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing(4),
    gap: theme.spacing(1),
  },
  uploadIcon: {
    fontSize: 48,
    color: theme.palette.primary.main,
  },
  searchField: {
    maxWidth: 400,
  },
  tableContainer: {
    marginTop: theme.spacing(2),
  },
  formatChip: {
    textTransform: "uppercase",
    fontWeight: 600,
  },
}));

// Mock data for demonstration - will be replaced with API calls
interface Recording {
  id: string;
  name: string;
  format: "mcap" | "bag";
  size: number;
  duration: number;
  createdAt: Date;
  topicCount: number;
  deviceId: string;
  deviceName: string;
}

const mockRecordings: Recording[] = [
  {
    id: "1",
    name: "robot_sensor_data_2024.mcap",
    format: "mcap",
    size: 256 * 1024 * 1024,
    duration: 3600,
    createdAt: new Date("2024-12-01T10:30:00"),
    topicCount: 12,
    deviceId: "1",
    deviceName: "Robot-01",
  },
  {
    id: "2",
    name: "navigation_test.bag",
    format: "bag",
    size: 128 * 1024 * 1024,
    duration: 1800,
    createdAt: new Date("2024-11-28T14:15:00"),
    topicCount: 8,
    deviceId: "2",
    deviceName: "Sensor-Hub-A",
  },
  {
    id: "3",
    name: "lidar_mapping_session.mcap",
    format: "mcap",
    size: 512 * 1024 * 1024,
    duration: 7200,
    createdAt: new Date("2024-11-25T09:00:00"),
    topicCount: 5,
    deviceId: "3",
    deviceName: "Navigation-Unit",
  },
];

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

export function RecordingsPage(): React.JSX.Element {
  const { classes } = useStyles();
  const { t } = useTranslation("pages");
  const navigate = useNavigate();
  const { dialogActions } = useWorkspaceActions();

  const [searchQuery, setSearchQuery] = useState("");
  const [recordings, setRecordings] = useState<Recording[]>(mockRecordings);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordingToDelete, setRecordingToDelete] = useState<Recording | undefined>(undefined);

  const filteredRecordings = useMemo(() => {
    if (!searchQuery.trim()) {
      return recordings;
    }
    const query = searchQuery.toLowerCase();
    return recordings.filter((recording) => recording.name.toLowerCase().includes(query));
  }, [recordings, searchQuery]);

  const handleOpenFile = useCallback(() => {
    dialogActions.openFile
      .open()
      .then(() => {
        void navigate("/view");
      })
      .catch((err: unknown) => {
        console.error(err);
      });
  }, [dialogActions.openFile, navigate]);

  const handleViewRecording = useCallback(
    (_recording: Recording) => {
      // In a real implementation, this would load the specific recording
      void navigate("/view");
    },
    [navigate],
  );

  const handleDownloadRecording = useCallback((_recording: Recording) => {
    // In a real implementation, this would trigger a download
    console.warn("Download recording:", _recording.name);
  }, []);

  const handleDeleteClick = useCallback((recording: Recording) => {
    setRecordingToDelete(recording);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (recordingToDelete) {
      // In a real implementation, this would call an API
      setRecordings((prev) => prev.filter((r) => r.id !== recordingToDelete.id));
    }
    setDeleteDialogOpen(false);
    setRecordingToDelete(undefined);
  }, [recordingToDelete]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setRecordingToDelete(undefined);
  }, []);

  const isEmpty = recordings.length === 0;

  return (
    <Stack className={classes.root}>
      <div className={classes.header}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack gap={0.5}>
            <Typography variant="h5">{t("recordingsTitle")}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t("recordingsDescription")}
            </Typography>
          </Stack>
          <Button
            variant="contained"
            startIcon={<CloudUploadOutlined />}
            onClick={handleOpenFile}
          >
            {t("uploadRecording")}
          </Button>
        </Stack>
      </div>

      <div className={classes.content}>
        {isEmpty ? (
          <div className={classes.emptyState}>
            <InsertDriveFileOutlined className={classes.emptyIcon} />
            <Typography variant="h6" color="text.secondary">
              {t("noRecordings")}
            </Typography>
            <Typography variant="body2" color="text.secondary" maxWidth={400}>
              {t("noRecordingsDescription")}
            </Typography>
            <Card className={classes.uploadCard} onClick={handleOpenFile}>
              <CardContent className={classes.uploadContent}>
                <FolderOpenOutlined className={classes.uploadIcon} />
                <Typography variant="body1" color="text.primary">
                  {t("dragAndDrop")}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("supportedFormats")}
                </Typography>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Stack gap={2}>
            <TextField
              className={classes.searchField}
              size="small"
              placeholder={t("searchRecordings")}
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

            <TableContainer component={Paper} className={classes.tableContainer}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t("fileName")}</TableCell>
                    <TableCell>{t("device")}</TableCell>
                    <TableCell>{t("size")}</TableCell>
                    <TableCell>{t("duration")}</TableCell>
                    <TableCell>{t("topics")}</TableCell>
                    <TableCell>{t("createdAt")}</TableCell>
                    <TableCell align="right">{t("actions")}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRecordings.map((recording) => (
                    <TableRow key={recording.id} hover>
                      <TableCell>
                        <Stack direction="row" alignItems="center" gap={1}>
                          <InsertDriveFileOutlined fontSize="small" color="action" />
                          <Typography variant="body2">{recording.name}</Typography>
                          <Chip
                            label={recording.format}
                            size="small"
                            className={classes.formatChip}
                            color={recording.format === "mcap" ? "primary" : "default"}
                          />
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Link
                          component="button"
                          variant="body2"
                          onClick={() => {
                            void navigate(`/devices/${recording.deviceId}?tab=recordings`);
                          }}
                          sx={{ cursor: "pointer" }}
                        >
                          {recording.deviceName}
                        </Link>
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
                                handleViewRecording(recording);
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
                          <Tooltip title={t("delete")}>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                handleDeleteClick(recording);
                              }}
                            >
                              <DeleteOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        )}
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        title={t("deleteRecording")}
        message={t("deleteRecordingConfirm", { name: recordingToDelete?.name ?? "" })}
        confirmLabel={t("delete")}
        variant="error"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </Stack>
  );
}
