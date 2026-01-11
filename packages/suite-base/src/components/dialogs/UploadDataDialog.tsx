// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { CloudUploadOutlined, InsertDriveFileOutlined } from "@mui/icons-material";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
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
  fileInfo: {
    padding: theme.spacing(2),
    backgroundColor: theme.palette.action.hover,
    borderRadius: theme.shape.borderRadius,
    marginTop: theme.spacing(2),
  },
}));

interface Device {
  id: string;
  name: string;
}

export type UploadDataDialogProps = {
  open: boolean;
  devices: Device[];
  selectedDeviceId?: string;
  onConfirm: (file: File, deviceId: string) => void;
  onCancel: () => void;
};

export function UploadDataDialog({
  open,
  devices,
  selectedDeviceId,
  onConfirm,
  onCancel,
}: UploadDataDialogProps): React.JSX.Element {
  const { classes, cx } = useStyles();
  const { t } = useTranslation("pages");

  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);
  const [deviceId, setDeviceId] = useState(selectedDeviceId ?? "");
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
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
    const file = event.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
    }
  }, []);

  const handleConfirm = useCallback(() => {
    if (selectedFile && deviceId) {
      onConfirm(selectedFile, deviceId);
      setSelectedFile(undefined);
    }
  }, [deviceId, onConfirm, selectedFile]);

  const handleClose = useCallback(() => {
    setSelectedFile(undefined);
    setDeviceId(selectedDeviceId ?? "");
    onCancel();
  }, [onCancel, selectedDeviceId]);

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

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t("uploadData")}</DialogTitle>
      <DialogContent>
        <Stack gap={3}>
          <FormControl fullWidth size="small">
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
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
          <label htmlFor="upload-file-input">
            <div
              className={cx(classes.dropZone, { [classes.dropZoneActive]: isDragging })}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <CloudUploadOutlined className={classes.uploadIcon} />
              <Typography variant="body1">{t("dragAndDrop")}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t("supportedFormats")}
              </Typography>
            </div>
          </label>

          {selectedFile && (
            <div className={classes.fileInfo}>
              <Stack direction="row" alignItems="center" gap={1}>
                <InsertDriveFileOutlined color="primary" />
                <Stack>
                  <Typography variant="body2" fontWeight={500}>
                    {selectedFile.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatFileSize(selectedFile.size)}
                  </Typography>
                </Stack>
              </Stack>
            </div>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{t("cancel")}</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!selectedFile || !deviceId}
          startIcon={<CloudUploadOutlined />}
        >
          {t("upload")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
