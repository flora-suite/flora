// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

import { AuthService } from "./AuthService";

const user = { id: "user", email: "user@example.com", name: "User" } as never;

describe("AuthService", () => {
  const apiClient = { get: jest.fn(), post: jest.fn() };
  const tokenStorage = {
    getAccessToken: jest.fn(),
    getRefreshToken: jest.fn(),
    setTokens: jest.fn(),
    clearTokens: jest.fn(),
  };
  const service = new AuthService(apiClient as never, tokenStorage);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("logs in and registers with unauthenticated requests", async () => {
    apiClient.post.mockResolvedValueOnce({ user, accessToken: "access", refreshToken: "refresh" });
    await expect(service.login({ email: user.email, password: "secret" } as never)).resolves.toBe(
      user,
    );
    expect(apiClient.post).toHaveBeenLastCalledWith(
      "/api/auth/login",
      { email: user.email, password: "secret" },
      { skipAuth: true },
    );

    apiClient.post.mockResolvedValueOnce({
      user,
      accessToken: "new-access",
      refreshToken: "new-refresh",
    });
    await expect(
      service.register({ email: user.email, password: "secret" } as never),
    ).resolves.toBe(user);
    expect(tokenStorage.setTokens).toHaveBeenLastCalledWith("new-access", "new-refresh");
  });

  it("clears tokens on logout whether or not the server accepts it", async () => {
    tokenStorage.getRefreshToken.mockReturnValueOnce("refresh");
    apiClient.post.mockRejectedValueOnce(new Error("expired"));
    await service.logout();
    expect(apiClient.post).toHaveBeenCalledWith("/api/auth/logout", { refreshToken: "refresh" });
    expect(tokenStorage.clearTokens).toHaveBeenCalledTimes(1);

    await service.logout();
    expect(apiClient.post).toHaveBeenCalledTimes(1);
  });

  it("loads the current user and refreshes a valid session", async () => {
    apiClient.get.mockResolvedValueOnce(user);
    await expect(service.getCurrentUser()).resolves.toBe(user);
    expect(apiClient.get).toHaveBeenCalledWith("/api/auth/me");

    tokenStorage.getRefreshToken.mockReturnValueOnce("refresh");
    apiClient.post.mockResolvedValueOnce({ accessToken: "access", refreshToken: "next-refresh" });
    await service.refreshTokens();
    expect(apiClient.post).toHaveBeenCalledWith(
      "/api/auth/refresh",
      { refreshToken: "refresh" },
      { skipAuth: true },
    );
    expect(tokenStorage.setTokens).toHaveBeenLastCalledWith("access", "next-refresh");
  });

  it("rejects refresh without a token and reports session availability", async () => {
    await expect(service.refreshTokens()).rejects.toThrow("No refresh token available");
    tokenStorage.getAccessToken.mockReturnValueOnce(undefined);
    expect(service.hasValidSession()).toBe(false);
    tokenStorage.getAccessToken.mockReturnValueOnce("access");
    expect(service.hasValidSession()).toBe(true);
  });
});
