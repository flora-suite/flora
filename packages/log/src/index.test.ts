// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import DefaultLogger, { Logger, type LogLevel, toLogLevel } from "./index";

describe("Logger", () => {
  const prefix = "log-test";

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([
    ["debug", "debug"],
    ["info", "info"],
    ["warn", "warn"],
    ["error", "error"],
    ["unexpected", "warn"],
  ])("normalizes %s to %s", (input, expected) => {
    expect(toLogLevel(input)).toBe(expected);
  });

  it("returns cached child loggers and normalizes webpack paths", () => {
    const parent = DefaultLogger.getLogger(`${prefix}.parent`);
    const child = parent.getLogger("/tmp/app.asar/renderer");

    expect(child.name()).toBe(`${prefix}.parent.renderer`);
    expect(parent.getLogger("/tmp/app.asar/renderer")).toBe(child);
    expect(parent.getLogger("../../worker").name()).toBe(`${prefix}.parent.worker`);
    expect(DefaultLogger.channels()).toEqual(expect.arrayContaining([DefaultLogger, parent, child]));
  });

  it("does not enable an unrecognized log level", () => {
    expect(DefaultLogger.isLevelOn("trace" as LogLevel)).toBe(false);
  });

  it("provides no-op prototype methods before a log level binds console methods", () => {
    expect(() => {
      Logger.prototype.debug("debug");
      Logger.prototype.info("info");
      Logger.prototype.warn("warn");
      Logger.prototype.error("error");
    }).not.toThrow();
  });

  it.each([
    ["debug", ["debug", "info", "warn", "error"]],
    ["info", ["info", "warn", "error"]],
    ["warn", ["warn", "error"]],
    ["error", ["error"]],
  ] as const)("enables only %s and higher severity logs", (level, enabled) => {
    const logger = DefaultLogger.getLogger(`${prefix}.${level}`);
    const debug = jest.spyOn(console, "debug").mockImplementation(() => {});
    const info = jest.spyOn(console, "info").mockImplementation(() => {});
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const error = jest.spyOn(console, "error").mockImplementation(() => {});

    logger.setLevel(level);
    logger.debug("debug");
    logger.info("info");
    logger.warn("warn");
    logger.error("error");

    expect(logger.getLevel()).toBe(level);
    for (const candidate of ["debug", "info", "warn", "error"] as const) {
      expect(logger.isLevelOn(candidate)).toBe(enabled.includes(candidate));
    }
    expect(debug).toHaveBeenCalledTimes(enabled.includes("debug") ? 1 : 0);
    expect(info).toHaveBeenCalledTimes(enabled.includes("info") ? 1 : 0);
    expect(warn).toHaveBeenCalledTimes(enabled.includes("warn") ? 1 : 0);
    expect(error).toHaveBeenCalledTimes(enabled.includes("error") ? 1 : 0);
  });
});
