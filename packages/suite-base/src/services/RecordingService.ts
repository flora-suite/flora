// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import type { ApiClient } from "@lichtblick/suite-base/services/ApiClient";

import type {
  IRecordingService,
  Recording,
  RecordingListQuery,
  RecordingListResponse,
  UploadProgress,
} from "./IRecordingService";

/**
 * API response format from flora-server
 */
interface ApiRecordingListResponse {
  data: Recording[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * RecordingService implementation that uses ApiClient for API communication
 */
export class RecordingService implements IRecordingService {
  readonly #apiClient: ApiClient;

  public constructor(apiClient: ApiClient) {
    this.#apiClient = apiClient;
  }

  public async getRecordings(query?: RecordingListQuery): Promise<RecordingListResponse> {
    const params = new URLSearchParams();

    if (query?.orgId != undefined) {
      params.set("orgId", query.orgId);
    }
    if (query?.page != undefined) {
      params.set("page", query.page.toString());
    }
    if (query?.pageSize != undefined) {
      params.set("pageSize", query.pageSize.toString());
    }
    if (query?.search) {
      params.set("search", query.search);
    }
    if (query?.deviceId) {
      params.set("deviceId", query.deviceId);
    }
    if (query?.startTime) {
      params.set("startTime", query.startTime);
    }
    if (query?.endTime) {
      params.set("endTime", query.endTime);
    }
    if (query?.format) {
      params.set("format", query.format);
    }
    if (query?.status) {
      params.set("status", query.status);
    }

    const endpoint = `/api/recordings${params.toString() ? `?${params.toString()}` : ""}`;
    const apiResponse = await this.#apiClient.get<ApiRecordingListResponse>(endpoint);

    // Transform API response to frontend format
    return {
      recordings: apiResponse.data,
      totalRecordings: apiResponse.total,
      page: apiResponse.page,
      pageSize: apiResponse.pageSize,
      totalPages: Math.ceil(apiResponse.total / apiResponse.pageSize),
    };
  }

  public async getRecording(id: string): Promise<Recording> {
    return await this.#apiClient.get(`/api/recordings/${id}`);
  }

  public async deleteRecording(id: string): Promise<boolean> {
    await this.#apiClient.delete(`/api/recordings/${id}`);
    return true;
  }

  public async uploadRecording(
    file: File,
    options?: {
      deviceId?: string;
      orgId?: string;
    },
    onProgress?: (progress: UploadProgress) => void,
  ): Promise<Recording> {
    const formData = new FormData();
    formData.append("file", file);
    if (options?.deviceId) {
      formData.append("deviceId", options.deviceId);
    }
    if (options?.orgId) {
      formData.append("orgId", options.orgId);
    }

    return await this.#apiClient.uploadFileWithProgress<Recording>(
      "/api/recordings/user-upload",
      formData,
      onProgress
        ? (loaded, total) => {
            onProgress({
              loaded,
              total,
              percentage: Math.round((loaded / total) * 100),
            });
          }
        : undefined,
    );
  }

  public async downloadRecording(id: string): Promise<Blob> {
    return await this.#apiClient.downloadBlob(`/api/recordings/${id}/download`);
  }

  public async getDownloadUrl(id: string): Promise<string> {
    const result = await this.#apiClient.get<{ url: string }>(`/api/recordings/${id}/download-url`);
    return result.url;
  }
}