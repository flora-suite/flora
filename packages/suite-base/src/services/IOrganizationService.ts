// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

/**
 * Organization role type
 */
export type OrgRole = "owner" | "admin" | "member";

/**
 * Organization information from the server
 */
export type Organization = {
  id: string;
  name: string;
  slug: string;
  description: string | undefined;
  avatar: string | undefined;
  role: OrgRole;
  createdAt: string;
  updatedAt: string;
};

/**
 * Organization member information
 */
export type OrgMember = {
  userId: string;
  email: string;
  name: string | undefined;
  avatar: string | undefined;
  role: OrgRole;
  joinedAt: string;
};

/**
 * Create organization input
 */
export type CreateOrganizationInput = {
  name: string;
  slug?: string;
  description?: string;
  avatar?: string;
};

/**
 * Update organization input
 */
export type UpdateOrganizationInput = {
  name?: string;
  slug?: string;
  description?: string;
  avatar?: string;
};

/**
 * Add member input
 */
export type AddMemberInput = {
  email: string;
  role?: OrgRole;
};

/**
 * Update member role input
 */
export type UpdateMemberRoleInput = {
  role: OrgRole;
};

/**
 * Check can delete response
 */
export type CheckCanDeleteResponse = {
  canDelete: boolean;
  counts: {
    devices: number;
    recordings: number;
    events: number;
    layouts: number;
  };
  blockers: string[];
};

/**
 * Storage stats response
 */
export type StorageStatsResponse = {
  totalBytes: number;
  recordingsCount: number;
};

/**
 * API Key information
 */
export type ApiKey = {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | undefined;
};

/**
 * Create API Key response
 */
export type CreateApiKeyResponse = {
  apiKey: ApiKey;
  rawKey: string;
};

/**
 * Extension status type
 */
export type ExtensionStatus = "pending" | "approved" | "rejected";

/**
 * Extension information
 */
export type OrgExtension = {
  id: string;
  orgId: string;
  name: string;
  displayName: string;
  description: string | undefined;
  version: string;
  status: ExtensionStatus;
  uploadedByUserId: string;
  reviewedByUserId: string | undefined;
  reviewedAt: string | undefined;
  reviewNote: string | undefined;
  createdAt: string;
  updatedAt: string;
};

/**
 * Extension upload input
 */
export type UploadExtensionInput = {
  name: string;
  displayName: string;
  description?: string;
  version: string;
  storagePath: string;
};

/**
 * Extension review input
 */
export type ReviewExtensionInput = {
  status: "approved" | "rejected";
  reviewNote?: string;
};

/**
 * Extension setting
 */
export type ExtensionSetting = {
  extensionId: string;
  isDefault: boolean;
  isEnabled: boolean;
};

/**
 * Update extension setting input
 */
export type UpdateExtensionSettingInput = {
  isDefault?: boolean;
  isEnabled?: boolean;
};

/**
 * Organization service interface
 */
export interface IOrganizationService {
  /**
   * Get all organizations the current user belongs to
   */
  getOrganizations(): Promise<Organization[]>;

  /**
   * Get a specific organization by ID
   */
  getOrganization(id: string): Promise<Organization>;

  /**
   * Create a new organization
   */
  createOrganization(input: CreateOrganizationInput): Promise<Organization>;

  /**
   * Update an organization
   */
  updateOrganization(id: string, input: UpdateOrganizationInput): Promise<Organization>;

  /**
   * Check if organization can be deleted
   */
  checkCanDelete(id: string): Promise<CheckCanDeleteResponse>;

  /**
   * Delete an organization
   */
  deleteOrganization(id: string): Promise<boolean>;

  /**
   * Get members of an organization
   */
  getMembers(orgId: string): Promise<OrgMember[]>;

  /**
   * Add a member to an organization
   */
  addMember(orgId: string, input: AddMemberInput): Promise<OrgMember>;

  /**
   * Update a member's role
   */
  updateMemberRole(orgId: string, userId: string, input: UpdateMemberRoleInput): Promise<OrgMember>;

  /**
   * Remove a member from an organization
   */
  removeMember(orgId: string, userId: string): Promise<boolean>;

  /**
   * Get storage statistics for an organization
   */
  getStorageStats(orgId: string): Promise<StorageStatsResponse>;

  // ===== API Keys =====

  /**
   * Get all API keys for an organization
   */
  getApiKeys(orgId: string): Promise<ApiKey[]>;

  /**
   * Create a new API key
   */
  createApiKey(orgId: string, name: string): Promise<CreateApiKeyResponse>;

  /**
   * Delete an API key
   */
  deleteApiKey(orgId: string, keyId: string): Promise<boolean>;

  // ===== Extensions =====

  /**
   * Get all extensions for an organization
   */
  getExtensions(orgId: string, status?: ExtensionStatus): Promise<OrgExtension[]>;

  /**
   * Get a single extension by ID
   */
  getExtension(orgId: string, extensionId: string): Promise<OrgExtension>;

  /**
   * Upload a new extension
   */
  uploadExtension(orgId: string, input: UploadExtensionInput): Promise<OrgExtension>;

  /**
   * Review an extension (admin only)
   */
  reviewExtension(
    orgId: string,
    extensionId: string,
    input: ReviewExtensionInput,
  ): Promise<OrgExtension>;

  /**
   * Delete an extension
   */
  deleteExtension(orgId: string, extensionId: string): Promise<boolean>;

  /**
   * Get extension settings for an organization
   */
  getExtensionSettings(orgId: string): Promise<ExtensionSetting[]>;

  /**
   * Update extension setting (admin only)
   */
  updateExtensionSetting(
    orgId: string,
    extensionId: string,
    input: UpdateExtensionSettingInput,
  ): Promise<ExtensionSetting>;
}
