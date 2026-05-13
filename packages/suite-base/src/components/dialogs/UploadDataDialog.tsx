// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  CheckCircleOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  ErrorOutlined,
  InsertDriveFileOutlined,
} from "@mui/icons-material";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { makeStyles } from "tss-react/mui";

import Stack from "@lichtblick/suite-base/components/Stack";

const useStyles = makeStyles()((theme) => ({
  dropZone: {
    border: `2px dashed ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(4),
    textAlign: "center",
    cursor: "pointer",
    backgroundColor: theme.palette.action.hover,
    transition: theme.transitions.create(["border-color", "background-color"]),
    "&:hover": {
      borderColor: theme.palette.primary.main,
      backgroundColor: theme.palette.action.selected,
    },
  },
  dropZoneActive: {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.selected,
  },
  uploadIcon: {
    fontSize: 48,
    color: theme.palette.primary.main,
    marginBottom: theme.spacing(1),
  },
  fileList: {
    maxHeight: 200,
    overflowY: "auto",
    marginTop: theme.spacing(2),
  },
  fileItem: {
    padding: theme.spacing(1, 1.5),
    backgroundColor: theme.palette.action.hover,
    borderRadius: theme.shape.borderRadius,
    "&:not(:last-child)": {
      marginBottom: theme.spacing(1),
    },
  },
  fileItemUploading: {
    backgroundColor: theme.palette.primary.main + "10",
  },
  fileItemSuccess: {
    backgroundColor: theme.palette.success.main + "10",
  },
  fileItemError: {
    backgroundColor: theme.palette.error.main + "10",
  },
}));

interface Device {
  id: string;
  name: string;
}

export type FileUploadStatus = "pending" | "uploading" | "success" | "error";

export interface FileUploadItem {
  file: File;
  status: FileUploadStatus;
  progress: number;
  error?: string;
}

export interface UploadProgressInfo {
  currentFileIndex: number;
  totalFiles: number;
  currentFileProgress: number;
  overallProgress: number;
  currentFileName: string;
}

export type UploadDataDialogProps = {
  open: boolean;
  devices: Device[];
  selectedDeviceId?: string;
  uploading?: boolean;
  uploadProgress?: UploadProgressInfo;
  error?: string;
  onConfirm: (files: File[], deviceId: string) => void;
  onCancel: () => void;
};

export function UploadDataDialog({
  open,
  devices,
  selectedDeviceId,
  uploading = false,
  uploadProgress,
  error,
  onConfirm,
  onCancel,
}: UploadDataDialogProps): React.JSX.Element {
  const { classes, cx } = useStyles();
  const { t } = useTranslation("pages");

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [deviceId, setDeviceId] = useState(selectedDeviceId ?? "");
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFiles((prev) => {
        const newFiles = Array.from(files);
        // Filter out duplicates by name
        const existingNames = new Set(prev.map((f) => f.name));
        const uniqueNewFiles = newFiles.filter((f) => !existingNames.has(f.name));
        return [...prev, ...uniqueNewFiles];
      });
    }
    // Reset input value to allow selecting the same file again
    event.target.value = "";
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      setSelectedFiles((prev) => {
        const newFiles = Array.from(files).filter(
          (f) => f.name.endsWith(".mcap") || f.name.endsWith(".bag"),
        );
        const existingNames = new Set(prev.map((f) => f.name));
        const uniqueNewFiles = newFiles.filter((f) => !existingNames.has(f.name));
        return [...prev, ...uniqueNewFiles];
      });
    }
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleConfirm = useCallback(() => {
    if (selectedFiles.length > 0 && deviceId) {
      onConfirm(selectedFiles, deviceId);
    }
  }, [deviceId, onConfirm, selectedFiles]);

  const handleClose = useCallback(() => {
    if (!uploading) {
      setSelectedFiles([]);
      setDeviceId(selectedDeviceId ?? "");
      onCancel();
    }
  }, [onCancel, selectedDeviceId, uploading]);

  const formatFileSize = (bytes: number): string => {
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
  };

  const totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);

  const getFileStatus = (index: number): FileUploadStatus => {
    if (!uploading || !uploadProgress) {
      return "pending";
    }
    if (index < uploadProgress.currentFileIndex) {
      return "success";
    }
    if (index === uploadProgress.currentFileIndex) {
      return "uploading";
    }
    return "pending";
  };

  return (
    <Dialog open={open} onClose={uploading ? undefined : handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t("uploadData")}</DialogTitle>
      <DialogContent>
        <Stack gap={3}>
          <FormControl fullWidth size="small" disabled={uploading}>
            <InputLabel>{t("selectDevice")}</InputLabel>
            <Select
              value={deviceId}
              label={t("selectDevice")}
              onChange={(e) => {
                setDeviceId(e.target.value);
              }}
            >
              {devices.map((device) => (
                <MenuItem key={device.id} value={device.id}>
                  {device.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <input
            type="file"
            id="upload-file-input"
            accept=".mcap,.bag"
            multiple
            onChange={handleFileSelect}
            style={{ display: "none" }}
            disabled={uploading}
          />
          <label htmlFor="upload-file-input">
            <div
              className={cx(classes.dropZone, { [classes.dropZoneActive]: isDragging })}
              onDragOver={uploading ? undefined : handleDragOver}
              onDragLeave={uploading ? undefined : handleDragLeave}
              onDrop={uploading ? undefined : handleDrop}
              style={{ pointerEvents: uploading ? "none" : "auto", opacity: uploading ? 0.5 : 1 }}
            >
              <CloudUploadOutlined className={classes.uploadIcon} />
              <Typography variant="body1">{t("dragAndDropMultiple")}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t("supportedFormats")}
              </Typography>
            </div>
          </label>

          {selectedFiles.length > 0 && (
            <div className={classes.fileList}>
              {selectedFiles.map((file, index) => {
                const status = getFileStatus(index);
                return (
                  <div
                    key={`${file.name}-${index}`}
                    className={cx(classes.fileItem, {
                      [classes.fileItemUploading]: status === "uploading",
                      [classes.fileItemSuccess]: status === "success",
                      [classes.fileItemError]: status === "error",
                    })}
                  >
                    <Stack direction="row" alignItems="center" gap={1}>
                      {status === "success" ? (
                        <CheckCircleOutlined color="success" fontSize="small" />
                      ) : status === "error" ? (
                        <ErrorOutlined color="error" fontSize="small" />
                      ) : status === "uploading" ? (
                        <CircularProgress size={18} />
                      ) : (
                        <InsertDriveFileOutlined color="primary" fontSize="small" />
                      )}
                      <Stack flex={1} overflow="hidden">
                        <Typography variant="body2" fontWeight={500} noWrap>
                          {file.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatFileSize(file.size)}
                          {status === "uploading" &&
                            uploadProgress &&
                            ` - ${uploadProgress.currentFileProgress}%`}
                        </Typography>
                      </Stack>
                      {!uploading && (
                        <IconButton
                          size="small"
                          onClick={() => {
                            handleRemoveFile(index);
                          }}
                        >
                          <DeleteOutlined fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>
                  </div>
                );
              })}
            </div>
          )}

          {selectedFiles.length > 0 && !uploading && (
            <Typography variant="body2" color="text.secondary">
              {t("totalFiles", { count: selectedFiles.length })} - {formatFileSize(totalSize)}
            </Typography>
          )}

          {uploading && uploadProgress && (
            <Stack gap={1}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  {t("uploadingFileOf", {
                    current: uploadProgress.currentFileIndex + 1,
                    total: uploadProgress.totalFiles,
                  })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {uploadProgress.overallProgress}%
                </Typography>
              </Stack>
              <LinearProgress variant="determinate" value={uploadProgress.overallProgress} />
            </Stack>
          )}

          {error && (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={uploading}>
          {t("cancel")}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={selectedFiles.length === 0 || !deviceId || uploading}
          startIcon={
            uploading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadOutlined />
          }
        >
          {uploading
            ? t("uploading")
            : selectedFiles.length > 1
              ? t("uploadFiles", { count: selectedFiles.length })
              : t("upload")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
