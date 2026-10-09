// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { VP9 } from "./VP9";

describe("VP9", () => {
  it("rejects empty frames and invalid frame markers", () => {
    expect(VP9.IsKeyframe(new Uint8Array())).toBe(false);
    expect(() => VP9.IsKeyframe(new Uint8Array([0]))).toThrow("expected frame_marker 2");
  });

  it("identifies visible keyframes for regular and profile-three headers", () => {
    expect(VP9.IsKeyframe(new Uint8Array([0x82]))).toBe(true);
    expect(VP9.IsKeyframe(new Uint8Array([0xb1]))).toBe(true);
    expect(VP9.IsKeyframe(new Uint8Array([0x86]))).toBe(false);
    expect(VP9.IsKeyframe(new Uint8Array([0xb3]))).toBe(false);
    expect(VP9.IsKeyframe(new Uint8Array([0x8a]))).toBe(false);
  });
});
