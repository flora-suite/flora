// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ApiClient, LocalStorageTokenStorage, ITokenStorage, SessionExpiredCallback } from "@lichtblick/suite-base/services/ApiClient";
import { AuthService, IAuthService } from "@lichtblick/suite-base/services/AuthService";
import { DeviceService } from "@lichtblick/suite-base/services/DeviceService";
import { EventService } from "@lichtblick/suite-base/services/EventService";
import { IDeviceService } from "@lichtblick/suite-base/services/IDeviceService";
import { IEventService } from "@lichtblick/suite-base/services/IEventService";
import { IOrganizationService } from "@lichtblick/suite-base/services/IOrganizationService";
import { IRecordingService } from "@lichtblick/suite-base/services/IRecordingService";
import { OrganizationService } from "@lichtblick/suite-base/services/OrganizationService";
import { RecordingService } from "@lichtblick/suite-base/services/RecordingService";

/**
 * Default flora-server URL for development
 */
const DEFAULT_FLORA_SERVER_URL = "http://localhost:3000";

/**
 * Options for creating an AuthService instance
 */
export type CreateAuthServiceOptions = {
  /** Base URL of the flora-server API */
  serverUrl?: string;
  /** Custom token storage implementation */
  tokenStorage?: ITokenStorage;
  /** Callback when session expires and cannot be refreshed */
  onSessionExpired?: SessionExpiredCallback;
};

/**
 * Result of creating auth services
 */
export type AuthServicesResult = {
  authService: IAuthService;
  apiClient: ApiClient;
};

/**
 * Result of creating all flora services
 */
export type FloraServicesResult = {
  authService: IAuthService;
  deviceService: IDeviceService;
  recordingService: IRecordingService;
  eventService: IEventService;
  organizationService: IOrganizationService;
  apiClient: ApiClient;
};

/**
 * Factory function to create a configured AuthService instance
 */
export function createAuthService(options: CreateAuthServiceOptions = {}): IAuthService {
  const result = createAuthServices(options);
  return result.authService;
}

/**
 * Factory function to create both ApiClient and AuthService instances
 * Use this when you need access to the ApiClient for other services
 */
export function createAuthServices(options: CreateAuthServiceOptions = {}): AuthServicesResult {
  const {
    serverUrl = process.env.FLORA_SERVER_URL ?? DEFAULT_FLORA_SERVER_URL,
    tokenStorage = new LocalStorageTokenStorage(),
  } = options;

  const apiClient = new ApiClient(serverUrl, tokenStorage);
  const authService = new AuthService(apiClient, tokenStorage);

  return { authService, apiClient };
}

/**
 * Factory function to create all flora services (auth, device, recording, event, organization, etc.)
 * Use this when you need access to all services
 */
export function createFloraServices(options: CreateAuthServiceOptions = {}): FloraServicesResult {
  const {
    serverUrl = process.env.FLORA_SERVER_URL ?? DEFAULT_FLORA_SERVER_URL,
    tokenStorage = new LocalStorageTokenStorage(),
    onSessionExpired,
  } = options;

  const apiClient = new ApiClient(serverUrl, tokenStorage);

  // Set session expired callback if provided
  if (onSessionExpired) {
    apiClient.setSessionExpiredCallback(onSessionExpired);
  }

  const authService = new AuthService(apiClient, tokenStorage);
  const deviceService = new DeviceService(apiClient);
  const recordingService = new RecordingService(apiClient);
  const eventService = new EventService(apiClient);
  const organizationService = new OrganizationService(apiClient);

  return { authService, deviceService, recordingService, eventService, organizationService, apiClient };
}

/**
 * Get the flora-server URL from environment or use default
 */
export function getFloraServerUrl(): string {
  return process.env.FLORA_SERVER_URL ?? DEFAULT_FLORA_SERVER_URL;
}

