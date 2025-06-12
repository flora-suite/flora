// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

/**
 * VP9 frame type enumeration
 */
enum VP9FrameType {
  KEY_FRAME = 0,
  NON_KEY_FRAME = 1,
}

export class VP9 {
  /**
   * Check if the given VP9 data is a key frame
   * Parse frame header information according to VP9 bitstream specification
   */
  static IsKeyframe(data: Uint8Array): boolean {
    if (data.length === 0) {return false;}

    const firstByte = data[0]!;

    // Extract frame_marker (2 bits)
    const frameMarker = (firstByte & 0xc0) >>> 6; // 0xC0 = 11000000
    if (frameMarker !== 2) {
      throw new Error(`Invalid VP9 frame format: expected frame_marker 2, got ${frameMarker}`);
    }

    // Extract profile-related bits
    const profile = ((firstByte & 0x20) >>> 5) | ((firstByte & 0x10) >>> 3); // 0x20 = 00100000, 0x10 = 00010000

    // Check show_existing_frame flag
    const showExistingFrame =
      profile === 3
        ? (firstByte & 0x04) !== 0 // 0x04 = 00000100
        : (firstByte & 0x08) !== 0; // 0x08 = 00001000

    if (showExistingFrame) {return false;}

    // Extract frame_type
    const frameType =
      profile === 3
        ? (firstByte & 0x02) >>> 1 // 0x02 = 00000010
        : (firstByte & 0x04) >>> 2; // 0x04 = 00000100

    // Extract show_frame flag
    const showFrame =
      profile === 3
        ? (firstByte & 0x01) !== 0 // 0x01 = 00000001
        : (firstByte & 0x02) !== 0; // 0x02 = 00000010

    return frameType === VP9FrameType.KEY_FRAME && showFrame;
  }
}
