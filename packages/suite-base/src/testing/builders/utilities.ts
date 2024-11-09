// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as _ from "lodash-es";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function defaults<T extends Record<string, any>>(props: Partial<T>, fallbackProps: T): T {
  return _.defaults<Partial<T>, T>({ ...props }, fallbackProps);
}
