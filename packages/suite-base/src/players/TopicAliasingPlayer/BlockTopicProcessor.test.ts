// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

import { BlockTopicProcessor } from "./BlockTopicProcessor";

describe("BlockTopicProcessor", () => {
  it("aliases every original-topic event for each alias", () => {
    const processor = new BlockTopicProcessor("/source", ["/alias-a", "/alias-b"]);
    const source = [{ topic: "/source", message: { value: 1 } }];

    expect(processor.aliasBlock({ messagesByTopic: { "/source": source } } as never, 0)).toEqual({
      "/alias-a": [{ topic: "/alias-a", message: { value: 1 } }],
      "/alias-b": [{ topic: "/alias-b", message: { value: 1 } }],
    });
  });

  it("returns stable aliases for unchanged input and replaces them after input changes", () => {
    const processor = new BlockTopicProcessor("/source", ["/alias"]);
    const source = [{ topic: "/source" }];
    const block = { messagesByTopic: { "/source": source } } as never;
    const first = processor.aliasBlock(block, 3);
    expect(processor.aliasBlock(block, 3)).toBe(first);

    const second = processor.aliasBlock(
      { messagesByTopic: { "/source": [{ topic: "/source", message: 2 }] } } as never,
      3,
    );
    expect(second).not.toBe(first);
    expect(second["/alias"]).toEqual([{ topic: "/alias", message: 2 }]);
  });

  it("clears cached aliases when a block has no original topic", () => {
    const processor = new BlockTopicProcessor("/source", ["/alias"]);
    processor.aliasBlock({ messagesByTopic: { "/source": [{ topic: "/source" }] } } as never, 1);
    expect(processor.aliasBlock({ messagesByTopic: {} } as never, 1)).toEqual({});
  });
});
