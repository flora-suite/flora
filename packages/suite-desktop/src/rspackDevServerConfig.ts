// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { rspack, type Configuration } from "@rspack/core";

import type { BuildArgv } from "@lichtblick/suite-base/BuildArgv";

import { RspackConfigParams } from "./RspackConfigParams";

type AssetCompilation = {
  hooks: {
    processAssets: {
      tap: (options: { name: string; stage: number }, callback: () => void) => void;
    };
  };
  emitAsset: (name: string, source: InstanceType<typeof rspack.sources.RawSource>) => void;
};

function packageJsonPlugin(packageJson: Record<string, unknown>) {
  return {
    apply(compiler: {
      hooks: { thisCompilation: { tap: (name: string, fn: (compilation: AssetCompilation) => void) => void } };
    }) {
      compiler.hooks.thisCompilation.tap("DesktopPackageJsonPlugin", (compilation) => {
        compilation.hooks.processAssets.tap(
          {
            name: "DesktopPackageJsonPlugin",
            stage: rspack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
          },
          () => {
            compilation.emitAsset(
              "package.json",
              new rspack.sources.RawSource(JSON.stringify(packageJson)),
            );
          },
        );
      });
    },
  };
}

export const rspackDevServerConfig =
  (params: RspackConfigParams) =>
  (_: unknown, argv: BuildArgv): Configuration => {
    const isRelease = argv.mode === "production";

    // The appdata directory is derived from the product name. To have a separate directory
    // for our production and development builds we change the product name when using dev or serve.
    const productName = isRelease
      ? params.packageJson.productName
      : `${params.packageJson.productName} Dev`;

    return {
      name: "dev-server",
      entry: {},

      // Output path must be specified here for HtmlWebpackPlugin within render config to work
      output: {
        clean: true,
        publicPath: "",
        path: params.outputPath,
      },

      devServer: {
        static: {
          directory: params.outputPath,
        },
        devMiddleware: {
          writeToDisk: (filePath) => {
            // Electron needs to open the main thread source and preload source from disk
            // avoid writing the hot-update js and json files
            // allow writing package.json at root -> needed for electron to find entrypoint
            return /\.webpack[\\/]((main|extensions)[\\/](?!.*hot-update)|package\.json)/.test(
              filePath,
            );
          },
        },
        client: {
          overlay: {
            runtimeErrors: (error) => {
              // Suppress overlays for importScript errors from terminated webworkers.
              //
              // When a webworker is terminated, any pending `importScript` calls are cancelled by the
              // browser. These appear in the devtools network tab as "(cancelled)" and bubble up to the
              // parent page as errors which trigger `window.onerror`.
              //
              // webpack devserver attaches to the window error handler surface unhandled errors sent to
              // the page. However this kind of error is a false-positive for a worker that is
              // terminated because we do not care that its network requests were cancelled since the
              // worker itself is gone.
              //
              // Will this hide real importScript errors during development?
              // It is possible that a worker encounters this error during normal operation (if
              // importing a script does fail for a legitimate reason). In that case we expect the
              // worker logic that depended on the script to fail execution and trigger other kinds of
              // errors. The developer can still see the importScripts error in devtools console.
              if (
                error.message.startsWith(
                  `Uncaught NetworkError: Failed to execute 'importScripts' on 'WorkerGlobalScope'`,
                )
              ) {
                return false;
              }

              return true;
            },
          },
        },
        hot: true,
        // The problem and solution are described at <https://github.com/webpack/webpack-dev-server/issues/1604>.
        // When running in dev mode two errors are logged to the dev console:
        //  "Invalid Host/Origin header"
        //  "[WDS] Disconnected!"
        // Since we are only connecting to localhost, DNS rebinding attacks are not a concern during dev
        allowedHosts: "all",
      },
      plugins: [
        packageJsonPlugin({
            main: "main/main.js",
            name: params.packageJson.name,
            productName,
            version: params.packageJson.version,
            description: params.packageJson.description,
            productDescription: params.packageJson.productDescription,
            license: params.packageJson.license,
            author: params.packageJson.author,
        }),
      ],
    };
  };
