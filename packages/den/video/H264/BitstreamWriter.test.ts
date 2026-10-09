// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Bitstream } from "./Bitstream";
import { BitstreamWriter } from "./BitstreamWriter";

describe("BitstreamWriter", () => {
  it("writes aligned and unaligned fixed-width values", () => {
    const buffer = new Uint8Array(8);
    const writer = new BitstreamWriter(buffer);

    writer.u_1(1);
    writer.u_2(1);
    writer.u_3(2);
    writer.u_8(0xcc);
    writer.finish();

    expect(writer.bytesWritten()).toBe(2);
    expect(Array.from(buffer.slice(0, 2))).toEqual([0xab, 0x30]);
    const reader = new Bitstream(buffer.slice(0, 2));
    expect(reader.u_1()).toBe(1);
    expect(reader.u_2()).toBe(1);
    expect(reader.u_3()).toBe(2);
    expect(reader.u_8()).toBe(0xcc);
  });

  it("writes unsigned and signed exponential Golomb values", () => {
    const buffer = new Uint8Array(16);
    const writer = new BitstreamWriter(buffer);

    writer.ue_v(0);
    writer.ue_v(3);
    writer.ue_v(22);
    writer.se_v(2);
    writer.se_v(-2);
    writer.se_v(0);
    writer.finish();

    const reader = new Bitstream(buffer.slice(0, writer.bytesWritten()));
    expect(reader.ue_v()).toBe(0);
    expect(reader.ue_v()).toBe(3);
    expect(reader.ue_v()).toBe(22);
    expect(reader.se_v()).toBe(2);
    expect(reader.se_v()).toBe(-2);
    expect(reader.se_v()).toBe(0);
  });

  it("inserts an emulation prevention byte after two zero bytes", () => {
    const buffer = new Uint8Array(4);
    const writer = new BitstreamWriter(buffer);

    writer.u_8(0);
    writer.u_8(0);
    writer.u(8, 1);
    writer.finish();

    expect(writer.bytesWritten()).toBe(4);
    expect(Array.from(buffer)).toEqual([0, 0, 3, 1]);
  });

  it("rejects unsupported sizes, overflow, and writes after completion", () => {
    const writer = new BitstreamWriter(new Uint8Array(1));

    expect(() => writer.u(0, 0)).toThrow("u(0) is not supported");
    expect(() => writer.u(33, 0)).toThrow("u(33) is not supported");
    expect(() => writer.ue_v(0xffffffff)).toThrow("ue(v) does not support");
    writer.finish();
    expect(() => writer.finish()).toThrow("finish() was already called");
    expect(() => writer.u_1(1)).toThrow("after finish");

    const tooSmall = new BitstreamWriter(new Uint8Array(1));
    tooSmall.u_8(1);
    expect(() => tooSmall.u_8(2)).toThrow("exceed end of buffer");
  });
});
