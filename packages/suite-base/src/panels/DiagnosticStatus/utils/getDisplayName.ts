// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { DISPLAY_EMPTY_STATE } from "@lichtblick/suite-base/panels/DiagnosticStatus/constants";

export function getDisplayName(hardwareId: string, name: string): string {
  if (name && hardwareId) {
    return `${hardwareId}: ${name}`;
  }
  if (name) {
    return name;
  }
  if (hardwareId) {
    return hardwareId;
  }

  return DISPLAY_EMPTY_STATE;
}
