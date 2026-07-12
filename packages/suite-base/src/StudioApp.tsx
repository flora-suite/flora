// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Fragment, Suspense, useContext, useEffect, useMemo } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { BrowserRouter, HashRouter, Routes, Route, useNavigate } from "react-router";

import { IdbLayoutStorage } from "@lichtblick/suite-base/IdbLayoutStorage";
import LayoutStorageContext from "@lichtblick/suite-base/context/LayoutStorageContext";
import NativeAppMenuContext from "@lichtblick/suite-base/context/NativeAppMenuContext";
import NativeWindowContext from "@lichtblick/suite-base/context/NativeWindowContext";
import { useSharedRootContext } from "@lichtblick/suite-base/context/SharedRootContext";
import { DashboardLayout, SettingsLayout } from "@lichtblick/suite-base/layouts";
import {
  DashboardPage,
  DevicesPage,
  DeviceDetailPage,
  DeviceRegisterPage,
  EventsPage,
  LayoutsPage,
  RecordingsPage,
  GeneralSettings,
  ExtensionsSettingsPage,
  ExperimentalSettings,
  AboutSettings,
  OrganizationGeneralSettings,
  OrganizationMembersSettings,
  OrganizationApiKeysSettings,
  OrganizationExtensionsSettings,
  TimelinePage,
} from "@lichtblick/suite-base/pages";
import EventsProvider from "@lichtblick/suite-base/providers/EventsProvider";
import LayoutManagerProvider from "@lichtblick/suite-base/providers/LayoutManagerProvider";
import ProblemsContextProvider from "@lichtblick/suite-base/providers/ProblemsContextProvider";
import { StudioLogsSettingsProvider } from "@lichtblick/suite-base/providers/StudioLogsSettingsProvider";
import TimelineInteractionStateProvider from "@lichtblick/suite-base/providers/TimelineInteractionStateProvider";
import UserProfileLocalStorageProvider from "@lichtblick/suite-base/providers/UserProfileLocalStorageProvider";
import WorkspaceContextProvider from "@lichtblick/suite-base/providers/WorkspaceContextProvider";
import { useWorkspaceActions } from "@lichtblick/suite-base/context/Workspace/useWorkspaceActions";
import isDesktopApp from "@lichtblick/suite-base/util/isDesktopApp";

import Workspace from "./Workspace";
import DocumentTitleAdapter from "./components/DocumentTitleAdapter";
import MultiProvider from "./components/MultiProvider";
import PlayerManager from "./components/PlayerManager";
import SendNotificationToastAdapter from "./components/SendNotificationToastAdapter";
import StudioToastProvider from "./components/StudioToastProvider";
import { UserScriptStateProvider } from "./context/UserScriptStateContext";
import CurrentLayoutProvider from "./providers/CurrentLayoutProvider";
import ExtensionCatalogProvider from "./providers/ExtensionCatalogProvider";
import ExtensionMarketplaceProvider from "./providers/ExtensionMarketplaceProvider";
import PanelCatalogProvider from "./providers/PanelCatalogProvider";
import { LaunchPreference } from "./screens/LaunchPreference";

function NativeAppMenuHandler(): null {
  const nativeAppMenu = useContext(NativeAppMenuContext);
  const navigate = useNavigate();
  const { dialogActions } = useWorkspaceActions();

  useEffect(() => {
    const unregister = [
      nativeAppMenu?.on("open", () => {
        dialogActions.dataSource.open("start");
        void navigate("/view");
      }),
      nativeAppMenu?.on("open-file", () => {
        void dialogActions.openFile
          .open()
          .then((opened) => {
            if (opened) {
              void navigate("/view");
            }
          })
          .catch((err: unknown) => {
            console.error(err);
          });
      }),
      nativeAppMenu?.on("open-connection", () => {
        dialogActions.dataSource.open("connection");
        void navigate("/view");
      }),
      nativeAppMenu?.on("open-demo", () => {
        dialogActions.dataSource.open("demo");
        void navigate("/view");
      }),
      nativeAppMenu?.on("open-help-about", () => {
        void navigate("/settings/about");
      }),
      nativeAppMenu?.on("open-help-docs", () => {
        window.open("https://flora.fan/docs", "_blank");
      }),
      nativeAppMenu?.on("open-help-general", () => {
        void navigate("/settings/general");
      }),
    ];

    return () => {
      for (const removeListener of unregister) {
        removeListener?.();
      }
    };
  }, [dialogActions.dataSource, dialogActions.openFile, nativeAppMenu, navigate]);

  return null;
}

// Suppress context menu for the entire app except on inputs & textareas.
function contextMenuHandler(event: MouseEvent) {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
    return;
  }

  event.preventDefault();
  return false;
}

export function StudioApp(): JSX.Element {
  const {
    dataSources,
    extensionLoaders,
    layoutLoaders,
    nativeAppMenu,
    nativeWindow,
    deepLinks,
    enableLaunchPreferenceScreen,
    extraProviders,
    appBarLeftInset,
    customWindowControlProps,
    onAppBarDoubleClick,
    AppBarComponent,
  } = useSharedRootContext();

  // Packaged Electron renders from file://. A hash router keeps the route out of the
  // local file path, while the web application retains clean browser URLs.
  const Router = isDesktopApp() ? HashRouter : BrowserRouter;

  const providers = [
    /* eslint-disable react/jsx-key */
    <TimelineInteractionStateProvider />,
    <ExtensionMarketplaceProvider />,
    <ExtensionCatalogProvider loaders={extensionLoaders} />,
    <UserScriptStateProvider />,
    <PlayerManager playerSources={dataSources} />,
    <EventsProvider />,
    /* eslint-enable react/jsx-key */
  ];

  if (nativeAppMenu) {
    providers.push(<NativeAppMenuContext.Provider value={nativeAppMenu} />);
  }

  if (nativeWindow) {
    providers.push(<NativeWindowContext.Provider value={nativeWindow} />);
  }

  // The toast and logs provider comes first so they are available to all downstream providers
  providers.unshift(<StudioToastProvider />);
  providers.unshift(<StudioLogsSettingsProvider />);

  // Problems provider also must come before other, dependent contexts.
  providers.unshift(<ProblemsContextProvider />);
  providers.unshift(<CurrentLayoutProvider loaders={layoutLoaders} />);
  providers.unshift(<UserProfileLocalStorageProvider />);
  providers.unshift(<LayoutManagerProvider />);

  const layoutStorage = useMemo(() => new IdbLayoutStorage(), []);

  providers.unshift(<LayoutStorageContext.Provider value={layoutStorage} />);

  // extraProviders (ApiClientContext, AuthProvider, RemoteLayoutStorageProvider) must be
  // at the outermost level so they are available to LayoutManagerProvider
  if (extraProviders) {
    providers.unshift(...extraProviders);
  }
  const MaybeLaunchPreference = enableLaunchPreferenceScreen === true ? LaunchPreference : Fragment;

  useEffect(() => {
    document.addEventListener("contextmenu", contextMenuHandler);
    return () => {
      document.removeEventListener("contextmenu", contextMenuHandler);
    };
  }, []);

  return (
    <MaybeLaunchPreference>
      <MultiProvider providers={providers}>
        <DocumentTitleAdapter />
        <SendNotificationToastAdapter />
        <DndProvider backend={HTML5Backend}>
          <Suspense fallback={<></>}>
            <PanelCatalogProvider>
              <Router>
                <WorkspaceContextProvider>
                  <NativeAppMenuHandler />
                  <Routes>
                    {/* Standalone device registration page (no dashboard layout) */}
                    <Route path="devices/register" element={<DeviceRegisterPage />} />

                    {/* Dashboard pages */}
                    <Route element={<DashboardLayout />}>
                      <Route index element={<DashboardPage />} />
                      <Route path="devices" element={<DevicesPage />} />
                      <Route path="devices/:deviceId" element={<DeviceDetailPage />} />
                      <Route path="recordings" element={<RecordingsPage />} />
                      <Route path="events" element={<EventsPage />} />
                      <Route path="timeline" element={<TimelinePage />} />
                      <Route path="layouts" element={<LayoutsPage />} />
                    </Route>
                    <Route element={<SettingsLayout />}>
                      <Route path="settings" element={<GeneralSettings />} />
                      <Route path="settings/general" element={<GeneralSettings />} />
                      <Route path="settings/extensions" element={<ExtensionsSettingsPage />} />
                      <Route path="settings/experimental" element={<ExperimentalSettings />} />
                      <Route path="settings/about" element={<AboutSettings />} />
                      {/* Organization settings routes */}
                      <Route
                        path="settings/organization"
                        element={<OrganizationGeneralSettings />}
                      />
                      <Route
                        path="settings/organization/members"
                        element={<OrganizationMembersSettings />}
                      />
                      <Route
                        path="settings/organization/api-keys"
                        element={<OrganizationApiKeysSettings />}
                      />
                      <Route
                        path="settings/organization/extensions"
                        element={<OrganizationExtensionsSettings />}
                      />
                    </Route>
                    <Route
                      path="view"
                      element={
                        <Workspace
                          deepLinks={deepLinks}
                          appBarLeftInset={appBarLeftInset}
                          onAppBarDoubleClick={onAppBarDoubleClick}
                          showCustomWindowControls={
                            customWindowControlProps?.showCustomWindowControls
                          }
                          isMaximized={customWindowControlProps?.isMaximized}
                          initialZoomFactor={customWindowControlProps?.initialZoomFactor}
                          onMinimizeWindow={customWindowControlProps?.onMinimizeWindow}
                          onMaximizeWindow={customWindowControlProps?.onMaximizeWindow}
                          onUnmaximizeWindow={customWindowControlProps?.onUnmaximizeWindow}
                          onCloseWindow={customWindowControlProps?.onCloseWindow}
                          AppBarComponent={AppBarComponent}
                        />
                      }
                    />
                  </Routes>
                </WorkspaceContextProvider>
              </Router>
            </PanelCatalogProvider>
          </Suspense>
        </DndProvider>
      </MultiProvider>
    </MaybeLaunchPreference>
  );
}
