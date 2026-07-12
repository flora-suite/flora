// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { getSupportedLanguage } from "./settings";

describe("getSupportedLanguage", () => {
  it.each([
    ["en", "en"],
    ["en-US", "en"],
    ["zh-CN", "zh"],
    ["ja-JP", "ja"],
    ["fr-FR", "en"],
    [undefined, "en"],
  ])("maps %s to %s", (language, expectedLanguage) => {
    expect(getSupportedLanguage(language)).toEqual(expectedLanguage);
  });
});
