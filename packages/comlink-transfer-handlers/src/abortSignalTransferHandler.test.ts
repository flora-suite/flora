// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { abortSignalTransferHandler } from "./";

describe("abortSignalTransferHandler", () => {
  it("recognizes AbortSignal instances", () => {
    expect(abortSignalTransferHandler.canHandle(new AbortController().signal)).toBe(true);
    expect(abortSignalTransferHandler.canHandle({ aborted: false })).toBe(false);
  });

  it("deserializes an already-aborted signal", () => {
    const port = {} as MessagePort;

    const signal = abortSignalTransferHandler.deserialize([true, port]);

    expect(signal.aborted).toBe(true);
    expect(port.onmessage).toBeUndefined();
  });

  it("aborts a deserialized signal when its message port receives a message", () => {
    const port = {} as MessagePort;
    const signal = abortSignalTransferHandler.deserialize([false, port]);

    expect(signal.aborted).toBe(false);
    port.onmessage!(new MessageEvent("message"));
    expect(signal.aborted).toBe(true);
  });

  it("serializes a signal and forwards its abort event over the transfer port", () => {
    const port1 = { postMessage: jest.fn() } as unknown as MessagePort;
    const port2 = {} as MessagePort;
    const messageChannel = jest
      .spyOn(globalThis, "MessageChannel")
      .mockImplementation(() => ({ port1, port2 }) as MessageChannel);
    const controller = new AbortController();

    const [serialized, transferables] = abortSignalTransferHandler.serialize(controller.signal);

    expect(serialized).toEqual([false, port2]);
    expect(transferables).toEqual([port2]);

    controller.abort();
    expect(port1.postMessage).toHaveBeenCalledWith("aborted");

    messageChannel.mockRestore();
  });

  it("preserves the aborted state when serializing a signal", () => {
    const port1 = { postMessage: jest.fn() } as unknown as MessagePort;
    const port2 = {} as MessagePort;
    const messageChannel = jest
      .spyOn(globalThis, "MessageChannel")
      .mockImplementation(() => ({ port1, port2 }) as MessageChannel);
    const controller = new AbortController();
    controller.abort();

    const [serialized] = abortSignalTransferHandler.serialize(controller.signal);

    expect(serialized).toEqual([true, port2]);
    expect(port1.postMessage).not.toHaveBeenCalled();

    messageChannel.mockRestore();
  });
});
