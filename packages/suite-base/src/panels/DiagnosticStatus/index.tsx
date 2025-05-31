// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import Panel from "@lichtblick/suite-base/components/Panel";
import DiagnosticStatusPanel from "@lichtblick/suite-base/panels/DiagnosticStatus/DiagnosticStatusPanel";
import { DEFAULT_CONFIG } from "@lichtblick/suite-base/panels/DiagnosticStatus/constants";

// Diagnostic - Detail
export default Panel(
  Object.assign(DiagnosticStatusPanel, {
    panelType: "DiagnosticStatusPanel",
    defaultConfig: DEFAULT_CONFIG,
  }),
);
