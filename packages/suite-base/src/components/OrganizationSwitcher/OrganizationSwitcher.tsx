// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ChevronDown12Regular } from "@fluentui/react-icons";
import AddIcon from "@mui/icons-material/Add";
import BusinessIcon from "@mui/icons-material/Business";
import CheckIcon from "@mui/icons-material/Check";
import PersonIcon from "@mui/icons-material/Person";
import {
  Avatar,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import tc from "tinycolor2";
import { makeStyles } from "tss-react/mui";

import { useAuth } from "@lichtblick/suite-base/context/AuthContext";
import { useOrganizations } from "@lichtblick/suite-base/context/OrganizationContext";
import { Organization } from "@lichtblick/suite-base/services/IOrganizationService";

import { CreateOrganizationDialog } from "./CreateOrganizationDialog";

const useStyles = makeStyles()((theme) => ({
  switcherButton: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(0.75),
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.shape.borderRadius,
    color: theme.palette.common.white,
    fontSize: "0.875rem",
    fontWeight: 500,
    cursor: "pointer",
    border: "none",
    background: "transparent",
    whiteSpace: "nowrap",
    maxWidth: 200,
    minHeight: 32,

    "&:hover": {
      backgroundColor: tc(theme.palette.common.white).setAlpha(0.08).toString(),
    },
    "&.Mui-selected": {
      backgroundColor: theme.palette.appBar.primary,
    },
    "&:disabled": {
      opacity: 0.5,
      cursor: "default",
    },
  },
  avatar: {
    width: 24,
    height: 24,
    fontSize: "0.75rem",
    backgroundColor: tc(theme.palette.appBar.main).lighten().toString(),
  },
  name: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  dropDownIcon: {
    fontSize: "12px !important",
    color: theme.palette.common.white,
  },
  menuPaper: {
    minWidth: 200,
    maxWidth: 280,
  },
  sectionHeader: {
    padding: theme.spacing(1, 2, 0.5),
    color: theme.palette.text.secondary,
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "uppercase",
  },
  menuItemText: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  checkIcon: {
    minWidth: "auto !important",
    marginRight: theme.spacing(1),
    visibility: "hidden",
  },
  checkIconVisible: {
    visibility: "visible",
  },
  orgAvatar: {
    width: 24,
    height: 24,
    fontSize: "0.75rem",
    marginRight: theme.spacing(1),
  },
  createMenuItem: {
    color: theme.palette.primary.main,
  },
}));

export type OrganizationSwitcherProps = {
  className?: string;
};

export function OrganizationSwitcher({ className }: OrganizationSwitcherProps): React.JSX.Element {
  const { classes, cx } = useStyles();
  const { t } = useTranslation("organization");

  const { isAuthenticated, user } = useAuth();
  const { organizations, currentOrganization, selectOrganization, isLoading } = useOrganizations();

  const [anchorEl, setAnchorEl] = useState<HTMLElement | undefined>(undefined);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const menuOpen = Boolean(anchorEl);

  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(undefined);
  }, []);

  const handleSelectPersonal = useCallback(() => {
    selectOrganization(undefined);
    handleClose();
  }, [selectOrganization, handleClose]);

  const handleSelectOrganization = useCallback(
    (org: Organization) => {
      selectOrganization(org);
      handleClose();
    },
    [selectOrganization, handleClose],
  );

  const handleOpenCreateDialog = useCallback(() => {
    setCreateDialogOpen(true);
    handleClose();
  }, [handleClose]);

  const handleCloseCreateDialog = useCallback(() => {
    setCreateDialogOpen(false);
  }, []);

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return <></>;
  }

  const displayName = currentOrganization ? currentOrganization.name : (user.name ?? user.email);
  const displayAvatar = currentOrganization?.avatar ?? user.avatar;
  const displayInitial = currentOrganization
    ? currentOrganization.name[0]?.toUpperCase()
    : (user.name?.[0] ?? user.email[0])?.toUpperCase();

  return (
    <>
      <button
        className={cx(classes.switcherButton, className, { "Mui-selected": menuOpen })}
        onClick={handleClick}
        disabled={isLoading}
        aria-controls={menuOpen ? "organization-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={menuOpen ? "true" : undefined}
      >
        <Avatar className={classes.avatar} src={displayAvatar}>
          {!displayAvatar && displayInitial}
        </Avatar>
        <span className={classes.name}>{displayName}</span>
        <ChevronDown12Regular className={classes.dropDownIcon} />
      </button>

      <Menu
        id="organization-menu"
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        slotProps={{
          paper: {
            className: classes.menuPaper,
          },
        }}
      >
        {/* Personal Account Section */}
        <Typography className={classes.sectionHeader}>{t("personalAccount")}</Typography>
        <MenuItem onClick={handleSelectPersonal}>
          <ListItemIcon
            className={cx(classes.checkIcon, {
              [classes.checkIconVisible]: currentOrganization == undefined,
            })}
          >
            <CheckIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <Avatar className={classes.orgAvatar} src={user.avatar}>
            {!user.avatar && <PersonIcon fontSize="small" />}
          </Avatar>
          <ListItemText
            primary={user.name ?? user.email}
            primaryTypographyProps={{ className: classes.menuItemText }}
          />
        </MenuItem>

        {/* Organizations Section */}
        {organizations.length > 0 && (
          <>
            <Divider />
            <Typography className={classes.sectionHeader}>{t("organizations")}</Typography>
            {organizations.map((org) => (
              <MenuItem key={org.id} onClick={() => { handleSelectOrganization(org); }}>
                <ListItemIcon
                  className={cx(classes.checkIcon, {
                    [classes.checkIconVisible]: currentOrganization?.id === org.id,
                  })}
                >
                  <CheckIcon fontSize="small" color="primary" />
                </ListItemIcon>
                <Avatar className={classes.orgAvatar} src={org.avatar}>
                  {!org.avatar && <BusinessIcon fontSize="small" />}
                </Avatar>
                <ListItemText
                  primary={org.name}
                  primaryTypographyProps={{ className: classes.menuItemText }}
                />
              </MenuItem>
            ))}
          </>
        )}

        {/* Create Organization */}
        <Divider />
        <MenuItem onClick={handleOpenCreateDialog} className={classes.createMenuItem}>
          <ListItemIcon>
            <AddIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText primary={t("createOrganization")} />
        </MenuItem>
      </Menu>

      <CreateOrganizationDialog open={createDialogOpen} onClose={handleCloseCreateDialog} />
    </>
  );
}
