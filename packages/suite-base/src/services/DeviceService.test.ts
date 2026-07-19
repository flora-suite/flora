// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { DeviceService } from "./DeviceService";

const device = {
  id: "device-1",
  name: "Device",
  type: "robot",
  model: null,
  serialNumber: null,
  firmwareVersion: null,
  location: null,
  ipAddress: null,
  status: "online" as const,
  enabled: true,
  lastSeen: null,
  agentVersion: null,
  agentStatus: null,
  agentUptime: null,
  cpuUsage: null,
  memoryUsage: null,
  diskUsage: null,
  rosDistro: null,
  rosNodeCount: null,
  rosTopicCount: null,
  createdAt: "created",
  updatedAt: "updated",
};

describe("DeviceService", () => {
  const apiClient = {
    get: jest.fn(),
    post: jest.fn(),
    request: jest.fn(),
    delete: jest.fn(),
  };
  const service = new DeviceService(apiClient as never);

  beforeEach(() => jest.clearAllMocks());

  it("serializes device list filters and converts nullable API fields", async () => {
    apiClient.get.mockResolvedValue({ data: [device], total: 1, page: 2, pageSize: 20 });

    const result = await service.getDevices({
      orgId: "org",
      search: "robot",
      status: "online",
      page: 2,
      pageSize: 20,
    });

    expect(apiClient.get).toHaveBeenCalledWith(
      "/api/devices?orgId=org&search=robot&status=online&page=2&pageSize=20",
    );
    expect(result).toMatchObject({
      data: [
        {
          id: "device-1",
          model: undefined,
          serialNumber: undefined,
          agentStatus: undefined,
        },
      ],
      total: 1,
      page: 2,
      pageSize: 20,
    });
  });

  it("uses the base endpoint without optional device filters", async () => {
    apiClient.get.mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 10 });

    await service.getDevices();

    expect(apiClient.get).toHaveBeenCalledWith("/api/devices");
  });

  it("maps device CRUD, topic, token, and agent endpoints", async () => {
    apiClient.get
      .mockResolvedValueOnce({ data: device })
      .mockResolvedValueOnce({
        data: [{ id: "topic", name: "/topic", type: "std_msgs/String", frequency: null }],
      })
      .mockResolvedValueOnce({
        data: {
          agentInfo: { version: null, status: null, uptime: null, lastHeartbeat: null },
          systemInfo: {
            cpuUsage: null,
            memoryUsage: null,
            diskUsage: null,
            rosDistro: null,
            rosNodeCount: null,
            rosTopicCount: null,
          },
        },
      });
    apiClient.request.mockResolvedValue({ data: device });
    apiClient.post
      .mockResolvedValueOnce({ data: device })
      .mockResolvedValueOnce({ data: { token: "token" } });
    apiClient.delete.mockResolvedValue({ success: true });

    await expect(service.getDevice("id")).resolves.toMatchObject({
      id: "device-1",
      model: undefined,
    });
    await expect(service.updateDevice("id", { name: "updated" } as never)).resolves.toMatchObject({
      id: "device-1",
    });
    await expect(service.enableDevice("id")).resolves.toMatchObject({ id: "device-1" });
    await expect(service.deleteDevice("id")).resolves.toBe(true);
    await expect(service.getDeviceTopics("id")).resolves.toEqual([
      { id: "topic", name: "/topic", type: "std_msgs/String", frequency: undefined },
    ]);
    await expect(service.generateDeviceToken("id")).resolves.toEqual({ token: "token" });
    await expect(service.getDeviceAgentInfo("id")).resolves.toEqual({
      agentInfo: {
        version: undefined,
        status: undefined,
        uptime: undefined,
        lastHeartbeat: undefined,
      },
      systemInfo: {
        cpuUsage: undefined,
        memoryUsage: undefined,
        diskUsage: undefined,
        rosDistro: undefined,
        rosNodeCount: undefined,
        rosTopicCount: undefined,
      },
    });
    expect(apiClient.request).toHaveBeenCalledWith("/api/devices/id", {
      method: "PUT",
      body: { name: "updated" },
    });
  });

  it("converts registration information without optional system information", async () => {
    apiClient.get.mockResolvedValue({
      data: {
        code: "code",
        machineId: "machine",
        hostname: null,
        platform: null,
        ipAddress: null,
        systemInfo: null,
        expiresAt: "later",
        expiresIn: 60,
      },
    });

    await expect(service.getDeviceRegistrationInfo("a b")).resolves.toEqual({
      code: "code",
      machineId: "machine",
      hostname: undefined,
      platform: undefined,
      ipAddress: undefined,
      systemInfo: undefined,
      expiresAt: "later",
      expiresIn: 60,
    });
    expect(apiClient.get).toHaveBeenCalledWith("/api/device/register/info?code=a%20b");
  });

  it("serializes device event filters and maps event mutation responses", async () => {
    const event = {
      id: "event",
      deviceId: "device",
      eventType: "maintenance" as const,
      description: "service",
      startTime: "start",
      duration: 5,
      metadata: { source: "test" },
      createdBy: "user",
      createdAt: "created",
      updatedAt: "updated",
    };
    apiClient.get.mockResolvedValue({ data: [event], total: 1, page: 3, pageSize: 10 });
    apiClient.post.mockResolvedValue({ data: event });
    apiClient.request.mockResolvedValue({ data: event });
    apiClient.delete.mockResolvedValue({ success: true });

    await expect(
      service.getDeviceEvents("device", {
        eventType: "maintenance",
        startDate: "start",
        endDate: "end",
        page: 3,
        pageSize: 10,
      }),
    ).resolves.toMatchObject({ data: [event], total: 1, page: 3, pageSize: 10 });
    await expect(
      service.createDeviceEvent("device", { description: "service" } as never),
    ).resolves.toEqual(event);
    await expect(
      service.updateDeviceEvent("device", "event", { description: "updated" } as never),
    ).resolves.toEqual(event);
    await expect(service.deleteDeviceEvent("device", "event")).resolves.toBe(true);
    expect(apiClient.get).toHaveBeenCalledWith(
      "/api/devices/device/events?eventType=maintenance&startDate=start&endDate=end&page=3&pageSize=10",
    );
    expect(apiClient.request).toHaveBeenCalledWith("/api/devices/device/events/event", {
      method: "PATCH",
      body: { description: "updated" },
    });
  });
});
