// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import StorageIcon from "@mui/icons-material/Storage";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import {
  Alert,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { makeStyles } from "tss-react/mui";

import Stack from "@lichtblick/suite-base/components/Stack";
import { useOrganizations } from "@lichtblick/suite-base/context/OrganizationContext";
import { CheckCanDeleteResponse } from "@lichtblick/suite-base/services/IOrganizationService";

const useStyles = makeStyles()((theme) => ({
  root: {
    padding: theme.spacing(3),
    overflowY: "auto",
    height: "100%",
  },
  section: {
    maxWidth: 600,
  },
  card: {
    marginBottom: theme.spacing(2),
  },
  dangerZone: {
    borderColor: theme.palette.error.main,
  },
  dangerZoneHeader: {
    color: theme.palette.error.main,
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
  },
  deleteButton: {
    color: theme.palette.error.main,
    borderColor: theme.palette.error.main,
    "&:hover": {
      backgroundColor: theme.palette.error.main,
      color: theme.palette.error.contrastText,
    },
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing(1.5, 0),
    borderBottom: `1px solid ${theme.palette.divider}`,
    "&:last-child": {
      borderBottom: "none",
    },
  },
  storageCard: {
    backgroundColor: theme.palette.action.hover,
  },
  confirmInput: {
    marginTop: theme.spacing(2),
  },
  blockersList: {
    backgroundColor: theme.palette.error.light,
    borderRadius: theme.shape.borderRadius,
    marginTop: theme.spacing(1),
  },
}));

export function OrganizationGeneralSettings(): React.JSX.Element {
  const { classes } = useStyles();
  const { t } = useTranslation("appSettings");
  const navigate = useNavigate();

  const {
    currentOrganization,
    updateOrganization,
    checkCanDelete,
    deleteOrganization,
    selectOrganization,
    getStorageStats,
    isLoading,
  } = useOrganizations();

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | undefined>(undefined);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [deleteError, setDeleteError] = useState<string | undefined>(undefined);
  const [canDeleteResult, setCanDeleteResult] = useState<CheckCanDeleteResponse | undefined>(
    undefined,
  );

  // Storage stats
  const [storageBytes, setStorageBytes] = useState<number>(0);
  const [loadingStorage, setLoadingStorage] = useState(false);

  // Initialize edit form when organization changes
  useEffect(() => {
    if (currentOrganization) {
      setEditName(currentOrganization.name);
      setEditSlug(currentOrganization.slug);
      setEditDescription(currentOrganization.description ?? "");
    }
  }, [currentOrganization]);

  // Load storage stats when organization changes
  useEffect(() => {
    if (currentOrganization) {
      setLoadingStorage(true);
      getStorageStats(currentOrganization.id)
        .then((stats) => {
          setStorageBytes(stats.totalBytes);
        })
        .catch((err) => {
          console.error("Failed to load storage stats:", err);
        })
        .finally(() => {
          setLoadingStorage(false);
        });
    }
  }, [currentOrganization, getStorageStats]);

  const handleOpenEditDialog = useCallback(() => {
    if (currentOrganization) {
      setEditName(currentOrganization.name);
      setEditSlug(currentOrganization.slug);
      setEditDescription(currentOrganization.description ?? "");
      setEditError(undefined);
      setEditDialogOpen(true);
    }
  }, [currentOrganization]);

  const handleCloseEditDialog = useCallback(() => {
    setEditDialogOpen(false);
    setEditError(undefined);
  }, []);

  const handleSaveOrganization = useCallback(async () => {
    if (!currentOrganization) {
      return;
    }

    setSaving(true);
    setEditError(undefined);

    try {
      await updateOrganization(currentOrganization.id, {
        name: editName,
        slug: editSlug,
        description: editDescription || undefined,
      });
      setEditDialogOpen(false);
    } catch (err) {
      console.error("Failed to update organization:", err);
      setEditError(err instanceof Error ? err.message : t("updateFailed"));
    } finally {
      setSaving(false);
    }
  }, [currentOrganization, editName, editSlug, editDescription, updateOrganization, t]);

  const handleOpenDeleteDialog = useCallback(async () => {
    if (!currentOrganization) {
      return;
    }

    setChecking(true);
    setDeleteError(undefined);
    setCanDeleteResult(undefined);

    try {
      const result = await checkCanDelete(currentOrganization.id);
      setCanDeleteResult(result);
      setDeleteDialogOpen(true);
    } catch (err) {
      console.error("Failed to check if organization can be deleted:", err);
      setDeleteError(err instanceof Error ? err.message : t("deleteOrganizationFailed"));
    } finally {
      setChecking(false);
    }
  }, [currentOrganization, checkCanDelete, t]);

  const handleCloseDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false);
    setConfirmName("");
    setDeleteError(undefined);
    setCanDeleteResult(undefined);
  }, []);

  const handleDeleteOrganization = useCallback(async () => {
    if (!currentOrganization) {
      return;
    }

    if (confirmName !== currentOrganization.name) {
      setDeleteError(t("organizationNameMismatch"));
      return;
    }

    setDeleting(true);
    setDeleteError(undefined);

    try {
      const success = await deleteOrganization(currentOrganization.id);
      if (success) {
        selectOrganization(undefined);
        setDeleteDialogOpen(false);
        void navigate("/");
      } else {
        setDeleteError(t("deleteOrganizationFailed"));
      }
    } catch (err) {
      console.error("Failed to delete organization:", err);
      setDeleteError(err instanceof Error ? err.message : t("deleteOrganizationFailed"));
    } finally {
      setDeleting(false);
    }
  }, [currentOrganization, confirmName, deleteOrganization, selectOrganization, navigate, t]);

  // Format bytes to human readable
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) {return "0 B";}
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // Show message if no organization is selected
  if (!currentOrganization) {
    return (
      <div className={classes.root}>
        <Stack gap={3} className={classes.section}>
          <Typography variant="h5" gutterBottom>
            {t("general")}
          </Typography>
          <Alert severity="info">{t("selectOrganizationFirst")}</Alert>
        </Stack>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
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
        <Typography variant="h5" gutterBottom>
          {t("general")}
        </Typography>

        {/* Organization Info */}
        <Card variant="outlined" className={classes.card}>
          <CardContent>
            <Stack gap={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">{t("organizationInfo")}</Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={handleOpenEditDialog}
                >
                  {t("editOrganization")}
                </Button>
              </Stack>

              <div>
                <div className={classes.infoRow}>
                  <Typography variant="body2" color="text.secondary">
                    {t("organizationName")}
                  </Typography>
                  <Typography variant="body2">{currentOrganization.name}</Typography>
                </div>
                <div className={classes.infoRow}>
                  <Typography variant="body2" color="text.secondary">
                    {t("organizationSlug")}
                  </Typography>
                  <Typography variant="body2" fontFamily="monospace">
                    {currentOrganization.slug}
                  </Typography>
                </div>
                <div className={classes.infoRow}>
                  <Typography variant="body2" color="text.secondary">
                    {t("organizationId")}
                  </Typography>
                  <Typography variant="body2" fontFamily="monospace">
                    {currentOrganization.id}
                  </Typography>
                </div>
                {currentOrganization.description && (
                  <div className={classes.infoRow}>
                    <Typography variant="body2" color="text.secondary">
                      {t("description")}
                    </Typography>
                    <Typography variant="body2">{currentOrganization.description}</Typography>
                  </div>
                )}
              </div>
            </Stack>
          </CardContent>
        </Card>

        {/* Storage Usage */}
        <Card variant="outlined" className={classes.card}>
          <CardContent>
            <Stack gap={2}>
              <Stack direction="row" alignItems="center" gap={1}>
                <StorageIcon color="action" />
                <Typography variant="h6">{t("storageUsage")}</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {t("storageUsageDescription")}
              </Typography>
              <div className={classes.storageCard}>
                <Stack direction="row" alignItems="baseline" gap={1} padding={2}>
                  {loadingStorage ? (
                    <CircularProgress size={24} />
                  ) : (
                    <Typography variant="h4">{formatBytes(storageBytes)}</Typography>
                  )}
                </Stack>
              </div>
            </Stack>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card variant="outlined" className={classes.dangerZone}>
          <CardContent>
            <Stack gap={2}>
              <div className={classes.dangerZoneHeader}>
                <WarningAmberIcon />
                <Typography variant="h6">{t("dangerZone")}</Typography>
              </div>

              <Divider />

              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack>
                  <Typography variant="subtitle2">{t("deleteOrganization")}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t("deleteOrganizationDescription")}
                  </Typography>
                </Stack>
                <Button
                  variant="outlined"
                  className={classes.deleteButton}
                  startIcon={checking ? <CircularProgress size={16} /> : <DeleteOutlineIcon />}
                  onClick={() => void handleOpenDeleteDialog()}
                  disabled={checking}
                >
                  {t("delete")}
                </Button>
              </Stack>

              {deleteError && !deleteDialogOpen && <Alert severity="error">{deleteError}</Alert>}
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      {/* Edit Organization Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{t("editOrganization")}</DialogTitle>
        <DialogContent>
          <Stack gap={2} paddingTop={1}>
            <TextField
              fullWidth
              label={t("organizationName")}
              value={editName}
              onChange={(e) => {
                setEditName(e.target.value);
              }}
              disabled={saving}
            />
            <TextField
              fullWidth
              label={t("organizationSlug")}
              value={editSlug}
              onChange={(e) => {
                setEditSlug(e.target.value);
              }}
              disabled={saving}
              helperText="URL-friendly identifier"
            />
            <TextField
              fullWidth
              label={t("description")}
              value={editDescription}
              onChange={(e) => {
                setEditDescription(e.target.value);
              }}
              disabled={saving}
              multiline
              rows={3}
            />
            {editError && <Alert severity="error">{editError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} disabled={saving}>
            {t("cancel")}
          </Button>
          <Button
            onClick={() => void handleSaveOrganization()}
            variant="contained"
            disabled={saving || !editName.trim() || !editSlug.trim()}
            startIcon={saving ? <CircularProgress size={16} /> : undefined}
          >
            {saving ? t("saving") : t("save")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {canDeleteResult?.canDelete
            ? t("deleteOrganization")
            : t("cannotDeleteOrganization")}
        </DialogTitle>
        <DialogContent>
          {canDeleteResult?.canDelete === false ? (
            <>
              <DialogContentText>{t("cannotDeleteOrganizationReason")}</DialogContentText>
              <List className={classes.blockersList} dense>
                {canDeleteResult.blockers.map((blocker, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={`• ${blocker}`} />
                  </ListItem>
                ))}
              </List>
            </>
          ) : (
            <>
              <DialogContentText>
                {t("deleteOrganizationConfirm", { name: currentOrganization.name })}
              </DialogContentText>
              <DialogContentText color="error" sx={{ mt: 2 }}>
                {t("deleteOrganizationWarning")}
              </DialogContentText>
              <TextField
                className={classes.confirmInput}
                fullWidth
                label={t("confirmOrganizationName")}
                placeholder={currentOrganization.name}
                value={confirmName}
                onChange={(e) => {
                  setConfirmName(e.target.value);
                }}
                error={deleteError != undefined}
                helperText={deleteError}
                autoComplete="off"
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={deleting}>
            {t("cancel")}
          </Button>
          {canDeleteResult?.canDelete && (
            <Button
              onClick={() => void handleDeleteOrganization()}
              color="error"
              variant="contained"
              disabled={deleting || confirmName !== currentOrganization.name}
              startIcon={deleting ? <CircularProgress size={16} /> : <DeleteOutlineIcon />}
            >
              {t("deleteOrganization")}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </div>
  );
}
