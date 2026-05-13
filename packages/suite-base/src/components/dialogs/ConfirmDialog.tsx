// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { WarningAmberOutlined } from "@mui/icons-material";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { makeStyles } from "tss-react/mui";

import Stack from "@lichtblick/suite-base/components/Stack";

const useStyles = makeStyles()((theme) => ({
  warningIcon: {
    color: theme.palette.warning.main,
    fontSize: 48,
  },
  errorIcon: {
    color: theme.palette.error.main,
    fontSize: 48,
  },
}));

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "warning" | "error" | "info";
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = "warning",
  onConfirm,
  onCancel,
}: ConfirmDialogProps): React.JSX.Element {
  const { classes } = useStyles();
  const { t } = useTranslation("pages");

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack direction="row" gap={2} alignItems="flex-start">
          {(variant === "warning" || variant === "error") && (
            <WarningAmberOutlined
              className={variant === "error" ? classes.errorIcon : classes.warningIcon}
            />
          )}
          <DialogContentText>{message}</DialogContentText>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{cancelLabel ?? t("cancel")}</Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color={variant === "error" ? "error" : "primary"}
          autoFocus
        >
          {confirmLabel ?? t("confirm")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
