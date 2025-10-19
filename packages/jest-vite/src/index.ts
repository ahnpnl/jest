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

/**
 * Applies Vite's define configuration to replace global constants.
 * This demonstrates how the `define` option is used in Phase 1.
 *
 * @param code - Source code to transform
 * @param defines - Define configuration from Vite config
 * @returns Transformed code with constants replaced
 *
 * @example
 * ```typescript
 * const code = 'if (__DEV__) { console.log("dev mode"); }';
 * const result = applyDefines(code, { __DEV__: 'false' });
 * // Result: 'if (false) { console.log("dev mode"); }'
 * ```
 */
export function applyDefines(
  code: string,
  defines: Record<string, unknown>,
): string {
  let result = code;
  for (const [key, value] of Object.entries(defines)) {
    // Simple string replacement for demonstration
    // In Phase 2, this will use Vite's actual transformation
    const regex = new RegExp(`\\b${key}\\b`, 'g');
    result = result.replace(regex, JSON.stringify(value));
  }
  return result;
}

/**
 * Resolves a module path using Vite's alias configuration.
 * This demonstrates how the `resolve.alias` option is used in Phase 1.
 *
 * @param importPath - The import path to resolve
 * @param aliases - Alias configuration from Vite config
 * @returns Resolved path
 *
 * @example
 * ```typescript
 * const resolved = resolveAlias('@/utils', { '@': '/src' });
 * // Result: '/src/utils'
 * ```
 */
export function resolveAlias(
  importPath: string,
  aliases: Record<string, string | Array<string>>,
): string {
  for (const [alias, target] of Object.entries(aliases)) {
    if (importPath === alias || importPath.startsWith(`${alias}/`)) {
      const targetPath = Array.isArray(target) ? target[0] : target;
      return importPath.replace(alias, targetPath);
    }
  }
  return importPath;
}
