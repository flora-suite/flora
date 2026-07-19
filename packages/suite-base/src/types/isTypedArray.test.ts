// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

import { isTypedArray } from "./isTypedArray";

describe("isTypedArray", () => {
  it("identifies all typed-array views and rejects other values", () => {
    expect(isTypedArray(new Uint8Array([1]))).toBe(true);
    expect(isTypedArray(new Float64Array([1]))).toBe(true);
    expect(isTypedArray(new DataView(new ArrayBuffer(1)))).toBe(false);
    expect(isTypedArray([1])).toBe(false);
    expect(isTypedArray(undefined)).toBe(false);
  });
});
