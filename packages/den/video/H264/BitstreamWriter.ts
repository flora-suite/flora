// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

/**
 * Bitstream Writer Class - For H.264/AVC video encoding bit-level operations
 * Supports various bit-level writing functions, as well as exponential Golomb coding needed for H.264 encoding
 */
export class BitstreamWriter {
  // Private fields
  #buffer: Uint8Array; // Underlying buffer
  #bytePos = 0; // Current byte position
  #currentByte = 0; // Current byte being constructed
  #bitPos = 0; // Current bit position (0-7)
  #window = 0; // Sliding window (16 bits) for detecting special sequences
  #finished = false; // Whether writing has been completed

  /**
   * Creates a bitstream writer
   * @param {Uint8Array} buffer - The buffer to write to
   */
  constructor(buffer: Uint8Array) {
    this.#buffer = buffer;
  }

  /**
   * Writes a single bit
   * @param {number} bit - The bit to write (0 or 1)
   */
  u_1(bit: number) {
    if (this.#finished) {throw new Error("Attempt to write to bitstream after finish()");}

    const bitPosition = this.#bitPos;
    if (bitPosition >= 8) {throw new Error("Invariant: full byte should have been written already");}

    // Set bit at appropriate position
    this.#currentByte |= bit << (7 - bitPosition);

    // If completed a byte, write it
    if (bitPosition === 7) {
      this.#writeByte();
    } else {
      this.#bitPos++;
    }
  }

  /**
   * Writes a 2-bit value
   * @param {number} value - The 2-bit value to write (0-3)
   */
  u_2(value: number) {
    if (this.#finished) {throw new Error("Attempt to write to bitstream after finish()");}
    this.u_1((value & 2) >>> 1); // Write the high bit
    this.u_1(value & 1); // Write the low bit
  }

  /**
   * Writes a 3-bit value
   * @param {number} value - The 3-bit value to write (0-7)
   */
  u_3(value: number) {
    if (this.#finished) {throw new Error("Attempt to write to bitstream after finish()");}
    this.u_1((value & 4) >>> 2); // Write the highest bit
    this.u_1((value & 2) >>> 1); // Write the middle bit
    this.u_1(value & 1); // Write the lowest bit
  }

  /**
   * Writes an 8-bit value (one byte)
   * @param {number} value - The byte to write (0-255)
   */
  u_8(value: number) {
    if (this.#finished) {throw new Error("Attempt to write to bitstream after finish()");}

    // Optimized path for byte-aligned writes
    if (this.#bitPos === 0) {
      if (this.#bytePos >= this.#buffer.length) {throw new Error("Write would exceed end of buffer");}

      // Write byte directly
      this.#buffer[this.#bytePos] = value;
      ++this.#bytePos;

      // Update window
      this.#window = ((this.#window << 8) | value) & 0xffff;
      return;
    }

    // Write bit by bit
    this.u_1((value & 0x80) >>> 7);
    this.u_1((value & 0x40) >>> 6);
    this.u_1((value & 0x20) >>> 5);
    this.u_1((value & 0x10) >>> 4);
    this.u_1((value & 0x08) >>> 3);
    this.u_1((value & 0x04) >>> 2);
    this.u_1((value & 0x02) >>> 1);
    this.u_1(value & 0x01);
  }

  /**
   * Writes a value with specified number of bits
   * @param {number} bitCount - Number of bits to write (1-32)
   * @param {number} value - The value to write
   */
  u(bitCount: number, value: number) {
    if (this.#finished) {throw new Error("Attempt to write to bitstream after finish()");}
    if (bitCount < 1 || bitCount > 32) {throw new Error(`u(${bitCount}) is not supported`);}

    // Write from highest bit to lowest bit
    for (let i = bitCount - 1; i >= 0; --i) {
      this.u_1((value >>> i) & 1);
    }
  }

  /**
   * Writes an unsigned exponential Golomb coded value (used in H.264)
   * @param {number} value - The non-negative integer to encode
   */
  ue_v(value: number) {
    if (this.#finished) {throw new Error("Attempt to write to bitstream after finish()");}
    if (value >= 0xffffffff)
      {throw new Error(
        `ue(v) does not support writing values higher than 2^32-1 (received ${value})`,
      );}

    const codeNum = value + 1;
    const numBits = 32 - Math.clz32(codeNum); // Calculate number of bits needed

    // Write leading zero bits
    for (let i = numBits - 1; i > 0; --i) {
      this.u_1(0);
    }

    // Write the encoded value
    for (let i = numBits - 1; i >= 0; --i) {
      this.u_1((codeNum >>> i) & 1);
    }
  }

  /**
   * Writes a signed exponential Golomb coded value (used in H.264)
   * @param {number} value - The integer to encode (can be positive or negative)
   */
  se_v(value: number) {
    if (this.#finished) {throw new Error("Attempt to write to bitstream after finish()");}

    if (value === 0) {
      this.ue_v(0);
    } else if (value > 0) {
      this.ue_v((value << 1) - 1); // Positive value: 2|v|-1
    } else {
      this.ue_v(-value << 1); // Negative value: 2|v|
    }
  }

  /**
   * Completes the bitstream writing, handling any incomplete bytes
   */
  finish() {
    if (this.#finished) {throw new Error("finish() was already called");}

    const bitPosition = this.#bitPos;
    if (bitPosition > 0) {
      if (bitPosition >= 8)
        {throw new Error("Invariant: full byte should have been written already");}
      this.#writeByte();
    }

    this.#finished = true;
  }

  /**
   * Gets the number of bytes written
   * @returns {number} Number of bytes written
   */
  bytesWritten() {
    return this.#bytePos;
  }

  /**
   * Writes the current byte to the buffer
   * @private
   */
  #writeByte() {
    if (this.#bytePos >= this.#buffer.length) {throw new Error("Write would exceed end of buffer");}

    // Check if emulation prevention byte is needed (H.264 start code prevention)
    if (this.#currentByte <= 3 && this.#bytePos >= 2 && this.#window === 0) {
      if (this.#bytePos + 1 >= this.#buffer.length)
        {throw new Error("Write would exceed end of buffer");}

      // Insert emulation prevention byte
      this.#buffer[this.#bytePos] = 3;
      this.#buffer[this.#bytePos + 1] = this.#currentByte;
      this.#bytePos += 2;
      this.#window = 0x30 | this.#currentByte; // 0x30 = 48
    } else {
      // Normal byte write
      this.#buffer[this.#bytePos] = this.#currentByte;
      this.#bytePos++;
      this.#window = ((this.#window << 8) | this.#currentByte) & 0xffff;
    }

    // Reset current byte and bit position
    this.#currentByte = 0;
    this.#bitPos = 0;
  }
}
