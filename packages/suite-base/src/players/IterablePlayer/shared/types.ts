// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Time } from "@lichtblick/rostime";
import {
  IIterableSource,
  Initialization,
} from "@lichtblick/suite-base/players/IterablePlayer/IIterableSource";

export type MultiSource = { type: "files"; files: Blob[] } | { type: "urls"; urls: string[] };

export type IterableSourceConstructor<T extends IIterableSource, P> = new (args: P) => T;

export type InitMetadata = Initialization["metadata"];

export type InitTopicStatsMap = Initialization["topicStats"];

export type InitLoadedTimes = Array<{ start: Time; end: Time }>;
