// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { createContext, useContext } from "react";

import {
  CreateDeviceEventParams,
  Device,
  DeviceAgentInfo,
  DeviceEvent,
  DeviceEventListQuery,
  DeviceEventListResponse,
  DeviceListQuery,
  DeviceListResponse,
  DeviceTopic,
  DeviceTokenResponse,
  UpdateDeviceEventParams,
  UpdateDeviceParams,
} from "@lichtblick/suite-base/services/IDeviceService";

/**
 * Device management state
 */
export type DeviceState = {
  /** Whether devices are being loaded */
  isLoading: boolean;
  /** Current list of devices */
  devices: Device[];
  /** Total count of devices */
  totalDevices: number;
  /** Current page */
  page: number;
  /** Page size */
  pageSize: number;
  /** Currently selected device */
  selectedDevice: Device | undefined;
  /** Error message */
  error: string | undefined;
};

/**
 * Device context interface
 */
export interface IDeviceContext extends DeviceState {
  // Device CRUD operations (note: devices are created via Agent only, no createDevice method)
  fetchDevices: (query?: DeviceListQuery) => Promise<DeviceListResponse>;
  fetchDevice: (id: string) => Promise<Device>;
  updateDevice: (id: string, params: UpdateDeviceParams) => Promise<Device>;
  enableDevice: (id: string) => Promise<Device>;
  disableDevice: (id: string) => Promise<Device>;
  deleteDevice: (id: string) => Promise<boolean>;

  // Device selection
  selectDevice: (device: Device | undefined) => void;

  // Device topics
  fetchDeviceTopics: (id: string) => Promise<DeviceTopic[]>;

  // Device token
  generateDeviceToken: (id: string) => Promise<DeviceTokenResponse>;

  // Device agent info
  getDeviceAgentInfo: (id: string) => Promise<DeviceAgentInfo>;

  // Device events
  fetchDeviceEvents: (
    deviceId: string,
    query?: DeviceEventListQuery,
  ) => Promise<DeviceEventListResponse>;
  fetchDeviceEvent: (deviceId: string, eventId: string) => Promise<DeviceEvent>;
  createDeviceEvent: (deviceId: string, params: CreateDeviceEventParams) => Promise<DeviceEvent>;
  updateDeviceEvent: (
    deviceId: string,
    eventId: string,
    params: UpdateDeviceEventParams,
  ) => Promise<DeviceEvent>;
  deleteDeviceEvent: (deviceId: string, eventId: string) => Promise<boolean>;

  // Utility
  refreshDevices: () => Promise<void>;
  clearError: () => void;
}

const defaultDeviceContext: IDeviceContext = {
  isLoading: false,
  devices: [],
  totalDevices: 0,
  page: 1,
  pageSize: 20,
  selectedDevice: undefined,
  error: undefined,

  fetchDevices: async () => {
    throw new Error("DeviceContext not initialized");
  },
  fetchDevice: async () => {
    throw new Error("DeviceContext not initialized");
  },
  updateDevice: async () => {
    throw new Error("DeviceContext not initialized");
  },
  enableDevice: async () => {
    throw new Error("DeviceContext not initialized");
  },
  disableDevice: async () => {
    throw new Error("DeviceContext not initialized");
  },
  deleteDevice: async () => {
    throw new Error("DeviceContext not initialized");
  },
  selectDevice: () => {
    throw new Error("DeviceContext not initialized");
  },
  fetchDeviceTopics: async () => {
    throw new Error("DeviceContext not initialized");
  },
  generateDeviceToken: async () => {
    throw new Error("DeviceContext not initialized");
  },
  getDeviceAgentInfo: async () => {
    throw new Error("DeviceContext not initialized");
  },
  fetchDeviceEvents: async () => {
    throw new Error("DeviceContext not initialized");
  },
  fetchDeviceEvent: async () => {
    throw new Error("DeviceContext not initialized");
  },
  createDeviceEvent: async () => {
    throw new Error("DeviceContext not initialized");
  },
  updateDeviceEvent: async () => {
    throw new Error("DeviceContext not initialized");
  },
  deleteDeviceEvent: async () => {
    throw new Error("DeviceContext not initialized");
  },
  refreshDevices: async () => {
    throw new Error("DeviceContext not initialized");
  },
  clearError: () => {
    throw new Error("DeviceContext not initialized");
  },
};

const DeviceContext = createContext<IDeviceContext>(defaultDeviceContext);
DeviceContext.displayName = "DeviceContext";

/**
 * Hook to access device management context
 */
export function useDevices(): IDeviceContext {
  return useContext(DeviceContext);
}

/**
 * Hook to get currently selected device
 * Returns undefined if no device is selected
 */
export function useSelectedDevice(): Device | undefined {
  const { selectedDevice } = useDevices();
  return selectedDevice;
}

/**
 * Hook to require a selected device
 * Throws if no device is selected
 */
export function useRequireSelectedDevice(): Device {
  const { selectedDevice, isLoading } = useDevices();

  if (isLoading) {
    throw new Error("Devices are still loading");
  }

  if (!selectedDevice) {
    throw new Error("No device is selected");
  }

  return selectedDevice;
}

export default DeviceContext;
