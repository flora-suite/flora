// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { fn } from "storybook/test";

export function action(_name: string): ReturnType<typeof fn> {
  return fn();
}
