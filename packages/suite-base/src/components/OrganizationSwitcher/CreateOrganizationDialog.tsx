// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { makeStyles } from "tss-react/mui";

import { useOrganizations } from "@lichtblick/suite-base/context/OrganizationContext";

const useStyles = makeStyles()((theme) => ({
  content: {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(2),
    minWidth: 400,
  },
  helperText: {
    marginTop: theme.spacing(0.5),
    color: theme.palette.text.secondary,
    fontSize: "0.75rem",
  },
}));

export type CreateOrganizationDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function CreateOrganizationDialog({
  open,
  onClose,
}: CreateOrganizationDialogProps): React.JSX.Element {
  const { classes } = useStyles();
  const { t } = useTranslation("organization");

  const { createOrganization, selectOrganization } = useOrganizations();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      setName("");
      setSlug("");
      setDescription("");
      setError(undefined);
      onClose();
    }
  }, [isSubmitting, onClose]);

  const handleNameChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newName = event.target.value;
    setName(newName);
    // Auto-generate slug from name
    const generatedSlug = newName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setSlug(generatedSlug);
  }, []);

  const handleSlugChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newSlug = event.target.value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .replace(/--+/g, "-");
    setSlug(newSlug);
  }, []);

  const handleDescriptionChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setDescription(event.target.value);
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      if (!name.trim()) {
        setError(t("nameRequired"));
        return;
      }

      setIsSubmitting(true);
      setError(undefined);

      try {
        const org = await createOrganization({
          name: name.trim(),
          slug: slug.trim() || undefined,
          description: description.trim() || undefined,
        });
        // Automatically switch to the new organization
        selectOrganization(org);
        handleClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : t("createFailed"));
      } finally {
        setIsSubmitting(false);
      }
    },
    [name, slug, description, createOrganization, selectOrganization, handleClose, t],
  );

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{t("createOrganization")}</DialogTitle>
        <DialogContent className={classes.content}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            autoFocus
            label={t("organizationName")}
            value={name}
            onChange={handleNameChange}
            fullWidth
            required
            disabled={isSubmitting}
            placeholder={t("organizationNamePlaceholder")}
          />

          <TextField
            label={t("organizationSlug")}
            value={slug}
            onChange={handleSlugChange}
            fullWidth
            disabled={isSubmitting}
            placeholder={t("organizationSlugPlaceholder")}
            helperText={t("organizationSlugHelp")}
          />

          <TextField
            label={t("organizationDescription")}
            value={description}
            onChange={handleDescriptionChange}
            fullWidth
            multiline
            rows={3}
            disabled={isSubmitting}
            placeholder={t("organizationDescriptionPlaceholder")}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isSubmitting}>
            {t("cancel")}
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting || !name.trim()}>
            {isSubmitting ? t("creating") : t("create")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
