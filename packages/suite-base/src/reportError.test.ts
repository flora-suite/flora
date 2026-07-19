// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

import { reportError, setReportErrorHandler } from "./reportError";

describe("reportError", () => {
  afterEach(() => {
    delete (global as { foxgloveStudioReportErrorFn?: unknown }).foxgloveStudioReportErrorFn;
  });

  it("does nothing until a handler is registered and then forwards the original error", () => {
    const error = new Error("failed");
    expect(() => reportError(error)).not.toThrow();

    const handler = jest.fn();
    setReportErrorHandler(handler);
    reportError(error);
    expect(handler).toHaveBeenCalledWith(error);
  });
});
