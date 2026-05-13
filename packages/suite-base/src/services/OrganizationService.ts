// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ApiClient } from "@lichtblick/suite-base/services/ApiClient";
import {
  AddMemberInput,
  ApiKey,
  CheckCanDeleteResponse,
  CreateApiKeyResponse,
  CreateOrganizationInput,
  ExtensionSetting,
  ExtensionStatus,
  IOrganizationService,
  Organization,
  OrgExtension,
  OrgMember,
  OrgRole,
  ReviewExtensionInput,
  StorageStatsResponse,
  UpdateExtensionSettingInput,
  UpdateMemberRoleInput,
  UpdateOrganizationInput,
  UploadExtensionInput,
} from "@lichtblick/suite-base/services/IOrganizationService";

/**
 * API response types (with null for optional fields)
 */

type ApiResponse<T> = {
  data: T;
};

type OrganizationApiResponse = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  avatar: string | null;
  role: OrgRole;
  createdAt: string;
  updatedAt: string;
};

type OrgMemberApiResponse = {
  userId: string;
  email: string;
  name: string | null;
  avatar: string | null;
  role: OrgRole;
  joinedAt: string;
};

/**
 * Organization service implementation using flora-server API
 */
export class OrganizationService implements IOrganizationService {
  readonly #apiClient: ApiClient;

  public constructor(apiClient: ApiClient) {
    this.#apiClient = apiClient;
  }

  // ===== Organization CRUD =====

  public async getOrganizations(): Promise<Organization[]> {
    const response =
      await this.#apiClient.get<ApiResponse<OrganizationApiResponse[]>>("/api/orgs");
    return response.data.map(this.#toOrganization);
  }

  public async getOrganization(id: string): Promise<Organization> {
    const response = await this.#apiClient.get<ApiResponse<OrganizationApiResponse>>(
      `/api/orgs/${id}`,
    );
    return this.#toOrganization(response.data);
  }

  public async createOrganization(input: CreateOrganizationInput): Promise<Organization> {
    const response = await this.#apiClient.post<ApiResponse<OrganizationApiResponse>>(
      "/api/orgs",
      input,
    );
    return this.#toOrganization(response.data);
  }

  public async updateOrganization(
    id: string,
    input: UpdateOrganizationInput,
  ): Promise<Organization> {
    const response = await this.#apiClient.request<ApiResponse<OrganizationApiResponse>>(
      `/api/orgs/${id}`,
      {
        method: "PATCH",
        body: input,
      },
    );
    return this.#toOrganization(response.data);
  }

  public async checkCanDelete(id: string): Promise<CheckCanDeleteResponse> {
    const response = await this.#apiClient.get<ApiResponse<CheckCanDeleteResponse>>(
      `/api/orgs/${id}/can-delete`,
    );
    return response.data;
  }

  public async deleteOrganization(id: string): Promise<boolean> {
    const response = await this.#apiClient.delete<{ success: boolean }>(`/api/orgs/${id}`);
    return response.success;
  }

  // ===== Organization Members =====

  public async getMembers(orgId: string): Promise<OrgMember[]> {
    const response = await this.#apiClient.get<ApiResponse<OrgMemberApiResponse[]>>(
      `/api/orgs/${orgId}/members`,
    );
    return response.data.map(this.#toOrgMember);
  }

  public async addMember(orgId: string, input: AddMemberInput): Promise<OrgMember> {
    const response = await this.#apiClient.post<ApiResponse<OrgMemberApiResponse>>(
      `/api/orgs/${orgId}/members`,
      input,
    );
    return this.#toOrgMember(response.data);
  }

  public async updateMemberRole(
    orgId: string,
    userId: string,
    input: UpdateMemberRoleInput,
  ): Promise<OrgMember> {
    const response = await this.#apiClient.request<ApiResponse<OrgMemberApiResponse>>(
      `/api/orgs/${orgId}/members/${userId}`,
      {
        method: "PATCH",
        body: input,
      },
    );
    return this.#toOrgMember(response.data);
  }

  public async removeMember(orgId: string, userId: string): Promise<boolean> {
    const response = await this.#apiClient.delete<{ success: boolean }>(
      `/api/orgs/${orgId}/members/${userId}`,
    );
    return response.success;
  }

  // ===== Storage Stats =====

  public async getStorageStats(orgId: string): Promise<StorageStatsResponse> {
    const response = await this.#apiClient.get<ApiResponse<StorageStatsResponse>>(
      `/api/orgs/${orgId}/storage`,
    );
    return response.data;
  }

  // ===== API Keys =====

  public async getApiKeys(orgId: string): Promise<ApiKey[]> {
    const response = await this.#apiClient.get<ApiResponse<ApiKey[]>>(
      `/api/orgs/${orgId}/api-keys`,
    );
    return response.data;
  }

  public async createApiKey(orgId: string, name: string): Promise<CreateApiKeyResponse> {
    const response = await this.#apiClient.post<ApiResponse<CreateApiKeyResponse>>(
      `/api/orgs/${orgId}/api-keys`,
      { name },
    );
    return response.data;
  }

  public async deleteApiKey(orgId: string, keyId: string): Promise<boolean> {
    const response = await this.#apiClient.delete<{ success: boolean }>(
      `/api/orgs/${orgId}/api-keys/${keyId}`,
    );
    return response.success;
  }

  // ===== Extensions =====

  public async getExtensions(orgId: string, status?: ExtensionStatus): Promise<OrgExtension[]> {
    const url = status
      ? `/api/orgs/${orgId}/extensions?status=${status}`
      : `/api/orgs/${orgId}/extensions`;
    const response = await this.#apiClient.get<ApiResponse<OrgExtension[]>>(url);
    return response.data;
  }

  public async getExtension(orgId: string, extensionId: string): Promise<OrgExtension> {
    const response = await this.#apiClient.get<ApiResponse<OrgExtension>>(
      `/api/orgs/${orgId}/extensions/${extensionId}`,
    );
    return response.data;
  }

  public async uploadExtension(orgId: string, input: UploadExtensionInput): Promise<OrgExtension> {
    const response = await this.#apiClient.post<ApiResponse<OrgExtension>>(
      `/api/orgs/${orgId}/extensions`,
      input,
    );
    return response.data;
  }

  public async reviewExtension(
    orgId: string,
    extensionId: string,
    input: ReviewExtensionInput,
  ): Promise<OrgExtension> {
    const response = await this.#apiClient.post<ApiResponse<OrgExtension>>(
      `/api/orgs/${orgId}/extensions/${extensionId}/review`,
      input,
    );
    return response.data;
  }

  public async deleteExtension(orgId: string, extensionId: string): Promise<boolean> {
    const response = await this.#apiClient.delete<{ success: boolean }>(
      `/api/orgs/${orgId}/extensions/${extensionId}`,
    );
    return response.success;
  }

  public async getExtensionSettings(orgId: string): Promise<ExtensionSetting[]> {
    const response = await this.#apiClient.get<ApiResponse<ExtensionSetting[]>>(
      `/api/orgs/${orgId}/extension-settings`,
    );
    return response.data;
  }

  public async updateExtensionSetting(
    orgId: string,
    extensionId: string,
    input: UpdateExtensionSettingInput,
  ): Promise<ExtensionSetting> {
    const response = await this.#apiClient.request<ApiResponse<ExtensionSetting>>(
      `/api/orgs/${orgId}/extension-settings/${extensionId}`,
      {
        method: "PUT",
        body: input,
      },
    );
    return response.data;
  }

  // ===== Converters =====

  #toOrganization = (response: OrganizationApiResponse): Organization => ({
    id: response.id,
    name: response.name,
    slug: response.slug,
    description: response.description ?? undefined,
    avatar: response.avatar ?? undefined,
    role: response.role,
    createdAt: response.createdAt,
    updatedAt: response.updatedAt,
  });

  #toOrgMember = (response: OrgMemberApiResponse): OrgMember => ({
    userId: response.userId,
    email: response.email,
    name: response.name ?? undefined,
    avatar: response.avatar ?? undefined,
    role: response.role,
    joinedAt: response.joinedAt,
  });
}
