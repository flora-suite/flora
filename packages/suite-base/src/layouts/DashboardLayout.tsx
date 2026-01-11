// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Outlet } from "react-router";
import { makeStyles } from "tss-react/mui";

import { DashboardAppBar } from "@lichtblick/suite-base/components/AppBar";
import { Sidebar } from "@lichtblick/suite-base/components/Sidebar";
import Stack from "@lichtblick/suite-base/components/Stack";

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
}));

export function DashboardLayout(): React.JSX.Element {
  const { classes } = useStyles();

  return (
    <Stack className={classes.root}>
      <DashboardAppBar />
      <Stack className={classes.body}>
        <Sidebar />
        <Stack className={classes.main}>
          <Outlet />
        </Stack>
      </Stack>
    </Stack>
  );
}
