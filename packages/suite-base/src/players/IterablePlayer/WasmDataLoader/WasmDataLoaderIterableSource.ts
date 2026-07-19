// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

import { fromNanoSec, toNanoSec } from "@lichtblick/rostime";
import { Immutable, MessageEvent } from "@lichtblick/suite";
import { ParsedChannel, parseChannel } from "@lichtblick/mcap-support";
import { Topic, TopicStats } from "@lichtblick/suite-base/players/types";
import { RosDatatypes } from "@lichtblick/suite-base/types/RosDatatypes";

import {
  GetBackfillMessagesArgs,
  IIterableSource,
  Initialization,
  IteratorResult,
  MessageIteratorArgs,
} from "../IIterableSource";

type LoaderChannel = {
  id: number;
  schemaId?: number;
  topicName: string;
  messageEncoding: string;
  messageCount?: bigint;
};

type LoaderSchema = { id: number; name: string; encoding: string; data: Uint8Array };

type LoaderMessage = {
  channelId: number;
  logTime: bigint;
  publishTime: bigint;
  data: Uint8Array;
};

type LoaderInstance = {
  exports: Record<string, unknown> & { memory: WebAssembly.Memory };
  paths: string[];
  readers: Map<number, { bytes: Uint8Array; position: number }>;
};

const READER_MODULE = "foxglove:loader/reader@0.1.0";
const EXPORT_MODULE = "[export]foxglove:loader/loader@0.1.0";
const LOADER_EXPORT = "foxglove:loader/loader@0.1.0";
const textDecoder = new TextDecoder();
const textEncoder = new TextEncoder();

function decodeDataUrl(url: string): Uint8Array {
  const match = /^data:application\/wasm;base64,([a-zA-Z0-9+/=]+)$/.exec(url);
  if (!match) {
    throw new Error("Data loader does not contain an inline WebAssembly module");
  }
  const binary = atob(match[1]!);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function memory(instance: LoaderInstance): Uint8Array {
  return new Uint8Array(instance.exports.memory.buffer);
}

function exportedFunction(instance: LoaderInstance, name: string): (...args: unknown[]) => number {
  const value = instance.exports[name];
  if (typeof value !== "function") {
    throw new Error(`Data loader is missing required export: ${name}`);
  }
  return value as (...args: unknown[]) => number;
}

function view(instance: LoaderInstance): DataView {
  return new DataView(instance.exports.memory.buffer);
}

function readString(instance: LoaderInstance, pointer: number, length: number): string {
  return textDecoder.decode(memory(instance).subarray(pointer, pointer + length));
}

function allocate(instance: LoaderInstance, size: number, alignment = 1): number {
  return exportedFunction(instance, "cabi_realloc")(0, 0, alignment, size);
}

function readU64(data: DataView, offset: number): bigint {
  return data.getBigUint64(offset, true);
}

function loaderError(instance: LoaderInstance, pointer: number): string {
  const data = view(instance);
  return readString(
    instance,
    data.getUint32(pointer + 8, true),
    data.getUint32(pointer + 12, true),
  );
}

function decodeChannels(
  instance: LoaderInstance,
  pointer: number,
  length: number,
): LoaderChannel[] {
  const data = view(instance);
  const channels: LoaderChannel[] = [];
  // WIT canonical ABI layout of loader.channel is 40 bytes.
  for (let index = 0; index < length; index++) {
    const offset = pointer + index * 40;
    const schemaTag = data.getUint8(offset + 2);
    const countTag = data.getUint32(offset + 24, true);
    channels.push({
      id: data.getUint16(offset, true),
      schemaId: schemaTag === 1 ? data.getUint16(offset + 4, true) : undefined,
      topicName: readString(
        instance,
        data.getUint32(offset + 8, true),
        data.getUint32(offset + 12, true),
      ),
      messageEncoding: readString(
        instance,
        data.getUint32(offset + 16, true),
        data.getUint32(offset + 20, true),
      ),
      messageCount: countTag === 1 ? readU64(data, offset + 32) : undefined,
    });
  }
  return channels;
}

function decodeSchemas(instance: LoaderInstance, pointer: number, length: number): LoaderSchema[] {
  const data = view(instance);
  const schemas: LoaderSchema[] = [];
  // WIT canonical ABI layout of loader.schema is 28 bytes.
  for (let index = 0; index < length; index++) {
    const offset = pointer + index * 28;
    const bytes = memory(instance).slice(
      data.getUint32(offset + 20, true),
      data.getUint32(offset + 20, true) + data.getUint32(offset + 24, true),
    );
    schemas.push({
      id: data.getUint16(offset, true),
      name: readString(
        instance,
        data.getUint32(offset + 4, true),
        data.getUint32(offset + 8, true),
      ),
      encoding: readString(
        instance,
        data.getUint32(offset + 12, true),
        data.getUint32(offset + 16, true),
      ),
      data: bytes,
    });
  }
  return schemas;
}

function decodeMessage(instance: LoaderInstance, pointer: number): LoaderMessage {
  const data = view(instance);
  return {
    channelId: data.getUint16(pointer, true),
    logTime: readU64(data, pointer + 8),
    publishTime: readU64(data, pointer + 16),
    data: memory(instance).slice(
      data.getUint32(pointer + 24, true),
      data.getUint32(pointer + 24, true) + data.getUint32(pointer + 28, true),
    ),
  };
}

/**
 * Browser host for the `foxglove:loader@0.1.0` canonical ABI used by extension data loaders.
 * Files are materialized before instantiation so its synchronous reader imports remain safe in a
 * browser and cannot access anything other than the files chosen by the user.
 */
export class WasmDataLoaderIterableSource implements IIterableSource {
  readonly #wasmUrl: string;
  readonly #files: readonly File[];
  #instance: LoaderInstance | undefined;
  #loader: number | undefined;
  #channels = new Map<number, LoaderChannel>();
  #schemas = new Map<number, LoaderSchema>();
  #parsedChannels = new Map<number, ParsedChannel>();

  public constructor(args: { wasmUrl: string; files: readonly File[] }) {
    this.#wasmUrl = args.wasmUrl;
    this.#files = args.files;
  }

  public async initialize(): Promise<Initialization> {
    const fileBytes = await Promise.all(
      this.#files.map(async (file) => new Uint8Array(await file.arrayBuffer())),
    );
    const readers = new Map<number, { bytes: Uint8Array; position: number }>();
    const paths = this.#files.map((_file, index) => `flora-file-${index}`);
    let nextReader = 1;
    let instance: LoaderInstance | undefined;
    const getInstance = (): LoaderInstance => {
      if (!instance) {
        throw new Error("WebAssembly data loader was called before initialization");
      }
      return instance;
    };
    const imports: WebAssembly.Imports = {
      [READER_MODULE]: {
        "[resource-drop]reader": (handle: number) => readers.delete(handle),
        "[method]reader.read": (handle: number, pointer: number, length: number) => {
          const reader = readers.get(handle);
          if (!reader) {
            throw new Error("Data loader requested an unknown file reader");
          }
          const chunk = reader.bytes.subarray(reader.position, reader.position + length);
          memory(getInstance()).set(chunk, pointer);
          reader.position += chunk.length;
          return BigInt(chunk.length);
        },
        "[method]reader.seek": (handle: number, position: bigint) => {
          const reader = readers.get(handle);
          if (!reader || position > BigInt(reader.bytes.length)) {
            throw new Error("Data loader attempted an invalid file seek");
          }
          reader.position = Number(position);
          return position;
        },
        "[method]reader.position": (handle: number) => BigInt(readers.get(handle)?.position ?? 0),
        "[method]reader.size": (handle: number) => BigInt(readers.get(handle)?.bytes.length ?? 0),
        open: (pointer: number, length: number) => {
          const path = readString(getInstance(), pointer, length);
          const index = paths.indexOf(path);
          if (index < 0) {
            throw new Error("Data loader requested a file that was not selected");
          }
          const handle = nextReader++;
          readers.set(handle, { bytes: fileBytes[index]!, position: 0 });
          return handle;
        },
      },
      [EXPORT_MODULE]: {
        "[resource-new]data-loader": (representation: number) => representation,
        "[resource-drop]data-loader": (_representation: number) => {},
        "[resource-new]message-iterator": (representation: number) => representation,
        "[resource-drop]message-iterator": (_representation: number) => {},
      },
      "foxglove:loader/console@0.1.0": {
        log: (pointer: number, length: number) =>
          console.info(readString(getInstance(), pointer, length)),
        warn: (pointer: number, length: number) =>
          console.warn(readString(getInstance(), pointer, length)),
        error: (pointer: number, length: number) =>
          console.error(readString(getInstance(), pointer, length)),
      },
    };
    const wasm = decodeDataUrl(this.#wasmUrl);
    const module = await WebAssembly.compile(wasm);
    const wasmInstance = await WebAssembly.instantiate(module, imports);
    instance = { exports: wasmInstance.exports as LoaderInstance["exports"], paths, readers };
    this.#instance = instance;

    const pointer = allocate(instance, paths.length * 8, 4);
    const data = view(instance);
    for (const [index, path] of paths.entries()) {
      const encoded = textEncoder.encode(path);
      const stringPointer = allocate(instance, encoded.length, 1);
      memory(instance).set(encoded, stringPointer);
      data.setUint32(pointer + index * 8, stringPointer, true);
      data.setUint32(pointer + index * 8 + 4, encoded.length, true);
    }
    this.#loader = exportedFunction(instance, `${LOADER_EXPORT}#[constructor]data-loader`)(
      pointer,
      paths.length,
    );
    const resultPointer = exportedFunction(
      instance,
      `${LOADER_EXPORT}#[method]data-loader.initialize`,
    )(this.#loader);
    if (view(instance).getUint32(resultPointer, true) !== 0) {
      throw new Error(loaderError(instance, resultPointer));
    }
    const init = view(instance);
    const channels = decodeChannels(
      instance,
      init.getUint32(resultPointer + 8, true),
      init.getUint32(resultPointer + 12, true),
    );
    const schemas = decodeSchemas(
      instance,
      init.getUint32(resultPointer + 16, true),
      init.getUint32(resultPointer + 20, true),
    );
    const start = fromNanoSec(readU64(init, resultPointer + 24));
    const end = fromNanoSec(readU64(init, resultPointer + 32));
    channels.forEach((channel) => this.#channels.set(channel.id, channel));
    schemas.forEach((schema) => this.#schemas.set(schema.id, schema));
    const datatypes: RosDatatypes = new Map();
    for (const channel of channels) {
      const schema =
        channel.schemaId == undefined ? undefined : this.#schemas.get(channel.schemaId);
      const parsedChannel = parseChannel(
        {
          messageEncoding: channel.messageEncoding,
          schema:
            schema == undefined
              ? undefined
              : { name: schema.name, encoding: schema.encoding, data: schema.data },
        },
        { allowEmptySchema: true },
      );
      this.#parsedChannels.set(channel.id, parsedChannel);
      for (const [name, datatype] of parsedChannel.datatypes) {
        datatypes.set(name, datatype);
      }
    }
    exportedFunction(
      instance,
      `cabi_post_${LOADER_EXPORT}#[method]data-loader.initialize`,
    )(resultPointer);

    const topics: Topic[] = channels.map((channel) => ({
      name: channel.topicName,
      schemaName:
        channel.schemaId == undefined
          ? ""
          : (schemas.find((schema) => schema.id === channel.schemaId)?.name ?? ""),
    }));
    const topicStats = new Map<string, TopicStats>(
      channels.map((channel) => [
        channel.topicName,
        { numMessages: Number(channel.messageCount ?? 0n) },
      ]),
    );
    return {
      start,
      end,
      topics,
      topicStats,
      datatypes,
      profile: undefined,
      publishersByTopic: new Map(),
      problems: [],
    };
  }

  public async *messageIterator(
    args: Immutable<MessageIteratorArgs>,
  ): AsyncIterableIterator<Readonly<IteratorResult>> {
    const instance = this.#requireInstance();
    const loader = this.#requireLoader();
    const channelIds = Array.from(args.topics.keys())
      .map(
        (topic) =>
          Array.from(this.#channels.values()).find((channel) => channel.topicName === topic)?.id,
      )
      .filter((id): id is number => id != undefined);
    const pointer = allocate(instance, channelIds.length * 2, 2);
    const data = view(instance);
    channelIds.forEach((id, index) => data.setUint16(pointer + index * 2, id, true));
    const iteratorResult = exportedFunction(
      instance,
      `${LOADER_EXPORT}#[method]data-loader.create-iterator`,
    )(
      loader,
      args.start == undefined ? 0 : 1,
      args.start == undefined ? 0n : toNanoSec(args.start),
      args.end == undefined ? 0 : 1,
      args.end == undefined ? 0n : toNanoSec(args.end),
      pointer,
      channelIds.length,
    );
    if (view(instance).getUint32(iteratorResult, true) !== 0) {
      throw new Error(loaderError(instance, iteratorResult));
    }
    const iterator = view(instance).getUint32(iteratorResult + 4, true);
    exportedFunction(
      instance,
      `cabi_post_${LOADER_EXPORT}#[method]data-loader.create-iterator`,
    )(iteratorResult);
    while (true) {
      const nextResult = exportedFunction(
        instance,
        `${LOADER_EXPORT}#[method]message-iterator.next`,
      )(iterator);
      const tag = view(instance).getUint32(nextResult, true);
      if (tag === 0) {
        exportedFunction(
          instance,
          `cabi_post_${LOADER_EXPORT}#[method]message-iterator.next`,
        )(nextResult);
        return;
      }
      if (tag !== 1) {
        const message = loaderError(instance, nextResult);
        exportedFunction(
          instance,
          `cabi_post_${LOADER_EXPORT}#[method]message-iterator.next`,
        )(nextResult);
        throw new Error(message);
      }
      const message = decodeMessage(instance, nextResult + 16);
      exportedFunction(
        instance,
        `cabi_post_${LOADER_EXPORT}#[method]message-iterator.next`,
      )(nextResult);
      yield { type: "message-event", msgEvent: this.#toMessageEvent(message) };
    }
  }

  public async getBackfillMessages(
    args: Immutable<GetBackfillMessagesArgs>,
  ): Promise<MessageEvent[]> {
    const instance = this.#requireInstance();
    const loader = this.#requireLoader();
    const channelIds = Array.from(args.topics.keys())
      .map(
        (topic) =>
          Array.from(this.#channels.values()).find((channel) => channel.topicName === topic)?.id,
      )
      .filter((id): id is number => id != undefined);
    const pointer = allocate(instance, channelIds.length * 2, 2);
    const data = view(instance);
    channelIds.forEach((id, index) => data.setUint16(pointer + index * 2, id, true));
    const resultPointer = exportedFunction(
      instance,
      `${LOADER_EXPORT}#[method]data-loader.get-backfill`,
    )(loader, toNanoSec(args.time), pointer, channelIds.length);
    if (view(instance).getUint32(resultPointer, true) !== 0) {
      throw new Error(loaderError(instance, resultPointer));
    }
    const messagesPointer = view(instance).getUint32(resultPointer + 8, true);
    const messagesLength = view(instance).getUint32(resultPointer + 12, true);
    const messages = Array.from({ length: messagesLength }, (_unused, index) =>
      this.#toMessageEvent(decodeMessage(instance, messagesPointer + index * 32)),
    );
    exportedFunction(
      instance,
      `cabi_post_${LOADER_EXPORT}#[method]data-loader.get-backfill`,
    )(resultPointer);
    return messages;
  }

  #toMessageEvent(message: LoaderMessage): MessageEvent {
    const channel = this.#channels.get(message.channelId);
    if (!channel) {
      throw new Error(`Data loader emitted unknown channel ${message.channelId}`);
    }
    const schema = channel.schemaId == undefined ? undefined : this.#schemas.get(channel.schemaId);
    const parsedChannel = this.#parsedChannels.get(message.channelId);
    if (!parsedChannel) {
      throw new Error(
        `Data loader emitted a channel that was not initialized: ${message.channelId}`,
      );
    }
    return {
      topic: channel.topicName,
      schemaName: schema?.name ?? "",
      receiveTime: fromNanoSec(message.logTime),
      publishTime: fromNanoSec(message.publishTime),
      message: parsedChannel.deserialize(message.data),
      sizeInBytes: message.data.byteLength,
    };
  }

  #requireInstance(): LoaderInstance {
    if (!this.#instance) {
      throw new Error("Data loader must be initialized before reading messages");
    }
    return this.#instance;
  }

  #requireLoader(): number {
    if (this.#loader == undefined) {
      throw new Error("Data loader must be initialized before reading messages");
    }
    return this.#loader;
  }
}
