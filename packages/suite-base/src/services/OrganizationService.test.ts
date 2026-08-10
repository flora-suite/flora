// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { OrganizationService } from "./OrganizationService";

describe("OrganizationService", () => {
  const apiClient = { get: jest.fn(), post: jest.fn(), request: jest.fn(), delete: jest.fn() };
  const service = new OrganizationService(apiClient as never);

  beforeEach(() => jest.clearAllMocks());

  it("maps nullable organization fields and performs organization mutations", async () => {
    const organization = {
      id: "org",
      name: "Organization",
      slug: "organization",
      description: null,
      avatar: null,
      role: "owner",
      createdAt: "created",
      updatedAt: "updated",
    };
    apiClient.get.mockResolvedValue({ data: [organization] });
    apiClient.post.mockResolvedValue({ data: organization });
    apiClient.request.mockResolvedValue({ data: organization });
    apiClient.delete.mockResolvedValue({ success: true });

    await expect(service.getOrganizations()).resolves.toEqual([
      { ...organization, description: undefined, avatar: undefined },
    ]);
    await expect(
      service.createOrganization({ name: "Organization" } as never),
    ).resolves.toMatchObject({
      id: "org",
    });
    await expect(
      service.updateOrganization("org", { name: "Updated" } as never),
    ).resolves.toMatchObject({
      id: "org",
    });
    await expect(service.deleteOrganization("org")).resolves.toBe(true);
    expect(apiClient.request).toHaveBeenCalledWith("/api/orgs/org", {
      method: "PATCH",
      body: { name: "Updated" },
    });
  });

  it("maps members and uses member endpoints", async () => {
    const member = {
      userId: "user",
      email: "user@example.com",
      name: null,
      avatar: null,
      role: "member",
      joinedAt: "joined",
    };
    apiClient.get.mockResolvedValue({ data: [member] });
    apiClient.post.mockResolvedValue({ data: member });
    apiClient.request.mockResolvedValue({ data: member });
    apiClient.delete.mockResolvedValue({ success: true });

    await expect(service.getMembers("org")).resolves.toEqual([
      { ...member, name: undefined, avatar: undefined },
    ]);
    await expect(service.addMember("org", { email: member.email } as never)).resolves.toMatchObject(
      {
        userId: "user",
      },
    );
    await expect(
      service.updateMemberRole("org", "user", { role: "admin" } as never),
    ).resolves.toMatchObject({
      role: "member",
    });
    await expect(service.removeMember("org", "user")).resolves.toBe(true);
    expect(apiClient.request).toHaveBeenCalledWith("/api/orgs/org/members/user", {
      method: "PATCH",
      body: { role: "admin" },
    });
  });

  it("passes through storage, API key, extension, and extension-setting responses", async () => {
    const extension = { id: "extension", name: "Extension" };
    apiClient.get
      .mockResolvedValueOnce({ data: { usedBytes: 1 } })
      .mockResolvedValueOnce({ data: [{ id: "key" }] })
      .mockResolvedValueOnce({ data: [extension] })
      .mockResolvedValueOnce({ data: extension })
      .mockResolvedValueOnce({ data: [{ extensionId: "extension", enabled: true }] });
    apiClient.post
      .mockResolvedValueOnce({ data: { id: "key", token: "secret" } })
      .mockResolvedValueOnce({ data: extension })
      .mockResolvedValueOnce({ data: extension });
    apiClient.request.mockResolvedValue({ data: { extensionId: "extension", enabled: false } });
    apiClient.delete.mockResolvedValue({ success: true });

    await expect(service.getStorageStats("org")).resolves.toEqual({ usedBytes: 1 });
    await expect(service.getApiKeys("org")).resolves.toEqual([{ id: "key" }]);
    await expect(service.createApiKey("org", "key")).resolves.toEqual({
      id: "key",
      token: "secret",
    });
    await expect(service.getExtensions("org", "approved" as never)).resolves.toEqual([extension]);
    await expect(service.getExtension("org", "extension")).resolves.toEqual(extension);
    await expect(service.uploadExtension("org", {} as never)).resolves.toEqual(extension);
    await expect(service.reviewExtension("org", "extension", {} as never)).resolves.toEqual(
      extension,
    );
    await expect(service.getExtensionSettings("org")).resolves.toEqual([
      { extensionId: "extension", enabled: true },
    ]);
    await expect(service.updateExtensionSetting("org", "extension", {} as never)).resolves.toEqual({
      extensionId: "extension",
      enabled: false,
    });
    await expect(service.deleteApiKey("org", "key")).resolves.toBe(true);
    await expect(service.deleteExtension("org", "extension")).resolves.toBe(true);
    expect(apiClient.get).toHaveBeenCalledWith("/api/orgs/org/extensions?status=approved");
    expect(apiClient.request).toHaveBeenCalledWith("/api/orgs/org/extension-settings/extension", {
      method: "PUT",
      body: {},
    });
  });
});
