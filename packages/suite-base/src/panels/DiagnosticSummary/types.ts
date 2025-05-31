// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { DiagnosticId, DiagnosticInfo } from "@lichtblick/suite-base/panels/DiagnosticStatus/types";
import { SaveConfig } from "@lichtblick/suite-base/types/panels";

export type DiagnosticSummaryConfig = {
  minLevel: number;
  pinnedIds: DiagnosticId[];
  topicToRender: string;
  hardwareIdFilter: string;
  sortByLevel?: boolean;
  secondsUntilStale?: number;
};

export type DiagnosticsById = Map<DiagnosticId, DiagnosticInfo>;

export type NodeRowProps = {
  info: DiagnosticInfo;
  isPinned: boolean;
  onClick: (info: DiagnosticInfo) => void;
  onClickPin: (info: DiagnosticInfo) => void;
};

export type DiagnosticSummaryProps = {
  config: DiagnosticSummaryConfig;
  saveConfig: SaveConfig<DiagnosticSummaryConfig>;
};
