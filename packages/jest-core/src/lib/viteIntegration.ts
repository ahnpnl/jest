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
    // Try to load tsx first using dynamic import with string to avoid compile-time dependency
    // @ts-expect-error - Dynamic import of optional peer dependency
    const tsxModule = await import(
      /* webpackIgnore: true */ 'tsx/cjs/api'
    ).catch(() => null);

    if (tsxModule) {
      const {require: tsxRequire} = tsxModule as {
        require: (id: string, path: string) => ViteModule;
      };
      // Use tsx to load Vite (supports TypeScript configs)
      const viteModule = tsxRequire('vite', __dirname);
      return viteModule;
    }

    // Fall back to regular require if tsx is not available

    return require('vite') as ViteModule;
  } catch {
    throw new Error(
      'Vite integration requires "vite" and "tsx" packages to be installed. ' +
        'Please install them with: npm install --save-dev vite tsx',
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

    // Merge user config with test defaults
    const config = {
      configFile: viteConfig.configFile,
      css: viteConfig.css,
      define: viteConfig.define,
      esbuild: viteConfig.esbuild,
      mode: viteConfig.mode || 'test',
      optimizeDeps: {
        ...viteConfig.optimizeDeps,
        // Disable during tests for faster startup
        disabled: true,
      },
      plugins: viteConfig.plugins,
      resolve: viteConfig.resolve,
      root: viteConfig.root || rootDir,
      // Disable server-specific features for testing
      server: {
        hmr: false,
        watch: null,
      },
      // Set up for SSR/testing mode
      ssr: {
        noExternal: true,
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
