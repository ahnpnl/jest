/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {defineConfig, withViteConfig} from 'jest-config';

export default defineConfig({
  displayName: 'vite-integration-test',
  future: {
    experimental_vite: withViteConfig({
      define: {
        __DEV__: false,
        __TEST__: true,
      },
      mode: 'test',
      resolve: {
        alias: {
          '@': __dirname,
        },
      },
    }),
  },
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
});
