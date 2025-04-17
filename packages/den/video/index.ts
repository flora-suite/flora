// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { CompressedVideo } from "@foxglove/schemas";
import { AV1 } from "./AV1";
import { H264 } from "./H264";
import { VP9 } from "./VP9";
import { H265 } from "./H265";

export function getFrameInfo(frame: CompressedVideo) {
  switch (frame.format) {
    case "h264":
      return H264.GetFrameInfo(frame.data);
    case "h265":
      return {
        isKeyFrame: H265.IsKeyframe(frame.data),
        mayNeedRewrite: false,
      };
    case "vp9":
      return {
        isKeyFrame: VP9.IsKeyframe(frame.data),
        mayNeedRewrite: false,
      };
    case "av1":
      return {
        isKeyFrame: AV1.IsKeyframe(frame.data),
        mayNeedRewrite: false,
      };
  }
  return {
    isKeyFrame: false,
    mayNeedRewrite: false,
  };
}

/**
 * Check if the passed object is a VideoFrame instance
 *
 * This function first confirms whether the VideoFrame type is available in the current environment,
 * then verifies if the passed object is an instance of VideoFrame
 *
 * @param frame The object to check
 * @returns Returns true if the object is a VideoFrame instance, otherwise returns false
 */
export function isVideoFrame(frame: unknown): boolean {
  return typeof VideoFrame !== "undefined" && frame instanceof VideoFrame;
}

export { H264, H265, VP9, AV1 };
