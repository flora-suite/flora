// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
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
import { useCallback, useState } from "react";
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
  dangerZone: {
    borderColor: theme.palette.error.main,
    marginTop: theme.spacing(3),
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
  orgInfo: {
    backgroundColor: theme.palette.action.hover,
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
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

export function OrganizationSettings(): React.JSX.Element {
  const { classes } = useStyles();
  const { t } = useTranslation("appSettings");
  const navigate = useNavigate();

  const {
    currentOrganization,
    checkCanDelete,
    deleteOrganization,
    selectOrganization,
    isLoading,
  } = useOrganizations();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [canDeleteResult, setCanDeleteResult] = useState<CheckCanDeleteResponse | undefined>(
    undefined,
  );

  const handleOpenDeleteDialog = useCallback(async () => {
    if (!currentOrganization) {
      return;
    }

    setChecking(true);
    setError(undefined);
    setCanDeleteResult(undefined);

    try {
      const result = await checkCanDelete(currentOrganization.id);
      setCanDeleteResult(result);
      setDeleteDialogOpen(true);
    } catch (err) {
      console.error("Failed to check if organization can be deleted:", err);
      setError(err instanceof Error ? err.message : t("deleteOrganizationFailed"));
    } finally {
      setChecking(false);
    }
  }, [currentOrganization, checkCanDelete, t]);

  const handleCloseDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false);
    setConfirmName("");
    setError(undefined);
    setCanDeleteResult(undefined);
  }, []);

  const handleDeleteOrganization = useCallback(async () => {
    if (!currentOrganization) {
      return;
    }

    if (confirmName !== currentOrganization.name) {
      setError(t("organizationNameMismatch"));
      return;
    }

    setDeleting(true);
    setError(undefined);

    try {
      const success = await deleteOrganization(currentOrganization.id);
      if (success) {
        // Switch to personal account after deletion
        selectOrganization(undefined);
        setDeleteDialogOpen(false);
        // Navigate back to dashboard
        void navigate("/");
      } else {
        setError(t("deleteOrganizationFailed"));
      }
    } catch (err) {
      console.error("Failed to delete organization:", err);
      setError(err instanceof Error ? err.message : t("deleteOrganizationFailed"));
    } finally {
      setDeleting(false);
    }
  }, [currentOrganization, confirmName, deleteOrganization, selectOrganization, navigate, t]);

  // Show message if no organization is selected
  if (!currentOrganization) {
    return (
      <div className={classes.root}>
        <Stack gap={3} className={classes.section}>
          <Typography variant="h5" gutterBottom>
            {t("organizationSettings")}
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
          {t("organizationSettings")}
        </Typography>

        {/* General Settings */}
        <Stack gap={2}>
          <Typography variant="h6">{t("general")}</Typography>

          <div className={classes.orgInfo}>
            <Stack gap={1}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  {t("organizationName")}
                </Typography>
                <Typography variant="body2">{currentOrganization.name}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  {t("organizationId")}
                </Typography>
                <Typography variant="body2" fontFamily="monospace">
                  {currentOrganization.id}
                </Typography>
              </Stack>
              {currentOrganization.description && (
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    {t("description")}
                  </Typography>
                  <Typography variant="body2">{currentOrganization.description}</Typography>
                </Stack>
              )}
            </Stack>
          </div>
        </Stack>

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

              {error && !deleteDialogOpen && <Alert severity="error">{error}</Alert>}
            </Stack>
          </CardContent>
        </Card>
      </Stack>

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
                error={error != undefined}
                helperText={error}
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
