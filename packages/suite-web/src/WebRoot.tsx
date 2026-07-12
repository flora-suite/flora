// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useCallback, useMemo, useState } from "react";

import {
  ApiClientContext,
  AppBarProps,
  AppSetting,
  AuthProvider,
  createFloraServices,
  DeviceProvider,
  EventProvider,
  FoxgloveWebSocketDataSourceFactory,
  IDataSourceFactory,
  IdbExtensionLoader,
  McapLocalDataSourceFactory,
  OrganizationProvider,
  RecordingProvider,
  RemoteDataSourceFactory,
  RemoteLayoutStorageProvider,
  Ros1LocalBagDataSourceFactory,
  Ros2LocalBagDataSourceFactory,
  RosbridgeDataSourceFactory,
  SampleNuscenesDataSourceFactory,
  SharedRoot,
  UlogLocalDataSourceFactory,
} from "@lichtblick/suite-base";

import LocalStorageAppConfiguration from "./services/LocalStorageAppConfiguration";

const isDevelopment = process.env.NODE_ENV === "development";

export function WebRoot(props: {
  extraProviders: JSX.Element[] | undefined;
  dataSources: IDataSourceFactory[] | undefined;
  AppBarComponent?: (props: AppBarProps) => JSX.Element;
  children: JSX.Element;
}): JSX.Element {
  const appConfiguration = useMemo(
    () =>
      new LocalStorageAppConfiguration({
        defaults: {
          [AppSetting.SHOW_DEBUG_PANELS]: isDevelopment,
        },
      }),
    [],
  );

  const [extensionLoaders] = useState(() => [
    new IdbExtensionLoader("org"),
    new IdbExtensionLoader("local"),
  ]);

  // Track session expiry to force re-render and update auth state
  const [sessionExpiredCount, setSessionExpiredCount] = useState(0);

  // Callback when API client detects session expired
  const handleSessionExpired = useCallback(() => {
    // Increment counter to signal AuthProvider that session expired
    setSessionExpiredCount((prev) => prev + 1);
  }, []);

  // Create services once, but set up session expired callback
  const services = useMemo(() => {
    return createFloraServices({
      serverUrl: appConfiguration.get(AppSetting.FLORA_SERVER_URL) as string | undefined,
      onSessionExpired: handleSessionExpired,
    });
  }, [appConfiguration, handleSessionExpired]);

  const { authService, deviceService, recordingService, eventService, organizationService, apiClient } = services;

  const dataSources = useMemo(() => {
    const sources = [
      new Ros1LocalBagDataSourceFactory(),
      new Ros2LocalBagDataSourceFactory(),
      new FoxgloveWebSocketDataSourceFactory(),
      new RosbridgeDataSourceFactory(),
      new UlogLocalDataSourceFactory(),
      new SampleNuscenesDataSourceFactory(),
      new McapLocalDataSourceFactory(),
      new RemoteDataSourceFactory(),
    ];

    return props.dataSources ?? sources;
  }, [props.dataSources]);

  // Combine auth provider with any extra providers
  // Note: MultiProvider expects a flat list of providers, each will wrap the children
  // Do NOT nest providers in the array - each element should be a single provider
  const allProviders = useMemo(() => {
    const providers: JSX.Element[] = [
      /* eslint-disable react/jsx-key */
      <ApiClientContext.Provider value={apiClient} />,
      <AuthProvider authService={authService} sessionExpiredSignal={sessionExpiredCount} />,
      <OrganizationProvider organizationService={organizationService} />,
      <DeviceProvider deviceService={deviceService} />,
      <RecordingProvider recordingService={recordingService} />,
      <EventProvider eventService={eventService} />,
      <RemoteLayoutStorageProvider />,
      /* eslint-enable react/jsx-key */
    ];
    if (props.extraProviders) {
      providers.push(...props.extraProviders);
    }
    return providers;
  }, [authService, deviceService, recordingService, eventService, organizationService, apiClient, sessionExpiredCount, props.extraProviders]);

  return (
    <SharedRoot
      enableLaunchPreferenceScreen
      deepLinks={[window.location.href]}
      dataSources={dataSources}
      appConfiguration={appConfiguration}
      extensionLoaders={extensionLoaders}
      enableGlobalCss
      extraProviders={allProviders}
      AppBarComponent={props.AppBarComponent}
    >
      {props.children}
    </SharedRoot>
  );
}
