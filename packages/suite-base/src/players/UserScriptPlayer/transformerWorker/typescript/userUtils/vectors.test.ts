// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { vectorAddition, dot, cross, rotate } from "./vectors";

describe("vectors", () => {
  it("dot", () => {
    expect(dot([2, 4], [1, 2, 3, 4])).toEqual(10);
  });
  it("cross", () => {
    expect(cross([1, 2, 3], [3, 2, 1])).toEqual([-4, 8, -4]);
  });
  it("vectorAddition", () => {
    expect(
      vectorAddition([
        [1, 1, 1],
        [1, 1, 1],
      ]),
    ).toEqual([2, 2, 2]);
  });
  it("rotate", () => {
    expect(rotate({ x: 1, y: 1, z: 1, w: 1 }, { x: 1, y: 1, z: 1 })).toEqual({
      x: 4,
      y: 4,
      z: 4,
    });
  });
});
