// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { rspack, type Configuration } from "@rspack/core";
import { ReactRefreshRspackPlugin } from "@rspack/plugin-react-refresh";
import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";
import path from "path";
import ReactRefreshTypescript from "react-refresh-typescript";

import type { BuildArgv } from "@lichtblick/suite-base/BuildArgv";

import { RspackConfigParams } from "./RspackConfigParams";

export const rspackQuicklookConfig =
  (params: RspackConfigParams) =>
  (_env: unknown, argv: BuildArgv): Configuration => {
    const isDev = argv.mode === "development";
    const isServe = argv.env?.RSPACK_SERVE === true;

    const allowUnusedVariables = isDev && isServe;

    return {
      name: "quicklook",

      context: params.quicklookContext,
      entry: params.quicklookEntrypoint,
      target: "web",
      devtool: isDev ? "eval-cheap-module-source-map" : params.prodSourceMap,

      output: {
        publicPath: isServe ? "/quicklook/" : "",
        path: path.join(params.outputPath, "quicklook"),
      },

      module: {
        rules: [
          { test: /\.png$/, type: "asset/inline" },
          { test: /\.wasm$/, type: "asset/inline" },
          {
            test: /\.tsx?$/,
            exclude: /node_modules/,
            use: {
              loader: "ts-loader",
              options: {
                transpileOnly: true,
                // https://github.com/TypeStrong/ts-loader#onlycompilebundledfiles
                // avoid looking at files which are not part of the bundle
                onlyCompileBundledFiles: true,
                projectReferences: true,
                getCustomTransformers: () => ({
                  before: [
                    // only include refresh plugin when using webpack server
                    ...(isServe ? [ReactRefreshTypescript()] : []),
                  ],
                }),
              },
            },
          },
        ],
      },

      optimization: { removeAvailableModules: true },

      plugins: [
        new ForkTsCheckerWebpackPlugin({
          typescript: {
            configOverwrite: {
              compilerOptions: {
                noUnusedLocals: !allowUnusedVariables,
                noUnusedParameters: !allowUnusedVariables,
              },
            },
          },
        }),
        new rspack.HtmlRspackPlugin({
          templateContent: `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <script>
      global = globalThis;
    </script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`,
        }),
        new rspack.ProvidePlugin({
          // the buffer module exposes the Buffer class as a property
          Buffer: ["buffer", "Buffer"],
        }),
        ...(isServe ? [new ReactRefreshRspackPlugin()] : []),
      ],

      resolve: {
        extensions: [".js", ".ts", ".tsx", ".json"],
        fallback: {
          path: require.resolve("path-browserify"),
          stream: false,
          crypto: false,
          fs: false,
        },
      },
    };
  };
