// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { RecordingService } from "./RecordingService";

const recording = {
  id: "recording-1",
  name: "Drive",
  size: 10,
  format: "mcap",
  status: "ready",
} as never;

describe("RecordingService", () => {
  const apiClient = {
    get: jest.fn(),
    delete: jest.fn(),
    uploadFileWithProgress: jest.fn(),
    downloadBlob: jest.fn(),
  };
  const service = new RecordingService(apiClient as never);

  beforeEach(() => jest.clearAllMocks());

  it("serializes recording filters and maps pagination", async () => {
    apiClient.get.mockResolvedValue({ data: [recording], total: 21, page: 2, pageSize: 10 });

    await expect(
      service.getRecordings({
        orgId: "org",
        search: "drive",
        deviceId: "device",
        startTime: "start",
        endTime: "end",
        format: "mcap",
        status: "ready",
        page: 2,
        pageSize: 10,
      } as never),
    ).resolves.toEqual({
      recordings: [recording],
      totalRecordings: 21,
      page: 2,
      pageSize: 10,
      totalPages: 3,
    });
    expect(apiClient.get).toHaveBeenCalledWith(
      "/api/recordings?orgId=org&page=2&pageSize=10&search=drive&deviceId=device&startTime=start&endTime=end&format=mcap&status=ready",
    );
  });

  it("uses the base endpoint without filters", async () => {
    apiClient.get.mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 10 });

    await service.getRecordings();

    expect(apiClient.get).toHaveBeenCalledWith("/api/recordings");
  });

  it("gets, deletes, uploads, and downloads recordings", async () => {
    const file = new File(["contents"], "drive.mcap");
    const blob = new Blob(["contents"]);
    const onProgress = jest.fn();
    apiClient.get
      .mockResolvedValueOnce(recording)
      .mockResolvedValueOnce({ url: "https://example.com/recording" });
    apiClient.delete.mockResolvedValue(undefined);
    apiClient.uploadFileWithProgress.mockImplementation(
      async (
        _endpoint: string,
        _formData: FormData,
        progress: (loaded: number, total: number) => void,
      ) => {
        progress(1, 3);
        return recording;
      },
    );
    apiClient.downloadBlob.mockResolvedValue(blob);

    await expect(service.getRecording("recording-1")).resolves.toEqual(recording);
    await expect(service.deleteRecording("recording-1")).resolves.toBe(true);
    await expect(
      service.uploadRecording(file, { deviceId: "device", orgId: "org" }, onProgress),
    ).resolves.toEqual(recording);
    await expect(service.downloadRecording("recording-1")).resolves.toBe(blob);
    await expect(service.getDownloadUrl("recording-1")).resolves.toBe(
      "https://example.com/recording",
    );
    expect(apiClient.uploadFileWithProgress).toHaveBeenCalledWith(
      "/api/recordings/user-upload",
      expect.any(FormData),
      expect.any(Function),
    );
    expect(onProgress).toHaveBeenCalledWith({ loaded: 1, total: 3, percentage: 33 });
  });

  it("does not attach a progress adapter when no callback is supplied", async () => {
    apiClient.uploadFileWithProgress.mockResolvedValue(recording);

    await service.uploadRecording(new File(["contents"], "drive.mcap"));

    expect(apiClient.uploadFileWithProgress).toHaveBeenCalledWith(
      "/api/recordings/user-upload",
      expect.any(FormData),
      undefined,
    );
  });
});
