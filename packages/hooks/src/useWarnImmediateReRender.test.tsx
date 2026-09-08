// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { renderHook } from "@testing-library/react";

import useWarnImmediateReRender from "./useWarnImmediateReRender";

describe("useWarnImmediateReRender", () => {
  it("is safe to call outside development mode", () => {
    expect(() => renderHook(() => useWarnImmediateReRender())).not.toThrow();
  });
});
