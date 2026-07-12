// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

// foxglove-depcheck-used: @types/foxglove__web

import { useEffect, useState } from "react";

import Logger from "@lichtblick/log";

const log = Logger.getLogger(__filename);

type UseMemoryInfoOptions = {
  refreshIntervalMs: number;
};

type MemoryInfo = {
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
};

const performanceWithMemory = window.performance as Performance & { memory?: MemoryInfo };

export function useMemoryInfo(opt: UseMemoryInfoOptions): MemoryInfo | undefined {
  const { refreshIntervalMs } = opt;
  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | undefined>(
    performanceWithMemory.memory,
  );

  useEffect(() => {
    if (!performanceWithMemory.memory) {
      log.info("No memory information available");
      return;
    }

    const interval = setInterval(() => {
      setMemoryInfo(performanceWithMemory.memory);
    }, refreshIntervalMs);
    return () => {
      clearInterval(interval);
    };
  }, [refreshIntervalMs]);

  return memoryInfo;
}
