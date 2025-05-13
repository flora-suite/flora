// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useMemo } from "react";

import { filterMap } from "@lichtblick/den/collection";
import { useBlocksSubscriptions } from "@lichtblick/suite-base/PanelAPI";
import {
  MessageDataItemsByPath,
  useDecodeMessagePathsForMessagesByTopic,
} from "@lichtblick/suite-base/components/MessagePathSyntax/useCachedGetMessagePathDataItems";
import { subscribePayloadFromMessagePath } from "@lichtblick/suite-base/players/subscribePayloadFromMessagePath";
import { SubscribePayload } from "@lichtblick/suite-base/players/types";

import { StateTransitionConfig } from "../types";

export function useDecodedBlocks(paths: StateTransitionConfig["paths"]): MessageDataItemsByPath[] {
  const pathStrings = useMemo(() => paths.map(({ value }) => value), [paths]);
  const decodeMessagePathsForMessagesByTopic = useDecodeMessagePathsForMessagesByTopic(pathStrings);

  const subscriptions: SubscribePayload[] = useMemo(
    () =>
      filterMap(paths, (path) => {
        const payload = subscribePayloadFromMessagePath(path.value, "full");
        // Include the header in case we are ordering by header stamp.
        if (path.timestampMethod === "headerStamp" && payload?.fields != undefined) {
          payload.fields.push("header");
        }
        return payload;
      }),
    [paths],
  );

  const blocks = useBlocksSubscriptions(subscriptions);

  const decodedBlocks = useMemo(
    () => blocks.map(decodeMessagePathsForMessagesByTopic),
    [blocks, decodeMessagePathsForMessagesByTopic],
  );

  return decodedBlocks;
}
