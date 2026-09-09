// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

import {
  DataSourceFactoryInitializeArgs,
  IDataSourceFactory,
} from "@lichtblick/suite-base/context/PlayerSelectionContext";
import { RegisteredDataLoader } from "@lichtblick/suite-base/context/ExtensionCatalogContext";
import { IterablePlayer } from "@lichtblick/suite-base/players/IterablePlayer";
import { WasmDataLoaderIterableSource } from "@lichtblick/suite-base/players/IterablePlayer/WasmDataLoader/WasmDataLoaderIterableSource";
import { Player } from "@lichtblick/suite-base/players/types";
import { mergeMultipleFileNames } from "@lichtblick/suite-base/util/mergeMultipleFileName";

export class WasmDataLoaderDataSourceFactory implements IDataSourceFactory {
  readonly #registration: RegisteredDataLoader;

  public constructor(registration: RegisteredDataLoader) {
    this.#registration = registration;
  }

  public get id(): string {
    return `extension-data-loader:${this.#registration.extensionId}:${this.#registration.supportedFileType}`;
  }

  public type: IDataSourceFactory["type"] = "file";
  public get displayName(): string {
    return `${this.#registration.extensionId} (${this.#registration.supportedFileType})`;
  }
  public iconName: IDataSourceFactory["iconName"] = "OpenFile";
  public get supportedFileTypes(): string[] {
    return [this.#registration.supportedFileType];
  }
  public get supportsMultiFile(): boolean {
    return this.#registration.supportsMultiFile ?? false;
  }

  public initialize(args: DataSourceFactoryInitializeArgs): Player | undefined {
    const files = [...(args.files ?? []), ...(args.file ? [args.file] : [])];
    if (files.length === 0 || (!this.supportsMultiFile && files.length !== 1)) {
      return;
    }
    return new IterablePlayer({
      metricsCollector: args.metricsCollector,
      source: new WasmDataLoaderIterableSource({ wasmUrl: this.#registration.wasmUrl, files }),
      name: mergeMultipleFileNames(files.map((file) => file.name)),
      sourceId: this.id,
    });
  }
}
