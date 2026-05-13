// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

/**
 * Recording format types
 */
export type RecordingFormat = "mcap" | "bag" | "db3";

/**
 * Recording status types
 */
export type RecordingStatus = "uploading" | "processing" | "ready" | "error";

/**
 * Recording topic information
 */
export interface RecordingTopic {
  name: string;
  type: string;
  messageCount: number;
}

/**
 * Recording data structure
 */
export interface Recording {
  id: string;
  name: string;
  format: RecordingFormat;
  size: number; // bytes
  checksum?: string;
  status: RecordingStatus;
  errorMessage?: string;
  duration?: number; // seconds
  messageCount?: number;
  topicCount?: number;
  startTime?: string; // ISO string
  endTime?: string; // ISO string
  topics?: RecordingTopic[];
  storagePath?: string;
  storageUrl?: string;
  deviceId?: string;
  deviceName?: string;
  userId?: string;
  orgId?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

/**
 * Recording list query parameters
 */
export interface RecordingListQuery {
  orgId?: string;
  deviceId?: string;
  startTime?: string; // ISO string
  endTime?: string; // ISO string
  page?: number;
  pageSize?: number;
  search?: string;
  format?: RecordingFormat;
  status?: RecordingStatus;
}

/**
 * Recording list response
 */
export interface RecordingListResponse {
  recordings: Recording[];
  totalRecordings: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Recording upload progress callback
 */
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Recording service interface
 */
export interface IRecordingService {
  /**
   * Get recordings list for the current user
   */
  getRecordings(query?: RecordingListQuery): Promise<RecordingListResponse>;

  /**
   * Get a specific recording by ID
   */
  getRecording(id: string): Promise<Recording>;

  /**
   * Delete a recording
   */
  deleteRecording(id: string): Promise<boolean>;

  /**
   * Upload a recording file
   */
  uploadRecording(
    file: File,
    options?: {
      deviceId?: string;
      orgId?: string;
    },
    onProgress?: (progress: UploadProgress) => void,
  ): Promise<Recording>;

  /**
   * Download a recording file
   */
  downloadRecording(id: string): Promise<Blob>;

  /**
   * Get recording download URL
   */
  getDownloadUrl(id: string): Promise<string>;
}