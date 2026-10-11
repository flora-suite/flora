// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { rspack, type Configuration } from "@rspack/core";
import path from "path";

import type { BuildArgv } from "@lichtblick/suite-base/BuildArgv";

import { RspackConfigParams } from "./RspackConfigParams";

export const rspackMainConfig =
  (params: RspackConfigParams) =>
  (_: unknown, argv: BuildArgv): Configuration => {
    const isServe = argv.env?.RSPACK_SERVE === true;

    const isDev = argv.mode === "development";

    const resolve = {
      extensions: [".js", ".ts", ".tsx", ".json"],
    };

    if (!isDev) {
      // Stub out devtools installation for non-dev builds
      resolve.alias = {
        "electron-devtools-installer": false,
      };
    }

    // When running under a development server the renderer entry comes from the server.
    // When making static builds (for packaging), the renderer entry is a file on disk.
    // This switches between the two and is injected below via DefinePlugin as MAIN_WINDOW_WEBPACK_ENTRY
    const rendererEntry = isServe
      ? `"http://${argv.host ?? "localhost"}:8080/renderer/index.html"`
      : "`file://${require('path').join(__dirname, '..', 'renderer', 'index.html')}`";

    return {
      context: params.mainContext,
      entry: params.mainEntrypoint,
      target: "electron-main",
      devtool: isDev ? "eval-cheap-module-source-map" : params.prodSourceMap,

      output: {
        publicPath: "",
        path: path.join(params.outputPath, "main"),
      },

      module: {
        rules: [
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
              },
            },
          },
        ],
      },

      optimization: { removeAvailableModules: true },

      plugins: [
        new rspack.DefinePlugin({
          MAIN_WINDOW_WEBPACK_ENTRY: rendererEntry,
          FLORA_PRODUCT_NAME: JSON.stringify(params.packageJson.productName),
          FLORA_PRODUCT_VERSION: JSON.stringify(params.packageJson.version),
          FLORA_PRODUCT_HOMEPAGE: JSON.stringify(params.packageJson.homepage),
        }),
      ],

      resolve,
    };
  };
