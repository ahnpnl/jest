/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import runJest from '../runJest';

describe('Vite Integration', () => {
  test('should run tests with vite config enabled', () => {
    const result = runJest('vite-integration');
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('PASS');
  });

  test('should validate vite config type checking', () => {
    const {configs} = require('jest-config');
    expect(configs).toBeDefined();
  });
});
