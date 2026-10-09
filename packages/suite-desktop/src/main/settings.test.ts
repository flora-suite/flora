// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import fs from "fs";
import os from "os";
import path from "path";

import {
  DATASTORES_DIR_NAME,
  SETTINGS_DATASTORE_NAME,
  SETTINGS_JSON_DATASTORE_KEY,
} from "../common/storage";
import { getAppSetting, setAppSetting } from "./settings";

describe("app settings", () => {
  let userDataDir: string;

  beforeEach(() => {
    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "flora-settings-test-"));
  });

  afterEach(() => {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  });

  it("writes and reads a setting from the override user-data directory", () => {
    setAppSetting("theme" as never, "dark", { overrideUserDataDir: userDataDir });

    expect(getAppSetting("theme" as never, { overrideUserDataDir: userDataDir })).toBe("dark");
  });

  it("returns undefined for missing and malformed settings files", () => {
    expect(getAppSetting("theme" as never, { overrideUserDataDir: userDataDir })).toBeUndefined();

    const settingsPath = path.join(
      userDataDir,
      DATASTORES_DIR_NAME,
      SETTINGS_DATASTORE_NAME,
      SETTINGS_JSON_DATASTORE_KEY,
    );
    fs.writeFileSync(settingsPath, "not json");
    expect(getAppSetting("theme" as never, { overrideUserDataDir: userDataDir })).toBeUndefined();
  });
});
