// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ExtensionMarketplaceDetail } from "@lichtblick/suite-base/context/ExtensionMarketplaceContext";
import BasicBuilder from "@lichtblick/suite-base/testing/builders/BasicBuilder";
import { defaults } from "@lichtblick/suite-base/testing/builders/utilities";
import { ExtensionInfo, ExtensionNamespace } from "@lichtblick/suite-base/types/Extensions";

export default class ExtensionBuilder {
  public static extensionInfo(props: Partial<ExtensionInfo> = {}): ExtensionInfo {
    return defaults<ExtensionInfo>(props, {
      description: BasicBuilder.string(),
      displayName: BasicBuilder.string(),
      homepage: BasicBuilder.string(),
      id: BasicBuilder.string(),
      keywords: BasicBuilder.strings(),
      license: BasicBuilder.string(),
      name: BasicBuilder.string(),
      namespace: BasicBuilder.sample(["local", "org"] as ExtensionNamespace[]),
      publisher: BasicBuilder.string(),
      qualifiedName: BasicBuilder.string(),
      version: BasicBuilder.string(),
      readme: BasicBuilder.string(),
      changelog: BasicBuilder.string(),
    });
  }

  public static extensionMarketplaceDetail(
    props: Partial<ExtensionMarketplaceDetail> = {},
  ): ExtensionMarketplaceDetail {
    return defaults<ExtensionMarketplaceDetail>(props, {
      ...this.extensionInfo(props),
      foxe: BasicBuilder.string(),
      sha256sum: BasicBuilder.string(),
      time: BasicBuilder.genericDictionary(String),
    });
  }
}
