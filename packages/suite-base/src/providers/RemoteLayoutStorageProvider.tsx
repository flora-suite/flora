// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useMemo } from "react";

import RemoteLayoutStorageContext from "@lichtblick/suite-base/context/RemoteLayoutStorageContext";
import { useApiClient } from "@lichtblick/suite-base/context/ApiClientContext";
import { useAuth } from "@lichtblick/suite-base/context/AuthContext";
import { FloraRemoteLayoutStorage } from "@lichtblick/suite-base/services/FloraRemoteLayoutStorage";

/**
 * Provider for RemoteLayoutStorage that creates a FloraRemoteLayoutStorage
 * when the user is authenticated.
 */
export default function RemoteLayoutStorageProvider({
  children,
}: React.PropsWithChildren): JSX.Element {
  const { isAuthenticated, user } = useAuth();
  const apiClient = useApiClient();

  const remoteLayoutStorage = useMemo(() => {
    if (!isAuthenticated || !user || !apiClient) {
      return undefined;
    }
    return new FloraRemoteLayoutStorage(apiClient, user.id);
  }, [isAuthenticated, user, apiClient]);

  return (
    <RemoteLayoutStorageContext.Provider value={remoteLayoutStorage}>
      {children}
    </RemoteLayoutStorageContext.Provider>
  );
}
