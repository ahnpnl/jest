/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const DummyLocation = require('../dummy-location');

test('should work', () => {
  expect(globalThis.document.location).toBeInstanceOf(DummyLocation);
  globalThis.document.location.search = 'foo=bar';
  expect(globalThis.document.location.search).toBe('foo=bar');
});
