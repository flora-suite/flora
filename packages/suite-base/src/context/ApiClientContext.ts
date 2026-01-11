// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { createContext, useContext } from "react";

import { ApiClient } from "@lichtblick/suite-base/services/ApiClient";

const ApiClientContext = createContext<ApiClient | undefined>(undefined);
ApiClientContext.displayName = "ApiClientContext";

/**
 * Hook to access the API client.
 * Returns undefined if the API client is not available.
 */
export function useApiClient(): ApiClient | undefined {
  return useContext(ApiClientContext);
}

export default ApiClientContext;
