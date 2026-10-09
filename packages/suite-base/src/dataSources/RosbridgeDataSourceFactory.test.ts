// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

import RosbridgePlayer from "@lichtblick/suite-base/players/RosbridgePlayer";

import RosbridgeDataSourceFactory from "./RosbridgeDataSourceFactory";

jest.mock("@lichtblick/suite-base/players/RosbridgePlayer", () => jest.fn());

describe("RosbridgeDataSourceFactory", () => {
  it("validates WebSocket URLs and constructs a player only when configured", () => {
    const factory = new RosbridgeDataSourceFactory();
    const validate = factory.formConfig.fields[0]!.validate!;
    expect(validate("ws://localhost:9090")).toBeUndefined();
    expect(validate("wss://example.com")).toBeUndefined();
    expect(validate("http://example.com")?.message).toContain("Invalid protocol");
    expect(validate("not a URL")?.message).toBe("Enter a valid url");
    expect(factory.initialize({} as never)).toBeUndefined();

    const metricsCollector = {} as never;
    factory.initialize({ params: { url: "ws://robot:9090" }, metricsCollector } as never);
    expect(RosbridgePlayer).toHaveBeenCalledWith({
      url: "ws://robot:9090",
      metricsCollector,
      sourceId: "rosbridge-websocket",
    });
  });
});
