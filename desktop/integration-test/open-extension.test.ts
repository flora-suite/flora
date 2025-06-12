// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { launchApp } from "./launchApp";
import { loadFile } from "./utils/loadFile";

describe("open extension", () => {
  it("should import .foxe extension correctly", async () => {
    await using app = await launchApp();

    await app.renderer.getByTestId("DataSourceDialog").getByTestId("CloseIcon").click();

    await loadFile(
      app,
      "../../../packages/suite-base/src/test/fixtures/lichtblick.suite-extension-turtlesim-0.0.1.foxe",
    );

    // Add turtlesim extension
    await app.renderer.getByLabel("Add panel button").click();
    await app.renderer.getByText("Turtle [local]").click();

    await expect(app.renderer.getByText("Turtle", { exact: true }).count()).resolves.toBe(1);
  }, 15_000);
});
