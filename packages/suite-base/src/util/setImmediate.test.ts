// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

import setImmediate from "./setImmediate";

describe("setImmediate", () => {
  it("schedules the callback on a microtask with all arguments", async () => {
    const callback = jest.fn();
    expect(setImmediate(callback, "value", 2)).toBeUndefined();
    expect(callback).not.toHaveBeenCalled();
    await Promise.resolve();
    expect(callback).toHaveBeenCalledWith("value", 2);
  });
});
