// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import fs from "fs";
import os from "os";
import path from "path";

import {
  findRosPackage,
  findRosPackageInRoot,
  rosPackageNameAtPath,
} from "./rosPackageResources";

describe("ROS package resource lookup", () => {
  let root: string;
  const originalRosPackagePath = process.env.ROS_PACKAGE_PATH;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "flora-ros-package-test-"));
    delete process.env.ROS_PACKAGE_PATH;
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
    if (originalRosPackagePath == undefined) {
      delete process.env.ROS_PACKAGE_PATH;
    } else {
      process.env.ROS_PACKAGE_PATH = originalRosPackagePath;
    }
  });

  it("reads a package name and finds nested ROS packages", async () => {
    const nested = path.join(root, "workspace", "share", "demo");
    fs.mkdirSync(nested, { recursive: true });
    fs.writeFileSync(path.join(nested, "package.xml"), "<package><name>demo_pkg</name></package>");

    await expect(rosPackageNameAtPath(nested)).resolves.toBe("demo_pkg");
    await expect(findRosPackageInRoot("demo_pkg", root)).resolves.toBe(nested);
    await expect(findRosPackageInRoot("missing", root)).resolves.toBeUndefined();
  });

  it("uses configured paths before ROS_PACKAGE_PATH", async () => {
    const configured = path.join(root, "configured");
    const environment = path.join(root, "environment");
    const configuredPackage = path.join(configured, "target");
    const environmentPackage = path.join(environment, "target");
    fs.mkdirSync(configuredPackage, { recursive: true });
    fs.mkdirSync(environmentPackage, { recursive: true });
    fs.writeFileSync(
      path.join(configuredPackage, "package.xml"),
      "<package><name>target</name></package>",
    );
    fs.writeFileSync(
      path.join(environmentPackage, "package.xml"),
      "<package><name>target</name></package>",
    );
    process.env.ROS_PACKAGE_PATH = environment;

    await expect(findRosPackage("target", { rosPackagePath: configured })).resolves.toBe(
      configuredPackage,
    );
    await expect(findRosPackage("target")).resolves.toBe(environmentPackage);
  });
});
