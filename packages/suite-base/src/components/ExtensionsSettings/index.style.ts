// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { makeStyles } from "tss-react/mui";

export const useStyles = makeStyles()(() => ({
  searchBarDiv: {
    position: "sticky",
    top: 0,
    zIndex: 1,
  },
  searchBarPadding: {
    paddingBottom: 13,
  },
}));
