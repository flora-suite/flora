/** @jest-environment jsdom */

// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { formatKeyboardShortcut } from "./formatKeyboardShortcut";

describe("formatKeyboardShortcut", () => {
  let userAgent: jest.SpyInstance<string, []>;

  beforeEach(() => {
    userAgent = jest.spyOn(window.navigator, "userAgent", "get");
  });

  it("formats shortcuts correctly for Windows", () => {
    userAgent.mockReturnValue("Windows");
    expect(formatKeyboardShortcut("O", ["Shift", "Meta"])).toBe("Shift+Ctrl+O");
    expect(formatKeyboardShortcut("O", ["Shift", "Shift", "Shift"])).toBe("Shift+Shift+Shift+O");
    expect(formatKeyboardShortcut("O", [])).toBe("O");
  });

  it("formats shortcuts correctly Linux", () => {
    userAgent.mockReturnValue("Linux");
    expect(formatKeyboardShortcut("O", ["Shift", "Meta"])).toBe("Shift+Ctrl+O");
    expect(formatKeyboardShortcut("O", ["Shift", "Shift", "Shift"])).toBe("Shift+Shift+Shift+O");
    expect(formatKeyboardShortcut("O", [])).toBe("O");
  });

  it("formats shortcuts correctly Mac", () => {
    userAgent.mockReturnValue("Mac");
    expect(formatKeyboardShortcut("O", ["Shift", "Meta"])).toBe("⇧⌘O");
    expect(formatKeyboardShortcut("O", ["Shift", "Shift", "Shift"])).toBe("⇧⇧⇧O");
    expect(formatKeyboardShortcut("O", [])).toBe("O");
  });

  it("formats all modifier keys correctly on Mac", () => {
    userAgent.mockReturnValue("Mac");
    expect(formatKeyboardShortcut("A", ["Meta"])).toBe("⌘A");
    expect(formatKeyboardShortcut("B", ["Control"])).toBe("⌃B");
    expect(formatKeyboardShortcut("C", ["Alt"])).toBe("⌥C");
    expect(formatKeyboardShortcut("D", ["Shift"])).toBe("⇧D");
  });

  it("formats all modifier keys correctly on Windows/Linux", () => {
    userAgent.mockReturnValue("Windows");
    expect(formatKeyboardShortcut("A", ["Meta"])).toBe("Ctrl+A");
    expect(formatKeyboardShortcut("B", ["Control"])).toBe("Ctrl+B");
    expect(formatKeyboardShortcut("C", ["Alt"])).toBe("Alt+C");
    expect(formatKeyboardShortcut("D", ["Shift"])).toBe("Shift+D");
  });

  it("handles complex modifier combinations on Mac", () => {
    userAgent.mockReturnValue("Mac");
    expect(formatKeyboardShortcut("Z", ["Meta", "Control", "Alt", "Shift"])).toBe("⌘⌃⌥⇧Z");
    expect(formatKeyboardShortcut("S", ["Meta", "Shift"])).toBe("⌘⇧S");
    expect(formatKeyboardShortcut("F", ["Control", "Alt"])).toBe("⌃⌥F");
  });

  it("handles complex modifier combinations on Windows/Linux", () => {
    userAgent.mockReturnValue("Windows");
    expect(formatKeyboardShortcut("Z", ["Meta", "Control", "Alt", "Shift"])).toBe(
      "Ctrl+Ctrl+Alt+Shift+Z",
    );
    expect(formatKeyboardShortcut("S", ["Meta", "Shift"])).toBe("Ctrl+Shift+S");
    expect(formatKeyboardShortcut("F", ["Control", "Alt"])).toBe("Ctrl+Alt+F");
  });

  it("handles special keys", () => {
    userAgent.mockReturnValue("Mac");
    expect(formatKeyboardShortcut("Enter", ["Meta"])).toBe("⌘Enter");
    expect(formatKeyboardShortcut("Escape", ["Alt"])).toBe("⌥Escape");
    expect(formatKeyboardShortcut("F1", ["Control"])).toBe("⌃F1");
    expect(formatKeyboardShortcut("ArrowUp", ["Shift"])).toBe("⇧ArrowUp");
  });

  it("handles edge cases", () => {
    userAgent.mockReturnValue("Mac");
    expect(formatKeyboardShortcut("", ["Meta"])).toBe("⌘");
    expect(formatKeyboardShortcut("a", [])).toBe("a");

    userAgent.mockReturnValue("Windows");
    expect(formatKeyboardShortcut("", ["Meta"])).toBe("Ctrl+");
    expect(formatKeyboardShortcut("a", [])).toBe("a");
  });

  it("detects Mac user agent correctly", () => {
    const macUserAgents = [
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
      "Mozilla/5.0 (Macintosh; Apple Silicon Mac OS X 12_0_1) AppleWebKit/605.1.15",
      "Something with Mac in it",
    ];

    macUserAgents.forEach((ua) => {
      userAgent.mockReturnValue(ua);
      expect(formatKeyboardShortcut("V", ["Meta"])).toBe("⌘V");
    });
  });

  it("handles non-Mac user agents as Windows/Linux", () => {
    const nonMacUserAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
      "Unknown Browser/1.0",
    ];

    nonMacUserAgents.forEach((ua) => {
      userAgent.mockReturnValue(ua);
      expect(formatKeyboardShortcut("V", ["Meta"])).toBe("Ctrl+V");
    });
  });
});
