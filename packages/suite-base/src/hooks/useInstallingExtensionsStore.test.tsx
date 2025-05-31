// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { act } from "@testing-library/react";

import BasicBuilder from "@lichtblick/suite-base/testing/builders/BasicBuilder";

import { useInstallingExtensionsStore } from "./useInstallingExtensionsStore";

describe("useInstallingExtensionsStore", () => {
  afterEach(() => {
    useInstallingExtensionsStore.getState().resetInstallingProgress();
  });

  it("starts installation progress", () => {
    const extensionsNumber = BasicBuilder.number({ min: 0, max: 150 });

    act(() => {
      useInstallingExtensionsStore.getState().startInstallingProgress(extensionsNumber);
    });

    const state = useInstallingExtensionsStore.getState();
    expect(state.installingProgress).toEqual({
      installed: 0,
      total: extensionsNumber,
      inProgress: true,
    });
  });

  it("sets installing progress correctly", () => {
    const extensionsInstalled = BasicBuilder.number({ min: 0, max: 150 });

    act(() => {
      useInstallingExtensionsStore.getState().setInstallingProgress((prev) => ({
        ...prev,
        installed: prev.installed + extensionsInstalled,
      }));
    });

    expect(useInstallingExtensionsStore.getState().installingProgress.installed).toBe(
      extensionsInstalled,
    );
  });

  it("resets installation progress", () => {
    act(() => {
      useInstallingExtensionsStore.getState().resetInstallingProgress();
    });

    expect(useInstallingExtensionsStore.getState().installingProgress).toEqual({
      installed: 0,
      total: 0,
      inProgress: false,
    });
  });
});
