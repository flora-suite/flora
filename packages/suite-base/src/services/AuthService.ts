// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  AuthUser,
  LoginCredentials,
  RegisterData,
} from "@lichtblick/suite-base/context/AuthContext";
import { ApiClient, ITokenStorage } from "@lichtblick/suite-base/services/ApiClient";

/**
 * Authentication response from flora-server
 */
type AuthResponse = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

/**
 * Service for handling authentication operations
 */
export interface IAuthService {
  /** Login with email and password */
  login(credentials: LoginCredentials): Promise<AuthUser>;
  /** Register a new user */
  register(data: RegisterData): Promise<AuthUser>;
  /** Logout current user */
  logout(): Promise<void>;
  /** Get current user info */
  getCurrentUser(): Promise<AuthUser>;
  /** Refresh authentication tokens */
  refreshTokens(): Promise<void>;
  /** Check if user has valid session */
  hasValidSession(): boolean;
}

/**
 * Implementation of AuthService using flora-server API
 */
export class AuthService implements IAuthService {
  private readonly apiClient: ApiClient;
  private readonly tokenStorage: ITokenStorage;

  public constructor(apiClient: ApiClient, tokenStorage: ITokenStorage) {
    this.apiClient = apiClient;
    this.tokenStorage = tokenStorage;
  }

  public async login(credentials: LoginCredentials): Promise<AuthUser> {
    const response = await this.apiClient.post<AuthResponse>("/api/auth/login", credentials, {
      skipAuth: true,
    });

    this.tokenStorage.setTokens(response.accessToken, response.refreshToken);
    return response.user;
  }

  public async register(data: RegisterData): Promise<AuthUser> {
    const response = await this.apiClient.post<AuthResponse>("/api/auth/register", data, {
      skipAuth: true,
    });

    this.tokenStorage.setTokens(response.accessToken, response.refreshToken);
    return response.user;
  }

  public async logout(): Promise<void> {
    const refreshToken = this.tokenStorage.getRefreshToken();

    if (refreshToken) {
      try {
        await this.apiClient.post("/api/auth/logout", { refreshToken });
      } catch {
        // Ignore logout errors, we'll clear tokens anyway
      }
    }

    this.tokenStorage.clearTokens();
  }

  public async getCurrentUser(): Promise<AuthUser> {
    return await this.apiClient.get<AuthUser>("/api/auth/me");
  }

  public async refreshTokens(): Promise<void> {
    const refreshToken = this.tokenStorage.getRefreshToken();

    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await this.apiClient.post<{ accessToken: string; refreshToken: string }>(
      "/api/auth/refresh",
      { refreshToken },
      { skipAuth: true },
    );

    this.tokenStorage.setTokens(response.accessToken, response.refreshToken);
  }

  public hasValidSession(): boolean {
    return this.tokenStorage.getAccessToken() != undefined;
  }
}
