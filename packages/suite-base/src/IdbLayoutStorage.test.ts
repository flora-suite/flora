// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { IdbLayoutStorage } from "./IdbLayoutStorage";

const makeLayout = (id: string) =>
  ({
    id,
    name: `Layout ${id}`,
    permission: "CREATOR_WRITE",
    baseline: { data: { configById: {}, layout: "" }, savedAt: undefined },
    working: undefined,
    syncInfo: undefined,
  }) as never;

describe("IdbLayoutStorage", () => {
  it("stores, lists, reads, deletes, and migrates namespaced layouts", async () => {
    const storage = new IdbLayoutStorage();
    const first = makeLayout(`first-${Date.now()}`);
    const second = makeLayout(`second-${Date.now()}`);
    const sourceNamespace = `source-${Date.now()}`;

    await expect(storage.put(sourceNamespace, first)).resolves.toEqual(first);
    await storage.put(sourceNamespace, second);
    await expect(storage.list(sourceNamespace)).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: first.id }),
        expect.objectContaining({ id: second.id }),
      ]),
    );
    await expect(storage.get(sourceNamespace, first.id)).resolves.toEqual(
      expect.objectContaining({ id: first.id }),
    );
    await expect(storage.get(sourceNamespace, "missing")).resolves.toBeUndefined();
    await storage.put(sourceNamespace, { id: "invalid-layout" } as never);
    await expect(storage.list(sourceNamespace)).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: first.id })]),
    );
    (console.error as jest.Mock).mockClear();

    await storage.delete(sourceNamespace, first.id);
    await expect(storage.get(sourceNamespace, first.id)).resolves.toBeUndefined();
    await storage.migrateUnnamespacedLayouts(sourceNamespace);
  });

  it("migrates valid legacy localStorage layouts", async () => {
    const storage = new IdbLayoutStorage();
    const namespace = `legacy-${Date.now()}`;
    const layout = makeLayout(`layout-${Date.now()}`);
    const validKey = `studio.layouts.${namespace}.${layout.id}`;
    localStorage.setItem(validKey, JSON.stringify(layout));

    await storage.migrateUnnamespacedLayouts(namespace);

    await expect(storage.get(namespace, layout.id)).resolves.toEqual(
      expect.objectContaining({ id: layout.id }),
    );
    expect(localStorage.getItem(validKey)).toBeNull();
  });

  it("retains malformed legacy localStorage entries without stopping migration", async () => {
    const storage = new IdbLayoutStorage();
    const namespace = `invalid-${Date.now()}`;
    const layout = makeLayout(`layout-${Date.now()}`);
    const invalidJsonKey = `studio.layouts.${namespace}.invalid-json`;
    const mismatchedKey = `studio.layouts.${namespace}.wrong-id`;
    localStorage.setItem(invalidJsonKey, "not json");
    localStorage.setItem(mismatchedKey, JSON.stringify(layout));

    await storage.migrateUnnamespacedLayouts(namespace);

    expect(localStorage.getItem(invalidJsonKey)).toBe("not json");
    expect(localStorage.getItem(mismatchedKey)).not.toBeNull();
    (console.error as jest.Mock).mockClear();
    localStorage.removeItem(invalidJsonKey);
    localStorage.removeItem(mismatchedKey);
  });
});
