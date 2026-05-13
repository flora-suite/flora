// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import AddIcon from "@mui/icons-material/Add";
import BusinessOutlined from "@mui/icons-material/BusinessOutlined";
import CloudOffIcon from "@mui/icons-material/CloudOff";
import FileOpenOutlinedIcon from "@mui/icons-material/FileOpenOutlined";
import PersonOutlined from "@mui/icons-material/PersonOutlined";
import {
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import moment from "moment";
import { useSnackbar } from "notistack";
import { useEffect, useLayoutEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import useAsyncFn from "react-use/lib/useAsyncFn";
import { makeStyles } from "tss-react/mui";

import Logger from "@lichtblick/log";
import { AppSetting } from "@lichtblick/suite-base/AppSetting";
import SignInPrompt from "@lichtblick/suite-base/components/LayoutBrowser/SignInPrompt";
import { SidebarContent } from "@lichtblick/suite-base/components/SidebarContent";
import Stack from "@lichtblick/suite-base/components/Stack";
import { useAnalytics } from "@lichtblick/suite-base/context/AnalyticsContext";
import {
  LayoutID,
  LayoutState,
  useCurrentLayoutSelector,
} from "@lichtblick/suite-base/context/CurrentLayoutContext";
import { LayoutData } from "@lichtblick/suite-base/context/CurrentLayoutContext/actions";
import { useLayoutManager } from "@lichtblick/suite-base/context/LayoutManagerContext";
import {
  useCurrentOrganization,
  useIsOrganizationMode,
} from "@lichtblick/suite-base/context/OrganizationContext";
import { useAppConfigurationValue } from "@lichtblick/suite-base/hooks/useAppConfigurationValue";
import useCallbackWithToast from "@lichtblick/suite-base/hooks/useCallbackWithToast";
import { useLayoutActions } from "@lichtblick/suite-base/hooks/useLayoutActions";
import { useLayoutNavigation } from "@lichtblick/suite-base/hooks/useLayoutNavigation";
import { useLayoutTransfer } from "@lichtblick/suite-base/hooks/useLayoutTransfer";
import { defaultPlaybackConfig } from "@lichtblick/suite-base/providers/CurrentLayoutProvider/reducers";
import { AppEvent } from "@lichtblick/suite-base/services/IAnalytics";
import { Layout } from "@lichtblick/suite-base/services/ILayoutStorage";

import LayoutSection from "./LayoutSection";

const log = Logger.getLogger(__filename);

const selectedLayoutIdSelector = (state: LayoutState) => state.selectedLayout?.id;

const useStyles = makeStyles()((theme) => ({
  actionList: {
    paddingTop: theme.spacing(1),
  },
  contextHeader: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    padding: theme.spacing(1.5, 2),
    backgroundColor: theme.palette.action.hover,
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
}));

export default function LayoutBrowser({
  currentDateForStorybook,
}: React.PropsWithChildren<{
  menuClose?: () => void;
  currentDateForStorybook?: Date;
}>): JSX.Element {
  const { classes } = useStyles();
  const { enqueueSnackbar } = useSnackbar();
  const layoutManager = useLayoutManager();
  const analytics = useAnalytics();

  // Organization context
  const isOrganizationMode = useIsOrganizationMode();
  const currentOrganization = useCurrentOrganization();

  const currentLayoutId = useCurrentLayoutSelector(selectedLayoutIdSelector);
  const {
    onRenameLayout,
    onDuplicateLayout,
    onDeleteLayout,
    onRevertLayout,
    onOverwriteLayout,
    confirmModal,
  } = useLayoutActions();
  const { importLayout, exportLayout } = useLayoutTransfer();
  const { promptForUnsavedChanges, onSelectLayout, state, dispatch, unsavedChangesPrompt } =
    useLayoutNavigation();

  const { t } = useTranslation("layoutBrowser");
  const onExportLayout = exportLayout;

  useLayoutEffect(() => {
    const busyListener = () => {
      dispatch({ type: "set-busy", value: layoutManager.isBusy });
    };
    const onlineListener = () => {
      dispatch({ type: "set-online", value: layoutManager.isOnline });
    };
    const errorListener = () => {
      dispatch({ type: "set-error", value: layoutManager.error });
    };
    busyListener();
    onlineListener();
    errorListener();
    layoutManager.on("busychange", busyListener);
    layoutManager.on("onlinechange", onlineListener);
    layoutManager.on("errorchange", errorListener);
    return () => {
      layoutManager.off("busychange", busyListener);
      layoutManager.off("onlinechange", onlineListener);
      layoutManager.off("errorchange", errorListener);
    };
  }, [dispatch, layoutManager]);

  const [layouts, reloadLayouts] = useAsyncFn(
    async () => {
      // All layouts are now in the same context (personal or org)
      const allLayouts = await layoutManager.getLayouts();
      return {
        layouts: [...allLayouts].sort((a, b) => a.name.localeCompare(b.name)),
      };
    },
    [layoutManager],
    { loading: true },
  );

  useEffect(() => {
    const processAction = async () => {
      if (!state.multiAction) {
        return;
      }

      const id = state.multiAction.ids[0];
      if (id) {
        try {
          switch (state.multiAction.action) {
            case "delete":
              await layoutManager.deleteLayout({ id: id as LayoutID });
              dispatch({ type: "shift-multi-action" });
              break;
            case "duplicate": {
              const layout = await layoutManager.getLayout(id as LayoutID);
              if (layout) {
                await layoutManager.saveNewLayout({
                  name: `${layout.name} copy`,
                  data: layout.working?.data ?? layout.baseline.data,
                  permission: "CREATOR_WRITE",
                });
              }
              dispatch({ type: "shift-multi-action" });
              break;
            }
            case "revert":
              await layoutManager.revertLayout({ id: id as LayoutID });
              dispatch({ type: "shift-multi-action" });
              break;
            case "save":
              await layoutManager.overwriteLayout({ id: id as LayoutID });
              dispatch({ type: "shift-multi-action" });
              break;
          }
        } catch (err) {
          enqueueSnackbar(`Error processing layouts: ${err.message}`, { variant: "error" });
          dispatch({ type: "clear-multi-action" });
        }
      }
    };

    processAction().catch((err) => {
      log.error(err);
    });
  }, [dispatch, enqueueSnackbar, layoutManager, state.multiAction]);

  useEffect(() => {
    const listener = () => void reloadLayouts();
    layoutManager.on("change", listener);
    return () => {
      layoutManager.off("change", listener);
    };
  }, [layoutManager, reloadLayouts]);

  // Start loading on first mount
  useEffect(() => {
    reloadLayouts().catch((err) => {
      log.error(err);
    });
  }, [reloadLayouts]);

  const createNewLayout = useCallbackWithToast(async () => {
    if (!(await promptForUnsavedChanges())) {
      return;
    }
    const name = `Unnamed layout ${moment(currentDateForStorybook).format("l")} at ${moment(
      currentDateForStorybook,
    ).format("LT")}`;
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
    void onSelectLayout(newLayout);

    void analytics.logEvent(AppEvent.LAYOUT_CREATE);
  }, [promptForUnsavedChanges, currentDateForStorybook, layoutManager, onSelectLayout, analytics]);

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

  const [enableNewTopNav = true] = useAppConfigurationValue<boolean>(AppSetting.ENABLE_NEW_TOPNAV);
  const [hideSignInPrompt = false, setHideSignInPrompt] = useAppConfigurationValue<boolean>(
    AppSetting.HIDE_SIGN_IN_PROMPT,
  );
  const showSignInPrompt = !layoutManager.supportsSharing && !hideSignInPrompt;

  const pendingMultiAction = state.multiAction?.ids != undefined;

  const anySelectedModifiedLayouts = useMemo(() => {
    return (layouts.value?.layouts ?? []).some(
      (layout: Layout) => layout.working != undefined && state.selectedIds.includes(layout.id),
    );
  }, [layouts, state.selectedIds]);

  return (
    <SidebarContent
      title={t("layouts")}
      disablePadding
      disableToolbar={enableNewTopNav}
      trailingItems={[
        (layouts.loading || state.busy || pendingMultiAction) && (
          <Stack key="loading" alignItems="center" justifyContent="center" padding={1}>
            <CircularProgress size={18} variant="indeterminate" />
          </Stack>
        ),
        (!state.online || state.error != undefined) && (
          <IconButton color="primary" key="offline" disabled title="Offline">
            <CloudOffIcon />
          </IconButton>
        ),
        <IconButton
          color="primary"
          key="add-layout"
          onClick={createNewLayout}
          aria-label={t("createNewLayout")}
          data-testid="add-layout"
          title={t("createNewLayout")}
        >
          <AddIcon />
        </IconButton>,
        <IconButton
          color="primary"
          key="import-layout"
          onClick={importLayout}
          aria-label={t("importLayout")}
          title={t("importLayout")}
        >
          <FileOpenOutlinedIcon />
        </IconButton>,
      ].filter(Boolean)}
    >
      {confirmModal}
      {unsavedChangesPrompt}
      <Stack
        fullHeight
        gap={enableNewTopNav ? 1 : 2}
        style={{ pointerEvents: pendingMultiAction ? "none" : "auto" }}
      >
        {/* Context indicator */}
        <div className={classes.contextHeader}>
          {isOrganizationMode ? (
            <>
              <BusinessOutlined fontSize="small" color="primary" />
              <Typography variant="body2" color="text.secondary">
                {currentOrganization?.name ?? t("organization")}
              </Typography>
            </>
          ) : (
            <>
              <PersonOutlined fontSize="small" color="primary" />
              <Typography variant="body2" color="text.secondary">
                {t("personal")}
              </Typography>
            </>
          )}
        </div>
        {enableNewTopNav && (
          <>
            <List className={classes.actionList} disablePadding>
              <ListItem disablePadding>
                <ListItemButton onClick={createNewLayout}>
                  <ListItemText disableTypography>{t("createNewLayout")}</ListItemText>
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton onClick={importLayout}>
                  <ListItemText disableTypography>{t("importFromFile")}</ListItemText>
                </ListItemButton>
              </ListItem>
            </List>
            <Divider variant="middle" />
          </>
        )}
        <LayoutSection
          disablePadding={enableNewTopNav}
          title={undefined}
          emptyText={t("addANewLayoutToGetStartedWithFlora")}
          items={layouts.value?.layouts}
          anySelectedModifiedLayouts={anySelectedModifiedLayouts}
          multiSelectedIds={state.selectedIds}
          selectedId={currentLayoutId}
          onSelect={onSelectLayout}
          onRename={onRenameLayout}
          onDuplicate={onDuplicateLayout}
          onDelete={onDeleteLayout}
          onExport={onExportLayout}
          onOverwrite={onOverwriteLayout}
          onRevert={onRevertLayout}
          onMakePersonalCopy={onMakePersonalCopy}
        />
        {!enableNewTopNav && <Stack flexGrow={1} />}
        {showSignInPrompt && <SignInPrompt onDismiss={() => void setHideSignInPrompt(true)} />}
      </Stack>
    </SidebarContent>
  );
}
