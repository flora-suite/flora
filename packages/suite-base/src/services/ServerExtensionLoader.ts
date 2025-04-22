// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import Log from "@lichtblick/log";
import { ExtensionLoader } from "@lichtblick/suite-base/services/ExtensionLoader";
import { ExtensionInfo, ExtensionNamespace } from "@lichtblick/suite-base/types/Extensions";

const log = Log.getLogger(__filename);

/**
 * A server-based extension loader that fetches extensions from a specified server URL.
 * This allows all users to access the same set of extensions without having to install them individually.
 */
export class ServerExtensionLoader implements ExtensionLoader {
  readonly #serverUrl: string;
  public readonly namespace: ExtensionNamespace;

  /**
   * Create a new ServerExtensionLoader
   * @param namespace - The extension namespace (e.g., "server")
   * @param serverUrl - The base URL where extensions are hosted
   */
  public constructor(namespace: ExtensionNamespace, serverUrl: string) {
    this.namespace = namespace;
    this.#serverUrl = serverUrl.endsWith("/") ? serverUrl : `${serverUrl}/`;
  }

  /**
   * Get a list of all available extensions from the server
   */
  public async getExtensions(): Promise<ExtensionInfo[]> {
    try {
      const response = await fetch(`${this.#serverUrl}extensions/index.json`);

      if (!response.ok) {
        log.error(`Failed to fetch extensions: ${response.status} ${response.statusText}`);
        return [];
      }

      const extensions = (await response.json()) as ExtensionInfo[];
      log.debug(`Loaded ${extensions.length} extensions from server`);
      return extensions;
    } catch (error) {
      log.error("Error fetching extensions from server", error);
      return [];
    }
  }

  /**
   * Load the source code for a specific extension from the server
   */
  public async loadExtension(id: string): Promise<string> {
    try {
      // Look for extensions with version suffixes like id-x.y.z
      const extensions = await this.getExtensions();
      const extensionInfo = extensions.find((ext) => ext.id === id);

      if (!extensionInfo?.version) {
        throw new Error(`Extension ${id} not found in index.json or missing version information`);
      }

      const response = await fetch(
        `${this.#serverUrl}extensions/${id}-${extensionInfo.version}/dist/extension.js`,
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load extension ${id}: ${response.status} ${response.statusText}`,
        );
      }

      const srcText = await response.text();
      return srcText;
    } catch (error) {
      log.error(`Error loading extension ${id} from server`, error);
      throw new Error(`Failed to load extension ${id}: ${error}`);
    }
  }

  /**
   * Install extension is not supported for server-based extensions
   * These extensions are managed on the server side
   */
  public async installExtension(_foxeFileData: Uint8Array): Promise<ExtensionInfo> {
    throw new Error(
      "Installing extensions is not supported with ServerExtensionLoader. Extensions must be managed on the server.",
    );
  }

  /**
   * Uninstall extension is not supported for server-based extensions
   * These extensions are managed on the server side
   */
  public async uninstallExtension(_id: string): Promise<void> {
    throw new Error(
      "Uninstalling extensions is not supported with ServerExtensionLoader. Extensions must be managed on the server.",
    );
  }
}
