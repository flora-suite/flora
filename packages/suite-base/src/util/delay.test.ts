// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import delay from "./delay";

describe("delay", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should return a Promise that resolves to undefined", async () => {
    const result = delay(100);

    expect(result).toBeInstanceOf(Promise);

    jest.advanceTimersByTime(100);
    const resolvedValue = await result;

    expect(resolvedValue).toBeUndefined();
  });

  it("should handle multiple concurrent delays", async () => {
    const results = {
      delay100: false,
      delay200: false,
      delay300: false,
    };

    delay(100).then(() => {
      results.delay100 = true;
    });
    delay(200).then(() => {
      results.delay200 = true;
    });
    delay(300).then(() => {
      results.delay300 = true;
    });

    // After 100ms, only first should be resolved
    jest.advanceTimersByTime(100);
    await Promise.resolve();
    expect(results.delay200).toBe(false);
    expect(results.delay300).toBe(false);

    // After 200ms total, first two should be resolved
    jest.advanceTimersByTime(100);
    await Promise.resolve();
    expect(results.delay100).toBe(true);
    expect(results.delay300).toBe(false);

    // After 300ms total, all should be resolved
    jest.advanceTimersByTime(100);
    await Promise.resolve();
    expect(results.delay100).toBe(true);
    expect(results.delay200).toBe(true);
  });

  it("should work with real timers for integration test", async () => {
    jest.useRealTimers();

    const start = Date.now();
    await delay(50); // Use a small delay for test speed
    const end = Date.now();

    // Allow some tolerance for timing variations
    expect(end - start).toBeGreaterThanOrEqual(45);
    expect(end - start).toBeLessThan(100);
  });
});
