// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

import path from "path";

import type { BuildArgv } from "@lichtblick/suite-base/BuildArgv";
import { RspackConfigParams } from "@lichtblick/suite-desktop/src/RspackConfigParams";
import { rspackDevServerConfig } from "@lichtblick/suite-desktop/src/rspackDevServerConfig";
import { rspackMainConfig } from "@lichtblick/suite-desktop/src/rspackMainConfig";
import { rspackPreloadConfig } from "@lichtblick/suite-desktop/src/rspackPreloadConfig";
import { rspackQuicklookConfig } from "@lichtblick/suite-desktop/src/rspackQuicklookConfig";
import { rspackRendererConfig } from "@lichtblick/suite-desktop/src/rspackRendererConfig";

import packageJson from "../package.json";

const params: RspackConfigParams = {
  packageJson,
  outputPath: path.resolve(__dirname, ".webpack"),
  prodSourceMap: "source-map",
  rendererContext: path.resolve(__dirname, "renderer"),
  rendererEntrypoint: "./index.ts",
  mainContext: path.resolve(__dirname, "main"),
  mainEntrypoint: "./index.ts",
  quicklookContext: path.resolve(__dirname, "quicklook"),
  quicklookEntrypoint: "./index.ts",
  preloadContext: path.resolve(__dirname, "preload"),
  preloadEntrypoint: "./index.ts",
};

export default (env: unknown, argv: BuildArgv) => {
  const rspackArgv: BuildArgv = {
    ...argv,
    env: { ...argv.env, RSPACK_SERVE: process.env.FLORA_RSPACK_SERVE === "1" },
  };

  return [
    rspackDevServerConfig(params)(env, rspackArgv),
    rspackMainConfig(params)(env, rspackArgv),
    rspackPreloadConfig(params)(env, rspackArgv),
    rspackRendererConfig(params)(env, rspackArgv),
    rspackQuicklookConfig(params)(env, rspackArgv),
  ];
};
