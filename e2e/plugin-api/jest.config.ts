/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Config} from '@jest/types';
import {myPlugin} from './myPlugin';

const config: Config.InitialOptions = {
  displayName: 'Plugin API Test',
  plugins: [myPlugin()],
  testEnvironment: 'node',
};

export default config;
