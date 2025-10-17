/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

describe('Vite Integration Example', () => {
  it('should run tests normally', () => {
    expect(true).toBe(true);
  });

  it('should work with basic assertions', () => {
    const sum = (a, b) => a + b;
    expect(sum(1, 2)).toBe(3);
  });
});
