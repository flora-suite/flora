// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

import toggleSelectedPanel from "./toggleSelectedPanel";

describe("toggleSelectedPanel", () => {
  it("toggles an ordinary selected panel", () => {
    expect(toggleSelectedPanel("Plot!one", undefined, {}, [])).toEqual(["Plot!one"]);
    expect(toggleSelectedPanel("Plot!one", undefined, {}, ["Plot!one"])).toEqual([]);
  });

  it("deselects all children of a selected tab panel", () => {
    const configs = {
      "Tab!parent": {
        activeTabIdx: 0,
        tabs: [
          { title: "Tab", layout: { direction: "row", first: "Plot!one", second: "Plot!two" } },
        ],
      },
    } as never;

    expect(toggleSelectedPanel("Tab!parent", undefined, configs, ["Plot!one", "Plot!two"])).toEqual(
      ["Tab!parent"],
    );
  });

  it("deselects all ancestor tab panels when selecting a child", () => {
    const configs = {
      "Tab!outer": { activeTabIdx: 0, tabs: [{ title: "Outer", layout: "Tab!inner" }] },
      "Tab!inner": { activeTabIdx: 0, tabs: [{ title: "Inner", layout: "Plot!one" }] },
    } as never;

    expect(
      toggleSelectedPanel("Plot!one", "Tab!inner", configs, ["Tab!outer", "Tab!inner"]),
    ).toEqual(["Plot!one"]);
  });
});
