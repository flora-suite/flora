// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Button, CircularProgress, Typography } from "@mui/material";
import { useSnackbar } from "notistack";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAsyncFn } from "react-use";
import { makeStyles } from "tss-react/mui";

import Logger from "@lichtblick/log";
import { AuthDialog } from "@lichtblick/suite-base/components/AuthDialog";
import BlockheadFilledIcon from "@lichtblick/suite-base/components/BlockheadFilledIcon";
import Stack from "@lichtblick/suite-base/components/Stack";
import { useAuth } from "@lichtblick/suite-base/context/AuthContext";
import { useConfirm } from "@lichtblick/suite-base/hooks/useConfirm";

const log = Logger.getLogger(__filename);

const AVATAR_ICON_SIZE = 42;

const useStyles = makeStyles()((theme) => ({
  icon: {
    color: theme.palette.primary.main,
    fontSize: AVATAR_ICON_SIZE,
  },
}));

export default function UserAccountInfo(): JSX.Element {
  const { t } = useTranslation("auth");
  const { isAuthenticated, user, signOut, isLoading } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [confirm, confirmModal] = useConfirm();
  const { classes } = useStyles();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  const [{ loading: signingOut }, beginSignOut] = useAsyncFn(async () => {
    try {
      await signOut();
      enqueueSnackbar(t("signedOut"), { variant: "success" });
    } catch (error) {
      log.error(error);
      enqueueSnackbar((error as Error).toString(), { variant: "error" });
    }
  }, [enqueueSnackbar, signOut, t]);

  const onSignoutClick = useCallback(() => {
    void confirm({
      title: t("signOutConfirmTitle"),
      ok: t("signOut"),
    }).then((response) => {
      if (response === "ok") {
        void beginSignOut();
      }
    });
  }, [beginSignOut, confirm, t]);

  const onSignInClick = useCallback(() => {
    setAuthDialogOpen(true);
  }, []);

  const handleAuthDialogClose = useCallback(() => {
    setAuthDialogOpen(false);
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <Stack fullHeight justifyContent="center" alignItems="center">
        <CircularProgress size={24} />
      </Stack>
    );
  }

  // Show sign in button if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <Stack fullHeight justifyContent="center" gap={2}>
        {confirmModal}
        <AuthDialog open={authDialogOpen} onClose={handleAuthDialogClose} />
        <Stack gap={2} alignItems="center">
          <BlockheadFilledIcon className={classes.icon} />
          <Typography variant="body2" color="text.secondary">
            {t("signInDescription")}
          </Typography>
          <Button variant="contained" onClick={onSignInClick}>
            {t("signIn")}
          </Button>
        </Stack>
      </Stack>
    );
  }

  // Show user info if authenticated
  return (
    <Stack fullHeight justifyContent="space-between">
      {confirmModal}
      <Stack gap={2}>
        <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
          <BlockheadFilledIcon className={classes.icon} />
          <Stack justifyContent="center">
            <Typography variant="subtitle1">{user.name ?? user.email}</Typography>
            <Typography variant="body2" color="text.secondary">
              {user.email}
            </Typography>
          </Stack>
        </Stack>
      </Stack>
      <Stack gap={1}>
        <Button onClick={onSignoutClick} variant="outlined" disabled={signingOut}>
          {t("signOut")}&nbsp;{signingOut && <CircularProgress size={16} />}
        </Button>
      </Stack>
    </Stack>
  );
}
