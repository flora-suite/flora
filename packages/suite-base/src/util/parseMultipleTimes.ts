// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { fromSec, Time } from "@lichtblick/rostime";
import { parseTimeStr } from "@lichtblick/suite-base/util/formatTime";

export const parseTimestampStr = (timeStr: string): Time | undefined => {
  if (!timeStr.trim()) {
    return undefined;
  } // Handle empty strings explicitly

  const timeNumber = Number(timeStr);

  if (!isNaN(timeNumber)) {
    // If input is a number, assume it's a Unix timestamp in seconds
    return fromSec(timeNumber);
  }

  return parseTimeStr(timeStr);
};
