/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-config-loader esbuild-register
 */

import type {Config} from 'jest';
import {getDefaultViteConfig} from 'jest-config';

const config: Config = {
  displayName: 'vite-integration-e2e',
  testEnvironment: 'node',
  // Enable Vite integration for e2e testing using default config helper
  // @ts-expect-error - experimental_vite is not yet in the official types
  future: {
    experimental_vite: getDefaultViteConfig(),
  },
};

export default config;
