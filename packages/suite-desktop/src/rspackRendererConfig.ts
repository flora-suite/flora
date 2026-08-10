// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { rspack, type Configuration } from "@rspack/core";
import { ReactRefreshRspackPlugin } from "@rspack/plugin-react-refresh";
import path from "path";

import type { BuildArgv } from "@lichtblick/suite-base/BuildArgv";
import { makeRspackConfig } from "@lichtblick/suite-base/rspack";
import * as palette from "@lichtblick/theme/src/palette";

import { RspackConfigParams } from "./RspackConfigParams";

export const rspackRendererConfig =
  (params: RspackConfigParams) =>
  (env: unknown, argv: BuildArgv): Configuration => {
    const isDev = argv.mode === "development";
    const isServe = argv.env?.RSPACK_SERVE === true;

    const allowUnusedVariables = isDev;

    const appRspackConfig = makeRspackConfig(env, argv, {
      allowUnusedVariables,
      version: params.packageJson.version,
    });

    const config: Configuration = {
      ...appRspackConfig,

      // force web target instead of electron-render
      // Fixes "require is not defined" errors if nodeIntegration is off
      // https://gist.github.com/msafi/d1b8571aa921feaaa0f893ab24bb727b
      target: "web",
      context: params.rendererContext,
      entry: params.rendererEntrypoint,
      devtool: isDev ? "eval-cheap-module-source-map" : params.prodSourceMap,

      output: {
        publicPath: isServe ? "/renderer/" : "",
        path: path.join(params.outputPath, "renderer"),
      },

      optimization: { removeAvailableModules: true },

      plugins: [
        ...(appRspackConfig.plugins ?? []),
        new rspack.HtmlRspackPlugin({
          templateContent: `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8">
      <script>
        global = globalThis;
      </script>
    <style>
      html, body {
        background-color: ${palette.light.background?.default};
        color: ${palette.light.text?.primary};
      }
      @media (prefers-color-scheme: dark) {
        html, body {
          background-color: ${palette.dark.background?.default};
          color: ${palette.dark.text?.primary};
        }
      }
    </style>
    <body>
      <div id="root"></div>
    </body>
  </html>
  `,
        }),
        ...(isServe ? [new ReactRefreshRspackPlugin()] : []),
      ],
    };

    return config;
  };
