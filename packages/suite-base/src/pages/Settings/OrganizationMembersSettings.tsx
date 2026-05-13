// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import {
  Alert,
  Avatar,
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
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
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
import { OrgMember, OrgRole } from "@lichtblick/suite-base/services/IOrganizationService";

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
  avatar: {
    width: 32,
    height: 32,
  },
  roleChip: {
    textTransform: "capitalize",
  },
  ownerChip: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
  },
  adminChip: {
    backgroundColor: theme.palette.warning.main,
    color: theme.palette.warning.contrastText,
  },
  memberChip: {
    backgroundColor: theme.palette.grey[500],
    color: theme.palette.common.white,
  },
  emptyState: {
    padding: theme.spacing(4),
    textAlign: "center",
  },
  roleSelect: {
    minWidth: 120,
  },
}));

export function OrganizationMembersSettings(): React.JSX.Element {
  const { classes, cx } = useStyles();
  const { t } = useTranslation("appSettings");

  const {
    currentOrganization,
    fetchMembers,
    addMember,
    updateMemberRole,
    removeMember,
    isLoading,
  } = useOrganizations();

  // Members state
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  // Add member dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<OrgRole>("member");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | undefined>(undefined);

  // Remove member dialog state
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<OrgMember | undefined>(undefined);
  const [removing, setRemoving] = useState(false);

  // Role change state
  const [changingRole, setChangingRole] = useState<string | undefined>(undefined);

  // Load members when organization changes
  useEffect(() => {
    if (currentOrganization) {
      setLoadingMembers(true);
      setError(undefined);
      fetchMembers(currentOrganization.id)
        .then((result) => {
          setMembers(result);
        })
        .catch((err) => {
          console.error("Failed to fetch members:", err);
          setError(err instanceof Error ? err.message : "Failed to load members");
        })
        .finally(() => {
          setLoadingMembers(false);
        });
    }
  }, [currentOrganization, fetchMembers]);

  const handleOpenAddDialog = useCallback(() => {
    setNewMemberEmail("");
    setNewMemberRole("member");
    setAddError(undefined);
    setAddDialogOpen(true);
  }, []);

  const handleCloseAddDialog = useCallback(() => {
    setAddDialogOpen(false);
    setAddError(undefined);
  }, []);

  const handleAddMember = useCallback(async () => {
    if (!currentOrganization || !newMemberEmail.trim()) {
      return;
    }

    setAdding(true);
    setAddError(undefined);

    try {
      const newMember = await addMember(currentOrganization.id, {
        email: newMemberEmail.trim(),
        role: newMemberRole,
      });
      setMembers((prev) => [...prev, newMember]);
      setAddDialogOpen(false);
    } catch (err) {
      console.error("Failed to add member:", err);
      setAddError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setAdding(false);
    }
  }, [currentOrganization, newMemberEmail, newMemberRole, addMember]);

  const handleOpenRemoveDialog = useCallback((member: OrgMember) => {
    setMemberToRemove(member);
    setRemoveDialogOpen(true);
  }, []);

  const handleCloseRemoveDialog = useCallback(() => {
    setRemoveDialogOpen(false);
    setMemberToRemove(undefined);
  }, []);

  const handleRemoveMember = useCallback(async () => {
    if (!currentOrganization || !memberToRemove) {
      return;
    }

    setRemoving(true);

    try {
      const success = await removeMember(currentOrganization.id, memberToRemove.userId);
      if (success) {
        setMembers((prev) => prev.filter((m) => m.userId !== memberToRemove.userId));
        setRemoveDialogOpen(false);
        setMemberToRemove(undefined);
      }
    } catch (err) {
      console.error("Failed to remove member:", err);
      setError(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setRemoving(false);
    }
  }, [currentOrganization, memberToRemove, removeMember]);

  const handleRoleChange = useCallback(
    async (member: OrgMember, newRole: OrgRole) => {
      if (!currentOrganization || newRole === member.role) {
        return;
      }

      setChangingRole(member.userId);

      try {
        const updatedMember = await updateMemberRole(currentOrganization.id, member.userId, {
          role: newRole,
        });
        setMembers((prev) =>
          prev.map((m) => (m.userId === member.userId ? updatedMember : m)),
        );
      } catch (err) {
        console.error("Failed to update member role:", err);
        setError(err instanceof Error ? err.message : "Failed to update role");
      } finally {
        setChangingRole(undefined);
      }
    },
    [currentOrganization, updateMemberRole],
  );

  const getRoleChipClass = (role: OrgRole): string => {
    switch (role) {
      case "owner":
        return cx(classes.roleChip, classes.ownerChip);
      case "admin":
        return cx(classes.roleChip, classes.adminChip);
      default:
        return cx(classes.roleChip, classes.memberChip);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  // Check if current user can manage members (owner or admin)
  const canManageMembers = currentOrganization?.role === "owner" || currentOrganization?.role === "admin";
  const isOwner = currentOrganization?.role === "owner";

  // Show message if no organization is selected
  if (!currentOrganization) {
    return (
      <div className={classes.root}>
        <Stack gap={3} className={classes.section}>
          <Typography variant="h5" gutterBottom>
            {t("members")}
          </Typography>
          <Alert severity="info">{t("selectOrganizationFirst")}</Alert>
        </Stack>
      </div>
    );
  }

  // Show loading state
  if (isLoading || loadingMembers) {
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
              {t("members")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("membersDescription")}
            </Typography>
          </div>
          {canManageMembers && (
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={handleOpenAddDialog}
            >
              {t("addMember")}
            </Button>
          )}
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}

        <Card variant="outlined" className={classes.card}>
          <CardContent>
            {members.length === 0 ? (
              <div className={classes.emptyState}>
                <Typography variant="body1" color="text.secondary">
                  {t("noMembers")}
                </Typography>
              </div>
            ) : (
              <TableContainer className={classes.tableContainer}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t("name")}</TableCell>
                      <TableCell>{t("email")}</TableCell>
                      <TableCell>{t("role")}</TableCell>
                      <TableCell>{t("joinedAt")}</TableCell>
                      {canManageMembers && <TableCell>{t("actions")}</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.userId}>
                        <TableCell>
                          <Stack direction="row" alignItems="center" gap={1}>
                            <Avatar
                              src={member.avatar}
                              className={classes.avatar}
                            >
                              {(member.name ?? member.email).charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography variant="body2">
                              {member.name ?? "-"}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          {canManageMembers && member.role !== "owner" && isOwner ? (
                            <FormControl size="small" className={classes.roleSelect}>
                              <Select
                                value={member.role}
                                onChange={(e) => {
                                  void handleRoleChange(member, e.target.value as OrgRole);
                                }}
                                disabled={changingRole === member.userId}
                              >
                                <MenuItem value="admin">{t("admin")}</MenuItem>
                                <MenuItem value="member">{t("member")}</MenuItem>
                              </Select>
                            </FormControl>
                          ) : (
                            <Chip
                              label={t(member.role)}
                              size="small"
                              className={getRoleChipClass(member.role)}
                            />
                          )}
                        </TableCell>
                        <TableCell>{formatDate(member.joinedAt)}</TableCell>
                        {canManageMembers && (
                          <TableCell>
                            {member.role !== "owner" && (
                              <Tooltip title={t("removeMember")}>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => {
                                    handleOpenRemoveDialog(member);
                                  }}
                                  disabled={removing}
                                >
                                  <PersonRemoveIcon />
                                </IconButton>
                              </Tooltip>
                            )}
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

      {/* Add Member Dialog */}
      <Dialog open={addDialogOpen} onClose={handleCloseAddDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{t("addMember")}</DialogTitle>
        <DialogContent>
          <Stack gap={2} paddingTop={1}>
            <Typography variant="body2" color="text.secondary">
              {t("addMemberDescription")}
            </Typography>
            <TextField
              fullWidth
              label={t("email")}
              type="email"
              placeholder={t("emailPlaceholder")}
              value={newMemberEmail}
              onChange={(e) => {
                setNewMemberEmail(e.target.value);
              }}
              disabled={adding}
              autoFocus
            />
            <FormControl fullWidth>
              <InputLabel>{t("role")}</InputLabel>
              <Select
                value={newMemberRole}
                label={t("role")}
                onChange={(e) => {
                  setNewMemberRole(e.target.value as OrgRole);
                }}
                disabled={adding}
              >
                <MenuItem value="admin">{t("admin")}</MenuItem>
                <MenuItem value="member">{t("member")}</MenuItem>
              </Select>
            </FormControl>
            {addError && <Alert severity="error">{addError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog} disabled={adding}>
            {t("cancel")}
          </Button>
          <Button
            onClick={() => void handleAddMember()}
            variant="contained"
            disabled={adding || !newMemberEmail.trim()}
            startIcon={adding ? <CircularProgress size={16} /> : <PersonAddIcon />}
          >
            {t("invite")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Remove Member Dialog */}
      <Dialog open={removeDialogOpen} onClose={handleCloseRemoveDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{t("removeMember")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("confirmRemoveMember", { name: memberToRemove?.name ?? memberToRemove?.email })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRemoveDialog} disabled={removing}>
            {t("cancel")}
          </Button>
          <Button
            onClick={() => void handleRemoveMember()}
            color="error"
            variant="contained"
            disabled={removing}
            startIcon={removing ? <CircularProgress size={16} /> : <PersonRemoveIcon />}
          >
            {t("remove")}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
