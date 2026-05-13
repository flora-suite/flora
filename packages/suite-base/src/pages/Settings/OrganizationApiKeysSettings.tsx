// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import AddIcon from "@mui/icons-material/Add";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import KeyIcon from "@mui/icons-material/Key";
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
  IconButton,
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
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { makeStyles } from "tss-react/mui";

import Stack from "@lichtblick/suite-base/components/Stack";
import { useOrganizations } from "@lichtblick/suite-base/context/OrganizationContext";
import { ApiKey } from "@lichtblick/suite-base/services/IOrganizationService";

const useStyles = makeStyles()((theme) => ({
  root: {
    padding: theme.spacing(3),
    overflowY: "auto",
    height: "100%",
  },
  section: {
    maxWidth: 800,
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
  apiKeyDisplay: {
    backgroundColor: theme.palette.action.hover,
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    fontFamily: "monospace",
    wordBreak: "break-all",
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
  },
  keyText: {
    flex: 1,
    fontFamily: "monospace",
    fontSize: "0.875rem",
  },
  truncatedKey: {
    fontFamily: "monospace",
    color: theme.palette.text.secondary,
  },
}));

export function OrganizationApiKeysSettings(): React.JSX.Element {
  const { classes } = useStyles();
  const { t } = useTranslation("appSettings");

  const {
    currentOrganization,
    getApiKeys,
    createApiKey,
    deleteApiKey,
    isLoading,
  } = useOrganizations();

  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  // Create dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | undefined>(undefined);

  // Created key display state
  const [createdKey, setCreatedKey] = useState<string | undefined>(undefined);
  const [copied, setCopied] = useState(false);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<ApiKey | undefined>(undefined);
  const [deleting, setDeleting] = useState(false);

  // Load API keys when organization changes
  useEffect(() => {
    if (currentOrganization) {
      setLoadingKeys(true);
      setError(undefined);
      void (async () => {
        try {
          const keys = await getApiKeys(currentOrganization.id);
          setApiKeys(keys);
        } catch (err) {
          console.error("Failed to fetch API keys:", err);
          setError(err instanceof Error ? err.message : "Failed to fetch API keys");
        } finally {
          setLoadingKeys(false);
        }
      })();
    }
  }, [currentOrganization, getApiKeys]);

  const handleOpenCreateDialog = useCallback(() => {
    setNewKeyName("");
    setCreateError(undefined);
    setCreatedKey(undefined);
    setCreateDialogOpen(true);
  }, []);

  const handleCloseCreateDialog = useCallback(() => {
    setCreateDialogOpen(false);
    setCreateError(undefined);
    setCreatedKey(undefined);
    setNewKeyName("");
  }, []);

  const handleCreateKey = useCallback(async () => {
    if (!currentOrganization || !newKeyName.trim()) {
      return;
    }

    setCreating(true);
    setCreateError(undefined);

    try {
      const response = await createApiKey(currentOrganization.id, newKeyName.trim());
      setCreatedKey(response.rawKey);
      setApiKeys((prev) => [...prev, response.apiKey]);
    } catch (err) {
      console.error("Failed to create API key:", err);
      setCreateError(err instanceof Error ? err.message : "Failed to create API key");
    } finally {
      setCreating(false);
    }
  }, [currentOrganization, newKeyName, createApiKey]);

  const handleCopyKey = useCallback(async () => {
    if (createdKey) {
      await navigator.clipboard.writeText(createdKey);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  }, [createdKey]);

  const handleOpenDeleteDialog = useCallback((key: ApiKey) => {
    setKeyToDelete(key);
    setDeleteDialogOpen(true);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false);
    setKeyToDelete(undefined);
  }, []);

  const handleDeleteKey = useCallback(async () => {
    if (!currentOrganization || !keyToDelete) {
      return;
    }

    setDeleting(true);

    try {
      await deleteApiKey(currentOrganization.id, keyToDelete.id);
      setApiKeys((prev) => prev.filter((k) => k.id !== keyToDelete.id));
      setDeleteDialogOpen(false);
      setKeyToDelete(undefined);
    } catch (err) {
      console.error("Failed to delete API key:", err);
      setError(err instanceof Error ? err.message : "Failed to delete API key");
    } finally {
      setDeleting(false);
    }
  }, [currentOrganization, keyToDelete, deleteApiKey]);

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  // Check if current user can manage API keys (owner or admin)
  const canManageApiKeys = currentOrganization?.role === "owner" || currentOrganization?.role === "admin";

  // Show message if no organization is selected
  if (!currentOrganization) {
    return (
      <div className={classes.root}>
        <Stack gap={3} className={classes.section}>
          <Typography variant="h5" gutterBottom>
            {t("apiKeys")}
          </Typography>
          <Alert severity="info">{t("selectOrganizationFirst")}</Alert>
        </Stack>
      </div>
    );
  }

  // Show loading state
  if (isLoading || loadingKeys) {
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
              {t("apiKeys")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("apiKeysDescription")}
            </Typography>
          </div>
          {canManageApiKeys && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreateDialog}
            >
              {t("createApiKey")}
            </Button>
          )}
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}

        <Card variant="outlined" className={classes.card}>
          <CardContent>
            {apiKeys.length === 0 ? (
              <div className={classes.emptyState}>
                <KeyIcon color="disabled" sx={{ fontSize: 48, mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {t("noApiKeys")}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("noApiKeysDescription")}
                </Typography>
              </div>
            ) : (
              <TableContainer className={classes.tableContainer}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t("name")}</TableCell>
                      <TableCell>{t("apiKey")}</TableCell>
                      <TableCell>{t("createdAt")}</TableCell>
                      <TableCell>{t("lastUsed")}</TableCell>
                      {canManageApiKeys && <TableCell>{t("actions")}</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {apiKeys.map((key) => (
                      <TableRow key={key.id}>
                        <TableCell>{key.name}</TableCell>
                        <TableCell>
                          <Typography className={classes.truncatedKey}>
                            {key.keyPrefix}
                          </Typography>
                        </TableCell>
                        <TableCell>{formatDate(key.createdAt)}</TableCell>
                        <TableCell>
                          {key.lastUsedAt ? formatDate(key.lastUsedAt) : t("never")}
                        </TableCell>
                        {canManageApiKeys && (
                          <TableCell>
                            <Tooltip title={t("deleteApiKey")}>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  handleOpenDeleteDialog(key);
                                }}
                                disabled={deleting}
                              >
                                <DeleteOutlineIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Stack>

      {/* Create API Key Dialog */}
      <Dialog open={createDialogOpen} onClose={handleCloseCreateDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {createdKey ? t("apiKeyCreated") : t("createApiKey")}
        </DialogTitle>
        <DialogContent>
          {createdKey ? (
            <Stack gap={2} paddingTop={1}>
              <Alert severity="warning">
                {t("apiKeyCreatedDescription")}
              </Alert>
              <div className={classes.apiKeyDisplay}>
                <Typography className={classes.keyText}>
                  {createdKey}
                </Typography>
                <Tooltip title={copied ? t("copied") : t("copyToClipboard")}>
                  <IconButton size="small" onClick={() => void handleCopyKey()}>
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </div>
            </Stack>
          ) : (
            <Stack gap={2} paddingTop={1}>
              <TextField
                fullWidth
                label={t("apiKeyName")}
                placeholder={t("apiKeyNamePlaceholder")}
                value={newKeyName}
                onChange={(e) => {
                  setNewKeyName(e.target.value);
                }}
                disabled={creating}
                autoFocus
              />
              {createError && <Alert severity="error">{createError}</Alert>}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          {createdKey ? (
            <Button onClick={handleCloseCreateDialog} variant="contained">
              {t("cancel")}
            </Button>
          ) : (
            <>
              <Button onClick={handleCloseCreateDialog} disabled={creating}>
                {t("cancel")}
              </Button>
              <Button
                onClick={() => void handleCreateKey()}
                variant="contained"
                disabled={creating || !newKeyName.trim()}
                startIcon={creating ? <CircularProgress size={16} /> : <AddIcon />}
              >
                {t("create")}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete API Key Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{t("deleteApiKey")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("deleteApiKeyConfirm")}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={deleting}>
            {t("cancel")}
          </Button>
          <Button
            onClick={() => void handleDeleteKey()}
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
