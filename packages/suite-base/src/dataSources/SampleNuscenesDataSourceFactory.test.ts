// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

import {
  IterablePlayer,
  WorkerIterableSource,
} from "@lichtblick/suite-base/players/IterablePlayer";

import SampleNuscenesDataSourceFactory from "./SampleNuscenesDataSourceFactory";

jest.mock("@lichtblick/suite-base/players/IterablePlayer", () => ({
  IterablePlayer: jest.fn(),
  WorkerIterableSource: jest.fn(),
}));

describe("SampleNuscenesDataSourceFactory", () => {
  it("creates the hidden sample source and corresponding player", () => {
    const factory = new SampleNuscenesDataSourceFactory();
    const metricsCollector = {} as never;
    expect(factory).toMatchObject({ id: "sample-nuscenes", type: "sample", hidden: true });
    factory.initialize({ metricsCollector } as never);
    expect(WorkerIterableSource).toHaveBeenCalledWith(
      expect.objectContaining({
        initArgs: expect.objectContaining({ url: expect.stringContaining("NuScenes") }),
      }),
    );
    expect(IterablePlayer).toHaveBeenCalledWith(
      expect.objectContaining({
        source: (WorkerIterableSource as jest.Mock).mock.instances[0],
        isSampleDataSource: true,
        metricsCollector,
        urlParams: {},
        sourceId: "sample-nuscenes",
      }),
    );
    const initWorker = (WorkerIterableSource as jest.Mock).mock.calls[0]![0]
      .initWorker as () => unknown;
    const WorkerMock = jest.fn();
    (global as unknown as { Worker: typeof WorkerMock }).Worker = WorkerMock;
    initWorker();
    expect(WorkerMock).toHaveBeenCalledTimes(1);
  });
});
