// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

import {
  IterablePlayer,
  WorkerIterableSource,
} from "@lichtblick/suite-base/players/IterablePlayer";

import UlogLocalDataSourceFactory from "./UlogLocalDataSourceFactory";

jest.mock("@lichtblick/suite-base/players/IterablePlayer", () => ({
  IterablePlayer: jest.fn(),
  WorkerIterableSource: jest.fn(),
}));

describe("UlogLocalDataSourceFactory", () => {
  it("requires a file and creates an iterable player for supported ULog input", () => {
    const factory = new UlogLocalDataSourceFactory();
    expect(factory.supportedFileTypes).toEqual([".ulg", ".ulog"]);
    expect(factory.initialize({} as never)).toBeUndefined();

    const file = new File(["log"], "flight.ulg");
    const metricsCollector = {} as never;
    factory.initialize({ file, metricsCollector } as never);
    expect(WorkerIterableSource).toHaveBeenCalledWith(
      expect.objectContaining({ initArgs: { file }, initWorker: expect.any(Function) }),
    );
    expect(IterablePlayer).toHaveBeenCalledWith({
      metricsCollector,
      source: (WorkerIterableSource as jest.Mock).mock.instances[0],
      name: "flight.ulg",
      sourceId: "ulog-local-file",
    });

    const initWorker = (WorkerIterableSource as jest.Mock).mock.calls[0]![0]
      .initWorker as () => unknown;
    const WorkerMock = jest.fn();
    (global as unknown as { Worker: typeof WorkerMock }).Worker = WorkerMock;
    initWorker();
    expect(WorkerMock).toHaveBeenCalledTimes(1);
  });
});
