// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Time } from "@lichtblick/suite";

export type BroadcastMessageEvent = { type: "play" | "pause" | "seek" | "playUntil"; time: Time };

export type ChannelListeners = Set<(message: BroadcastMessageEvent) => void>;
