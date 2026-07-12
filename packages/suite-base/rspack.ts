// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

import { rspack, type Configuration } from "@rspack/core";

import type { WebpackArgv } from "./WebpackArgv";
import { makeConfig } from "./webpack";

type Options = Parameters<typeof makeConfig>[2];

// Keep module rules and the project-specific TypeScript transformer in one
// place while replacing only Webpack-owned plugin instances. This is an
// intentionally transitional layer: the remaining compatible community
// plugins can be evaluated independently before moving the rules to SWC.
export function makeRspackConfig(
  env: unknown,
  argv: WebpackArgv,
  options: Options,
): Pick<Configuration, "resolve" | "module" | "optimization" | "plugins" | "node"> {
  const webpackConfig = makeConfig(env, argv, options);
  const compatiblePlugins = (webpackConfig.plugins ?? []).filter((plugin) => {
    const name = plugin?.constructor.name;
    return name !== "ProvidePlugin" && name !== "DefinePlugin" && name !== "IgnorePlugin";
  });

  return {
    resolve: webpackConfig.resolve,
    module: webpackConfig.module,
    // Rspack uses SWC and Lightning CSS minimizers by default. Do not carry
    // over the Webpack-only esbuild-loader minimizer instance.
    optimization: { removeAvailableModules: true },
    plugins: [
      new rspack.ProvidePlugin({
        React: "react",
        Buffer: ["buffer", "Buffer"],
        process: ["@lichtblick/suite-base/util/process", "default"],
        setImmediate: ["@lichtblick/suite-base/util/setImmediate", "default"],
      }),
      new rspack.DefinePlugin({
        ReactNull: null, // eslint-disable-line no-restricted-syntax
        LICHTBLICK_SUITE_VERSION: JSON.stringify(options.version),
      }),
      new rspack.IgnorePlugin({
        resourceRegExp: /^\.[\\/]locale$/,
        contextRegExp: /moment$/,
      }),
      ...compatiblePlugins,
    ],
    node: webpackConfig.node,
  };
}
