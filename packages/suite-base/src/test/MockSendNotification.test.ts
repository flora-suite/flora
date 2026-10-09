// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  mockSendNotification,
  mockSetNotificationHandler,
  setupMockSendNotification,
} from "./MockSendNotification";

describe("MockSendNotification", () => {
  beforeEach(() => {
    mockSendNotification.mockClear();
    mockSetNotificationHandler();
    setupMockSendNotification();
  });

  it("forwards notification arguments to the registered handler", () => {
    const handler = jest.fn();
    mockSetNotificationHandler(handler);

    mockSendNotification("message", { detail: "value" } as never, "user" as never, "warn" as never);

    expect(handler).toHaveBeenCalledWith("message", { detail: "value" }, "user", "warn");
    (
      mockSendNotification as unknown as { expectCalledDuringTest: () => void }
    ).expectCalledDuringTest();
  });

  it("asserts and resets notification calls after a test", () => {
    const assertCalled = (mockSendNotification as unknown as { expectCalledDuringTest: () => void })
      .expectCalledDuringTest;

    expect(assertCalled).toThrow("Expected sendNotification");
    mockSendNotification("message", {} as never, "user" as never, "warn" as never);
    expect(assertCalled).not.toThrow();
    expect(mockSendNotification).not.toHaveBeenCalled();
  });
});
