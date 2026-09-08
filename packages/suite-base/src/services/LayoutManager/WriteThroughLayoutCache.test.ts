// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

import WriteThroughLayoutCache from "./WriteThroughLayoutCache";

const one = { id: "one", name: "One" } as never;
const two = { id: "two", name: "Two" } as never;

describe("WriteThroughLayoutCache", () => {
  const storage = {
    list: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    importLayouts: jest.fn(),
    migrateUnnamespacedLayouts: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    storage.list.mockResolvedValue([one]);
    storage.put.mockImplementation(async (_namespace, layout) => layout);
  });

  it("loads each namespace once and updates its in-memory view after writes", async () => {
    const cache = new WriteThroughLayoutCache(storage as never);
    await expect(cache.list("personal")).resolves.toEqual([one]);
    await expect(cache.get("personal", "one" as never)).resolves.toBe(one);
    expect(storage.list).toHaveBeenCalledTimes(1);

    await expect(cache.put("personal", two)).resolves.toBe(two);
    await expect(cache.list("personal")).resolves.toEqual([one, two]);
    await cache.delete("personal", "one" as never);
    await expect(cache.get("personal", "one" as never)).resolves.toBeUndefined();
    expect(storage.delete).toHaveBeenCalledWith("personal", "one");
  });

  it("keeps independent namespace caches and delegates migration operations", async () => {
    const cache = new WriteThroughLayoutCache(storage as never);
    await cache.list("personal");
    await cache.list("organization");
    expect(storage.list).toHaveBeenCalledTimes(2);

    await cache.importLayouts({ fromNamespace: "old", toNamespace: "new" });
    await cache.migrateUnnamespacedLayouts("new");
    expect(storage.importLayouts).toHaveBeenCalledWith({
      fromNamespace: "old",
      toNamespace: "new",
    });
    expect(storage.migrateUnnamespacedLayouts).toHaveBeenCalledWith("new");
  });
});
