/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

test('defineConfig simple test', () => {
  expect(1 + 1).toBe(2);
});

test('defineConfig test with coverage', () => {
  function add(a, b) {
    return a + b;
  }
  expect(add(2, 3)).toBe(5);
});
