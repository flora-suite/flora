// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Dispatch, SetStateAction, useEffect } from "react";

import { Immutable } from "@lichtblick/suite";
import { Bounds1D } from "@lichtblick/suite-base/components/TimeBasedChart/types";
import {
  TimelineInteractionStateStore,
  useTimelineInteractionState,
} from "@lichtblick/suite-base/context/TimelineInteractionStateContext";
import { PlotCoordinator } from "@lichtblick/suite-base/panels/Plot/PlotCoordinator";

const selectGlobalBounds = (store: TimelineInteractionStateStore) => store.globalBounds;
const selectSetGlobalBounds = (store: TimelineInteractionStateStore) => store.setGlobalBounds;

const useGlobalSync = (
  coordinator: PlotCoordinator | undefined,
  setCanReset: Dispatch<SetStateAction<boolean>>,
  { shouldSync }: { shouldSync: boolean },
  subscriberId: string,
): void => {
  const globalBounds = useTimelineInteractionState(selectGlobalBounds);
  const setGlobalBounds = useTimelineInteractionState(selectSetGlobalBounds);

  useEffect(() => {
    if (globalBounds?.sourceId === subscriberId || !shouldSync) {
      return;
    }

    coordinator?.setGlobalBounds(globalBounds);
  }, [coordinator, globalBounds, shouldSync, subscriberId]);

  useEffect(() => {
    if (!coordinator) {
      return;
    }

    const onTimeseriesBounds = (newBounds: Immutable<Bounds1D>) => {
      setGlobalBounds({
        min: newBounds.min,
        max: newBounds.max,
        sourceId: subscriberId,
        userInteraction: true,
      });
    };

    coordinator.on("timeseriesBounds", onTimeseriesBounds);
    coordinator.on("viewportChange", setCanReset);
    return () => {
      coordinator.off("timeseriesBounds", onTimeseriesBounds);
      coordinator.off("viewportChange", setCanReset);
    };
  }, [coordinator, setCanReset, setGlobalBounds, shouldSync, subscriberId]);
};

export default useGlobalSync;
