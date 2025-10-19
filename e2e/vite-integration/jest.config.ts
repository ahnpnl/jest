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
      mode: 'test',
      define: {
        __TEST__: true,
        __DEV__: false,
      },
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
