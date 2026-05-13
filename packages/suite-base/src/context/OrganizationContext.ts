// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { createContext, useContext } from "react";

import {
  AddMemberInput,
  ApiKey,
  CheckCanDeleteResponse,
  CreateApiKeyResponse,
  CreateOrganizationInput,
  ExtensionSetting,
  ExtensionStatus,
  Organization,
  OrgExtension,
  OrgMember,
  ReviewExtensionInput,
  StorageStatsResponse,
  UpdateExtensionSettingInput,
  UpdateMemberRoleInput,
  UpdateOrganizationInput,
  UploadExtensionInput,
} from "@lichtblick/suite-base/services/IOrganizationService";

/**
 * Organization management state
 */
export type OrganizationState = {
  /** Whether organizations are being loaded */
  isLoading: boolean;
  /** List of organizations the user belongs to */
  organizations: Organization[];
  /** Currently selected organization ID (from localStorage, available immediately) */
  currentOrganizationId: string | undefined;
  /** Currently selected organization (undefined means personal mode) */
  currentOrganization: Organization | undefined;
  /** Error message */
  error: string | undefined;
};

/**
 * Organization context interface
 */
export interface IOrganizationContext extends OrganizationState {
  // Organization CRUD operations
  fetchOrganizations: () => Promise<Organization[]>;
  fetchOrganization: (id: string) => Promise<Organization>;
  createOrganization: (input: CreateOrganizationInput) => Promise<Organization>;
  updateOrganization: (id: string, input: UpdateOrganizationInput) => Promise<Organization>;
  checkCanDelete: (id: string) => Promise<CheckCanDeleteResponse>;
  deleteOrganization: (id: string) => Promise<boolean>;

  // Organization selection (switch between personal/org mode)
  selectOrganization: (org: Organization | undefined) => void;

  // Member operations
  fetchMembers: (orgId: string) => Promise<OrgMember[]>;
  addMember: (orgId: string, input: AddMemberInput) => Promise<OrgMember>;
  updateMemberRole: (
    orgId: string,
    userId: string,
    input: UpdateMemberRoleInput,
  ) => Promise<OrgMember>;
  removeMember: (orgId: string, userId: string) => Promise<boolean>;

  // Storage stats
  getStorageStats: (orgId: string) => Promise<StorageStatsResponse>;

  // API Keys
  getApiKeys: (orgId: string) => Promise<ApiKey[]>;
  createApiKey: (orgId: string, name: string) => Promise<CreateApiKeyResponse>;
  deleteApiKey: (orgId: string, keyId: string) => Promise<boolean>;

  // Extensions
  getExtensions: (orgId: string, status?: ExtensionStatus) => Promise<OrgExtension[]>;
  getExtension: (orgId: string, extensionId: string) => Promise<OrgExtension>;
  uploadExtension: (orgId: string, input: UploadExtensionInput) => Promise<OrgExtension>;
  reviewExtension: (
    orgId: string,
    extensionId: string,
    input: ReviewExtensionInput,
  ) => Promise<OrgExtension>;
  deleteExtension: (orgId: string, extensionId: string) => Promise<boolean>;
  getExtensionSettings: (orgId: string) => Promise<ExtensionSetting[]>;
  updateExtensionSetting: (
    orgId: string,
    extensionId: string,
    input: UpdateExtensionSettingInput,
  ) => Promise<ExtensionSetting>;

  // Utility
  refreshOrganizations: () => Promise<void>;
  clearError: () => void;
}

const defaultOrganizationContext: IOrganizationContext = {
  isLoading: false,
  organizations: [],
  currentOrganizationId: undefined,
  currentOrganization: undefined,
  error: undefined,

  fetchOrganizations: async () => {
    throw new Error("OrganizationContext not initialized");
  },
  fetchOrganization: async () => {
    throw new Error("OrganizationContext not initialized");
  },
  createOrganization: async () => {
    throw new Error("OrganizationContext not initialized");
  },
  updateOrganization: async () => {
    throw new Error("OrganizationContext not initialized");
  },
  checkCanDelete: async () => {
    throw new Error("OrganizationContext not initialized");
  },
  deleteOrganization: async () => {
    throw new Error("OrganizationContext not initialized");
  },
  selectOrganization: () => {
    throw new Error("OrganizationContext not initialized");
  },
  fetchMembers: async () => {
    throw new Error("OrganizationContext not initialized");
  },
  addMember: async () => {
    throw new Error("OrganizationContext not initialized");
  },
  updateMemberRole: async () => {
    throw new Error("OrganizationContext not initialized");
  },
  removeMember: async () => {
    throw new Error("OrganizationContext not initialized");
  },
  getStorageStats: async () => {
    throw new Error("OrganizationContext not initialized");
  },
  getApiKeys: async () => {
    throw new Error("OrganizationContext not initialized");
  },
  createApiKey: async () => {
    throw new Error("OrganizationContext not initialized");
  },
  deleteApiKey: async () => {
    throw new Error("OrganizationContext not initialized");
  },
  getExtensions: async () => {
    throw new Error("OrganizationContext not initialized");
  },
  getExtension: async () => {
    throw new Error("OrganizationContext not initialized");
  },
  uploadExtension: async () => {
    throw new Error("OrganizationContext not initialized");
  },
  reviewExtension: async () => {
    throw new Error("OrganizationContext not initialized");
  },
  deleteExtension: async () => {
    throw new Error("OrganizationContext not initialized");
  },
  getExtensionSettings: async () => {
    throw new Error("OrganizationContext not initialized");
  },
  updateExtensionSetting: async () => {
    throw new Error("OrganizationContext not initialized");
  },
  refreshOrganizations: async () => {
    throw new Error("OrganizationContext not initialized");
  },
  clearError: () => {
    throw new Error("OrganizationContext not initialized");
  },
};

const OrganizationContext = createContext<IOrganizationContext>(defaultOrganizationContext);
OrganizationContext.displayName = "OrganizationContext";

/**
 * Hook to access organization management context
 */
export function useOrganizations(): IOrganizationContext {
  return useContext(OrganizationContext);
}

/**
 * Hook to get currently selected organization
 * Returns undefined if in personal mode
 */
export function useCurrentOrganization(): Organization | undefined {
  const { currentOrganization } = useOrganizations();
  return currentOrganization;
}

/**
 * Hook to get currently selected organization ID
 * Available immediately from localStorage, before organizations are fetched
 * Returns undefined if in personal mode
 */
export function useCurrentOrganizationId(): string | undefined {
  const { currentOrganizationId } = useOrganizations();
  return currentOrganizationId;
}

/**
 * Hook to check if user is in organization mode
 */
export function useIsOrganizationMode(): boolean {
  const { currentOrganizationId } = useOrganizations();
  return currentOrganizationId != undefined;
}

export default OrganizationContext;
