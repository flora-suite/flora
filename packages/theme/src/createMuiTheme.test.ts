// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as componentOverrides from "./components";
import { createMuiTheme } from "./createMuiTheme";

describe("createMuiTheme", () => {
  it.each(["light", "dark"] as const)("creates the %s theme with every component override", (name) => {
    const theme = createMuiTheme(name);

    expect(theme.name).toBe(name);
    expect(Object.keys(theme.components)).toEqual(expect.arrayContaining(Object.keys(componentOverrides)));
  });

  it("evaluates every component style override with a complete theme context", () => {
    const theme = createMuiTheme("light");
    const results: unknown[] = [];

    for (const override of Object.values(componentOverrides) as Array<Record<string, unknown>>) {
      const styleOverrides = override.styleOverrides as Record<string, unknown> | undefined;
      if (styleOverrides == undefined) {
        continue;
      }
      for (const style of Object.values(styleOverrides)) {
        if (typeof style === "function") {
          results.push(style({ theme, ownerState: {} }));
        }
      }
    }

    expect(results.length).toBeGreaterThan(0);
    expect(results.every((result) => typeof result === "object")).toBe(true);
  });
});
