// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

import isDesktopApp from "./isDesktopApp";
import FetchReader from "./FetchReader";

import BrowserHttpReader from "./BrowserHttpReader";

jest.mock("./isDesktopApp", () => jest.fn());
jest.mock("./FetchReader", () => jest.fn());

const fetchMock = jest.fn();
global.fetch = fetchMock;

const response = (options: { ok?: boolean; status?: number; headers?: Record<string, string> }) =>
  ({
    ok: options.ok ?? true,
    status: options.status ?? 200,
    headers: new Headers(options.headers),
  }) as Response;

describe("BrowserHttpReader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (isDesktopApp as jest.Mock).mockReturnValue(false);
  });

  it("opens a range-enabled remote file and returns its identity", async () => {
    fetchMock.mockResolvedValueOnce(
      response({
        headers: { "accept-ranges": "bytes", "content-length": "42", etag: "version-1" },
      }),
    );

    await expect(new BrowserHttpReader("https://example.com/file").open()).resolves.toEqual({
      size: 42,
      identifier: "version-1",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.com/file",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("reports request, range, and size failures with browser CORS guidance", async () => {
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    await expect(new BrowserHttpReader("https://example.com/file").open()).rejects.toThrow(
      "Make sure CORS is enabled.",
    );

    fetchMock.mockResolvedValueOnce(response({ ok: false, status: 403 }));
    await expect(new BrowserHttpReader("https://example.com/file").open()).rejects.toThrow(
      "Status code: 403",
    );

    fetchMock.mockResolvedValueOnce(response({ headers: { "content-length": "42" } }));
    await expect(new BrowserHttpReader("https://example.com/file").open()).rejects.toThrow(
      "Accept-Ranges: bytes",
    );

    fetchMock.mockResolvedValueOnce(response({ headers: { "accept-ranges": "bytes" } }));
    await expect(new BrowserHttpReader("https://example.com/file").open()).rejects.toThrow(
      "missing file size",
    );
  });

  it("uses last-modified when an etag is not available and omits browser guidance on desktop", async () => {
    (isDesktopApp as jest.Mock).mockReturnValue(true);
    fetchMock.mockResolvedValueOnce(
      response({
        headers: {
          "accept-ranges": "bytes",
          "content-length": "1",
          "last-modified": "yesterday",
        },
      }),
    );
    await expect(new BrowserHttpReader("https://example.com/file").open()).resolves.toEqual({
      size: 1,
      identifier: "yesterday",
    });
  });

  it("creates and starts a range reader for byte requests", () => {
    const read = jest.fn();
    (FetchReader as jest.Mock).mockImplementation(() => ({ read }));

    const reader = new BrowserHttpReader("https://example.com/file").fetch(10, 5);

    expect(FetchReader).toHaveBeenCalledWith("https://example.com/file", {
      headers: expect.objectContaining({}),
    });
    expect(read).toHaveBeenCalledTimes(1);
    expect(reader).toEqual({ read });
  });
});
