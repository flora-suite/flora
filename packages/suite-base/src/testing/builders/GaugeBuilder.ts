// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  ColorMapConfig,
  ColorModeConfig,
  GaugeConfig,
} from "@lichtblick/suite-base/panels/Gauge/types";
import BasicBuilder from "@lichtblick/suite-base/testing/builders/BasicBuilder";
import { defaults } from "@lichtblick/suite-base/testing/builders/utilities";

export default class GaugeBuilder {
  public static config(props: Partial<GaugeConfig> = {}): GaugeConfig {
    return defaults<GaugeConfig>(props, {
      colorMap: BasicBuilder.sample(ColorMapConfig),
      colorMode: BasicBuilder.sample(ColorModeConfig),
      gradient: ["#000", "#fff"],
      maxValue: BasicBuilder.number(),
      minValue: BasicBuilder.number(),
      path: BasicBuilder.string(),
      reverse: BasicBuilder.boolean(),
    });
  }
}
