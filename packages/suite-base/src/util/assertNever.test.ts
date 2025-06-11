// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { assertNever } from "./assertNever";

describe("assertNever", () => {
  it("should throw an error with the provided message", () => {
    const testMessage = "This should never happen";

    expect(() => {
      // Using any to bypass TypeScript never type checking in tests
      assertNever("unexpected value" as never, testMessage);
    }).toThrow(testMessage);
  });

  it("should throw an Error instance", () => {
    const testMessage = "Another error message";

    expect(() => {
      assertNever("value" as never, testMessage);
    }).toThrow(Error);
  });

  it("should work with different message types", () => {
    const messages = [
      "Simple string message",
      "Message with numbers: 123",
      "Message with special chars: !@#$%^&*()",
      "", // Empty string
      "Multi\nline\nmessage",
    ];

    messages.forEach((message) => {
      expect(() => {
        assertNever("test" as never, message);
      }).toThrow(message);
    });
  });

  it("should be a proper never function (compile-time test)", () => {
    // This test is more about ensuring the function signature is correct
    // In a real switch statement with exhaustive cases, this should never be reached

    type Color = "red" | "green" | "blue";

    function handleColor(color: Color): string {
      switch (color) {
        case "red":
          return "Red color";
        case "green":
          return "Green color";
        case "blue":
          return "Blue color";
        default:
          // This should never be reached if all cases are handled
          return assertNever(color, `Unhandled color: ${String(color)}`);
      }
    }

    expect(handleColor("red")).toBe("Red color");
    expect(handleColor("green")).toBe("Green color");
    expect(handleColor("blue")).toBe("Blue color");

    // If we force an invalid color, it should throw
    expect(() => {
      handleColor("purple" as Color);
    }).toThrow("Unhandled color: purple");
  });
});
