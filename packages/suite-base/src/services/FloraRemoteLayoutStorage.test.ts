// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { FloraRemoteLayoutStorage } from "./FloraRemoteLayoutStorage";

const layout = {
  id: "layout-1",
  name: "Layout",
  permission: "PRIVATE",
  data: { configById: {}, layout: "" },
  savedAt: "2026-07-20T00:00:00Z",
  orgId: null,
  createdAt: "created",
  updatedAt: "updated",
};

describe("FloraRemoteLayoutStorage", () => {
  const apiClient = { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() };

  beforeEach(() => jest.clearAllMocks());

  it("uses user and organization namespaces when listing layouts", async () => {
    apiClient.get.mockResolvedValue([layout]);
    const userStorage = new FloraRemoteLayoutStorage(apiClient as never, "user");
    const orgStorage = new FloraRemoteLayoutStorage(apiClient as never, "user", "org");

    await expect(userStorage.getLayouts()).resolves.toEqual([
      expect.objectContaining({ id: "layout-1", savedAt: layout.savedAt }),
    ]);
    await expect(orgStorage.getLayouts()).resolves.toEqual([
      expect.objectContaining({ id: "layout-1" }),
    ]);
    expect(userStorage.namespace).toBe("user");
    expect(orgStorage.namespace).toBe("org-org");
    expect(apiClient.get).toHaveBeenNthCalledWith(1, "/api/layouts");
    expect(apiClient.get).toHaveBeenNthCalledWith(2, "/api/layouts?orgId=org");
  });

  it("handles layout reads, saves, updates, conflicts, and deletion", async () => {
    const storage = new FloraRemoteLayoutStorage(apiClient as never, "user", "org");
    apiClient.get
      .mockResolvedValueOnce(layout)
      .mockRejectedValueOnce(new Error("layout not found"))
      .mockRejectedValueOnce(new Error("network error"));
    apiClient.post.mockResolvedValue(layout);
    apiClient.put
      .mockResolvedValueOnce({ status: "success", newLayout: layout })
      .mockResolvedValueOnce({
        status: "conflict",
      });
    apiClient.delete.mockResolvedValue({ deleted: false });

    await expect(storage.getLayout("layout-1" as never)).resolves.toEqual(
      expect.objectContaining({ name: "Layout" }),
    );
    await expect(storage.getLayout("missing" as never)).resolves.toBeUndefined();
    await expect(storage.getLayout("broken" as never)).rejects.toThrow("network error");
    await expect(
      storage.saveNewLayout({
        id: undefined,
        name: "Layout",
        data: layout.data as never,
        permission: "PRIVATE" as never,
        savedAt: layout.savedAt as never,
      }),
    ).resolves.toEqual(expect.objectContaining({ id: "layout-1" }));
    await expect(
      storage.updateLayout({
        id: "layout-1" as never,
        name: "Updated",
        savedAt: layout.savedAt as never,
      }),
    ).resolves.toEqual({
      status: "success",
      newLayout: expect.objectContaining({ id: "layout-1" }),
    });
    await expect(
      storage.updateLayout({ id: "layout-1" as never, savedAt: layout.savedAt as never }),
    ).resolves.toEqual({ status: "conflict" });
    await expect(storage.deleteLayout("layout-1" as never)).resolves.toBe(false);
    expect(apiClient.post).toHaveBeenCalledWith(
      "/api/layouts",
      expect.objectContaining({ orgId: "org" }),
    );
    expect(apiClient.delete).toHaveBeenCalledWith("/api/layouts/layout-1");
  });
});
