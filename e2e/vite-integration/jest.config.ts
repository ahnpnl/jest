/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-config-loader esbuild-register
 */

import type {Config} from 'jest';

const config: Config = {
  displayName: 'vite-integration-e2e',
  testEnvironment: 'node',
  // Enable Vite integration for e2e testing
  // @ts-expect-error - experimental_vite is not yet in the official types
  future: {
    experimental_vite: {
      // Phase 1: Essential Vite configuration options
      // Users can pass any Vite config options they need
      
      // Server configuration
      server: {
        port: 5173,
        strictPort: false,
      },
      
      // Resolve configuration - critical for module resolution
      resolve: {
        conditions: ['node', 'default'],
      },
    },
  },
};

export default config;
