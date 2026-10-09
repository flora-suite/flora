// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { act, renderHook } from "@testing-library/react";

import { useMemoryInfo } from "./useMemoryInfo";

describe("useMemoryInfo", () => {
  afterEach(() => jest.useRealTimers());

  it("returns browser memory information and refreshes it at the requested interval", () => {
    jest.useFakeTimers();
    const { result, unmount } = renderHook(() => useMemoryInfo({ refreshIntervalMs: 100 }));

    expect(result.current).toEqual({ jsHeapSizeLimit: 100, totalJSHeapSize: 50, usedJSHeapSize: 25 });

    act(() => jest.advanceTimersByTime(100));
    expect(result.current?.usedJSHeapSize).toBe(25);

    unmount();
  });
});
