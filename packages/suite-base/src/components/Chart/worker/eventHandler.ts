// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import EventEmitter from "eventemitter3";

import { EventListenerHandler } from "@lichtblick/suite-base/components/Chart/types";

export function addEventListener(emitter: EventEmitter): EventListenerHandler {
  return (eventName: string, fn?: () => void): void => {
    const existing = emitter.listeners(eventName);
    if (!fn || existing.includes(fn)) {
      return;
    }

    emitter.on(eventName, fn);
  };
}

export function removeEventListener(emitter: EventEmitter): EventListenerHandler {
  return (eventName: string, fn?: () => void) => {
    if (fn) {
      emitter.off(eventName, fn);
    }
  };
}
