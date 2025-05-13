// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import Panel from "@lichtblick/suite-base/components/Panel";
import DiagnosticSummary from "@lichtblick/suite-base/panels/DiagnosticSummary/DiagnosticSummary";
import { DEFAULT_CONFIG } from "@lichtblick/suite-base/panels/DiagnosticSummary/constants";

export default Panel(
  Object.assign(DiagnosticSummary, {
    panelType: "DiagnosticSummary",
    defaultConfig: DEFAULT_CONFIG,
  }),
);
