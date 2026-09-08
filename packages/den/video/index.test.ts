// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { getFrameInfo, isVideoFrame } from "./index";

describe("video helpers", () => {
  it("dispatches supported compressed video formats", () => {
    expect(
      getFrameInfo({ format: "h264", data: new Uint8Array([0, 0, 1, 0x65]) } as never),
    ).toEqual({
      isKeyFrame: true,
      mayNeedRewrite: true,
    });
    expect(
      getFrameInfo({ format: "h265", data: new Uint8Array([0, 0, 1, 0x26]) } as never),
    ).toEqual({
      isKeyFrame: true,
      mayNeedRewrite: false,
    });
    expect(getFrameInfo({ format: "vp9", data: new Uint8Array([0x82]) } as never)).toEqual({
      isKeyFrame: true,
      mayNeedRewrite: false,
    });
    expect(getFrameInfo({ format: "av1", data: new Uint8Array([0x1a, 1, 0]) } as never)).toEqual({
      isKeyFrame: true,
      mayNeedRewrite: false,
    });
    expect(getFrameInfo({ format: "other", data: new Uint8Array() } as never)).toEqual({
      isKeyFrame: false,
      mayNeedRewrite: false,
    });
  });

  it("recognizes VideoFrame only when the constructor exists", () => {
    const original = globalThis.VideoFrame;
    class TestVideoFrame {}
    Object.assign(globalThis, { VideoFrame: TestVideoFrame });

    expect(isVideoFrame(new TestVideoFrame())).toBe(true);
    expect(isVideoFrame({})).toBe(false);

    Object.assign(globalThis, { VideoFrame: original });
  });
});
