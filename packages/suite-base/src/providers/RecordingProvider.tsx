// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useMemo } from "react";

import RecordingContext, { type IRecordingContext } from "@lichtblick/suite-base/context/RecordingContext";
import type { IRecordingService } from "@lichtblick/suite-base/services/IRecordingService";

type RecordingProviderProps = React.PropsWithChildren<{
  recordingService: IRecordingService;
}>;

/**
 * Provider component for recording context
 */
export default function RecordingProvider({
  recordingService,
  children,
}: RecordingProviderProps): JSX.Element {
  const contextValue = useMemo<IRecordingContext>(() => ({
    recordingService,
  }), [recordingService]);

  return <RecordingContext.Provider value={contextValue}>{children}</RecordingContext.Provider>;
}