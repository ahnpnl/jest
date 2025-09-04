/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

test('defineConfig merging test', () => {
  expect(typeof globalThis.window).toBe('object'); // Should work with jsdom
  expect(1 + 1).toBe(2);
});
