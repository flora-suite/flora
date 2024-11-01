// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

export type NumberBuilder = {
  min: number;
  max: number;
};

export type StringBuilder = {
  capitalization?: Capitalization;
  charset: "alphanumeric" | "alphabetic" | "numeric";
  count?: number;
  length: number;
};

export type MapBuilder = StringBuilder & {
  count?: number;
};

export enum Capitalization {
  LOWERCASE = "lowercase",
  UPPERCASE = "uppercase",
}

export type SamplePropertyKey = string | symbol | number;
