// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

import { NamespacedLayoutStorage } from "./NamespacedLayoutStorage";

const layout = { id: "layout", name: "Layout" } as never;

describe("NamespacedLayoutStorage", () => {
  const storage = {
    list: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    migrateUnnamespacedLayouts: jest.fn(),
    importLayouts: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    storage.migrateUnnamespacedLayouts.mockResolvedValue(undefined);
    storage.importLayouts.mockResolvedValue(undefined);
  });

  it("waits for migrations before delegating all storage operations", async () => {
    storage.list.mockResolvedValue([layout]);
    storage.get.mockResolvedValue(layout);
    storage.put.mockResolvedValue(layout);
    const namespaced = new NamespacedLayoutStorage(storage as never, "target", {
      migrateUnnamespacedLayouts: true,
      importFromNamespace: "source",
    });

    await expect(namespaced.list()).resolves.toEqual([layout]);
    await expect(namespaced.get("layout" as never)).resolves.toBe(layout);
    await expect(namespaced.put(layout)).resolves.toBe(layout);
    await expect(namespaced.delete("layout" as never)).resolves.toBeUndefined();

    expect(storage.migrateUnnamespacedLayouts).toHaveBeenCalledWith("target");
    expect(storage.importLayouts).toHaveBeenCalledWith({
      fromNamespace: "source",
      toNamespace: "target",
    });
    expect(storage.list).toHaveBeenCalledWith("target");
    expect(storage.get).toHaveBeenCalledWith("target", "layout");
    expect(storage.put).toHaveBeenCalledWith("target", layout);
    expect(storage.delete).toHaveBeenCalledWith("target", "layout");
  });

  it("continues operations after an optional migration fails", async () => {
    storage.migrateUnnamespacedLayouts.mockRejectedValueOnce(new Error("migration failed"));
    storage.importLayouts.mockRejectedValueOnce(new Error("import failed"));
    storage.list.mockResolvedValue([]);
    const namespaced = new NamespacedLayoutStorage(storage as never, "target", {
      migrateUnnamespacedLayouts: true,
      importFromNamespace: "source",
    });

    await expect(namespaced.list()).resolves.toEqual([]);
    (console.error as jest.Mock).mockClear();
  });

  it("skips optional migrations when neither was requested", async () => {
    storage.get.mockResolvedValue(undefined);
    const namespaced = new NamespacedLayoutStorage(storage as never, "target", {
      migrateUnnamespacedLayouts: false,
      importFromNamespace: undefined,
    });

    await expect(namespaced.get("missing" as never)).resolves.toBeUndefined();
    expect(storage.migrateUnnamespacedLayouts).not.toHaveBeenCalled();
    expect(storage.importLayouts).not.toHaveBeenCalled();
  });
});
