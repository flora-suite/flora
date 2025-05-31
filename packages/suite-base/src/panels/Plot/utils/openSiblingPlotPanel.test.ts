// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import BasicBuilder from "@lichtblick/suite-base/testing/builders/BasicBuilder";
import PlotBuilder from "@lichtblick/suite-base/testing/builders/PlotBuilder";
import type { OpenSiblingPanel } from "@lichtblick/suite-base/types/panels";

import { openSiblingPlotPanel } from "./openSiblingPlotPanel";

describe("openSiblingPlotPanel", () => {
  let openSiblingPanel: jest.MockedFunction<OpenSiblingPanel>;

  beforeEach(() => {
    openSiblingPanel = jest.fn();
  });

  it("should call openSiblingPanel with correct parameters", () => {
    const topicName = BasicBuilder.string();
    const config = PlotBuilder.config();

    openSiblingPanel.mockImplementation(({ siblingConfigCreator }) => {
      siblingConfigCreator(config);
    });

    openSiblingPlotPanel(openSiblingPanel, topicName);

    expect(openSiblingPanel).toHaveBeenCalledWith(
      expect.objectContaining({
        panelType: "Plot",
        updateIfExists: true,
      }),
    );
  });

  it("should add a new topicName to the paths if not present", () => {
    const topicName = BasicBuilder.string();
    const config = PlotBuilder.config();

    openSiblingPanel.mockImplementation(({ siblingConfigCreator }) => {
      const updatedConfig = siblingConfigCreator(config);
      expect(updatedConfig.paths).toContainEqual({
        value: topicName,
        enabled: true,
        timestampMethod: "receiveTime",
      });
    });

    openSiblingPlotPanel(openSiblingPanel, topicName);
  });

  it("should not duplicate an existing topicName in the paths", () => {
    const topicName = BasicBuilder.string();
    const path = PlotBuilder.path({
      value: topicName,
      enabled: true,
      timestampMethod: "receiveTime",
    });
    const config = PlotBuilder.config({
      paths: [path, path, path],
    });

    openSiblingPanel.mockImplementation(({ siblingConfigCreator }) => {
      const updatedConfig = siblingConfigCreator(config);
      expect(updatedConfig.paths).toHaveLength(1);
      expect(updatedConfig.paths).toEqual([path]);
    });

    openSiblingPlotPanel(openSiblingPanel, topicName);
  });
});
