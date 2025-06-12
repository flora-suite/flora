/** @jest-environment jsdom */

// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import waitForFonts from "./waitForFonts";

describe("waitForFonts", () => {
  let mockFonts: FontFace[];
  let originalDocumentFonts: FontFaceSet;

  beforeEach(() => {
    // Save original document.fonts
    originalDocumentFonts = document.fonts;

    // Create mock fonts
    mockFonts = [];

    // Mock document.fonts
    const mockFontFaceSet = {
      *[Symbol.iterator]() {
        for (const font of mockFonts) {
          yield font;
        }
      },
    } as FontFaceSet;

    Object.defineProperty(document, "fonts", {
      value: mockFontFaceSet,
      writable: true,
    });
  });

  afterEach(() => {
    // Restore original document.fonts
    Object.defineProperty(document, "fonts", {
      value: originalDocumentFonts,
      writable: true,
    });
  });

  it("should resolve when no fonts are present", async () => {
    // No fonts in mockFonts array
    const result = await waitForFonts();

    expect(result).toEqual([]);
  });

  it("should wait for all fonts to load", async () => {
    const mockFont1 = {
      load: jest.fn().mockResolvedValue("font1-loaded"),
    } as unknown as FontFace;

    const mockFont2 = {
      load: jest.fn().mockResolvedValue("font2-loaded"),
    } as unknown as FontFace;

    mockFonts.push(mockFont1, mockFont2);

    const result = await waitForFonts();

    expect(mockFont1.load).toHaveBeenCalled();
    expect(mockFont2.load).toHaveBeenCalled();
    expect(result).toEqual(["font1-loaded", "font2-loaded"]);
  });

  it("should handle font loading failures gracefully", async () => {
    const mockFont1 = {
      load: jest.fn().mockResolvedValue("font1-loaded"),
    } as unknown as FontFace;

    const mockFont2 = {
      load: jest.fn().mockRejectedValue(new Error("Font failed to load")),
    } as unknown as FontFace;

    mockFonts.push(mockFont1, mockFont2);

    await expect(waitForFonts()).rejects.toThrow("Font failed to load");

    expect(mockFont1.load).toHaveBeenCalled();
    expect(mockFont2.load).toHaveBeenCalled();
  });

  it("should handle a single font", async () => {
    const mockFont = {
      load: jest.fn().mockResolvedValue("single-font-loaded"),
    } as unknown as FontFace;

    mockFonts.push(mockFont);

    const result = await waitForFonts();

    expect(mockFont.load).toHaveBeenCalled();
    expect(result).toEqual(["single-font-loaded"]);
  });

  it("should handle multiple font loading with different timing", async () => {
    const mockFont1 = {
      load: jest
        .fn()
        .mockImplementation(
          async () => await new Promise((resolve) => setTimeout(() => { resolve("font1-slow"); }, 100)),
        ),
    } as unknown as FontFace;

    const mockFont2 = {
      load: jest.fn().mockResolvedValue("font2-fast"),
    } as unknown as FontFace;

    const mockFont3 = {
      load: jest
        .fn()
        .mockImplementation(
          async () => await new Promise((resolve) => setTimeout(() => { resolve("font3-medium"); }, 50)),
        ),
    } as unknown as FontFace;

    mockFonts.push(mockFont1, mockFont2, mockFont3);

    const startTime = Date.now();
    const result = await waitForFonts();
    const endTime = Date.now();

    // Should wait for all fonts, including the slowest one
    expect(endTime - startTime).toBeGreaterThanOrEqual(90);

    expect(mockFont1.load).toHaveBeenCalled();
    expect(mockFont2.load).toHaveBeenCalled();
    expect(mockFont3.load).toHaveBeenCalled();
    expect(result).toEqual(["font1-slow", "font2-fast", "font3-medium"]);
  });

  it("should preserve font loading order", async () => {
    const fonts = Array.from({ length: 5 }, (_, i) => ({
      load: jest.fn().mockResolvedValue(`font-${i}`),
    })) as unknown as FontFace[];

    mockFonts.push(...fonts);

    const result = await waitForFonts();

    fonts.forEach((font) => {
      expect(font.load).toHaveBeenCalled();
    });

    expect(result).toEqual(["font-0", "font-1", "font-2", "font-3", "font-4"]);
  });

  it("should handle fonts that return different types of values", async () => {
    const mockFont1 = {
      load: jest.fn().mockResolvedValue(undefined),
    } as unknown as FontFace;

    const mockFont2 = {
      load: jest.fn().mockResolvedValue(null),
    } as unknown as FontFace;

    const mockFont3 = {
      load: jest.fn().mockResolvedValue({ fontFamily: "Arial" }),
    } as unknown as FontFace;

    mockFonts.push(mockFont1, mockFont2, mockFont3);

    const result = await waitForFonts();

    expect(result).toEqual([undefined, null, { fontFamily: "Arial" }]);
  });
});
