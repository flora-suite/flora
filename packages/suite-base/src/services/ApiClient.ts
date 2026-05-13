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
 * Callback type for session expiry notification
 */
export type SessionExpiredCallback = () => void;

/**
 * API client for flora-server communication
 */
export class ApiClient {
  private readonly baseUrl: string;
  private readonly tokenStorage: ITokenStorage;
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | undefined;
  private onSessionExpired: SessionExpiredCallback | undefined;

  public constructor(baseUrl: string, tokenStorage: ITokenStorage) {
    this.baseUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash
    this.tokenStorage = tokenStorage;
  }

  /**
   * Set callback to be called when session expires and cannot be refreshed
   */
  public setSessionExpiredCallback(callback: SessionExpiredCallback | undefined): void {
    this.onSessionExpired = callback;
  }

  /**
   * Notify that session has expired
   */
  private notifySessionExpired(): void {
    if (this.onSessionExpired) {
      this.onSessionExpired();
    }
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
        return await this.request<T>(endpoint, options);
      }
      // Token refresh failed, notify and throw error
      this.notifySessionExpired();
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
      return await this.refreshPromise;
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
    return await this.request<T>(endpoint, { ...options, method: "GET" });
  }

  /**
   * POST request helper
   */
  public async post<T>(endpoint: string, body?: unknown, options?: Omit<ApiRequestOptions, "method" | "body">): Promise<T> {
    return await this.request<T>(endpoint, { ...options, method: "POST", body });
  }

  /**
   * PUT request helper
   */
  public async put<T>(endpoint: string, body?: unknown, options?: Omit<ApiRequestOptions, "method" | "body">): Promise<T> {
    return await this.request<T>(endpoint, { ...options, method: "PUT", body });
  }

  /**
   * PATCH request helper
   */
  public async patch<T>(endpoint: string, body?: unknown, options?: Omit<ApiRequestOptions, "method" | "body">): Promise<T> {
    return await this.request<T>(endpoint, { ...options, method: "PATCH", body });
  }

  /**
   * DELETE request helper
   */
  public async delete<T>(endpoint: string, options?: Omit<ApiRequestOptions, "method" | "body">): Promise<T> {
    return await this.request<T>(endpoint, { ...options, method: "DELETE" });
  }

  /**
   * Get the base URL
   */
  public getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Get the current access token
   */
  public getAccessToken(): string | undefined {
    return this.tokenStorage.getAccessToken();
  }

  /**
   * Upload a file using FormData
   */
  public async uploadFile<T>(endpoint: string, formData: FormData): Promise<T> {
    const accessToken = this.tokenStorage.getAccessToken();

    const headers: Record<string, string> = {};
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });

    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        return await this.uploadFile<T>(endpoint, formData);
      }
      this.notifySessionExpired();
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
   * Download a file as Blob
   */
  public async downloadBlob(endpoint: string): Promise<Blob> {
    const accessToken = this.tokenStorage.getAccessToken();

    const headers: Record<string, string> = {};
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        return await this.downloadBlob(endpoint);
      }
      this.notifySessionExpired();
      throw new ApiError("UNAUTHORIZED", "Session expired. Please sign in again.", 401);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: "Download failed" } })) as ApiErrorResponse;
      throw new ApiError(
        errorData.error?.code ?? "DOWNLOAD_ERROR",
        errorData.error?.message ?? "Download failed",
        response.status,
      );
    }

    return await response.blob();
  }

  /**
   * Upload progress callback type
   */
  public async uploadFileWithProgress<T>(
    endpoint: string,
    formData: FormData,
    onProgress?: (loaded: number, total: number) => void,
  ): Promise<T> {
    const accessToken = this.tokenStorage.getAccessToken();
    const url = `${this.baseUrl}${endpoint}`;

    return await new Promise<T>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress(event.loaded, event.total);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status === 401) {
          // Handle 401 - try refresh token
          this.tryRefreshToken()
            .then((refreshed) => {
              if (refreshed) {
                // Retry with new token
                this.uploadFileWithProgress<T>(endpoint, formData, onProgress)
                  .then(resolve)
                  .catch(reject);
              } else {
                this.notifySessionExpired();
                reject(new ApiError("UNAUTHORIZED", "Session expired. Please sign in again.", 401));
              }
            })
            .catch(reject);
          return;
        }

        try {
          const data = JSON.parse(xhr.responseText) as T | ApiErrorResponse;

          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(data as T);
          } else {
            const errorResponse = data as ApiErrorResponse;
            reject(
              new ApiError(
                errorResponse.error?.code ?? "UNKNOWN_ERROR",
                errorResponse.error?.message ?? "An unknown error occurred",
                xhr.status,
              ),
            );
          }
        } catch {
          reject(new ApiError("PARSE_ERROR", "Failed to parse response", xhr.status));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new ApiError("NETWORK_ERROR", "Network error occurred", 0));
      });

      xhr.addEventListener("abort", () => {
        reject(new ApiError("ABORTED", "Upload was aborted", 0));
      });

      xhr.open("POST", url);

      if (accessToken) {
        xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
      }

      xhr.send(formData);
    });
  }
}
