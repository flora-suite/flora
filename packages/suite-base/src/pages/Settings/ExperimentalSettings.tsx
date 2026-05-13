// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { Alert, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { makeStyles } from "tss-react/mui";

import { ExperimentalFeatureSettings } from "@lichtblick/suite-base/components/ExperimentalFeatureSettings";
import Stack from "@lichtblick/suite-base/components/Stack";

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

export function ExperimentalSettings(): React.JSX.Element {
  const { classes } = useStyles();
  const { t } = useTranslation("appSettings");

  return (
    <div className={classes.root}>
      <Stack gap={2} className={classes.section}>
        <Typography variant="h5" gutterBottom>
          {t("experimentalFeatures")}
        </Typography>
        <Alert color="warning" icon={<WarningAmberIcon />}>
          {t("experimentalFeaturesDescription")}
        </Alert>
        <Stack paddingLeft={2}>
          <ExperimentalFeatureSettings />
        </Stack>
      </Stack>
    </div>
  );
}
