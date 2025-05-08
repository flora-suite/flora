// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { H264 } from "./H264";

// H.265 NAL Unit Types enum definition
enum H265NalUnitType {
  BLA_W_LP = 16, // Broken Link Access with Leading Pictures
  BLA_W_RADL = 17, // Broken Link Access with Random Access Decodable Leading Pictures
  BLA_N_LP = 18, // Broken Link Access without Leading Pictures
  IDR_W_RADL = 19, // Instantaneous Decoder Refresh with Random Access Decodable Leading Pictures
  IDR_N_LP = 20, // Instantaneous Decoder Refresh without Leading Pictures
  CRA_NUT = 21, // Clean Random Access
  RSV_IRAP_VCL22 = 22, // Reserved IRAP VCL NAL unit type 22
  RSV_IRAP_VCL23 = 23, // Reserved IRAP VCL NAL unit type 23
}

/**
 * Check if the given NAL unit type is an IRAP (Intra Random Access Point) frame
 * IRAP frames are independently decodable key frames
 */
function isIrapFrame(nalUnitType: number): boolean {
  return nalUnitType >= H265NalUnitType.BLA_W_LP && nalUnitType <= H265NalUnitType.RSV_IRAP_VCL23;
}

export class H265 {
  static IsAnnexB(data: Uint8Array): boolean {
    return H264.AnnexBBoxSize(data) != undefined;
  }

  static IsKeyframe(data: Uint8Array): boolean {
    const boxSize = H264.AnnexBBoxSize(data);
    if (boxSize == undefined) {
      return false;
    }
    let i = boxSize;
    while (i < data.length) {
      const naluType = (data[i]! & 0x7e) >>> 1;
      if (isIrapFrame(naluType)) {
        return true;
      }
      i = H264.FindNextStartCodeEnd(data, i + 1);
    }
    return false;
  }
}
