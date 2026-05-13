// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  BookmarksOutlined,
  FolderOpenOutlined,
  GridViewOutlined,
  HomeOutlined,
  InsertLinkOutlined,
  LineStyleOutlined,
  StopCircleOutlined,
  ViewQuiltOutlined,
} from "@mui/icons-material";
import {
  Divider,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  Typography,
  useTheme,
} from "@mui/material";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";
import { makeStyles } from "tss-react/mui";

import Stack from "@lichtblick/suite-base/components/Stack";
import { useWorkspaceActions } from "@lichtblick/suite-base/context/Workspace/useWorkspaceActions";
import { formatKeyboardShortcut } from "@lichtblick/suite-base/util/formatKeyboardShortcut";

const useStyles = makeStyles()((theme) => ({
  root: {
    width: 240,
    [theme.breakpoints.up("md")]: {
      width: 260,
    },
    borderRight: `1px solid ${theme.palette.divider}`,
    flexShrink: 0,
  },
  menuItem: {
    "& .MuiListItemIcon-root": {
      color: theme.palette.text.secondary,
    },
    "&.Mui-selected .MuiListItemIcon-root": {
      color: theme.palette.primary.main,
    },
    "&.Mui-disabled": {
      opacity: 1,
      "& .MuiTypography-root": {
        color: theme.palette.text.secondary,
      },
      "& .MuiListItemIcon-root": {
        color: theme.palette.text.secondary,
      },
    },
  },
}));

export function Sidebar(): React.JSX.Element {
  const { classes } = useStyles();
  const theme = useTheme();
  const { t } = useTranslation("openDialog");
  const navigate = useNavigate();
  const location = useLocation();
  const { dialogActions } = useWorkspaceActions();

  const handleOpenLocalFile = useCallback(() => {
    dialogActions.openFile
      .open()
      .then((opened) => {
        if (opened) {
          void navigate("/view");
        }
      })
      .catch((err: unknown) => {
        console.error(err);
      });
  }, [dialogActions.openFile, navigate]);

  const handleOpenConnection = useCallback(() => {
    dialogActions.dataSource.open("connection");
    void navigate("/view");
  }, [dialogActions.dataSource, navigate]);

  const handleNavigate = useCallback(
    (path: string) => {
      void navigate(path);
    },
    [navigate],
  );

  return (
    <Stack className={classes.root}>
      <MenuList style={{ padding: theme.spacing(2) }}>
        <MenuItem disabled>
          <Typography variant="overline">{t("openDataSource")}</Typography>
        </MenuItem>
        <MenuItem onClick={handleOpenLocalFile} className={classes.menuItem}>
          <ListItemIcon>
            <FolderOpenOutlined />
          </ListItemIcon>
          <ListItemText>{t("openLocalFiles")}</ListItemText>
          <Typography variant="body2" color="text.secondary">
            {formatKeyboardShortcut("O", ["Meta"])}
          </Typography>
        </MenuItem>
        <MenuItem onClick={handleOpenConnection} className={classes.menuItem}>
          <ListItemIcon>
            <InsertLinkOutlined />
          </ListItemIcon>
          <ListItemText>{t("openConnection")}</ListItemText>
          <Typography variant="body2" color="text.secondary">
            {formatKeyboardShortcut("O", ["Meta", "Shift"])}
          </Typography>
        </MenuItem>
        <Divider style={{ marginTop: theme.spacing(1), marginBottom: theme.spacing(1) }} />
        <MenuItem disabled>
          <Typography variant="overline">{t("browse")}</Typography>
        </MenuItem>
        <MenuItem
          selected={location.pathname === "/"}
          className={classes.menuItem}
          onClick={() => {
            handleNavigate("/");
          }}
        >
          <ListItemIcon>
            <HomeOutlined />
          </ListItemIcon>
          <ListItemText>{t("dashboard")}</ListItemText>
        </MenuItem>
        <MenuItem
          selected={location.pathname === "/devices"}
          className={classes.menuItem}
          onClick={() => {
            handleNavigate("/devices");
          }}
        >
          <ListItemIcon>
            <GridViewOutlined />
          </ListItemIcon>
          <ListItemText>{t("devices")}</ListItemText>
        </MenuItem>
        <MenuItem
          selected={location.pathname === "/recordings"}
          className={classes.menuItem}
          onClick={() => {
            handleNavigate("/recordings");
          }}
        >
          <ListItemIcon>
            <StopCircleOutlined />
          </ListItemIcon>
          <ListItemText>{t("recordings")}</ListItemText>
        </MenuItem>
        <MenuItem
          selected={location.pathname === "/events"}
          className={classes.menuItem}
          onClick={() => {
            handleNavigate("/events");
          }}
        >
          <ListItemIcon>
            <BookmarksOutlined />
          </ListItemIcon>
          <ListItemText>{t("events")}</ListItemText>
        </MenuItem>
        <MenuItem
          selected={location.pathname === "/timeline"}
          className={classes.menuItem}
          onClick={() => {
            handleNavigate("/timeline");
          }}
        >
          <ListItemIcon>
            <LineStyleOutlined />
          </ListItemIcon>
          <ListItemText>{t("timeline")}</ListItemText>
        </MenuItem>
        <MenuItem
          selected={location.pathname === "/layouts"}
          className={classes.menuItem}
          onClick={() => {
            handleNavigate("/layouts");
          }}
        >
          <ListItemIcon>
            <ViewQuiltOutlined />
          </ListItemIcon>
          <ListItemText>{t("layouts")}</ListItemText>
        </MenuItem>
      </MenuList>
    </Stack>
  );
}
