/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {resolve} from 'path';
import runJest from '../runJest';
import {runYarnInstall} from '../Utils';

const DIR = resolve(__dirname, '../test-environment-esm');

beforeAll(() => {
  runYarnInstall(DIR);
});

describe('test environment ESM support', () => {
  it('support test environment written in ESM', () => {
    const {exitCode} = runJest(DIR);

    expect(exitCode).toBe(0);
  });

  it('support test environment written in ESM with TypeScript', () => {
    const {exitCode} = runJest(DIR, ['-c', 'jest-esm-env-ts.config.ts']);

    expect(exitCode).toBe(0);
  });
});
