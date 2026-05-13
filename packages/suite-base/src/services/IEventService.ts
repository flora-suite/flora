// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

/**
 * Event type categories
 */
export type EventType = "maintenance" | "upgrade" | "repair" | "replacement" | "inspection" | "other";

/**
 * Device event data structure
 */
export interface DeviceEvent {
  id: string;
  deviceId: string;
  deviceName: string | null;
  eventType: EventType;
  description: string;
  startTime: string; // ISO string
  duration: number; // minutes
  metadata: Record<string, string>;
  createdBy: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

/**
 * Event list query parameters
 */
export interface EventListQuery {
  orgId?: string;
  deviceId?: string;
  eventType?: EventType;
  startDate?: string; // ISO string
  endDate?: string; // ISO string
  search?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Event list response
 */
export interface EventListResponse {
  events: DeviceEvent[];
  totalEvents: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Create event input
 */
export interface CreateEventInput {
  deviceId: string;
  eventType: EventType;
  description: string;
  startTime: string; // ISO string
  duration: number; // minutes
  metadata?: Record<string, string>;
}

/**
 * Update event input
 */
export interface UpdateEventInput {
  eventType?: EventType;
  description?: string;
  startTime?: string; // ISO string
  duration?: number; // minutes
  metadata?: Record<string, string>;
}

/**
 * Event service interface
 */
export interface IEventService {
  /**
   * Get events list for the current user (across all devices)
   */
  getEvents(query?: EventListQuery): Promise<EventListResponse>;

  /**
   * Get a specific event by ID
   */
  getEvent(id: string): Promise<DeviceEvent>;

  /**
   * Create a new event
   */
  createEvent(input: CreateEventInput): Promise<DeviceEvent>;

  /**
   * Update an existing event
   */
  updateEvent(id: string, input: UpdateEventInput): Promise<DeviceEvent>;

  /**
   * Delete an event
   */
  deleteEvent(id: string): Promise<boolean>;
}
