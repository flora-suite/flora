// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import BasicBuilder from "@lichtblick/suite-base/testing/builders/BasicBuilder";
import MessageDefinitionBuilder from "@lichtblick/suite-base/testing/builders/MessageDefinitionBuilder";
import { defaults } from "@lichtblick/suite-base/testing/builders/utilities";
import { OptionalMessageDefinition } from "@lichtblick/suite-base/types/RosDatatypes";

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export default class RosDatatypesBuilder {
  public static optionalMessageDefinition(
    props: Partial<OptionalMessageDefinition> = {},
  ): OptionalMessageDefinition {
    return defaults<OptionalMessageDefinition>(props, {
      definitions: MessageDefinitionBuilder.messageDefinitionFields(),
      name: BasicBuilder.string(),
    });
  }
}
