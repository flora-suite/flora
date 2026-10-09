// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

import { AppEvent } from "@lichtblick/suite-base/services/IAnalytics";

import AnalyticsMetricsCollector from "./AnalyticsMetricsCollector";
import NoopMetricsCollector from "./NoopMetricsCollector";

describe("player metrics collectors", () => {
  it("merges persistent metadata with individual event data", () => {
    const analytics = { logEvent: jest.fn().mockResolvedValue(undefined) };
    const collector = new AnalyticsMetricsCollector(analytics as never);
    collector.setProperty("source", "bag");
    collector.setProperty("count", 1);
    collector.logEvent(AppEvent.PLAYER_CONSTRUCTED, { count: 2, ready: true });
    collector.playerConstructed();

    expect(analytics.logEvent).toHaveBeenNthCalledWith(1, AppEvent.PLAYER_CONSTRUCTED, {
      source: "bag",
      count: 2,
      ready: true,
    });
    expect(analytics.logEvent).toHaveBeenNthCalledWith(2, AppEvent.PLAYER_CONSTRUCTED, {
      source: "bag",
      count: 1,
    });
  });

  it("provides no-op metrics methods when analytics is unavailable", () => {
    const collector = new NoopMetricsCollector();
    expect(() => {
      collector.setProperty("anything", true);
      collector.playerConstructed();
    }).not.toThrow();
  });
});
