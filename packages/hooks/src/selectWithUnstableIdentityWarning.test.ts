// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { selectWithUnstableIdentityWarning } from "./selectWithUnstableIdentityWarning";

describe("selectWithUnstableIdentityWarning", () => {
  it("returns the selector result", () => {
    const selector = jest.fn((value: { count: number }) => value.count * 2);

    expect(selectWithUnstableIdentityWarning({ count: 3 }, selector)).toBe(6);
    expect(selector).toHaveBeenCalledWith({ count: 3 });
  });
});
