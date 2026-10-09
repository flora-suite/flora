// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { renderHook } from "@testing-library/react";
import { createContext, type ReactNode } from "react";

import useGuaranteedContext from "./useGuaranteedContext";

describe("useGuaranteedContext", () => {
  const Context = createContext<string | undefined>(undefined);

  it("returns the supplied context value", () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <Context.Provider value="value">{children}</Context.Provider>
    );

    expect(renderHook(() => useGuaranteedContext(Context), { wrapper }).result.current).toBe("value");
  });

  it("throws a named error when the provider is absent", () => {
    expect(() => renderHook(() => useGuaranteedContext(Context, "TestContext"))).toThrow(
      "useGuaranteedContext got null for contextType: 'TestContext'",
    );
  });

  it("throws a generic error when the provider is absent without a debug name", () => {
    expect(() => renderHook(() => useGuaranteedContext(Context))).toThrow(
      "useGuaranteedContext got null for contextType",
    );
  });
});
