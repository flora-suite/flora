// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  iconButtonClasses,
  inputBaseClasses,
  listItemTextClasses,
  selectClasses,
} from "@mui/material";
import { makeStyles } from "tss-react/mui";

export const useStyles = makeStyles()((theme) => ({
  listItemButton: {
    padding: 0,

    [`.${iconButtonClasses.root}`]: {
      visibility: "hidden",

      "&:hover": {
        backgroundColor: "transparent",
      },
    },
    [`.${listItemTextClasses.root}`]: {
      gap: theme.spacing(1),
      display: "flex",
    },
    [`&:hover .${iconButtonClasses.root}`]: {
      visibility: "visible",
    },
  },
  select: {
    [`.${inputBaseClasses.input}.${selectClasses.select}.${inputBaseClasses.inputSizeSmall}`]: {
      paddingTop: 0,
      paddingBottom: 0,
      minWidth: 40,
    },
    [`.${listItemTextClasses.root}`]: {
      marginTop: 0,
      marginBottom: 0,
    },
  },
}));
