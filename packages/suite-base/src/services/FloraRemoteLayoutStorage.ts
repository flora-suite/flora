// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { LayoutID } from "@lichtblick/suite-base/context/CurrentLayoutContext";
import { LayoutData } from "@lichtblick/suite-base/context/CurrentLayoutContext/actions";
import { ApiClient } from "@lichtblick/suite-base/services/ApiClient";
import {
  ISO8601Timestamp,
  LayoutPermission,
} from "@lichtblick/suite-base/services/ILayoutStorage";
import {
  IRemoteLayoutStorage,
  RemoteLayout,
} from "@lichtblick/suite-base/services/IRemoteLayoutStorage";

/**
 * Response from the flora-server layout API
 */
type LayoutApiResponse = {
  id: string;
  name: string;
  permission: LayoutPermission;
  data: unknown;
  savedAt: string;
  orgId: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * Implementation of IRemoteLayoutStorage that uses flora-server API
 */
export class FloraRemoteLayoutStorage implements IRemoteLayoutStorage {
  readonly namespace: string;
  private readonly apiClient: ApiClient;
  private readonly orgId: string | undefined;

  public constructor(apiClient: ApiClient, userId: string, orgId?: string) {
    this.apiClient = apiClient;
    this.namespace = orgId ? `org-${orgId}` : userId;
    this.orgId = orgId;
  }

  public async getLayouts(): Promise<readonly RemoteLayout[]> {
    const queryParams = this.orgId ? `?orgId=${this.orgId}` : "";
    const response = await this.apiClient.get<LayoutApiResponse[]>(`/api/layouts${queryParams}`);
    return response.map(this.toRemoteLayout);
  }

  public async getLayout(id: LayoutID): Promise<RemoteLayout | undefined> {
    try {
      const response = await this.apiClient.get<LayoutApiResponse>(`/api/layouts/${id}`);
      return this.toRemoteLayout(response);
    } catch (error) {
      // Return undefined if layout not found
      if (error instanceof Error && error.message.includes("not found")) {
        return undefined;
      }
      throw error;
    }
  }

  public async saveNewLayout(params: {
    id: LayoutID | undefined;
    name: string;
    data: LayoutData;
    permission: LayoutPermission;
    savedAt: ISO8601Timestamp;
  }): Promise<RemoteLayout> {
    const response = await this.apiClient.post<LayoutApiResponse>("/api/layouts", {
      id: params.id,
      name: params.name,
      data: params.data,
      permission: params.permission,
      savedAt: params.savedAt,
      orgId: this.orgId,
    });
    return this.toRemoteLayout(response);
  }

  public async updateLayout(params: {
    id: LayoutID;
    name?: string;
    data?: LayoutData;
    permission?: LayoutPermission;
    savedAt: ISO8601Timestamp;
  }): Promise<{ status: "success"; newLayout: RemoteLayout } | { status: "conflict" }> {
    const response = await this.apiClient.put<
      { status: "success"; newLayout: LayoutApiResponse } | { status: "conflict" }
    >(`/api/layouts/${params.id}`, {
      name: params.name,
      data: params.data,
      permission: params.permission,
      savedAt: params.savedAt,
    });

    if (response.status === "conflict") {
      return { status: "conflict" };
    }

    return {
      status: "success",
      newLayout: this.toRemoteLayout(response.newLayout),
    };
  }

  public async deleteLayout(id: LayoutID): Promise<boolean> {
    const response = await this.apiClient.delete<{ deleted: boolean }>(`/api/layouts/${id}`);
    return response.deleted;
  }

  private toRemoteLayout = (layout: LayoutApiResponse): RemoteLayout => ({
    id: layout.id as LayoutID,
    name: layout.name,
    permission: layout.permission,
    data: layout.data as LayoutData,
    savedAt: layout.savedAt as ISO8601Timestamp,
  });
}
