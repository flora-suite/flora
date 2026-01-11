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
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { makeStyles } from "tss-react/mui";

import Stack from "@lichtblick/suite-base/components/Stack";

const useStyles = makeStyles()((theme) => ({
  root: {
    height: "100%",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    backgroundColor: theme.palette.background.default,
  },
  toolbar: {
    padding: theme.spacing(1.5, 3),
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: `1px solid ${theme.palette.divider}`,
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
  },
  timelineHeader: {
    display: "flex",
    borderBottom: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
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
  },
  timeLabel: {
    position: "absolute",
    transform: "translateX(-50%)",
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
  filterInput: {
    minWidth: 150,
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
}

// Mock data
const mockDevices: TimelineDevice[] = [
  { id: "1", name: "dev_fdc68284", color: DEVICE_COLORS[0]! },
  { id: "2", name: "dev_194a14de", color: DEVICE_COLORS[1]! },
  { id: "3", name: "dev_0a6d3a4d", color: DEVICE_COLORS[2]! },
  { id: "4", name: "dev_f338f375", color: DEVICE_COLORS[3]! },
  { id: "5", name: "dev_0a98ef62", color: DEVICE_COLORS[4]! },
  { id: "6", name: "dev_2f15098a", color: DEVICE_COLORS[5]! },
  { id: "7", name: "dev_a49bd303", color: DEVICE_COLORS[0]! },
  { id: "8", name: "dev_2981f7a1", color: DEVICE_COLORS[2]! },
  { id: "9", name: "dev_859491bf", color: DEVICE_COLORS[1]! },
  { id: "10", name: "dev_64c505bf", color: DEVICE_COLORS[5]! },
];

// Seeded random for consistent mock data
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

function generateMockSegments(
  devices: TimelineDevice[],
  rangeStart: Date,
  rangeEnd: Date,
  viewMode: ViewMode,
): TimelineSegment[] {
  const segments: TimelineSegment[] = [];
  const rangeDuration = rangeEnd.getTime() - rangeStart.getTime();
  const seed = rangeStart.getTime() + viewMode.charCodeAt(0);
  const random = seededRandom(seed);

  devices.forEach((device) => {
    // Generate different number of segments based on view mode
    const numSegments =
      viewMode === "day"
        ? 1 + Math.floor(random() * 3)
        : viewMode === "week"
          ? 3 + Math.floor(random() * 5)
          : viewMode === "month"
            ? 5 + Math.floor(random() * 10)
            : 8 + Math.floor(random() * 15);

    for (let i = 0; i < numSegments; i++) {
      // Random start position within range
      const startOffset = random() * rangeDuration * 0.9;
      const startTime = new Date(rangeStart.getTime() + startOffset);

      // Duration varies by view mode
      let maxDurationMs: number;
      switch (viewMode) {
        case "day":
          maxDurationMs = 3 * 60 * 60 * 1000; // up to 3 hours
          break;
        case "week":
          maxDurationMs = 12 * 60 * 60 * 1000; // up to 12 hours
          break;
        case "month":
          maxDurationMs = 2 * 24 * 60 * 60 * 1000; // up to 2 days
          break;
        case "year":
          maxDurationMs = 7 * 24 * 60 * 60 * 1000; // up to 1 week
          break;
      }

      const minDurationMs = maxDurationMs * 0.1;
      const duration = minDurationMs + random() * (maxDurationMs - minDurationMs);
      const endTime = new Date(
        Math.min(startTime.getTime() + duration, rangeEnd.getTime()),
      );

      segments.push({
        id: `seg_${device.id}_${i}_${viewMode}`,
        deviceId: device.id,
        startTime,
        endTime,
        recordingId: `rec_${device.id}_${i}`,
        recordingName: `${device.name}_recording_${i + 1}.mcap`,
      });
    }
  });

  return segments;
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

  switch (viewMode) {
    case "day": {
      // 24 hours
      for (let h = 0; h < 24; h++) {
        let label: string;
        if (isZh) {
          label = `${h}时`;
        } else {
          const ampm = h >= 12 ? "pm" : "am";
          const displayHour = h % 12 || 12;
          label = `${displayHour}${ampm}`;
        }
        labels.push({
          key: `hour-${h}`,
          label,
          position: (h / 24) * 100,
        });
      }
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
        labels.push({
          key: `day-${d}`,
          label: `${dayNames[d]} ${dayDate.getDate()}`,
          position: (d / 7) * 100,
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
      for (const day of dayMarkers) {
        if (day <= daysInMonth) {
          labels.push({
            key: `mday-${day}`,
            label: isZh ? `${day}日` : day.toString(),
            position: ((day - 1) / daysInMonth) * 100,
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
        labels.push({
          key: `month-${m}`,
          label: monthNames[m]!,
          position: (m / 12) * 100,
        });
      }
      break;
    }
  }

  return labels;
}

export function TimelinePage(): React.JSX.Element {
  const { classes } = useStyles();
  const { t, i18n } = useTranslation("pages");
  const navigate = useNavigate();
  const locale = i18n.language;
  const isZh = locale.startsWith("zh");
  const dateLocale = isZh ? zhCN : enUS;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [deviceFilter, setDeviceFilter] = useState("");
  const [selectedSegment, setSelectedSegment] = useState<
    TimelineSegment | undefined
  >(undefined);
  const [dialogTab, setDialogTab] = useState(0);
  const [rangeStart, setRangeStart] = useState<Date | undefined>(undefined);
  const [rangeEnd, setRangeEnd] = useState<Date | undefined>(undefined);

  // Calendar popover state
  const [calendarAnchor, setCalendarAnchor] = useState<HTMLElement | undefined>(
    undefined,
  );
  const calendarOpen = Boolean(calendarAnchor);

  const devices = useMemo(() => {
    if (!deviceFilter.trim()) {
      return mockDevices;
    }
    return mockDevices.filter((d) =>
      d.name.toLowerCase().includes(deviceFilter.toLowerCase()),
    );
  }, [deviceFilter]);

  // Calculate time range based on view mode
  const timeRange = useMemo(
    () => getTimeRange(currentDate, viewMode),
    [currentDate, viewMode],
  );

  // Generate segments based on time range
  const segments = useMemo(
    () =>
      generateMockSegments(
        mockDevices,
        timeRange.start,
        timeRange.end,
        viewMode,
      ),
    [timeRange.start, timeRange.end, viewMode],
  );

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

  const handleVisualize = useCallback(() => {
    handleCloseDialog();
    void navigate("/view");
  }, [handleCloseDialog, navigate]);

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
      const rangeDuration =
        timeRange.end.getTime() - timeRange.start.getTime();
      const segmentStart =
        segment.startTime.getTime() - timeRange.start.getTime();
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

  const isEmpty = devices.length === 0;
  const selectedDevice = selectedSegment
    ? mockDevices.find((d) => d.id === selectedSegment.deviceId)
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

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={dateLocale}>
      <Stack className={classes.root}>
        {/* Toolbar */}
        <div className={classes.toolbar}>
          <Button
            variant="contained"
            startIcon={<CloudUploadOutlined />}
            onClick={handleImportData}
          >
            {t("importData")}
          </Button>

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

        {/* Timeline Content */}
        <div className={classes.content}>
          {/* Filter and Time Header */}
          <div className={classes.timelineHeader}>
            <div className={classes.deviceColumn}>
              <TextField
                size="small"
                placeholder={t("filterByDeviceName")}
                value={deviceFilter}
                onChange={(e) => {
                  setDeviceFilter(e.target.value);
                }}
                className={classes.filterInput}
                fullWidth
                variant="standard"
              />
            </div>
            <div className={classes.timeRuler}>
              {timeLabels.map(({ key, label, position }) => (
                <div
                  key={key}
                  className={classes.timeLabel}
                  style={{ left: `${position}%` }}
                >
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Body */}
          <div className={classes.timelineBody}>
            {isEmpty ? (
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
              devices.map((device) => {
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
                  <Button variant="contained" onClick={handleVisualize}>
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
