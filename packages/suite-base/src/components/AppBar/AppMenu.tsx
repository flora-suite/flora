// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { FileOpenOutlined, FolderOpenOutlined, InsertLinkOutlined } from '@mui/icons-material';
import { Menu, PaperProps, PopoverPosition, PopoverReference } from "@mui/material";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { makeStyles } from "tss-react/mui";

import TextMiddleTruncate from "@lichtblick/suite-base/components/TextMiddleTruncate";
import { usePlayerSelection } from "@lichtblick/suite-base/context/PlayerSelectionContext";
import { useWorkspaceActions } from "@lichtblick/suite-base/context/Workspace/useWorkspaceActions";
import { formatKeyboardShortcut } from "@lichtblick/suite-base/util/formatKeyboardShortcut";

import { NestedMenuItem } from "./NestedMenuItem";
import { AppBarMenuItem } from "./types";

export type AppMenuProps = {
  handleClose: () => void;
  anchorEl?: HTMLElement;
  anchorReference?: PopoverReference;
  anchorPosition?: PopoverPosition;
  disablePortal?: boolean;
  open: boolean;
};

const useStyles = makeStyles()({
  menuList: {
    minWidth: 240,
    maxWidth: 280,
  },
  truncate: {
    alignSelf: "center !important",
  },
});

export function AppMenu(props: AppMenuProps): JSX.Element {
  const { open, handleClose, anchorEl, anchorReference, anchorPosition, disablePortal } = props;
  const { classes } = useStyles();
  const { t } = useTranslation("appBar");


  const { recentSources, selectRecent } = usePlayerSelection();

  const { dialogActions } = useWorkspaceActions();

  // menu

  const fileItems = useMemo(() => {
    const items: AppBarMenuItem[] = [
      {
        type: "subheader",
        label: t("openDataSources"),
        key: "OpenDataSources"
      },
      {
        type: "item",
        label: t("open"),
        key: "open",
        dataTestId: "menu-item-open",
        icon: <FolderOpenOutlined />,
        onClick: () => {
          dialogActions.dataSource.open("start");
          handleClose();
        },
      },
      {
        type: "item",
        label: t("openLocalFile"),
        key: "open-file",
        shortcut: formatKeyboardShortcut("O", ["Meta"]),
        dataTestId: "menu-item-open-local-file",
        icon: <FileOpenOutlined />,
        onClick: () => {
          dialogActions.openFile.open().catch(console.error);
          handleClose();
        },
      },
      {
        type: "item",
        label: t("openConnection"),
        key: "open-connection",
        shortcut: formatKeyboardShortcut("O", ["Meta", "Shift"]),
        dataTestId: "menu-item-open-connection",
        icon: <InsertLinkOutlined />,
        onClick: () => {
          dialogActions.dataSource.open("connection");
          handleClose();
        },
      },
      { type: "divider" },
      { type: "item", label: t("recentDataSources"), key: "recent-sources", disabled: true },
    ];

    recentSources.slice(0, 10).map((recent) => {
      items.push({
        type: "item",
        key: recent.id,
        onClick: () => {
          selectRecent(recent.id);
          handleClose();
        },
        label: <TextMiddleTruncate text={recent.title} className={classes.truncate} />,
      });
    });

    return items;
  }, [classes.truncate, dialogActions.dataSource, dialogActions.openFile, handleClose, recentSources, selectRecent, t]);

  // VIEW

  // const viewItems = useMemo<AppBarMenuItem[]>(
  //   () => [
  //     {
  //       type: "item",
  //       label: leftSidebarOpen ? t("hideLeftSidebar") : t("showLeftSidebar"),
  //       key: "left-sidebar",
  //       shortcut: "[",
  //       onClick: () => {
  //         sidebarActions.left.setOpen(!leftSidebarOpen);
  //         handleNestedMenuClose();
  //       },
  //     },
  //     {
  //       type: "item",
  //       label: rightSidebarOpen ? t("hideRightSidebar") : t("showRightSidebar"),
  //       key: "right-sidebar",
  //       shortcut: "]",
  //       onClick: () => {
  //         sidebarActions.right.setOpen(!rightSidebarOpen);
  //         handleNestedMenuClose();
  //       },
  //     },
  //     {
  //       type: "divider",
  //     },
  //     {
  //       type: "item",
  //       label: t("importLayoutFromFile"),
  //       key: "import-layout",
  //       onClick: () => {
  //         layoutActions.importFromFile();
  //         handleNestedMenuClose();
  //       },
  //     },
  //     {
  //       type: "item",
  //       label: t("exportLayoutToFile"),
  //       key: "export-layout",
  //       onClick: () => {
  //         layoutActions.exportToFile();
  //         handleNestedMenuClose();
  //       },
  //     },
  //   ],
  //   [
  //     handleNestedMenuClose,
  //     layoutActions,
  //     leftSidebarOpen,
  //     rightSidebarOpen,
  //     sidebarActions.left,
  //     sidebarActions.right,
  //     t,
  //   ],
  // );

  // HELP

  // const onAboutClick = useCallback(() => {
  //   dialogActions.preferences.open("about");
  //   handleNestedMenuClose();
  // }, [dialogActions.preferences, handleNestedMenuClose]);

  // const onDemoClick = useCallback(() => {
  //   dialogActions.dataSource.open("demo");
  //   handleNestedMenuClose();
  // }, [dialogActions.dataSource, handleNestedMenuClose]);

  // const helpItems = useMemo<AppBarMenuItem[]>(
  //   () => [
  //     { type: "item", key: "about", label: t("about"), onClick: onAboutClick },
  //     { type: "divider" },
  //     { type: "item", key: "demo", label: t("exploreSampleData"), onClick: onDemoClick },
  //   ],
  //   [onAboutClick, onDemoClick, t],
  // );

  return (
    <>
      <Menu
        anchorEl={anchorEl}
        anchorReference={anchorReference}
        anchorPosition={anchorPosition}
        disablePortal={disablePortal}
        id="app-menu"
        open={open}
        onClose={handleClose}
        autoFocus={false}
        disableAutoFocusItem
        MenuListProps={{
          "aria-labelledby": "app-menu-button",
          dense: true,
          className: classes.menuList,
        }}
        PaperProps={
          {
            "data-tourid": "app-menu",
          } as Partial<PaperProps & { "data-tourid"?: string }>
        }
      >
        <NestedMenuItem
          items={fileItems}
        >
          {t("file")}
        </NestedMenuItem>
      </Menu >
    </>
  );
}
