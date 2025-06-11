// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { maybeCast } from "./maybeCast";

describe("maybeCast", () => {
  it("should return the value as the specified type when value is defined", () => {
    const stringValue = "test string";
    const result = maybeCast<string>(stringValue);
    expect(result).toBe(stringValue);
  });

  it("should return undefined when input is undefined", () => {
    const result = maybeCast<string>(undefined);
    expect(result).toBeUndefined();
  });

  it("should return null when input is null", () => {
    const result = maybeCast<string>(null);
    expect(result).toBeNull();
  });

  it("should cast numbers correctly", () => {
    const numberValue = 42;
    const result = maybeCast<number>(numberValue);
    expect(result).toBe(numberValue);
    expect(typeof result).toBe("number");
  });

  it("should cast booleans correctly", () => {
    const boolValue = true;
    const result = maybeCast<boolean>(boolValue);
    expect(result).toBe(boolValue);
    expect(typeof result).toBe("boolean");
  });

  it("should cast objects correctly", () => {
    const objectValue = { key: "value", number: 123 };
    const result = maybeCast<{ key: string; number: number }>(objectValue);
    expect(result).toBe(objectValue);
    expect(result).toEqual({ key: "value", number: 123 });
  });

  it("should cast arrays correctly", () => {
    const arrayValue = [1, 2, 3, "test"];
    const result = maybeCast<Array<number | string>>(arrayValue);
    expect(result).toBe(arrayValue);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual([1, 2, 3, "test"]);
  });

  it("should handle complex nested objects", () => {
    const complexObject = {
      users: [
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
      ],
      metadata: {
        created: new Date(),
        version: "1.0.0",
      },
    };

    interface ComplexType {
      users: Array<{ id: number; name: string }>;
      metadata: { created: Date; version: string };
    }

    const result = maybeCast<ComplexType>(complexObject);
    expect(result).toBe(complexObject);
    expect(result?.users).toHaveLength(2);
    expect(result?.metadata.version).toBe("1.0.0");
  });

  it("should handle type casting with different input types", () => {
    // Number to string cast (unsafe but allowed by the function)
    const numberAsString = maybeCast<string>(123);
    expect(numberAsString).toBe(123); // Still a number, but TypeScript thinks it's a string

    // String to number cast (unsafe but allowed by the function)
    const stringAsNumber = maybeCast<number>("hello");
    expect(stringAsNumber).toBe("hello"); // Still a string, but TypeScript thinks it's a number
  });

  it("should preserve original reference", () => {
    const originalObject = { test: true };
    const result = maybeCast<{ test: boolean }>(originalObject);

    // Should be the exact same reference
    expect(result === originalObject).toBe(true);
  });

  it("should work with union types", () => {
    const stringValue = "test";
    const numberValue = 42;

    const stringResult = maybeCast<string | number>(stringValue);
    const numberResult = maybeCast<string | number>(numberValue);

    expect(stringResult).toBe(stringValue);
    expect(numberResult).toBe(numberValue);
  });

  it("should handle function types", () => {
    const func = () => "test function";
    const result = maybeCast<() => string>(func);

    expect(result).toBe(func);
    expect(typeof result).toBe("function");
    expect(result?.()).toBe("test function");
  });

  it("should handle edge cases", () => {
    // Zero
    expect(maybeCast<number>(0)).toBe(0);

    // Empty string
    expect(maybeCast<string>("")).toBe("");

    // Empty array
    const emptyArray: unknown = [];
    expect(maybeCast<unknown[]>(emptyArray)).toBe(emptyArray);

    // Empty object
    const emptyObject = {};
    expect(maybeCast<Record<string, unknown>>(emptyObject)).toBe(emptyObject);

    // NaN
    expect(maybeCast<number>(NaN)).toBeNaN();

    // Infinity
    expect(maybeCast<number>(Infinity)).toBe(Infinity);
  });
});
