// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import EventEmitter from "eventemitter3";

// If the datasets builder is garbage collected we also need to cleanup the worker
// This registry ensures the worker is cleaned up when the builder is garbage collected
const registry = new FinalizationRegistry<() => void>((dispose) => {
  dispose();
});

export class WorkerImageVideoDecoder extends EventEmitter {
  #worker: Worker;
  #closed = false;
  constructor() {
    super();
    const worker = new Worker(new URL("./WorkerImageVideoDecoder.worker", import.meta.url));
    this.#worker = worker;
    this.#worker.onerror = (err: ErrorEvent) => {
      this.emit("error", new Error(`Worker error: ${err.message}`));
    };

    this.#worker.onmessage = (event: MessageEvent) => {
      switch (event.data.type) {
        case "frame":
          this.emit("frame", event.data.frame);
          break;
        case "noFrame":
          this.emit("noFrame", event.data.emptyFrame);
          break;
        case "configured":
          this.emit("configured", event.data.config);
          break;
        case "delay":
          this.emit("delay", event.data.milliSecBehind);
          break;
        case "debug":
          this.emit("debug", event.data.message);
          break;
        case "warn":
          this.emit("warn", event.data.message);
          break;
        case "error":
          this.emit("error", event.data.error);
          break;
        case "nonBlockingError":
          this.emit("nonBlockingError", event.data.errorMessage);
          break;
      }
    };

    registry.register(this, () => {
      worker.postMessage({
        type: "close",
      });
      worker.terminate();
    });
  }

  #sendToWork(msg: any) {
    if (this.#closed) {throw Error("Can't send message over closed websocket connection");}
    this.#worker.postMessage(msg);
  }
  public setPlayheadTimeNanos(time: any) {
    this.#sendToWork({
      type: "setPlayheadTimeNanos",
      timestampNanos: time,
    });
  }
  public queueDecode(msg: any, info: any) {
    this.#sendToWork({
      type: "queueDecode",
      frameMsg: msg,
      frameInfo: info,
    });
  }
  public setResizeWidth(width: number) {
    this.#sendToWork({
      type: "setResizeWidth",
      width,
    });
  }
  public async resetForSeek() {
    this.#sendToWork({
      type: "resetForSeek",
    });
  }
  public async close() {
    this.#sendToWork({
      type: "close",
    });
    this.#worker.terminate();
    this.#closed = true;
  }
}
