// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useCallback, useEffect, useState } from "react";

import { useShallowMemo } from "@lichtblick/hooks";
import Logger from "@lichtblick/log";
import { useAuth } from "@lichtblick/suite-base/context/AuthContext";
import OrganizationContext, {
  IOrganizationContext,
  OrganizationState,
} from "@lichtblick/suite-base/context/OrganizationContext";
import { ApiError } from "@lichtblick/suite-base/services/ApiClient";
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
  ReviewExtensionInput,
  StorageStatsResponse,
  UpdateExtensionSettingInput,
  UpdateMemberRoleInput,
  UpdateOrganizationInput,
  UploadExtensionInput,
} from "@lichtblick/suite-base/services/IOrganizationService";

const log = Logger.getLogger(__filename);

const STORAGE_KEY = "flora.currentOrganizationId";

/**
 * Get saved organization ID from localStorage
 */
function getSavedOrganizationId(): string | undefined {
  const savedId = localStorage.getItem(STORAGE_KEY);
  return savedId ?? undefined;
}

/**
 * Check if error is a session expired error (401)
 * These errors are handled by AuthProvider and should not show error messages
 */
function isSessionExpiredError(error: unknown): boolean {
  return error instanceof ApiError && error.statusCode === 401;
}

type OrganizationProviderProps = React.PropsWithChildren<{
  organizationService: IOrganizationService;
}>;

/**
 * Provider component for organization management context
 */
export default function OrganizationProvider({
  organizationService,
  children,
}: OrganizationProviderProps): JSX.Element {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const [state, setState] = useState<OrganizationState>(() => ({
    isLoading: false,
    organizations: [],
    currentOrganizationId: getSavedOrganizationId(),
    currentOrganization: undefined,
    error: undefined,
  }));

  // Fetch organizations when user is authenticated
  useEffect(() => {
    // Don't do anything while auth is still loading
    if (isAuthLoading) {
      return;
    }

    if (isAuthenticated) {
      void (async () => {
        setState((prev) => ({ ...prev, isLoading: true, error: undefined }));
        try {
          const orgs = await organizationService.getOrganizations();
          // Match saved organization ID with fetched organizations
          setState((prev) => {
            const savedOrg = prev.currentOrganizationId
              ? orgs.find((org) => org.id === prev.currentOrganizationId)
              : undefined;
            return {
              ...prev,
              isLoading: false,
              organizations: orgs,
              currentOrganization: savedOrg,
              // Clear ID if org no longer exists
              currentOrganizationId: savedOrg?.id,
            };
          });
        } catch (error) {
          if (!isSessionExpiredError(error)) {
            log.error("Failed to fetch organizations:", error);
            setState((prev) => ({
              ...prev,
              isLoading: false,
              error:
                error instanceof ApiError
                  ? error.message
                  : "Failed to fetch organizations. Please try again.",
            }));
          } else {
            setState((prev) => ({ ...prev, isLoading: false }));
          }
        }
      })();
    } else {
      // Clear state when user logs out (only when auth is definitively not authenticated)
      setState({
        isLoading: false,
        organizations: [],
        currentOrganizationId: undefined,
        currentOrganization: undefined,
        error: undefined,
      });
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [isAuthenticated, isAuthLoading, organizationService]);

  const fetchOrganizations = useCallback(async (): Promise<Organization[]> => {
    setState((prev) => ({ ...prev, isLoading: true, error: undefined }));

    try {
      const orgs = await organizationService.getOrganizations();
      setState((prev) => ({
        ...prev,
        isLoading: false,
        organizations: orgs,
      }));
      return orgs;
    } catch (error) {
      if (isSessionExpiredError(error)) {
        setState((prev) => ({ ...prev, isLoading: false }));
        throw error;
      }
      const message =
        error instanceof ApiError
          ? error.message
          : "Failed to fetch organizations. Please try again.";
      log.error("Failed to fetch organizations:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      throw error;
    }
  }, [organizationService]);

  const fetchOrganization = useCallback(
    async (id: string): Promise<Organization> => {
      try {
        return await organizationService.getOrganization(id);
      } catch (error) {
        if (isSessionExpiredError(error)) {
          throw error;
        }
        const message =
          error instanceof ApiError
            ? error.message
            : "Failed to fetch organization. Please try again.";
        log.error("Failed to fetch organization:", error);
        setState((prev) => ({ ...prev, error: message }));
        throw error;
      }
    },
    [organizationService],
  );

  const createOrganization = useCallback(
    async (input: CreateOrganizationInput): Promise<Organization> => {
      setState((prev) => ({ ...prev, isLoading: true, error: undefined }));

      try {
        const org = await organizationService.createOrganization(input);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          organizations: [...prev.organizations, org],
        }));
        return org;
      } catch (error) {
        if (isSessionExpiredError(error)) {
          setState((prev) => ({ ...prev, isLoading: false }));
          throw error;
        }
        const message =
          error instanceof ApiError
            ? error.message
            : "Failed to create organization. Please try again.";
        log.error("Failed to create organization:", error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
        }));
        throw error;
      }
    },
    [organizationService],
  );

  const updateOrganization = useCallback(
    async (id: string, input: UpdateOrganizationInput): Promise<Organization> => {
      setState((prev) => ({ ...prev, isLoading: true, error: undefined }));

      try {
        const org = await organizationService.updateOrganization(id, input);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          organizations: prev.organizations.map((o) => (o.id === id ? org : o)),
          currentOrganization: prev.currentOrganization?.id === id ? org : prev.currentOrganization,
        }));
        return org;
      } catch (error) {
        if (isSessionExpiredError(error)) {
          setState((prev) => ({ ...prev, isLoading: false }));
          throw error;
        }
        const message =
          error instanceof ApiError
            ? error.message
            : "Failed to update organization. Please try again.";
        log.error("Failed to update organization:", error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
        }));
        throw error;
      }
    },
    [organizationService],
  );

  const checkCanDelete = useCallback(
    async (id: string): Promise<CheckCanDeleteResponse> => {
      try {
        return await organizationService.checkCanDelete(id);
      } catch (error) {
        if (isSessionExpiredError(error)) {
          throw error;
        }
        const message =
          error instanceof ApiError
            ? error.message
            : "Failed to check organization deletion eligibility. Please try again.";
        log.error("Failed to check can delete organization:", error);
        setState((prev) => ({ ...prev, error: message }));
        throw error;
      }
    },
    [organizationService],
  );

  const deleteOrganization = useCallback(
    async (id: string): Promise<boolean> => {
      setState((prev) => ({ ...prev, isLoading: true, error: undefined }));

      try {
        const deleted = await organizationService.deleteOrganization(id);
        if (deleted) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            organizations: prev.organizations.filter((o) => o.id !== id),
            currentOrganization:
              prev.currentOrganization?.id === id ? undefined : prev.currentOrganization,
          }));
          // Clear localStorage if deleted org was the current one
          const savedOrgId = localStorage.getItem(STORAGE_KEY);
          if (savedOrgId === id) {
            localStorage.removeItem(STORAGE_KEY);
          }
        } else {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
        return deleted;
      } catch (error) {
        if (isSessionExpiredError(error)) {
          setState((prev) => ({ ...prev, isLoading: false }));
          throw error;
        }
        const message =
          error instanceof ApiError
            ? error.message
            : "Failed to delete organization. Please try again.";
        log.error("Failed to delete organization:", error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
        }));
        throw error;
      }
    },
    [organizationService],
  );

  const selectOrganization = useCallback((org: Organization | undefined): void => {
    setState((prev) => ({
      ...prev,
      currentOrganizationId: org?.id,
      currentOrganization: org,
    }));
    if (org) {
      localStorage.setItem(STORAGE_KEY, org.id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const fetchMembers = useCallback(
    async (orgId: string): Promise<OrgMember[]> => {
      try {
        return await organizationService.getMembers(orgId);
      } catch (error) {
        if (isSessionExpiredError(error)) {
          throw error;
        }
        const message =
          error instanceof ApiError ? error.message : "Failed to fetch members. Please try again.";
        log.error("Failed to fetch members:", error);
        setState((prev) => ({ ...prev, error: message }));
        throw error;
      }
    },
    [organizationService],
  );

  const addMember = useCallback(
    async (orgId: string, input: AddMemberInput): Promise<OrgMember> => {
      try {
        return await organizationService.addMember(orgId, input);
      } catch (error) {
        if (isSessionExpiredError(error)) {
          throw error;
        }
        const message =
          error instanceof ApiError ? error.message : "Failed to add member. Please try again.";
        log.error("Failed to add member:", error);
        setState((prev) => ({ ...prev, error: message }));
        throw error;
      }
    },
    [organizationService],
  );

  const updateMemberRole = useCallback(
    async (orgId: string, userId: string, input: UpdateMemberRoleInput): Promise<OrgMember> => {
      try {
        return await organizationService.updateMemberRole(orgId, userId, input);
      } catch (error) {
        if (isSessionExpiredError(error)) {
          throw error;
        }
        const message =
          error instanceof ApiError
            ? error.message
            : "Failed to update member role. Please try again.";
        log.error("Failed to update member role:", error);
        setState((prev) => ({ ...prev, error: message }));
        throw error;
      }
    },
    [organizationService],
  );

  const removeMember = useCallback(
    async (orgId: string, userId: string): Promise<boolean> => {
      try {
        return await organizationService.removeMember(orgId, userId);
      } catch (error) {
        if (isSessionExpiredError(error)) {
          throw error;
        }
        const message =
          error instanceof ApiError ? error.message : "Failed to remove member. Please try again.";
        log.error("Failed to remove member:", error);
        setState((prev) => ({ ...prev, error: message }));
        throw error;
      }
    },
    [organizationService],
  );

  const getStorageStats = useCallback(
    async (orgId: string): Promise<StorageStatsResponse> => {
      try {
        return await organizationService.getStorageStats(orgId);
      } catch (error) {
        if (isSessionExpiredError(error)) {
          throw error;
        }
        const message =
          error instanceof ApiError
            ? error.message
            : "Failed to get storage stats. Please try again.";
        log.error("Failed to get storage stats:", error);
        setState((prev) => ({ ...prev, error: message }));
        throw error;
      }
    },
    [organizationService],
  );

  // ===== API Keys =====

  const getApiKeys = useCallback(
    async (orgId: string): Promise<ApiKey[]> => {
      try {
        return await organizationService.getApiKeys(orgId);
      } catch (error) {
        if (isSessionExpiredError(error)) {
          throw error;
        }
        const message =
          error instanceof ApiError ? error.message : "Failed to get API keys. Please try again.";
        log.error("Failed to get API keys:", error);
        setState((prev) => ({ ...prev, error: message }));
        throw error;
      }
    },
    [organizationService],
  );

  const createApiKey = useCallback(
    async (orgId: string, name: string): Promise<CreateApiKeyResponse> => {
      try {
        return await organizationService.createApiKey(orgId, name);
      } catch (error) {
        if (isSessionExpiredError(error)) {
          throw error;
        }
        const message =
          error instanceof ApiError ? error.message : "Failed to create API key. Please try again.";
        log.error("Failed to create API key:", error);
        setState((prev) => ({ ...prev, error: message }));
        throw error;
      }
    },
    [organizationService],
  );

  const deleteApiKey = useCallback(
    async (orgId: string, keyId: string): Promise<boolean> => {
      try {
        return await organizationService.deleteApiKey(orgId, keyId);
      } catch (error) {
        if (isSessionExpiredError(error)) {
          throw error;
        }
        const message =
          error instanceof ApiError ? error.message : "Failed to delete API key. Please try again.";
        log.error("Failed to delete API key:", error);
        setState((prev) => ({ ...prev, error: message }));
        throw error;
      }
    },
    [organizationService],
  );

  // ===== Extensions =====

  const getExtensions = useCallback(
    async (orgId: string, status?: ExtensionStatus): Promise<OrgExtension[]> => {
      try {
        return await organizationService.getExtensions(orgId, status);
      } catch (error) {
        if (isSessionExpiredError(error)) {
          throw error;
        }
        const message =
          error instanceof ApiError ? error.message : "Failed to get extensions. Please try again.";
        log.error("Failed to get extensions:", error);
        setState((prev) => ({ ...prev, error: message }));
        throw error;
      }
    },
    [organizationService],
  );

  const getExtension = useCallback(
    async (orgId: string, extensionId: string): Promise<OrgExtension> => {
      try {
        return await organizationService.getExtension(orgId, extensionId);
      } catch (error) {
        if (isSessionExpiredError(error)) {
          throw error;
        }
        const message =
          error instanceof ApiError ? error.message : "Failed to get extension. Please try again.";
        log.error("Failed to get extension:", error);
        setState((prev) => ({ ...prev, error: message }));
        throw error;
      }
    },
    [organizationService],
  );

  const uploadExtension = useCallback(
    async (orgId: string, input: UploadExtensionInput): Promise<OrgExtension> => {
      try {
        return await organizationService.uploadExtension(orgId, input);
      } catch (error) {
        if (isSessionExpiredError(error)) {
          throw error;
        }
        const message =
          error instanceof ApiError
            ? error.message
            : "Failed to upload extension. Please try again.";
        log.error("Failed to upload extension:", error);
        setState((prev) => ({ ...prev, error: message }));
        throw error;
      }
    },
    [organizationService],
  );

  const reviewExtension = useCallback(
    async (
      orgId: string,
      extensionId: string,
      input: ReviewExtensionInput,
    ): Promise<OrgExtension> => {
      try {
        return await organizationService.reviewExtension(orgId, extensionId, input);
      } catch (error) {
        if (isSessionExpiredError(error)) {
          throw error;
        }
        const message =
          error instanceof ApiError
            ? error.message
            : "Failed to review extension. Please try again.";
        log.error("Failed to review extension:", error);
        setState((prev) => ({ ...prev, error: message }));
        throw error;
      }
    },
    [organizationService],
  );

  const deleteExtension = useCallback(
    async (orgId: string, extensionId: string): Promise<boolean> => {
      try {
        return await organizationService.deleteExtension(orgId, extensionId);
      } catch (error) {
        if (isSessionExpiredError(error)) {
          throw error;
        }
        const message =
          error instanceof ApiError
            ? error.message
            : "Failed to delete extension. Please try again.";
        log.error("Failed to delete extension:", error);
        setState((prev) => ({ ...prev, error: message }));
        throw error;
      }
    },
    [organizationService],
  );

  const getExtensionSettings = useCallback(
    async (orgId: string): Promise<ExtensionSetting[]> => {
      try {
        return await organizationService.getExtensionSettings(orgId);
      } catch (error) {
        if (isSessionExpiredError(error)) {
          throw error;
        }
        const message =
          error instanceof ApiError
            ? error.message
            : "Failed to get extension settings. Please try again.";
        log.error("Failed to get extension settings:", error);
        setState((prev) => ({ ...prev, error: message }));
        throw error;
      }
    },
    [organizationService],
  );

  const updateExtensionSetting = useCallback(
    async (
      orgId: string,
      extensionId: string,
      input: UpdateExtensionSettingInput,
    ): Promise<ExtensionSetting> => {
      try {
        return await organizationService.updateExtensionSetting(orgId, extensionId, input);
      } catch (error) {
        if (isSessionExpiredError(error)) {
          throw error;
        }
        const message =
          error instanceof ApiError
            ? error.message
            : "Failed to update extension setting. Please try again.";
        log.error("Failed to update extension setting:", error);
        setState((prev) => ({ ...prev, error: message }));
        throw error;
      }
    },
    [organizationService],
  );

  const refreshOrganizations = useCallback(async (): Promise<void> => {
    await fetchOrganizations();
  }, [fetchOrganizations]);

  const clearError = useCallback((): void => {
    setState((prev) => ({ ...prev, error: undefined }));
  }, []);

  const contextValue = useShallowMemo<IOrganizationContext>({
    ...state,
    fetchOrganizations,
    fetchOrganization,
    createOrganization,
    updateOrganization,
    checkCanDelete,
    deleteOrganization,
    selectOrganization,
    fetchMembers,
    addMember,
    updateMemberRole,
    removeMember,
    getStorageStats,
    getApiKeys,
    createApiKey,
    deleteApiKey,
    getExtensions,
    getExtension,
    uploadExtension,
    reviewExtension,
    deleteExtension,
    getExtensionSettings,
    updateExtensionSetting,
    refreshOrganizations,
    clearError,
  });

  return (
    <OrganizationContext.Provider value={contextValue}>{children}</OrganizationContext.Provider>
  );
}
