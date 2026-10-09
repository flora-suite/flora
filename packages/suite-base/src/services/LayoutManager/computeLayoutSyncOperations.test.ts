// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

import { Layout } from "@lichtblick/suite-base/services/ILayoutStorage";
import { RemoteLayout } from "@lichtblick/suite-base/services/IRemoteLayoutStorage";

import computeLayoutSyncOperations from "./computeLayoutSyncOperations";

const makeLocal = (overrides: Partial<Layout> = {}): Layout =>
  ({
    id: "layout",
    name: "Layout",
    permission: "CREATOR_WRITE",
    baseline: { data: { configById: {}, layout: "" }, savedAt: undefined },
    working: undefined,
    syncInfo: undefined,
    ...overrides,
  }) as Layout;

const makeRemote = (overrides: Partial<RemoteLayout> = {}): RemoteLayout =>
  ({
    id: "layout",
    name: "Layout",
    permission: "CREATOR_WRITE",
    data: { configById: {}, layout: "" },
    savedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  }) as RemoteLayout;

describe("computeLayoutSyncOperations", () => {
  afterEach(() => {
    (console.warn as jest.Mock).mockClear();
  });

  it("uploads untracked and updated local layouts that exist remotely", () => {
    expect(computeLayoutSyncOperations([makeLocal()], [makeRemote()])).toMatchObject([
      { type: "upload-new", local: false },
    ]);
    expect(
      computeLayoutSyncOperations(
        [makeLocal({ syncInfo: { status: "updated", lastRemoteSavedAt: undefined } })],
        [makeRemote()],
      ),
    ).toMatchObject([{ type: "upload-updated", local: false }]);
  });

  it("updates a tracked layout baseline only when the remote save changes", () => {
    const tracked = makeLocal({
      syncInfo: { status: "tracked", lastRemoteSavedAt: "2026-01-01T00:00:00.000Z" as never },
    });

    expect(computeLayoutSyncOperations([tracked], [makeRemote()])).toEqual([]);
    expect(
      computeLayoutSyncOperations(
        [tracked],
        [makeRemote({ savedAt: "2026-01-02T00:00:00.000Z" as never })],
      ),
    ).toMatchObject([{ type: "update-baseline", local: true }]);
    expect(computeLayoutSyncOperations([tracked], [makeRemote({ savedAt: undefined })])).toEqual(
      [],
    );
  });

  it("reconciles deleted and contradictory layouts that are still on the server", () => {
    expect(
      computeLayoutSyncOperations(
        [makeLocal({ syncInfo: { status: "locally-deleted", lastRemoteSavedAt: undefined } })],
        [makeRemote()],
      ),
    ).toMatchObject([{ type: "delete-remote", local: false }]);
    expect(
      computeLayoutSyncOperations(
        [makeLocal({ syncInfo: { status: "remotely-deleted", lastRemoteSavedAt: undefined } })],
        [makeRemote()],
      ),
    ).toEqual([]);
  });

  it("handles local layouts that no longer exist remotely", () => {
    expect(computeLayoutSyncOperations([makeLocal()], [])).toMatchObject([
      { type: "upload-new", local: false },
    ]);
    expect(
      computeLayoutSyncOperations(
        [makeLocal({ syncInfo: { status: "updated", lastRemoteSavedAt: undefined } })],
        [],
      ),
    ).toMatchObject([{ type: "delete-local", local: true }]);
    expect(
      computeLayoutSyncOperations(
        [makeLocal({ syncInfo: { status: "tracked", lastRemoteSavedAt: undefined } })],
        [],
      ),
    ).toMatchObject([{ type: "delete-local", local: true }]);
    expect(
      computeLayoutSyncOperations(
        [makeLocal({ syncInfo: { status: "locally-deleted", lastRemoteSavedAt: undefined } })],
        [],
      ),
    ).toMatchObject([{ type: "delete-local", local: true }]);
    expect(
      computeLayoutSyncOperations(
        [makeLocal({ syncInfo: { status: "remotely-deleted", lastRemoteSavedAt: undefined } })],
        [],
      ),
    ).toMatchObject([{ type: "delete-local", local: true }]);
  });

  it("keeps shared layouts as deleted cache entries and adds remote-only layouts", () => {
    const shared = makeLocal({
      permission: "ORG_WRITE",
      working: { data: { configById: {}, layout: "" }, savedAt: undefined },
      syncInfo: { status: "updated", lastRemoteSavedAt: undefined },
    });
    expect(computeLayoutSyncOperations([shared], [])).toMatchObject([
      { type: "mark-deleted", local: true },
    ]);
    expect(
      computeLayoutSyncOperations([], [makeRemote({ id: "remote-only" as never })]),
    ).toMatchObject([{ type: "add-to-cache", local: true }]);
  });
});
