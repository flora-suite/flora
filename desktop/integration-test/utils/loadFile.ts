// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import path from "path";

import { AppType } from "../launchApp";

export const loadFile = async (app: AppType, filePath: string): Promise<void> => {
  // Adjust file path
  const filePathAdjusted = path.resolve(__dirname, filePath);

  // Select the file input
  const fileInput = app.renderer.locator("[data-puppeteer-file-upload]");

  // Drag and drop the file
  await fileInput.setInputFiles(filePathAdjusted);
};
