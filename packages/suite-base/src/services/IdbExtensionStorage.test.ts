// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

import { StoredExtension } from "./IExtensionStorage";
import { IdbExtensionStorage } from "./IdbExtensionStorage";

const makeExtension = (id: string): StoredExtension => ({
  info: {
    id,
    description: "Test extension",
    displayName: "Test extension",
    homepage: "https://example.com",
    keywords: [],
    license: "MIT",
    name: id,
    publisher: "Test",
    qualifiedName: `local:Test:${id}`,
    version: "1.0.0",
  },
  content: new Uint8Array([1, 2, 3]),
});

describe("IdbExtensionStorage", () => {
  it("stores extension metadata and content in its namespace", async () => {
    const namespace = `extensions-${Date.now()}`;
    const storage = new IdbExtensionStorage(namespace);
    const first = makeExtension("first");
    const second = makeExtension("second");

    await expect(storage.put(first)).resolves.toEqual(first);
    await storage.put(second);

    await expect(storage.list()).resolves.toEqual(
      expect.arrayContaining([first.info, second.info]),
    );
    await expect(storage.get(first.info.id)).resolves.toEqual(first);
    await expect(storage.get("missing")).resolves.toBeUndefined();

    await storage.delete(first.info.id);
    await expect(storage.get(first.info.id)).resolves.toBeUndefined();
    await expect(storage.list()).resolves.toEqual([second.info]);
  });
});
