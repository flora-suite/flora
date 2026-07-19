// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import Log from "@lichtblick/log";

import { createStudioLogsSettingsStore } from "./store";

describe("createStudioLogsSettingsStore", () => {
  it("initializes, enables, and disables configured log channels", () => {
    const prefix = `test-store-${Date.now()}`;
    const first = Log.getLogger(`${prefix}/first`);
    const second = Log.getLogger(`${prefix}/second`);
    const store = createStudioLogsSettingsStore({
      globalLevel: "debug",
      disabledChannels: [first.name()],
    });

    expect(store.getState().globalLevel).toBe("debug");
    expect(store.getState().channels).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: first.name(), enabled: false }),
        expect.objectContaining({ name: second.name(), enabled: true }),
      ]),
    );

    store.getState().enableChannel(first.name());
    expect(store.getState().channels).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: first.name(), enabled: true })]),
    );
    store.getState().disableChannel(second.name());
    expect(store.getState().channels).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: second.name(), enabled: false })]),
    );
  });

  it("updates global and prefix log levels", () => {
    const prefix = `test-prefix-${Date.now()}`;
    const first = Log.getLogger(`${prefix}/first`);
    const second = Log.getLogger(`${prefix}/second`);
    const store = createStudioLogsSettingsStore();

    store.getState().setGlobalLevel("error");
    expect(store.getState().globalLevel).toBe("error");
    store.getState().enablePrefix(prefix);
    expect(store.getState().channels).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: first.name(), enabled: true }),
        expect.objectContaining({ name: second.name(), enabled: true }),
      ]),
    );
    store.getState().setGlobalLevel("debug");
    store.getState().disablePrefix(prefix);
    expect(store.getState().channels).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: first.name(), enabled: false }),
        expect.objectContaining({ name: second.name(), enabled: false }),
      ]),
    );
  });
});
