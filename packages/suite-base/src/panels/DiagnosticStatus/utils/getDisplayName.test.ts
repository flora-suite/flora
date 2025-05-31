// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
import { DISPLAY_EMPTY_STATE } from "@lichtblick/suite-base/panels/DiagnosticStatus/constants";
import { getDisplayName } from "@lichtblick/suite-base/panels/DiagnosticStatus/utils/getDisplayName";
import BasicBuilder from "@lichtblick/suite-base/testing/builders/BasicBuilder";

describe("getDisplayName", () => {
  it("handles hardware_id and name", () => {
    const hardwareId = BasicBuilder.string();
    const name = BasicBuilder.string();

    const result = getDisplayName(hardwareId, name);

    expect(result).toBe(`${hardwareId}: ${name}`);
  });

  it("handles blank name with hardware_id", () => {
    const hardwareId = BasicBuilder.string();
    const name = "";

    const result = getDisplayName(hardwareId, name);

    expect(result).toBe(hardwareId);
  });

  it("handles blank hardware_id with name", () => {
    const hardwareId = "";
    const name = BasicBuilder.string();

    const result = getDisplayName(hardwareId, name);

    expect(result).toBe(name);
  });

  it("handles blank hardware_id and blank name", () => {
    const hardwareId = "";
    const name = "";

    const result = getDisplayName(hardwareId, name);

    expect(result).toBe(DISPLAY_EMPTY_STATE);
  });
});
