/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from 'node:path';
import {onNodeVersions} from '@jest/test-utils';
import {json as runWithJson} from '../runJest';
import {runYarnInstall} from '../Utils';

const dir = path.resolve(__dirname, '../custom-jsdom-version/v27');

beforeEach(() => {
  runYarnInstall(dir);
});

onNodeVersions('>=20.4.0', () => {
  it('should work with custom jsdom version', () => {
    const result = runWithJson(dir, ['env.test.js']);

    expect(result.json.numPassedTests).toBe(1);
    expect(result.exitCode).toBe(0);
  });
});
