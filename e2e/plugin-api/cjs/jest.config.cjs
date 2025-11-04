/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const {myPlugin, transformPlugin} = require('./myPlugin.cjs');

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  displayName: 'Plugin API Test (CJS)',
  plugins: [myPlugin(), transformPlugin()],
  testEnvironment: 'node',
};
