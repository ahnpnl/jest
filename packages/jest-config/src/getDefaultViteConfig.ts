/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Default Vite configuration for Jest testing (Phase 1)
 * Based on Vitest's testing-focused configuration approach
 */
export function getDefaultViteConfig() {
  return {
    // Root directory for module resolution
    root: process.cwd(),

    // Server configuration for dependency handling
    server: {
      deps: {
        // Inline dependencies that need transformation (empty by default)
        inline: [] as string[],
        // Fallback to CJS for legacy dependencies
        fallbackCJS: true,
      },
      fs: {
        // File system access configuration
        strict: false,
      },
    },

    // Module resolution (critical for testing)
    resolve: {
      // Export conditions for Node.js testing environment
      conditions: ['node', 'default', 'development'],
      // File extensions to resolve
      extensions: ['.mts', '.cts', '.ts', '.tsx', '.js', '.jsx', '.json'],
      // Package.json fields for resolution
      mainFields: ['module', 'jsnext:main', 'jsnext'],
    },

    // Dependency optimization for better performance
    optimizeDeps: {
      // Pre-bundle these dependencies (empty by default, users can add as needed)
      include: [] as string[],
      // Exclude from bundling
      exclude: [] as string[],
      // esbuild configuration for optimization
      esbuildOptions: {
        target: 'es2020',
      },
    },
  };
}

export type DefaultViteConfig = ReturnType<typeof getDefaultViteConfig>;
