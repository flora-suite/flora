// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

/** @jest-environment jsdom */

import { SettingsTreeNode } from "@lichtblick/suite";
import {
  buildSettingsTree,
  BuildSettingsTreeProps,
} from "@lichtblick/suite-base/components/PanelSettings/settingsTree";
import { PanelStateStore } from "@lichtblick/suite-base/context/PanelStateContext";
import { maybeCast } from "@lichtblick/suite-base/util/maybeCast";

jest.mock("@lichtblick/suite-base/util/maybeCast");

describe("buildSettingsTree", () => {
  function setup(): Pick<
    BuildSettingsTreeProps,
    "state" | "extensionSettings" | "topicToSchemaNameMap" | "config"
  > {
    const config: Record<string, unknown> | undefined = {
      topics: {
        topic1: { someConfig: "valueFromConfig" },
      },
    };
    (maybeCast as jest.Mock).mockReturnValue(config);

    const state = {
      settingsTrees: {
        panel1: {
          nodes: {
            topics: {
              children: {
                topic1: {},
              },
            },
          },
        },
      },
    };

    const extensionSettings = {
      myPanelType: {
        schema1: {
          settings: jest.fn(
            (_config): SettingsTreeNode => ({
              label: "valueFromExtension",
              children: {},
            }),
          ),
          handler: jest.fn(),
        },
      },
    };

    const topicToSchemaNameMap = {
      topic1: "schema1",
      topic2: "schema2",
    };

    return {
      state: state as unknown as PanelStateStore,
      extensionSettings,
      topicToSchemaNameMap,
      config,
    };
  }

  beforeEach(() => {
    (console.error as jest.Mock).mockClear();
  });

  it.each<Pick<BuildSettingsTreeProps, "panelType" | "selectedPanelId">>([
    { panelType: undefined, selectedPanelId: "value" },
    { panelType: "value", selectedPanelId: undefined },
  ])(
    "should return undefined if selectedPanelId or panelType is undefined",
    ({ panelType, selectedPanelId }) => {
      const { config, extensionSettings, state, topicToSchemaNameMap } = setup();

      const result = buildSettingsTree({
        config,
        extensionSettings,
        panelType,
        selectedPanelId,
        state,
        topicToSchemaNameMap,
      });
      expect(result).toBeUndefined();
    },
  );

  it("should return undefined if selected panel is not found in state", () => {
    const { config, extensionSettings, state, topicToSchemaNameMap } = setup();

    const result = buildSettingsTree({
      config,
      extensionSettings,
      panelType: "myPanelType",
      selectedPanelId: "invalidPanel",
      state,
      topicToSchemaNameMap,
    });
    expect(result).toBeUndefined();
  });

  it("should return the correct settingsTree when valid panelId and panelType are provided", () => {
    const { config, extensionSettings, state, topicToSchemaNameMap } = setup();

    const result = buildSettingsTree({
      config,
      extensionSettings,
      panelType: "myPanelType",
      selectedPanelId: "panel1",
      state,
      topicToSchemaNameMap,
    });

    expect(result).toEqual({
      nodes: {
        topics: {
          children: {
            topic1: { label: "valueFromExtension", children: {} },
          },
        },
      },
    });
  });

  it("should return the settingsTree even if topics are empty", () => {
    const { config, extensionSettings, topicToSchemaNameMap } = setup();

    const emptyState = {
      settingsTrees: {
        panel1: {
          nodes: {
            topics: {
              children: {},
            },
          },
        },
      },
    } as unknown as PanelStateStore;

    const result = buildSettingsTree({
      config,
      extensionSettings,
      panelType: "myPanelType",
      selectedPanelId: "panel1",
      state: emptyState,
      topicToSchemaNameMap,
    });

    expect(result).toEqual({
      nodes: {
        topics: {
          children: {},
        },
      },
    });
  });

  it("should merge topicsSettings with existing children in the settingsTree", () => {
    const { config, extensionSettings, state, topicToSchemaNameMap } = setup();

    const result = buildSettingsTree({
      config,
      extensionSettings,
      panelType: "myPanelType",
      selectedPanelId: "panel1",
      state,
      topicToSchemaNameMap,
    });

    expect(result?.nodes.topics?.children).toEqual({
      topic1: { label: "valueFromExtension", children: {} },
    });
  });
});
