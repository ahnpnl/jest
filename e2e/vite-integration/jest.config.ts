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
      // Phase 1: Essential Vite configuration options (inspired by Vitest)
      
      // Root directory for module resolution
      root: process.cwd(),
      
      // Server configuration for dependency handling
      server: {
        deps: {
          // Inline dependencies that need transformation
          inline: [],
          // Fallback to CJS for legacy dependencies
          fallbackCJS: true,
        },
        fs: {
          // Allow file system access
          strict: false,
        },
      },
      
      // Module resolution configuration
      resolve: {
        // Export conditions for Node.js testing environment
        conditions: ['node', 'default', 'development'],
        // File extensions to resolve
        extensions: ['.mts', '.cts', '.ts', '.tsx', '.js', '.jsx', '.json'],
      },
      
      // Dependency optimization for better performance
      optimizeDeps: {
        include: [],
        exclude: [],
      },
    },
  },
};

export default config;
