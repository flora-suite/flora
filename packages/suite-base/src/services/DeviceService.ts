// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ApiClient } from "@lichtblick/suite-base/services/ApiClient";
import {
  CreateDeviceEventParams,
  CreateDeviceParams,
  Device,
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

/**
 * API response types (with null for optional fields)
 */
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
    const response = await this.apiClient.get<DeviceApiResponse>(`/api/devices/${id}`);
    return this.toDevice(response);
  }

  public async createDevice(params: CreateDeviceParams): Promise<Device> {
    const response = await this.apiClient.post<DeviceApiResponse>("/api/devices", params);
    return this.toDevice(response);
  }

  public async updateDevice(id: string, params: UpdateDeviceParams): Promise<Device> {
    const response = await this.apiClient.request<DeviceApiResponse>(`/api/devices/${id}`, {
      method: "PATCH",
      body: params,
    });
    return this.toDevice(response);
  }

  public async deleteDevice(id: string): Promise<boolean> {
    const response = await this.apiClient.delete<{ deleted: boolean }>(`/api/devices/${id}`);
    return response.deleted;
  }

  // ===== Device Topics =====

  public async getDeviceTopics(id: string): Promise<DeviceTopic[]> {
    const response = await this.apiClient.get<DeviceTopicApiResponse[]>(
      `/api/devices/${id}/topics`,
    );
    return response.map(this.toDeviceTopic);
  }

  // ===== Device Token =====

  public async generateDeviceToken(id: string): Promise<DeviceTokenResponse> {
    return this.apiClient.post<DeviceTokenResponse>(`/api/devices/${id}/token`);
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
    const response = await this.apiClient.get<DeviceEventApiResponse>(
      `/api/devices/${deviceId}/events/${eventId}`,
    );
    return this.toDeviceEvent(response);
  }

  public async createDeviceEvent(
    deviceId: string,
    params: CreateDeviceEventParams,
  ): Promise<DeviceEvent> {
    const response = await this.apiClient.post<DeviceEventApiResponse>(
      `/api/devices/${deviceId}/events`,
      params,
    );
    return this.toDeviceEvent(response);
  }

  public async updateDeviceEvent(
    deviceId: string,
    eventId: string,
    params: UpdateDeviceEventParams,
  ): Promise<DeviceEvent> {
    const response = await this.apiClient.request<DeviceEventApiResponse>(
      `/api/devices/${deviceId}/events/${eventId}`,
      {
        method: "PATCH",
        body: params,
      },
    );
    return this.toDeviceEvent(response);
  }

  public async deleteDeviceEvent(deviceId: string, eventId: string): Promise<boolean> {
    const response = await this.apiClient.delete<{ deleted: boolean }>(
      `/api/devices/${deviceId}/events/${eventId}`,
    );
    return response.deleted;
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
}
