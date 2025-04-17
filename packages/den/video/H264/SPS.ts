// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Bitstream } from "./Bitstream";

/**
 * H.264 HRD (Hypothetical Reference Decoder) Parameters Interface
 */
interface HrdParameters {
  cpb_cnt_minus1: number;
  bit_rate_scale: number;
  cpb_size_scale: number;
  bit_rate_value_minus1: number[];
  cpb_size_value_minus1: number[];
  cbr_flag: number[];
  initial_cpb_removal_delay_length_minus1: number;
  cpb_removal_delay_length_minus1: number;
  dpb_output_delay_length_minus1: number;
  time_offset_length: number;
}

const H264_PROFILE_NAMES = new Map<number, string>([
  [66, "BASELINE"],
  [77, "MAIN"],
  [88, "EXTENDED"],
  [100, "FREXT_HP"],
  [110, "FREXT_Hi10P"],
  [122, "FREXT_Hi422"],
  [244, "FREXT_Hi444"],
  [44, "FREXT_CAVLC444"],
]);

/**
 * Parse H.264 HRD (Hypothetical Reference Decoder) Parameters
 * Used for decoder rate control and buffer management
 *
 * @param bitstream Input bitstream
 * @returns Parsed HRD parameter object
 */
function parseHrdParameters(bitstream: Bitstream): HrdParameters {
  // Parse CPB count minus 1
  const cpbCountMinus1 = bitstream.ue_v();

  // Parse bit rate and CPB size scaling factors
  const bitRateScale = bitstream.u(4);
  const cpbSizeScale = bitstream.u(4);

  // Initialize parameter arrays
  const bitRateValueMinus1 = new Array(cpbCountMinus1 + 1);
  const cpbSizeValueMinus1 = new Array(cpbCountMinus1 + 1);
  const cbrFlag = new Array(cpbCountMinus1 + 1);

  // Parse related parameters for each CPB
  for (let i = 0; i <= cpbCountMinus1; i++) {
    bitRateValueMinus1[i] = bitstream.ue_v();
    cpbSizeValueMinus1[i] = bitstream.ue_v();
    cbrFlag[i] = bitstream.u(1);
  }

  // Parse delay related parameters
  const initialCpbRemovalDelayLengthMinus1 = bitstream.u(5);
  const cpbRemovalDelayLengthMinus1 = bitstream.u(5);
  const dpbOutputDelayLengthMinus1 = bitstream.u(5);
  const timeOffsetLength = bitstream.u(5);

  // Return complete HRD parameter object
  return {
    cpb_cnt_minus1: cpbCountMinus1,
    bit_rate_scale: bitRateScale,
    cpb_size_scale: cpbSizeScale,
    bit_rate_value_minus1: bitRateValueMinus1,
    cpb_size_value_minus1: cpbSizeValueMinus1,
    cbr_flag: cbrFlag,
    initial_cpb_removal_delay_length_minus1: initialCpbRemovalDelayLengthMinus1,
    cpb_removal_delay_length_minus1: cpbRemovalDelayLengthMinus1,
    dpb_output_delay_length_minus1: dpbOutputDelayLengthMinus1,
    time_offset_length: timeOffsetLength,
  };
}

/**
 * Write HRD parameters to bitstream
 *
 * @param bitstream Target bitstream
 * @param hrdParams HRD parameter object
 */
function writeHrdParameters(bitstream: Bitstream, hrdParams: HrdParameters): void {
  // Write CPB count minus 1
  bitstream.ue_v();

  // Write bit rate and CPB size scaling factors
  bitstream.u(4);
  bitstream.u(4);

  // Write related parameters for each CPB
  for (let i = 0; i <= hrdParams.cpb_cnt_minus1; i++) {
    bitstream.ue_v();
    bitstream.ue_v();
    bitstream.u_1();
  }

  // Write delay related parameters
  bitstream.u(5);
  bitstream.u(5);
  bitstream.u(5);
  bitstream.u(5);
}

const ASPECT_RATIO_IDC_VALUES: [number, number][] = [
  [0, 0],
  [1, 1],
  [12, 11],
  [10, 11],
  [16, 11],
  [40, 33],
  [24, 11],
  [20, 11],
  [32, 11],
  [80, 33],
  [18, 11],
  [15, 11],
  [64, 33],
  [160, 99],
  [4, 3],
  [3, 2],
  [2, 1],
];

export class SPS {
  public nal_ref_id: number;
  public nal_unit_type: number | undefined;
  public profile_idc: number;
  public profileName: string;
  public constraint_set0_flag: number;
  public constraint_set1_flag: number;
  public constraint_set2_flag: number;
  public constraint_set3_flag: number;
  public constraint_set4_flag: number;
  public constraint_set5_flag: number;
  public level_idc: number;
  public seq_parameter_set_id: number;
  public has_no_chroma_format_idc: boolean;
  public chroma_format_idc: number | undefined;
  public bit_depth_luma_minus8: number | undefined;
  public separate_colour_plane_flag: number | undefined;
  public chromaArrayType: number | undefined;
  public bitDepthLuma: number | undefined;
  public bit_depth_chroma_minus8: number | undefined;
  public lossless_qpprime_flag: number | undefined;
  public bitDepthChroma: number | undefined;
  public seq_scaling_matrix_present_flag: number | undefined;
  public seq_scaling_list_present_flag: Array<number> | undefined;
  public seq_scaling_list: Array<number[]> | undefined;
  public log2_max_frame_num_minus4: number | undefined;
  public maxFrameNum: number;
  public pic_order_cnt_type: number;
  public log2_max_pic_order_cnt_lsb_minus4: number | undefined;
  public maxPicOrderCntLsb: number | undefined;
  public delta_pic_order_always_zero_flag: number | undefined;
  public offset_for_non_ref_pic: number | undefined;
  public offset_for_top_to_bottom_field: number | undefined;
  public num_ref_frames_in_pic_order_cnt_cycle: number | undefined;
  public offset_for_ref_frame: Array<number> | undefined;
  public max_num_ref_frames: number;
  public gaps_in_frame_num_value_allowed_flag: number;
  public pic_width_in_mbs_minus_1: number;
  public picWidth: number;
  public pic_height_in_map_units_minus_1: number;
  public frame_mbs_only_flag: number;
  public interlaced: boolean;
  public mb_adaptive_frame_field_flag: number | undefined;
  public picHeight: number;
  public direct_8x8_inference_flag: number;
  public frame_cropping_flag: number;
  public frame_cropping_rect_left_offset: number | undefined;
  public frame_cropping_rect_right_offset: number | undefined;
  public frame_cropping_rect_top_offset: number | undefined;
  public frame_cropping_rect_bottom_offset: number | undefined;
  public cropRect: { x: number; y: number; width: number; height: number };
  public vui_parameters_present_flag: number;
  public aspect_ratio_info_present_flag: number | undefined;
  public aspect_ratio_idc: number | undefined;
  public sar_width: number | undefined;
  public sar_height: number | undefined;
  public overscan_info_present_flag: number | undefined;
  public overscan_appropriate_flag: number | undefined;
  public video_signal_type_present_flag: number | undefined;
  public video_format: number | undefined;
  public video_full_range_flag: number | undefined;
  public color_description_present_flag: number | undefined;
  public color_primaries: number | undefined;
  public transfer_characteristics: number | undefined;
  public matrix_coefficients: number | undefined;
  public chroma_loc_info_present_flag: number | undefined;
  public chroma_sample_loc_type_top_field: number | undefined;
  public chroma_sample_loc_type_bottom_field: number | undefined;
  public timing_info_present_flag: number | undefined;
  public num_units_in_tick: number | undefined;
  public time_scale: number | undefined;
  public fixed_frame_rate_flag: number | undefined;
  public framesPerSecond: number | undefined;

  public nal_hrd_parameters_present_flag: number | undefined;
  public nal_hrd_parameters: HrdParameters | undefined;
  public vcl_hrd_parameters_present_flag: number | undefined;
  public vcl_hrd_parameters: HrdParameters | undefined;
  public low_delay_hrd_flag: number | undefined;
  public pic_struct_present_flag: number | undefined;
  public bitstream_restriction_flag: number | undefined;
  public motion_vectors_over_pic_boundaries_flag: number | undefined;
  public max_bytes_per_pic_denom: number | undefined;
  public max_bits_per_mb_denom: number | undefined;
  public log2_max_mv_length_horizontal: number | undefined;
  public log2_max_mv_length_vertical: number | undefined;
  public max_num_reorder_frames: number | undefined;
  public max_dec_frame_buffering: number | undefined;

  public constructor(data: Uint8Array) {
    const bitstream = new Bitstream(data);

    const forbidden_zero_bit = bitstream.u_1();
    if (forbidden_zero_bit !== 0) {
      throw new Error("NALU error: invalid NALU header");
    }
    this.nal_ref_id = bitstream.u_2();
    this.nal_unit_type = bitstream.u(5);
    if (this.nal_unit_type !== 7) {
      throw new Error("SPS error: not SPS");
    }

    this.profile_idc = bitstream.u_8()!;
    if (H264_PROFILE_NAMES.has(this.profile_idc)) {
      this.profileName = H264_PROFILE_NAMES.get(this.profile_idc)!;
    } else {
      throw new Error("SPS error: invalid profile_idc");
    }

    this.constraint_set0_flag = bitstream.u_1();
    this.constraint_set1_flag = bitstream.u_1();
    this.constraint_set2_flag = bitstream.u_1();
    this.constraint_set3_flag = bitstream.u_1();
    this.constraint_set4_flag = bitstream.u_1();
    this.constraint_set5_flag = bitstream.u_1();
    const reserved_zero_2bits = bitstream.u_2();
    if (reserved_zero_2bits !== 0) {
      throw new Error("SPS error: reserved_zero_2bits must be zero");
    }

    this.level_idc = bitstream.u_8()!;

    this.seq_parameter_set_id = bitstream.ue_v();
    if (this.seq_parameter_set_id > 31) {
      throw new Error("SPS error: seq_parameter_set_id must be 31 or less");
    }

    this.has_no_chroma_format_idc =
      this.profile_idc === 66 || this.profile_idc === 77 || this.profile_idc === 88;

    if (!this.has_no_chroma_format_idc) {
      this.chroma_format_idc = bitstream.ue_v();
      if (this.chroma_format_idc > 3) {
        throw new Error("SPS error: chroma_format_idc must be 3 or less");
      }
      if (this.chroma_format_idc === 3) {
        /* 3 = YUV444 */
        this.separate_colour_plane_flag = bitstream.u_1();
        this.chromaArrayType = this.separate_colour_plane_flag !== 0 ? 0 : this.chroma_format_idc;
      }
      this.bit_depth_luma_minus8 = bitstream.ue_v();
      if (this.bit_depth_luma_minus8 > 6) {
        throw new Error("SPS error: bit_depth_luma_minus8 must be 6 or less");
      }
      this.bitDepthLuma = this.bit_depth_luma_minus8 + 8;
      this.bit_depth_chroma_minus8 = bitstream.ue_v();
      if (this.bit_depth_chroma_minus8 > 6) {
        throw new Error("SPS error: bit_depth_chroma_minus8 must be 6 or less");
      }
      this.lossless_qpprime_flag = bitstream.u_1();
      this.bitDepthChroma = this.bit_depth_chroma_minus8 + 8;
      this.seq_scaling_matrix_present_flag = bitstream.u_1();
      if (this.seq_scaling_matrix_present_flag !== 0) {
        const n_ScalingList = this.chroma_format_idc !== 3 ? 8 : 12;
        this.seq_scaling_list_present_flag = [];
        this.seq_scaling_list = [];
        for (let i = 0; i < n_ScalingList; i++) {
          const seqScalingListPresentFlag = bitstream.u_1();
          this.seq_scaling_list_present_flag.push(seqScalingListPresentFlag);
          if (seqScalingListPresentFlag !== 0) {
            const sizeOfScalingList = i < 6 ? 16 : 64;
            let nextScale = 8;
            let lastScale = 8;
            const delta_scale = [];
            for (let j = 0; j < sizeOfScalingList; j++) {
              if (nextScale !== 0) {
                const deltaScale = bitstream.se_v();
                delta_scale.push(deltaScale);
                nextScale = (lastScale + deltaScale + 256) % 256;
              }
              lastScale = nextScale === 0 ? lastScale : nextScale;
              this.seq_scaling_list.push(delta_scale);
            }
          }
        }
      }
    }

    this.log2_max_frame_num_minus4 = bitstream.ue_v();
    if (this.log2_max_frame_num_minus4 > 12) {
      throw new Error("SPS error: log2_max_frame_num_minus4 must be 12 or less");
    }
    this.maxFrameNum = 1 << (this.log2_max_frame_num_minus4 + 4);

    this.pic_order_cnt_type = bitstream.ue_v();
    if (this.pic_order_cnt_type > 2) {
      throw new Error("SPS error: pic_order_cnt_type must be 2 or less");
    }

    switch (this.pic_order_cnt_type) {
      case 0:
        this.log2_max_pic_order_cnt_lsb_minus4 = bitstream.ue_v();
        if (this.log2_max_pic_order_cnt_lsb_minus4 > 12) {
          throw new Error("SPS error: log2_max_pic_order_cnt_lsb_minus4 must be 12 or less");
        }
        this.maxPicOrderCntLsb = 1 << (this.log2_max_pic_order_cnt_lsb_minus4 + 4);
        break;
      case 1:
        this.delta_pic_order_always_zero_flag = bitstream.u_1();
        this.offset_for_non_ref_pic = bitstream.se_v();
        this.offset_for_top_to_bottom_field = bitstream.se_v();
        this.num_ref_frames_in_pic_order_cnt_cycle = bitstream.ue_v();
        this.offset_for_ref_frame = [];
        for (let i = 0; i < this.num_ref_frames_in_pic_order_cnt_cycle; i++) {
          const offsetForRefFrame = bitstream.se_v();
          this.offset_for_ref_frame.push(offsetForRefFrame);
        }
        break;
      case 2:
        /* there is nothing for case 2 */
        break;
    }

    this.max_num_ref_frames = bitstream.ue_v();
    this.gaps_in_frame_num_value_allowed_flag = bitstream.u_1();
    this.pic_width_in_mbs_minus_1 = bitstream.ue_v();
    this.picWidth = (this.pic_width_in_mbs_minus_1 + 1) << 4;
    this.pic_height_in_map_units_minus_1 = bitstream.ue_v();
    this.frame_mbs_only_flag = bitstream.u_1();
    this.interlaced = this.frame_mbs_only_flag === 0;
    if (this.frame_mbs_only_flag === 0) {
      /* 1 if frames rather than fields (no interlacing) */
      this.mb_adaptive_frame_field_flag = bitstream.u_1();
    }
    this.picHeight =
      ((2 - this.frame_mbs_only_flag) * (this.pic_height_in_map_units_minus_1 + 1)) << 4;

    this.direct_8x8_inference_flag = bitstream.u_1();
    this.frame_cropping_flag = bitstream.u_1();
    if (this.frame_cropping_flag !== 0) {
      // Determine the chroma sample to luma sample ratio in each dimension
      const chromaFormatIdc = this.chroma_format_idc ?? 1;
      let subWidthC = 1;
      let subHeightC = 1;
      if (chromaFormatIdc === 0) {
        // Monochrome
      } else if (chromaFormatIdc === 1) {
        // 4:2:0
        subWidthC = 2;
        subHeightC = 2;
      } else if (chromaFormatIdc === 2) {
        // 4:2:2
        subWidthC = 2;
        subHeightC = 1;
      } else if (chromaFormatIdc === 3) {
        // 4:4:4
        subWidthC = 1;
        subHeightC = 1;
      }

      this.frame_cropping_rect_left_offset = bitstream.ue_v();
      this.frame_cropping_rect_right_offset = bitstream.ue_v();
      this.frame_cropping_rect_top_offset = bitstream.ue_v();
      this.frame_cropping_rect_bottom_offset = bitstream.ue_v();
      const leftPixelCrop = this.frame_cropping_rect_left_offset * subWidthC;
      const rightPixelCrop = this.frame_cropping_rect_right_offset * subWidthC;
      const topPixelCrop = this.frame_cropping_rect_top_offset * subHeightC;
      const bottomPixelCrop = this.frame_cropping_rect_bottom_offset * subHeightC;
      this.cropRect = {
        x: leftPixelCrop,
        y: topPixelCrop,
        width: this.picWidth - (leftPixelCrop + rightPixelCrop),
        height: this.picHeight - (topPixelCrop + bottomPixelCrop),
      };
    } else {
      this.cropRect = {
        x: 0,
        y: 0,
        width: this.picWidth,
        height: this.picHeight,
      };
    }
    this.vui_parameters_present_flag = bitstream.u_1();
    if (this.vui_parameters_present_flag !== 0) {
      this.aspect_ratio_info_present_flag = bitstream.u_1();
      if (this.aspect_ratio_info_present_flag !== 0) {
        this.aspect_ratio_idc = bitstream.u_8();
        if (this.aspect_ratio_idc === 255) {
          this.sar_width = bitstream.u(16);
          this.sar_height = bitstream.u(16);
        } else if (this.aspect_ratio_idc > 0 && this.aspect_ratio_idc <= 16) {
          const sar = ASPECT_RATIO_IDC_VALUES[this.aspect_ratio_idc]!;
          this.sar_width = sar[0];
          this.sar_height = sar[1];
        }
      }

      this.overscan_info_present_flag = bitstream.u_1();
      if (this.overscan_info_present_flag !== 0) {
        this.overscan_appropriate_flag = bitstream.u_1();
      }
      this.video_signal_type_present_flag = bitstream.u_1();
      if (this.video_signal_type_present_flag !== 0) {
        this.video_format = bitstream.u(3);
        this.video_full_range_flag = bitstream.u_1();
        this.color_description_present_flag = bitstream.u_1();
        if (this.color_description_present_flag !== 0) {
          this.color_primaries = bitstream.u_8();
          this.transfer_characteristics = bitstream.u_8();
          this.matrix_coefficients = bitstream.u_8();
        }
      }
      this.chroma_loc_info_present_flag = bitstream.u_1();
      if (this.chroma_loc_info_present_flag !== 0) {
        this.chroma_sample_loc_type_top_field = bitstream.ue_v();
        this.chroma_sample_loc_type_bottom_field = bitstream.ue_v();
      }
      this.timing_info_present_flag = bitstream.u_1();
      if (this.timing_info_present_flag !== 0) {
        this.num_units_in_tick = bitstream.u(32);
        this.time_scale = bitstream.u(32);
        this.fixed_frame_rate_flag = bitstream.u_1();
        if (this.num_units_in_tick !== 0 && this.time_scale !== 0 && this.num_units_in_tick !== 0) {
          this.framesPerSecond = this.time_scale / (2 * this.num_units_in_tick);
        }
      }
      this.nal_hrd_parameters_present_flag = bitstream.u_1();

      // Parse NAL HRD parameters
      if (this.nal_hrd_parameters_present_flag !== 0) {
        this.nal_hrd_parameters = parseHrdParameters(bitstream);
      }

      // Parse VCL HRD parameters present flag
      this.vcl_hrd_parameters_present_flag = bitstream.u_1();

      // If VCL HRD parameters exist, parse them
      if (this.vcl_hrd_parameters_present_flag !== 0) {
        this.vcl_hrd_parameters = parseHrdParameters(bitstream);
      }

      // If NAL or VCL HRD parameters exist, parse low_delay_hrd_flag
      if (
        this.nal_hrd_parameters_present_flag !== 0 ||
        this.vcl_hrd_parameters_present_flag !== 0
      ) {
        this.low_delay_hrd_flag = bitstream.u_1();
      }

      // Parse pic_struct_present_flag
      this.pic_struct_present_flag = bitstream.u_1();

      // Parse bitstream_restriction_flag
      this.bitstream_restriction_flag = bitstream.u_1();

      // If bitstream restrictions exist, parse related parameters
      if (this.bitstream_restriction_flag !== 0) {
        this.motion_vectors_over_pic_boundaries_flag = bitstream.u_1();
        this.max_bytes_per_pic_denom = bitstream.ue_v();
        this.max_bits_per_mb_denom = bitstream.ue_v();
        this.log2_max_mv_length_horizontal = bitstream.ue_v();
        this.log2_max_mv_length_vertical = bitstream.ue_v();
        this.max_num_reorder_frames = bitstream.ue_v();
        this.max_dec_frame_buffering = bitstream.ue_v();
      }
    }
  }

  public profileCompatibility(): number {
    let v = this.constraint_set0_flag << 7;
    v |= this.constraint_set1_flag << 6;
    v |= this.constraint_set2_flag << 5;
    v |= this.constraint_set3_flag << 4;
    v |= this.constraint_set4_flag << 3;
    v |= this.constraint_set5_flag << 1;
    return v;
  }

  public MIME(): string {
    const f = [];
    f.push("avc1.");
    f.push(byteToHex(this.profile_idc).toUpperCase());
    f.push(byteToHex(this.profileCompatibility()).toUpperCase());
    f.push(byteToHex(this.level_idc).toUpperCase());
    return f.join("");
  }
  /**
   * Write SPS parameters to H.264 bitstream
   * Write SPS NAL unit in H.264 standard order
   *
   * @param bitstream Target bitstream
   */
  public writeToBitstream(bitstream: any): void {
    // Write NAL unit header
    bitstream.u_1(0); // forbidden_zero_bit
    bitstream.u_2(this.nal_ref_id); // nal_ref_idc
    bitstream.u(5, this.nal_unit_type); // nal_unit_type

    // Validate NAL unit type
    if (this.nal_unit_type !== 7) {
      throw new Error(`Expected SPS NALU, got ${this.nal_unit_type}`);
    }

    // Write basic encoding parameters
    bitstream.u_8(this.profile_idc);
    bitstream.u_1(this.constraint_set0_flag);
    bitstream.u_1(this.constraint_set1_flag);
    bitstream.u_1(this.constraint_set2_flag);
    bitstream.u_1(this.constraint_set3_flag);
    bitstream.u_1(this.constraint_set4_flag);
    bitstream.u_1(this.constraint_set5_flag);
    bitstream.u_2(0); // reserved_zero_2bits
    bitstream.u_8(this.level_idc);

    // Write sequence parameter set ID
    bitstream.ue_v(this.seq_parameter_set_id);

    // Write chroma format related parameters
    if (!this.has_no_chroma_format_idc) {
      bitstream.ue_v(this.chroma_format_idc);

      if (this.chroma_format_idc === 3) {
        bitstream.u_1(this.separate_colour_plane_flag);
      }

      bitstream.ue_v(this.bit_depth_luma_minus8);
      bitstream.ue_v(this.bit_depth_chroma_minus8);
      bitstream.u_1(this.lossless_qpprime_flag);
      bitstream.u_1(this.seq_scaling_matrix_present_flag);

      // Write scaling matrix
      if (this.seq_scaling_matrix_present_flag !== 0) {
        for (let i = 0; i < this.seq_scaling_list_present_flag!.length; i++) {
          const isPresent = this.seq_scaling_list_present_flag![i];
          bitstream.u_1(isPresent);

          if (isPresent !== 0) {
            for (const scalingValue of this.seq_scaling_list![i]!) {
              bitstream.se_v(scalingValue);
            }
          }
        }
      }
    }

    // Write frame number and POC related parameters
    bitstream.ue_v(this.log2_max_frame_num_minus4);
    bitstream.ue_v(this.pic_order_cnt_type);

    if (this.pic_order_cnt_type === 0) {
      bitstream.ue_v(this.log2_max_pic_order_cnt_lsb_minus4);
    } else if (this.pic_order_cnt_type === 1) {
      bitstream.u_1(this.delta_pic_order_always_zero_flag);
      bitstream.se_v(this.offset_for_non_ref_pic);
      bitstream.se_v(this.offset_for_top_to_bottom_field);
      bitstream.ue_v(this.num_ref_frames_in_pic_order_cnt_cycle);

      for (let i = 0; i < this.num_ref_frames_in_pic_order_cnt_cycle!; i++) {
        bitstream.se_v(this.offset_for_ref_frame![i]);
      }
    }

    // Write reference frame and image size parameters
    bitstream.ue_v(this.max_num_ref_frames);
    bitstream.u_1(this.gaps_in_frame_num_value_allowed_flag);
    bitstream.ue_v(this.pic_width_in_mbs_minus_1);
    bitstream.ue_v(this.pic_height_in_map_units_minus_1);
    bitstream.u_1(this.frame_mbs_only_flag);

    if (this.frame_mbs_only_flag === 0) {
      bitstream.u_1(this.mb_adaptive_frame_field_flag);
    }

    // Write inference and cropping parameters
    bitstream.u_1(this.direct_8x8_inference_flag);
    bitstream.u_1(this.frame_cropping_flag);

    if (this.frame_cropping_flag !== 0) {
      bitstream.ue_v(this.frame_cropping_rect_left_offset);
      bitstream.ue_v(this.frame_cropping_rect_right_offset);
      bitstream.ue_v(this.frame_cropping_rect_top_offset);
      bitstream.ue_v(this.frame_cropping_rect_bottom_offset);
    }

    // Write VUI parameters
    bitstream.u_1(this.vui_parameters_present_flag);

    if (this.vui_parameters_present_flag !== 0) {
      // Write aspect ratio parameters
      bitstream.u_1(this.aspect_ratio_info_present_flag);

      if (this.aspect_ratio_info_present_flag !== 0) {
        bitstream.u_8(this.aspect_ratio_idc);

        if (this.aspect_ratio_idc === 255) {
          // Extended_SAR
          bitstream.u(16, this.sar_width);
          bitstream.u(16, this.sar_height);
        }
      }

      // Write overscan information
      bitstream.u_1(this.overscan_info_present_flag);

      if (this.overscan_info_present_flag !== 0) {
        bitstream.u_1(this.overscan_appropriate_flag);
      }

      // Write video signal type
      bitstream.u_1(this.video_signal_type_present_flag);

      if (this.video_signal_type_present_flag !== 0) {
        bitstream.u_3(this.video_format);
        bitstream.u_1(this.video_full_range_flag);
        bitstream.u_1(this.color_description_present_flag);

        if (this.color_description_present_flag !== 0) {
          bitstream.u_8(this.color_primaries);
          bitstream.u_8(this.transfer_characteristics);
          bitstream.u_8(this.matrix_coefficients);
        }
      }

      // Write chroma location information
      bitstream.u_1(this.chroma_loc_info_present_flag);

      if (this.chroma_loc_info_present_flag !== 0) {
        bitstream.ue_v(this.chroma_sample_loc_type_top_field);
        bitstream.ue_v(this.chroma_sample_loc_type_bottom_field);
      }

      // Write timing information
      bitstream.u_1(this.timing_info_present_flag);

      if (this.timing_info_present_flag !== 0) {
        bitstream.u(32, this.num_units_in_tick);
        bitstream.u(32, this.time_scale);
        bitstream.u_1(this.fixed_frame_rate_flag);
      }

      // Write HRD parameters
      bitstream.u_1(this.nal_hrd_parameters_present_flag);

      if (this.nal_hrd_parameters_present_flag !== 0) {
        writeHrdParameters(bitstream, this.nal_hrd_parameters!);
      }

      bitstream.u_1(this.vcl_hrd_parameters_present_flag);

      if (this.vcl_hrd_parameters_present_flag !== 0) {
        writeHrdParameters(bitstream, this.vcl_hrd_parameters!);
      }

      if (
        this.nal_hrd_parameters_present_flag !== 0 ||
        this.vcl_hrd_parameters_present_flag !== 0
      ) {
        bitstream.u_1(this.low_delay_hrd_flag);
      }

      // Write picture structure and bitstream restrictions
      bitstream.u_1(this.pic_struct_present_flag);
      bitstream.u_1(this.bitstream_restriction_flag);

      if (this.bitstream_restriction_flag !== 0) {
        bitstream.u_1(this.motion_vectors_over_pic_boundaries_flag ?? 1);
        bitstream.ue_v(this.max_bytes_per_pic_denom ?? 2);
        bitstream.ue_v(this.max_bits_per_mb_denom ?? 1);
        bitstream.ue_v(this.log2_max_mv_length_horizontal ?? 16);
        bitstream.ue_v(this.log2_max_mv_length_vertical ?? 16);
        bitstream.ue_v(this.max_num_reorder_frames ?? 0);
        bitstream.ue_v(this.max_dec_frame_buffering ?? this.max_num_ref_frames);
      }
    }

    // Write RBSP trailer flags
    bitstream.u_1(1);
  }
}

function byteToHex(val: number): string {
  return ("00" + val.toString(16)).slice(-2);
}
