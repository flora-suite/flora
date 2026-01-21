// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import SearchIcon from "@mui/icons-material/Search";
import {
  CircularProgress,
  Divider,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemText,
  TextField,
} from "@mui/material";
import * as _ from "lodash-es";
import moment from "moment";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import useAsyncFn from "react-use/lib/useAsyncFn";
import { makeStyles } from "tss-react/mui";

import LayoutSection from "@lichtblick/suite-base/components/LayoutBrowser/LayoutSection";
import Stack from "@lichtblick/suite-base/components/Stack";
import { useAnalytics } from "@lichtblick/suite-base/context/AnalyticsContext";
import {
  LayoutState,
  useCurrentLayoutSelector,
} from "@lichtblick/suite-base/context/CurrentLayoutContext";
import { LayoutData } from "@lichtblick/suite-base/context/CurrentLayoutContext/actions";
import { useLayoutManager } from "@lichtblick/suite-base/context/LayoutManagerContext";
import useCallbackWithToast from "@lichtblick/suite-base/hooks/useCallbackWithToast";
import { useLayoutActions } from "@lichtblick/suite-base/hooks/useLayoutActions";
import { useLayoutNavigation } from "@lichtblick/suite-base/hooks/useLayoutNavigation";
import { useLayoutTransfer } from "@lichtblick/suite-base/hooks/useLayoutTransfer";
import { usePrompt } from "@lichtblick/suite-base/hooks/usePrompt";
import { defaultPlaybackConfig } from "@lichtblick/suite-base/providers/CurrentLayoutProvider/reducers";
import { AppEvent } from "@lichtblick/suite-base/services/IAnalytics";
import { Layout, layoutIsShared } from "@lichtblick/suite-base/services/ILayoutStorage";

const RECENT_LAYOUTS_KEY: string = "flora.recentLayouts";
const MAX_RECENT_LAYOUTS = 5;

const useStyles = makeStyles()((theme) => ({
  menuList: {
    minWidth: 320,
    paddingBottom: theme.spacing(0.5),
  },
  searchField: {
    margin: theme.spacing(1),
    "& .MuiOutlinedInput-root": {
      fontSize: "0.875rem",
    },
  },
}));

const selectedLayoutIdSelector = (state: LayoutState) => state.selectedLayout?.id;

type LayoutMenuProps = {
  anchorEl?: HTMLElement;
  open: boolean;
  handleClose: () => void;
};

// Helper to get recent layout IDs from localStorage
function getRecentLayoutIds(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_LAYOUTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Helper to save recent layout IDs to localStorage
function saveRecentLayoutIds(ids: string[]): void {
  try {
    const value = JSON.stringify(ids.slice(0, MAX_RECENT_LAYOUTS))!;
    localStorage.setItem(RECENT_LAYOUTS_KEY, value);
  } catch {
    // Ignore storage errors
  }
}

// Helper to add a layout to recent
function addToRecentLayouts(layoutId: string): void {
  const recent = getRecentLayoutIds().filter((id) => id !== layoutId);
  recent.unshift(layoutId);
  saveRecentLayoutIds(recent);
}

export function LayoutMenu(props: LayoutMenuProps): React.JSX.Element {
  const { classes } = useStyles();
  const { anchorEl, handleClose, open } = props;
  const { t } = useTranslation("layoutBrowser");

  const layoutManager = useLayoutManager();
  const analytics = useAnalytics();
  const selectedLayoutId = useCurrentLayoutSelector(selectedLayoutIdSelector);
  const { importLayout, exportLayout } = useLayoutTransfer();
  const { promptForUnsavedChanges, onSelectLayout } = useLayoutNavigation();
  const {
    onRenameLayout,
    onDuplicateLayout,
    onDeleteLayout,
    onRevertLayout,
    onOverwriteLayout,
    confirmModal,
  } = useLayoutActions();
  const [prompt, promptModal] = usePrompt();

  const [selectedIds] = useState<readonly string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [layouts, reloadLayouts] = useAsyncFn(
    async () => {
      const [shared, personal] = _.partition(
        await layoutManager.getLayouts(),
        layoutManager.supportsSharing ? layoutIsShared : () => false,
      );
      return {
        personal: personal.sort((a, b) => a.name.localeCompare(b.name)),
        shared: shared.sort((a, b) => a.name.localeCompare(b.name)),
      };
    },
    [layoutManager],
    { loading: true },
  );

  // Get recent layouts
  const recentLayouts = useMemo(() => {
    if (!layouts.value) {
      return [];
    }
    const allLayouts = [...layouts.value.personal, ...layouts.value.shared];
    const recentIds = getRecentLayoutIds();
    return recentIds
      .map((id) => allLayouts.find((layout) => layout.id === id))
      .filter((layout): layout is Layout => layout != undefined)
      .slice(0, MAX_RECENT_LAYOUTS);
  }, [layouts.value]);

  // Filter layouts by search query
  const filteredLayouts = useMemo(() => {
    if (!layouts.value) {
      return { personal: [], shared: [], recent: [] };
    }
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      return {
        personal: layouts.value.personal,
        shared: layouts.value.shared,
        recent: recentLayouts,
      };
    }
    return {
      personal: layouts.value.personal.filter((l) => l.name.toLowerCase().includes(query)),
      shared: layouts.value.shared.filter((l) => l.name.toLowerCase().includes(query)),
      recent: recentLayouts.filter((l) => l.name.toLowerCase().includes(query)),
    };
  }, [layouts.value, searchQuery, recentLayouts]);

  useEffect(() => {
    if (open) {
      void reloadLayouts();
      setSearchQuery("");
    }
  }, [open, reloadLayouts]);

  useEffect(() => {
    const listener = () => void reloadLayouts();
    layoutManager.on("change", listener);
    return () => {
      layoutManager.off("change", listener);
    };
  }, [layoutManager, reloadLayouts]);

  const handleLayoutSelect = useCallback(
    async (layout: Layout) => {
      addToRecentLayouts(layout.id);
      await onSelectLayout(layout);
      handleClose();
    },
    [onSelectLayout, handleClose],
  );

  const createNewLayout = useCallbackWithToast(async () => {
    if (!(await promptForUnsavedChanges())) {
      return;
    }
    const name = `Unnamed layout ${moment().format("l")} at ${moment().format("LT")}`;
    const layoutData: Omit<LayoutData, "name" | "id"> = {
      configById: {},
      globalVariables: {},
      userNodes: {},
      playbackConfig: defaultPlaybackConfig,
    };
    const newLayout = await layoutManager.saveNewLayout({
      name,
      data: layoutData as LayoutData,
      permission: "CREATOR_WRITE",
    });
    addToRecentLayouts(newLayout.id);
    void onSelectLayout(newLayout);
    void analytics.logEvent(AppEvent.LAYOUT_CREATE);
    handleClose();
  }, [promptForUnsavedChanges, layoutManager, onSelectLayout, analytics, handleClose]);

  const handleImportLayout = useCallback(() => {
    void importLayout();
    handleClose();
  }, [importLayout, handleClose]);

  const onShareLayout = useCallbackWithToast(
    async (item: Layout) => {
      const name = await prompt({
        title: t("shareACopyWithYourOrganization"),
        subText: t("sharedLayoutsCanBeUsedAndChangedByOtherMembersOfYourOrganization"),
        initialValue: item.name,
        label: t("layoutName"),
      });
      if (name != undefined) {
        const newLayout = await layoutManager.saveNewLayout({
          name,
          data: item.working?.data ?? item.baseline.data,
          permission: "ORG_WRITE",
        });
        void analytics.logEvent(AppEvent.LAYOUT_SHARE, { permission: item.permission });
        await onSelectLayout(newLayout);
      }
    },
    [analytics, layoutManager, onSelectLayout, prompt, t],
  );

  const onMakePersonalCopy = useCallbackWithToast(
    async (item: Layout) => {
      const newLayout = await layoutManager.makePersonalCopy({
        id: item.id,
        name: `${item.name} copy`,
      });
      await onSelectLayout(newLayout);
      void analytics.logEvent(AppEvent.LAYOUT_MAKE_PERSONAL_COPY, {
        permission: item.permission,
        syncStatus: item.syncInfo?.status,
      });
    },
    [analytics, layoutManager, onSelectLayout],
  );

  const anySelectedModifiedLayouts = useMemo(() => {
    return [layouts.value?.personal ?? [], layouts.value?.shared ?? []]
      .flat()
      .some((layout) => layout.working != undefined && selectedIds.includes(layout.id));
  }, [layouts.value, selectedIds]);

  const hasRecentLayouts = filteredLayouts.recent.length > 0;
  const hasPersonalLayouts = filteredLayouts.personal.length > 0;
  const hasSharedLayouts = filteredLayouts.shared.length > 0;

  return (
    <>
      {confirmModal}
      {promptModal}
      <Menu
        id="layout-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          list: {
            dense: true,
            disablePadding: true,
            className: classes.menuList,
            "aria-labelledby": "layout-menu-button",
          },
        }}
        anchorOrigin={{
          horizontal: "right",
          vertical: "bottom",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <TextField
          className={classes.searchField}
          size="small"
          placeholder={t("searchLayouts", "Search layouts...")}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          autoFocus
          fullWidth
          onClick={(e) => {
            e.stopPropagation();
          }}
          onKeyDown={(e) => {
            e.stopPropagation();
          }}
        />
        <MenuItem onClick={createNewLayout}>
          <ListItemText>{t("createNewLayout")}</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleImportLayout}>
          <ListItemText>{t("importFromFile")}</ListItemText>
        </MenuItem>
        <Divider />
        <Stack>
          {layouts.loading ? (
            <Stack alignItems="center" justifyContent="center" padding={2}>
              <CircularProgress size={24} />
            </Stack>
          ) : (
            <>
              {hasRecentLayouts && (
                <LayoutSection
                  disablePadding
                  title="Recent"
                  emptyText={undefined}
                  items={filteredLayouts.recent}
                  anySelectedModifiedLayouts={anySelectedModifiedLayouts}
                  multiSelectedIds={selectedIds}
                  selectedId={selectedLayoutId}
                  onSelect={handleLayoutSelect}
                  onRename={onRenameLayout}
                  onDuplicate={onDuplicateLayout}
                  onDelete={onDeleteLayout}
                  onShare={onShareLayout}
                  onExport={exportLayout}
                  onOverwrite={onOverwriteLayout}
                  onRevert={onRevertLayout}
                  onMakePersonalCopy={onMakePersonalCopy}
                />
              )}
              {hasPersonalLayouts && (
                <LayoutSection
                  disablePadding
                  title="Personal"
                  emptyText={undefined}
                  items={filteredLayouts.personal}
                  anySelectedModifiedLayouts={anySelectedModifiedLayouts}
                  multiSelectedIds={selectedIds}
                  selectedId={selectedLayoutId}
                  onSelect={handleLayoutSelect}
                  onRename={onRenameLayout}
                  onDuplicate={onDuplicateLayout}
                  onDelete={onDeleteLayout}
                  onShare={onShareLayout}
                  onExport={exportLayout}
                  onOverwrite={onOverwriteLayout}
                  onRevert={onRevertLayout}
                  onMakePersonalCopy={onMakePersonalCopy}
                />
              )}
              {layoutManager.supportsSharing && hasSharedLayouts && (
                <LayoutSection
                  disablePadding
                  title="Organization"
                  emptyText={undefined}
                  items={filteredLayouts.shared}
                  anySelectedModifiedLayouts={anySelectedModifiedLayouts}
                  multiSelectedIds={selectedIds}
                  selectedId={selectedLayoutId}
                  onSelect={handleLayoutSelect}
                  onRename={onRenameLayout}
                  onDuplicate={onDuplicateLayout}
                  onDelete={onDeleteLayout}
                  onShare={onShareLayout}
                  onExport={exportLayout}
                  onOverwrite={onOverwriteLayout}
                  onRevert={onRevertLayout}
                  onMakePersonalCopy={onMakePersonalCopy}
                />
              )}
              {!hasRecentLayouts && !hasPersonalLayouts && !hasSharedLayouts && (
                <Stack padding={2} alignItems="center">
                  {searchQuery
                    ? t("noLayoutsFound", "No layouts found")
                    : t("addANewLayoutToGetStartedWithFlora")}
                </Stack>
              )}
            </>
          )}
        </Stack>
      </Menu>
    </>
  );
}
