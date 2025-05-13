// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
import { IndicatorConfig } from "./types";

export const DEFAULT_CONFIG: IndicatorConfig = {
  path: "",
  style: "bulb",
  fallbackColor: "#a0a0a0",
  fallbackLabel: "False",
  rules: [{ operator: "=", rawValue: "true", color: "#68e24a", label: "True" }],
};
