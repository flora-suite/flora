// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { EventService } from "./EventService";

const event = {
  id: "event-1",
  deviceId: "device-1",
  deviceName: null,
  eventType: "maintenance" as const,
  description: "Replace battery",
  startTime: "2026-07-20T00:00:00Z",
  duration: 30,
  metadata: { source: "test" },
  createdBy: "user-1",
  createdAt: "2026-07-20T00:00:00Z",
  updatedAt: "2026-07-20T00:00:00Z",
};

describe("EventService", () => {
  const apiClient = {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  };
  const service = new EventService(apiClient as never);

  beforeEach(() => jest.clearAllMocks());

  it("serializes all list filters and calculates total pages", async () => {
    apiClient.get.mockResolvedValue({ data: [event], total: 21, page: 2, pageSize: 10 });

    await expect(
      service.getEvents({
        orgId: "org",
        deviceId: "device",
        eventType: "maintenance",
        startDate: "start",
        endDate: "end",
        search: "battery",
        page: 2,
        pageSize: 10,
      }),
    ).resolves.toEqual({
      events: [event],
      totalEvents: 21,
      page: 2,
      pageSize: 10,
      totalPages: 3,
    });
    expect(apiClient.get).toHaveBeenCalledWith(
      "/api/events?orgId=org&page=2&pageSize=10&deviceId=device&eventType=maintenance&startDate=start&endDate=end&search=battery",
    );
  });

  it("uses the base endpoint when no list filters are supplied", async () => {
    apiClient.get.mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 20 });

    await service.getEvents();

    expect(apiClient.get).toHaveBeenCalledWith("/api/events");
  });

  it("maps event CRUD API responses", async () => {
    apiClient.get.mockResolvedValue({ data: event });
    apiClient.post.mockResolvedValue({ data: event });
    apiClient.patch.mockResolvedValue({ data: event });
    apiClient.delete.mockResolvedValue(undefined);

    await expect(service.getEvent("event-1")).resolves.toEqual(event);
    await expect(service.createEvent({ description: "Replace battery" } as never)).resolves.toEqual(
      event,
    );
    await expect(service.updateEvent("event-1", { duration: 45 })).resolves.toEqual(event);
    await expect(service.deleteEvent("event-1")).resolves.toBe(true);
    expect(apiClient.get).toHaveBeenCalledWith("/api/events/event-1");
    expect(apiClient.post).toHaveBeenCalledWith("/api/events", { description: "Replace battery" });
    expect(apiClient.patch).toHaveBeenCalledWith("/api/events/event-1", { duration: 45 });
    expect(apiClient.delete).toHaveBeenCalledWith("/api/events/event-1");
  });
});
