// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ChevronDown12Regular, ChevronRight12Regular } from "@fluentui/react-icons";
import { Typography, List, Collapse, IconButton } from "@mui/material";
import { MouseEvent, useState, useEffect, useCallback } from "react";
import { makeStyles } from "tss-react/mui";

import Stack from "@lichtblick/suite-base/components/Stack";
import { Layout } from "@lichtblick/suite-base/services/ILayoutStorage";

import LayoutRow from "./LayoutRow";

const STORAGE_KEY_PREFIX = "flora.layoutSection.expanded.";

const useStyles = makeStyles()((theme) => ({
  header: {
    cursor: "pointer",
    userSelect: "none",
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
  },
  collapseButton: {
    padding: theme.spacing(0.25),
    marginRight: theme.spacing(0.5),
  },
  title: {
    flex: 1,
  },
}));

function getStoredExpandedState(sectionId: string, defaultValue: boolean): boolean {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${sectionId}`);
    if (stored != undefined) {
      return stored === "true";
    }
    return defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStoredExpandedState(sectionId: string, expanded: boolean): void {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${sectionId}`, String(expanded));
  } catch {
    // Ignore storage errors
  }
}

export default function LayoutSection({
  title,
  disablePadding = false,
  emptyText,
  items,
  anySelectedModifiedLayouts,
  multiSelectedIds,
  selectedId,
  onSelect,
  onRename,
  onDuplicate,
  onDelete,
  onShare,
  onExport,
  onOverwrite,
  onRevert,
  onMakePersonalCopy,
  defaultExpanded = true,
  sectionId,
}: {
  title: string | undefined;
  disablePadding?: boolean;
  emptyText: string | undefined;
  items: readonly Layout[] | undefined;
  anySelectedModifiedLayouts: boolean;
  multiSelectedIds: readonly string[];
  selectedId?: string;
  onSelect: (item: Layout, params?: { selectedViaClick?: boolean; event?: MouseEvent }) => void;
  onRename: (item: Layout, newName: string) => void;
  onDuplicate: (item: Layout) => void;
  onDelete: (item: Layout) => void;
  onShare: (item: Layout) => void;
  onExport: (item: Layout) => void;
  onOverwrite: (item: Layout) => void;
  onRevert: (item: Layout) => void;
  onMakePersonalCopy: (item: Layout) => void;
  defaultExpanded?: boolean;
  sectionId?: string;
}): React.JSX.Element {
  const { classes } = useStyles();
  const storageKey = sectionId ?? title ?? "";
  const [expanded, setExpanded] = useState(() =>
    getStoredExpandedState(storageKey, defaultExpanded),
  );

  useEffect(() => {
    if (storageKey) {
      setStoredExpandedState(storageKey, expanded);
    }
  }, [storageKey, expanded]);

  const handleToggle = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const itemCount = items?.length ?? 0;

  return (
    <Stack>
      {title != undefined && (
        <div className={classes.header} onClick={handleToggle}>
          <Stack direction="row" alignItems="center" paddingX={2} paddingY={disablePadding ? 0.5 : 0}>
            <IconButton
              className={classes.collapseButton}
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleToggle();
              }}
            >
              {expanded ? <ChevronDown12Regular /> : <ChevronRight12Regular />}
            </IconButton>
            <Typography variant="overline" color="text.secondary" className={classes.title}>
              {title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {itemCount}
            </Typography>
          </Stack>
        </div>
      )}
      <Collapse in={title == undefined || expanded}>
        <List disablePadding={disablePadding}>
          {items != undefined && items.length === 0 && (
            <Stack paddingX={2}>
              <Typography variant="body2" color="text.secondary">
                {emptyText}
              </Typography>
            </Stack>
          )}
          {items?.map((layout) => (
            <LayoutRow
              anySelectedModifiedLayouts={anySelectedModifiedLayouts}
              multiSelectedIds={multiSelectedIds}
              selected={layout.id === selectedId}
              key={layout.id}
              layout={layout}
              onSelect={onSelect}
              onRename={onRename}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              onShare={onShare}
              onExport={onExport}
              onOverwrite={onOverwrite}
              onRevert={onRevert}
              onMakePersonalCopy={onMakePersonalCopy}
            />
          ))}
        </List>
      </Collapse>
    </Stack>
  );
}
