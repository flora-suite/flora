// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Time } from "@lichtblick/rostime";
import BasicBuilder from "@lichtblick/suite-base/testing/builders/BasicBuilder";
import { defaults } from "@lichtblick/suite-base/testing/builders/utilities";

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export default class RosTimeBuilder {
  public static time(props: Partial<Time> = {}): Time {
    return defaults<Time>(props, {
      nsec: BasicBuilder.number(),
      sec: BasicBuilder.number(),
    });
  }
}
