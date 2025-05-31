// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { BROADCAST_CHANNEL_NAME } from "@lichtblick/suite-base/util/broadcast/constants";
import { BroadcastMessageEvent } from "@lichtblick/suite-base/util/broadcast/types";

// Mock implementation of BroadcastChannel
export default class MockBroadcastChannel {
  public name = BROADCAST_CHANNEL_NAME;
  public onmessage: ((event: MessageEvent) => void) | undefined;
  public postedMessages: BroadcastMessageEvent[] = [];
  public isClosed = false;

  public postMessage(message: BroadcastMessageEvent): void {
    this.postedMessages.push(message);
  }

  public close(): void {
    this.isClosed = true;
  }

  // Helper to simulate receiving a message
  public simulateIncomingMessage(message: BroadcastMessageEvent): void {
    this.onmessage?.({ data: message } as MessageEvent<BroadcastMessageEvent>);
  }
}
