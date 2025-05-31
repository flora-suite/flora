// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import EventEmitter from "eventemitter3";

import { addEventListener, removeEventListener } from "./eventHandler";

describe("EventHandler", () => {
  let emitter: EventEmitter;

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  describe("addEventListener", () => {
    it("should add an event listener if it doesn't already exist", () => {
      const handler = jest.fn();
      const addListener = addEventListener(emitter);

      addListener("testEvent", handler);
      emitter.emit("testEvent");

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should not add the same event listener multiple times", () => {
      const handler = jest.fn();
      const addListener = addEventListener(emitter);

      addListener("testEvent", handler);
      addListener("testEvent", handler);
      emitter.emit("testEvent");

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should not add a listener if the function is undefined", () => {
      const addListener = addEventListener(emitter);

      addListener("testEvent");
      expect(emitter.listeners("testEvent")).toHaveLength(0);
    });
  });

  describe("removeEventListener", () => {
    it("should remove an existing event listener", () => {
      const handler = jest.fn();
      const addListener = addEventListener(emitter);
      const removeListener = removeEventListener(emitter);

      addListener("testEvent", handler);
      removeListener("testEvent", handler);
      emitter.emit("testEvent");

      expect(handler).not.toHaveBeenCalled();
    });

    it("should not throw if removing a listener that doesn't exist", () => {
      const handler = jest.fn();
      const removeListener = removeEventListener(emitter);

      expect(() => {
        removeListener("testEvent", handler);
      }).not.toThrow();
    });

    it("should not remove listeners if the function is undefined", () => {
      const handler = jest.fn();
      const addListener = addEventListener(emitter);
      const removeListener = removeEventListener(emitter);

      addListener("testEvent", handler);
      removeListener("testEvent");
      emitter.emit("testEvent");

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });
});
