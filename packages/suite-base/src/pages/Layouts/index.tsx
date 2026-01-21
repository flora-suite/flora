// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  AddOutlined,
  BusinessOutlined,
  ContentCopyOutlined,
  DeleteOutlined,
  EditOutlined,
  FileDownloadOutlined,
  GridViewOutlined,
  MoreVertOutlined,
  PersonOutlined,
  ViewQuiltOutlined,
} from "@mui/icons-material";
import {
  Button,
  Checkbox,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  MenuList,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useMemo, useState, MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { makeStyles } from "tss-react/mui";

import Stack from "@lichtblick/suite-base/components/Stack";
import { ConfirmDialog, RenameDialog } from "@lichtblick/suite-base/components/dialogs";

const useStyles = makeStyles()((theme) => ({
  root: {
    height: "100%",
    overflow: "hidden",
    display: "flex",
    flexDirection: "row",
  },
  sidebar: {
    width: 200,
    borderRight: `1px solid ${theme.palette.divider}`,
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    padding: theme.spacing(2),
  },
  sidebarHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing(2),
  },
  filterItem: {
    borderRadius: theme.shape.borderRadius,
    "&.Mui-selected": {
      backgroundColor: theme.palette.action.selected,
    },
  },
  content: {
    flex: 1,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  contentHeader: {
    padding: theme.spacing(2, 3),
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  filterRow: {
    display: "flex",
    gap: theme.spacing(2),
    alignItems: "center",
  },
  searchField: {
    flex: 1,
    maxWidth: 400,
  },
  timeFilter: {
    minWidth: 150,
  },
  tableContainer: {
    flex: 1,
    overflow: "auto",
  },
  tableRow: {
    cursor: "pointer",
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    minHeight: 300,
    textAlign: "center",
    gap: theme.spacing(2),
  },
  emptyIcon: {
    fontSize: 64,
    color: theme.palette.text.disabled,
  },
  typeCell: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
  },
}));

type LayoutFilter = "all" | "personal" | "organization";
type TimeFilter = "all" | "today" | "week" | "month" | "year";

interface Layout {
  id: string;
  name: string;
  type: "personal" | "organization";
  lastUpdated: Date;
  lastOpened?: Date;
}

const mockLayouts: Layout[] = [
  {
    id: "1",
    name: "Default",
    type: "personal",
    lastUpdated: new Date(Date.now() - 365 * 86400000),
  },
  {
    id: "2",
    name: "Default222 copy",
    type: "personal",
    lastUpdated: new Date(Date.now() - 365 * 86400000),
  },
  {
    id: "3",
    name: "example-001-av",
    type: "personal",
    lastUpdated: new Date(Date.now() - 365 * 86400000),
  },
  {
    id: "4",
    name: "flkdsj",
    type: "personal",
    lastUpdated: new Date(Date.now() - 365 * 86400000),
    lastOpened: new Date(Date.now() - 60000),
  },
];

function formatTimeAgo(date: Date, t: (key: string) => string): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const years = Math.floor(days / 365);

  if (minutes < 1) {
    return t("justNow");
  }
  if (minutes < 60) {
    return `${minutes}${t("minutesAgo")}`;
  }
  if (hours < 24) {
    return `${hours}${t("hoursAgo")}`;
  }
  if (days < 365) {
    return `${days}${t("daysAgo")}`;
  }
  return `${years}${t("yearsAgo")}`;
}

export function LayoutsPage(): React.JSX.Element {
  const { classes } = useStyles();
  const { t } = useTranslation("pages");
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [layouts, setLayouts] = useState<Layout[]>(mockLayouts);
  const [filter, setFilter] = useState<LayoutFilter>("personal");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | undefined>(undefined);
  const [selectedLayout, setSelectedLayout] = useState<Layout | undefined>(undefined);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);

  const filteredLayouts = useMemo(() => {
    let result = layouts;

    // Filter by type
    if (filter === "personal") {
      result = result.filter((l) => l.type === "personal");
    } else if (filter === "organization") {
      result = result.filter((l) => l.type === "organization");
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((l) => l.name.toLowerCase().includes(query));
    }

    // Filter by time
    if (timeFilter !== "all") {
      const now = new Date();
      const cutoff = new Date();
      switch (timeFilter) {
        case "today":
          cutoff.setHours(0, 0, 0, 0);
          break;
        case "week":
          cutoff.setDate(now.getDate() - 7);
          break;
        case "month":
          cutoff.setMonth(now.getMonth() - 1);
          break;
        case "year":
          cutoff.setFullYear(now.getFullYear() - 1);
          break;
      }
      result = result.filter((l) => l.lastUpdated >= cutoff);
    }

    return result;
  }, [layouts, filter, searchQuery, timeFilter]);

  const handleMenuOpen = useCallback((event: MouseEvent<HTMLElement>, layout: Layout) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setSelectedLayout(layout);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuAnchor(undefined);
    setSelectedLayout(undefined);
  }, []);

  const handleOpenLayout = useCallback(
    (_layout: Layout) => {
      void navigate("/view");
    },
    [navigate],
  );

  const handleCreateLayout = useCallback(() => {
    void navigate("/view");
  }, [navigate]);

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedIds(new Set(filteredLayouts.map((l) => l.id)));
      } else {
        setSelectedIds(new Set());
      }
    },
    [filteredLayouts],
  );

  const handleSelectOne = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const handleRenameClick = useCallback(() => {
    setRenameDialogOpen(true);
    setMenuAnchor(undefined);
  }, []);

  const handleRenameConfirm = useCallback(
    (newName: string) => {
      if (selectedLayout) {
        setLayouts((prev) =>
          prev.map((l) => (l.id === selectedLayout.id ? { ...l, name: newName } : l)),
        );
      }
      setRenameDialogOpen(false);
      setSelectedLayout(undefined);
    },
    [selectedLayout],
  );

  const handleRenameCancel = useCallback(() => {
    setRenameDialogOpen(false);
    setSelectedLayout(undefined);
  }, []);

  const handleDeleteClick = useCallback(() => {
    setDeleteDialogOpen(true);
    setMenuAnchor(undefined);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (selectedLayout) {
      setLayouts((prev) => prev.filter((l) => l.id !== selectedLayout.id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(selectedLayout.id);
        return next;
      });
    }
    setDeleteDialogOpen(false);
    setSelectedLayout(undefined);
  }, [selectedLayout]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setSelectedLayout(undefined);
  }, []);

  const handleDuplicateClick = useCallback(() => {
    if (selectedLayout) {
      const newLayout: Layout = {
        id: String(Date.now()),
        name: `${selectedLayout.name} copy`,
        type: selectedLayout.type,
        lastUpdated: new Date(),
      };
      setLayouts((prev) => [...prev, newLayout]);
    }
    setMenuAnchor(undefined);
    setSelectedLayout(undefined);
  }, [selectedLayout]);

  const getFilterTitle = () => {
    switch (filter) {
      case "all":
        return t("allLayouts");
      case "personal":
        return t("personal");
      case "organization":
        return t("organization");
    }
  };

  const isEmpty = filteredLayouts.length === 0;

  return (
    <Stack className={classes.root}>
      {/* Left Sidebar */}
      <div className={classes.sidebar}>
        <div className={classes.sidebarHeader}>
          <Typography variant="h6">{t("layoutsTitle")}</Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddOutlined />}
            onClick={handleCreateLayout}
          >
            {t("add")}
          </Button>
        </div>

        <MenuList>
          <MenuItem
            selected={filter === "all"}
            className={classes.filterItem}
            onClick={() => {
              setFilter("all");
            }}
          >
            <ListItemIcon>
              <GridViewOutlined fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t("allLayouts")}</ListItemText>
          </MenuItem>
          <MenuItem
            selected={filter === "personal"}
            className={classes.filterItem}
            onClick={() => {
              setFilter("personal");
            }}
          >
            <ListItemIcon>
              <PersonOutlined fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t("personal")}</ListItemText>
          </MenuItem>
          <MenuItem
            selected={filter === "organization"}
            className={classes.filterItem}
            onClick={() => {
              setFilter("organization");
            }}
          >
            <ListItemIcon>
              <BusinessOutlined fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t("organization")}</ListItemText>
          </MenuItem>
        </MenuList>
      </div>

      {/* Right Content */}
      <div className={classes.content}>
        <div className={classes.contentHeader}>
          <Typography variant="h6" gutterBottom>
            {getFilterTitle()}
          </Typography>
          <div className={classes.filterRow}>
            <TextField
              className={classes.searchField}
              size="small"
              placeholder={t("layoutName")}
              label={t("search")}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
            />
            <Select
              className={classes.timeFilter}
              size="small"
              value={timeFilter}
              onChange={(e) => {
                setTimeFilter(e.target.value as TimeFilter);
              }}
              label={t("lastUpdated")}
            >
              <MenuItem value="all">{t("allTime")}</MenuItem>
              <MenuItem value="today">{t("today")}</MenuItem>
              <MenuItem value="week">{t("thisWeek")}</MenuItem>
              <MenuItem value="month">{t("thisMonth")}</MenuItem>
              <MenuItem value="year">{t("thisYear")}</MenuItem>
            </Select>
          </div>
        </div>

        {isEmpty ? (
          <div className={classes.emptyState}>
            <ViewQuiltOutlined className={classes.emptyIcon} />
            <Typography variant="h6" color="text.secondary">
              {t("noLayouts")}
            </Typography>
            <Typography variant="body2" color="text.secondary" maxWidth={400}>
              {t("noLayoutsDescription")}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddOutlined />}
              onClick={handleCreateLayout}
            >
              {t("createLayout")}
            </Button>
          </div>
        ) : (
          <TableContainer component={Paper} className={classes.tableContainer} elevation={0}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={
                        selectedIds.size > 0 && selectedIds.size < filteredLayouts.length
                      }
                      checked={selectedIds.size === filteredLayouts.length && filteredLayouts.length > 0}
                      onChange={(e) => {
                        handleSelectAll(e.target.checked);
                      }}
                    />
                  </TableCell>
                  <TableCell>{t("layoutsTitle")}</TableCell>
                  <TableCell>{t("type")}</TableCell>
                  <TableCell>{t("lastUpdated")}</TableCell>
                  <TableCell>{t("lastOpened")}</TableCell>
                  <TableCell padding="checkbox" />
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLayouts.map((layout) => (
                  <TableRow
                    key={layout.id}
                    className={classes.tableRow}
                    onClick={() => {
                      handleOpenLayout(layout);
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedIds.has(layout.id)}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        onChange={(e) => {
                          handleSelectOne(layout.id, e.target.checked);
                        }}
                      />
                    </TableCell>
                    <TableCell>{layout.name}</TableCell>
                    <TableCell>
                      <div className={classes.typeCell}>
                        <PersonOutlined fontSize="small" color="action" />
                        <Typography variant="body2">
                          {layout.type === "personal" ? t("personal") : t("organization")}
                        </Typography>
                      </div>
                    </TableCell>
                    <TableCell>{formatTimeAgo(layout.lastUpdated, t as (key: string) => string)}</TableCell>
                    <TableCell>
                      {layout.lastOpened ? formatTimeAgo(layout.lastOpened, t as (key: string) => string) : ""}
                    </TableCell>
                    <TableCell padding="checkbox">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          handleMenuOpen(e, layout);
                        }}
                      >
                        <MoreVertOutlined fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </div>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
        <MenuItem
          onClick={() => {
            if (selectedLayout) {
              handleOpenLayout(selectedLayout);
            }
            handleMenuClose();
          }}
        >
          <Stack direction="row" alignItems="center" gap={1}>
            <ViewQuiltOutlined fontSize="small" />
            {t("view")}
          </Stack>
        </MenuItem>
        <MenuItem onClick={handleRenameClick}>
          <Stack direction="row" alignItems="center" gap={1}>
            <EditOutlined fontSize="small" />
            {t("rename")}
          </Stack>
        </MenuItem>
        <MenuItem onClick={handleDuplicateClick}>
          <Stack direction="row" alignItems="center" gap={1}>
            <ContentCopyOutlined fontSize="small" />
            {t("duplicate")}
          </Stack>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Stack direction="row" alignItems="center" gap={1}>
            <FileDownloadOutlined fontSize="small" />
            {t("exportLayout")}
          </Stack>
        </MenuItem>
        <MenuItem onClick={handleDeleteClick}>
          <Stack direction="row" alignItems="center" gap={1} style={{ color: "error.main" }}>
            <DeleteOutlined fontSize="small" color="error" />
            {t("delete")}
          </Stack>
        </MenuItem>
      </Menu>

      <ConfirmDialog
        open={deleteDialogOpen}
        title={t("deleteLayout")}
        message={t("deleteLayoutConfirm", { name: selectedLayout?.name ?? "" })}
        confirmLabel={t("delete")}
        variant="error"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      <RenameDialog
        open={renameDialogOpen}
        title={t("renameLayout")}
        label={t("layoutName")}
        initialValue={selectedLayout?.name ?? ""}
        onConfirm={handleRenameConfirm}
        onCancel={handleRenameCancel}
      />
    </Stack>
  );
}
