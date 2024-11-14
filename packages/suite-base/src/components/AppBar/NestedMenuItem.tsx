// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Divider, ListItemIcon, ListItemText, MenuItem, Typography } from "@mui/material";
import { PropsWithChildren } from "react";
import { makeStyles } from "tss-react/mui";

import { AppBarMenuItem } from "./types";

const useStyles = makeStyles<void, "endIcon">()((theme, _params, classes) => ({
  menuItem: {
    justifyContent: "space-between",
    cursor: "pointer",
    gap: theme.spacing(1),
    ".MuiListItemIcon-root": {
      minWidth: "auto",
    },
    "&.Mui-selected, &.Mui-selected:hover": {
      backgroundColor: theme.palette.action.hover,
    },
    [`:not(:hover, :focus) .${classes.endIcon}`]: {
      opacity: 0.6,
    },
    kbd: {
      font: "inherit",
      color: theme.palette.text.disabled,
    },
  },
  endIcon: {
    marginRight: theme.spacing(-0.75),
  },
}));

export function NestedMenuItem(
  props: PropsWithChildren<{
    items: AppBarMenuItem[];
  }>,
): JSX.Element {
  const { classes } = useStyles();
  const { items } = props;

  return (
    <>
      {items.map((item, idx) => {
        switch (item.type) {
          case "item":
            return (
              <MenuItem
                className={classes.menuItem}
                key={item.key}
                onClick={item.onClick}
                data-testid={item.dataTestId}
                disabled={item.disabled}
                dense={true}
              >
                {item.icon != undefined ? <ListItemIcon>{item.icon}</ListItemIcon> : ReactNull}
                <ListItemText>{item.label}</ListItemText>
                {item.shortcut && <Typography flex-grow-0 variant="body2">
                  <kbd>{item.shortcut}</kbd>
                </Typography>}
              </MenuItem>
            );
          case "divider":
            return <Divider variant="middle" key={`divider${idx}`} />;
          case "subheader":
            return (
              <MenuItem disabled key={item.key}>
                <Typography variant="overline">{item.label}</Typography>
              </MenuItem>
            );
        }
      })}
    </>
  );
}
