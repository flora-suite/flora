// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { findIndices, iterateObjects, iterateTyped } from "./datasets";

describe("chart datasets", () => {
  it("iterates object points while preserving source indexes", () => {
    expect(
      Array.from(iterateObjects([{ x: 1, y: 2, label: "one" }, null, { x: 3, y: 4 }] as never)),
    ).toEqual([
      { index: 0, x: 1, y: 2, label: "one" },
      { index: 2, x: 3, y: 4, label: undefined },
    ]);
  });

  it("iterates typed slices and carries all point fields", () => {
    const values = Array.from(
      iterateTyped([
        { x: new Float32Array([1, 2]), y: new Float32Array([3, 4]), label: ["a", "b"] },
        {} as never,
        { x: new Float32Array([5]), y: new Float32Array([6]), label: ["c"] },
      ]),
      (point) => ({ ...point }),
    );

    expect(values).toEqual([
      { index: 0, label: "a", x: 1, y: 3 },
      { index: 1, label: "b", x: 2, y: 4 },
      { index: 2, label: "c", x: 5, y: 6 },
    ]);
  });

  it("locates global indexes across typed slices", () => {
    const data = [
      { x: new Float32Array([1, 2]), y: new Float32Array([3, 4]), value: [] },
      undefined,
      { x: new Float32Array([5]), y: new Float32Array([6]), value: [] },
    ] as never;

    expect(findIndices(data, 0)).toEqual([0, 0]);
    expect(findIndices(data, 2)).toEqual([2, 0]);
    expect(findIndices(data, 3)).toEqual([2, 1]);
    expect(findIndices(data, 4)).toBeUndefined();
  });
});
