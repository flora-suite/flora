// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  AddOutlined,
  ContentCopyOutlined,
  DeleteOutlined,
  EditOutlined,
  FileDownloadOutlined,
  MoreVertOutlined,
  SearchOutlined,
  ViewQuiltOutlined,
} from "@mui/icons-material";
import {
  Button,
  CircularProgress,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  Menu,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useMemo, useState, MouseEvent, ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { makeStyles } from "tss-react/mui";

import Stack from "@lichtblick/suite-base/components/Stack";
import { ConfirmDialog, RenameDialog } from "@lichtblick/suite-base/components/dialogs";
import { useCurrentOrganizationId } from "@lichtblick/suite-base/context/OrganizationContext";

const useStyles = makeStyles()((theme) => ({
  root: {
    height: "100%",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    padding: theme.spacing(3),
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  content: {
    flex: 1,
    overflow: "auto",
    padding: theme.spacing(3),
  },
  loadingState: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    minHeight: 400,
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    minHeight: 400,
    textAlign: "center",
    gap: theme.spacing(2),
  },
  emptyIcon: {
    fontSize: 80,
    color: theme.palette.text.disabled,
  },
  filters: {
    display: "flex",
    gap: theme.spacing(2),
    flexWrap: "wrap",
    alignItems: "center",
  },
  searchField: {
    minWidth: 300,
  },
  filterSelect: {
    minWidth: 150,
  },
  tableContainer: {
    marginTop: theme.spacing(2),
  },
  tableRow: {
    cursor: "pointer",
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
  },
}));

type TimeFilter = "all" | "today" | "week" | "month" | "year";

interface Layout {
  id: string;
  name: string;
  lastUpdated: Date;
  lastOpened?: Date;
}

// TODO: Replace with real API call
const mockLayouts: Layout[] = [
  {
    id: "1",
    name: "Default",
    lastUpdated: new Date(Date.now() - 365 * 86400000),
  },
  {
    id: "2",
    name: "Default222 copy",
    lastUpdated: new Date(Date.now() - 365 * 86400000),
  },
  {
    id: "3",
    name: "example-001-av",
    lastUpdated: new Date(Date.now() - 365 * 86400000),
  },
  {
    id: "4",
    name: "flkdsj",
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
  const currentOrganizationId = useCurrentOrganizationId();

  const [searchQuery, setSearchQuery] = useState("");
  const [layouts, setLayouts] = useState<Layout[]>(mockLayouts);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | undefined>(undefined);
  const [selectedLayout, setSelectedLayout] = useState<Layout | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [loading] = useState(false);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // TODO: Load layouts based on currentOrganizationId
  // useEffect(() => {
  //   loadLayouts(currentOrganizationId);
  // }, [currentOrganizationId]);

  // Log currentOrganizationId for future use
  console.debug("Current organization ID for layouts:", currentOrganizationId);

  const filteredLayouts = useMemo(() => {
    let result = layouts;

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
  }, [layouts, searchQuery, timeFilter]);

  // Paginated layouts
  const paginatedLayouts = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredLayouts.slice(start, start + rowsPerPage);
  }, [filteredLayouts, page, rowsPerPage]);

  const handleChangePage = useCallback((_event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

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
        lastUpdated: new Date(),
      };
      setLayouts((prev) => [...prev, newLayout]);
    }
    setMenuAnchor(undefined);
    setSelectedLayout(undefined);
  }, [selectedLayout]);

  const isEmpty = filteredLayouts.length === 0 && !loading;

  return (
    <Stack className={classes.root}>
      <div className={classes.header}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack gap={0.5}>
            <Typography variant="h5">{t("layoutsTitle")}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t("layoutsDescription")}
            </Typography>
          </Stack>
          <Button variant="contained" startIcon={<AddOutlined />} onClick={handleCreateLayout}>
            {t("createLayout")}
          </Button>
        </Stack>
      </div>

      <div className={classes.content}>
        {loading ? (
          <div className={classes.loadingState}>
            <CircularProgress />
          </div>
        ) : isEmpty ? (
          <div className={classes.emptyState}>
            <ViewQuiltOutlined className={classes.emptyIcon} />
            <Typography variant="h6" color="text.secondary">
              {t("noLayouts")}
            </Typography>
            <Typography variant="body2" color="text.secondary" maxWidth={400}>
              {t("noLayoutsDescription")}
            </Typography>
            <Button variant="contained" startIcon={<AddOutlined />} onClick={handleCreateLayout}>
              {t("createLayout")}
            </Button>
          </div>
        ) : (
          <Stack gap={2}>
            <div className={classes.filters}>
              <TextField
                className={classes.searchField}
                size="small"
                placeholder={t("layoutName")}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchOutlined fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <FormControl size="small" className={classes.filterSelect}>
                <InputLabel>{t("lastUpdated")}</InputLabel>
                <Select
                  value={timeFilter}
                  label={t("lastUpdated")}
                  onChange={(e) => {
                    setTimeFilter(e.target.value as TimeFilter);
                    setPage(0);
                  }}
                >
                  <MenuItem value="all">{t("allTime")}</MenuItem>
                  <MenuItem value="today">{t("today")}</MenuItem>
                  <MenuItem value="week">{t("thisWeek")}</MenuItem>
                  <MenuItem value="month">{t("thisMonth")}</MenuItem>
                  <MenuItem value="year">{t("thisYear")}</MenuItem>
                </Select>
              </FormControl>
            </div>

            <TableContainer component={Paper} className={classes.tableContainer}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t("layoutName")}</TableCell>
                    <TableCell>{t("lastUpdated")}</TableCell>
                    <TableCell>{t("lastOpened")}</TableCell>
                    <TableCell align="right">{t("actions")}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedLayouts.map((layout) => (
                    <TableRow
                      key={layout.id}
                      hover
                      className={classes.tableRow}
                      onClick={() => {
                        handleOpenLayout(layout);
                      }}
                    >
                      <TableCell>{layout.name}</TableCell>
                      <TableCell>
                        {formatTimeAgo(layout.lastUpdated, t as (key: string) => string)}
                      </TableCell>
                      <TableCell>
                        {layout.lastOpened
                          ? formatTimeAgo(layout.lastOpened, t as (key: string) => string)
                          : "-"}
                      </TableCell>
                      <TableCell align="right">
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
              <TablePagination
                component="div"
                count={filteredLayouts.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
                labelRowsPerPage={t("rowsPerPage")}
              />
            </TableContainer>

            {filteredLayouts.length === 0 && (
              <Stack alignItems="center" padding={4}>
                <Typography color="text.secondary">{t("noMatchingLayouts")}</Typography>
              </Stack>
            )}
          </Stack>
        )}
      </div>

      {/* Context Menu */}
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
