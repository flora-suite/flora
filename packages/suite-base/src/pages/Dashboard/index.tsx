// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  DataObjectOutlined,
  DescriptionOutlined,
  FolderOpenOutlined,
  InsertLinkOutlined,
  RocketLaunchOutlined,
  SchoolOutlined,
} from "@mui/icons-material";
import {
  Card,
  CardActionArea,
  CardContent,
  Icon,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  Typography,
} from "@mui/material";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { makeStyles } from "tss-react/mui";

import Stack from "@lichtblick/suite-base/components/Stack";
import { usePlayerSelection } from "@lichtblick/suite-base/context/PlayerSelectionContext";
import { useWorkspaceActions } from "@lichtblick/suite-base/context/Workspace/useWorkspaceActions";

const useStyles = makeStyles()((theme) => ({
  root: {
    padding: theme.spacing(3),
    overflowY: "auto",
  },
  content: {
    maxWidth: 1000,
  },
  quickActionsGrid: {
    display: "grid",
    gap: theme.spacing(2),
    gridTemplateColumns: "repeat(2, 1fr)",
    [theme.breakpoints.down("md")]: {
      gridTemplateColumns: "1fr",
    },
  },
  actionArea: {
    display: "flex",
    padding: theme.spacing(2),
    gap: theme.spacing(2),
    alignItems: "flex-start",
    height: "100%",
  },
  text: {
    flex: "1 1 auto",
  },
  recentItem: {
    padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
  },
  resourceGrid: {
    display: "grid",
    gap: theme.spacing(2),
    gridTemplateColumns: "repeat(2, 1fr)",
    [theme.breakpoints.down("md")]: {
      gridTemplateColumns: "1fr",
    },
  },
  resourceCard: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  resourceCardAction: {
    height: "100%",
    padding: theme.spacing(2),
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  resourceCardContent: {
    padding: 0,
  },
  resourceIcon: {
    color: theme.palette.primary.main,
    marginBottom: theme.spacing(1),
  },
  emptyState: {
    padding: theme.spacing(2),
    color: theme.palette.text.secondary,
    textAlign: "center",
  },
}));

export function DashboardPage(): React.JSX.Element {
  const { classes } = useStyles();
  const { t } = useTranslation("openDialog");
  const { dialogActions } = useWorkspaceActions();
  const { recentSources, selectRecent } = usePlayerSelection();
  const navigate = useNavigate();

  const handleOpenLocalFile = useCallback(() => {
    dialogActions.openFile
      .open()
      .then(() => {
        void navigate("/view");
      })
      .catch((err: unknown) => {
        console.error(err);
      });
  }, [dialogActions.openFile, navigate]);

  const handleOpenConnection = useCallback(() => {
    dialogActions.dataSource.open("connection");
    void navigate("/view");
  }, [dialogActions.dataSource, navigate]);

  const handleExploreSampleData = useCallback(() => {
    dialogActions.dataSource.open("demo");
    void navigate("/view");
  }, [dialogActions.dataSource, navigate]);

  const handleSelectRecent = useCallback(
    (recentId: string) => {
      selectRecent(recentId);
      void navigate("/view");
    },
    [selectRecent, navigate],
  );

  return (
    <div className={classes.root}>
      <Stack direction="column" gap={4} paddingBottom={4} className={classes.content}>
        {/* Quick actions */}
        <div className={classes.quickActionsGrid}>
          <Card variant="outlined">
            <CardActionArea className={classes.actionArea} onClick={handleOpenLocalFile}>
              <Icon component="div" fontSize="large">
                <FolderOpenOutlined color="primary" fontSize="large" />
              </Icon>
              <div className={classes.text}>
                <Typography variant="h6" gutterBottom>
                  {t("openLocalFiles")}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("openLocalFileDescription")}
                </Typography>
              </div>
            </CardActionArea>
          </Card>
          <Card variant="outlined">
            <CardActionArea className={classes.actionArea} onClick={handleOpenConnection}>
              <Icon component="div" fontSize="large">
                <InsertLinkOutlined color="primary" fontSize="large" />
              </Icon>
              <div className={classes.text}>
                <Typography variant="h6" gutterBottom>
                  {t("openConnection")}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("openConnectionDescription")}
                </Typography>
              </div>
            </CardActionArea>
          </Card>
        </div>

        {/* Recently viewed */}
        <div>
          <Typography variant="h6" component="div" gutterBottom fontWeight="bold">
            {t("recentDataSources")}
          </Typography>
          <Card variant="outlined">
            {recentSources.length > 0 ? (
              <MenuList disablePadding>
                {recentSources.slice(0, 5).map((recent) => (
                  <MenuItem
                    key={recent.id}
                    className={classes.recentItem}
                    onClick={() => {
                      handleSelectRecent(recent.id);
                    }}
                    divider
                  >
                    <ListItemIcon>
                      <FolderOpenOutlined fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={recent.title} />
                  </MenuItem>
                ))}
              </MenuList>
            ) : (
              <Typography className={classes.emptyState} variant="body2">
                {t("noRecentSources")}
              </Typography>
            )}
          </Card>
        </div>

        {/* Resources */}
        <div>
          <Typography variant="h6" component="div" gutterBottom fontWeight="bold">
            {t("resources")}
          </Typography>
          <div className={classes.resourceGrid}>
            {/* Explore Example Datasets */}
            <Card variant="outlined" className={classes.resourceCard}>
              <CardActionArea
                onClick={handleExploreSampleData}
                className={classes.resourceCardAction}
              >
                <DescriptionOutlined className={classes.resourceIcon} fontSize="large" />
                <CardContent className={classes.resourceCardContent}>
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    {t("exploreExampleDatasets")}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" component="p" gutterBottom>
                    {t("exploreExampleDatasetsDescription")}
                  </Typography>
                  <Typography variant="button" color="primary">
                    {t("visualizeExampleData")} &rarr;
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>

            {/* What is Flora? */}
            <Card variant="outlined" className={classes.resourceCard}>
              <CardActionArea
                component="a"
                href="https://docs.foxglove.dev/"
                target="_blank"
                className={classes.resourceCardAction}
              >
                <SchoolOutlined className={classes.resourceIcon} fontSize="large" />
                <CardContent className={classes.resourceCardContent}>
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    {t("whatIsFlora")}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" component="p" gutterBottom>
                    {t("whatIsFloraDescription")}
                  </Typography>
                  <Typography variant="button" color="primary">
                    {t("readTheDocs")} &rarr;
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>

            {/* Getting Started with ROS 2 */}
            <Card variant="outlined" className={classes.resourceCard}>
              <CardActionArea
                component="a"
                href="https://docs.foxglove.dev/docs/connecting-to-data/ros2"
                target="_blank"
                className={classes.resourceCardAction}
              >
                <RocketLaunchOutlined className={classes.resourceIcon} fontSize="large" />
                <CardContent className={classes.resourceCardContent}>
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    {t("gettingStartedWithRos2")}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" component="p" gutterBottom>
                    {t("gettingStartedWithRos2Description")}
                  </Typography>
                  <Typography variant="button" color="primary">
                    {t("readTheDocs")} &rarr;
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>

            {/* Writing Data with Schemas */}
            <Card variant="outlined" className={classes.resourceCard}>
              <CardActionArea
                component="a"
                href="https://docs.foxglove.dev/docs/visualization/message-schemas"
                target="_blank"
                className={classes.resourceCardAction}
              >
                <DataObjectOutlined className={classes.resourceIcon} fontSize="large" />
                <CardContent className={classes.resourceCardContent}>
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    {t("writingDataWithSchemas")}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" component="p" gutterBottom>
                    {t("writingDataWithSchemasDescription")}
                  </Typography>
                  <Typography variant="button" color="primary">
                    {t("readTheDocs")} &rarr;
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </div>
        </div>
      </Stack>
    </div>
  );
}
