// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import MockLayoutStorage from "./MockLayoutStorage";

const layout = { id: "layout-1", name: "Initial" } as never;

describe("MockLayoutStorage", () => {
  it("keeps layouts isolated by namespace and supports mutations", async () => {
    const storage = new MockLayoutStorage("default", [layout]);
    const secondLayout = { id: "layout-2", name: "Second" } as never;

    await expect(storage.list("default")).resolves.toEqual([layout]);
    await expect(storage.get("default", "layout-1")).resolves.toEqual(layout);
    await expect(storage.get("unknown", "layout-1")).resolves.toBeUndefined();
    await expect(storage.put("other", secondLayout)).resolves.toEqual(secondLayout);
    await expect(storage.list("other")).resolves.toEqual([secondLayout]);

    await storage.delete("default", "layout-1");
    await storage.delete("unknown", "missing");
    await storage.importLayouts();
    await expect(storage.list("default")).resolves.toEqual([]);
  });
});
