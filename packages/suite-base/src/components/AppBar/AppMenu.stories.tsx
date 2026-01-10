// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { PopoverPosition, PopoverReference } from "@mui/material";
import { Meta, StoryFn, StoryObj } from "@storybook/react";
import * as _ from "lodash-es";

import PlayerSelectionContext, {
  PlayerSelection,
} from "@lichtblick/suite-base/context/PlayerSelectionContext";
import MockCurrentLayoutProvider from "@lichtblick/suite-base/providers/CurrentLayoutProvider/MockCurrentLayoutProvider";
import WorkspaceContextProvider from "@lichtblick/suite-base/providers/WorkspaceContextProvider";

import { AppMenu } from "./AppMenu";

type StoryArgs = {
  handleClose: () => void;
  anchorEl?: HTMLElement;
  anchorReference?: PopoverReference;
  anchorPosition?: PopoverPosition;
  disablePortal?: boolean;
  open: boolean;
};

export default {
  title: "components/AppBar/AppMenu",
  component: AppMenu,
  args: {
    open: true,
    anchorPosition: { top: 0, left: 0 },
    anchorReference: "anchorPosition",
    disablePortal: true,
    handleClose: _.noop,
  },
  decorators: [
    (Story: StoryFn, { args }: { args: StoryArgs }): React.JSX.Element => (
      <MockCurrentLayoutProvider>
        <WorkspaceContextProvider>
          <PlayerSelectionContext.Provider value={playerSelection}>
            <Story {...args} />
          </PlayerSelectionContext.Provider>
        </WorkspaceContextProvider>
      </MockCurrentLayoutProvider>
    ),
  ],
} satisfies Meta<StoryArgs>;

// Connection
const playerSelection: PlayerSelection = {
  selectSource: () => {},
  selectRecent: () => {},
  recentSources: [
    // prettier-ignore
    { id: "1111", title: "NuScenes-v1.0-mini-scene-0655-reallllllllly-long-name-8829908290831091.bag" },
    { id: "2222", title: "http://localhost:11311", label: "ROS 1" },
    { id: "3333", title: "ws://localhost:9090/", label: "Rosbridge (ROS 1 & 2)" },
    { id: "4444", title: "ws://localhost:8765", label: "Foxglove WebSocket" },
    { id: "5555", title: "2369", label: "Velodyne Lidar" },
  ],
  availableSources: [],
};

const playerSelectionEmpty: PlayerSelection = {
  selectSource: () => {},
  selectRecent: () => {},
  recentSources: [],
  availableSources: [],
};

type Story = StoryObj<StoryArgs>;

export const Default: Story = {};

export const Dark: Story = {
  parameters: { colorScheme: "dark" },
};

export const DarkChinese: Story = {
  parameters: { colorScheme: "dark", forceLanguage: "zh" },
};

export const DarkJapanese: Story = {
  parameters: { colorScheme: "dark", forceLanguage: "ja" },
};

export const Light: Story = {
  parameters: { colorScheme: "light" },
};

export const LightChinese: Story = {
  parameters: { colorScheme: "light", forceLanguage: "zh" },
};

export const LightJapanese: Story = {
  parameters: { colorScheme: "light", forceLanguage: "ja" },
};

export const NoRecentSources: Story = {
  decorators: [
    (Story: StoryFn, { args }: { args: StoryArgs }): React.JSX.Element => (
      <MockCurrentLayoutProvider>
        <WorkspaceContextProvider>
          <PlayerSelectionContext.Provider value={playerSelectionEmpty}>
            <Story {...args} />
          </PlayerSelectionContext.Provider>
        </WorkspaceContextProvider>
      </MockCurrentLayoutProvider>
    ),
  ],
  parameters: { colorScheme: "dark" },
};
