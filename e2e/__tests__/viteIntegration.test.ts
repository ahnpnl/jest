/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {extractSummary} from '../Utils';
import runJest from '../runJest';

const DIR = path.resolve(__dirname, '../vite-integration');

test('vite integration does not break normal jest execution', () => {
  const result = runJest(DIR, ['--no-cache']);
  const {summary} = extractSummary(result.stderr);

  expect(result.exitCode).toBe(0);
  expect(summary).toContain('1 passed');
});

test('vite integration config is recognized', () => {
  const result = runJest(DIR, ['--showConfig']);

  expect(result.exitCode).toBe(0);
  // Config should be parseable even with vite option
  expect(() => JSON.parse(result.stdout)).not.toThrow();
});
