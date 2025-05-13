// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { compare, Time } from "@lichtblick/rostime";
import {
  InitMetadata,
  InitTopicStatsMap,
} from "@lichtblick/suite-base/players/IterablePlayer/shared/types";

export const setStartTime = (accumulated: Time, current: Time): Time => {
  return compare(current, accumulated) < 0 ? current : accumulated;
};

export const setEndTime = (accumulated: Time, current: Time): Time => {
  return compare(current, accumulated) > 0 ? current : accumulated;
};

export const mergeMetadata = (accumulated: InitMetadata, current: InitMetadata): InitMetadata => {
  return [...(accumulated ?? []), ...(current ?? [])];
};

export const accumulateMap = <V>(
  accumulated: Map<string, V>,
  current: Map<string, V>,
): Map<string, V> => {
  return new Map<string, V>([...accumulated, ...current]);
};

export const mergeTopicStats = (
  accumulated: InitTopicStatsMap,
  current: InitTopicStatsMap,
): InitTopicStatsMap => {
  for (const [topic, stats] of current) {
    if (!accumulated.has(topic)) {
      accumulated.set(topic, { numMessages: 0 });
    }
    const accStats = accumulated.get(topic)!;

    accStats.numMessages += stats.numMessages;
    // Keep the earliest firstMessageTime
    if (
      stats.firstMessageTime &&
      (!accStats.firstMessageTime || compare(stats.firstMessageTime, accStats.firstMessageTime) < 0)
    ) {
      accStats.firstMessageTime = stats.firstMessageTime;
    }

    // Keep the latest lastMessageTime
    if (
      stats.lastMessageTime &&
      (!accStats.lastMessageTime || compare(stats.lastMessageTime, accStats.lastMessageTime) > 0)
    ) {
      accStats.lastMessageTime = stats.lastMessageTime;
    }
  }
  return accumulated;
};
