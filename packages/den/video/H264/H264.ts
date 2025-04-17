// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { BitstreamWriter } from "./BitstreamWriter";
import { SPS } from "./SPS";

export enum H264NaluType {
  NDR = 1,
  IDR = 5,
  SEI = 6,
  SPS = 7,
  PPS = 8,
  AUD = 9,
}

type FrameInfo = {
  isKeyFrame: boolean;
  mayNeedRewrite: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class H264 {
  public static IsAnnexB(data: Uint8Array): boolean {
    return H264.AnnexBBoxSize(data) != undefined;
  }

  public static AnnexBBoxSize(data: Uint8Array): number | undefined {
    // Annex B is a byte stream format where each NALU is prefixed with a start code, typically
    // 0x000001 or 0x00000001. The type of the NALU is determined by the 5 least significant bits of
    // the byte that follows the start code.
    //
    // AVCC is a length-prefixed format, where each NALU is prefixed by its length (typically 4
    // bytes). The type of the NALU is determined by the 5 least significant bits of the first byte
    // of the NALU itself.

    if (data.length < 4) {
      return undefined;
    }

    if (data[0] === 0 && data[1] === 0) {
      if (data[2] === 1) {
        return 3;
      } else if (data[2] === 0 && data[3] === 1) {
        return 4;
      }
    }

    return undefined;
  }

  public static GetFrameInfo(data: Uint8Array): FrameInfo {
    // Determine what type of encoding is used
    const boxSize = H264.AnnexBBoxSize(data);
    if (boxSize == undefined) {
      return {
        isKeyFrame: false,
        mayNeedRewrite: false,
      };
    }
    let isKeyFrame = false;
    let mayNeedRewrite = false;
    // Iterate over the NAL units in the H264 Annex B frame, looking for NaluTypes.IDR
    let i = boxSize;
    while (i < data.length) {
      // Annex B NALU type is the 5 least significant bits of the first byte following the start
      // code
      const naluType = data[i]! & 0x1f;
      if (naluType === H264NaluType.IDR) {
        isKeyFrame = true;
        mayNeedRewrite = true;
        break;
      } else if (naluType === H264NaluType.IDR) {
        mayNeedRewrite = true;
      }

      // Scan for another start code, signifying the beginning of the next NAL unit
      i = H264.FindNextStartCodeEnd(data, i + 1);
    }

    return {
      isKeyFrame,
      mayNeedRewrite,
    };
  }

  public static GetFirstNALUOfType(
    data: Uint8Array,
    naluType: H264NaluType,
  ): Uint8Array | undefined {
    // Determine what type of encoding is used
    const boxSize = H264.AnnexBBoxSize(data);
    if (boxSize == undefined) {
      return undefined;
    }

    // Iterate over the NAL units in the H264 Annex B frame, looking for the requested naluType
    let i = boxSize;
    while (i < data.length) {
      // Annex B NALU type is the 5 least significant bits of the first byte following the start
      // code
      const curNaluType = data[i]! & 0x1f;
      if (curNaluType === naluType) {
        // Find the end of this NALU
        const end = H264.FindNextStartCode(data, i + 1);

        // Return the NALU
        return data.subarray(i, end);
      }

      // Scan for another start code, signifying the beginning of the next NAL unit
      i = H264.FindNextStartCodeEnd(data, i + 1);
    }

    return undefined;
  }

  public static ParseSps(data: Uint8Array): SPS | undefined {
    const firstNALU = H264.GetFirstNALUOfType(data, H264NaluType.SPS);
    if (firstNALU == null) return;
    const sps = new SPS(firstNALU);
    if (sps.nal_unit_type === H264NaluType.SPS) return sps;
    return undefined;
  }

  public static ParseDecoderConfig(sps: SPS): VideoDecoderConfig | undefined {
    // Find the first SPS NALU and extrat MIME, picHeight, and picWidth fields
    const config: VideoDecoderConfig = {
      codec: sps.MIME(),
      codedWidth: sps.picWidth,
      codedHeight: sps.picHeight,
    };
    const sarWidth = sps.sar_width ?? 0;
    const sarHeight = sps.sar_height ?? 0;

    // The Sample Aspect Ratio (SAR) is the ratio of the width to the height of an individual
    // pixel. Display Aspect Ratio (DAR) is the ratio of the width to the height of the video as
    // it should be displayed
    if (sarWidth > 1 || sarHeight > 1) {
      config.displayAspectWidth = Math.round(sps.picWidth * (sarWidth / sarHeight));
      config.displayAspectHeight = sps.picHeight;
    }
    return config;
  }

  /**
   * Find the index of the next start code (0x000001 or 0x00000001) in the
   * given buffer, starting at the given offset.
   */
  public static FindNextStartCode(data: Uint8Array, start: number): number {
    let i = start;
    while (i < data.length - 3) {
      const isStartCode3Bytes = data[i + 0] === 0 && data[i + 1] === 0 && data[i + 2] === 1;
      if (isStartCode3Bytes) {
        return i;
      }
      const isStartCode4Bytes =
        i + 3 < data.length &&
        data[i + 0] === 0 &&
        data[i + 1] === 0 &&
        data[i + 2] === 0 &&
        data[i + 3] === 1;
      if (isStartCode4Bytes) {
        return i;
      }
      i++;
    }
    return data.length;
  }

  /**
   * Find the index of the end of the next start code (0x000001 or 0x00000001) in the
   * given buffer, starting at the given offset.
   */
  public static FindNextStartCodeEnd(data: Uint8Array, start: number): number {
    let i = start;
    while (i < data.length - 3) {
      const isStartCode3Bytes = data[i + 0] === 0 && data[i + 1] === 0 && data[i + 2] === 1;
      if (isStartCode3Bytes) {
        return i + 3;
      }
      const isStartCode4Bytes =
        i + 3 < data.length &&
        data[i + 0] === 0 &&
        data[i + 1] === 0 &&
        data[i + 2] === 0 &&
        data[i + 3] === 1;
      if (isStartCode4Bytes) {
        return i + 4;
      }
      i++;
    }
    return data.length;
  }

  /**
   * Rewrite H.264 video data to optimize low-latency decoding
   * Reduce decoding delay by modifying buffer management parameters in SPS
   *
   * @param videoData Original H.264 video data
   * @returns Optimized H.264 video data, or undefined if optimization is not needed
   */
  static RewriteForLowLatencyDecoding(videoData: Uint8Array): Uint8Array | undefined {
    // Find the first SPS NAL unit
    const spsNalu = H264.GetFirstNALUOfType(videoData, H264NaluType.SPS);
    if (!spsNalu) return undefined;

    // Parse SPS
    const sps = new SPS(spsNalu);

    // Check if already configured for low-latency mode
    if (
      sps.vui_parameters_present_flag === 1 &&
      sps.bitstream_restriction_flag === 1 &&
      sps.max_num_reorder_frames === 0 &&
      sps.max_dec_frame_buffering === sps.max_num_ref_frames
    ) {
      return undefined; // Already in low-latency mode, no modification needed
    }

    // Set low-latency related parameters
    sps.vui_parameters_present_flag = 1;
    sps.bitstream_restriction_flag = 1;
    sps.max_num_reorder_frames = 0;
    sps.max_dec_frame_buffering = sps.max_num_ref_frames;

    // Set default values for other VUI parameters (if not defined)
    sps.aspect_ratio_info_present_flag ??= 0;
    sps.overscan_info_present_flag ??= 0;
    sps.video_signal_type_present_flag ??= 0;
    sps.chroma_loc_info_present_flag ??= 0;
    sps.timing_info_present_flag ??= 0;
    sps.nal_hrd_parameters_present_flag ??= 0;
    sps.vcl_hrd_parameters_present_flag ??= 0;
    sps.pic_struct_present_flag ??= 0;

    // Create a new output buffer (original size plus extra space for rewritten SPS)
    const outputBuffer = new Uint8Array(videoData.byteLength + 64);
    let outputOffset = 0;

    const startCodeSize = H264.AnnexBBoxSize(videoData);
    if (startCodeSize != null) {
      try {
        let spsRewritten = false;
        let inputOffset = 0;

        // Process all NAL units
        while (inputOffset + startCodeSize < videoData.length) {
          // Get the type of the current NAL unit
          const naluType = videoData[inputOffset + startCodeSize]! & 31;
          const nextStartCodePosition = H264.FindNextStartCode(
            videoData,
            inputOffset + startCodeSize + 1,
          );

          // If not SPS or SPS already rewritten, copy directly
          if (naluType !== H264NaluType.SPS) {
            outputBuffer.set(videoData.subarray(inputOffset, nextStartCodePosition), outputOffset);
            outputOffset += nextStartCodePosition - inputOffset;
            inputOffset = nextStartCodePosition;
            continue;
          }

          // Skip redundant SPS
          if (spsRewritten) {
            inputOffset = nextStartCodePosition;
            continue;
          }

          // Copy start code
          outputBuffer.set(
            videoData.subarray(inputOffset, inputOffset + startCodeSize),
            outputOffset,
          );
          outputOffset += startCodeSize;

          // Write modified SPS to output buffer
          const bitstreamWriter = new BitstreamWriter(outputBuffer.subarray(outputOffset));
          sps.writeToBitstream(bitstreamWriter);
          bitstreamWriter.finish();

          // Update state and offset
          spsRewritten = true;
          outputOffset += bitstreamWriter.bytesWritten();
          inputOffset = nextStartCodePosition;
        }
      } catch (error) {
        console.error("Error rewriting H.264 stream:", error);
        return undefined;
      }

      // Return the final generated data (trimmed to actual size)
      return outputBuffer.subarray(0, outputOffset);
    }

    return undefined;
  }
}
