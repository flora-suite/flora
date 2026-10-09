// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { H265 } from "./H265";

describe("H265", () => {
  it("recognizes Annex B start codes", () => {
    expect(H265.IsAnnexB(new Uint8Array([0, 0, 1, 0x26]))).toBe(true);
    expect(H265.IsAnnexB(new Uint8Array([1, 2, 3, 4]))).toBe(false);
  });

  it("finds IRAP NAL units across an Annex B stream", () => {
    expect(H265.IsKeyframe(new Uint8Array([0, 0, 1, 0x02, 0, 0, 1, 0x26]))).toBe(true);
    expect(H265.IsKeyframe(new Uint8Array([0, 0, 1, 0x02, 0, 0, 1, 0x1e]))).toBe(false);
    expect(H265.IsKeyframe(new Uint8Array([1, 2, 3, 4]))).toBe(false);
  });
});
