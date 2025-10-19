/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Config} from '@jest/types';
import {
  type ViteServer,
  createViteServer,
  getViteConfig,
  isViteEnabled,
} from '@jest/vite';

/**
 * Initializes Vite integration if enabled in the Jest configuration.
 * This function is called during Jest's initialization phase.
 *
 * @param config - Jest project configuration
 * @param rootDir - Root directory of the project
 * @returns ViteServer instance if Vite is enabled, null otherwise
 *
 * @example
 * ```typescript
 * const viteServer = await initializeViteIntegration(config, rootDir);
 * if (viteServer) {
 *   // Vite server is running and can be used for transformations
 *   // ... run tests
 *   await viteServer.close();
 * }
 * ```
 */
export async function initializeViteIntegration(
  config: Config.ProjectConfig,
  rootDir: string,
): Promise<ViteServer | null> {
  if (!isViteEnabled(config)) {
    return null;
  }

  const viteConfig = getViteConfig(config);
  if (!viteConfig) {
    return null;
  }

  try {
    const server = await createViteServer(viteConfig, rootDir);
    if (server) {
      console.warn('[Jest Vite] Vite server initialized for testing');
    }
    return server;
  } catch (error) {
    console.warn('[Jest Vite] Failed to initialize Vite server:', error);
    return null;
  }
}

/**
 * Checks if Vite integration is enabled for the given configuration.
 * This is a convenience re-export from @jest/vite.
 */
export {isViteEnabled} from '@jest/vite';
