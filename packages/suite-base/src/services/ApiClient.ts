// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

/**
 * API error response format from flora-server
 */
export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
  };
};

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  public constructor(code: string, message: string, statusCode: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Request options for API client
 */
export type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
  headers?: Record<string, string>;
  skipAuth?: boolean;
};

/**
 * Token storage interface for handling JWT tokens
 */
export interface ITokenStorage {
  getAccessToken(): string | undefined;
  getRefreshToken(): string | undefined;
  setTokens(accessToken: string, refreshToken: string): void;
  clearTokens(): void;
}

/**
 * LocalStorage-based token storage implementation
 */
export class LocalStorageTokenStorage implements ITokenStorage {
  private static readonly ACCESS_TOKEN_KEY = "flora.auth.accessToken";
  private static readonly REFRESH_TOKEN_KEY = "flora.auth.refreshToken";

  public getAccessToken(): string | undefined {
    return localStorage.getItem(LocalStorageTokenStorage.ACCESS_TOKEN_KEY) ?? undefined;
  }

  public getRefreshToken(): string | undefined {
    return localStorage.getItem(LocalStorageTokenStorage.REFRESH_TOKEN_KEY) ?? undefined;
  }

  public setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(LocalStorageTokenStorage.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(LocalStorageTokenStorage.REFRESH_TOKEN_KEY, refreshToken);
  }

  public clearTokens(): void {
    localStorage.removeItem(LocalStorageTokenStorage.ACCESS_TOKEN_KEY);
    localStorage.removeItem(LocalStorageTokenStorage.REFRESH_TOKEN_KEY);
  }
}

/**
 * API client for flora-server communication
 */
export class ApiClient {
  private readonly baseUrl: string;
  private readonly tokenStorage: ITokenStorage;
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | undefined;

  public constructor(baseUrl: string, tokenStorage: ITokenStorage) {
    this.baseUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash
    this.tokenStorage = tokenStorage;
  }

  /**
   * Make an API request
   */
  public async request<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
    const { method = "GET", body, headers = {}, skipAuth = false } = options;

    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...headers,
    };

    // Add authorization header if we have a token and auth is not skipped
    if (!skipAuth) {
      const accessToken = this.tokenStorage.getAccessToken();
      if (accessToken) {
        requestHeaders["Authorization"] = `Bearer ${accessToken}`;
      }
    }

    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401 && !skipAuth) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        // Retry the original request with new token
        return this.request<T>(endpoint, options);
      }
      // Token refresh failed, throw error
      throw new ApiError("UNAUTHORIZED", "Session expired. Please sign in again.", 401);
    }

    const data = (await response.json()) as T | ApiErrorResponse;

    if (!response.ok) {
      const errorResponse = data as ApiErrorResponse;
      throw new ApiError(
        errorResponse.error?.code ?? "UNKNOWN_ERROR",
        errorResponse.error?.message ?? "An unknown error occurred",
        response.status,
      );
    }

    return data as T;
  }

  /**
   * Try to refresh the access token using the refresh token
   */
  private async tryRefreshToken(): Promise<boolean> {
    // If already refreshing, wait for that to complete
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = this.tokenStorage.getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performRefresh(refreshToken);

    try {
      return await this.refreshPromise;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = undefined;
    }
  }

  private async performRefresh(refreshToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        this.tokenStorage.clearTokens();
        return false;
      }

      const data = (await response.json()) as {
        accessToken: string;
        refreshToken: string;
      };

      this.tokenStorage.setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      this.tokenStorage.clearTokens();
      return false;
    }
  }

  /**
   * GET request helper
   */
  public async get<T>(endpoint: string, options?: Omit<ApiRequestOptions, "method" | "body">): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  /**
   * POST request helper
   */
  public async post<T>(endpoint: string, body?: unknown, options?: Omit<ApiRequestOptions, "method" | "body">): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "POST", body });
  }

  /**
   * PUT request helper
   */
  public async put<T>(endpoint: string, body?: unknown, options?: Omit<ApiRequestOptions, "method" | "body">): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "PUT", body });
  }

  /**
   * DELETE request helper
   */
  public async delete<T>(endpoint: string, options?: Omit<ApiRequestOptions, "method" | "body">): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}
