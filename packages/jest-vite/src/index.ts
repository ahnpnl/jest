/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {InlineConfig, ResolvedConfig, ViteDevServer} from 'vite';
import type {Config} from '@jest/types';

export type ViteServer = {
  close: () => Promise<void>;
  config: ResolvedConfig;
};

/**
 * Loads Vite module using vite-node for better ESM support
 */
async function loadViteModule(): Promise<typeof import('vite')> {
  try {
    // Vite is now a peer dependency, so we can import it directly
    // vite-node provides better ESM support for dynamic imports
    return await import('vite');
  } catch (error) {
    throw new Error(
      'Failed to load Vite. Please ensure "vite" is installed as a peer dependency.\n' +
        `Error: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Converts Jest's ViteConfig to Vite's InlineConfig format
 */
function convertToViteConfig(
  viteConfig: Config.ViteConfig,
  rootDir: string,
): InlineConfig {
  const config: InlineConfig = {
    define: viteConfig.define,
    mode: viteConfig.mode || 'test',
    root: rootDir,
    // Disable server-specific features for testing
    server: {
      hmr: false,
      watch: null,
    },
  };

  // Convert resolve configuration
  if (viteConfig.resolve) {
    config.resolve = {};

    if (viteConfig.resolve.alias) {
      // Convert Record<string, string | string[]> to Vite's alias format
      // Vite accepts both object and array formats
      config.resolve.alias = viteConfig.resolve.alias as Record<string, string>;
    }

    if (viteConfig.resolve.extensions) {
      config.resolve.extensions = viteConfig.resolve.extensions;
    }
  }

  return config;
}

/**
 * Creates a Vite dev server for Jest testing
 */
export async function createViteServer(
  viteConfig: Config.ViteConfig,
  rootDir: string,
): Promise<ViteServer | null> {
  try {
    const vite = await loadViteModule();

    // Convert Jest config to Vite's format (Phase 1: mode, define, resolve only)
    const config = convertToViteConfig(viteConfig, rootDir);

    const server: ViteDevServer = await vite.createServer(config);

    return {
      close: async () => {
        await server.close();
      },
      config: server.config,
    };
  } catch (error) {
    console.warn('Failed to create Vite server:', error);
    return null;
  }
}

/**
 * Checks if Vite integration is enabled in the config
 */
export function isViteEnabled(config: Config.ProjectConfig): boolean {
  return Boolean(
    (config as unknown as Config.InitialOptions).future?.experimental_vite,
  );
}

/**
 * Gets the Vite configuration from Jest config
 */
export function getViteConfig(
  config: Config.ProjectConfig,
): Config.ViteConfig | null {
  const viteOption = (config as unknown as Config.InitialOptions).future
    ?.experimental_vite;

  if (!viteOption) {
    return null;
  }

  // If it's just `true`, return an empty config object
  if (viteOption === true) {
    return {mode: 'test'};
  }

  return viteOption;
}
