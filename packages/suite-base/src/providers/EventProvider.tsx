// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useMemo } from "react";

import EventContext, { type IEventContext } from "@lichtblick/suite-base/context/EventContext";
import type { IEventService } from "@lichtblick/suite-base/services/IEventService";

type EventProviderProps = React.PropsWithChildren<{
  eventService: IEventService;
}>;

/**
 * Provider component for event context
 */
export default function EventProvider({
  eventService,
  children,
}: EventProviderProps): JSX.Element {
  const contextValue = useMemo<IEventContext>(() => ({
    eventService,
  }), [eventService]);

  return <EventContext.Provider value={contextValue}>{children}</EventContext.Provider>;
}
