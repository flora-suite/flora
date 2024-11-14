<h1 align="center">Flora</h1>

<div align="center">
  <a href="https://github.com/flora-suite/flora/stargazers"><img src="https://img.shields.io/github/stars/flora-suite/flora" alt="Stars Badge"/></a>
  <a href="https://github.com/flora-suite/flora/network/members"><img src="https://img.shields.io/github/forks/flora-suite/flora" alt="Forks Badge"/></a>
  <a href="https://github.com/flora-suite/flora/pulls"><img src="https://img.shields.io/github/issues-pr/flora-suite/flora" alt="Pull Requests Badge"/></a>
  <a href="https://github.com/flora-suite/flora/issues"><img src="https://img.shields.io/github/issues/flora-suite/flora" alt="Issues Badge"/></a>
  <a href="https://github.com/flora-suite/flora/issues"><img src="https://img.shields.io/github/package-json/v/flora-suite/flora" alt="Versions Badge"/></a>
  <a href="https://github.com/flora-suite/flora/graphs/contributors"><img alt="GitHub contributors" src="https://img.shields.io/github/contributors/flora-suite/flora?color=2b9348"></a>
  <img alt="GitHub License" src="https://img.shields.io/github/license/flora-suite/flora">
  <img src="https://sonarcloud.io/api/project_badges/measure?project=flora-suite_flora&metric=alert_status" alt="Quality Gate Status"/>
<br />
<p align="center">
Flora is an integrated visualization and diagnosis tool for robotics, available in your browser or as a desktop app on Linux, Windows, and macOS.
</p>
  <p align="center">
    <img alt="Flora screenshot" src="https://flora.fan/screenshot.png">
  </p>
</div>

## How to install

### macos

```shell
brow tab flora-suite/homebrew-flora
brew install flora
```

### windows and linux

go to [Download](https://github.com/flora-suite/flora/releases)

**Dependencies:**

- [Node.js](https://nodejs.org/en/) v16.10+

<hr/>

## :rocket: Getting started

Clone the repository:

```sh
$ git clone https://github.com/flora-suite/flora.git
```

Enable corepack:

```sh
$ corepack enable
```

Install packages from `package.json`:

```sh
$ yarn install
```

- If you still get errors about corepack after running `corepack enable`, try uninstalling and reinstalling Node.js. Ensure that Yarn is not separately installed from another source, but is installed _via_ corepack.

Launch the development environment:

```sh
# To launch the desktop app (run scripts in different terminals):
$ yarn desktop:serve        # start webpack dev server
$ yarn desktop:start        # launch electron (make sure the desktop:serve finished to build)

# To launch the web app:
$ yarn run web:serve        # it will be avaiable in http://localhost:8080
```

:warning: Ubuntu users: the application may present some issues using GPU. In order to bypass the GPU and process it using directly the CPU (software), please run flora using the variable `LIBGL_ALWAYS_SOFTWARE` set to `1`:

```sh
$ LIBGL_ALWAYS_SOFTWARE=1 yarn desktop:start
```

## :hammer_and_wrench: Building Flora

Build the application for production using these commands:

```sh
# To build the desktop apps:
$ yarn run desktop:build:prod   # compile necessary files

- yarn run package:win         # Package for windows
- yarn run package:darwin      # Package for macOS
- yarn run package:linux       # Package for linux

# To build the web app:
$ yarn run web:build:prod

# To build and run the web app using docker:
$ docker build . -t flora
$ docker run -p 8080:8080 flora

# It is possible to clean up build files using the following command:
$ yarn run clean
```

- The desktop builds are located in the `dist` directory, and the web builds are found in the `web/.webpack` directory.

## :pencil: License (Open Source)

Flora follows an open core licensing model. Most functionality is available in this repository, and can be reproduced or modified per the terms of the [Mozilla Public License v2.0](/LICENSE).

## :handshake: Contributing

Contributions are welcome! Flora is primarily built in TypeScript and ReactJS. All potential contributors must agree to the Contributor License Agreement outlined in [CONTRIBUTING.md](CONTRIBUTING.md).

## :star: Credits

Flora is based on the [Lichtblick](https://github.com/Lichtblick-Suite/lichtblick) open source code.

Lichtblick originally began as a fork of [Foxglove Studio](https://github.com/foxglove/studio), an open-source project developed by [Foxglove](https://foxglove.dev/).
