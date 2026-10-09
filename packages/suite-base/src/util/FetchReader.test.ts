// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import FetchReader from "./FetchReader";

describe("FetchReader", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  it("emits streamed data followed by end", async () => {
    const read = jest
      .fn()
      .mockResolvedValueOnce({ done: false, value: new Uint8Array([1, 2]) })
      .mockResolvedValueOnce({ done: true });
    fetchMock.mockResolvedValue({ ok: true, body: { getReader: () => ({ read }) } });
    const reader = new FetchReader("https://example.test");
    const data = jest.fn();
    const end = jest.fn();
    reader.on("data", data);
    reader.on("end", end);

    reader.read();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(data).toHaveBeenCalledWith(new Uint8Array([1, 2]));
    expect(end).toHaveBeenCalledTimes(1);
  });

  it("emits a useful error for unsuccessful responses", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404, statusText: "Not Found" });
    const reader = new FetchReader("https://example.test");
    const error = new Promise<Error>((resolve) => reader.on("error", resolve));

    reader.read();

    await expect(error).resolves.toEqual(
      new Error("GET <$https://example.test> failed with status 404 (Not Found)"),
    );
  });

  it.each([
    ["rejected fetch", () => Promise.reject(new Error("offline")), "GET <https://example.test> failed: Error: offline"],
    ["response without a body", () => Promise.resolve({ ok: true, body: undefined }), "GET <https://example.test> succeeded, but returned no data"],
    [
      "reader initialization failure",
      () => Promise.resolve({ ok: true, body: { getReader: () => { throw new Error("locked"); } } }),
      "GET <https://example.test> succeeded, but failed to stream",
    ],
  ])("emits an error for %s", async (_name, response, message) => {
    fetchMock.mockImplementation(response);
    const reader = new FetchReader("https://example.test");
    const error = new Promise<Error>((resolve) => reader.on("error", resolve));

    reader.read();

    await expect(error).resolves.toEqual(new Error(message));
  });

  it("emits read errors and turns aborted read errors into end", async () => {
    const read = jest.fn().mockRejectedValue(new Error("stream failed"));
    fetchMock.mockResolvedValue({ ok: true, body: { getReader: () => ({ read }) } });
    const reader = new FetchReader("https://example.test");
    const error = new Promise<Error>((resolve) => reader.on("error", resolve));

    reader.read();
    await expect(error).resolves.toEqual(new Error("stream failed"));
  });

  it("wraps non-Error read rejections", async () => {
    const read = jest.fn().mockRejectedValue("stream failed");
    fetchMock.mockResolvedValue({ ok: true, body: { getReader: () => ({ read }) } });
    const reader = new FetchReader("https://example.test");
    const error = new Promise<Error>((resolve) => reader.on("error", resolve));

    reader.read();

    await expect(error).resolves.toEqual(new Error("stream failed"));
  });

  it("emits end when an in-flight read fails after destruction", async () => {
    let rejectRead!: (error: Error) => void;
    const read = jest.fn(
      () =>
        new Promise((_, reject) => {
          rejectRead = reject;
        }),
    );
    fetchMock.mockResolvedValue({ ok: true, body: { getReader: () => ({ read }) } });
    const reader = new FetchReader("https://example.test");
    const end = new Promise<void>((resolve) => reader.on("end", resolve));

    reader.read();
    await new Promise((resolve) => setTimeout(resolve, 0));
    reader.destroy();
    rejectRead(new Error("aborted"));

    await end;
  });

  it("aborts the underlying request when destroyed", () => {
    fetchMock.mockResolvedValue({ ok: true, body: { getReader: jest.fn() } });
    const reader = new FetchReader("https://example.test");

    reader.destroy();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.test",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });
});
