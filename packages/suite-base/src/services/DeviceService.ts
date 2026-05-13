// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ApiClient } from "@lichtblick/suite-base/services/ApiClient";
import {
  ConfirmDeviceRegistrationParams,
  ConfirmDeviceRegistrationResponse,
  CreateDeviceEventParams,
  Device,
  DeviceAgentInfo,
  DeviceEvent,
  DeviceEventListQuery,
  DeviceEventListResponse,
  DeviceListQuery,
  DeviceListResponse,
  DeviceRegistrationInfo,
  DeviceSystemInfo,
  DeviceTopic,
  DeviceTokenResponse,
  IDeviceService,
  UpdateDeviceEventParams,
  UpdateDeviceParams,
} from "@lichtblick/suite-base/services/IDeviceService";

/**
 * API response types (with null for optional fields)
 */

// Generic API response wrapper
type ApiResponse<T> = {
  data: T;
};

type DeviceApiResponse = {
  id: string;
  name: string;
  type: string;
  model: string | null;
  serialNumber: string | null;
  firmwareVersion: string | null;
  location: string | null;
  ipAddress: string | null;
  status: "online" | "offline" | "error";
  enabled: boolean;
  lastSeen: string | null;
  agentVersion: string | null;
  agentStatus: "running" | "stopped" | "error" | null;
  agentUptime: number | null;
  cpuUsage: number | null;
  memoryUsage: number | null;
  diskUsage: number | null;
  rosDistro: string | null;
  rosNodeCount: number | null;
  rosTopicCount: number | null;
  createdAt: string;
  updatedAt: string;
};

type DeviceListApiResponse = {
  data: DeviceApiResponse[];
  total: number;
  page: number;
  pageSize: number;
};

type DeviceTopicApiResponse = {
  id: string;
  name: string;
  type: string;
  frequency: number | null;
};

type DeviceEventApiResponse = {
  id: string;
  deviceId: string;
  eventType: "maintenance" | "upgrade" | "repair" | "replacement" | "inspection" | "other";
  description: string;
  startTime: string;
  duration: number;
  metadata: Record<string, string>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

type DeviceEventListApiResponse = {
  data: DeviceEventApiResponse[];
  total: number;
  page: number;
  pageSize: number;
};

type DeviceAgentInfoApiResponse = {
  agentInfo: {
    version: string | null;
    status: "running" | "stopped" | "error" | null;
    uptime: number | null;
    lastHeartbeat: string | null;
  };
  systemInfo: {
    cpuUsage: number | null;
    memoryUsage: number | null;
    diskUsage: number | null;
    rosDistro: string | null;
    rosNodeCount: number | null;
    rosTopicCount: number | null;
  };
};

type DeviceRegistrationInfoApiResponse = {
  code: string;
  machineId: string;
  hostname: string | null;
  platform: string | null;
  ipAddress: string | null;
  systemInfo: {
    cpuCores: number | null;
    cpuModel: string | null;
    memoryGB: number | null;
    diskGB: number | null;
    osName: string | null;
    kernelVersion: string | null;
  } | null;
  expiresAt: string;
  expiresIn: number;
};

type ConfirmDeviceRegistrationApiResponse = {
  success: boolean;
};

/**
 * Device service implementation using flora-server API
 */
export class DeviceService implements IDeviceService {
  private readonly apiClient: ApiClient;

  public constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  // ===== Device CRUD =====

  public async getDevices(query?: DeviceListQuery): Promise<DeviceListResponse> {
    const params = new URLSearchParams();
    if (query?.orgId != undefined) {
      params.set("orgId", query.orgId);
    }
    if (query?.search != undefined) {
      params.set("search", query.search);
    }
    if (query?.status != undefined) {
      params.set("status", query.status);
    }
    if (query?.page != undefined) {
      params.set("page", String(query.page));
    }
    if (query?.pageSize != undefined) {
      params.set("pageSize", String(query.pageSize));
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/api/devices?${queryString}` : "/api/devices";

    const response = await this.apiClient.get<DeviceListApiResponse>(endpoint);
    return {
      data: response.data.map(this.toDevice),
      total: response.total,
      page: response.page,
      pageSize: response.pageSize,
    };
  }

  public async getDevice(id: string): Promise<Device> {
    const response = await this.apiClient.get<ApiResponse<DeviceApiResponse>>(
      `/api/devices/${id}`,
    );
    return this.toDevice(response.data);
  }

  public async updateDevice(id: string, params: UpdateDeviceParams): Promise<Device> {
    const response = await this.apiClient.request<ApiResponse<DeviceApiResponse>>(
      `/api/devices/${id}`,
      {
        method: "PUT",
        body: params,
      },
    );
    return this.toDevice(response.data);
  }

  public async deleteDevice(id: string): Promise<boolean> {
    const response = await this.apiClient.delete<{ success: boolean }>(`/api/devices/${id}`);
    return response.success;
  }

  // ===== Device Enable/Disable =====

  public async enableDevice(id: string): Promise<Device> {
    const response = await this.apiClient.post<ApiResponse<DeviceApiResponse>>(
      `/api/devices/${id}/enable`,
    );
    return this.toDevice(response.data);
  }

  public async disableDevice(id: string): Promise<Device> {
    const response = await this.apiClient.post<ApiResponse<DeviceApiResponse>>(
      `/api/devices/${id}/disable`,
    );
    return this.toDevice(response.data);
  }

  // ===== Device Topics =====

  public async getDeviceTopics(id: string): Promise<DeviceTopic[]> {
    const response = await this.apiClient.get<ApiResponse<DeviceTopicApiResponse[]>>(
      `/api/devices/${id}/topics`,
    );
    return response.data.map(this.toDeviceTopic);
  }

  // ===== Device Token =====

  public async generateDeviceToken(id: string): Promise<DeviceTokenResponse> {
    const response = await this.apiClient.post<ApiResponse<DeviceTokenResponse>>(
      `/api/devices/${id}/regenerate-token`,
    );
    return response.data;
  }

  // ===== Device Agent Info =====

  public async getDeviceAgentInfo(id: string): Promise<DeviceAgentInfo> {
    const response = await this.apiClient.get<ApiResponse<DeviceAgentInfoApiResponse>>(
      `/api/devices/${id}/agent`,
    );
    return this.toDeviceAgentInfo(response.data);
  }

  // ===== Device Events =====

  public async getDeviceEvents(
    deviceId: string,
    query?: DeviceEventListQuery,
  ): Promise<DeviceEventListResponse> {
    const params = new URLSearchParams();
    if (query?.eventType != undefined) {
      params.set("eventType", query.eventType);
    }
    if (query?.startDate != undefined) {
      params.set("startDate", query.startDate);
    }
    if (query?.endDate != undefined) {
      params.set("endDate", query.endDate);
    }
    if (query?.page != undefined) {
      params.set("page", String(query.page));
    }
    if (query?.pageSize != undefined) {
      params.set("pageSize", String(query.pageSize));
    }

    const queryString = params.toString();
    const endpoint = queryString
      ? `/api/devices/${deviceId}/events?${queryString}`
      : `/api/devices/${deviceId}/events`;

    const response = await this.apiClient.get<DeviceEventListApiResponse>(endpoint);
    return {
      data: response.data.map(this.toDeviceEvent),
      total: response.total,
      page: response.page,
      pageSize: response.pageSize,
    };
  }

  public async getDeviceEvent(deviceId: string, eventId: string): Promise<DeviceEvent> {
    const response = await this.apiClient.get<ApiResponse<DeviceEventApiResponse>>(
      `/api/devices/${deviceId}/events/${eventId}`,
    );
    return this.toDeviceEvent(response.data);
  }

  public async createDeviceEvent(
    deviceId: string,
    params: CreateDeviceEventParams,
  ): Promise<DeviceEvent> {
    const response = await this.apiClient.post<ApiResponse<DeviceEventApiResponse>>(
      `/api/devices/${deviceId}/events`,
      params,
    );
    return this.toDeviceEvent(response.data);
  }

  public async updateDeviceEvent(
    deviceId: string,
    eventId: string,
    params: UpdateDeviceEventParams,
  ): Promise<DeviceEvent> {
    const response = await this.apiClient.request<ApiResponse<DeviceEventApiResponse>>(
      `/api/devices/${deviceId}/events/${eventId}`,
      {
        method: "PATCH",
        body: params,
      },
    );
    return this.toDeviceEvent(response.data);
  }

  public async deleteDeviceEvent(deviceId: string, eventId: string): Promise<boolean> {
    const response = await this.apiClient.delete<{ success: boolean }>(
      `/api/devices/${deviceId}/events/${eventId}`,
    );
    return response.success;
  }

  // ===== Device Registration (public endpoints) =====

  public async getDeviceRegistrationInfo(code: string): Promise<DeviceRegistrationInfo> {
    // This endpoint requires user authentication
    const response = await this.apiClient.get<ApiResponse<DeviceRegistrationInfoApiResponse>>(
      `/api/device/register/info?code=${encodeURIComponent(code)}`,
    );
    return this.toDeviceRegistrationInfo(response.data);
  }

  public async confirmDeviceRegistration(
    params: ConfirmDeviceRegistrationParams,
  ): Promise<ConfirmDeviceRegistrationResponse> {
    const response = await this.apiClient.post<ApiResponse<ConfirmDeviceRegistrationApiResponse>>(
      `/api/device/register/confirm`,
      params,
    );
    return {
      success: response.data.success,
    };
  }

  // ===== Converters =====

  private toDevice = (response: DeviceApiResponse): Device => ({
    id: response.id,
    name: response.name,
    type: response.type,
    model: response.model ?? undefined,
    serialNumber: response.serialNumber ?? undefined,
    firmwareVersion: response.firmwareVersion ?? undefined,
    location: response.location ?? undefined,
    ipAddress: response.ipAddress ?? undefined,
    status: response.status,
    enabled: response.enabled,
    lastSeen: response.lastSeen ?? undefined,
    agentVersion: response.agentVersion ?? undefined,
    agentStatus: response.agentStatus ?? undefined,
    agentUptime: response.agentUptime ?? undefined,
    cpuUsage: response.cpuUsage ?? undefined,
    memoryUsage: response.memoryUsage ?? undefined,
    diskUsage: response.diskUsage ?? undefined,
    rosDistro: response.rosDistro ?? undefined,
    rosNodeCount: response.rosNodeCount ?? undefined,
    rosTopicCount: response.rosTopicCount ?? undefined,
    createdAt: response.createdAt,
    updatedAt: response.updatedAt,
  });

  private toDeviceTopic = (response: DeviceTopicApiResponse): DeviceTopic => ({
    id: response.id,
    name: response.name,
    type: response.type,
    frequency: response.frequency ?? undefined,
  });

  private toDeviceEvent = (response: DeviceEventApiResponse): DeviceEvent => ({
    id: response.id,
    deviceId: response.deviceId,
    eventType: response.eventType,
    description: response.description,
    startTime: response.startTime,
    duration: response.duration,
    metadata: response.metadata,
    createdBy: response.createdBy,
    createdAt: response.createdAt,
    updatedAt: response.updatedAt,
  });

  private toDeviceAgentInfo = (response: DeviceAgentInfoApiResponse): DeviceAgentInfo => ({
    agentInfo: {
      version: response.agentInfo.version ?? undefined,
      status: response.agentInfo.status ?? undefined,
      uptime: response.agentInfo.uptime ?? undefined,
      lastHeartbeat: response.agentInfo.lastHeartbeat ?? undefined,
    },
    systemInfo: {
      cpuUsage: response.systemInfo.cpuUsage ?? undefined,
      memoryUsage: response.systemInfo.memoryUsage ?? undefined,
      diskUsage: response.systemInfo.diskUsage ?? undefined,
      rosDistro: response.systemInfo.rosDistro ?? undefined,
      rosNodeCount: response.systemInfo.rosNodeCount ?? undefined,
      rosTopicCount: response.systemInfo.rosTopicCount ?? undefined,
    },
  });

  private toDeviceRegistrationInfo = (
    response: DeviceRegistrationInfoApiResponse,
  ): DeviceRegistrationInfo => {
    let systemInfo: DeviceSystemInfo | undefined;
    if (response.systemInfo != undefined) {
      systemInfo = {
        cpuCores: response.systemInfo.cpuCores ?? undefined,
        cpuModel: response.systemInfo.cpuModel ?? undefined,
        memoryGB: response.systemInfo.memoryGB ?? undefined,
        diskGB: response.systemInfo.diskGB ?? undefined,
        osName: response.systemInfo.osName ?? undefined,
        kernelVersion: response.systemInfo.kernelVersion ?? undefined,
      };
    }
    return {
      code: response.code,
      machineId: response.machineId,
      hostname: response.hostname ?? undefined,
      platform: response.platform ?? undefined,
      ipAddress: response.ipAddress ?? undefined,
      systemInfo,
      expiresAt: response.expiresAt,
      expiresIn: response.expiresIn,
    };
  };
}
