// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

import { renderHook } from "@testing-library/react";

import { useSessionStorageValue } from "@lichtblick/hooks";
import { useMessagePipeline } from "@lichtblick/suite-base/components/MessagePipeline";
import isDesktopApp from "@lichtblick/suite-base/util/isDesktopApp";

import { useDefaultWebLaunchPreference } from "./useDefaultWebLaunchPreference";

jest.mock("@lichtblick/hooks", () => ({ useSessionStorageValue: jest.fn() }));
jest.mock("@lichtblick/suite-base/components/MessagePipeline", () => ({
  useMessagePipeline: jest.fn(),
}));
jest.mock("@lichtblick/suite-base/util/isDesktopApp", () => jest.fn());

describe("useDefaultWebLaunchPreference", () => {
  const setPreference = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (isDesktopApp as jest.Mock).mockReturnValue(false);
    (useSessionStorageValue as jest.Mock).mockReturnValue([undefined, setPreference]);
  });

  it("stores the web preference when a URL state is available", () => {
    (useMessagePipeline as jest.Mock).mockReturnValue(true);
    renderHook(() => useDefaultWebLaunchPreference());
    expect(setPreference).toHaveBeenCalledWith("web");
  });

  it("does not overwrite an existing preference, missing URL state, or desktop preference", () => {
    (useMessagePipeline as jest.Mock).mockReturnValue(false);
    renderHook(() => useDefaultWebLaunchPreference());
    expect(setPreference).not.toHaveBeenCalled();

    (useSessionStorageValue as jest.Mock).mockReturnValue(["desktop", setPreference]);
    (useMessagePipeline as jest.Mock).mockReturnValue(true);
    renderHook(() => useDefaultWebLaunchPreference());
    expect(setPreference).not.toHaveBeenCalled();

    (useSessionStorageValue as jest.Mock).mockReturnValue([undefined, setPreference]);
    (isDesktopApp as jest.Mock).mockReturnValue(true);
    renderHook(() => useDefaultWebLaunchPreference());
    expect(setPreference).not.toHaveBeenCalled();
  });
});
