/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {createRequire} from 'module';

test('require of ESM should throw correct error', () => {
  const require = createRequire(import.meta.url);

  expect(() => require('../fromCjs.mjs')).toThrow(
    expect.objectContaining({
      code: 'ERR_REQUIRE_ESM',
      message: expect.stringContaining('Must use import to load ES Module'),
    }),
  );
});
