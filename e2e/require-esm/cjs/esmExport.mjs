/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export function distance(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export default class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}
