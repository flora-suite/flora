// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import process from "./process";

describe("process", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("nextTick", () => {
    it("should execute function on next tick", async () => {
      const mockFn = jest.fn();

      process.nextTick(mockFn);

      // Function should not be called immediately
      expect(mockFn).not.toHaveBeenCalled();

      // Wait for microtask to execute
      await new Promise<void>((resolve) => queueMicrotask(resolve));

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it("should pass arguments to the function", async () => {
      const mockFn = jest.fn();
      const arg1 = "test";
      const arg2 = 42;
      const arg3 = { key: "value" };

      process.nextTick(mockFn, arg1, arg2, arg3);

      await new Promise<void>((resolve) => queueMicrotask(resolve));

      expect(mockFn).toHaveBeenCalledWith(arg1, arg2, arg3);
    });

    it("should handle function with no arguments", async () => {
      const mockFn = jest.fn();

      process.nextTick(mockFn);

      await new Promise<void>((resolve) => queueMicrotask(resolve));

      expect(mockFn).toHaveBeenCalledWith();
    });

    it("should handle multiple nextTick calls", async () => {
      const mockFn1 = jest.fn();
      const mockFn2 = jest.fn();
      const mockFn3 = jest.fn();

      process.nextTick(mockFn1);
      process.nextTick(mockFn2);
      process.nextTick(mockFn3);

      await new Promise<void>((resolve) => queueMicrotask(resolve));

      expect(mockFn1).toHaveBeenCalledTimes(1);
      expect(mockFn2).toHaveBeenCalledTimes(1);
      expect(mockFn3).toHaveBeenCalledTimes(1);
    });

    it("should execute functions in the order they were scheduled", async () => {
      const order: number[] = [];

      process.nextTick(() => order.push(1));
      process.nextTick(() => order.push(2));
      process.nextTick(() => order.push(3));

      await new Promise<void>((resolve) => queueMicrotask(resolve));

      expect(order).toEqual([1, 2, 3]);
    });

    it("should work with different types of functions", async () => {
      const arrowFn = jest.fn();
      const normalFn = jest.fn(function normalFunction() {});
      const methodFn = jest.fn();

      const obj = {
        method: methodFn,
      };

      process.nextTick(arrowFn);
      process.nextTick(normalFn);
      process.nextTick(obj.method);

      await new Promise<void>((resolve) => queueMicrotask(resolve));

      expect(arrowFn).toHaveBeenCalledTimes(1);
      expect(normalFn).toHaveBeenCalledTimes(1);
      expect(methodFn).toHaveBeenCalledTimes(1);
    });

    it("should handle complex arguments", async () => {
      const mockFn = jest.fn();
      const complexArg = {
        nested: {
          array: [1, 2, 3],
          func: () => "test",
        },
        date: new Date(),
      };

      process.nextTick(mockFn, complexArg);

      await new Promise<void>((resolve) => queueMicrotask(resolve));

      expect(mockFn).toHaveBeenCalledWith(complexArg);
    });
  });

  describe("properties", () => {
    it("should have correct title property", () => {
      expect(process.title).toBe("browser");
    });

    it("should have browser property set to true", () => {
      expect(process.browser).toBe(true);
    });

    it("should have empty env object", () => {
      expect(process.env).toEqual({});
      expect(typeof process.env).toBe("object");
    });

    it("should have empty argv array", () => {
      expect(process.argv).toEqual([]);
      expect(Array.isArray(process.argv)).toBe(true);
    });

    it("should have all expected properties", () => {
      expect(process).toHaveProperty("nextTick");
      expect(process).toHaveProperty("title");
      expect(process).toHaveProperty("browser");
      expect(process).toHaveProperty("env");
      expect(process).toHaveProperty("argv");
    });

    it("should have nextTick as a function", () => {
      expect(typeof process.nextTick).toBe("function");
    });
  });

  describe("queueMicrotask integration", () => {
    it("should use queueMicrotask internally", async () => {
      const originalQueueMicrotask = global.queueMicrotask;
      const mockQueueMicrotask = jest.fn(originalQueueMicrotask);
      global.queueMicrotask = mockQueueMicrotask;

      const mockFn = jest.fn();
      process.nextTick(mockFn);

      expect(mockQueueMicrotask).toHaveBeenCalledTimes(1);
      expect(typeof mockQueueMicrotask.mock.calls[0]![0]).toBe("function");

      await new Promise<void>((resolve) => queueMicrotask(resolve));
      expect(mockFn).toHaveBeenCalledTimes(1);

      global.queueMicrotask = originalQueueMicrotask;
    });
  });
});
