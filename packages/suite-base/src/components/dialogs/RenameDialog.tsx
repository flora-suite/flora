// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export type RenameDialogProps = {
  open: boolean;
  title: string;
  label: string;
  initialValue: string;
  onConfirm: (newName: string) => void;
  onCancel: () => void;
};

export function RenameDialog({
  open,
  title,
  label,
  initialValue,
  onConfirm,
  onCancel,
}: RenameDialogProps): React.JSX.Element {
  const { t } = useTranslation("pages");
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (open) {
      setValue(initialValue);
    }
  }, [open, initialValue]);

  const handleConfirm = useCallback(() => {
    if (value.trim()) {
      onConfirm(value.trim());
    }
  }, [onConfirm, value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleConfirm();
      }
    },
    [handleConfirm],
  );

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          margin="dense"
          label={label}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
          }}
          onKeyDown={handleKeyDown}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{t("cancel")}</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!value.trim() || value.trim() === initialValue}
        >
          {t("save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
