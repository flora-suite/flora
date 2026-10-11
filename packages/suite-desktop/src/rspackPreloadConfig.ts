// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { rspack, type Configuration } from "@rspack/core";
import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";
import path from "path";

import type { BuildArgv } from "@lichtblick/suite-base/BuildArgv";

import { RspackConfigParams } from "./RspackConfigParams";

export const rspackPreloadConfig =
  (params: RspackConfigParams) =>
  (_: unknown, argv: BuildArgv): Configuration => {
    const isDev = argv.mode === "development";

    return {
      context: params.preloadContext,
      entry: params.preloadEntrypoint,
      target: "electron-preload",
      devtool: isDev ? "eval-cheap-module-source-map" : params.prodSourceMap,

      output: {
        publicPath: "",
        filename: "preload.js",
        // Put the preload script in main since main becomes the "app path"
        // This simplifies setting the 'preload' webPrefereces option on BrowserWindow
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
          FLORA_PRODUCT_NAME: JSON.stringify(params.packageJson.productName),
          FLORA_PRODUCT_VERSION: JSON.stringify(params.packageJson.version),
          FLORA_PRODUCT_HOMEPAGE: JSON.stringify(params.packageJson.homepage),
        }),
        new ForkTsCheckerWebpackPlugin(),
      ],

      resolve: {
        extensions: [".js", ".ts", ".tsx", ".json"],
      },
    };
  };
