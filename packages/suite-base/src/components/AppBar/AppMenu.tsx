// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  FolderOpenRegular,
  LinkRegular,
  HomeRegular,
  GridRegular,
  RecordRegular,
  BookmarkRegular,
  TextBulletListSquareRegular,
  SlideLayoutRegular,
  DocumentRegular,
} from "@fluentui/react-icons";
import {
  Divider,
  Link,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  PaperProps,
  PopoverPosition,
  PopoverReference,
  Typography,
} from "@mui/material";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { makeStyles } from "tss-react/mui";

import TextMiddleTruncate from "@lichtblick/suite-base/components/TextMiddleTruncate";
import { usePlayerSelection } from "@lichtblick/suite-base/context/PlayerSelectionContext";
import { useWorkspaceActions } from "@lichtblick/suite-base/context/Workspace/useWorkspaceActions";
import { formatKeyboardShortcut } from "@lichtblick/suite-base/util/formatKeyboardShortcut";

export type AppMenuProps = {
  handleClose: () => void;
  anchorEl?: HTMLElement;
  anchorReference?: PopoverReference;
  anchorPosition?: PopoverPosition;
  disablePortal?: boolean;
  open: boolean;
};

const useStyles = makeStyles()((theme) => ({
  menuList: {
    minWidth: 280,
    maxWidth: 320,
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
  },
  menuItem: {
    gap: theme.spacing(1.5),
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    minHeight: 30,
    "&.Mui-disabled": {
      opacity: 1,
      "& .MuiListItemText-root": {
        color: theme.palette.text.secondary,
      },
      "& .MuiListItemIcon-root": {
        color: theme.palette.text.secondary,
      },
    },
  },
  sectionHeader: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(0.5),
  },
  sectionHeaderText: {
    fontSize: "0.7rem",
    fontWeight: 600,
    letterSpacing: "0.08em",
    color: theme.palette.text.secondary,
  },
  shortcut: {
    marginLeft: "auto",
    color: theme.palette.text.disabled,
    fontSize: "0.75rem",
  },
  listItemIcon: {
    minWidth: "unset",
    color: theme.palette.primary.main,
  },
  upgradeBox: {
    margin: theme.spacing(1, 2),
    padding: theme.spacing(1.5),
    backgroundColor: theme.palette.action.hover,
    borderRadius: theme.shape.borderRadius,
  },
  upgradeLink: {
    color: theme.palette.primary.main,
    textDecoration: "none",
    fontWeight: 500,
    "&:hover": {
      textDecoration: "underline",
    },
  },
  truncate: {
    alignSelf: "center !important",
  },
  recentIcon: {
    color: theme.palette.primary.main,
  },
}));

export function AppMenu(props: AppMenuProps): React.JSX.Element {
  const { open, handleClose, anchorEl, anchorReference, anchorPosition, disablePortal } = props;
  const { classes } = useStyles();
  const { t } = useTranslation("appBar");
  const { t: tDialog } = useTranslation("openDialog");
  const navigate = useNavigate();

  const { recentSources, selectRecent } = usePlayerSelection();
  const { dialogActions } = useWorkspaceActions();

  const handleMenuClose = useCallback(() => {
    handleClose();
  }, [handleClose]);

  const handleOpenLocalFile = useCallback(() => {
    handleMenuClose();
    dialogActions.openFile.open().catch((err: unknown) => {
      console.error(err);
    });
  }, [dialogActions.openFile, handleMenuClose]);

  const handleOpenConnection = useCallback(() => {
    dialogActions.dataSource.open("connection");
    handleMenuClose();
  }, [dialogActions.dataSource, handleMenuClose]);

  const handleNavigate = useCallback(
    (path: string) => {
      void navigate(path);
      handleMenuClose();
    },
    [navigate, handleMenuClose],
  );

  const handleSelectRecent = useCallback(
    (recentId: string) => {
      selectRecent(recentId);
      handleMenuClose();
    },
    [selectRecent, handleMenuClose],
  );

  const recentItems = useMemo(() => {
    return recentSources.slice(0, 5);
  }, [recentSources]);

  const getRecentIcon = useCallback(
    (recent: (typeof recentSources)[0]) => {
      // Check if it's a connection (websocket, etc.) based on title
      if (recent.title.startsWith("ws://") || recent.title.startsWith("wss://")) {
        return <LinkRegular className={classes.recentIcon} />;
      }
      // Default to file icon
      return <DocumentRegular className={classes.recentIcon} />;
    },
    [classes.recentIcon],
  );

  return (
    <Menu
      anchorEl={anchorEl}
      anchorReference={anchorReference}
      anchorPosition={anchorPosition}
      disablePortal={disablePortal}
      id="app-menu"
      open={open}
      disableAutoFocusItem
      onClose={handleMenuClose}
      slotProps={{
        list: {
          "aria-labelledby": "app-menu-button",
          dense: true,
          className: classes.menuList,
        },
        paper: {
          "data-tourid": "app-menu",
        } as Partial<PaperProps & { "data-tourid"?: string }>,
      }}
    >
      {/* OPEN DATA SOURCES Section */}
      <div className={classes.sectionHeader}>
        <Typography className={classes.sectionHeaderText}>
          {tDialog("openDataSources").toUpperCase()}
        </Typography>
      </div>
      <MenuItem
        className={classes.menuItem}
        onClick={handleOpenLocalFile}
        data-testid="menu-item-open-local-file"
      >
        <ListItemIcon className={classes.listItemIcon}>
          <FolderOpenRegular />
        </ListItemIcon>
        <ListItemText>{t("openLocalFiles")}</ListItemText>
        <Typography className={classes.shortcut}>
          {formatKeyboardShortcut("O", ["Meta"])}
        </Typography>
      </MenuItem>
      <MenuItem
        className={classes.menuItem}
        onClick={handleOpenConnection}
        data-testid="menu-item-open-connection"
      >
        <ListItemIcon className={classes.listItemIcon}>
          <LinkRegular />
        </ListItemIcon>
        <ListItemText>{t("openConnection")}</ListItemText>
        <Typography className={classes.shortcut}>
          {formatKeyboardShortcut("O", ["Meta", "Shift"])}
        </Typography>
      </MenuItem>

      <Divider />

      {/* BROWSE Section */}
      <div className={classes.sectionHeader}>
        <Typography className={classes.sectionHeaderText}>
          {tDialog("browse").toUpperCase()}
        </Typography>
      </div>
      <MenuItem
        className={classes.menuItem}
        onClick={() => {
          handleNavigate("/");
        }}
      >
        <ListItemIcon className={classes.listItemIcon}>
          <HomeRegular />
        </ListItemIcon>
        <ListItemText>{tDialog("dashboard")}</ListItemText>
      </MenuItem>
      <MenuItem
        className={classes.menuItem}
        onClick={() => {
          handleNavigate("/devices");
        }}
      >
        <ListItemIcon className={classes.listItemIcon}>
          <GridRegular />
        </ListItemIcon>
        <ListItemText>{tDialog("devices")}</ListItemText>
      </MenuItem>
      <MenuItem
        className={classes.menuItem}
        onClick={() => {
          handleNavigate("/recordings");
        }}
      >
        <ListItemIcon className={classes.listItemIcon}>
          <RecordRegular />
        </ListItemIcon>
        <ListItemText>{tDialog("recordings")}</ListItemText>
      </MenuItem>
      <MenuItem
        className={classes.menuItem}
        onClick={() => {
          handleNavigate("/events");
        }}
      >
        <ListItemIcon className={classes.listItemIcon}>
          <BookmarkRegular />
        </ListItemIcon>
        <ListItemText>{tDialog("events")}</ListItemText>
      </MenuItem>
      <MenuItem
        className={classes.menuItem}
        onClick={() => {
          handleNavigate("/timeline");
        }}
      >
        <ListItemIcon className={classes.listItemIcon}>
          <TextBulletListSquareRegular />
        </ListItemIcon>
        <ListItemText>{tDialog("timeline")}</ListItemText>
      </MenuItem>

      <Divider />

      <MenuItem
        className={classes.menuItem}
        onClick={() => {
          handleNavigate("/layouts");
        }}
      >
        <ListItemIcon className={classes.listItemIcon}>
          <SlideLayoutRegular />
        </ListItemIcon>
        <ListItemText>{tDialog("layouts")}</ListItemText>
      </MenuItem>

      {/* RECENTLY VIEWED Section */}
      {recentItems.length > 0 && (
        <>
          <Divider />
          <div className={classes.sectionHeader}>
            <Typography className={classes.sectionHeaderText}>
              {tDialog("recentlyViewed").toUpperCase()}
            </Typography>
          </div>
          {recentItems.map((recent) => (
            <MenuItem
              key={recent.id}
              className={classes.menuItem}
              onClick={() => {
                handleSelectRecent(recent.id);
              }}
            >
              <ListItemIcon className={classes.listItemIcon}>{getRecentIcon(recent)}</ListItemIcon>
              <ListItemText>
                <TextMiddleTruncate text={recent.title} className={classes.truncate} />
              </ListItemText>
            </MenuItem>
          ))}
        </>
      )}

      {/* Upgrade Prompt */}
      <div className={classes.upgradeBox}>
        <Typography variant="body2">
          <Link href="#" target="_blank" rel="noopener noreferrer" className={classes.upgradeLink}>
            {tDialog("upgradeYourPlan")}
          </Link>{" "}
          {tDialog("upgradeDescription")}
        </Typography>
      </div>
    </Menu>
  );
}
