// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { MessagePath } from "@lichtblick/message-path";
import { MessageEvent } from "@lichtblick/suite";
import { GlobalVariables } from "@lichtblick/suite-base/hooks/useGlobalVariables";

export type GaugeAndIndicatorState = {
  error: Error | undefined;
  globalVariables: GlobalVariables | undefined;
  latestMatchingQueriedData: unknown;
  latestMessage: MessageEvent | undefined;
  parsedPath: MessagePath | undefined;
  path: string;
  pathParseError: string | undefined;
};

export type FrameAction = { type: "frame"; messages: readonly MessageEvent[] };
export type PathAction = { type: "path"; path: string };
export type SeekAction = { type: "seek" };
export type UpdateGlobalVariablesAction = {
  type: "updateGlobalVariables";
  globalVariables: GlobalVariables;
};
export type GaugeAndIndicatorAction =
  | FrameAction
  | PathAction
  | SeekAction
  | UpdateGlobalVariablesAction;
