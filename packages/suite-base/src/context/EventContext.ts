// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { createContext, useContext } from "react";

import type { IEventService } from "@lichtblick/suite-base/services/IEventService";

/**
 * Event context interface
 */
export interface IEventContext {
  eventService: IEventService;
}

const defaultEventContext: IEventContext = {
  eventService: {
    getEvents: async () => {
      throw new Error("EventContext not initialized");
    },
    getEvent: async () => {
      throw new Error("EventContext not initialized");
    },
    createEvent: async () => {
      throw new Error("EventContext not initialized");
    },
    updateEvent: async () => {
      throw new Error("EventContext not initialized");
    },
    deleteEvent: async () => {
      throw new Error("EventContext not initialized");
    },
  },
};

const EventContext = createContext<IEventContext>(defaultEventContext);
EventContext.displayName = "EventContext";

/**
 * Hook to access event service context
 */
export function useEvents(): IEventContext {
  return useContext(EventContext);
}

export default EventContext;
