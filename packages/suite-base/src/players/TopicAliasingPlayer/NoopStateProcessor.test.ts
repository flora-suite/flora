// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

import { NoopStateProcessor } from "./NoopStateProcessor";

describe("NoopStateProcessor", () => {
  it("preserves player state and subscriptions by reference", () => {
    const processor = new NoopStateProcessor();
    const state = { name: "player" } as never;
    const subscriptions = [{ topic: "/foo" }] as never;

    expect(processor.process(state, subscriptions)).toBe(state);
    expect(processor.aliasSubscriptions(subscriptions)).toBe(subscriptions);
  });
});
