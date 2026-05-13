// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { LockOutlined } from "@mui/icons-material";
import { Button, Typography } from "@mui/material";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { makeStyles } from "tss-react/mui";

import { AuthDialog } from "@lichtblick/suite-base/components/AuthDialog";
import Stack from "@lichtblick/suite-base/components/Stack";

const useStyles = makeStyles()((theme) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    minHeight: 400,
    textAlign: "center",
    gap: theme.spacing(2),
    padding: theme.spacing(3),
  },
  icon: {
    fontSize: 80,
    color: theme.palette.text.disabled,
  },
}));

export type LoginRequiredPlaceholderProps = {
  /** Custom title to display (optional, defaults to "Login Required") */
  title?: string;
  /** Custom description to display (optional, defaults to standard message) */
  description?: string;
};

/**
 * A placeholder component to display when user needs to be logged in to access a feature.
 * Provides a consistent UI across all protected pages with a button to open login dialog.
 */
export function LoginRequiredPlaceholder({
  title,
  description,
}: LoginRequiredPlaceholderProps): React.JSX.Element {
  const { classes } = useStyles();
  const { t } = useTranslation("pages");

  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  const handleOpenAuthDialog = useCallback(() => {
    setAuthDialogOpen(true);
  }, []);

  const handleCloseAuthDialog = useCallback(() => {
    setAuthDialogOpen(false);
  }, []);

  return (
    <>
      <Stack className={classes.root}>
        <LockOutlined className={classes.icon} />
        <Typography variant="h6" color="text.secondary">
          {title ?? t("loginRequired")}
        </Typography>
        <Typography variant="body2" color="text.secondary" maxWidth={400}>
          {description ?? t("loginRequiredDescription")}
        </Typography>
        <Button variant="contained" onClick={handleOpenAuthDialog}>
          {t("goToLogin")}
        </Button>
      </Stack>
      <AuthDialog open={authDialogOpen} onClose={handleCloseAuthDialog} />
    </>
  );
}
