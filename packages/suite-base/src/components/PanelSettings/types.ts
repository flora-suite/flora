// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { SvgIconProps } from "@mui/material";

import { PanelSettings } from "@lichtblick/suite";
import { MessagePipelineContext } from "@lichtblick/suite-base/components/MessagePipeline";
import { PanelStateStore } from "@lichtblick/suite-base/context/PanelStateContext";

export type ExtensionSettings = Record<string, Record<string, PanelSettings<unknown>>>;

export type BuildSettingsTreeProps = {
  config: Record<string, unknown> | undefined;
  extensionSettings: ExtensionSettings;
  messagePipelineState: () => MessagePipelineContext;
  panelType: string | undefined;
  selectedPanelId: string | undefined;
} & Pick<PanelStateStore, "settingsTrees">;

export type ActionMenuProps = {
  allowShare: boolean;
  onReset: () => void;
  onShare: () => void;
  fontSize?: SvgIconProps["fontSize"];
};
