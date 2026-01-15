// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ApiClient, LocalStorageTokenStorage, ITokenStorage } from "@lichtblick/suite-base/services/ApiClient";
import { AuthService, IAuthService } from "@lichtblick/suite-base/services/AuthService";
import { DeviceService } from "@lichtblick/suite-base/services/DeviceService";
import { IDeviceService } from "@lichtblick/suite-base/services/IDeviceService";

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
 * Factory function to create all flora services (auth, device, etc.)
 * Use this when you need access to all services
 */
export function createFloraServices(options: CreateAuthServiceOptions = {}): FloraServicesResult {
  const {
    serverUrl = process.env.FLORA_SERVER_URL ?? DEFAULT_FLORA_SERVER_URL,
    tokenStorage = new LocalStorageTokenStorage(),
  } = options;

  const apiClient = new ApiClient(serverUrl, tokenStorage);
  const authService = new AuthService(apiClient, tokenStorage);
  const deviceService = new DeviceService(apiClient);

  return { authService, deviceService, apiClient };
}

/**
 * Get the flora-server URL from environment or use default
 */
export function getFloraServerUrl(): string {
  return process.env.FLORA_SERVER_URL ?? DEFAULT_FLORA_SERVER_URL;
}

