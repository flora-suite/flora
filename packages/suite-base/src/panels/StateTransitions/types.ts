// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { SaveConfig } from "@lichtblick/suite-base/types/panels";
import { TimestampMethod } from "@lichtblick/suite-base/util/time";

export type StateTransitionPath = {
  color?: string;
  value: string;
  label?: string;
  enabled?: boolean;
  timestampMethod: TimestampMethod;
};

export type StateTransitionConfig = {
  isSynced: boolean;
  paths: StateTransitionPath[];
  xAxisMaxValue?: number;
  xAxisMinValue?: number;
  xAxisRange?: number;
  showPoints?: boolean;
};

export type StateTransitionPanelProps = {
  config: StateTransitionConfig;
  saveConfig: SaveConfig<StateTransitionConfig>;
};

export type PathLegendProps = {
  paths: StateTransitionPath[];
  heightPerTopic: number;
  setFocusedPath: (value: string[] | undefined) => void;
  saveConfig: SaveConfig<StateTransitionConfig>;
};
