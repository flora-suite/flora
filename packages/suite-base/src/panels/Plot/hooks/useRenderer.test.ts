/** @jest-environment jsdom */

// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { createTheme, Theme } from "@mui/material/styles";
import { renderHook } from "@testing-library/react";

import BasicBuilder from "@lichtblick/suite-base/testing/builders/BasicBuilder";

import useRenderer from "./useRenderer";
import { OffscreenCanvasRenderer } from "../OffscreenCanvasRenderer";

jest.mock("../OffscreenCanvasRenderer", () => {
  return {
    OffscreenCanvasRenderer: jest.fn().mockImplementation(function (this: any) {
      this.setSize = jest.fn();
      this.destroy = jest.fn();
    }),
  };
});

Object.defineProperty(HTMLCanvasElement.prototype, "transferControlToOffscreen", {
  value: jest.fn().mockImplementation(() => ({
    width: BasicBuilder.number(),
    height: BasicBuilder.number(),
  })),
});

describe("useRenderer hook", () => {
  let canvasDiv: HTMLDivElement;
  let theme: Theme;

  beforeEach(() => {
    canvasDiv = document.createElement("div");
    theme = createTheme();
  });

  it("should create a renderer and attach canvas to the canvasDiv", () => {
    const { result, unmount } = renderHook(() => useRenderer(canvasDiv, theme));

    expect(result.current).toBeInstanceOf(OffscreenCanvasRenderer);
    expect(canvasDiv.querySelector("canvas")).not.toBeNull();

    unmount();

    expect(canvasDiv.querySelector("canvas")).toBeNull();
  });

  it("should not create renderer if canvasDiv is undefined", () => {
    const { result } = renderHook(() => useRenderer(ReactNull, theme));

    expect(result.current).toBeUndefined();
  });

  it("should correctly reinitialize the renderer if canvasDiv changes", () => {
    const canvasDiv1 = document.createElement("div");
    const canvasDiv2 = document.createElement("div");

    const { result, rerender } = renderHook(({ div }) => useRenderer(div, theme), {
      initialProps: { div: canvasDiv1 },
    });

    const initialRenderer = result.current;

    rerender({ div: canvasDiv2 });

    expect(result.current).not.toBe(initialRenderer);
    expect(result.current).toBeInstanceOf(OffscreenCanvasRenderer);
    expect(canvasDiv1.querySelector("canvas")).toBeNull();
  });
});
