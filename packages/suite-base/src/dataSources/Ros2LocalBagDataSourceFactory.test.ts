// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

import {
  IterablePlayer,
  WorkerIterableSource,
} from "@lichtblick/suite-base/players/IterablePlayer";

import Ros2LocalBagDataSourceFactory from "./Ros2LocalBagDataSourceFactory";

jest.mock("@lichtblick/suite-base/players/IterablePlayer", () => ({
  IterablePlayer: jest.fn(),
  WorkerIterableSource: jest.fn(),
}));

describe("Ros2LocalBagDataSourceFactory", () => {
  it("builds an iterable source from one or many ROS 2 bag files", () => {
    const factory = new Ros2LocalBagDataSourceFactory();
    expect(factory.initialize({} as never)).toBeUndefined();
    const first = new File(["a"], "first.db3");
    const second = new File(["b"], "second.db3");
    const metricsCollector = {} as never;
    factory.initialize({ files: [first, second], metricsCollector } as never);
    expect(WorkerIterableSource).toHaveBeenCalledWith(
      expect.objectContaining({ initArgs: { files: [first, second] } }),
    );
    expect(IterablePlayer).toHaveBeenCalledWith({
      metricsCollector,
      source: (WorkerIterableSource as jest.Mock).mock.instances[0],
      name: "first.db3, second.db3",
      sourceId: "ros2-local-bagfile",
    });
    const initWorker = (WorkerIterableSource as jest.Mock).mock.calls[0]![0]
      .initWorker as () => unknown;
    const WorkerMock = jest.fn();
    (global as unknown as { Worker: typeof WorkerMock }).Worker = WorkerMock;
    initWorker();
    expect(WorkerMock).toHaveBeenCalledTimes(1);

    const single = new File(["single"], "single.db3");
    factory.initialize({ file: single, metricsCollector } as never);
    expect(IterablePlayer).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: "single.db3", sourceId: "ros2-local-bagfile" }),
    );
  });
});
