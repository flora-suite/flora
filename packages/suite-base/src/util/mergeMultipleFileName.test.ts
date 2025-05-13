// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { mergeMultipleFileNames } from "./mergeMultipleFileName";

// packages/suite-base/src/util/mergeMultipleFileName.test.ts

describe("mergeMultipleFileName", () => {
  it("should return an empty string when the input array is empty", () => {
    expect(mergeMultipleFileNames([])).toBe("");
  });

  it("should return the single name when the input array has one element", () => {
    expect(mergeMultipleFileNames(["file1.txt"])).toBe("file1.txt");
  });

  it("should return the names joined by a comma and the count in parentheses when the input array has multiple elements", () => {
    expect(mergeMultipleFileNames(["file1.txt", "file2.txt", "file3.txt"])).toBe(
      "file1.txt, file2.txt, file3.txt",
    );
  });

  it("should handle names with commas correctly", () => {
    expect(mergeMultipleFileNames(["file1,part1.txt", "file2.txt"])).toBe(
      "file1,part1.txt, file2.txt",
    );
  });

  it("should handle names with special characters correctly", () => {
    expect(mergeMultipleFileNames(["file1@.txt", "file2#.txt"])).toBe("file1@.txt, file2#.txt");
  });
});
