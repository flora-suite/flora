// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { eulerToQuaternion, makeCovarianceArray, Point, Quaternion, Vector3 } from "./geometry";

describe("geometry", () => {
  describe("types", () => {
    it("should define Point type correctly", () => {
      const point: Point = { x: 1, y: 2, z: 3 };
      expect(point.x).toBe(1);
      expect(point.y).toBe(2);
      expect(point.z).toBe(3);
    });

    it("should define Quaternion type correctly", () => {
      const quat: Quaternion = { x: 0, y: 0, z: 0, w: 1 };
      expect(quat.x).toBe(0);
      expect(quat.y).toBe(0);
      expect(quat.z).toBe(0);
      expect(quat.w).toBe(1);
    });

    it("should define Vector3 type correctly", () => {
      const vec: Vector3 = { x: 1.5, y: -2.5, z: 0.5 };
      expect(vec.x).toBe(1.5);
      expect(vec.y).toBe(-2.5);
      expect(vec.z).toBe(0.5);
    });
  });

  describe("eulerToQuaternion", () => {
    it("should convert zero rotation to identity quaternion", () => {
      const rpy: Vector3 = { x: 0, y: 0, z: 0 };
      const quaternion = eulerToQuaternion(rpy);

      expect(quaternion.x).toBeCloseTo(0, 6);
      expect(quaternion.y).toBeCloseTo(0, 6);
      expect(quaternion.z).toBeCloseTo(0, 6);
      expect(quaternion.w).toBeCloseTo(1, 6);
    });

    it("should convert 90 degree roll rotation correctly", () => {
      const rpy: Vector3 = { x: Math.PI / 2, y: 0, z: 0 };
      const quaternion = eulerToQuaternion(rpy);

      expect(quaternion.x).toBeCloseTo(Math.sqrt(2) / 2, 6);
      expect(quaternion.y).toBeCloseTo(0, 6);
      expect(quaternion.z).toBeCloseTo(0, 6);
      expect(quaternion.w).toBeCloseTo(Math.sqrt(2) / 2, 6);
    });

    it("should convert 90 degree pitch rotation correctly", () => {
      const rpy: Vector3 = { x: 0, y: Math.PI / 2, z: 0 };
      const quaternion = eulerToQuaternion(rpy);

      expect(quaternion.x).toBeCloseTo(0, 6);
      expect(quaternion.y).toBeCloseTo(Math.sqrt(2) / 2, 6);
      expect(quaternion.z).toBeCloseTo(0, 6);
      expect(quaternion.w).toBeCloseTo(Math.sqrt(2) / 2, 6);
    });

    it("should convert 90 degree yaw rotation correctly", () => {
      const rpy: Vector3 = { x: 0, y: 0, z: Math.PI / 2 };
      const quaternion = eulerToQuaternion(rpy);

      expect(quaternion.x).toBeCloseTo(0, 6);
      expect(quaternion.y).toBeCloseTo(0, 6);
      expect(quaternion.z).toBeCloseTo(Math.sqrt(2) / 2, 6);
      expect(quaternion.w).toBeCloseTo(Math.sqrt(2) / 2, 6);
    });

    it("should convert 180 degree rotations correctly", () => {
      const rpy: Vector3 = { x: Math.PI, y: 0, z: 0 };
      const quaternion = eulerToQuaternion(rpy);

      expect(quaternion.x).toBeCloseTo(1, 6);
      expect(quaternion.y).toBeCloseTo(0, 6);
      expect(quaternion.z).toBeCloseTo(0, 6);
      expect(quaternion.w).toBeCloseTo(0, 6);
    });

    it("should handle combined rotations", () => {
      const rpy: Vector3 = { x: Math.PI / 4, y: Math.PI / 4, z: Math.PI / 4 };
      const quaternion = eulerToQuaternion(rpy);

      // Verify quaternion is normalized (magnitude = 1)
      const magnitude = Math.sqrt(
        quaternion.x * quaternion.x +
          quaternion.y * quaternion.y +
          quaternion.z * quaternion.z +
          quaternion.w * quaternion.w,
      );
      expect(magnitude).toBeCloseTo(1, 6);
    });

    it("should handle negative rotations", () => {
      const rpy: Vector3 = { x: -Math.PI / 2, y: -Math.PI / 2, z: -Math.PI / 2 };
      const quaternion = eulerToQuaternion(rpy);

      // Verify quaternion is normalized
      const magnitude = Math.sqrt(
        quaternion.x * quaternion.x +
          quaternion.y * quaternion.y +
          quaternion.z * quaternion.z +
          quaternion.w * quaternion.w,
      );
      expect(magnitude).toBeCloseTo(1, 6);
    });

    it("should handle large angle rotations", () => {
      const rpy: Vector3 = { x: 2 * Math.PI, y: 3 * Math.PI, z: 4 * Math.PI };
      const quaternion = eulerToQuaternion(rpy);

      // Verify quaternion is normalized
      const magnitude = Math.sqrt(
        quaternion.x * quaternion.x +
          quaternion.y * quaternion.y +
          quaternion.z * quaternion.z +
          quaternion.w * quaternion.w,
      );
      expect(magnitude).toBeCloseTo(1, 6);
    });
  });

  describe("makeCovarianceArray", () => {
    it("should create a 36-element array", () => {
      const covariance = makeCovarianceArray(1, 2, 3);
      expect(covariance).toHaveLength(36);
    });

    it("should set diagonal elements correctly", () => {
      const xDev = 0.5;
      const yDev = 1.5;
      const thetaDev = 0.1;

      const covariance = makeCovarianceArray(xDev, yDev, thetaDev);

      // Check diagonal elements (0,0), (1,1), and (5,5)
      expect(covariance[0]).toBe(xDev * xDev); // (0,0)
      expect(covariance[7]).toBe(yDev * yDev); // (1,1)
      expect(covariance[35]).toBe(thetaDev * thetaDev); // (5,5)
    });

    it("should set all other elements to zero", () => {
      const covariance = makeCovarianceArray(1, 2, 3);

      for (let i = 0; i < 36; i++) {
        if (i !== 0 && i !== 7 && i !== 35) {
          expect(covariance[i]).toBe(0);
        }
      }
    });

    it("should handle zero deviations", () => {
      const covariance = makeCovarianceArray(0, 0, 0);

      expect(covariance[0]).toBe(0);
      expect(covariance[7]).toBe(0);
      expect(covariance[35]).toBe(0);
    });

    it("should handle negative deviations by squaring them", () => {
      const covariance = makeCovarianceArray(-2, -3, -0.5);

      expect(covariance[0]).toBe(4); // (-2)^2
      expect(covariance[7]).toBe(9); // (-3)^2
      expect(covariance[35]).toBe(0.25); // (-0.5)^2
    });

    it("should handle very small deviations", () => {
      const covariance = makeCovarianceArray(1e-6, 1e-9, 1e-12);

      expect(covariance[0]).toBe(1e-12);
      expect(covariance[7]).toBe(1e-18);
      expect(covariance[35]).toBe(1e-24);
    });

    it("should handle very large deviations", () => {
      const covariance = makeCovarianceArray(1e6, 1e9, 1e3);

      expect(covariance[0]).toBe(1e12);
      expect(covariance[7]).toBe(1e18);
      expect(covariance[35]).toBe(1e6);
    });

    it("should create correct 6x6 matrix structure", () => {
      const covariance = makeCovarianceArray(1, 2, 3);

      // Verify that the array represents a 6x6 matrix with the correct indices
      // Row 0: index 0 should be set
      expect(covariance[0]).toBe(1); // (0,0)
      expect(covariance[1]).toBe(0); // (0,1)
      expect(covariance[5]).toBe(0); // (0,5)

      // Row 1: index 7 should be set
      expect(covariance[6]).toBe(0); // (1,0)
      expect(covariance[7]).toBe(4); // (1,1)
      expect(covariance[11]).toBe(0); // (1,5)

      // Row 5: index 35 should be set
      expect(covariance[30]).toBe(0); // (5,0)
      expect(covariance[31]).toBe(0); // (5,1)
      expect(covariance[35]).toBe(9); // (5,5)
    });
  });
});
