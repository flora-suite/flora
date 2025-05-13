// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { makeStyles } from "tss-react/mui";

export const useStyles = makeStyles()((theme) => ({
  overlayStyle: {
    position: "absolute",
    zIndex: 999,
    backgroundColor: theme.palette.background.default,
    width: "100%",
    height: "100%",
  },
  // CSS hack to disable the first level of drop targets inside a Tab's own mosaic window (that would
  // place the dropped item as a sibling of the Tab), as well as the "root drop targets" inside the
  // nested mosaic (that would place the dropped item as a direct child of the Tab). Makes it easier
  // to drop panels into a tab layout.
  hideTopLevelDropTargets: {
    margin: 0,

    ".mosaic-root + .drop-target-container": {
      display: "none !important",
    },
    "& > .mosaic-window > .drop-target-container": {
      display: "none !important",
    },
  },
}));
