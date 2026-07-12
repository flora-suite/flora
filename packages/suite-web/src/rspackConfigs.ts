// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

import { rspack, type Configuration } from "@rspack/core";
import { ReactRefreshRspackPlugin } from "@rspack/plugin-react-refresh";
import path from "path";

import type { WebpackArgv } from "@lichtblick/suite-base/WebpackArgv";
import { makeRspackConfig } from "@lichtblick/suite-base/rspack";

import { mainConfig as webpackMainConfig } from "./webpackConfigs";

export type ConfigParams = {
  contextPath: string;
  entrypoint: string;
  outputPath: string;
  publicPath?: string;
  prodSourceMap: string | false;
  version: string;
  historyApiFallback?: { index: string };
};

type HtmlTemplate = (params: { htmlWebpackPlugin: { options: Record<string, unknown> } }) => string;

function existingHtmlTemplate(
  params: ConfigParams,
  env: unknown,
  argv: WebpackArgv,
  options: Record<string, unknown>,
): string {
  const htmlPlugin = webpackMainConfig(params)(env, argv).plugins?.find(
    (plugin) => plugin?.constructor.name === "HtmlWebpackPlugin",
  ) as { userOptions?: { templateContent?: HtmlTemplate } } | undefined;
  const templateContent = htmlPlugin?.userOptions?.templateContent;

  if (!templateContent) {
    throw new Error("Unable to load the existing Webpack HTML template");
  }

  // Rspack's HTML parser rejects the script placement accepted by
  // HtmlWebpackPlugin. Preserve the legacy template and make only that markup
  // correction while the two build paths coexist.
  return templateContent({
    htmlWebpackPlugin: {
      options: { ...options, foxgloveExtraHeadTags: options.foxgloveExtraHeadTags ?? "" },
    },
  })
    .replace(/<\/head>\s*<script>/, "</head><body><script>")
    .replace(/<\/script>\s*<body>/, "</script>");
}

export const mainConfig =
  (params: ConfigParams) =>
  (env: unknown, argv: WebpackArgv): Configuration => {
    const isDev = argv.mode === "development";
    const isServe = process.env.FLORA_RSPACK_SERVE === "1";
    const appRspackConfig = makeRspackConfig(env, argv, {
      allowUnusedVariables: isDev,
      version: params.version,
    });

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
          templateContent: ({ htmlRspackPlugin }) =>
            existingHtmlTemplate(
              params,
              env,
              argv,
              htmlRspackPlugin.options as Record<string, unknown>,
            ),
        }),
        ...(isServe ? [new ReactRefreshRspackPlugin()] : []),
      ],
    };
  };
