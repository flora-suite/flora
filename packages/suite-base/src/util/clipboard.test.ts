/** @jest-environment jsdom */

// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import clipboard from "./clipboard";

// Mock execCommand
document.execCommand = jest.fn();

describe("clipboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset navigator.clipboard mock
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      writable: true,
    });
  });

  describe("copy", () => {
    it("should use navigator.clipboard.writeText when available", async () => {
      const mockWriteText = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: mockWriteText },
        writable: true,
      });

      const testText = "test clipboard content";
      await clipboard.copy(testText);

      expect(mockWriteText).toHaveBeenCalledWith(testText);
      expect(document.execCommand).not.toHaveBeenCalled();
    });

    it("should fallback to execCommand when navigator.clipboard.writeText is not available", async () => {
      // Mock navigator.clipboard to have no writeText method
      Object.defineProperty(navigator, "clipboard", {
        value: {},
        writable: true,
      });

      // Mock document.createElement to return a controlled element
      const mockTextarea = { value: "", select: jest.fn() } as unknown as HTMLTextAreaElement;
      const originalCreateElement = document.createElement;
      jest.spyOn(document, "createElement").mockImplementation((tagName: string) => {
        if (tagName === "textarea") {
          return mockTextarea;
        }
        return originalCreateElement.call(document, tagName);
      });

      const mockAppendChild = jest
        .spyOn(document.body, "appendChild")
        .mockImplementation(() => mockTextarea);
      const mockRemoveChild = jest
        .spyOn(document.body, "removeChild")
        .mockImplementation(() => mockTextarea);

      const testText = "fallback clipboard content";
      await clipboard.copy(testText);

      expect(mockAppendChild).toHaveBeenCalledWith(mockTextarea);
      expect(mockTextarea.value).toBe(testText);
      expect(mockTextarea.select).toHaveBeenCalled();
      expect(document.execCommand).toHaveBeenCalledWith("copy");
      expect(mockRemoveChild).toHaveBeenCalledWith(mockTextarea);

      // Cleanup
      mockAppendChild.mockRestore();
      mockRemoveChild.mockRestore();
      (document.createElement as jest.Mock).mockRestore();
    });

    it("should fallback to execCommand when navigator.clipboard.writeText throws an error", async () => {
      const mockWriteText = jest.fn().mockRejectedValue(new Error("Permission denied"));
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: mockWriteText },
        writable: true,
      });

      // Mock document.createElement to return a controlled element
      const mockTextarea = { value: "", select: jest.fn() } as unknown as HTMLTextAreaElement;
      const originalCreateElement = document.createElement;
      jest.spyOn(document, "createElement").mockImplementation((tagName: string) => {
        if (tagName === "textarea") {
          return mockTextarea;
        }
        return originalCreateElement.call(document, tagName);
      });

      const mockAppendChild = jest
        .spyOn(document.body, "appendChild")
        .mockImplementation(() => mockTextarea);
      const mockRemoveChild = jest
        .spyOn(document.body, "removeChild")
        .mockImplementation(() => mockTextarea);

      const testText = "error fallback content";
      await clipboard.copy(testText);

      expect(mockWriteText).toHaveBeenCalledWith(testText);
      expect(mockAppendChild).toHaveBeenCalledWith(mockTextarea);
      expect(mockTextarea.value).toBe(testText);
      expect(mockTextarea.select).toHaveBeenCalled();
      expect(document.execCommand).toHaveBeenCalledWith("copy");
      expect(mockRemoveChild).toHaveBeenCalledWith(mockTextarea);

      // Cleanup
      mockAppendChild.mockRestore();
      mockRemoveChild.mockRestore();
      (document.createElement as jest.Mock).mockRestore();
    });

    it("should handle empty string input", async () => {
      const mockWriteText = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: mockWriteText },
        writable: true,
      });

      await clipboard.copy("");

      expect(mockWriteText).toHaveBeenCalledWith("");
    });

    it("should handle special characters", async () => {
      const mockWriteText = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: mockWriteText },
        writable: true,
      });

      const specialText = "Special chars: 中文 🚀 \n\t\"'";
      await clipboard.copy(specialText);

      expect(mockWriteText).toHaveBeenCalledWith(specialText);
    });
  });
});
