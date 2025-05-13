// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { DiagnosticStatusConfig } from "@lichtblick/suite-base/panels/DiagnosticStatus/types";

export const DEFAULT_CONFIG: DiagnosticStatusConfig = { topicToRender: "/diagnostics" };

export const MIN_SPLIT_FRACTION = 0.1;

export const ALLOWED_TAGS: string[] = [
  "b",
  "br",
  "center",
  "code",
  "em",
  "font",
  "i",
  "strong",
  "table",
  "td",
  "th",
  "tr",
  "tt",
  "u",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
];

export const DISPLAY_EMPTY_STATE = "(empty)";
