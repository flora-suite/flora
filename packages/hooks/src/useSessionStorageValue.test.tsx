// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { act, renderHook } from "@testing-library/react";

import { useSessionStorageValue } from "./useSessionStorageValue";

describe("useSessionStorageValue", () => {
  beforeEach(() => sessionStorage.clear());

  it("reads, updates, removes, and follows storage events for a key", () => {
    sessionStorage.setItem("key", "initial");
    const { result } = renderHook(() => useSessionStorageValue("key"));

    expect(result.current[0]).toBe("initial");
    act(() => result.current[1]("updated"));
    expect(sessionStorage.getItem("key")).toBe("updated");
    expect(result.current[0]).toBe("updated");

    act(() => result.current[1](undefined));
    expect(sessionStorage.getItem("key")).toBeNull();
    expect(result.current[0]).toBeUndefined();

    act(() => window.dispatchEvent(new StorageEvent("storage", { key: "key", newValue: "remote" })));
    expect(result.current[0]).toBe("remote");

    act(() => window.dispatchEvent(new StorageEvent("storage", { key: "other", newValue: "ignored" })));
    expect(result.current[0]).toBe("remote");
  });
});
