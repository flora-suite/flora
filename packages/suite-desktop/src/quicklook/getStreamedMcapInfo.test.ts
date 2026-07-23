// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import getStreamedMcapInfo, { processMcapRecord } from "./getStreamedMcapInfo";

describe("processMcapRecord", () => {
  it("collects streamed MCAP topic, schema, message, chunk, and attachment information", () => {
    const info = {
      totalMessages: 0n,
      numChunks: 0,
      numAttachments: 0,
      startTime: undefined,
      endTime: undefined,
      compressionTypes: new Set<string>(),
      topicInfosByTopic: new Map(),
      topicNamesByChannelId: new Map(),
      schemaNamesById: new Map(),
    };

    processMcapRecord(info as never, { type: "Chunk", compression: "zstd" } as never);
    processMcapRecord(info as never, { type: "Attachment" } as never);
    processMcapRecord(info as never, { type: "Schema", id: 1, name: "First" } as never);
    processMcapRecord(
      info as never,
      { type: "Channel", id: 10, topic: "/topic", schemaId: 1 } as never,
    );
    processMcapRecord(info as never, { type: "Message", channelId: 10, logTime: 20n } as never);
    processMcapRecord(info as never, { type: "Schema", id: 2, name: "Second" } as never);
    processMcapRecord(
      info as never,
      { type: "Channel", id: 11, topic: "/topic", schemaId: 2 } as never,
    );
    processMcapRecord(
      info as never,
      { type: "Channel", id: 12, topic: "/unknown", schemaId: 99 } as never,
    );
    processMcapRecord(
      info as never,
      { type: "Channel", id: 13, topic: "/unknown", schemaId: 99 } as never,
    );
    processMcapRecord(
      info as never,
      { type: "Channel", id: 11, topic: "/topic", schemaId: 2 } as never,
    );
    processMcapRecord(info as never, { type: "Message", channelId: 99, logTime: 30n } as never);
    processMcapRecord(info as never, { type: "Metadata" } as never);

    expect(info.numChunks).toBe(1);
    expect(info.numAttachments).toBe(1);
    expect(info.compressionTypes).toEqual(new Set(["zstd"]));
    expect(info.totalMessages).toBe(2n);
    expect(info.topicInfosByTopic.get("/topic")).toMatchObject({
      schemaName: "(multiple)",
      numMessages: 1n,
      numConnections: 2,
    });
    expect(info.topicInfosByTopic.get("/unknown")).toMatchObject({
      schemaName: "(unknown)",
      numConnections: 2,
    });
  });

  it("streams records from a reader and reports progress", async () => {
    const records = [
      { type: "Schema", id: 1, name: "Message" },
      { type: "Channel", id: 1, topic: "/z", schemaId: 1 },
      { type: "Channel", id: 2, topic: "/a", schemaId: 1 },
      { type: "Message", channelId: 1, logTime: 10n },
    ];
    const reader = {
      done: () => records.length === 0,
      bytesRemaining: () => 0,
      append: jest.fn(),
      nextRecord: () => records.shift(),
    };
    const progress = jest.fn();
    const file = {
      size: 9,
      slice: jest.fn().mockReturnValue({ arrayBuffer: async () => new ArrayBuffer(9) }),
    } as unknown as Blob;

    const result = await getStreamedMcapInfo(
      file,
      reader,
      processMcapRecord as never,
      "MCAP streamed",
      progress,
    );

    expect(reader.append).toHaveBeenCalledTimes(1);
    expect(file.slice).toHaveBeenCalledWith(0, 1024 * 1024);
    expect(progress).toHaveBeenLastCalledWith(1);
    expect(result).toMatchObject({ fileType: "MCAP streamed", totalMessages: 1n });
    expect(result.topics.map((topic) => topic.topic)).toEqual(["/a", "/z"]);
  });
});
