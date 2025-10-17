/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Phase 1 Vite configuration options supported by Jest
 * Based on Vitest's testing-focused configuration approach
 */
export interface ViteConfig {
  /** Root directory for module resolution */
  root?: string;
  /** Server configuration for dependency handling */
  server?: {
    deps?: {
      /** Inline ESM dependencies that need transformation */
      inline?: string[];
      /** Externalize dependencies to avoid transformation */
      external?: string[];
      /** Fallback to CJS for legacy dependencies */
      fallbackCJS?: boolean;
    };
    fs?: {
      /** List of directories allowed for file system access */
      allow?: string[];
      /** Restrict file system access outside of workspace */
      strict?: boolean;
    };
  };
  /** Module resolution configuration (critical for testing) */
  resolve?: {
    /** Export conditions for module resolution */
    conditions?: string[];
    /** Path aliases for module resolution */
    alias?: Record<string, string>;
    /** File extensions to resolve */
    extensions?: string[];
    /** Package.json fields for resolution */
    mainFields?: string[];
  };
  /** Dependency optimization for better performance */
  optimizeDeps?: {
    /** Pre-bundle these dependencies */
    include?: string[];
    /** Exclude dependencies from bundling */
    exclude?: string[];
    /** esbuild configuration for optimization */
    esbuildOptions?: {
      target?: string;
      [key: string]: unknown;
    };
  };
  /** Base public path when serving assets */
  base?: string;
  /** Path to external vite.config.ts file */
  configFile?: string | false;
}

/**
 * Define Vite configuration for Jest testing with type safety
 * Supports Phase 1 options: server, resolve, optimizeDeps, root, base, configFile
 * 
 * @example
 * ```typescript
 * import {defineConfig} from 'jest';
 * import {defineViteConfig} from 'jest-config';
 * 
 * export default defineConfig({
 *   future: {
 *     experimental_vite: defineViteConfig({
 *       root: process.cwd(),
 *       server: {
 *         deps: {
 *           inline: ['my-esm-package'],
 *         },
 *       },
 *       resolve: {
 *         alias: {
 *           '@': './src',
 *         },
 *       },
 *     }),
 *   },
 * });
 * ```
 */
export function defineViteConfig(config: ViteConfig = {}): ViteConfig {
  // Merge user config with sensible defaults
  return {
    root: config.root ?? process.cwd(),
    server: {
      deps: {
        inline: config.server?.deps?.inline ?? [],
        external: config.server?.deps?.external,
        fallbackCJS: config.server?.deps?.fallbackCJS ?? true,
      },
      fs: {
        allow: config.server?.fs?.allow,
        strict: config.server?.fs?.strict ?? false,
      },
    },
    resolve: {
      conditions:
        config.resolve?.conditions ?? ['node', 'default', 'development'],
      alias: config.resolve?.alias,
      extensions:
        config.resolve?.extensions ??
        ['.mts', '.cts', '.ts', '.tsx', '.js', '.jsx', '.json'],
      mainFields:
        config.resolve?.mainFields ?? ['module', 'jsnext:main', 'jsnext'],
    },
    optimizeDeps: {
      include: config.optimizeDeps?.include ?? [],
      exclude: config.optimizeDeps?.exclude ?? [],
      esbuildOptions: {
        target: config.optimizeDeps?.esbuildOptions?.target ?? 'es2020',
        ...config.optimizeDeps?.esbuildOptions,
      },
    },
    base: config.base,
    configFile: config.configFile,
  };
}

/**
 * @deprecated Use defineViteConfig() instead
 * Default Vite configuration for Jest testing (Phase 1)
 * Based on Vitest's testing-focused configuration approach
 */
export function getDefaultViteConfig(): ViteConfig {
  return defineViteConfig();
}
