// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Checkbox, FormControlLabel, FormLabel, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { makeStyles } from "tss-react/mui";

import { AppSetting } from "@lichtblick/suite-base/AppSetting";
import Stack from "@lichtblick/suite-base/components/Stack";
import { useAppConfigurationValue } from "@lichtblick/suite-base/hooks/useAppConfigurationValue";
import isDesktopApp from "@lichtblick/suite-base/util/isDesktopApp";

import {
  AutoUpdate,
  ColorSchemeSettings,
  LanguageSettings,
  LaunchDefault,
  MessageFramerate,
  RosPackagePath,
  TimeFormat,
  TimezoneSettings,
} from "./settings";

const useStyles = makeStyles()((theme) => ({
  root: {
    padding: theme.spacing(3),
    overflowY: "auto",
    height: "100%",
  },
  section: {
    maxWidth: 600,
  },
  formControlLabel: {
    "&.MuiFormControlLabel-root": {
      alignItems: "start",
    },
  },
  checkbox: {
    "&.MuiCheckbox-root": {
      paddingTop: 0,
    },
  },
}));

// Check if we're on a supported update platform
const supportsAppUpdates = (): boolean => {
  if (!isDesktopApp()) {
    return false;
  }
  // electron-updater does not provide a way to detect if we are on a supported update platform
  // Linux with .deb package is not supported for auto-updates
  if (typeof navigator !== "undefined" && navigator.userAgent.includes("Linux")) {
    return false;
  }
  return true;
};

export function GeneralSettings(): React.JSX.Element {
  const { classes } = useStyles();
  const { t } = useTranslation("appSettings");
  const [debugModeEnabled = false, setDebugModeEnabled] = useAppConfigurationValue<boolean>(
    AppSetting.SHOW_DEBUG_PANELS,
  );

  return (
    <div className={classes.root}>
      <Stack gap={3} className={classes.section}>
        <Typography variant="h5" gutterBottom>
          {t("general")}
        </Typography>
        <ColorSchemeSettings />
        <TimezoneSettings />
        <TimeFormat orientation="horizontal" />
        <MessageFramerate />
        <LanguageSettings />
        {supportsAppUpdates() && <AutoUpdate />}
        {!isDesktopApp() && <LaunchDefault />}
        {isDesktopApp() && <RosPackagePath />}
        <Stack>
          <FormLabel>{t("advanced")}:</FormLabel>
          <FormControlLabel
            className={classes.formControlLabel}
            control={
              <Checkbox
                className={classes.checkbox}
                checked={debugModeEnabled}
                onChange={(_, checked) => {
                  void setDebugModeEnabled(checked);
                }}
              />
            }
            label={t("debugModeDescription")}
          />
        </Stack>
      </Stack>
    </div>
  );
}
