// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  CircularProgress,
  Divider,
  Menu,
  MenuItem,
  PaperProps,
  PopoverPosition,
  PopoverReference,
  Typography,
} from "@mui/material";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { makeStyles } from "tss-react/mui";

import { AuthDialog } from "@lichtblick/suite-base/components/AuthDialog";
import { useAuth } from "@lichtblick/suite-base/context/AuthContext";

const useStyles = makeStyles()((theme) => ({
  menuList: {
    minWidth: 200,
  },
  userInfo: {
    padding: theme.spacing(1, 2),
    outline: "none",
  },
  userEmail: {
    color: theme.palette.text.secondary,
    fontSize: "0.75rem",
  },
}));

type SettingsMenuProps = {
  handleClose: () => void;
  anchorEl?: HTMLElement;
  anchorReference?: PopoverReference;
  anchorPosition?: PopoverPosition;
  disablePortal?: boolean;
  open: boolean;
};

export function SettingsMenu({
  anchorEl,
  anchorReference,
  anchorPosition,
  disablePortal,
  handleClose,
  open,
}: SettingsMenuProps): JSX.Element {
  const { classes } = useStyles();
  const { t } = useTranslation("appBar");
  const { t: tAuth } = useTranslation("auth");
  const navigate = useNavigate();

  const { isAuthenticated, user, signOut, isLoading } = useAuth();

  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const onSettingsClick = useCallback(
    (tab?: string) => {
      const path = tab ? `/settings/${tab}` : "/settings";
      void navigate(path);
    },
    [navigate],
  );

  const onDocsClick = useCallback(() => {
    window.open("https://flora.fan/docs", "_blank");
  }, []);

  const onGetDeskAppClick = useCallback(() => {
    window.open("https://github.com/flora-suite/flora/releases", "_blank");
  }, []);

  const handleSignIn = useCallback(() => {
    handleClose();
    setAuthDialogOpen(true);
  }, [handleClose]);

  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
      handleClose();
    }
  }, [signOut, handleClose]);

  const handleAuthDialogClose = useCallback(() => {
    setAuthDialogOpen(false);
  }, []);

  return (
    <>
      <Menu
        anchorEl={anchorEl}
        anchorReference={anchorReference}
        anchorPosition={anchorPosition}
        disablePortal={disablePortal}
        id="user-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        MenuListProps={{ className: classes.menuList, dense: true }}
        PaperProps={
          {
            "data-tourid": "user-menu",
          } as Partial<PaperProps & { "data-tourid"?: string }>
        }
      >
        {/* User authentication section */}
        {isLoading ? (
          <MenuItem disabled>
            <CircularProgress size={16} />
          </MenuItem>
        ) : isAuthenticated && user ? (
          [
            <div key="user-info" className={classes.userInfo}>
              <Typography variant="body2" fontWeight="medium">
                {user.name ?? user.email}
              </Typography>
              {user.name && (
                <Typography className={classes.userEmail}>{user.email}</Typography>
              )}
            </div>,
            <Divider key="auth-divider" variant="middle" />,
          ]
        ) : (
          [
            <MenuItem key="sign-in" onClick={handleSignIn}>
              {tAuth("signIn")}
            </MenuItem>,
            <Divider key="auth-divider" variant="middle" />,
          ]
        )}

        {/* Settings section */}
        <MenuItem
          onClick={() => {
            onSettingsClick();
          }}
        >
          {t("settings")}
        </MenuItem>
        <MenuItem
          onClick={() => {
            onSettingsClick("extensions");
          }}
        >
          {t("extensions")}
        </MenuItem>
        <Divider variant="middle" />

        {/* Help section */}
        <MenuItem onClick={onDocsClick}>{t("documentation")}</MenuItem>
        <MenuItem onClick={onGetDeskAppClick}>{t("getDesktopApp")}</MenuItem>

        {/* Sign out - only show when authenticated */}
        {isAuthenticated && !isLoading && (
          [
            <Divider key="signout-divider" variant="middle" />,
            <MenuItem
              key="sign-out"
              onClick={(e) => {
                e.stopPropagation();
                void handleSignOut();
              }}
              disabled={signingOut}
            >
              {signingOut ? <CircularProgress size={16} /> : tAuth("signOut")}
            </MenuItem>,
          ]
        )}
      </Menu>
      <AuthDialog open={authDialogOpen} onClose={handleAuthDialogClose} />
    </>
  );
}
