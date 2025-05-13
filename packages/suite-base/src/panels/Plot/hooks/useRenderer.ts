// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Theme } from "@mui/material";
import { useEffect, useState } from "react";

import { OffscreenCanvasRenderer } from "../OffscreenCanvasRenderer";

const useRenderer = (
  canvasDiv: HTMLDivElement | ReactNull,
  theme: Theme,
): OffscreenCanvasRenderer | undefined => {
  const [renderer, setRenderer] = useState<OffscreenCanvasRenderer | undefined>(undefined);

  useEffect(() => {
    if (!canvasDiv) {
      return;
    }

    const clientRect = canvasDiv.getBoundingClientRect();

    const canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.position = "absolute";
    canvas.width = clientRect.width;
    canvas.height = clientRect.height;

    canvasDiv.appendChild(canvas);

    const offscreenCanvas = canvas.transferControlToOffscreen();
    const newRenderer = new OffscreenCanvasRenderer(offscreenCanvas, theme);
    setRenderer(newRenderer);

    return () => {
      canvasDiv.removeChild(canvas);
      setRenderer(undefined);
    };
  }, [canvasDiv, theme]);

  return renderer;
};

export default useRenderer;
