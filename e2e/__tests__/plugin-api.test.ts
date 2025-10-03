/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import runJest from '../runJest';

test('supports plugins in configuration', () => {
  const {exitCode, stderr, stdout} = runJest('plugin-api');

  expect(exitCode).toBe(0);
  expect(stderr).toContain('PASS');

  // Verify plugin hooks were called
  expect(stdout).toContain('Plugin config hook called with configPath:');
  expect(stdout).toContain('Plugin configResolved hook called for project:');
  expect(stdout).toContain('Plugin configured with project:');
});
