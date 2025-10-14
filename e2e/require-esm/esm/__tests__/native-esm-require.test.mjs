/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {createRequire} from 'module';

test('should not throw error', () => {
  const require = createRequire(import.meta.url);

  expect(() => require('../esmExport.mjs')).not.toThrow();
});
