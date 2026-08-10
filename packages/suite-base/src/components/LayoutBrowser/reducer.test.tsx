// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

import { act, renderHook } from "@testing-library/react";

import { useLayoutBrowserReducer } from "./reducer";

const props = { busy: false, error: undefined, online: true, lastSelectedId: undefined };

describe("useLayoutBrowserReducer", () => {
  it("selects ids with ordinary and modifier clicks", () => {
    const { result } = renderHook(() => useLayoutBrowserReducer(props));
    const dispatch = result.current[1];
    act(() => dispatch({ type: "select-id", id: "one" }));
    act(() => dispatch({ type: "select-id", id: "two", modKey: true }));
    expect(result.current[0].selectedIds).toEqual(["one", "two"]);
    act(() => dispatch({ type: "select-id", id: "one", modKey: true }));
    expect(result.current[0].selectedIds).toEqual(["two"]);
  });

  it("selects a range and updates state flags", () => {
    const { result } = renderHook(() =>
      useLayoutBrowserReducer({ ...props, lastSelectedId: "two" }),
    );
    const dispatch = result.current[1];
    const layouts = {
      personal: [{ id: "one" }, { id: "two" }, { id: "three" }],
      shared: [],
    } as never;
    act(() => dispatch({ type: "select-id", id: "three", shiftKey: true, layouts }));
    act(() => dispatch({ type: "set-busy", value: true }));
    act(() => dispatch({ type: "set-online", value: false }));
    act(() => dispatch({ type: "set-error", value: new Error("failed") }));
    expect(result.current[0]).toMatchObject({
      selectedIds: ["two", "three"],
      busy: true,
      online: false,
    });
    expect(result.current[0].error).toMatchObject({ message: "failed" });
  });

  it("queues, advances, and clears multi-actions", () => {
    const { result } = renderHook(() => useLayoutBrowserReducer(props));
    const dispatch = result.current[1];
    act(() => dispatch({ type: "select-id", id: "one" }));
    act(() => dispatch({ type: "select-id", id: "two", modKey: true }));
    act(() => dispatch({ type: "queue-multi-action", action: "delete" }));
    expect(result.current[0].multiAction).toEqual({ action: "delete", ids: ["one", "two"] });
    act(() => dispatch({ type: "shift-multi-action" }));
    expect(result.current[0].selectedIds).toEqual(["two"]);
    act(() => dispatch({ type: "shift-multi-action" }));
    expect(result.current[0].multiAction).toBeUndefined();
    act(() => dispatch({ type: "clear-multi-action" }));
    expect(result.current[0].multiAction).toBeUndefined();
  });
});
