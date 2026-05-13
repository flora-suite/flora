// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DoNotDisturbIcon from "@mui/icons-material/DoNotDisturb";
import ExtensionIcon from "@mui/icons-material/Extension";
import PendingIcon from "@mui/icons-material/Pending";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { makeStyles } from "tss-react/mui";

import Stack from "@lichtblick/suite-base/components/Stack";
import { useOrganizations } from "@lichtblick/suite-base/context/OrganizationContext";
import {
  ExtensionSetting,
  OrgExtension,
} from "@lichtblick/suite-base/services/IOrganizationService";

const useStyles = makeStyles()((theme) => ({
  root: {
    padding: theme.spacing(3),
    overflowY: "auto",
    height: "100%",
  },
  section: {
    maxWidth: 900,
  },
  card: {
    marginBottom: theme.spacing(2),
  },
  tableContainer: {
    marginTop: theme.spacing(2),
  },
  emptyState: {
    padding: theme.spacing(4),
    textAlign: "center",
  },
  statusChip: {
    textTransform: "capitalize",
  },
  approvedChip: {
    backgroundColor: theme.palette.success.main,
    color: theme.palette.success.contrastText,
  },
  pendingChip: {
    backgroundColor: theme.palette.warning.main,
    color: theme.palette.warning.contrastText,
  },
  rejectedChip: {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
  },
  defaultChip: {
    marginLeft: theme.spacing(1),
  },
  tabs: {
    marginBottom: theme.spacing(2),
  },
  dropZone: {
    border: `2px dashed ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(4),
    textAlign: "center",
    cursor: "pointer",
    transition: "border-color 0.2s",
    "&:hover": {
      borderColor: theme.palette.primary.main,
    },
  },
  dropZoneActive: {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover,
  },
}));

export function OrganizationExtensionsSettings(): React.JSX.Element {
  const { classes, cx } = useStyles();
  const { t } = useTranslation("appSettings");

  const {
    currentOrganization,
    isLoading,
    getExtensions,
    uploadExtension,
    reviewExtension,
    deleteExtension,
    getExtensionSettings,
    updateExtensionSetting,
  } = useOrganizations();

  // Tab state
  const [currentTab, setCurrentTab] = useState(0);

  // Extensions state
  const [extensions, setExtensions] = useState<OrgExtension[]>([]);
  const [extensionSettings, setExtensionSettings] = useState<Map<string, ExtensionSetting>>(
    new Map(),
  );
  const [loadingExtensions, setLoadingExtensions] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  // Upload dialog state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | undefined>(undefined);
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);
  const [isDragging, setIsDragging] = useState(false);
  const [extensionName, setExtensionName] = useState("");
  const [extensionVersion, setExtensionVersion] = useState("1.0.0");

  // Review dialog state
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [extensionToReview, setExtensionToReview] = useState<OrgExtension | undefined>(undefined);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewing, setReviewing] = useState(false);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [extensionToDelete, setExtensionToDelete] = useState<OrgExtension | undefined>(undefined);
  const [deleting, setDeleting] = useState(false);

  // Load extensions when organization changes
  useEffect(() => {
    if (currentOrganization) {
      setLoadingExtensions(true);
      setError(undefined);
      void (async () => {
        try {
          const [exts, settings] = await Promise.all([
            getExtensions(currentOrganization.id),
            getExtensionSettings(currentOrganization.id),
          ]);
          setExtensions(exts);
          const settingsMap = new Map<string, ExtensionSetting>();
          for (const setting of settings) {
            settingsMap.set(setting.extensionId, setting);
          }
          setExtensionSettings(settingsMap);
        } catch (err) {
          console.error("Failed to fetch extensions:", err);
          setError(err instanceof Error ? err.message : "Failed to fetch extensions");
        } finally {
          setLoadingExtensions(false);
        }
      })();
    }
  }, [currentOrganization, getExtensions, getExtensionSettings]);

  const handleTabChange = useCallback((_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  }, []);

  const handleOpenUploadDialog = useCallback(() => {
    setSelectedFile(undefined);
    setUploadError(undefined);
    setExtensionName("");
    setExtensionVersion("1.0.0");
    setUploadDialogOpen(true);
  }, []);

  const handleCloseUploadDialog = useCallback(() => {
    setUploadDialogOpen(false);
    setUploadError(undefined);
    setSelectedFile(undefined);
    setExtensionName("");
    setExtensionVersion("1.0.0");
  }, []);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-fill name from filename
      if (!extensionName) {
        setExtensionName(file.name.replace(/\.foxe$/i, ""));
      }
    }
  }, [extensionName]);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragging(false);
      const file = event.dataTransfer.files[0];
      if (file?.name.endsWith(".foxe")) {
        setSelectedFile(file);
        if (!extensionName) {
          setExtensionName(file.name.replace(/\.foxe$/i, ""));
        }
      }
    },
    [extensionName],
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!currentOrganization || !selectedFile || !extensionName.trim()) {
      return;
    }

    setUploading(true);
    setUploadError(undefined);

    try {
      // In a real implementation, you would first upload the file to storage
      // and get a storage path, then call uploadExtension
      // For now, we simulate the storage path
      const storagePath = `extensions/${currentOrganization.id}/${Date.now()}_${selectedFile.name}`;

      const newExtension = await uploadExtension(currentOrganization.id, {
        name: extensionName.trim().toLowerCase().replace(/\s+/g, "-"),
        displayName: extensionName.trim(),
        version: extensionVersion.trim() || "1.0.0",
        storagePath,
      });

      setExtensions((prev) => [...prev, newExtension]);
      setUploadDialogOpen(false);
    } catch (err) {
      console.error("Failed to upload extension:", err);
      setUploadError(err instanceof Error ? err.message : "Failed to upload extension");
    } finally {
      setUploading(false);
    }
  }, [currentOrganization, selectedFile, extensionName, extensionVersion, uploadExtension]);

  const handleOpenDeleteDialog = useCallback((extension: OrgExtension) => {
    setExtensionToDelete(extension);
    setDeleteDialogOpen(true);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false);
    setExtensionToDelete(undefined);
  }, []);

  const handleDeleteExtension = useCallback(async () => {
    if (!currentOrganization || !extensionToDelete) {
      return;
    }

    setDeleting(true);

    try {
      await deleteExtension(currentOrganization.id, extensionToDelete.id);
      setExtensions((prev) => prev.filter((e) => e.id !== extensionToDelete.id));
      setDeleteDialogOpen(false);
      setExtensionToDelete(undefined);
    } catch (err) {
      console.error("Failed to delete extension:", err);
      setError(err instanceof Error ? err.message : "Failed to delete extension");
    } finally {
      setDeleting(false);
    }
  }, [currentOrganization, extensionToDelete, deleteExtension]);

  const handleToggleDefault = useCallback(
    async (extension: OrgExtension) => {
      if (!currentOrganization) {
        return;
      }

      try {
        const currentSetting = extensionSettings.get(extension.id);
        const newIsDefault = !currentSetting?.isDefault;

        const updatedSetting = await updateExtensionSetting(
          currentOrganization.id,
          extension.id,
          { isDefault: newIsDefault },
        );

        setExtensionSettings((prev) => {
          const newMap = new Map(prev);
          newMap.set(extension.id, updatedSetting);
          return newMap;
        });
      } catch (err) {
        console.error("Failed to toggle default:", err);
        setError(err instanceof Error ? err.message : "Failed to update extension");
      }
    },
    [currentOrganization, extensionSettings, updateExtensionSetting],
  );

  const handleOpenReviewDialog = useCallback((extension: OrgExtension) => {
    setExtensionToReview(extension);
    setReviewNote("");
    setReviewDialogOpen(true);
  }, []);

  const handleCloseReviewDialog = useCallback(() => {
    setReviewDialogOpen(false);
    setExtensionToReview(undefined);
    setReviewNote("");
  }, []);

  const handleReview = useCallback(
    async (status: "approved" | "rejected") => {
      if (!currentOrganization || !extensionToReview) {
        return;
      }

      setReviewing(true);

      try {
        const updated = await reviewExtension(currentOrganization.id, extensionToReview.id, {
          status,
          reviewNote: reviewNote.trim() || undefined,
        });

        setExtensions((prev) =>
          prev.map((e) => (e.id === extensionToReview.id ? updated : e)),
        );
        setReviewDialogOpen(false);
        setExtensionToReview(undefined);
        setReviewNote("");
      } catch (err) {
        console.error("Failed to review extension:", err);
        setError(err instanceof Error ? err.message : "Failed to review extension");
      } finally {
        setReviewing(false);
      }
    },
    [currentOrganization, extensionToReview, reviewNote, reviewExtension],
  );

  const getStatusChipClass = (status: OrgExtension["status"]): string => {
    switch (status) {
      case "approved":
        return cx(classes.statusChip, classes.approvedChip);
      case "pending":
        return cx(classes.statusChip, classes.pendingChip);
      case "rejected":
        return cx(classes.statusChip, classes.rejectedChip);
      default:
        return classes.statusChip;
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  // Check if current user can manage extensions (owner or admin)
  const canManageExtensions = currentOrganization?.role === "owner" || currentOrganization?.role === "admin";

  // Filter extensions based on tab
  const filteredExtensions = extensions.filter((ext) => {
    if (currentTab === 0) {return ext.status === "approved";}
    if (currentTab === 1) {return ext.status === "pending";}
    return true;
  });

  // Show message if no organization is selected
  if (!currentOrganization) {
    return (
      <div className={classes.root}>
        <Stack gap={3} className={classes.section}>
          <Typography variant="h5" gutterBottom>
            {t("orgExtensions")}
          </Typography>
          <Alert severity="info">{t("selectOrganizationFirst")}</Alert>
        </Stack>
      </div>
    );
  }

  // Show loading state
  if (isLoading || loadingExtensions) {
    return (
      <div className={classes.root}>
        <Stack gap={3} className={classes.section} alignItems="center">
          <CircularProgress />
        </Stack>
      </div>
    );
  }

  return (
    <div className={classes.root}>
      <Stack gap={3} className={classes.section}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <div>
            <Typography variant="h5" gutterBottom>
              {t("orgExtensions")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("orgExtensionsDescription")}
            </Typography>
          </div>
          <Button
            variant="contained"
            startIcon={<CloudUploadIcon />}
            onClick={handleOpenUploadDialog}
          >
            Upload Extension
          </Button>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}

        {canManageExtensions && (
          <Tabs value={currentTab} onChange={handleTabChange} className={classes.tabs}>
            <Tab label={`Approved (${extensions.filter((e) => e.status === "approved").length})`} />
            <Tab label={`Pending Review (${extensions.filter((e) => e.status === "pending").length})`} />
          </Tabs>
        )}

        <Card variant="outlined" className={classes.card}>
          <CardContent>
            {filteredExtensions.length === 0 ? (
              <div className={classes.emptyState}>
                <ExtensionIcon color="disabled" sx={{ fontSize: 48, mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Extensions
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {currentTab === 1
                    ? "No extensions pending review."
                    : "Upload an extension to share it with your organization."}
                </Typography>
              </div>
            ) : (
              <TableContainer className={classes.tableContainer}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Version</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Updated</TableCell>
                      <TableCell>{t("actions")}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredExtensions.map((extension) => {
                      const setting = extensionSettings.get(extension.id);
                      const isDefault = setting?.isDefault ?? false;
                      return (
                        <TableRow key={extension.id}>
                          <TableCell>
                            <Stack direction="row" alignItems="center">
                              <Typography variant="body2">{extension.displayName}</Typography>
                              {isDefault && (
                                <Chip
                                  label="Default"
                                  size="small"
                                  color="primary"
                                  className={classes.defaultChip}
                                />
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell>{extension.version}</TableCell>
                          <TableCell>
                            <Chip
                              icon={
                                extension.status === "approved" ? (
                                  <CheckCircleIcon />
                                ) : extension.status === "rejected" ? (
                                  <DoNotDisturbIcon />
                                ) : (
                                  <PendingIcon />
                                )
                              }
                              label={extension.status}
                              size="small"
                              className={getStatusChipClass(extension.status)}
                            />
                          </TableCell>
                          <TableCell>{formatDate(extension.updatedAt)}</TableCell>
                          <TableCell>
                            <Stack direction="row" gap={0.5}>
                              {canManageExtensions && extension.status === "pending" && (
                                <>
                                  <Tooltip title="Approve">
                                    <IconButton
                                      size="small"
                                      color="success"
                                      onClick={() => {
                                        handleOpenReviewDialog(extension);
                                      }}
                                    >
                                      <CheckCircleIcon />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Reject">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => {
                                        handleOpenReviewDialog(extension);
                                      }}
                                    >
                                      <DoNotDisturbIcon />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                              {canManageExtensions && extension.status === "approved" && (
                                <Tooltip title={isDefault ? "Remove from defaults" : "Set as default"}>
                                  <IconButton
                                    size="small"
                                    color={isDefault ? "primary" : "default"}
                                    onClick={() => void handleToggleDefault(extension)}
                                  >
                                    <ExtensionIcon />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {canManageExtensions && (
                                <Tooltip title="Delete">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => {
                                      handleOpenDeleteDialog(extension);
                                    }}
                                    disabled={deleting}
                                  >
                                    <DeleteOutlineIcon />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Stack>

      {/* Upload Extension Dialog */}
      <Dialog open={uploadDialogOpen} onClose={handleCloseUploadDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Extension</DialogTitle>
        <DialogContent>
          <Stack gap={2} paddingTop={1}>
            <div
              className={cx(classes.dropZone, isDragging && classes.dropZoneActive)}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <input
                type="file"
                accept=".foxe"
                onChange={handleFileSelect}
                style={{ display: "none" }}
                id="extension-upload"
              />
              <label htmlFor="extension-upload" style={{ cursor: "pointer" }}>
                <CloudUploadIcon color="action" sx={{ fontSize: 48, mb: 1 }} />
                <Typography variant="body1" gutterBottom>
                  {selectedFile ? selectedFile.name : "Drop extension file here or click to browse"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Supports .foxe files
                </Typography>
              </label>
            </div>
            <TextField
              fullWidth
              label="Extension Name"
              placeholder="My Extension"
              value={extensionName}
              onChange={(e) => {
                setExtensionName(e.target.value);
              }}
              disabled={uploading}
            />
            <TextField
              fullWidth
              label="Version"
              placeholder="1.0.0"
              value={extensionVersion}
              onChange={(e) => {
                setExtensionVersion(e.target.value);
              }}
              disabled={uploading}
            />
            {uploadError && <Alert severity="error">{uploadError}</Alert>}
            {!canManageExtensions && (
              <Alert severity="info">
                Your extension will be reviewed by an admin before it becomes available to other
                members.
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUploadDialog} disabled={uploading}>
            {t("cancel")}
          </Button>
          <Button
            onClick={() => void handleUpload()}
            variant="contained"
            disabled={uploading || !selectedFile || !extensionName.trim()}
            startIcon={uploading ? <CircularProgress size={16} /> : <CloudUploadIcon />}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* Review Extension Dialog */}
      <Dialog open={reviewDialogOpen} onClose={handleCloseReviewDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Review Extension</DialogTitle>
        <DialogContent>
          <Stack gap={2} paddingTop={1}>
            <Typography>
              Extension: <strong>{extensionToReview?.displayName}</strong> (v
              {extensionToReview?.version})
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Review Note (optional)"
              placeholder="Add a note about your decision..."
              value={reviewNote}
              onChange={(e) => {
                setReviewNote(e.target.value);
              }}
              disabled={reviewing}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReviewDialog} disabled={reviewing}>
            {t("cancel")}
          </Button>
          <Button
            onClick={() => void handleReview("rejected")}
            color="error"
            disabled={reviewing}
            startIcon={reviewing ? <CircularProgress size={16} /> : <DoNotDisturbIcon />}
          >
            Reject
          </Button>
          <Button
            onClick={() => void handleReview("approved")}
            color="success"
            variant="contained"
            disabled={reviewing}
            startIcon={reviewing ? <CircularProgress size={16} /> : <CheckCircleIcon />}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Extension Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Extension</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete &quot;{extensionToDelete?.displayName}&quot;? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={deleting}>
            {t("cancel")}
          </Button>
          <Button
            onClick={() => void handleDeleteExtension()}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : <DeleteOutlineIcon />}
          >
            {t("delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
