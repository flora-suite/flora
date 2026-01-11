// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { makeStyles } from "tss-react/mui";

import ExtensionsSettings from "@lichtblick/suite-base/components/ExtensionsSettings";
import Stack from "@lichtblick/suite-base/components/Stack";
import { useAppContext } from "@lichtblick/suite-base/context/AppContext";

const useStyles = makeStyles()((theme) => ({
  root: {
    padding: theme.spacing(3),
    overflowY: "auto",
    height: "100%",
  },
  section: {
    maxWidth: 600,
  },
}));

export function ExtensionsSettingsPage(): React.JSX.Element {
  const { classes } = useStyles();
  const { t } = useTranslation("appSettings");
  const { extensionSettings } = useAppContext();

  const extensionSettingsComponent = extensionSettings ?? <ExtensionsSettings />;

  return (
    <div className={classes.root}>
      <Stack gap={2} className={classes.section}>
        <Typography variant="h5" gutterBottom>
          {t("extensions")}
        </Typography>
        {extensionSettingsComponent}
      </Stack>
    </div>
  );
}
