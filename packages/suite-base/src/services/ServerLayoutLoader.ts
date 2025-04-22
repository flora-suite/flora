// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import Log from "@lichtblick/log";
import { LayoutData } from "@lichtblick/suite-base/context/CurrentLayoutContext";
import { LayoutLoader } from "@lichtblick/suite-base/services/ILayoutLoader";
import { LayoutInfo } from "@lichtblick/suite-base/types/layouts";

const log = Log.getLogger(__filename);

// Define the structure of the layout entry in the index.json file
interface LayoutEntry {
  name: string;
  filename: string;
}

/**
 * A server-based layout loader that fetches layouts from a specified server URL.
 * This allows all users to access the same set of layouts without having to install them individually.
 */
export class ServerLayoutLoader implements LayoutLoader {
  readonly #serverUrl: string;
  public readonly namespace: "local" = "local";

  /**
   * Create a new ServerLayoutLoader
   * @param serverUrl - The base URL where layouts are hosted
   */
  public constructor(serverUrl: string) {
    this.#serverUrl = serverUrl.endsWith("/") ? serverUrl : `${serverUrl}/`;
  }

  /**
   * Get a list of all available layouts from the server
   */
  public async fetchLayouts(): Promise<LayoutInfo[]> {
    try {
      // Fetch the index.json file
      const indexResponse = await fetch(`${this.#serverUrl}layouts/index.json`);
      if (!indexResponse.ok) {
        log.error(
          `Failed to fetch layouts index: ${indexResponse.status} ${indexResponse.statusText}`,
        );
        return [];
      }

      // Parse the index.json file
      const layoutEntries = (await indexResponse.json()) as LayoutEntry[];

      // Fetch and process each layout file
      const layoutPromises = layoutEntries.map(async (entry) => {
        const { name, filename } = entry;

        if (!filename) {
          return null;
        }

        const fullLayoutPath = `${this.#serverUrl}layouts/${filename}`;
        console.log(`Loading layout "${name}"`);

        try {
          const layoutResponse = await fetch(fullLayoutPath);
          if (!layoutResponse.ok) {
            return null;
          }

          const layoutData = await layoutResponse.json();

          // Ensure the layout data has the required structure
          const processedData: LayoutData = {
            ...layoutData,
            configById: layoutData.configById || layoutData.savedProps || {},
            globalVariables: layoutData.globalVariables || {},
            playbackConfig: layoutData.playbackConfig || { speed: 1.0 },
            userNodes: layoutData.userNodes || {
              foxglove: {
                nodes: {},
                nodesByKey: {},
                registry: {
                  nodes: {},
                  datatypes: {},
                },
              },
            },
          };

          return {
            name: name,
            from: `server-layout:${filename}`,
            data: processedData,
          };
        } catch (error) {
          return null;
        }
      });

      const layoutResults = await Promise.all(layoutPromises);
      const validLayouts = layoutResults.filter(Boolean) as LayoutInfo[];

      log.debug(`Loaded ${validLayouts.length} layouts from server`);
      return validLayouts;
    } catch (error) {
      log.error("Error fetching layouts from server", error);
      return [];
    }
  }
}
