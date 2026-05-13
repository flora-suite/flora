// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

// Bring in global modules and overrides required by studio source files
// This adds type declarations for bag, etc imports
// This adds type declarations for global react
// See typings/index.d.ts for additional included references
/// <reference types="./typings" />

export { App } from "./App";
export { SharedRoot } from "./SharedRoot";
export { StudioApp } from "./StudioApp";
export type { NetworkInterface, OsContext } from "./OsContext";
export type {
  IAppConfiguration,
  AppConfigurationValue,
  ChangeHandler,
} from "./context/AppConfigurationContext";
export { AppContext } from "./context/AppContext";
export type { IAppContext } from "./context/AppContext";
export { migratePanelsState } from "./services/migrateLayout";
export type { INativeAppMenu, NativeAppMenuEvent } from "./context/NativeAppMenuContext";
export { default as NativeWindowContext } from "./context/NativeWindowContext";
export type { INativeWindow, NativeWindowEvent } from "./context/NativeWindowContext";
export type { IDataSourceFactory } from "./context/PlayerSelectionContext";
export { default as installDevtoolsFormatters } from "./util/installDevtoolsFormatters";
export { default as overwriteFetch } from "./util/overwriteFetch";
export { default as waitForFonts } from "./util/waitForFonts";
export { initI18n } from "./i18n";
export type { ExtensionLoader } from "./services/ExtensionLoader";
export type { LayoutLoader } from "./services/ILayoutLoader";
export type { LayoutInfo } from "./types/layouts";
export type { LayoutData } from "./context/CurrentLayoutContext";
export type { ExtensionInfo, ExtensionNamespace } from "./types/Extensions";
export { AppSetting } from "./AppSetting";
export { default as FoxgloveWebSocketDataSourceFactory } from "./dataSources/FoxgloveWebSocketDataSourceFactory";
export { default as Ros1LocalBagDataSourceFactory } from "./dataSources/Ros1LocalBagDataSourceFactory";
export { default as Ros1SocketDataSourceFactory } from "./dataSources/Ros1SocketDataSourceFactory";
export { default as Ros2LocalBagDataSourceFactory } from "./dataSources/Ros2LocalBagDataSourceFactory";
export { default as RosbridgeDataSourceFactory } from "./dataSources/RosbridgeDataSourceFactory";
export { default as UlogLocalDataSourceFactory } from "./dataSources/UlogLocalDataSourceFactory";
export { default as RemoteDataSourceFactory } from "./dataSources/RemoteDataSourceFactory";
export { default as VelodyneDataSourceFactory } from "./dataSources/VelodyneDataSourceFactory";
export { default as McapLocalDataSourceFactory } from "./dataSources/McapLocalDataSourceFactory";
export { default as SampleNuscenesDataSourceFactory } from "./dataSources/SampleNuscenesDataSourceFactory";
export { LaunchPreferenceValue } from "@lichtblick/suite-base/types/LaunchPreferenceValue";
export { reportError, setReportErrorHandler } from "./reportError";
export { makeWorkspaceContextInitialState } from "./providers/WorkspaceContextProvider";
export type { AppBarProps } from "./components/AppBar";
export { IdbExtensionLoader } from "./services/IdbExtensionLoader";
export { default as BasicBuilder } from "./testing/builders/BasicBuilder";

// Authentication exports
export { default as AuthContext, useAuth, useRequireAuth } from "./context/AuthContext";
export type {
  AuthUser,
  AuthState,
  LoginCredentials,
  RegisterData,
  IAuthContext,
} from "./context/AuthContext";
export { ApiClient, LocalStorageTokenStorage, ApiError } from "./services/ApiClient";
export type { ITokenStorage, ApiErrorResponse, SessionExpiredCallback } from "./services/ApiClient";
export { AuthService } from "./services/AuthService";
export type { IAuthService } from "./services/AuthService";
export { default as AuthProvider } from "./providers/AuthProvider";
export { AuthDialog } from "./components/AuthDialog";
export { createAuthService, createAuthServices, createFloraServices, getFloraServerUrl } from "./services/createAuthService";
export type { CreateAuthServiceOptions, AuthServicesResult, FloraServicesResult } from "./services/createAuthService";
export { default as ApiClientContext, useApiClient } from "./context/ApiClientContext";
export { default as RemoteLayoutStorageProvider } from "./providers/RemoteLayoutStorageProvider";
export { FloraRemoteLayoutStorage } from "./services/FloraRemoteLayoutStorage";

// Device management exports
export { default as DeviceContext, useDevices, useSelectedDevice, useRequireSelectedDevice } from "./context/DeviceContext";
export type { DeviceState, IDeviceContext } from "./context/DeviceContext";
export { DeviceService } from "./services/DeviceService";
export type {
  Device,
  DeviceStatus,
  AgentStatus,
  DeviceTopic,
  DeviceListResponse,
  DeviceListQuery,
  UpdateDeviceParams,
  DeviceTokenResponse,
  DeviceAgentInfo,
  DeviceEventType,
  DeviceEvent,
  DeviceEventListResponse,
  DeviceEventListQuery,
  CreateDeviceEventParams,
  UpdateDeviceEventParams,
  IDeviceService,
} from "./services/IDeviceService";
export { default as DeviceProvider } from "./providers/DeviceProvider";
export { default as RecordingProvider } from "./providers/RecordingProvider";

// Event management exports
export { default as EventContext, useEvents } from "./context/EventContext";
export type { IEventContext } from "./context/EventContext";
export { EventService } from "./services/EventService";
export type {
  EventType,
  DeviceEvent as EventServiceDeviceEvent,
  EventListQuery,
  EventListResponse,
  CreateEventInput,
  UpdateEventInput,
  IEventService,
} from "./services/IEventService";
export { default as EventProvider } from "./providers/EventProvider";

// Organization management exports
export { default as OrganizationContext, useOrganizations, useCurrentOrganization, useIsOrganizationMode } from "./context/OrganizationContext";
export type { OrganizationState, IOrganizationContext } from "./context/OrganizationContext";
export { OrganizationService } from "./services/OrganizationService";
export type {
  OrgRole,
  Organization,
  OrgMember,
  CreateOrganizationInput,
  UpdateOrganizationInput,
  AddMemberInput,
  UpdateMemberRoleInput,
  IOrganizationService,
} from "./services/IOrganizationService";
export { default as OrganizationProvider } from "./providers/OrganizationProvider";
