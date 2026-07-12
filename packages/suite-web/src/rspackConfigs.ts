// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

import { rspack, type Configuration } from "@rspack/core";
import { ReactRefreshRspackPlugin } from "@rspack/plugin-react-refresh";
import path from "path";

import type { BuildArgv } from "@lichtblick/suite-base/BuildArgv";
import { makeRspackConfig } from "@lichtblick/suite-base/rspack";

export type ConfigParams = {
  contextPath: string;
  entrypoint: string;
  outputPath: string;
  publicPath?: string;
  prodSourceMap: string | false;
  version: string;
  historyApiFallback?: { index: string };
};

export const mainConfig =
  (params: ConfigParams) =>
  (env: unknown, argv: BuildArgv): Configuration => {
    const isDev = argv.mode === "development";
    const isServe = process.env.FLORA_RSPACK_SERVE === "1";
    const appRspackConfig = makeRspackConfig(
      env,
      { ...argv, env: { ...argv.env, RSPACK_SERVE: isServe } },
      { allowUnusedVariables: isDev, version: params.version },
    );

    return {
      name: "web",
      ...appRspackConfig,
      target: "web",
      context: params.contextPath,
      entry: params.entrypoint,
      devtool: isDev ? "eval-cheap-module-source-map" : params.prodSourceMap,
      output: {
        clean: true,
        publicPath: params.publicPath ?? "auto",
        filename: isDev ? "[name].js" : "[name].[contenthash].js",
        path: params.outputPath,
      },
      devServer: {
        static: { directory: params.outputPath },
        historyApiFallback: params.historyApiFallback,
        hot: true,
        allowedHosts: "all",
        headers: {
          "cross-origin-opener-policy": "same-origin",
          "cross-origin-embedder-policy": "credentialless",
        },
      },
      plugins: [
        ...(appRspackConfig.plugins ?? []),
        new rspack.CopyRspackPlugin({
          patterns: [{ from: path.resolve(__dirname, "..", "public") }],
        }),
        new rspack.HtmlRspackPlugin({
          template: path.resolve(__dirname, "index.html"),
        }),
        ...(isServe ? [new ReactRefreshRspackPlugin()] : []),
      ],
    };
  };
