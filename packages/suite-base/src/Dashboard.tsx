// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { FolderOpenOutlined, InsertLinkOutlined, HomeOutlined, GridViewOutlined, StopCircleOutlined, BookmarksOutlined, LineStyleOutlined, SettingsOutlined } from '@mui/icons-material';
import { Card, CardActionArea, Container, Divider, Icon, Link, ListItemIcon, ListItemText, MenuItem, MenuList, Stack, Typography } from "@mui/material";
import { makeStyles } from "tss-react/mui";

import { DashboardAppBar } from "@lichtblick/suite-base/components/AppBar";

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
      padding: "24px",
      flex: "1 1 auto",
      borderLeft: "1px solid",
      borderColor: theme.palette.divider
    },
    grid: {
      display: "grid",
      gap: theme.spacing(2),
      gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    },
    actionArea: {
      display: "flex",
      padding: theme.spacing(2),
      gap: theme.spacing(1.2),
    },
    text: {
      flex: "1 1 auto",
    },
    recentItem: {
      padding: `${theme.spacing(1.3)} ${theme.spacing(2)}`,
    },
    resourceList: {
      display: "flex",
      gap: theme.spacing(2),
      whiteSpace: "wrap",
    },
    resourceIcon: {
      minWidth: "56px",
      aspectRatio: "1/1",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.palette.action.disabled,
      borderRadius: theme.shape.borderRadius,
      "&.MuiListItemIcon-root": {
        minWidth: "56px",
        "> .MuiSvgIcon-root": {
          width: "32px",
          height: "32px",
        }
      }
    }
  }
});


export function Dashboard(): JSX.Element {
  const { classes } = useStyles();
  return <Stack flex-column height="100%">
    <Stack>
      <DashboardAppBar>
      </DashboardAppBar>
    </Stack>
    <Stack className={classes.body}>
      <Stack flexGrow={0} style={{ minWidth: "280px" }}>
        <MenuList style={{ padding: "24px" }}>
          <MenuItem disabled>Open data sources</MenuItem>
          <MenuItem>
            <ListItemIcon>
              <FolderOpenOutlined />
            </ListItemIcon>
            <ListItemText>打开本地文件</ListItemText>
            <Typography variant="body2">
              <kbd>⌘C</kbd>
            </Typography>
          </MenuItem>
          <MenuItem>
            <ListItemIcon>
              <InsertLinkOutlined />
            </ListItemIcon>
            <ListItemText>打开链接</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem disabled>Browse</MenuItem>
          <MenuItem>
            <ListItemIcon>
              <HomeOutlined />
            </ListItemIcon>
            <ListItemText>Dashboard</ListItemText>
          </MenuItem>
          <MenuItem>
            <ListItemIcon>
              <GridViewOutlined />
            </ListItemIcon>
            <ListItemText>Devices</ListItemText>
          </MenuItem>
          <MenuItem>
            <ListItemIcon>
              <StopCircleOutlined />
            </ListItemIcon>
            <ListItemText>Recordings</ListItemText>
          </MenuItem>
          <MenuItem>
            <ListItemIcon>
              <BookmarksOutlined />
            </ListItemIcon>
            <ListItemText>Events</ListItemText>
          </MenuItem>
          <MenuItem>
            <ListItemIcon>
              <LineStyleOutlined />
            </ListItemIcon>
            <ListItemText>Timeline</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem>
            <ListItemIcon>
              <SettingsOutlined />
            </ListItemIcon>
            <ListItemText>Settings</ListItemText>
          </MenuItem>
        </MenuList>
      </Stack>
      <Stack flexGrow={1} flexShrink={1} flexBasis="auto" style={{ overflowX: "hidden" }}>
        <Container className={classes.main}>
          <Stack flexDirection="column" maxWidth="44rem" rowGap={3}>
            <div className={classes.grid}>
              <Card>
                <CardActionArea className={classes.actionArea}>
                  <Icon component="div" fontSize="large"><FolderOpenOutlined fontSize="medium" /></Icon>
                  <div className={classes.text}>
                    <Typography variant="subtitle1">Open local file(s)</Typography>
                    <Typography variant="body2">Visualize data directly from your local filesystem.</Typography>
                  </div>
                </CardActionArea>
              </Card>
              <Card>
                <CardActionArea className={classes.actionArea}>
                  <Icon component="div" fontSize="large"><FolderOpenOutlined fontSize="medium" /></Icon>
                  <div className={classes.text}>
                    <Typography variant="subtitle1">Open local file(s)</Typography>
                    <Typography variant="body2">Visualize data directly from your local filesystem.</Typography>
                  </div>
                </CardActionArea>
              </Card>
              <Card>
                <CardActionArea className={classes.actionArea}>
                  <Icon component="div" fontSize="large"><FolderOpenOutlined fontSize="medium" /></Icon>
                  <div className={classes.text}>
                    <Typography variant="subtitle1">Open local file(s)</Typography>
                    <Typography variant="body2">Visualize data directly from your local filesystem.</Typography>
                  </div>
                </CardActionArea>
              </Card>
              <Card>
                <CardActionArea className={classes.actionArea}>
                  <Icon component="div" fontSize="large"><FolderOpenOutlined fontSize="medium" /></Icon>
                  <div className={classes.text}>
                    <Typography variant="subtitle1">Open local file(s)</Typography>
                    <Typography variant="body2">Visualize data directly from your local filesystem.</Typography>
                  </div>
                </CardActionArea>
              </Card>
            </div>
            <div>
              <Typography variant="h5" component="div" gutterBottom>Recently viewed</Typography>
              <Card>
                <MenuList disablePadding>
                  <MenuItem className={classes.recentItem}>
                    <ListItemIcon>
                      <FolderOpenOutlined />
                    </ListItemIcon>
                    <ListItemText>sdlkfjslk.mcap</ListItemText>
                  </MenuItem>
                  <MenuItem className={classes.recentItem}>
                    <ListItemIcon>
                      <InsertLinkOutlined />
                    </ListItemIcon>
                    <ListItemText>fsldjflsd.mcap</ListItemText>
                  </MenuItem>
                  <MenuItem className={classes.recentItem}>
                    <ListItemIcon>
                      <HomeOutlined />
                    </ListItemIcon>
                    <ListItemText>Dashboard</ListItemText>
                  </MenuItem>
                </MenuList>
              </Card>
            </div>
            <div>
              <Typography variant="h5" component="div" gutterBottom>Resources</Typography>
              <Card>
                <MenuList disablePadding>
                  <MenuItem className={classes.resourceList}>
                    <ListItemIcon className={classes.resourceIcon}>
                      <FolderOpenOutlined />
                    </ListItemIcon>
                    <ListItemText
                      primary="Explore sample data"
                      primaryTypographyProps={{ variant: "h6" }}
                      secondary={<Stack gap={1}>
                        Not sure where to start? Explore and visualize a variety of sample datasets to see how Flora can enrich your robotics development workflows.
                        <Typography component={Link}>Visualize sample data</Typography>
                      </Stack>}
                      secondaryTypographyProps={{ variant: "body2", noWrap: false }}
                    ></ListItemText>
                  </MenuItem>
                  <MenuItem className={classes.resourceList}>
                    <ListItemIcon className={classes.resourceIcon}>
                      <FolderOpenOutlined />
                    </ListItemIcon>
                    <ListItemText
                      primary="Explore sample data"
                      primaryTypographyProps={{ variant: "h6" }}
                      secondary={<Stack gap={1}>
                        Not sure where to start? Explore and visualize a variety of sample datasets to see how Flora can enrich your robotics development workflows.
                        <Typography component={Link}>Visualize sample data</Typography>
                      </Stack>}
                      secondaryTypographyProps={{ variant: "body2", noWrap: false }}
                    ></ListItemText>
                  </MenuItem>
                  <MenuItem className={classes.resourceList}>
                    <ListItemIcon className={classes.resourceIcon}>
                      <FolderOpenOutlined />
                    </ListItemIcon>
                    <ListItemText
                      primary="Explore sample data"
                      primaryTypographyProps={{ variant: "h6" }}
                      secondary={<Stack gap={1}>
                        Not sure where to start? Explore and visualize a variety of sample datasets to see how Flora can enrich your robotics development workflows.
                        <Typography component={Link}>Visualize sample data</Typography>
                      </Stack>}
                      secondaryTypographyProps={{ variant: "body2", noWrap: false }}
                    ></ListItemText>
                  </MenuItem>
                  <MenuItem className={classes.resourceList}>
                    <ListItemIcon className={classes.resourceIcon}>
                      <FolderOpenOutlined />
                    </ListItemIcon>
                    <ListItemText
                      primary="Explore sample data"
                      primaryTypographyProps={{ variant: "h6" }}
                      secondary={<Stack gap={1}>
                        Not sure where to start? Explore and visualize a variety of sample datasets to see how Flora can enrich your robotics development workflows.
                        <Typography component={Link}>Visualize sample data</Typography>
                      </Stack>}
                      secondaryTypographyProps={{ variant: "body2", noWrap: false }}
                    ></ListItemText>
                  </MenuItem>
                </MenuList>
              </Card>
            </div>
          </Stack>
        </Container>
      </Stack>
    </Stack>
  </Stack>;
}
