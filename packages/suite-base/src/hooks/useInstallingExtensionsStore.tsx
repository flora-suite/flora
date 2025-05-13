// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { create } from "zustand";

export type InstallingProgress = {
  installed: number;
  total: number;
  inProgress: boolean;
};

export type InstallingExtensionsState = {
  installingProgress: InstallingProgress;
  setInstallingProgress: (progress: (lastState: InstallingProgress) => InstallingProgress) => void;
  startInstallingProgress: (extensionsNumber: number) => void;
  resetInstallingProgress: () => void;
};

export const useInstallingExtensionsStore = create<InstallingExtensionsState>((set) => ({
  installingProgress: { installed: 0, total: 0, inProgress: false },
  setInstallingProgress: (progress) => {
    set((state) => ({
      installingProgress: progress(state.installingProgress),
    }));
  },
  startInstallingProgress: (extensionsToBeInstalled: number) => {
    set((state) => ({
      installingProgress: {
        ...state.installingProgress,
        total: extensionsToBeInstalled,
        installed: 0,
        inProgress: true,
      },
    }));
  },
  resetInstallingProgress: () => {
    set(() => ({
      installingProgress: {
        total: 0,
        installed: 0,
        inProgress: false,
      },
    }));
  },
}));
