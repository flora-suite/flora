// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  BookmarksOutlined,
  FolderOpenOutlined,
  GridViewOutlined,
  HomeOutlined,
  InsertLinkOutlined,
  LineStyleOutlined,
  SettingsOutlined,
  StopCircleOutlined,
  ViewQuiltOutlined,
  DescriptionOutlined,
  SchoolOutlined,
  RocketLaunchOutlined,
  DataObjectOutlined,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Container,
  Divider,
  Icon,
  Link,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  Stack,
  SvgIcon,
  Typography,
  useTheme,
} from "@mui/material";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { makeStyles } from "tss-react/mui";

import { DashboardAppBar } from "@lichtblick/suite-base/components/AppBar";
import TextMiddleTruncate from "@lichtblick/suite-base/components/TextMiddleTruncate";
import { usePlayerSelection } from "@lichtblick/suite-base/context/PlayerSelectionContext";
import { useWorkspaceActions } from "@lichtblick/suite-base/context/Workspace/useWorkspaceActions";
import { formatKeyboardShortcut } from "@lichtblick/suite-base/util/formatKeyboardShortcut";

const useStyles = makeStyles()((theme) => {
  return {
    body: {
      display: "flex",
      flex: "1 1 auto",
      flexDirection: "column",
      overflowY: "hidden",
      [theme.breakpoints.up("sm")]: {
        flexDirection: "row",
      },
    },
    main: {
      padding: theme.spacing(3),
      flex: "1 1 auto",
      overflowY: "auto",
    },
    grid: {
      display: "grid",
      gap: theme.spacing(2),
      gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
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
    resourceIcon: {
      color: theme.palette.primary.main,
      marginBottom: theme.spacing(1),
    },
    emptyState: {
      padding: theme.spacing(2),
      color: theme.palette.text.secondary,
      textAlign: "center",
    },
    truncate: {
      alignSelf: "center !important",
    },
    upgradeBanner: {
      background: `linear-gradient(90deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
      color: theme.palette.primary.contrastText,
      padding: theme.spacing(2),
      borderRadius: theme.shape.borderRadius,
      marginBottom: theme.spacing(3),
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: theme.spacing(2),
    },
    menuItem: {
      "& .MuiListItemIcon-root": {
        color: theme.palette.text.secondary,
      },
      "&.Mui-selected .MuiListItemIcon-root": {
        color: theme.palette.primary.main,
      },
      "&.Mui-disabled": {
        opacity: 1,
        "& .MuiTypography-root": {
          color: theme.palette.text.secondary,
        },
        "& .MuiListItemIcon-root": {
          color: theme.palette.text.secondary,
        },
      },
    },
  };
});

export function Dashboard(): React.JSX.Element {
  const { classes } = useStyles();
  const theme = useTheme();
  const { t } = useTranslation("openDialog");
  const { dialogActions } = useWorkspaceActions();
  const { recentSources, selectRecent } = usePlayerSelection();
  const navigate = useNavigate();

  const handleOpenLocalFile = useCallback(() => {
    dialogActions.openFile
      .open()
      .then(() => {
        navigate("/view");
      })
      .catch((err: unknown) => {
        console.error(err);
      });
  }, [dialogActions.openFile, navigate]);

  const handleOpenConnection = useCallback(() => {
    dialogActions.dataSource.open("connection");
    navigate("/view");
  }, [dialogActions.dataSource, navigate]);

  const handleOpenSettings = useCallback(() => {
    dialogActions.preferences.open();
  }, [dialogActions.preferences]);

  const handleExploreSampleData = useCallback(() => {
    dialogActions.dataSource.open("demo");
    navigate("/view");
  }, [dialogActions.dataSource, navigate]);

  const handleSelectRecent = useCallback(
    (recentId: string) => {
      selectRecent(recentId);
      navigate("/view");
    },
    [selectRecent, navigate],
  );

  return (
    <Stack flexDirection="column" height="100%">
      <Stack>
        <DashboardAppBar />
      </Stack>
      <Stack className={classes.body}>
        {/* Sidebar */}
        <Stack
          flexGrow={0}
          sx={{
            width: { sm: 240, md: 260 },
            borderRight: `1px solid ${theme.palette.divider}`,
          }}
        >
          <MenuList sx={{ p: 2 }}>
            <MenuItem disabled>
              <Typography variant="overline">{t("openDataSource")}</Typography>
            </MenuItem>
            <MenuItem onClick={handleOpenLocalFile} className={classes.menuItem}>
              <ListItemIcon>
                <FolderOpenOutlined />
              </ListItemIcon>
              <ListItemText>{t("openLocalFiles")}</ListItemText>
              <Typography variant="body2" color="text.secondary">
                {formatKeyboardShortcut("O", ["Meta"])}
              </Typography>
            </MenuItem>
            <MenuItem onClick={handleOpenConnection} className={classes.menuItem}>
              <ListItemIcon>
                <InsertLinkOutlined />
              </ListItemIcon>
              <ListItemText>{t("openConnection")}</ListItemText>
              <Typography variant="body2" color="text.secondary">
                {formatKeyboardShortcut("O", ["Meta", "Shift"])}
              </Typography>
            </MenuItem>
            <Divider sx={{ my: 1 }} />
            <MenuItem disabled>
              <Typography variant="overline">{t("browse")}</Typography>
            </MenuItem>
            <MenuItem selected className={classes.menuItem}>
              <ListItemIcon>
                <HomeOutlined />
              </ListItemIcon>
              <ListItemText>{t("dashboard")}</ListItemText>
            </MenuItem>
            <MenuItem disabled className={classes.menuItem}>
              <ListItemIcon>
                <GridViewOutlined />
              </ListItemIcon>
              <ListItemText>{t("devices")}</ListItemText>
            </MenuItem>
            <MenuItem disabled className={classes.menuItem}>
              <ListItemIcon>
                <StopCircleOutlined />
              </ListItemIcon>
              <ListItemText>{t("recordings")}</ListItemText>
            </MenuItem>
            <MenuItem disabled className={classes.menuItem}>
              <ListItemIcon>
                <BookmarksOutlined />
              </ListItemIcon>
              <ListItemText>{t("events")}</ListItemText>
            </MenuItem>
            <MenuItem disabled className={classes.menuItem}>
              <ListItemIcon>
                <LineStyleOutlined />
              </ListItemIcon>
              <ListItemText>{t("timeline")}</ListItemText>
            </MenuItem>
            <MenuItem disabled className={classes.menuItem}>
              <ListItemIcon>
                <ViewQuiltOutlined />
              </ListItemIcon>
              <ListItemText>{t("layouts")}</ListItemText>
            </MenuItem>
            <Divider sx={{ my: 1 }} />
            <MenuItem onClick={handleOpenSettings} className={classes.menuItem}>
              <ListItemIcon>
                <SettingsOutlined />
              </ListItemIcon>
              <ListItemText>Settings</ListItemText>
            </MenuItem>
          </MenuList>
        </Stack>

        {/* Main content */}
        <Stack
          flexGrow={1}
          flexShrink={1}
          flexBasis="auto"
          style={{ overflowX: "hidden", backgroundColor: theme.palette.background.default }}
        >
          <Box className={classes.main}>
            <Stack flexDirection="column" rowGap={4} pb={4} maxWidth="1000px">
              {/* Upgrade Banner */}
              <Box className={classes.upgradeBanner}>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {t("upgradeYourPlan")}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {t("upgradeDescription")}
                  </Typography>
                </Box>
                <Button variant="contained" color="secondary" size="small">
                  {t("learnMore")}
                </Button>
              </Box>

              {/* Quick actions */}
              <div className={classes.grid}>
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
                      sx={{
                        height: "100%",
                        p: 2,
                        alignItems: "flex-start",
                        justifyContent: "flex-start",
                      }}
                    >
                      <DescriptionOutlined className={classes.resourceIcon} fontSize="large" />
                      <CardContent sx={{ p: 0 }}>
                        <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                          {t("exploreExampleDatasets")}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
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
                      sx={{
                        height: "100%",
                        p: 2,
                        alignItems: "flex-start",
                        justifyContent: "flex-start",
                      }}
                    >
                      <SchoolOutlined className={classes.resourceIcon} fontSize="large" />
                      <CardContent sx={{ p: 0 }}>
                        <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                          {t("whatIsFlora")}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
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
                      sx={{
                        height: "100%",
                        p: 2,
                        alignItems: "flex-start",
                        justifyContent: "flex-start",
                      }}
                    >
                      <RocketLaunchOutlined className={classes.resourceIcon} fontSize="large" />
                      <CardContent sx={{ p: 0 }}>
                        <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                          {t("gettingStartedWithRos2")}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
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
                      sx={{
                        height: "100%",
                        p: 2,
                        alignItems: "flex-start",
                        justifyContent: "flex-start",
                      }}
                    >
                      <DataObjectOutlined className={classes.resourceIcon} fontSize="large" />
                      <CardContent sx={{ p: 0 }}>
                        <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                          {t("writingDataWithSchemas")}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
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
          </Box>
        </Stack>
      </Stack>
    </Stack>
  );
}
