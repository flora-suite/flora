// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { proxyTyped } from "./proxy";

describe("proxyTyped", () => {
  it("presents typed data slices as a read-only Chart.js point array", () => {
    const result = proxyTyped({
      datasets: [
        {
          label: "series",
          data: [
            { x: new Float32Array([1, 2]), y: new Float32Array([3, 4]), value: ["a", "b"] },
            { x: new Float32Array([5]), y: new Float32Array([6]), value: ["c"] },
          ],
        },
      ],
    } as never);
    const data = result.datasets[0]!.data as unknown as Record<string, unknown>;

    expect(data.length).toBe(3);
    expect(data[0]).toEqual({ x: 1, y: 3, value: "a" });
    expect(data[1]).toEqual({ x: 2, y: 4, value: "b" });
    expect(data[2]).toEqual({ x: 5, y: 6, value: "c" });
    expect(data[3]).toBeUndefined();
    expect(data[-1]).toBeUndefined();
    expect(data._chartjs).toBeUndefined();
    expect(Reflect.get(data, Symbol.iterator)).toBeDefined();
    expect(Object.isExtensible(data)).toBe(false);
  });

  it("returns undefined if a typed slice is removed after proxy creation", () => {
    const source = {
      datasets: [{ data: [{ x: new Float32Array([1]), y: new Float32Array([2]), value: ["a"] }] }],
    };
    const result = proxyTyped(source as never);
    source.datasets[0]!.data.length = 0;

    expect((result.datasets[0]!.data as unknown as Record<string, unknown>)[0]).toBeUndefined();
  });

  it("handles datasets without data points", () => {
    const result = proxyTyped({ datasets: [{ data: [] }] } as never);

    expect(result.datasets[0]!.data).toHaveLength(0);
  });
});
