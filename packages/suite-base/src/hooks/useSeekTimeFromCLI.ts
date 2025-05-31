// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { enqueueSnackbar } from "notistack";
import { useEffect } from "react";

import { useMessagePipelineGetter } from "@lichtblick/suite-base/components/MessagePipeline";
import { useAppParameters } from "@lichtblick/suite-base/context/AppParametersContext";
import { PlayerPresence } from "@lichtblick/suite-base/players/types";
import { parseTimestampStr } from "@lichtblick/suite-base/util/parseMultipleTimes";

const useSeekTimeFromCLI = (): void => {
  const {
    playerState: { presence },
    seekPlayback,
  } = useMessagePipelineGetter()();

  const { time } = useAppParameters();

  useEffect(() => {
    if (!time || !seekPlayback) {
      return;
    }

    // Wait until player is ready before we try to seek.
    if (presence !== PlayerPresence.PRESENT) {
      return;
    }

    const parsedTime = parseTimestampStr(time);

    if (parsedTime == undefined) {
      // Show an error message to the user indicating that the time format is invalid
      enqueueSnackbar(
        "Invalid time format using 'time' parameter on CLI. Please check and try again.",
        { variant: "warning" },
      );
      return;
    }

    seekPlayback(parsedTime);
  }, [time, seekPlayback, presence]);
};

export default useSeekTimeFromCLI;
