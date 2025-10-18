/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Config} from '@jest/types';

/**
 * Helper function to create a Vite configuration object for Jest.
 * This function provides type safety and defaults for Vite integration.
 *
 * @param viteConfig - Vite configuration options
 * @returns A ViteConfig object that can be used with Jest's future.experimental_vite option
 *
 * @example
 * ```typescript
 * import {defineConfig} from 'jest';
 * import {withViteConfig} from 'jest-config';
 *
 * export default defineConfig({
 *   future: {
 *     experimental_vite: withViteConfig({
 *       configFile: './vite.config.ts',
 *       mode: 'test',
 *     }),
 *   },
 * });
 * ```
 */
export function withViteConfig(
  viteConfig?: Config.ViteConfig,
): Config.ViteConfig {
  return {
    mode: 'test',
    ...viteConfig,
  };
}
