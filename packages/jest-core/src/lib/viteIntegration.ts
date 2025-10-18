/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Config} from '@jest/types';

export type ViteServer = {
  close: () => Promise<void>;
  config: unknown;
};

// Type definition for Vite module (avoiding direct import for optional dependency)
type ViteModule = {
  createServer: (config: unknown) => Promise<{
    close: () => Promise<void>;
    config: unknown;
  }>;
};

/**
 * Loads Vite module using tsx for TypeScript support
 */
async function loadViteModule(): Promise<ViteModule> {
  try {
    // Load tsx for TypeScript config support
    const tsxModule = await import(
      /* @ts-expect-error - Dynamic import of optional peer dependency */
      /* webpackIgnore: true */ 'tsx/cjs/api'
    ).catch(() => null);

    if (!tsxModule) {
      throw new Error(
        'Vite integration requires "tsx" package to be installed. ' +
          'Please install it with: npm install --save-dev tsx',
      );
    }

    const {require: tsxRequire} = tsxModule as {
      require: (id: string, path: string) => ViteModule;
    };

    // Use tsx to load Vite (supports TypeScript configs)
    // Vite is ESM-only, so we need tsx to load it properly
    const viteModule = tsxRequire('vite', __dirname);
    return viteModule;
  } catch (error) {
    throw new Error(
      'Vite integration requires "vite" and "tsx" packages to be installed. ' +
        'Please install them with: npm install --save-dev vite tsx\n' +
        `Error: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
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

    // Merge user config with test defaults (Phase 1: mode, define, resolve only)
    const config = {
      define: viteConfig.define,
      mode: viteConfig.mode || 'test',
      resolve: viteConfig.resolve,
      root: rootDir,
      // Disable server-specific features for testing
      server: {
        hmr: false,
        watch: null,
      },
    };

    const server = await vite.createServer(config);

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
