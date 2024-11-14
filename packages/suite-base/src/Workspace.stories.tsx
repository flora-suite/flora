// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { StoryContext, StoryObj } from "@storybook/react";
import { fireEvent, screen, waitFor } from "@storybook/testing-library";
import { useEffect, useMemo, useState } from "react";

import MultiProvider from "@lichtblick/suite-base/components/MultiProvider";
import Panel from "@lichtblick/suite-base/components/Panel";
import { usePanelContext } from "@lichtblick/suite-base/components/PanelContext";
import { DraggedMessagePath } from "@lichtblick/suite-base/components/PanelExtensionAdapter";
import PanelToolbar from "@lichtblick/suite-base/components/PanelToolbar";
import { LayoutData, LayoutID } from "@lichtblick/suite-base/context/CurrentLayoutContext";
import LayoutStorageContext from "@lichtblick/suite-base/context/LayoutStorageContext";
import PanelCatalogContext, {
  PanelCatalog,
  PanelInfo,
} from "@lichtblick/suite-base/context/PanelCatalogContext";
import Tab from "@lichtblick/suite-base/panels/Tab";
import MockCurrentLayoutProvider from "@lichtblick/suite-base/providers/CurrentLayoutProvider/MockCurrentLayoutProvider";
import { defaultPlaybackConfig } from "@lichtblick/suite-base/providers/CurrentLayoutProvider/reducers";
import EventsProvider from "@lichtblick/suite-base/providers/EventsProvider";
import LayoutManagerProvider from "@lichtblick/suite-base/providers/LayoutManagerProvider";
import { ISO8601Timestamp, Layout } from "@lichtblick/suite-base/services/ILayoutStorage";
import LayoutManager from "@lichtblick/suite-base/services/LayoutManager/LayoutManager";
import MockLayoutStorage from "@lichtblick/suite-base/services/MockLayoutStorage";
import PanelSetup, { Fixture } from "@lichtblick/suite-base/stories/PanelSetup";

import Workspace from "./Workspace";

export default {
  title: "Base/Workspace",
  component: Workspace,
  parameters: {
    colorScheme: "light",
  },
};

class MockPanelCatalog implements PanelCatalog {
  static #fakePanel: PanelInfo = {
    title: "Fake Panel",
    type: "Fake",
    module: async () => {
      return {
        default: Panel(
          Object.assign(
            () => (
              <>
                <PanelToolbar />
                <div>I’m a fake panel</div>
              </>
            ),
            { panelType: "Fake", defaultConfig: {} },
          ),
        ),
      };
    },
  };

  static #droppablePanel: PanelInfo = {
    title: "Droppable Panel",
    type: "Droppable",
    module: async () => {
      return {
        default: Panel(
          Object.assign(
            function DroppablePanel() {
              const { setMessagePathDropConfig } = usePanelContext();
              const [droppedPaths, setDroppedPaths] = useState<
                readonly DraggedMessagePath[] | undefined
              >();
              useEffect(() => {
                setMessagePathDropConfig({
                  getDropStatus(_paths) {
                    return { canDrop: true, message: "Example drop message" };
                  },
                  handleDrop(paths) {
                    setDroppedPaths(paths);
                  },
                });
              }, [setMessagePathDropConfig]);
              return (
                <>
                  <PanelToolbar />
                  <div>Drop here!</div>
                  {droppedPaths && <pre>{JSON.stringify(droppedPaths, undefined, 2)}</pre>}
                </>
              );
            },
            { panelType: "Droppable", defaultConfig: {} },
          ),
        ),
      };
    },
  };

  public getPanels(): readonly PanelInfo[] {
    return [
      MockPanelCatalog.#fakePanel,
      MockPanelCatalog.#droppablePanel,
      { title: "Tab", type: "Tab", module: async () => ({ default: Tab }) },
    ];
  }
  public getPanelByType(type: string): PanelInfo | undefined {
    return this.getPanels().find((panel) => panel.type === type);
  }
}

const DEFAULT_LAYOUT_FOR_TESTS: LayoutData = {
  configById: {},
  globalVariables: {},
  userNodes: {},
  playbackConfig: defaultPlaybackConfig,
};

const exampleCurrentLayout: Layout = {
  id: "test-id" as LayoutID,
  name: "Current Layout",
  baseline: {
    data: DEFAULT_LAYOUT_FOR_TESTS,
    savedAt: new Date(10).toISOString() as ISO8601Timestamp,
  },
  permission: "CREATOR_WRITE",
  working: undefined,
  syncInfo: undefined,
};

const notCurrentLayout: Layout = {
  id: "not-current" as LayoutID,
  name: "Another Layout",
  baseline: {
    data: DEFAULT_LAYOUT_FOR_TESTS,
    savedAt: new Date(10).toISOString() as ISO8601Timestamp,
  },
  permission: "CREATOR_WRITE",
  working: undefined,
  syncInfo: undefined,
};

const shortLayout: Layout = {
  id: "short-id" as LayoutID,
  name: "Short",
  baseline: {
    data: DEFAULT_LAYOUT_FOR_TESTS,
    savedAt: new Date(10).toISOString() as ISO8601Timestamp,
  },
  permission: "CREATOR_WRITE",
  working: undefined,
  syncInfo: undefined,
};

export const Basic: StoryObj<{ initialLayoutState: Partial<LayoutData> }> = {
  args: {
    initialLayoutState: { layout: "Fake" },
  },
  render: (args, ctx: StoryContext) => {
    const fixture: Fixture = {
      topics: [{ name: "foo topic", schemaName: "test.Foo" }],
      datatypes: new Map([
        [
          "test.Foo",
          {
            definitions: [
              { name: "bar field", type: "string" },
              { name: "baz field", type: "string" },
            ],
          },
        ],
      ]),
    };
    const storage = useMemo(
      () =>
        new MockLayoutStorage(
          LayoutManager.LOCAL_STORAGE_NAMESPACE,
          (ctx.parameters.mockLayouts as Layout[] | undefined) ?? [
            notCurrentLayout,
            exampleCurrentLayout,
            shortLayout,
          ],
        ),
      [ctx.parameters.mockLayouts],
    );
    const providers = [
      /* eslint-disable react/jsx-key */
      <LayoutStorageContext.Provider value={storage} />,
      <LayoutManagerProvider />,
      <PanelSetup fixture={fixture}>{undefined}</PanelSetup>,
      <EventsProvider />,
      <PanelCatalogContext.Provider value={new MockPanelCatalog()} />,
      <MockCurrentLayoutProvider initialState={args.initialLayoutState} />,
      /* eslint-enable react/jsx-key */
    ];
    return (
      <MultiProvider providers={providers}>
        <Workspace disablePersistenceForStorybook />
      </MultiProvider>
    );
  },
};

export const Chinese: typeof Basic = {
  ...Basic,
  parameters: { forceLanguage: "zh" },
};

export const Japanese: typeof Basic = {
  ...Basic,
  parameters: { forceLanguage: "ja" },
};

export const FullscreenPanel: typeof Basic = {
  ...Basic,
  play: async () => {
    fireEvent.click(await screen.findByTestId("panel-menu"));
    fireEvent.click(await screen.findByTestId("panel-menu-fullscreen"));
  },
};

export const DragTopicStart: typeof Basic = {
  ...Basic,
  args: {
    initialLayoutState: {
      layout: {
        direction: "column",
        first: "Fake",
        second: "Tab!a",
      },
      configById: {
        "Tab!a": {
          activeTabIdx: 0,
          tabs: [
            { title: "Tab A", layout: { direction: "row", first: "Fake", second: "Droppable" } },
          ],
        },
      },
    },
  },
  play: async () => {
    fireEvent.click(await screen.findByText("Topics"));

    const handle = await screen.findByTestId("TopicListDragHandle");
    fireEvent.dragStart(handle);
  },
};

export const DragTopicOver: typeof Basic = {
  ...DragTopicStart,
  play: async () => {
    fireEvent.click(await screen.findByText("Topics"));

    const handle = await screen.findByTestId("TopicListDragHandle");
    fireEvent.dragStart(handle);
    const dest = await screen.findByText("Drop here!");
    fireEvent.dragOver(dest);
  },
};

export const DragTopicDrop: typeof Basic = {
  ...DragTopicStart,
  play: async () => {
    fireEvent.click(await screen.findByText("Topics"));

    const handle = await screen.findByTestId("TopicListDragHandle");
    fireEvent.dragStart(handle);
    const dest = await screen.findByText("Drop here!");
    fireEvent.dragOver(dest);
    fireEvent.drop(dest);
  },
};

export const DragPathDrop: typeof Basic = {
  ...DragTopicStart,
  play: async () => {
    fireEvent.click(await screen.findByText("Topics"));
    fireEvent.change(await screen.findByPlaceholderText("Filter by topic or schema name…"), {
      target: { value: "foobar" },
    });
    const handle = await waitFor(async () => {
      const handles = await screen.findAllByTestId("TopicListDragHandle");
      if (handles.length < 2) {
        throw new Error("Expected 2 drag handles");
      }
      return handles[1]!;
    });
    fireEvent.dragStart(handle);
    const dest = await screen.findByText("Drop here!");
    fireEvent.dragOver(dest);
    fireEvent.drop(dest);
  },
};

export const DragMultipleItems: typeof Basic = {
  ...DragTopicStart,
  play: async () => {
    fireEvent.click(await screen.findByText("Topics"));
    fireEvent.change(await screen.findByPlaceholderText("Filter by topic or schema name…"), {
      target: { value: "fooba" },
    });
    fireEvent.click(
      await screen.findByText(
        (_content, element) =>
          element instanceof HTMLSpanElement && element.textContent === '."bar field"',
      ),
    );
    fireEvent.click(
      await screen.findByText(
        (_content, element) =>
          element instanceof HTMLSpanElement && element.textContent === '."baz field"',
      ),
      { metaKey: true },
    );
    const handle = await waitFor(async () => {
      const handles = await screen.findAllByTestId("TopicListDragHandle");
      if (handles.length < 3) {
        throw new Error("Expected 3 drag handles");
      }
      return handles[2]!;
    });
    fireEvent.dragStart(handle);
    const dest = await screen.findByText("Drop here!");
    fireEvent.dragOver(dest);
    fireEvent.drop(dest);
  },
};
