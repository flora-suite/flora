// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { AV1 } from "./AV1";

describe("AV1", () => {
  it("rejects an empty stream and OBU headers with the forbidden bit", () => {
    expect(AV1.IsKeyframe(new Uint8Array())).toBe(false);
    expect(AV1.IsKeyframe(new Uint8Array([0x80]))).toBe(false);
  });

  it("rejects unsupported OBUs without a size field", () => {
    expect(() => AV1.IsKeyframe(new Uint8Array([0x28]))).toThrow("Unsupported OBU type 5");
  });

  it("reads keyframe and inter-frame headers after a sized OBU extension", () => {
    expect(AV1.IsKeyframe(new Uint8Array([0x1a, 1, 0]))).toBe(true);
    expect(AV1.IsKeyframe(new Uint8Array([0x1a, 1, 0x20]))).toBe(false);
  });

  it("handles the size-field offset before decoding an extended OBU", () => {
    expect(AV1.IsKeyframe(new Uint8Array([0x1e, 0, 1, 0]))).toBe(true);
  });

  it("skips non-frame OBUs with an explicit payload size", () => {
    expect(AV1.IsKeyframe(new Uint8Array([0x2a, 1, 0xff]))).toBe(false);
  });
});
