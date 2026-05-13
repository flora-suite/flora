// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useMemo } from "react";

import { useApiClient } from "@lichtblick/suite-base/context/ApiClientContext";
import { useAuth } from "@lichtblick/suite-base/context/AuthContext";
import { useCurrentOrganizationId } from "@lichtblick/suite-base/context/OrganizationContext";
import RemoteLayoutStorageContext from "@lichtblick/suite-base/context/RemoteLayoutStorageContext";
import { FloraRemoteLayoutStorage } from "@lichtblick/suite-base/services/FloraRemoteLayoutStorage";

/**
 * Provider for RemoteLayoutStorage that creates a FloraRemoteLayoutStorage
 * when the user is authenticated.
 *
 * The storage is scoped to:
 * - Personal layouts when no organization is selected
 * - Organization layouts when an organization is selected
 */
export default function RemoteLayoutStorageProvider({
  children,
}: React.PropsWithChildren): JSX.Element {
  const { isAuthenticated, user } = useAuth();
  const apiClient = useApiClient();
  const currentOrganizationId = useCurrentOrganizationId();

  const remoteLayoutStorage = useMemo(() => {
    if (!isAuthenticated || !user || !apiClient) {
      return undefined;
    }
    return new FloraRemoteLayoutStorage(apiClient, user.id, currentOrganizationId);
  }, [isAuthenticated, user, apiClient, currentOrganizationId]);

  return (
    <RemoteLayoutStorageContext.Provider value={remoteLayoutStorage}>
      {children}
    </RemoteLayoutStorageContext.Provider>
  );
}
