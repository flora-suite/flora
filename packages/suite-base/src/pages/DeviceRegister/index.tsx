// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  CheckCircleOutlined,
  ComputerOutlined,
  DnsOutlined,
  ErrorOutlined,
  FolderOutlined,
  InfoOutlined,
  MemoryOutlined,
  PersonOutlined,
  RouterOutlined,
  StorageOutlined,
  BusinessOutlined,
} from "@mui/icons-material";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  ListItemIcon,
  MenuItem,
  Paper,
  Select,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams, useNavigate } from "react-router";
import { makeStyles } from "tss-react/mui";

import Stack from "@lichtblick/suite-base/components/Stack";
import { useApiClient } from "@lichtblick/suite-base/context/ApiClientContext";
import { useAuth } from "@lichtblick/suite-base/context/AuthContext";
import { useOrganizations } from "@lichtblick/suite-base/context/OrganizationContext";
import { DeviceService } from "@lichtblick/suite-base/services/DeviceService";
import {
  ConfirmDeviceRegistrationParams,
  DeviceRegistrationInfo,
} from "@lichtblick/suite-base/services/IDeviceService";

const useStyles = makeStyles()((theme) => ({
  root: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing(3),
    backgroundColor: theme.palette.background.default,
  },
  container: {
    maxWidth: 600,
    width: "100%",
  },
  card: {
    padding: theme.spacing(2),
  },
  logo: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing(3),
  },
  logoText: {
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: -0.5,
  },
  header: {
    textAlign: "center",
    marginBottom: theme.spacing(3),
  },
  section: {
    marginTop: theme.spacing(3),
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: theme.spacing(2),
  },
  infoItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: theme.spacing(1),
  },
  infoIcon: {
    color: theme.palette.text.secondary,
    marginTop: 2,
  },
  codeChip: {
    fontSize: 18,
    fontWeight: 600,
    fontFamily: "monospace",
    letterSpacing: 2,
    padding: theme.spacing(1, 2),
  },
  watchPathItem: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    padding: theme.spacing(1),
    backgroundColor: theme.palette.action.hover,
    borderRadius: theme.shape.borderRadius,
  },
  watchPathInput: {
    flex: 1,
  },
  loadingState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing(6),
    gap: theme.spacing(2),
  },
  errorState: {
    textAlign: "center",
    padding: theme.spacing(4),
  },
  successState: {
    textAlign: "center",
    padding: theme.spacing(4),
  },
  successIcon: {
    fontSize: 64,
    color: theme.palette.success.main,
    marginBottom: theme.spacing(2),
  },
  errorIcon: {
    fontSize: 64,
    color: theme.palette.error.main,
    marginBottom: theme.spacing(2),
  },
  expiryWarning: {
    marginTop: theme.spacing(2),
  },
  infoSectionPaper: {
    padding: theme.spacing(2),
  },
  machineIdText: {
    fontFamily: "monospace",
    fontSize: 12,
  },
  systemInfoDivider: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  signedInSection: {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(2),
    textAlign: "center",
  },
}));

const DEVICE_TYPES = [
  { value: "robot", label: "Robot" },
  { value: "vehicle", label: "Vehicle" },
  { value: "drone", label: "Drone" },
  { value: "server", label: "Server" },
  { value: "edge_device", label: "Edge Device" },
  { value: "other", label: "Other" },
];

type PageState = "loading" | "form" | "submitting" | "success" | "error" | "expired" | "no_code";

export function DeviceRegisterPage(): React.JSX.Element {
  const { classes } = useStyles();
  const { t } = useTranslation("pages");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const apiClient = useApiClient();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { organizations } = useOrganizations();

  const code = searchParams.get("code");

  const [pageState, setPageState] = useState<PageState>("loading");
  const [registrationInfo, setRegistrationInfo] = useState<DeviceRegistrationInfo | undefined>(
    undefined,
  );
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  // Form state
  const [deviceName, setDeviceName] = useState("");
  const [deviceType, setDeviceType] = useState("robot");
  const [selectedOrgId, setSelectedOrgId] = useState<string>("personal");
  const [watchPaths, setWatchPaths] = useState<string[]>(["/data/recordings"]);
  const [newWatchPath, setNewWatchPath] = useState("");

  // Device service
  const deviceService = useMemo(() => {
    if (!apiClient) {
      return undefined;
    }
    return new DeviceService(apiClient);
  }, [apiClient]);

  // Fetch registration info
  useEffect(() => {
    if (!code) {
      setPageState("no_code");
      return;
    }

    if (!deviceService) {
      return;
    }

    const fetchInfo = async () => {
      try {
        const info = await deviceService.getDeviceRegistrationInfo(code);
        setRegistrationInfo(info);

        // Set default device name from hostname
        if (info.hostname) {
          setDeviceName(info.hostname);
        }

        setPageState("form");
      } catch (err) {
        const error = err as Error;
        if (error.message?.includes("expired") || error.message?.includes("not found")) {
          setPageState("expired");
        } else {
          setErrorMessage(error.message ?? "Failed to load registration info");
          setPageState("error");
        }
      }
    };

    void fetchInfo();
  }, [code, deviceService]);

  // Calculate time remaining
  const timeRemaining = useMemo(() => {
    if (!registrationInfo) {
      return 0;
    }
    const expiresAt = new Date(registrationInfo.expiresAt).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((expiresAt - now) / 1000));
  }, [registrationInfo]);

  // Handle adding watch path
  const handleAddWatchPath = useCallback(() => {
    if (newWatchPath.trim() && !watchPaths.includes(newWatchPath.trim())) {
      setWatchPaths((prev) => [...prev, newWatchPath.trim()]);
      setNewWatchPath("");
    }
  }, [newWatchPath, watchPaths]);

  // Handle removing watch path
  const handleRemoveWatchPath = useCallback((index: number) => {
    setWatchPaths((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!code || !deviceService || !deviceName.trim()) {
      return;
    }

    setPageState("submitting");

    try {
      const params: ConfirmDeviceRegistrationParams = {
        code,
        name: deviceName.trim(),
        type: deviceType,
        organizationId: selectedOrgId !== "personal" ? selectedOrgId : undefined,
        watchPaths: watchPaths.length > 0 ? watchPaths : undefined,
      };

      await deviceService.confirmDeviceRegistration(params);
      setPageState("success");
    } catch (err) {
      const error = err as Error;
      setErrorMessage(error.message ?? "Failed to confirm registration");
      setPageState("error");
    }
  }, [code, deviceService, deviceName, deviceType, selectedOrgId, watchPaths]);

  // Handle go to devices
  const handleGoToDevices = useCallback(() => {
    void navigate("/devices");
  }, [navigate]);

  // Render loading state
  if (pageState === "loading" || authLoading) {
    return (
      <div className={classes.root}>
        <Card className={classes.container}>
          <CardContent className={classes.loadingState}>
            <CircularProgress />
            <Typography variant="body1" color="text.secondary">
              {t("loading")}
            </Typography>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render no code state
  if (pageState === "no_code") {
    return (
      <div className={classes.root}>
        <Card className={classes.container}>
          <CardContent className={classes.errorState}>
            <ErrorOutlined className={classes.errorIcon} />
            <Typography variant="h5" gutterBottom>
              Missing Registration Code
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              No registration code was provided. Please run the flora-agent register command on your
              device to get a registration URL.
            </Typography>
            <Button variant="contained" onClick={handleGoToDevices}>
              Go to Devices
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render expired state
  if (pageState === "expired") {
    return (
      <div className={classes.root}>
        <Card className={classes.container}>
          <CardContent className={classes.errorState}>
            <ErrorOutlined className={classes.errorIcon} />
            <Typography variant="h5" gutterBottom>
              Registration Expired
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              This registration code has expired or is invalid. Please run the flora-agent register
              command again on your device to get a new registration URL.
            </Typography>
            <Button variant="contained" onClick={handleGoToDevices}>
              Go to Devices
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render error state
  if (pageState === "error") {
    return (
      <div className={classes.root}>
        <Card className={classes.container}>
          <CardContent className={classes.errorState}>
            <ErrorOutlined className={classes.errorIcon} />
            <Typography variant="h5" gutterBottom>
              Registration Error
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {errorMessage ?? "An error occurred during registration."}
            </Typography>
            <Button variant="contained" onClick={handleGoToDevices}>
              Go to Devices
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render success state
  if (pageState === "success") {
    return (
      <div className={classes.root}>
        <Card className={classes.container}>
          <CardContent className={classes.successState}>
            <CheckCircleOutlined className={classes.successIcon} />
            <Typography variant="h5" gutterBottom>
              Device Registered!
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Your device has been successfully registered. The flora-agent on your device will
              automatically receive its configuration and start syncing data.
            </Typography>
            <Button variant="contained" onClick={handleGoToDevices}>
              View Devices
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render not authenticated warning
  if (!isAuthenticated) {
    return (
      <div className={classes.root}>
        <Card className={classes.container}>
          <CardContent className={classes.errorState}>
            <InfoOutlined className={classes.errorIcon} />
            <Typography variant="h5" gutterBottom>
              Sign In Required
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              You need to sign in to register this device. Please sign in and then return to this
              page.
            </Typography>
            <Stack gap={2}>
              <Chip
                label={`Registration Code: ${code}`}
                className={classes.codeChip}
                variant="outlined"
              />
              <Typography variant="body2" color="text.secondary">
                Keep this code. It will be valid for a few more minutes.
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render registration form
  return (
    <div className={classes.root}>
      <div className={classes.container}>
        <div className={classes.logo}>
          <Typography className={classes.logoText} color="primary">
            Flora
          </Typography>
        </div>

        <Card className={classes.card}>
          <CardContent>
            <div className={classes.header}>
              <Typography variant="h5" gutterBottom>
                Register Device
              </Typography>
              <Typography variant="body2" color="text.secondary">
                A device is waiting to be registered to your account
              </Typography>
              <Stack direction="row" justifyContent="center" style={{ marginTop: 16 }}>
                <Chip label={code} className={classes.codeChip} color="primary" variant="outlined" />
              </Stack>
              {timeRemaining > 0 && timeRemaining < 120 && (
                <Alert severity="warning" className={classes.expiryWarning}>
                  This registration will expire in {Math.floor(timeRemaining / 60)} minutes{" "}
                  {timeRemaining % 60} seconds
                </Alert>
              )}
            </div>

            <Divider />

            {/* Device Information Section */}
            <div className={classes.section}>
              <div className={classes.sectionTitle}>
                <ComputerOutlined color="primary" />
                <Typography variant="subtitle1" fontWeight={600}>
                  Device Information
                </Typography>
              </div>

              <Paper variant="outlined" className={classes.infoSectionPaper}>
                <div className={classes.infoGrid}>
                  <div className={classes.infoItem}>
                    <DnsOutlined className={classes.infoIcon} fontSize="small" />
                    <Stack gap={0.25}>
                      <Typography variant="body2" color="text.secondary">
                        Hostname
                      </Typography>
                      <Typography variant="body1">
                        {registrationInfo?.hostname ?? "Unknown"}
                      </Typography>
                    </Stack>
                  </div>

                  <div className={classes.infoItem}>
                    <RouterOutlined className={classes.infoIcon} fontSize="small" />
                    <Stack gap={0.25}>
                      <Typography variant="body2" color="text.secondary">
                        {t("ipAddress")}
                      </Typography>
                      <Typography variant="body1">
                        {registrationInfo?.ipAddress ?? "Unknown"}
                      </Typography>
                    </Stack>
                  </div>

                  <div className={classes.infoItem}>
                    <ComputerOutlined className={classes.infoIcon} fontSize="small" />
                    <Stack gap={0.25}>
                      <Typography variant="body2" color="text.secondary">
                        Platform
                      </Typography>
                      <Typography variant="body1">
                        {registrationInfo?.platform ?? "Unknown"}
                      </Typography>
                    </Stack>
                  </div>

                  <div className={classes.infoItem}>
                    <InfoOutlined className={classes.infoIcon} fontSize="small" />
                    <Stack gap={0.25}>
                      <Typography variant="body2" color="text.secondary">
                        Machine ID
                      </Typography>
                      <Typography variant="body1" className={classes.machineIdText}>
                        {registrationInfo?.machineId?.substring(0, 16) ?? "Unknown"}...
                      </Typography>
                    </Stack>
                  </div>
                </div>

                {registrationInfo?.systemInfo && (
                  <>
                    <Divider className={classes.systemInfoDivider} />
                    <div className={classes.infoGrid}>
                      {registrationInfo.systemInfo.cpuModel && (
                        <div className={classes.infoItem}>
                          <MemoryOutlined className={classes.infoIcon} fontSize="small" />
                          <Stack gap={0.25}>
                            <Typography variant="body2" color="text.secondary">
                              CPU
                            </Typography>
                            <Typography variant="body2">
                              {registrationInfo.systemInfo.cpuModel}
                              {registrationInfo.systemInfo.cpuCores &&
                                ` (${registrationInfo.systemInfo.cpuCores} cores)`}
                            </Typography>
                          </Stack>
                        </div>
                      )}

                      {registrationInfo.systemInfo.memoryGB && (
                        <div className={classes.infoItem}>
                          <MemoryOutlined className={classes.infoIcon} fontSize="small" />
                          <Stack gap={0.25}>
                            <Typography variant="body2" color="text.secondary">
                              Memory
                            </Typography>
                            <Typography variant="body2">
                              {registrationInfo.systemInfo.memoryGB.toFixed(1)} GB
                            </Typography>
                          </Stack>
                        </div>
                      )}

                      {registrationInfo.systemInfo.diskGB && (
                        <div className={classes.infoItem}>
                          <StorageOutlined className={classes.infoIcon} fontSize="small" />
                          <Stack gap={0.25}>
                            <Typography variant="body2" color="text.secondary">
                              Disk
                            </Typography>
                            <Typography variant="body2">
                              {registrationInfo.systemInfo.diskGB.toFixed(0)} GB
                            </Typography>
                          </Stack>
                        </div>
                      )}

                      {registrationInfo.systemInfo.osName && (
                        <div className={classes.infoItem}>
                          <ComputerOutlined className={classes.infoIcon} fontSize="small" />
                          <Stack gap={0.25}>
                            <Typography variant="body2" color="text.secondary">
                              OS
                            </Typography>
                            <Typography variant="body2">
                              {registrationInfo.systemInfo.osName}
                            </Typography>
                          </Stack>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </Paper>
            </div>

            {/* Configuration Section */}
            <div className={classes.section}>
              <div className={classes.sectionTitle}>
                <FolderOutlined color="primary" />
                <Typography variant="subtitle1" fontWeight={600}>
                  Configuration
                </Typography>
              </div>

              <Stack gap={3}>
                <TextField
                  label={t("deviceName")}
                  value={deviceName}
                  onChange={(e) => {
                    setDeviceName(e.target.value);
                  }}
                  required
                  fullWidth
                  helperText="A friendly name to identify this device"
                />

                <FormControl fullWidth>
                  <InputLabel>{t("deviceType")}</InputLabel>
                  <Select
                    value={deviceType}
                    label={t("deviceType")}
                    onChange={(e) => {
                      setDeviceType(e.target.value);
                    }}
                  >
                    {DEVICE_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>{t("registerTo")}</InputLabel>
                  <Select
                    value={selectedOrgId}
                    label={t("registerTo")}
                    onChange={(e) => {
                      setSelectedOrgId(e.target.value);
                    }}
                  >
                    <MenuItem value="personal">
                      <ListItemIcon>
                        <PersonOutlined fontSize="small" />
                      </ListItemIcon>
                      {t("personalAccount")}
                    </MenuItem>
                    {organizations.map((org) => (
                      <MenuItem key={org.id} value={org.id}>
                        <ListItemIcon>
                          <BusinessOutlined fontSize="small" />
                        </ListItemIcon>
                        {org.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    {t("registerToHelperText")}
                  </FormHelperText>
                </FormControl>

                <FormControl fullWidth>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Watch Directories
                    <Tooltip title="Directories on the device that flora-agent will monitor for recording files">
                      <IconButton size="small">
                        <InfoOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Typography>

                  <Stack gap={1}>
                    {watchPaths.map((path, index) => (
                      <div key={index} className={classes.watchPathItem}>
                        <FolderOutlined fontSize="small" color="action" />
                        <Typography variant="body2" className={classes.watchPathInput}>
                          {path}
                        </Typography>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => {
                            handleRemoveWatchPath(index);
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}

                    <Stack direction="row" gap={1}>
                      <TextField
                        size="small"
                        placeholder="/path/to/recordings"
                        value={newWatchPath}
                        onChange={(e) => {
                          setNewWatchPath(e.target.value);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddWatchPath();
                          }
                        }}
                        className={classes.watchPathInput}
                      />
                      <Button variant="outlined" size="small" onClick={handleAddWatchPath}>
                        {t("add")}
                      </Button>
                    </Stack>
                  </Stack>
                  <FormHelperText>
                    Add directories that contain MCAP, ROS bag, or db3 files
                  </FormHelperText>
                </FormControl>
              </Stack>
            </div>

            {/* Signed in as */}
            <div className={classes.signedInSection}>
              <Typography variant="body2" color="text.secondary">
                Signing in as: <strong>{user?.email}</strong>
              </Typography>
            </div>

            {/* Submit Button */}
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleSubmit}
              disabled={pageState === "submitting" || !deviceName.trim()}
            >
              {pageState === "submitting" ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Confirm Registration"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
