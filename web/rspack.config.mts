// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

import path from "path";

import { mainConfig } from "@lichtblick/suite-web/src/rspackConfigs";

import packageJson from "../package.json";

const params = {
  // Preserve the output location consumed by the existing integration tests.
  outputPath: path.resolve(__dirname, ".webpack"),
  contextPath: path.resolve(__dirname, "src"),
  entrypoint: "./entrypoint.tsx",
  prodSourceMap: "source-map",
  version: packageJson.version,
  publicPath: "/",
  historyApiFallback: {
    index: "/index.html",
  },
};

export default mainConfig(params);
