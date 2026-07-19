// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ApiClient, ApiError, LocalStorageTokenStorage } from "./ApiClient";

const response = (status: number, data: unknown, extra: Record<string, unknown> = {}) =>
  ({
    status,
    ok: status >= 200 && status < 300,
    json: jest.fn().mockResolvedValue(data),
    blob: jest.fn().mockResolvedValue(new Blob(["download"])),
    ...extra,
  }) as never;

class MockXmlHttpRequest {
  public static status = 200;
  public static responseText = '{"uploaded":true}';
  public static event: "load" | "error" | "abort" = "load";
  public readonly upload = { addEventListener: jest.fn() };
  public status = MockXmlHttpRequest.status;
  public responseText = MockXmlHttpRequest.responseText;
  private readonly listeners = new Map<string, () => void>();

  public addEventListener(type: string, callback: () => void): void {
    this.listeners.set(type, callback);
  }

  public open = jest.fn();
  public setRequestHeader = jest.fn();

  public send = jest.fn(() => {
    this.listeners.get(MockXmlHttpRequest.event)?.();
  });
}

describe("ApiClient", () => {
  const tokenStorage = {
    getAccessToken: jest.fn(),
    getRefreshToken: jest.fn(),
    setTokens: jest.fn(),
    clearTokens: jest.fn(),
  };
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(globalThis, { fetch: fetchMock });
  });

  it("normalizes URLs and persists local storage tokens", () => {
    const storage = new LocalStorageTokenStorage();
    storage.setTokens("access", "refresh");
    expect(storage.getAccessToken()).toBe("access");
    expect(storage.getRefreshToken()).toBe("refresh");
    storage.clearTokens();
    expect(storage.getAccessToken()).toBeUndefined();
    expect(storage.getRefreshToken()).toBeUndefined();

    const client = new ApiClient("https://api.example/", tokenStorage);
    expect(client.getBaseUrl()).toBe("https://api.example");
    client.setBaseUrl("https://other.example/");
    expect(client.getBaseUrl()).toBe("https://other.example");
  });

  it("serializes authenticated requests and all HTTP helper methods", async () => {
    tokenStorage.getAccessToken.mockReturnValue("access");
    fetchMock.mockResolvedValue(response(200, { ok: true }));
    const client = new ApiClient("https://api.example", tokenStorage);

    await expect(client.get("/get", { headers: { Accept: "application/json" } })).resolves.toEqual({
      ok: true,
    });
    await client.post("/post", { value: 1 });
    await client.put("/put", { value: 2 });
    await client.patch("/patch", { value: 3 });
    await client.delete("/delete");
    await client.request("/anonymous", { skipAuth: true });

    expect(fetchMock).toHaveBeenNthCalledWith(1, "https://api.example/get", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: "Bearer access",
      },
      body: undefined,
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.example/post",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ value: 1 }),
      }),
    );
    expect(fetchMock).toHaveBeenLastCalledWith("https://api.example/anonymous", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      body: undefined,
    });
    expect(client.getAccessToken()).toBe("access");
  });

  it("maps unsuccessful API responses to ApiError", async () => {
    fetchMock
      .mockResolvedValueOnce(response(400, { error: { code: "BAD", message: "Bad request" } }))
      .mockResolvedValueOnce(response(500, {}));
    const client = new ApiClient("https://api.example", tokenStorage);

    await expect(client.get("/bad")).rejects.toMatchObject<ApiError>({
      name: "ApiError",
      code: "BAD",
      statusCode: 400,
      message: "Bad request",
    });
    await expect(client.get("/unknown")).rejects.toMatchObject<ApiError>({
      code: "UNKNOWN_ERROR",
      message: "An unknown error occurred",
      statusCode: 500,
    });
  });

  it("refreshes and retries an unauthorized request", async () => {
    tokenStorage.getAccessToken.mockReturnValue("old");
    tokenStorage.getRefreshToken.mockReturnValue("refresh");
    fetchMock
      .mockResolvedValueOnce(response(401, {}))
      .mockResolvedValueOnce(response(200, { accessToken: "new", refreshToken: "new-refresh" }))
      .mockResolvedValueOnce(response(200, { value: "retried" }));
    const client = new ApiClient("https://api.example", tokenStorage);

    await expect(client.get("/protected")).resolves.toEqual({ value: "retried" });
    expect(tokenStorage.setTokens).toHaveBeenCalledWith("new", "new-refresh");
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.example/api/auth/refresh",
      expect.any(Object),
    );
  });

  it("notifies on failed refresh and clears invalid tokens", async () => {
    const onExpired = jest.fn();
    tokenStorage.getRefreshToken.mockReturnValue("refresh");
    fetchMock.mockResolvedValueOnce(response(401, {})).mockResolvedValueOnce(response(403, {}));
    const client = new ApiClient("https://api.example", tokenStorage);
    client.setSessionExpiredCallback(onExpired);

    await expect(client.get("/protected")).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      statusCode: 401,
    });
    expect(tokenStorage.clearTokens).toHaveBeenCalledTimes(1);
    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  it("uploads and downloads files with authenticated headers and errors", async () => {
    tokenStorage.getAccessToken.mockReturnValue("access");
    const formData = new FormData();
    formData.append("file", new Blob(["upload"]));
    fetchMock
      .mockResolvedValueOnce(response(200, { uploaded: true }))
      .mockResolvedValueOnce(
        response(200, {}, { blob: jest.fn().mockResolvedValue(new Blob(["file"])) }),
      )
      .mockResolvedValueOnce(response(404, { error: { code: "MISSING", message: "Not found" } }))
      .mockResolvedValueOnce({
        status: 500,
        ok: false,
        json: jest.fn().mockRejectedValue(new Error("not json")),
      });
    const client = new ApiClient("https://api.example", tokenStorage);

    await expect(client.uploadFile("/upload", formData)).resolves.toEqual({ uploaded: true });
    await expect(client.downloadBlob("/download")).resolves.toBeInstanceOf(Blob);
    await expect(client.uploadFile("/missing", formData)).rejects.toMatchObject({
      code: "MISSING",
    });
    await expect(client.downloadBlob("/failed")).rejects.toMatchObject({
      code: "DOWNLOAD_ERROR",
      message: "Download failed",
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://api.example/upload",
      expect.objectContaining({
        method: "POST",
        headers: { Authorization: "Bearer access" },
      }),
    );
  });

  it("reports XMLHttpRequest upload success, malformed responses, and transport failures", async () => {
    Object.assign(globalThis, { XMLHttpRequest: MockXmlHttpRequest });
    tokenStorage.getAccessToken.mockReturnValue("access");
    const client = new ApiClient("https://api.example", tokenStorage);

    MockXmlHttpRequest.status = 201;
    MockXmlHttpRequest.responseText = '{"uploaded":true}';
    MockXmlHttpRequest.event = "load";
    await expect(
      client.uploadFileWithProgress("/upload", new FormData(), jest.fn()),
    ).resolves.toEqual({
      uploaded: true,
    });

    MockXmlHttpRequest.status = 200;
    MockXmlHttpRequest.responseText = "not json";
    await expect(client.uploadFileWithProgress("/upload", new FormData())).rejects.toMatchObject({
      code: "PARSE_ERROR",
      statusCode: 200,
    });

    MockXmlHttpRequest.event = "error";
    await expect(client.uploadFileWithProgress("/upload", new FormData())).rejects.toMatchObject({
      code: "NETWORK_ERROR",
    });
    MockXmlHttpRequest.event = "abort";
    await expect(client.uploadFileWithProgress("/upload", new FormData())).rejects.toMatchObject({
      code: "ABORTED",
    });
  });
});
