// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Immutable } from "immer";

import {
  SettingsTreeAction,
  SettingsTreeField,
  SettingsTreeNode,
  SettingsTreeNodeAction,
} from "@lichtblick/suite";

export type NodeActionsMenuProps = {
  actions: readonly SettingsTreeNodeAction[];
  onSelectAction: (actionId: string) => void;
};

export type NodeEditorProps = {
  actionHandler: (action: SettingsTreeAction) => void;
  defaultOpen?: boolean;
  filter?: string;
  focusedPath?: readonly string[];
  path: readonly string[];
  settings?: Immutable<SettingsTreeNode>;
};

export type SelectVisibilityFilterValue = "all" | "visible" | "invisible";

export type FieldEditorProps = {
  actionHandler: (action: SettingsTreeAction) => void;
  field: Immutable<SettingsTreeField>;
  path: readonly string[];
};
