// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

import VelodynePlayer from "@lichtblick/suite-base/players/VelodynePlayer";

import VelodyneDataSourceFactory from "./VelodyneDataSourceFactory";

jest.mock("@lichtblick/suite-base/players/VelodynePlayer", () => jest.fn());

describe("VelodyneDataSourceFactory", () => {
  it("exposes the Lidar connection metadata and requires a port", () => {
    const factory = new VelodyneDataSourceFactory();
    expect(factory).toMatchObject({
      id: "velodyne-device",
      type: "connection",
      displayName: "Velodyne Lidar",
      formConfig: { fields: [{ id: "port", defaultValue: "2369" }] },
    });
    expect(factory.initialize({} as never)).toBeUndefined();
  });

  it("creates a player with the numeric UDP port and metrics collector", () => {
    const factory = new VelodyneDataSourceFactory();
    const metricsCollector = {} as never;
    factory.initialize({ params: { port: "1234" }, metricsCollector } as never);
    expect(VelodynePlayer).toHaveBeenCalledWith({ port: 1234, metricsCollector });
  });
});
