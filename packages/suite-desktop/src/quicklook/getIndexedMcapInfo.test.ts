// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { McapIndexedReader } from "@mcap/core";

import getIndexedMcapInfo from "./getIndexedMcapInfo";

describe("getIndexedMcapInfo", () => {
  afterEach(() => jest.restoreAllMocks());

  it("aggregates indexed channels, schemas, counts, chunks, and attachments", async () => {
    jest.spyOn(McapIndexedReader, "Initialize").mockResolvedValue({
      channelsById: new Map([
        [1, { id: 1, topic: "/topic", schemaId: 1 }],
        [2, { id: 2, topic: "/topic", schemaId: 2 }],
      ]),
      schemasById: new Map([
        [1, { name: "First" }],
        [2, { name: "Second" }],
      ]),
      statistics: {
        messageCount: 3n,
        channelMessageCounts: new Map([
          [1, 1n],
          [2, 2n],
        ]),
      },
      chunkIndexes: [{ compression: "zstd", messageStartTime: 10n, messageEndTime: 20n }],
      attachmentIndexes: [{}],
    } as never);

    const result = await getIndexedMcapInfo(new Blob(["mcap"]), {} as never);

    expect(result).toMatchObject({
      fileType: "MCAP v0, indexed",
      numChunks: 1,
      numAttachments: 1,
      totalMessages: 3n,
      compressionTypes: new Set(["zstd"]),
    });
    expect(result.topics).toEqual([
      { topic: "/topic", schemaName: "(multiple)", numMessages: 3n, numConnections: 2 },
    ]);
  });

  it("rejects indexed summaries with channels referencing missing schemas", async () => {
    jest.spyOn(McapIndexedReader, "Initialize").mockResolvedValue({
      channelsById: new Map([[1, { id: 1, topic: "/topic", schemaId: 1 }]]),
      schemasById: new Map(),
      statistics: { messageCount: 1n, channelMessageCounts: new Map() },
      chunkIndexes: [],
      attachmentIndexes: [],
    } as never);

    await expect(getIndexedMcapInfo(new Blob(), {} as never)).rejects.toThrow(
      "MCAP summary does not contain channels or schemas",
    );
  });
});
