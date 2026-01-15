// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

/**
 * Device status type
 */
export type DeviceStatus = "online" | "offline" | "error";

/**
 * Agent status type
 */
export type AgentStatus = "running" | "stopped" | "error";

/**
 * Device topic information
 */
export type DeviceTopic = {
  id: string;
  name: string;
  type: string;
  frequency: number | undefined;
};

/**
 * Device information from the server
 */
export type Device = {
  id: string;
  name: string;
  type: string;
  model: string | undefined;
  serialNumber: string | undefined;
  firmwareVersion: string | undefined;
  location: string | undefined;
  ipAddress: string | undefined;
  status: DeviceStatus;
  enabled: boolean;
  lastSeen: string | undefined;
  agentVersion: string | undefined;
  agentStatus: AgentStatus | undefined;
  agentUptime: number | undefined;
  cpuUsage: number | undefined;
  memoryUsage: number | undefined;
  diskUsage: number | undefined;
  rosDistro: string | undefined;
  rosNodeCount: number | undefined;
  rosTopicCount: number | undefined;
  createdAt: string;
  updatedAt: string;
};

/**
 * Paginated device list response
 */
export type DeviceListResponse = {
  data: Device[];
  total: number;
  page: number;
  pageSize: number;
};

/**
 * Query parameters for listing devices
 */
export type DeviceListQuery = {
  search?: string;
  status?: DeviceStatus;
  page?: number;
  pageSize?: number;
};

/**
 * Parameters for creating a new device
 */
export type CreateDeviceParams = {
  name: string;
  type: string;
  model?: string;
  serialNumber?: string;
  firmwareVersion?: string;
  location?: string;
  ipAddress?: string;
  orgId?: string;
};

/**
 * Parameters for updating a device
 */
export type UpdateDeviceParams = {
  name?: string;
  type?: string;
  model?: string | null;
  serialNumber?: string | null;
  firmwareVersion?: string | null;
  location?: string | null;
  ipAddress?: string | null;
  enabled?: boolean;
};

/**
 * Device token response
 */
export type DeviceTokenResponse = {
  token: string;
  expiresAt: string;
};

/**
 * Device event type
 */
export type DeviceEventType =
  | "maintenance"
  | "upgrade"
  | "repair"
  | "replacement"
  | "inspection"
  | "other";

/**
 * Device event information
 */
export type DeviceEvent = {
  id: string;
  deviceId: string;
  eventType: DeviceEventType;
  description: string;
  startTime: string;
  duration: number;
  metadata: Record<string, string>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Paginated device event list response
 */
export type DeviceEventListResponse = {
  data: DeviceEvent[];
  total: number;
  page: number;
  pageSize: number;
};

/**
 * Query parameters for listing device events
 */
export type DeviceEventListQuery = {
  eventType?: DeviceEventType;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
};

/**
 * Parameters for creating a device event
 */
export type CreateDeviceEventParams = {
  eventType: DeviceEventType;
  description: string;
  startTime: string;
  duration: number;
  metadata?: Record<string, string>;
};

/**
 * Parameters for updating a device event
 */
export type UpdateDeviceEventParams = {
  eventType?: DeviceEventType;
  description?: string;
  startTime?: string;
  duration?: number;
  metadata?: Record<string, string>;
};

/**
 * Device service interface
 */
export interface IDeviceService {
  // Device CRUD
  getDevices(query?: DeviceListQuery): Promise<DeviceListResponse>;
  getDevice(id: string): Promise<Device>;
  createDevice(params: CreateDeviceParams): Promise<Device>;
  updateDevice(id: string, params: UpdateDeviceParams): Promise<Device>;
  deleteDevice(id: string): Promise<boolean>;

  // Device topics
  getDeviceTopics(id: string): Promise<DeviceTopic[]>;

  // Device token
  generateDeviceToken(id: string): Promise<DeviceTokenResponse>;

  // Device events
  getDeviceEvents(deviceId: string, query?: DeviceEventListQuery): Promise<DeviceEventListResponse>;
  getDeviceEvent(deviceId: string, eventId: string): Promise<DeviceEvent>;
  createDeviceEvent(deviceId: string, params: CreateDeviceEventParams): Promise<DeviceEvent>;
  updateDeviceEvent(
    deviceId: string,
    eventId: string,
    params: UpdateDeviceEventParams,
  ): Promise<DeviceEvent>;
  deleteDeviceEvent(deviceId: string, eventId: string): Promise<boolean>;
}
