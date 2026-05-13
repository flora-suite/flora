// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { createContext, useContext } from "react";

import type { IRecordingService } from "@lichtblick/suite-base/services/IRecordingService";

/**
 * Recording context interface
 */
export interface IRecordingContext {
  recordingService: IRecordingService;
}

const defaultRecordingContext: IRecordingContext = {
  recordingService: {
    getRecordings: async () => {
      throw new Error("RecordingContext not initialized");
    },
    getRecording: async () => {
      throw new Error("RecordingContext not initialized");
    },
    deleteRecording: async () => {
      throw new Error("RecordingContext not initialized");
    },
    uploadRecording: async () => {
      throw new Error("RecordingContext not initialized");
    },
    downloadRecording: async () => {
      throw new Error("RecordingContext not initialized");
    },
    getDownloadUrl: async () => {
      throw new Error("RecordingContext not initialized");
    },
  },
};

const RecordingContext = createContext<IRecordingContext>(defaultRecordingContext);
RecordingContext.displayName = "RecordingContext";

/**
 * Hook to access recording service context
 */
export function useRecordings(): IRecordingContext {
  return useContext(RecordingContext);
}

export default RecordingContext;