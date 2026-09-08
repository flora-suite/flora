// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

import MockLayoutManager from "./MockLayoutManager";

describe("MockLayoutManager", () => {
  it("provides neutral state and independently callable manager operations", async () => {
    const manager = new MockLayoutManager();
    expect(manager).toMatchObject({
      supportsSharing: false,
      isBusy: false,
      isOnline: false,
      error: undefined,
    });
    await expect(manager.getLayouts()).resolves.toEqual([]);

    manager.on("change" as never, jest.fn());
    manager.off("change" as never, jest.fn());
    manager.setError(new Error("failed"));
    manager.setOnline(true);
    manager.getLayout("layout" as never);
    manager.saveNewLayout({} as never);
    manager.updateLayout({} as never);
    manager.deleteLayout("layout" as never);
    manager.overwriteLayout({} as never);
    manager.revertLayout("layout" as never);
    manager.makePersonalCopy("layout" as never);
    manager.syncWithRemote();

    expect(manager.on).toHaveBeenCalledTimes(1);
    expect(manager.syncWithRemote).toHaveBeenCalledTimes(1);
  });
});
