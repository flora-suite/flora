// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

// Returns true if the input string can be parsed as a float or an integer using
// parseFloat(). Hex and octal numbers will return false.
export function isFloatOrInteger(n: string): boolean {
  if (n.startsWith("0") && n.length > 1) {
    if (n[1] === "x" || n[1] === "X" || n[1] === "o" || n[1] === "O") {
      return false;
    }
  }
  return !isNaN(parseFloat(n)) && isFinite(Number(n));
}
