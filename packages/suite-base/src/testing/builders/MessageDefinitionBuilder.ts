// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { MessageDefinition, MessageDefinitionField } from "@lichtblick/message-definition";
import BasicBuilder from "@lichtblick/suite-base/testing/builders/BasicBuilder";
import { defaults } from "@lichtblick/suite-base/testing/builders/utilities";

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export default class MessageDefinitionBuilder {
  public static messageDefinitionField(
    props: Partial<MessageDefinitionField> = {},
  ): MessageDefinitionField {
    return defaults<MessageDefinitionField>(props, {
      type: BasicBuilder.string(),
      name: BasicBuilder.string(),
      isComplex: BasicBuilder.boolean(),
      isArray: BasicBuilder.boolean(),
      arrayLength: BasicBuilder.number(),
      isConstant: BasicBuilder.boolean(),
      value: BasicBuilder.string(),
      defaultValue: BasicBuilder.string(),
      arrayUpperBound: BasicBuilder.number(),
      upperBound: BasicBuilder.number(),
      valueText: BasicBuilder.string(),
    });
  }

  public static messageDefinitionFields(count = 3): MessageDefinitionField[] {
    return BasicBuilder.multiple(MessageDefinitionBuilder.messageDefinitionField, count);
  }

  public static messageDefinition(props: Partial<MessageDefinition> = {}): MessageDefinition {
    return defaults<MessageDefinition>(props, {
      name: BasicBuilder.string(),
      definitions: MessageDefinitionBuilder.messageDefinitionFields(),
    });
  }
}
