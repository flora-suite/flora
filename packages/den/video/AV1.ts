// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

/**
 * AV1 Open Bitstream Unit (OBU) type enumeration
 */
enum ObuType {
  OBU_SEQUENCE_HEADER = 1,
  OBU_TEMPORAL_DELIMITER = 2,
  OBU_FRAME_HEADER = 3,
  OBU_TILE_GROUP = 4,
  OBU_METADATA = 5,
  OBU_FRAME = 6,
  OBU_REDUNDANT_FRAME_HEADER = 7,
  OBU_TILE_LIST = 8,
  OBU_PADDING = 15,
}

/**
 * AV1 frame type enumeration
 */
enum FrameType {
  KEY_FRAME = 0,
  INTER_FRAME = 1,
  INTRA_ONLY_FRAME = 2,
  SWITCH_FRAME = 3,
}

/**
 * LEB128 variable-length integer decoder
 * Used to parse variable-length integers in AV1 bitstream
 */
class Leb128Decoder {
  data: Uint8Array;
  offset = 0;

  constructor(data: Uint8Array) {
    this.data = data;
  }

  /**
   * Decode LEB128 variable-length integer
   * @returns Decoded unsigned integer
   */
  decode(): number {
    let value = 0;
    let shift = 0;
    let position = this.offset;
    const maxPosition = Math.min(position + 8, this.data.length);

    while (position < maxPosition) {
      const byte = this.data[position]!;
      value |= (byte & 0x7f) << shift;
      shift += 7;

      if ((byte & 0x80) === 0) {
        position++;
        break;
      }
      position++;
    }

    this.offset = position;
    return value >>> 0; // Ensure the result is an unsigned integer
  }
}

// Shared instance for reuse
const EMPTY_BUFFER = new Uint8Array();
const sharedDecoder = new Leb128Decoder(EMPTY_BUFFER);

/**
 * AV1 video parser
 */
export class AV1 {
  /**
   * Check if the given AV1 data is a keyframe
   * @param data AV1 encoded video data
   * @returns true if it's a keyframe, false otherwise
   */
  static IsKeyframe(data: Uint8Array): boolean {
    let offset = 0;
    sharedDecoder.data = data;

    try {
      while (offset < data.length) {
        const headerByte = data[offset]!;

        // Check forbidden bit (must be 0)
        if ((headerByte & 0x80) !== 0) {
          return false;
        }

        // Parse OBU header
        const obuType = (headerByte & 0x78) >>> 3; // Extract bits 3-6
        const hasSizeField = (headerByte & 0x04) !== 0; // Bit 2
        const hasExtension = (headerByte & 0x02) !== 0; // Bit 1

        // Skip extension header
        hasSizeField && ++offset;

        // Parse size field
        let obuSize;
        if (hasExtension) {
          sharedDecoder.offset = offset + 1;
          obuSize = sharedDecoder.decode();
          offset = sharedDecoder.offset;
        }

        const obuStartOffset = offset;

        // Process based on OBU type
        switch (obuType) {
          case ObuType.OBU_TEMPORAL_DELIMITER:
            continue;

          case ObuType.OBU_FRAME:
          case ObuType.OBU_FRAME_HEADER: {
            const frameHeaderByte = data[offset]!;

            // Check if it's a keyframe
            if (
              !((frameHeaderByte & 0x80) !== 0) &&
              (frameHeaderByte & 0x60) >>> 5 === FrameType.KEY_FRAME
            ) {
              return true;
            }
            break;
          }
        }

        // If size field exists, move to the next OBU
        if (obuSize != null) {
          offset = obuStartOffset + obuSize;
          continue;
        }

        throw new Error(`Unsupported OBU type ${obuType}`);
      }
    } finally {
      // Clean up the shared decoder
      sharedDecoder.data = EMPTY_BUFFER;
    }

    return false;
  }
}
