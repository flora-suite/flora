// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as THREE from "three";

import { turboColor, turboColorString } from "./colorUtils";

describe("colorUtils", () => {
  describe("turboColor", () => {
    it("should return the correct color for x = 0.5", () => {
      const color = turboColor(0.5);
      // The middle of the turbo colormap should be around greenish
      expect(color.x).toBeLessThan(200);
      expect(color.y).toBeGreaterThan(200);
      expect(color.z).toBeLessThan(100);
    });

    it("should clamp values below 0 to 0", () => {
      const color1 = turboColor(-0.5);
      const color2 = turboColor(0);
      expect(color1.x).toBeCloseTo(color2.x);
      expect(color1.y).toBeCloseTo(color2.y);
      expect(color1.z).toBeCloseTo(color2.z);
    });

    it("should clamp values above 1 to 1", () => {
      const color1 = turboColor(1.5);
      const color2 = turboColor(1);
      expect(color1.x).toBeCloseTo(color2.x);
      expect(color1.y).toBeCloseTo(color2.y);
      expect(color1.z).toBeCloseTo(color2.z);
    });

    it("should return a THREE.Vector3 instance", () => {
      const color = turboColor(0.3);
      expect(color).toBeInstanceOf(THREE.Vector3);
    });

    it("should return different colors for different input values", () => {
      const color1 = turboColor(0.2);
      const color2 = turboColor(0.8);
      expect(color1.x).not.toBeCloseTo(color2.x);
      expect(color1.y).not.toBeCloseTo(color2.y);
      expect(color1.z).not.toBeCloseTo(color2.z);
    });

    it("should return colors with values between 0 and 255", () => {
      for (let i = 0; i <= 10; i++) {
        const color = turboColor(i / 10);
        expect(color.x).toBeGreaterThanOrEqual(0);
        expect(color.x).toBeLessThanOrEqual(255);
        expect(color.y).toBeGreaterThanOrEqual(0);
        expect(color.y).toBeLessThanOrEqual(255);
        expect(color.z).toBeGreaterThanOrEqual(0);
        expect(color.z).toBeLessThanOrEqual(255);
      }
    });
  });

  describe("turboColorString", () => {
    it("should return a valid RGB string", () => {
      const colorString = turboColorString(0.5);
      expect(colorString).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
    });

    it("should return consistent string format for edge cases", () => {
      const colorString0 = turboColorString(0);
      const colorString1 = turboColorString(1);
      expect(colorString0).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
      expect(colorString1).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
    });

    it("should return different strings for different input values", () => {
      const colorString1 = turboColorString(0.2);
      const colorString2 = turboColorString(0.8);
      expect(colorString1).not.toBe(colorString2);
    });

    it("should handle clamped values correctly", () => {
      const colorStringNegative = turboColorString(-0.5);
      const colorStringZero = turboColorString(0);
      const colorStringAboveOne = turboColorString(1.5);
      const colorStringOne = turboColorString(1);

      expect(colorStringNegative).toBe(colorStringZero);
      expect(colorStringAboveOne).toBe(colorStringOne);
    });

    it("should return integer RGB values", () => {
      const colorString = turboColorString(0.7);
      const match = colorString.match(/^rgb\((\d+), (\d+), (\d+)\)$/);
      expect(match).toBeTruthy();

      if (match) {
        const [, r, g, b] = match;
        expect(Number(r)).toBe(Math.floor(Number(r)));
        expect(Number(g)).toBe(Math.floor(Number(g)));
        expect(Number(b)).toBe(Math.floor(Number(b)));
      }
    });

    it("should return RGB values between 0 and 255", () => {
      for (let i = 0; i <= 10; i++) {
        const colorString = turboColorString(i / 10);
        const match = colorString.match(/^rgb\((\d+), (\d+), (\d+)\)$/);
        expect(match).toBeTruthy();

        if (match) {
          const [, r, g, b] = match;
          expect(Number(r)).toBeGreaterThanOrEqual(0);
          expect(Number(r)).toBeLessThanOrEqual(255);
          expect(Number(g)).toBeGreaterThanOrEqual(0);
          expect(Number(g)).toBeLessThanOrEqual(255);
          expect(Number(b)).toBeGreaterThanOrEqual(0);
          expect(Number(b)).toBeLessThanOrEqual(255);
        }
      }
    });
  });
});
