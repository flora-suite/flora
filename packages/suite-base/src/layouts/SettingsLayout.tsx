// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ArrowBackOutlined } from "@mui/icons-material";
import { Link, ListItemText, MenuItem, MenuList, Typography } from "@mui/material";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useLocation, useNavigate } from "react-router";
import { makeStyles } from "tss-react/mui";

import { DashboardAppBar } from "@lichtblick/suite-base/components/AppBar";
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
  sidebar: {
    width: 240,
    [theme.breakpoints.up("md")]: {
      width: 260,
    },
    borderRight: `1px solid ${theme.palette.divider}`,
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
  },
  backLink: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    padding: theme.spacing(2),
    color: theme.palette.primary.main,
    cursor: "pointer",
    textDecoration: "none",
    "&:hover": {
      textDecoration: "underline",
    },
  },
  sectionHeader: {
    padding: theme.spacing(0, 2),
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(0.5),
  },
  menuItem: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    "&.Mui-selected": {
      backgroundColor: theme.palette.action.selected,
    },
  },
  main: {
    flex: "1 1 auto",
    overflowY: "auto",
    overflowX: "hidden",
    backgroundColor: theme.palette.background.default,
  },
}));

export function SettingsLayout(): React.JSX.Element {
  const { classes } = useStyles();
  const { t } = useTranslation("appSettings");
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = useCallback(
    (path: string) => {
      void navigate(path);
    },
    [navigate],
  );

  const handleBackToDashboard = useCallback(() => {
    void navigate("/");
  }, [navigate]);

  // Determine which settings page is active
  const isActive = (path: string) => {
    if (path === "/settings" || path === "/settings/general") {
      return location.pathname === "/settings" || location.pathname === "/settings/general";
    }
    return location.pathname === path;
  };

  return (
    <Stack className={classes.root}>
      <DashboardAppBar />
      <Stack className={classes.body}>
        <div className={classes.sidebar}>
          <Link
            component="button"
            className={classes.backLink}
            onClick={handleBackToDashboard}
          >
            <ArrowBackOutlined fontSize="small" />
            <Typography variant="body2">{t("backToDashboard")}</Typography>
          </Link>

          <MenuList>
            <Typography
              variant="overline"
              color="text.secondary"
              className={classes.sectionHeader}
            >
              {t("userSettings")}
            </Typography>
            <MenuItem
              selected={isActive("/settings") || isActive("/settings/general")}
              className={classes.menuItem}
              onClick={() => {
                handleNavigate("/settings/general");
              }}
            >
              <ListItemText>{t("general")}</ListItemText>
            </MenuItem>
            <MenuItem
              selected={isActive("/settings/extensions")}
              className={classes.menuItem}
              onClick={() => {
                handleNavigate("/settings/extensions");
              }}
            >
              <ListItemText>{t("extensions")}</ListItemText>
            </MenuItem>
            <MenuItem
              selected={isActive("/settings/experimental")}
              className={classes.menuItem}
              onClick={() => {
                handleNavigate("/settings/experimental");
              }}
            >
              <ListItemText>{t("experimentalFeatures")}</ListItemText>
            </MenuItem>
            <MenuItem
              selected={isActive("/settings/about")}
              className={classes.menuItem}
              onClick={() => {
                handleNavigate("/settings/about");
              }}
            >
              <ListItemText>{t("about")}</ListItemText>
            </MenuItem>
          </MenuList>
        </div>
        <Stack className={classes.main}>
          <Outlet />
        </Stack>
      </Stack>
    </Stack>
  );
}
