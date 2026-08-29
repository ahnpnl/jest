/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {myPlugin, transformPlugin} from './myPlugin.mjs';

/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
  displayName: 'Plugin API Test (MJS)',
  plugins: [myPlugin(), transformPlugin()],
  testEnvironment: 'node',
};

export default config;
