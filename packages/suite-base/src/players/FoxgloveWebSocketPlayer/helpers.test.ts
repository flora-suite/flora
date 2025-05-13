// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { StatusLevel } from "@foxglove/ws-protocol";

import {
  dataTypeToFullName,
  statusLevelToProblemSeverity,
} from "@lichtblick/suite-base/players/FoxgloveWebSocketPlayer/helpers";
import BasicBuilder from "@lichtblick/suite-base/testing/builders/BasicBuilder";

describe("dataTypeToFullName", () => {
  it("should convert dataType to include /msg/ on it", () => {
    const message = "unit/test";

    const result = dataTypeToFullName(message);

    expect(result).toBe("unit/msg/test");
  });

  it("should return the message unaltered if it differs from the 'text/text' format", () => {
    const message = BasicBuilder.string();

    const result = dataTypeToFullName(message);

    expect(result).toBe(message);
  });
});

describe("statusLevelToProblemSeverity", () => {
  type StatusLevelToProblemTest = [level: StatusLevel, result: string];

  it.each<StatusLevelToProblemTest>([
    [StatusLevel.INFO, "info"],
    [StatusLevel.WARNING, "warn"],
    [StatusLevel.ERROR, "error"],
  ])("should map StatusLevel %s to result %s", (level, result) => {
    expect(statusLevelToProblemSeverity(level)).toBe(result);
  });
});
