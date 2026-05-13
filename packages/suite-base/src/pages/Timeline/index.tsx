// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  AccessTimeOutlined,
  ChevronLeftOutlined,
  ChevronRightOutlined,
  CloseOutlined,
  CloudUploadOutlined,
  TimelineOutlined,
} from "@mui/icons-material";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Popover,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { DateCalendar, MonthCalendar, YearCalendar } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { enUS, zhCN } from "date-fns/locale";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { makeStyles } from "tss-react/mui";

import { LoginRequiredPlaceholder } from "@lichtblick/suite-base/components/LoginRequiredPlaceholder";
import Stack from "@lichtblick/suite-base/components/Stack";
import { useAuth } from "@lichtblick/suite-base/context/AuthContext";
import { useDevices } from "@lichtblick/suite-base/context/DeviceContext";
import { useCurrentOrganizationId } from "@lichtblick/suite-base/context/OrganizationContext";
import { usePlayerSelection } from "@lichtblick/suite-base/context/PlayerSelectionContext";
import { useRecordings } from "@lichtblick/suite-base/context/RecordingContext";
import type { Recording } from "@lichtblick/suite-base/services/IRecordingService";

const useStyles = makeStyles()((theme) => ({
  root: {
    height: "100%",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    backgroundColor: theme.palette.background.default,
  },
  header: {
    padding: theme.spacing(3),
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  toolbar: {
    padding: theme.spacing(1.5, 3),
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
  },
  toolbarLeft: {
    display: "flex",
    alignItems: "center",
    flex: 1,
  },
  toolbarCenter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  toolbarRight: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    flex: 1,
  },
  filterInput: {
    minWidth: 200,
  },
  dateNavigation: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(0.5),
  },
  dateButton: {
    minWidth: 200,
    textAlign: "center",
    cursor: "pointer",
    padding: theme.spacing(0.5, 1.5),
    borderRadius: theme.shape.borderRadius,
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
  },
  content: {
    flex: 1,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    padding: theme.spacing(3),
  },
  timelineContainer: {
    flex: 1,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.paper,
  },
  timelineHeader: {
    display: "flex",
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  deviceColumn: {
    width: 150,
    flexShrink: 0,
    padding: theme.spacing(0.5, 1.5),
    borderRight: `1px solid ${theme.palette.divider}`,
    display: "flex",
    alignItems: "center",
  },
  timeRuler: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    position: "relative",
    height: 36,
    overflow: "hidden",
  },
  timeLabel: {
    position: "absolute",
    fontSize: 11,
    color: theme.palette.text.secondary,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    whiteSpace: "nowrap",
  },
  timelineBody: {
    flex: 1,
    overflow: "auto",
  },
  deviceRow: {
    display: "flex",
    borderBottom: `1px solid ${theme.palette.divider}`,
    minHeight: 36,
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
  },
  deviceName: {
    width: 150,
    flexShrink: 0,
    padding: theme.spacing(0.5, 1.5),
    display: "flex",
    alignItems: "center",
    borderRight: `1px solid ${theme.palette.divider}`,
    cursor: "pointer",
    "&:hover": {
      color: theme.palette.primary.main,
    },
  },
  trackContainer: {
    flex: 1,
    position: "relative",
    height: 36,
  },
  segment: {
    position: "absolute",
    top: 4,
    height: 28,
    borderRadius: 3,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: theme.transitions.create(["opacity", "box-shadow"]),
    minWidth: 2,
    "&:hover": {
      opacity: 0.9,
      boxShadow: theme.shadows[4],
    },
  },
  segmentDuration: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 10,
    fontWeight: 500,
    textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    padding: "0 3px",
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
  dialogTitle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing(2, 3),
  },
  dialogContent: {
    padding: theme.spacing(0, 3, 3, 3),
  },
  timeInput: {
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.shape.borderRadius,
  },
  calendarPopover: {
    padding: theme.spacing(1),
  },
  weekCalendar: {
    "& .MuiPickersDay-root": {
      "&.week-selected": {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        "&:hover": {
          backgroundColor: theme.palette.primary.dark,
        },
      },
    },
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    padding: theme.spacing(6),
  },
}));

// Device colors for segments
const DEVICE_COLORS = [
  "#f87171", // red
  "#60a5fa", // blue
  "#4ade80", // green
  "#facc15", // yellow
  "#f472b6", // pink
  "#22d3d1", // cyan
  "#a78bfa", // purple
  "#fb923c", // orange
];

type ViewMode = "day" | "week" | "month" | "year";

interface TimelineSegment {
  id: string;
  deviceId: string;
  startTime: Date;
  endTime: Date;
  recordingId: string;
  recordingName: string;
}

interface TimelineDevice {
  id: string;
  name: string;
  color: string;
}

interface TimeLabel {
  key: string;
  label: string;
  position: number;
  align: "start" | "center" | "end";
}

function formatDuration(startTime: Date, endTime: Date): string {
  const diffMs = endTime.getTime() - startTime.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  const secs = Math.floor((diffMs % 60000) / 1000);

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins.toString().padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`;
}

function formatTimeForInput(date: Date): string {
  const hours = date.getHours();
  const mins = date.getMinutes();
  const secs = date.getSeconds();
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")} ${ampm}`;
}

// Get start of day
function getStartOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

// Get start of week (Sunday)
function getStartOfWeek(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - result.getDay());
  return result;
}

// Get start of month
function getStartOfMonth(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(1);
  return result;
}

// Get start of year
function getStartOfYear(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setMonth(0, 1);
  return result;
}

// Get time range based on view mode
function getTimeRange(
  date: Date,
  viewMode: ViewMode,
): { start: Date; end: Date } {
  switch (viewMode) {
    case "day": {
      const start = getStartOfDay(date);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      return { start, end };
    }
    case "week": {
      const start = getStartOfWeek(date);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      return { start, end };
    }
    case "month": {
      const start = getStartOfMonth(date);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      return { start, end };
    }
    case "year": {
      const start = getStartOfYear(date);
      const end = new Date(start);
      end.setFullYear(end.getFullYear() + 1);
      return { start, end };
    }
  }
}

// Format date display based on view mode and locale
function formatDateDisplay(
  date: Date,
  viewMode: ViewMode,
  locale: string,
): string {
  const isZh = locale.startsWith("zh");

  switch (viewMode) {
    case "day": {
      if (isZh) {
        return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
      }
      return date.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    }
    case "week": {
      const start = getStartOfWeek(date);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      if (isZh) {
        return `${start.getMonth() + 1}月${start.getDate()}日 - ${end.getMonth() + 1}月${end.getDate()}日`;
      }
      const startStr = start.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
      });
      const endStr = end.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      return `${startStr} - ${endStr}`;
    }
    case "month": {
      if (isZh) {
        return `${date.getFullYear()}年${date.getMonth() + 1}月`;
      }
      return date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    }
    case "year": {
      if (isZh) {
        return `${date.getFullYear()}年`;
      }
      return date.getFullYear().toString();
    }
  }
}

// Generate time labels based on view mode
function generateTimeLabels(
  viewMode: ViewMode,
  rangeStart: Date,
  locale: string,
): TimeLabel[] {
  const labels: TimeLabel[] = [];
  const isZh = locale.startsWith("zh");

  // Helper to determine alignment based on position
  const getAlign = (position: number, index: number, total: number): "start" | "center" | "end" => {
    if (index === 0 || position <= 5) {
      return "start";
    }
    if (index === total - 1 || position >= 95) {
      return "end";
    }
    return "center";
  };

  switch (viewMode) {
    case "day": {
      // Every 3 hours: 12am, 3am, 6am, 9am, 12pm, 3pm, 6pm, 9pm, 12am
      const hours = [0, 3, 6, 9, 12, 15, 18, 21, 24];
      hours.forEach((h, index) => {
        let label: string;
        const displayH = h % 24;
        if (isZh) {
          label = `${displayH}时`;
        } else {
          const ampm = displayH >= 12 ? "pm" : "am";
          const displayHour = displayH % 12 || 12;
          label = `${displayHour}${ampm}`;
        }
        const position = (h / 24) * 100;
        labels.push({
          key: `hour-${h}`,
          label,
          position,
          align: getAlign(position, index, hours.length),
        });
      });
      break;
    }
    case "week": {
      // 7 days
      const dayNamesEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dayNamesZh = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
      const dayNames = isZh ? dayNamesZh : dayNamesEn;
      for (let d = 0; d < 7; d++) {
        const dayDate = new Date(rangeStart);
        dayDate.setDate(dayDate.getDate() + d);
        const position = (d / 7) * 100;
        labels.push({
          key: `day-${d}`,
          label: `${dayNames[d]} ${dayDate.getDate()}`,
          position,
          align: getAlign(position, d, 7),
        });
      }
      break;
    }
    case "month": {
      // Days of month
      const daysInMonth = new Date(
        rangeStart.getFullYear(),
        rangeStart.getMonth() + 1,
        0,
      ).getDate();
      const dayMarkers = [1, 5, 10, 15, 20, 25];
      if (daysInMonth > 28) {
        dayMarkers.push(daysInMonth);
      }
      for (let i = 0; i < dayMarkers.length; i++) {
        const day = dayMarkers[i]!;
        if (day <= daysInMonth) {
          const position = ((day - 1) / daysInMonth) * 100;
          labels.push({
            key: `mday-${day}`,
            label: isZh ? `${day}日` : day.toString(),
            position,
            align: getAlign(position, i, dayMarkers.length),
          });
        }
      }
      break;
    }
    case "year": {
      // 12 months
      const monthNamesEn = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ];
      const monthNamesZh = [
        "1月", "2月", "3月", "4月", "5月", "6月",
        "7月", "8月", "9月", "10月", "11月", "12月",
      ];
      const monthNames = isZh ? monthNamesZh : monthNamesEn;
      for (let m = 0; m < 12; m++) {
        const position = (m / 12) * 100;
        labels.push({
          key: `month-${m}`,
          label: monthNames[m]!,
          position,
          align: getAlign(position, m, 12),
        });
      }
      break;
    }
  }

  return labels;
}

// Convert recordings to timeline segments
function recordingsToSegments(recordings: Recording[]): TimelineSegment[] {
  return recordings
    .filter((r) => r.startTime && r.endTime && r.deviceId)
    .map((r) => ({
      id: r.id,
      deviceId: r.deviceId!,
      startTime: new Date(r.startTime!),
      endTime: new Date(r.endTime!),
      recordingId: r.id,
      recordingName: r.name,
    }));
}

// Get unique devices from recordings with assigned colors
function getDevicesFromRecordings(recordings: Recording[]): TimelineDevice[] {
  const deviceMap = new Map<string, { id: string; name: string }>();

  for (const recording of recordings) {
    if (recording.deviceId && !deviceMap.has(recording.deviceId)) {
      deviceMap.set(recording.deviceId, {
        id: recording.deviceId,
        name: recording.deviceName ?? recording.deviceId,
      });
    }
  }

  return Array.from(deviceMap.values()).map((device, index) => ({
    ...device,
    color: DEVICE_COLORS[index % DEVICE_COLORS.length]!,
  }));
}

export function TimelinePage(): React.JSX.Element {
  const { classes } = useStyles();
  const { t, i18n } = useTranslation("pages");
  const navigate = useNavigate();
  const locale = i18n.language;
  const isZh = locale.startsWith("zh");
  const dateLocale = isZh ? zhCN : enUS;
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const { recordingService } = useRecordings();
  const currentOrganizationId = useCurrentOrganizationId();
  useDevices(); // Keep context mounted but don't need the returned devices here
  const { selectSource } = usePlayerSelection();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [deviceFilter, setDeviceFilter] = useState("");
  const [selectedSegment, setSelectedSegment] = useState<TimelineSegment | undefined>(undefined);
  const [dialogTab, setDialogTab] = useState(0);
  const [rangeStart, setRangeStart] = useState<Date | undefined>(undefined);
  const [rangeEnd, setRangeEnd] = useState<Date | undefined>(undefined);

  // Data loading state
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(false);

  // Calendar popover state
  const [calendarAnchor, setCalendarAnchor] = useState<HTMLElement | undefined>(undefined);
  const calendarOpen = Boolean(calendarAnchor);

  // Calculate time range based on view mode
  const timeRange = useMemo(
    () => getTimeRange(currentDate, viewMode),
    [currentDate, viewMode],
  );

  // Load recordings when time range changes (only if authenticated)
  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    const loadRecordings = async () => {
      setLoading(true);
      try {
        const result = await recordingService.getRecordings({
          orgId: currentOrganizationId,
          startTime: timeRange.start.toISOString(),
          endTime: timeRange.end.toISOString(),
          pageSize: 100, // Get more recordings for timeline view
        });
        setRecordings(result.recordings);
      } catch (err) {
        console.error("Failed to load recordings:", err);
        setRecordings([]);
      } finally {
        setLoading(false);
      }
    };

    void loadRecordings();
  }, [recordingService, timeRange.start, timeRange.end, isAuthenticated, currentOrganizationId]);

  // Get devices from recordings (with colors)
  const timelineDevices = useMemo(
    () => getDevicesFromRecordings(recordings),
    [recordings],
  );

  // Convert recordings to segments
  const segments = useMemo(
    () => recordingsToSegments(recordings),
    [recordings],
  );

  // Filter devices by name
  const filteredDevices = useMemo(() => {
    if (!deviceFilter.trim()) {
      return timelineDevices;
    }
    return timelineDevices.filter((d) =>
      d.name.toLowerCase().includes(deviceFilter.toLowerCase()),
    );
  }, [timelineDevices, deviceFilter]);

  // Generate time labels based on view mode
  const timeLabels = useMemo(
    () => generateTimeLabels(viewMode, timeRange.start, locale),
    [viewMode, timeRange.start, locale],
  );

  const handlePrev = useCallback(() => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      switch (viewMode) {
        case "day":
          newDate.setDate(newDate.getDate() - 1);
          break;
        case "week":
          newDate.setDate(newDate.getDate() - 7);
          break;
        case "month":
          newDate.setMonth(newDate.getMonth() - 1);
          break;
        case "year":
          newDate.setFullYear(newDate.getFullYear() - 1);
          break;
      }
      return newDate;
    });
  }, [viewMode]);

  const handleNext = useCallback(() => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      switch (viewMode) {
        case "day":
          newDate.setDate(newDate.getDate() + 1);
          break;
        case "week":
          newDate.setDate(newDate.getDate() + 7);
          break;
        case "month":
          newDate.setMonth(newDate.getMonth() + 1);
          break;
        case "year":
          newDate.setFullYear(newDate.getFullYear() + 1);
          break;
      }
      return newDate;
    });
  }, [viewMode]);

  const handleViewModeChange = useCallback(
    (_event: React.MouseEvent<HTMLElement>, newMode: ViewMode | null) => {
      if (newMode != null) {
        setViewMode(newMode);
      }
    },
    [],
  );

  const handleDateClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      setCalendarAnchor(event.currentTarget);
    },
    [],
  );

  const handleCalendarClose = useCallback(() => {
    setCalendarAnchor(undefined);
  }, []);

  const handleDateSelect = useCallback(
    (newDate: Date | null) => {
      if (newDate) {
        setCurrentDate(newDate);
        // For day and week views, close immediately
        if (viewMode === "day" || viewMode === "week") {
          handleCalendarClose();
        }
      }
    },
    [viewMode, handleCalendarClose],
  );

  const handleMonthSelect = useCallback(
    (newDate: Date | null) => {
      if (newDate) {
        setCurrentDate(newDate);
        handleCalendarClose();
      }
    },
    [handleCalendarClose],
  );

  const handleYearSelect = useCallback(
    (newDate: Date | null) => {
      if (newDate) {
        setCurrentDate(newDate);
        handleCalendarClose();
      }
    },
    [handleCalendarClose],
  );

  const handleSegmentClick = useCallback((segment: TimelineSegment) => {
    setSelectedSegment(segment);
    setRangeStart(segment.startTime);
    setRangeEnd(segment.endTime);
    setDialogTab(0);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setSelectedSegment(undefined);
    setRangeStart(undefined);
    setRangeEnd(undefined);
  }, []);

  const handleVisualize = useCallback(async () => {
    if (!selectedSegment) {
      return;
    }

    try {
      const downloadUrl = await recordingService.getDownloadUrl(selectedSegment.recordingId);
      selectSource("remote-file", {
        type: "connection",
        params: { url: downloadUrl },
      });
      handleCloseDialog();
      void navigate("/view");
    } catch (err) {
      console.error("Failed to get download URL:", err);
    }
  }, [selectedSegment, recordingService, selectSource, handleCloseDialog, navigate]);

  const handleViewRecordings = useCallback(() => {
    if (selectedSegment) {
      handleCloseDialog();
      void navigate(`/devices/${selectedSegment.deviceId}?tab=recordings`);
    }
  }, [selectedSegment, handleCloseDialog, navigate]);

  const handleDeviceClick = useCallback(
    (deviceId: string) => {
      void navigate(`/devices/${deviceId}`);
    },
    [navigate],
  );

  const handleImportData = useCallback(() => {
    void navigate("/recordings");
  }, [navigate]);

  // Calculate segment position based on time range
  const getSegmentPosition = useCallback(
    (segment: TimelineSegment) => {
      const rangeDuration = timeRange.end.getTime() - timeRange.start.getTime();
      const segmentStart = segment.startTime.getTime() - timeRange.start.getTime();
      const segmentEnd = segment.endTime.getTime() - timeRange.start.getTime();

      const startPercent = Math.max(0, (segmentStart / rangeDuration) * 100);
      const endPercent = Math.min(100, (segmentEnd / rangeDuration) * 100);

      return {
        left: `${startPercent}%`,
        width: `${Math.max(endPercent - startPercent, 0.5)}%`,
      };
    },
    [timeRange],
  );

  const isEmpty = filteredDevices.length === 0 && !loading;
  const selectedDevice = selectedSegment
    ? timelineDevices.find((d) => d.id === selectedSegment.deviceId)
    : undefined;

  // Render the appropriate calendar based on view mode
  const renderCalendar = () => {
    switch (viewMode) {
      case "day":
      case "week":
        return (
          <DateCalendar
            value={currentDate}
            onChange={handleDateSelect}
            className={viewMode === "week" ? classes.weekCalendar : undefined}
          />
        );
      case "month":
        return (
          <MonthCalendar value={currentDate} onChange={handleMonthSelect} />
        );
      case "year":
        return (
          <YearCalendar
            value={currentDate}
            onChange={handleYearSelect}
            minDate={new Date(2000, 0, 1)}
            maxDate={new Date(2100, 11, 31)}
          />
        );
    }
  };

  // Show login required placeholder if not authenticated
  if (!authLoading && !isAuthenticated) {
    return (
      <Stack className={classes.root}>
        <LoginRequiredPlaceholder />
      </Stack>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={dateLocale}>
      <Stack className={classes.root}>
        {/* Header */}
        <div className={classes.header}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack gap={0.5}>
              <Typography variant="h5">{t("timelineTitle")}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t("timelineDescription")}
              </Typography>
            </Stack>
            <Button
              variant="contained"
              startIcon={<CloudUploadOutlined />}
              onClick={handleImportData}
            >
              {t("importData")}
            </Button>
          </Stack>
        </div>

        {/* Toolbar */}
        <div className={classes.toolbar}>
          <div className={classes.toolbarLeft}>
            <TextField
              size="small"
              placeholder={t("filterByDeviceName")}
              value={deviceFilter}
              onChange={(e) => {
                setDeviceFilter(e.target.value);
              }}
              className={classes.filterInput}
              variant="outlined"
            />
          </div>

          <div className={classes.toolbarCenter}>
            <div className={classes.dateNavigation}>
              <IconButton onClick={handlePrev} size="small">
                <ChevronLeftOutlined />
              </IconButton>
              <div className={classes.dateButton} onClick={handleDateClick}>
                <Typography variant="body2">
                  {formatDateDisplay(currentDate, viewMode, locale)}
                </Typography>
              </div>
              <IconButton onClick={handleNext} size="small">
                <ChevronRightOutlined />
              </IconButton>
            </div>

            <Popover
              open={calendarOpen}
              anchorEl={calendarAnchor}
              onClose={handleCalendarClose}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "center",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "center",
              }}
            >
              <div className={classes.calendarPopover}>{renderCalendar()}</div>
            </Popover>
          </div>

          <div className={classes.toolbarRight}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewModeChange}
              size="small"
            >
              <ToggleButton value="day">{t("day")}</ToggleButton>
              <ToggleButton value="week">{t("week")}</ToggleButton>
              <ToggleButton value="month">{t("month")}</ToggleButton>
              <ToggleButton value="year">{t("year")}</ToggleButton>
            </ToggleButtonGroup>
          </div>
        </div>

        {/* Timeline Content */}
        <div className={classes.content}>
          <div className={classes.timelineContainer}>
            {/* Time Header */}
            <div className={classes.timelineHeader}>
              <div className={classes.deviceColumn}>
                <Typography variant="body2" color="text.secondary">
                  {t("device")}
                </Typography>
              </div>
              <div className={classes.timeRuler}>
                {timeLabels.map(({ key, label, position, align }) => {
                  const transform = align === "start"
                    ? "translateX(0)"
                    : align === "end"
                      ? "translateX(-100%)"
                      : "translateX(-50%)";
                  return (
                    <div
                      key={key}
                      className={classes.timeLabel}
                      style={{ left: `${position}%`, transform }}
                    >
                      <span>{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timeline Body */}
            <div className={classes.timelineBody}>
              {loading ? (
                <div className={classes.loadingContainer}>
                  <CircularProgress />
                </div>
              ) : isEmpty ? (
                <div className={classes.emptyState}>
                  <TimelineOutlined className={classes.emptyIcon} />
                  <Typography variant="h6" color="text.secondary">
                    {t("noTimelineData")}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    maxWidth={400}
                  >
                    {t("noTimelineDataDescription")}
                  </Typography>
                  <Button variant="contained" onClick={handleImportData}>
                    {t("importData")}
                  </Button>
                </div>
              ) : (
                filteredDevices.map((device) => {
                  const deviceSegments = segments.filter(
                    (s) => s.deviceId === device.id,
                  );
                  return (
                    <div key={device.id} className={classes.deviceRow}>
                      <div
                        className={classes.deviceName}
                        onClick={() => {
                          handleDeviceClick(device.id);
                        }}
                      >
                        <Typography variant="body2" noWrap fontSize={12}>
                          {device.name}
                        </Typography>
                      </div>
                      <div className={classes.trackContainer}>
                        {deviceSegments.map((segment) => {
                          const pos = getSegmentPosition(segment);
                          return (
                            <Tooltip
                              key={segment.id}
                              title={formatDuration(
                                segment.startTime,
                                segment.endTime,
                              )}
                            >
                              <div
                                className={classes.segment}
                                style={{
                                  left: pos.left,
                                  width: pos.width,
                                  backgroundColor: device.color,
                                }}
                                onClick={() => {
                                  handleSegmentClick(segment);
                                }}
                              >
                                <span className={classes.segmentDuration}>
                                  {formatDuration(
                                    segment.startTime,
                                    segment.endTime,
                                  )}
                                </span>
                              </div>
                            </Tooltip>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Coverage Details Dialog */}
        <Dialog
          open={selectedSegment != null}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle className={classes.dialogTitle}>
            <Typography variant="h6">
              {t("coverageDetails")}: {selectedDevice?.name}
            </Typography>
            <IconButton onClick={handleCloseDialog} size="small">
              <CloseOutlined />
            </IconButton>
          </DialogTitle>
          <DialogContent className={classes.dialogContent}>
            <Tabs
              value={dialogTab}
              onChange={(_e, v: number) => {
                setDialogTab(v);
              }}
              sx={{ mb: 3 }}
            >
              <Tab label={t("view")} />
              <Tab label={t("download")} />
              <Tab label="CLI" />
            </Tabs>

            {dialogTab === 0 && (
              <Stack gap={3}>
                <Stack direction="row" gap={2}>
                  <Stack flex={1} gap={1}>
                    <Typography variant="body2" color="text.secondary">
                      {t("rangeStart")}
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={rangeStart ? formatTimeForInput(rangeStart) : ""}
                      className={classes.timeInput}
                      slotProps={{
                        input: {
                          endAdornment: (
                            <AccessTimeOutlined
                              fontSize="small"
                              color="action"
                            />
                          ),
                        },
                      }}
                    />
                  </Stack>
                  <Stack flex={1} gap={1}>
                    <Typography variant="body2" color="text.secondary">
                      {t("rangeEnd")}
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={rangeEnd ? formatTimeForInput(rangeEnd) : ""}
                      className={classes.timeInput}
                      slotProps={{
                        input: {
                          endAdornment: (
                            <AccessTimeOutlined
                              fontSize="small"
                              color="action"
                            />
                          ),
                        },
                      }}
                    />
                    {rangeStart && rangeEnd && (
                      <Typography variant="caption" color="text.secondary">
                        {t("duration")}: {formatDuration(rangeStart, rangeEnd)}
                      </Typography>
                    )}
                  </Stack>
                </Stack>

                <Stack direction="row" gap={2} justifyContent="flex-end">
                  <Button variant="outlined" onClick={handleViewRecordings}>
                    {t("viewRecordings")}
                  </Button>
                  <Button variant="contained" onClick={() => { void handleVisualize(); }}>
                    {t("visualize")}
                  </Button>
                </Stack>
              </Stack>
            )}

            {dialogTab === 1 && (
              <Stack gap={2}>
                <Typography variant="body2" color="text.secondary">
                  {t("downloadDescription")}
                </Typography>
                <TextField
                  select
                  label={t("format")}
                  defaultValue="mcap"
                  size="small"
                >
                  <MenuItem value="mcap">MCAP</MenuItem>
                  <MenuItem value="bag">ROS Bag</MenuItem>
                </TextField>
                <Button variant="contained" fullWidth>
                  {t("download")}
                </Button>
              </Stack>
            )}

            {dialogTab === 2 && (
              <Stack gap={2}>
                <Typography variant="body2" color="text.secondary">
                  {t("cliDescription")}
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    backgroundColor: "background.default",
                    fontFamily: "monospace",
                    fontSize: 12,
                    overflowX: "auto",
                  }}
                >
                  flora-cli download --device {selectedDevice?.name} --start "
                  {rangeStart?.toISOString()}" --end "{rangeEnd?.toISOString()}"
                </Paper>
                <Button variant="outlined">{t("copyCommand")}</Button>
              </Stack>
            )}
          </DialogContent>
        </Dialog>
      </Stack>
    </LocalizationProvider>
  );
}
