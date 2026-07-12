// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

import { rspack, type Configuration } from "@rspack/core";
import { ReactRefreshRspackPlugin } from "@rspack/plugin-react-refresh";
import path from "path";

import type { BuildArgv } from "@lichtblick/suite-base/BuildArgv";
import { makeRspackConfig } from "@lichtblick/suite-base/rspack";

const outputPath = path.resolve(__dirname, ".webpack");

export default (env: unknown, argv: BuildArgv): Configuration => {
  const isDev = argv.mode === "development";
  const isServe = process.env.FLORA_RSPACK_SERVE === "1";
  const appRspackConfig = makeRspackConfig(
    env,
    {
      ...argv,
      env: { ...argv.env, RSPACK_SERVE: isServe },
    },
    {
      allowUnusedVariables: isDev,
      version: "0.0.0-benchmark",
    },
  );

  return {
    name: "benchmark",
    ...appRspackConfig,
    target: "web",
    context: path.resolve(__dirname, "src"),
    entry: "./index.tsx",
    devtool: isDev ? "eval-cheap-module-source-map" : "source-map",
    output: {
      clean: true,
      publicPath: "auto",
      filename: isDev ? "[name].js" : "[name].[contenthash].js",
      path: outputPath,
    },
    devServer: {
      static: { directory: outputPath },
      hot: true,
      allowedHosts: "all",
      headers: {
        "cross-origin-opener-policy": "same-origin",
        "cross-origin-embedder-policy": "credentialless",
      },
    },
    plugins: [
      ...(appRspackConfig.plugins ?? []),
      new rspack.HtmlRspackPlugin({
        templateContent: `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Flora Benchmark</title>
  </head>
  <body>
    <script>
      global = globalThis;
    </script>
    <div id="root"></div>
  </body>
</html>
`,
      }),
      ...(isServe ? [new ReactRefreshRspackPlugin()] : []),
    ],
  };
};
