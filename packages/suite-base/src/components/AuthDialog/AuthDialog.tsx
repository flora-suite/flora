// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import CloseIcon from "@mui/icons-material/Close";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogProps,
  DialogTitle,
  IconButton,
  InputAdornment,
  Link,
  TextField,
  Typography,
} from "@mui/material";
import { FormEvent, MouseEvent, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { makeStyles } from "tss-react/mui";

import { AppSetting } from "@lichtblick/suite-base/AppSetting";
import Stack from "@lichtblick/suite-base/components/Stack";
import { useApiClient } from "@lichtblick/suite-base/context/ApiClientContext";
import { useAuth } from "@lichtblick/suite-base/context/AuthContext";
import { useAppConfigurationValue } from "@lichtblick/suite-base/hooks/useAppConfigurationValue";
import {
  DEFAULT_FLORA_SERVER_URL,
  getFloraServerUrl,
} from "@lichtblick/suite-base/services/createAuthService";

const useStyles = makeStyles()((theme) => ({
  dialogTitle: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  form: {
    width: "100%",
  },
  submitButton: {
    marginTop: theme.spacing(2),
  },
  switchMode: {
    marginTop: theme.spacing(2),
    textAlign: "center",
  },
  testServerNotice: {
    backgroundColor: theme.palette.action.hover,
    borderLeft: `3px solid ${theme.palette.info.main}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(0.75, 1),
  },
}));

export type AuthDialogMode = "login" | "register";

export type AuthDialogProps = DialogProps & {
  initialMode?: AuthDialogMode;
  onSuccess?: () => void;
};

export function AuthDialog(props: AuthDialogProps): JSX.Element {
  const { initialMode = "login", onSuccess, ...dialogProps } = props;
  const { t } = useTranslation("auth");
  const { classes } = useStyles();
  const { signIn, register, isLoading, error, clearError } = useAuth();
  const apiClient = useApiClient();
  const [configuredServerUrl, setConfiguredServerUrl] = useAppConfigurationValue<string>(
    AppSetting.FLORA_SERVER_URL,
  );

  const [mode, setMode] = useState<AuthDialogMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string>();
  const [serverUrl, setServerUrl] = useState(() => configuredServerUrl ?? getFloraServerUrl());

  const handleClose = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      clearError();
      setLocalError(undefined);
      if (dialogProps.onClose != undefined) {
        dialogProps.onClose(event, "backdropClick");
      }
    },
    [dialogProps, clearError],
  );

  const handleSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      setLocalError(undefined);
      clearError();

      const normalizedServerUrl = serverUrl.replace(/\/$/, "");
      try {
        new URL(normalizedServerUrl);
      } catch {
        setLocalError(t("invalidServerUrl"));
        return;
      }

      try {
        if (normalizedServerUrl !== configuredServerUrl) {
          await setConfiguredServerUrl(normalizedServerUrl);
          apiClient?.setBaseUrl(normalizedServerUrl);
        }

        if (mode === "login") {
          await signIn({ email, password });
        } else {
          await register({ email, password, name: name || undefined });
        }
        onSuccess?.();
        handleClose({ currentTarget: {} } as MouseEvent<HTMLElement>);
      } catch {
        // Error is already set in the auth context
      }
    },
    [
      mode,
      email,
      password,
      name,
      serverUrl,
      configuredServerUrl,
      setConfiguredServerUrl,
      apiClient,
      signIn,
      register,
      onSuccess,
      handleClose,
      clearError,
      t,
    ],
  );

  const handleToggleMode = useCallback(() => {
    setMode((prev) => (prev === "login" ? "register" : "login"));
    clearError();
    setLocalError(undefined);
  }, [clearError]);

  const handleTogglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const displayError = error ?? localError;

  return (
    <Dialog {...dialogProps} fullWidth maxWidth="xs">
      <DialogTitle className={classes.dialogTitle}>
        {mode === "login" ? t("signIn") : t("createAccount")}
        <IconButton edge="end" onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <form className={classes.form} onSubmit={handleSubmit}>
          <Stack gap={2}>
            {displayError && <Alert severity="error">{displayError}</Alert>}

            <TextField
              label={t("serverUrl")}
              type="url"
              value={serverUrl}
              onChange={(event) => {
                setServerUrl(event.target.value);
              }}
              required
              fullWidth
              autoComplete="url"
            />

            {serverUrl.replace(/\/$/, "") === DEFAULT_FLORA_SERVER_URL && (
              <div className={classes.testServerNotice}>
                <Typography color="text.secondary" display="block" variant="caption">
                  {t("testServerWarning")}
                </Typography>
                <Link
                  href="https://github.com/flora-suite/flora-server"
                  rel="noreferrer"
                  target="_blank"
                  variant="caption"
                >
                  {t("testServerSource")} flora-suite/flora-server
                </Link>
              </div>
            )}

            {mode === "register" && (
              <TextField
                label={t("name")}
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                }}
                fullWidth
                autoComplete="name"
              />
            )}

            <TextField
              label={t("email")}
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
              }}
              required
              fullWidth
              autoComplete="email"
              autoFocus
            />

            <TextField
              label={t("password")}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
              }}
              required
              fullWidth
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={t("togglePasswordVisibility")}
                      onClick={handleTogglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              className={classes.submitButton}
              type="submit"
              variant="contained"
              fullWidth
              disabled={isLoading}
            >
              {isLoading ? (
                <CircularProgress size={24} />
              ) : mode === "login" ? (
                t("signIn")
              ) : (
                t("createAccount")
              )}
            </Button>

            <Typography className={classes.switchMode} variant="body2">
              {mode === "login" ? t("noAccount") : t("alreadyHaveAccount")}{" "}
              <Link component="button" type="button" onClick={handleToggleMode}>
                {mode === "login" ? t("createAccount") : t("signIn")}
              </Link>
            </Typography>
          </Stack>
        </form>
      </DialogContent>
    </Dialog>
  );
}
