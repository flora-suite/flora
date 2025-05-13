// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useMemo } from "react";

import { Time, toSec } from "@lichtblick/rostime";
import { useMessagePipelineGetter } from "@lichtblick/suite-base/components/MessagePipeline";
import { subtractTimes } from "@lichtblick/suite-base/players/UserScriptPlayer/transformerWorker/typescript/userUtils/time";

type UseStateTransitionsTime = {
  startTime: Readonly<Time> | undefined;
  currentTimeSinceStart: number | undefined;
  endTimeSinceStart: number | undefined;
};

const useStateTransitionsTime = (): UseStateTransitionsTime => {
  const getMessagePipelineState = useMessagePipelineGetter();

  const {
    playerState: { activeData: { startTime, currentTime, endTime } = {} },
  } = getMessagePipelineState();

  const currentTimeSinceStart = useMemo(
    () => (currentTime && startTime ? toSec(subtractTimes(currentTime, startTime)) : undefined),
    [currentTime, startTime],
  );

  const endTimeSinceStart = useMemo(
    () => (endTime && startTime ? toSec(subtractTimes(endTime, startTime)) : undefined),
    [endTime, startTime],
  );

  return { startTime, currentTimeSinceStart, endTimeSinceStart };
};

export default useStateTransitionsTime;
