// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { makeStyles } from "tss-react/mui";

export const useStyles = makeStyles()((theme) => ({
  appBar: {
    top: 0,
    marginRight: 1,
    zIndex: theme.zIndex.appBar,
    padding: theme.spacing(0.5),
    position: "sticky",
    backgroundColor: theme.palette.background.paper,
  },
  fieldGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(20%, 20ch) auto",
    columnGap: theme.spacing(1),
  },
  textField: {
    ".MuiOutlinedInput-notchedOutline": {
      border: "none",
    },
  },
  startAdornment: {
    display: "flex",
  },
}));
