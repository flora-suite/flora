// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Builder, ByteBuffer } from "flatbuffers";

import { ByteVector } from "./byte-vector";

function buildVector(data?: number[], sizePrefixed = false): Uint8Array {
  const builder = new Builder();
  const dataOffset = data == undefined ? undefined : ByteVector.createDataVector(builder, data);
  ByteVector.startByteVector(builder);
  if (dataOffset != undefined) {
    ByteVector.addData(builder, dataOffset);
  }
  const offset = ByteVector.endByteVector(builder);
  if (sizePrefixed) {
    ByteVector.finishSizePrefixedByteVectorBuffer(builder, offset);
  } else {
    ByteVector.finishByteVectorBuffer(builder, offset);
  }
  return builder.asUint8Array();
}

describe("ByteVector", () => {
  it("reads a vector created with the generated helpers", () => {
    const bytes = buildVector([1, 2, 3]);
    const vector = ByteVector.getRootAsByteVector(new ByteBuffer(bytes));

    expect(vector.dataLength()).toBe(3);
    expect(vector.data(1)).toBe(2);
    expect(vector.dataArray()).toEqual(new Uint8Array([1, 2, 3]));
  });

  it("supports size-prefixed buffers and caller-provided instances", () => {
    const bytes = buildVector([4], true);
    const reusable = new ByteVector();
    const vector = ByteVector.getSizePrefixedRootAsByteVector(new ByteBuffer(bytes), reusable);

    expect(vector).toBe(reusable);
    expect(vector.data(0)).toBe(4);
  });

  it("returns generated defaults when the vector field is absent", () => {
    const vector = ByteVector.getRootAsByteVector(new ByteBuffer(buildVector()));

    expect(vector.data(0)).toBe(0);
    expect(vector.dataLength()).toBe(0);
    expect(vector.dataArray()).toBeNull();
  });

  it("exposes the manual vector-builder helpers", () => {
    const builder = new Builder();
    ByteVector.startDataVector(builder, 0);
    const data = builder.endVector();
    const vector = ByteVector.createByteVector(builder, data);
    ByteVector.finishByteVectorBuffer(builder, vector);

    expect(ByteVector.getRootAsByteVector(new ByteBuffer(builder.asUint8Array())).dataLength()).toBe(0);
  });
});
