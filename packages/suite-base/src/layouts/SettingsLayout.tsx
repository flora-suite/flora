// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ArrowBackOutlined, BusinessOutlined } from "@mui/icons-material";
import { Link, ListItemText, MenuItem, MenuList, Typography } from "@mui/material";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useLocation, useNavigate } from "react-router";
import { makeStyles } from "tss-react/mui";

import { DashboardAppBar } from "@lichtblick/suite-base/components/AppBar";
import Stack from "@lichtblick/suite-base/components/Stack";
import { useCurrentOrganization } from "@lichtblick/suite-base/context/OrganizationContext";
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
  orgHeader: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    padding: theme.spacing(1.5, 2),
    marginTop: theme.spacing(1),
  },
  orgIcon: {
    width: 32,
    height: 32,
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  menuItem: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    "&.Mui-selected": {
      backgroundColor: theme.palette.action.selected,
    },
  },
  orgMenuItem: {
    paddingLeft: theme.spacing(4),
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
  const currentOrganization = useCurrentOrganization();
  const { appBarLeftInset, onAppBarDoubleClick } = useSharedRootContext();

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

  // Check if any organization settings page is active
  const isOrgSettingsActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <Stack className={classes.root}>
      <DashboardAppBar leftInset={appBarLeftInset} onDoubleClick={onAppBarDoubleClick} />
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

          {/* Organization Settings - only show when an organization is selected */}
          {currentOrganization != undefined && (
            <MenuList>
              <div className={classes.orgHeader}>
                <div className={classes.orgIcon}>
                  <BusinessOutlined fontSize="small" />
                </div>
                <Stack>
                  <Typography variant="body2" fontWeight={600}>
                    {currentOrganization.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t("organizationSettings")}
                  </Typography>
                </Stack>
              </div>
              <MenuItem
                selected={isOrgSettingsActive("/settings/organization")}
                className={classes.orgMenuItem}
                onClick={() => {
                  handleNavigate("/settings/organization");
                }}
              >
                <ListItemText>{t("general")}</ListItemText>
              </MenuItem>
              <MenuItem
                selected={isOrgSettingsActive("/settings/organization/members")}
                className={classes.orgMenuItem}
                onClick={() => {
                  handleNavigate("/settings/organization/members");
                }}
              >
                <ListItemText>{t("members")}</ListItemText>
              </MenuItem>
              <MenuItem
                selected={isOrgSettingsActive("/settings/organization/api-keys")}
                className={classes.orgMenuItem}
                onClick={() => {
                  handleNavigate("/settings/organization/api-keys");
                }}
              >
                <ListItemText>{t("apiKeys")}</ListItemText>
              </MenuItem>
              <MenuItem
                selected={isOrgSettingsActive("/settings/organization/extensions")}
                className={classes.orgMenuItem}
                onClick={() => {
                  handleNavigate("/settings/organization/extensions");
                }}
              >
                <ListItemText>{t("extensions")}</ListItemText>
              </MenuItem>
            </MenuList>
          )}
        </div>
        <Stack className={classes.main}>
          <Outlet />
        </Stack>
      </Stack>
    </Stack>
  );
}
