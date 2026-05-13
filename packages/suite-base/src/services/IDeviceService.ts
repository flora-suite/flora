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
  orgId?: string;
  search?: string;
  status?: DeviceStatus;
  page?: number;
  pageSize?: number;
};

/**
 * Parameters for updating a device (limited fields editable from frontend)
 */
export type UpdateDeviceParams = {
  name?: string;
  location?: string | null;
  model?: string | null;
  serialNumber?: string | null;
};

/**
 * Device agent info response
 */
export type DeviceAgentInfo = {
  agentInfo: {
    version: string | undefined;
    status: AgentStatus | undefined;
    uptime: number | undefined;
    lastHeartbeat: string | undefined;
  };
  systemInfo: {
    cpuUsage: number | undefined;
    memoryUsage: number | undefined;
    diskUsage: number | undefined;
    rosDistro: string | undefined;
    rosNodeCount: number | undefined;
    rosTopicCount: number | undefined;
  };
};

/**
 * Device token response
 */
export type DeviceTokenResponse = {
  token: string;
  expiresAt: string;
};

/**
 * System info collected by flora-agent for registration
 */
export type DeviceSystemInfo = {
  cpuCores?: number;
  cpuModel?: string;
  memoryGB?: number;
  diskGB?: number;
  osName?: string;
  kernelVersion?: string;
};

/**
 * Device registration info response (for web page display)
 */
export type DeviceRegistrationInfo = {
  code: string;
  machineId: string;
  hostname: string | undefined;
  platform: string | undefined;
  ipAddress: string | undefined;
  systemInfo: DeviceSystemInfo | undefined;
  expiresAt: string;
  expiresIn: number;
};

/**
 * Parameters for confirming device registration
 */
export type ConfirmDeviceRegistrationParams = {
  code: string;
  name: string;
  type: string;
  organizationId?: string;
  watchPaths?: string[];
};

/**
 * Response after confirming device registration
 */
export type ConfirmDeviceRegistrationResponse = {
  success: boolean;
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
  // Device CRUD (note: devices are created via Agent only, no createDevice method)
  getDevices(query?: DeviceListQuery): Promise<DeviceListResponse>;
  getDevice(id: string): Promise<Device>;
  updateDevice(id: string, params: UpdateDeviceParams): Promise<Device>;
  deleteDevice(id: string): Promise<boolean>;

  // Device enable/disable
  enableDevice(id: string): Promise<Device>;
  disableDevice(id: string): Promise<Device>;

  // Device topics
  getDeviceTopics(id: string): Promise<DeviceTopic[]>;

  // Device token
  generateDeviceToken(id: string): Promise<DeviceTokenResponse>;

  // Device agent info
  getDeviceAgentInfo(id: string): Promise<DeviceAgentInfo>;

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

  // Device registration (public endpoints - no auth required)
  getDeviceRegistrationInfo(code: string): Promise<DeviceRegistrationInfo>;
  confirmDeviceRegistration(
    params: ConfirmDeviceRegistrationParams,
  ): Promise<ConfirmDeviceRegistrationResponse>;
}
