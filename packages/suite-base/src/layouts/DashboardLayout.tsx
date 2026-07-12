// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Typography } from "@mui/material";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useLocation } from "react-router";
import { makeStyles } from "tss-react/mui";

import { DashboardAppBar } from "@lichtblick/suite-base/components/AppBar";
import { Sidebar } from "@lichtblick/suite-base/components/Sidebar";
import Stack from "@lichtblick/suite-base/components/Stack";
import { useSharedRootContext } from "@lichtblick/suite-base/context/SharedRootContext";

const useStyles = makeStyles()((theme) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  body: {
    display: "flex",
    flex: "1 1 auto",
    flexDirection: "column",
    overflowY: "hidden",
    [theme.breakpoints.up("sm")]: {
      flexDirection: "row",
    },
  },
  main: {
    flex: "1 1 auto",
    overflowY: "auto",
    overflowX: "hidden",
    backgroundColor: theme.palette.background.default,
  },
  pageTitle: {
    fontWeight: 600,
  },
}));

export function DashboardLayout(): React.JSX.Element {
  const { classes } = useStyles();
  const { t } = useTranslation("pages");
  const location = useLocation();
  const { appBarLeftInset, onAppBarDoubleClick } = useSharedRootContext();

  const pageTitle = useMemo(() => {
    const path = location.pathname;

    if (path === "/" || path === "") {
      return t("dashboardTitle");
    }
    if (path === "/devices" || path.startsWith("/devices/")) {
      return t("devicesTitle");
    }
    if (path === "/recordings") {
      return t("recordingsTitle");
    }
    if (path === "/events") {
      return t("eventsTitle");
    }
    if (path === "/timeline") {
      return t("timelineTitle");
    }
    if (path === "/layouts") {
      return t("layoutsTitle");
    }
    return "";
  }, [location.pathname, t]);

  return (
    <Stack className={classes.root}>
      <DashboardAppBar leftInset={appBarLeftInset} onDoubleClick={onAppBarDoubleClick}>
        <Typography variant="subtitle1" className={classes.pageTitle}>
          {pageTitle}
        </Typography>
      </DashboardAppBar>
      <Stack className={classes.body}>
        <Sidebar />
        <Stack className={classes.main}>
          <Outlet />
        </Stack>
      </Stack>
    </Stack>
  );
}
