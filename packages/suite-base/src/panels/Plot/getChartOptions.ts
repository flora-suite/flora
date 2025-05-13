// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ChartOptions } from "chart.js";

import { ChartOptionsPlot } from "@lichtblick/suite-base/panels/Plot/types";
import { fontMonospace } from "@lichtblick/theme";

export const getChartOptions = ({
  devicePixelRatio,
  gridColor,
  tickColor,
}: ChartOptionsPlot): ChartOptions<"scatter"> => ({
  maintainAspectRatio: false,
  animation: false,
  elements: { line: { tension: 0 } },
  interaction: {
    intersect: false,
    mode: "x",
  },
  devicePixelRatio,
  font: {
    family: fontMonospace,
    size: 10,
  },
  responsive: false,
  scales: {
    x: {
      type: "linear",
      display: true,
      grid: {
        color: gridColor,
      },
      ticks: {
        font: {
          family: fontMonospace,
          size: 10,
        },
        color: tickColor,
        maxRotation: 0,
      },
    },
    y: {
      type: "linear",
      display: true,
      grid: {
        color: gridColor,
      },
      ticks: {
        font: {
          family: fontMonospace,
          size: 10,
        },
        color: tickColor,
        padding: 0,
        precision: 3,
      },
    },
  },
  plugins: {
    decimation: {
      enabled: false,
    },
    tooltip: {
      enabled: false,
    },
    zoom: {
      zoom: {
        enabled: true,
        mode: "x",
        sensitivity: 3,
        speed: 0.1,
      },
      pan: {
        mode: "xy",
        enabled: true,
        speed: 20,
        threshold: 10,
      },
    },
  },
});
