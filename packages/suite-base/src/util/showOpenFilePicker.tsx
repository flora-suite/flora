// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

/**
 * A wrapper around window.showOpenFilePicker that returns an empty array instead of throwing when
 * the user cancels the file picker.
 */

// Simple helper for file picking when the API is not available
async function createFileInput(options?: OpenFilePickerOptions): Promise<FileSystemFileHandle[]> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    if (options?.multiple) input.multiple = true;

    // Handle accept types if provided
    if (options?.types) {
      const acceptedTypes = options.types
        .flatMap((type) => (type.accept ? Object.values(type.accept).flat() : []))
        .join(",");
      if (acceptedTypes) input.accept = acceptedTypes;
    }

    input.onchange = () => {
      if (!input.files || input.files.length === 0) {
        resolve([]);
        return;
      }

      // Create minimal compatible file handles
      const fileHandles = Array.from(input.files).map((file) => ({
        kind: "file" as const,
        name: file.name,
        getFile: async () => file,
        // Add permission methods required by the File System Access API
        queryPermission: async () => "granted" as const,
        requestPermission: async () => "granted" as const,
      }));

      resolve(fileHandles as unknown as FileSystemFileHandle[]);
    };

    // Cancel case
    input.oncancel = () => resolve([]);

    // Trigger file picker
    input.click();
  });
}

export default async function showOpenFilePicker(
  options?: OpenFilePickerOptions,
): Promise<FileSystemFileHandle[] /* foxglove-depcheck-used: @types/wicg-file-system-access */> {
  try {
    // Check if the File System Access API is available
    if (typeof window.showOpenFilePicker !== "function") {
      // Fallback to traditional file input
      return await createFileInput(options);
    }
    return await window.showOpenFilePicker(options);
  } catch (err) {
    if (err.name === "AbortError") {
      return [];
    }
    throw err;
  }
}
