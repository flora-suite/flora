// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

import { ApiClient } from "./ApiClient";
import { AuthService } from "./AuthService";
import {
  createAuthService,
  createAuthServices,
  createFloraServices,
  DEFAULT_FLORA_SERVER_URL,
  getFloraServerUrl,
} from "./createAuthService";

const tokens = {
  getAccessToken: jest.fn(),
  getRefreshToken: jest.fn(),
  setTokens: jest.fn(),
  clearTokens: jest.fn(),
};

describe("createAuthService", () => {
  const originalServerUrl = process.env.FLORA_SERVER_URL;

  afterEach(() => {
    if (originalServerUrl == undefined) {
      delete process.env.FLORA_SERVER_URL;
    } else {
      process.env.FLORA_SERVER_URL = originalServerUrl;
    }
    jest.restoreAllMocks();
  });

  it("uses the public Flora server by default and honors the environment override", () => {
    delete process.env.FLORA_SERVER_URL;
    expect(getFloraServerUrl()).toBe(DEFAULT_FLORA_SERVER_URL);
    process.env.FLORA_SERVER_URL = "https://self-hosted.example.com";
    expect(getFloraServerUrl()).toBe("https://self-hosted.example.com");
  });

  it("creates matching authentication services with supplied token storage", () => {
    const result = createAuthServices({ serverUrl: "https://example.com", tokenStorage: tokens });
    expect(result.apiClient).toBeInstanceOf(ApiClient);
    expect(result.authService).toBeInstanceOf(AuthService);
    expect(createAuthService({ tokenStorage: tokens })).toBeInstanceOf(AuthService);
  });

  it("creates all API services and registers a session-expiry callback", () => {
    const callback = jest.fn();
    const callbackSpy = jest.spyOn(ApiClient.prototype, "setSessionExpiredCallback");
    const services = createFloraServices({ tokenStorage: tokens, onSessionExpired: callback });

    expect(services.authService).toBeInstanceOf(AuthService);
    expect(services.apiClient).toBeInstanceOf(ApiClient);
    expect(services.deviceService).toBeDefined();
    expect(services.recordingService).toBeDefined();
    expect(services.eventService).toBeDefined();
    expect(services.organizationService).toBeDefined();
    expect(callbackSpy).toHaveBeenCalledWith(callback);
  });
});
