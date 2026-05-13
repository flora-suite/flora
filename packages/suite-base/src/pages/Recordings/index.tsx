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
  CircularProgress,
  IconButton,
  InputAdornment,
  LinearProgress,
  Link,
  Paper,
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
import { useCallback, useEffect, useMemo, useRef, useState, ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { makeStyles } from "tss-react/mui";

import { LoginRequiredPlaceholder } from "@lichtblick/suite-base/components/LoginRequiredPlaceholder";
import Stack from "@lichtblick/suite-base/components/Stack";
import { ConfirmDialog } from "@lichtblick/suite-base/components/dialogs";
import { useAuth } from "@lichtblick/suite-base/context/AuthContext";
import { useCurrentOrganizationId } from "@lichtblick/suite-base/context/OrganizationContext";
import { usePlayerSelection } from "@lichtblick/suite-base/context/PlayerSelectionContext";
import { useRecordings } from "@lichtblick/suite-base/context/RecordingContext";
import type { Recording, UploadProgress } from "@lichtblick/suite-base/services/IRecordingService";

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
  statusChip: {
    fontSize: "0.75rem",
    height: 20,
  },
}));

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

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusChipColor(status: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" {
  switch (status) {
    case "ready":
      return "success";
    case "processing":
      return "info";
    case "uploading":
      return "warning";
    case "error":
      return "error";
    default:
      return "default";
  }
}

export function RecordingsPage(): React.JSX.Element {
  const { classes } = useStyles();
  const { t } = useTranslation("pages");
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const currentOrganizationId = useCurrentOrganizationId();
  const { recordingService } = useRecordings();
  const { selectSource } = usePlayerSelection();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordingToDelete, setRecordingToDelete] = useState<Recording | undefined>(undefined);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | undefined>(undefined);
  const [uploadError, setUploadError] = useState<string | undefined>(undefined);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Load recordings
  const loadRecordings = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(undefined);
      const result = await recordingService.getRecordings({ orgId: currentOrganizationId });
      setRecordings(result.recordings);
    } catch (err) {
      console.error("Failed to load recordings:", err);
      const message = err instanceof Error ? err.message : "Failed to load recordings";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [recordingService, isAuthenticated, currentOrganizationId]);

  // Load recordings on mount and when organization changes
  useEffect(() => {
    void loadRecordings();
  }, [loadRecordings, currentOrganizationId]);

  const filteredRecordings = useMemo(() => {
    if (!searchQuery.trim()) {
      return recordings;
    }
    const query = searchQuery.toLowerCase();
    return recordings.filter((recording) =>
      recording.name.toLowerCase().includes(query) ||
      recording.deviceName?.toLowerCase().includes(query)
    );
  }, [recordings, searchQuery]);

  // Paginated recordings
  const paginatedRecordings = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredRecordings.slice(start, start + rowsPerPage);
  }, [filteredRecordings, page, rowsPerPage]);

  const handleChangePage = useCallback((_event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    // Clear the input so the same file can be selected again
    event.target.value = "";

    try {
      setUploading(true);
      setUploadProgress(undefined);
      setUploadError(undefined);
      const newRecording = await recordingService.uploadRecording(
        file,
        {
          orgId: currentOrganizationId,
        },
        (progress) => {
          setUploadProgress(progress);
        },
      );
      setRecordings((prev) => [newRecording, ...prev]);
    } catch (err) {
      console.error("Failed to upload recording:", err);
      const message = err instanceof Error ? err.message : "Failed to upload recording";
      setUploadError(message);
    } finally {
      setUploading(false);
      setUploadProgress(undefined);
    }
  }, [recordingService, currentOrganizationId]);

  const handleViewRecording = useCallback(
    async (recording: Recording) => {
      try {
        // Get the download URL for the recording
        const downloadUrl = await recordingService.getDownloadUrl(recording.id);

        // Use selectSource to open the remote file
        selectSource("remote-file", {
          type: "connection",
          params: { url: downloadUrl },
        });

        // Navigate to the view page
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

  const handleDeleteClick = useCallback((recording: Recording) => {
    setRecordingToDelete(recording);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!recordingToDelete) {
      return;
    }

    try {
      const deleted = await recordingService.deleteRecording(recordingToDelete.id);
      if (deleted) {
        setRecordings((prev) => prev.filter((r) => r.id !== recordingToDelete.id));
      }
    } catch (err) {
      console.error("Failed to delete recording:", err);
    } finally {
      setDeleteDialogOpen(false);
      setRecordingToDelete(undefined);
    }
  }, [recordingToDelete, recordingService]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setRecordingToDelete(undefined);
  }, []);

  const isEmpty = recordings.length === 0;

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
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".mcap,.bag,.db3"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

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
            startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadOutlined />}
            onClick={handleUploadClick}
            disabled={uploading}
          >
            {uploading
              ? uploadProgress != undefined
                ? `${t("uploading")} ${uploadProgress.percentage}%`
                : t("uploading")
              : t("uploadRecording")}
          </Button>
        </Stack>
        {uploading && (
          <LinearProgress
            variant={uploadProgress != undefined ? "determinate" : "indeterminate"}
            value={uploadProgress?.percentage ?? 0}
            style={{ marginTop: 8 }}
          />
        )}
        {uploadError && (
          <Typography variant="body2" color="error" style={{ marginTop: 8 }}>
            {uploadError}
          </Typography>
        )}
      </div>

      <div className={classes.content}>
        {loading ? (
          <div className={classes.loadingContainer}>
            <CircularProgress />
          </div>
        ) : error ? (
          <div className={classes.errorContainer}>
            <Typography variant="h6" color="error">
              {t("errorLoadingData")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {error}
            </Typography>
            <Button variant="contained" onClick={() => { void loadRecordings(); }}>
              {t("retryLoading")}
            </Button>
          </div>
        ) : isEmpty ? (
          <div className={classes.emptyState}>
            <InsertDriveFileOutlined className={classes.emptyIcon} />
            <Typography variant="h6" color="text.secondary">
              {t("noRecordings")}
            </Typography>
            <Typography variant="body2" color="text.secondary" maxWidth={400}>
              {t("noRecordingsDescription")}
            </Typography>
            <Card className={classes.uploadCard} onClick={handleUploadClick}>
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

            <TableContainer component={Paper} className={classes.tableContainer}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t("fileName")}</TableCell>
                    <TableCell>{t("device")}</TableCell>
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
                  {paginatedRecordings.map((recording) => (
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
                        {recording.deviceId && recording.deviceName ? (
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
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={t(recording.status)}
                          size="small"
                          color={getStatusChipColor(recording.status)}
                          className={classes.statusChip}
                        />
                      </TableCell>
                      <TableCell>{formatFileSize(recording.size)}</TableCell>
                      <TableCell>{recording.duration ? formatDuration(recording.duration) : "-"}</TableCell>
                      <TableCell>{recording.startTime ? formatDate(recording.startTime) : "-"}</TableCell>
                      <TableCell>{recording.endTime ? formatDate(recording.endTime) : "-"}</TableCell>
                      <TableCell>{recording.topicCount ?? "-"}</TableCell>
                      <TableCell>{formatDate(recording.createdAt)}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" gap={0.5} justifyContent="flex-end">
                          <Tooltip title={t("play")}>
                            <span>
                              <IconButton
                                size="small"
                                color="primary"
                                disabled={recording.status !== "ready"}
                                onClick={() => {
                                  handleViewRecording(recording);
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
                                  handleDownloadRecording(recording);
                                }}
                              >
                                <DownloadOutlined fontSize="small" />
                              </IconButton>
                            </span>
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
              <TablePagination
                component="div"
                count={filteredRecordings.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
                labelRowsPerPage={t("rowsPerPage")}
              />
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
