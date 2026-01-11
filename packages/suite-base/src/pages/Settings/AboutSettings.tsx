// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Link, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { makeStyles } from "tss-react/mui";

import CopyButton from "@lichtblick/suite-base/components/CopyButton";
import FloraLogoText from "@lichtblick/suite-base/components/FloraLogoText";
import Stack from "@lichtblick/suite-base/components/Stack";

const useStyles = makeStyles()((theme) => ({
  root: {
    padding: theme.spacing(3),
    overflowY: "auto",
    height: "100%",
  },
  section: {
    maxWidth: 600,
  },
  logo: {
    width: 180,
    height: "auto",
    marginBottom: theme.spacing(2),
  },
}));

const aboutItems = [
  {
    subheader: "Legal",
    links: [
      {
        title: "License terms",
        url: "https://github.com/flora-suite/flora/blob/main/LICENSE",
      },
    ],
  },
];

export function AboutSettings(): React.JSX.Element {
  const { classes } = useStyles();
  const { t } = useTranslation("appSettings");

  return (
    <div className={classes.root}>
      <Stack gap={2} className={classes.section} alignItems="flex-start">
        <Typography variant="h5" gutterBottom>
          {t("about")}
        </Typography>
        <FloraLogoText color="primary" className={classes.logo} />
        <Stack direction="row" alignItems="center" gap={1}>
          <Typography variant="body2">Flora version {LICHTBLICK_SUITE_VERSION}</Typography>
          <CopyButton
            size="small"
            getText={() => LICHTBLICK_SUITE_VERSION?.toString() ?? ""}
          />
        </Stack>
        {aboutItems.map((item) => (
          <Stack key={item.subheader} gap={1}>
            <Typography fontWeight={600}>{item.subheader}</Typography>
            {item.links.map((link) => (
              <Link
                variant="body2"
                underline="hover"
                key={link.title}
                href={link.url}
                target="_blank"
              >
                {link.title}
              </Link>
            ))}
          </Stack>
        ))}
      </Stack>
    </div>
  );
}
