// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { quoteTopicNameIfNeeded } from "@lichtblick/message-path";
import { DraggedMessagePath } from "@lichtblick/suite-base/components/PanelExtensionAdapter";
import { TopicListItem } from "@lichtblick/suite-base/components/TopicList/useTopicListSearch";

export function getDraggedMessagePath(treeItem: TopicListItem): DraggedMessagePath {
  switch (treeItem.type) {
    case "topic":
      return {
        path: quoteTopicNameIfNeeded(treeItem.item.item.name),
        rootSchemaName: treeItem.item.item.schemaName,
        isTopic: true,
        isLeaf: false,
        topicName: treeItem.item.item.name,
      };
    case "schema":
      return {
        path: treeItem.item.item.fullPath,
        rootSchemaName: treeItem.item.item.topic.schemaName,
        isTopic: false,
        isLeaf: treeItem.item.item.suffix.isLeaf,
        topicName: treeItem.item.item.topic.name,
      };
  }
}
