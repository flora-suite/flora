// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { createSelector } from "reselect";

import { ALLOWED_TAGS } from "@lichtblick/suite-base/panels/DiagnosticStatus/constants";
import {
  DiagnosticStatusMessage,
  FormattedKeyValue,
  KeyValue,
} from "@lichtblick/suite-base/panels/DiagnosticStatus/types";
import { sanitize } from "@lichtblick/suite-base/panels/DiagnosticStatus/utils/sanitize";

const HAS_ANY_HTML = new RegExp(`<(${ALLOWED_TAGS.join("|")})`);

// preliminary check to avoid expensive operations when there is no html
export const getFormattedKeyValues = createSelector(
  (message: DiagnosticStatusMessage) => message,
  (message: DiagnosticStatusMessage): FormattedKeyValue[] => {
    return message.values.map(({ key, value }: KeyValue) => {
      return {
        key,
        keyHtml: HAS_ANY_HTML.test(key) ? sanitize(key) : undefined,
        value,
        valueHtml: HAS_ANY_HTML.test(value) ? sanitize(value) : undefined,
      };
    });
  },
);
