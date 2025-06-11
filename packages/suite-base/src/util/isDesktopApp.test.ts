// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import isDesktopApp from "./isDesktopApp";

describe("isDesktopApp", () => {
  let originalGlobal: any;

  beforeEach(() => {
    // Save the original global state
    originalGlobal = (global as any).desktopBridge;
  });

  afterEach(() => {
    // Restore the original global state
    if (originalGlobal !== undefined) {
      (global as any).desktopBridge = originalGlobal;
    } else {
      delete (global as any).desktopBridge;
    }
  });

  it("should return true when desktopBridge exists on global", () => {
    (global as any).desktopBridge = {};

    const result = isDesktopApp();

    expect(result).toBe(true);
  });

  it("should return true when desktopBridge is truthy", () => {
    (global as any).desktopBridge = { someProperty: "value" };

    const result = isDesktopApp();

    expect(result).toBe(true);
  });

  it("should return false when desktopBridge is undefined", () => {
    delete (global as any).desktopBridge;

    const result = isDesktopApp();

    expect(result).toBe(false);
  });

  it("should return false when desktopBridge is null", () => {
    (global as any).desktopBridge = null;

    const result = isDesktopApp();

    expect(result).toBe(false);
  });

  it("should return false when desktopBridge is false", () => {
    (global as any).desktopBridge = false;

    const result = isDesktopApp();

    expect(result).toBe(false);
  });

  it("should return false when desktopBridge is 0", () => {
    (global as any).desktopBridge = 0;

    const result = isDesktopApp();

    expect(result).toBe(false);
  });

  it("should return false when desktopBridge is empty string", () => {
    (global as any).desktopBridge = "";

    const result = isDesktopApp();

    expect(result).toBe(false);
  });

  it("should return true when desktopBridge is a string", () => {
    (global as any).desktopBridge = "desktop";

    const result = isDesktopApp();

    expect(result).toBe(true);
  });

  it("should return true when desktopBridge is a number", () => {
    (global as any).desktopBridge = 1;

    const result = isDesktopApp();

    expect(result).toBe(true);
  });

  it("should return true when desktopBridge is an array", () => {
    (global as any).desktopBridge = [];

    const result = isDesktopApp();

    expect(result).toBe(true);
  });

  it("should return true when desktopBridge is a function", () => {
    (global as any).desktopBridge = () => {};

    const result = isDesktopApp();

    expect(result).toBe(true);
  });

  it("should handle complex object as desktopBridge", () => {
    (global as any).desktopBridge = {
      ipc: {},
      methods: {
        openFile: () => {},
        saveFile: () => {},
      },
      version: "1.0.0",
    };

    const result = isDesktopApp();

    expect(result).toBe(true);
  });

  it("should work with different Boolean constructor calls", () => {
    (global as any).desktopBridge = "test";

    // Test that it actually uses Boolean conversion
    const result = isDesktopApp();
    const manualResult = Boolean((global as any).desktopBridge);

    expect(result).toBe(manualResult);
    expect(result).toBe(true);
  });
});
