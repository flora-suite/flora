// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { AsyncState } from "react-use/lib/useAsyncFn";

import { Immutable } from "@lichtblick/suite";
import { ExtensionMarketplaceDetail } from "@lichtblick/suite-base/context/ExtensionMarketplaceContext";

export type InstalledExtension = {
  id: string;
  installed: boolean;
  name: string;
  displayName: string;
  description: string;
  publisher: string;
  homepage?: string;
  license?: string;
  version: string;
  keywords?: string[];
  namespace: string;
  qualifiedName: string;
};

export type FocusedExtension = {
  installed: boolean;
  entry: Immutable<ExtensionMarketplaceDetail>;
};

export type EntryGroupedData = {
  namespace: string;
  entries: Immutable<ExtensionMarketplaceDetail>[];
};

export type UseExtensionSettingsHook = {
  setUndebouncedFilterText: (newFilterText: string) => void;
  marketplaceEntries: AsyncState<ExtensionMarketplaceDetail[]>;
  refreshMarketplaceEntries: () => Promise<ExtensionMarketplaceDetail[]>;
  undebouncedFilterText: string;
  namespacedData: EntryGroupedData[];
  groupedMarketplaceData: EntryGroupedData[];
  debouncedFilterText: string;
};
