/** @jest-environment jsdom */
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Chart } from "chart.js";

jest.mock("chart.js", () => ({
  Chart: {
    register: jest.fn(),
  },
  Interaction: {
    modes: {},
  },
}));

describe("ChartJSManager", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should register required Chart.js components", async () => {
    await import("@lichtblick/suite-base/components/Chart/worker/ChartJSManager");

    const registerSpy = jest.spyOn(Chart, "register");
    expect(registerSpy).toHaveBeenCalled();
  });
});
