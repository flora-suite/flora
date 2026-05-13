// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import type { ApiClient } from "@lichtblick/suite-base/services/ApiClient";

import type {
  CreateEventInput,
  DeviceEvent,
  EventListQuery,
  EventListResponse,
  IEventService,
  UpdateEventInput,
} from "./IEventService";

/**
 * API response format from flora-server
 */
interface ApiEventListResponse {
  data: DeviceEvent[];
  total: number;
  page: number;
  pageSize: number;
}

interface ApiEventResponse {
  data: DeviceEvent;
}

/**
 * EventService implementation that uses ApiClient for API communication
 */
export class EventService implements IEventService {
  readonly #apiClient: ApiClient;

  public constructor(apiClient: ApiClient) {
    this.#apiClient = apiClient;
  }

  public async getEvents(query?: EventListQuery): Promise<EventListResponse> {
    const params = new URLSearchParams();

    if (query?.orgId != undefined) {
      params.set("orgId", query.orgId);
    }
    if (query?.page != undefined) {
      params.set("page", query.page.toString());
    }
    if (query?.pageSize != undefined) {
      params.set("pageSize", query.pageSize.toString());
    }
    if (query?.deviceId) {
      params.set("deviceId", query.deviceId);
    }
    if (query?.eventType) {
      params.set("eventType", query.eventType);
    }
    if (query?.startDate) {
      params.set("startDate", query.startDate);
    }
    if (query?.endDate) {
      params.set("endDate", query.endDate);
    }
    if (query?.search) {
      params.set("search", query.search);
    }

    const endpoint = `/api/events${params.toString() ? `?${params.toString()}` : ""}`;
    const apiResponse = await this.#apiClient.get<ApiEventListResponse>(endpoint);

    return {
      events: apiResponse.data,
      totalEvents: apiResponse.total,
      page: apiResponse.page,
      pageSize: apiResponse.pageSize,
      totalPages: Math.ceil(apiResponse.total / apiResponse.pageSize),
    };
  }

  public async getEvent(id: string): Promise<DeviceEvent> {
    const response = await this.#apiClient.get<ApiEventResponse>(`/api/events/${id}`);
    return response.data;
  }

  public async createEvent(input: CreateEventInput): Promise<DeviceEvent> {
    const response = await this.#apiClient.post<ApiEventResponse>("/api/events", input);
    return response.data;
  }

  public async updateEvent(id: string, input: UpdateEventInput): Promise<DeviceEvent> {
    const response = await this.#apiClient.patch<ApiEventResponse>(`/api/events/${id}`, input);
    return response.data;
  }

  public async deleteEvent(id: string): Promise<boolean> {
    await this.#apiClient.delete(`/api/events/${id}`);
    return true;
  }
}
