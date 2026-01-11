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

import Stack from "@lichtblick/suite-base/components/Stack";
import { useAuth } from "@lichtblick/suite-base/context/AuthContext";

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

  const [mode, setMode] = useState<AuthDialogMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string>();

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

      try {
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
    [mode, email, password, name, signIn, register, onSuccess, handleClose, clearError],
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
