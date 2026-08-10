/** @jest-environment jsdom */

// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { parseUrdf } from "./parser";

describe("parseUrdf", () => {
  it("parses pose with arbitrary whitespace", () => {
    expect(
      parseUrdf(/* xml */ `<?xml version="1.0" ?>
    <robot name="X">
      <link name="x">
        <visual name="y">
          <origin xyz="0     0    -0.135" rpy="0   0   1.57"/>
          <geometry>
            <box size="1 2 3"/>
          </geometry>
        </visual>
      </link>
    </robot>
`),
    ).toMatchInlineSnapshot(`
      {
        "joints": Map {},
        "links": Map {
          "x" => {
            "colliders": [],
            "name": "x",
            "visuals": [
              {
                "geometry": {
                  "geometryType": "box",
                  "size": {
                    "x": 1,
                    "y": 2,
                    "z": 3,
                  },
                },
                "material": undefined,
                "name": "y",
                "origin": {
                  "rpy": {
                    "x": 0,
                    "y": 0,
                    "z": 1.57,
                  },
                  "xyz": {
                    "x": 0,
                    "y": 0,
                    "z": -0.135,
                  },
                },
              },
            ],
          },
        },
        "materials": Map {},
        "name": "X",
      }
    `);
  });

  it("parses complete links, joints, materials, and every geometry kind", () => {
    const robot = parseUrdf(`
      <robot name="complete">
        <material name="paint"><color rgba="0.1 0.2 0.3 0.4"/><texture filename="paint.png"/></material>
        <link name="base">
          <inertial><origin xyz="1 2 3" rpy="4 5 6"/><mass>2.5</mass><inertia ixx="1" ixy="2" ixz="3" iyy="4" iyz="5" izz="6"/></inertial>
          <visual name="box"><geometry><box size="1 2 3"/></geometry><material name="inline"><color rgba="1 0 0 1"/></material></visual>
          <visual name="cylinder"><geometry><cylinder length="4" radius="5"/></geometry></visual>
          <visual name="sphere"><geometry><sphere radius="6"/></geometry></visual>
          <collision name="mesh"><origin/><geometry><mesh filename="mesh.stl" scale="2 3 4"/></geometry></collision>
        </link>
        <joint name="arm" type="revolute">
          <origin xyz="1 0 0"/><parent link="base"/><child link="tool"/><axis xyz="0 1 0"/>
          <calibration rising="1" falling="2"/><dynamics damping="3" friction="4"/>
          <limit lower="-1" upper="1" effort="2" velocity="3"/><mimic joint="other" multiplier="4" offset="5"/>
          <safety_controller soft_lower_limit="-0.5" soft_upper_limit="0.5" k_position="6" k_velocity="7"/>
        </joint>
      </robot>
    `);

    expect(robot.materials.get("paint")).toEqual({
      name: "paint",
      color: { r: 0.1, g: 0.2, b: 0.3, a: 0.4 },
      texture: "paint.png",
    });
    expect(robot.links.get("base")).toMatchObject({
      inertial: {
        origin: { xyz: { x: 1, y: 2, z: 3 }, rpy: { x: 4, y: 5, z: 6 } },
        mass: 2.5,
        inertia: { ixx: 1, ixy: 2, ixz: 3, iyy: 4, iyz: 5, izz: 6 },
      },
      visuals: [
        { geometry: { geometryType: "box", size: { x: 1, y: 2, z: 3 } } },
        { geometry: { geometryType: "cylinder", length: 4, radius: 5 } },
        { geometry: { geometryType: "sphere", radius: 6 } },
      ],
      colliders: [
        {
          geometry: { geometryType: "mesh", filename: "mesh.stl", scale: { x: 2, y: 3, z: 4 } },
        },
      ],
    });
    expect(robot.joints.get("arm")).toMatchObject({
      jointType: "revolute",
      parent: "base",
      child: "tool",
      axis: { x: 0, y: 1, z: 0 },
      calibration: { rising: 1, falling: 2 },
      dynamics: { damping: 3, friction: 4 },
      limit: { lower: -1, upper: 1, effort: 2, velocity: 3 },
      mimic: { joint: "other", multiplier: 4, offset: 5 },
      safetyController: { softLowerLimit: -0.5, softUpperLimit: 0.5, kPosition: 6, kVelocity: 7 },
    });
  });

  it("uses defaults for omitted optional joint and pose properties", () => {
    const robot = parseUrdf(
      `<robot name="defaults"><link name="a"/><joint name="fixed" type="fixed"><parent link="a"/><child link="b"/></joint></robot>`,
    );

    expect(robot.joints.get("fixed")).toMatchObject({
      origin: { xyz: { x: 0, y: 0, z: 0 }, rpy: { x: 0, y: 0, z: 0 } },
      axis: { x: 1, y: 0, z: 0 },
    });
  });

  it.each([
    ['<link name="a"/>', "No robot found"],
    ["<robot/>", "<robot> name is missing"],
    ['<robot name="r"><joint name="j" type="invalid"/></robot>', "invalid joint type"],
    ['<robot name="r"><link name="l"><visual/></link></robot>', "<visual> must have geometry"],
    [
      '<robot name="r"><link name="l"><collision/></link></robot>',
      "<collision> must have geometry",
    ],
    [
      '<robot name="r"><link name="l"><inertial><mass>1</mass></inertial></link></robot>',
      "<inertial> must have mass and inertia",
    ],
  ])("rejects invalid input: %s", (xml, message) => {
    expect(() => parseUrdf(xml)).toThrow(message);
  });
});
