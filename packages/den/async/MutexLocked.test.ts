// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import MutexLocked from "./MutexLocked";

describe("MutexLocked", () => {
  it("serializes access to the wrapped value", async () => {
    const locked = new MutexLocked({ count: 0 });
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    const first = locked.runExclusive(async (value) => {
      value.count += 1;
      await gate;
      return value.count;
    });
    await Promise.resolve();
    expect(locked.isLocked()).toBe(true);

    const second = locked.runExclusive(async (value) => {
      value.count += 1;
      return value.count;
    });
    release();

    await expect(first).resolves.toBe(1);
    await expect(second).resolves.toBe(2);
    expect(locked.isLocked()).toBe(false);
  });
});
