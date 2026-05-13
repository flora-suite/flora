// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useCallback, useRef, useState } from "react";

import { useShallowMemo } from "@lichtblick/hooks";
import Logger from "@lichtblick/log";
import DeviceContext, {
  DeviceState,
  IDeviceContext,
} from "@lichtblick/suite-base/context/DeviceContext";
import { ApiError } from "@lichtblick/suite-base/services/ApiClient";
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
  IDeviceService,
  UpdateDeviceEventParams,
  UpdateDeviceParams,
} from "@lichtblick/suite-base/services/IDeviceService";

const log = Logger.getLogger(__filename);

/**
 * Check if error is a session expired error (401)
 * These errors are handled by AuthProvider and should not show error messages
 */
function isSessionExpiredError(error: unknown): boolean {
  return error instanceof ApiError && error.statusCode === 401;
}

type DeviceProviderProps = React.PropsWithChildren<{
  deviceService: IDeviceService;
}>;

/**
 * Provider component for device management context
 */
export default function DeviceProvider({
  deviceService,
  children,
}: DeviceProviderProps): JSX.Element {
  const [state, setState] = useState<DeviceState>({
    isLoading: false,
    devices: [],
    totalDevices: 0,
    page: 1,
    pageSize: 20,
    selectedDevice: undefined,
    error: undefined,
  });

  // Store current query for refresh
  const currentQueryRef = useRef<DeviceListQuery | undefined>(undefined);

  const fetchDevices = useCallback(
    async (query?: DeviceListQuery): Promise<DeviceListResponse> => {
      setState((prev) => ({ ...prev, isLoading: true, error: undefined }));
      currentQueryRef.current = query;

      try {
        const result = await deviceService.getDevices(query);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          devices: result.data,
          totalDevices: result.total,
          page: result.page,
          pageSize: result.pageSize,
        }));
        return result;
      } catch (error) {
        // Don't show error for 401 - AuthProvider will handle sign out
        if (isSessionExpiredError(error)) {
          setState((prev) => ({ ...prev, isLoading: false }));
          throw error;
        }
        const message =
          error instanceof ApiError ? error.message : "Failed to fetch devices. Please try again.";
        log.error("Failed to fetch devices:", error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
        }));
        throw error;
      }
    },
    [deviceService],
  );

  const fetchDevice = useCallback(
    async (id: string): Promise<Device> => {
      try {
        return await deviceService.getDevice(id);
      } catch (error) {
        if (isSessionExpiredError(error)) {
          throw error;
        }
        const message =
          error instanceof ApiError ? error.message : "Failed to fetch device. Please try again.";
        log.error("Failed to fetch device:", error);
        setState((prev) => ({ ...prev, error: message }));
        throw error;
      }
    },
    [deviceService],
  );

  const updateDevice = useCallback(
    async (id: string, params: UpdateDeviceParams): Promise<Device> => {
      setState((prev) => ({ ...prev, isLoading: true, error: undefined }));

      try {
        const device = await deviceService.updateDevice(id, params);
        // Update the device in the list
        setState((prev) => ({
          ...prev,
          isLoading: false,
          devices: prev.devices.map((d) => (d.id === id ? device : d)),
          selectedDevice: prev.selectedDevice?.id === id ? device : prev.selectedDevice,
        }));
        return device;
      } catch (error) {
        if (isSessionExpiredError(error)) {
          setState((prev) => ({ ...prev, isLoading: false }));
          throw error;
        }
        const message =
          error instanceof ApiError ? error.message : "Failed to update device. Please try again.";
        log.error("Failed to update device:", error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
        }));
        throw error;
      }
    },
    [deviceService],
  );

  const enableDevice = useCallback(
    async (id: string): Promise<Device> => {
      setState((prev) => ({ ...prev, isLoading: true, error: undefined }));

      try {
        const device = await deviceService.enableDevice(id);
        // Update the device in the list
        setState((prev) => ({
          ...prev,
          isLoading: false,
          devices: prev.devices.map((d) => (d.id === id ? device : d)),
          selectedDevice: prev.selectedDevice?.id === id ? device : prev.selectedDevice,
        }));
        return device;
      } catch (error) {
        if (isSessionExpiredError(error)) {
          setState((prev) => ({ ...prev, isLoading: false }));
          throw error;
        }
        const message =
          error instanceof ApiError ? error.message : "Failed to enable device. Please try again.";
        log.error("Failed to enable device:", error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
        }));
        throw error;
      }
    },
    [deviceService],
  );

  const disableDevice = useCallback(
    async (id: string): Promise<Device> => {
      setState((prev) => ({ ...prev, isLoading: true, error: undefined }));

      try {
        const device = await deviceService.disableDevice(id);
        // Update the device in the list
        setState((prev) => ({
          ...prev,
          isLoading: false,
          devices: prev.devices.map((d) => (d.id === id ? device : d)),
          selectedDevice: prev.selectedDevice?.id === id ? device : prev.selectedDevice,
        }));
        return device;
      } catch (error) {
        if (isSessionExpiredError(error)) {
          setState((prev) => ({ ...prev, isLoading: false }));
          throw error;
        }
        const message =
          error instanceof ApiError ? error.message : "Failed to disable device. Please try again.";
        log.error("Failed to disable device:", error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
        }));
        throw error;
      }
    },
    [deviceService],
  );

  const getDeviceAgentInfo = useCallback(
    async (id: string): Promise<DeviceAgentInfo> => {
      try {
        return await deviceService.getDeviceAgentInfo(id);
      } catch (error) {
        if (isSessionExpiredError(error)) {
          throw error;
        }
        const message =
          error instanceof ApiError
            ? error.message
            : "Failed to fetch device agent info. Please try again.";
        log.error("Failed to fetch device agent info:", error);
        setState((prev) => ({ ...prev, error: message }));
        throw error;
      }
    },
    [deviceService],
  );

  const deleteDevice = useCallback(
    async (id: string): Promise<boolean> => {
      setState((prev) => ({ ...prev, isLoading: true, error: undefined }));

      try {
        const deleted = await deviceService.deleteDevice(id);
        if (deleted) {
          // Remove the device from the list
          setState((prev) => ({
            ...prev,
            isLoading: false,
            devices: prev.devices.filter((d) => d.id !== id),
            totalDevices: prev.totalDevices - 1,
            selectedDevice: prev.selectedDevice?.id === id ? undefined : prev.selectedDevice,
          }));
        } else {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
        return deleted;
      } catch (error) {
        if (isSessionExpiredError(error)) {
          setState((prev) => ({ ...prev, isLoading: false }));
          throw error;
        }
        const message =
          error instanceof ApiError ? error.message : "Failed to delete device. Please try again.";
        log.error("Failed to delete device:", error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
        }));
        throw error;
      }
    },
    [deviceService],
  );

  const selectDevice = useCallback((device: Device | undefined): void => {
    setState((prev) => ({ ...prev, selectedDevice: device }));
  }, []);

  const fetchDeviceTopics = useCallback(
    async (id: string): Promise<DeviceTopic[]> => {
      try {
        return await deviceService.getDeviceTopics(id);
      } catch (error) {
        if (isSessionExpiredError(error)) {
          throw error;
        }
        const message =
          error instanceof ApiError
            ? error.message
            : "Failed to fetch device topics. Please try again.";
        log.error("Failed to fetch device topics:", error);
        setState((prev) => ({ ...prev, error: message }));
        throw error;
      }
    },
    [deviceService],
  );

  const generateDeviceToken = useCallback(
    async (id: string): Promise<DeviceTokenResponse> => {
      try {
        return await deviceService.generateDeviceToken(id);
      } catch (error) {
        if (isSessionExpiredError(error)) {
          throw error;
        }
        const message =
          error instanceof ApiError
            ? error.message
            : "Failed to generate device token. Please try again.";
        log.error("Failed to generate device token:", error);
        setState((prev) => ({ ...prev, error: message }));
        throw error;
      }
    },
    [deviceService],
  );

  const fetchDeviceEvents = useCallback(
    async (deviceId: string, query?: DeviceEventListQuery): Promise<DeviceEventListResponse> => {
      try {
        return await deviceService.getDeviceEvents(deviceId, query);
      } catch (error) {
        if (isSessionExpiredError(error)) {
          throw error;
        }
        const message =
          error instanceof ApiError
            ? error.message
            : "Failed to fetch device events. Please try again.";
        log.error("Failed to fetch device events:", error);
        setState((prev) => ({ ...prev, error: message }));
        throw error;
      }
    },
    [deviceService],
  );

  const fetchDeviceEvent = useCallback(
    async (deviceId: string, eventId: string): Promise<DeviceEvent> => {
      try {
        return await deviceService.getDeviceEvent(deviceId, eventId);
      } catch (error) {
        if (isSessionExpiredError(error)) {
          throw error;
        }
        const message =
          error instanceof ApiError
            ? error.message
            : "Failed to fetch device event. Please try again.";
        log.error("Failed to fetch device event:", error);
        setState((prev) => ({ ...prev, error: message }));
        throw error;
      }
    },
    [deviceService],
  );

  const createDeviceEvent = useCallback(
    async (deviceId: string, params: CreateDeviceEventParams): Promise<DeviceEvent> => {
      try {
        return await deviceService.createDeviceEvent(deviceId, params);
      } catch (error) {
        if (isSessionExpiredError(error)) {
          throw error;
        }
        const message =
          error instanceof ApiError
            ? error.message
            : "Failed to create device event. Please try again.";
        log.error("Failed to create device event:", error);
        setState((prev) => ({ ...prev, error: message }));
        throw error;
      }
    },
    [deviceService],
  );

  const updateDeviceEvent = useCallback(
    async (
      deviceId: string,
      eventId: string,
      params: UpdateDeviceEventParams,
    ): Promise<DeviceEvent> => {
      try {
        return await deviceService.updateDeviceEvent(deviceId, eventId, params);
      } catch (error) {
        if (isSessionExpiredError(error)) {
          throw error;
        }
        const message =
          error instanceof ApiError
            ? error.message
            : "Failed to update device event. Please try again.";
        log.error("Failed to update device event:", error);
        setState((prev) => ({ ...prev, error: message }));
        throw error;
      }
    },
    [deviceService],
  );

  const deleteDeviceEvent = useCallback(
    async (deviceId: string, eventId: string): Promise<boolean> => {
      try {
        return await deviceService.deleteDeviceEvent(deviceId, eventId);
      } catch (error) {
        if (isSessionExpiredError(error)) {
          throw error;
        }
        const message =
          error instanceof ApiError
            ? error.message
            : "Failed to delete device event. Please try again.";
        log.error("Failed to delete device event:", error);
        setState((prev) => ({ ...prev, error: message }));
        throw error;
      }
    },
    [deviceService],
  );

  const refreshDevices = useCallback(async (): Promise<void> => {
    await fetchDevices(currentQueryRef.current);
  }, [fetchDevices]);

  const clearError = useCallback((): void => {
    setState((prev) => ({ ...prev, error: undefined }));
  }, []);

  const contextValue = useShallowMemo<IDeviceContext>({
    ...state,
    fetchDevices,
    fetchDevice,
    updateDevice,
    enableDevice,
    disableDevice,
    deleteDevice,
    selectDevice,
    fetchDeviceTopics,
    generateDeviceToken,
    getDeviceAgentInfo,
    fetchDeviceEvents,
    fetchDeviceEvent,
    createDeviceEvent,
    updateDeviceEvent,
    deleteDeviceEvent,
    refreshDevices,
    clearError,
  });

  return <DeviceContext.Provider value={contextValue}>{children}</DeviceContext.Provider>;
}
