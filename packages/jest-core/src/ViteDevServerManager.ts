/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Config} from '@jest/types';
import type {ViteDevServer, UserConfig as ViteUserConfig} from 'vite';

/**
 * Configuration options for the Vite dev server
 * These options are passed directly to Vite's createServer API
 */
export type ViteWatchModeConfig = Record<string, unknown>;

/**
 * Vite module type (loaded dynamically)
 */
type ViteModule = typeof import('vite');

/**
 * Vite module with undefined if not installed
 */
type ViteModuleOrUndefined = ViteModule | undefined;

/**
 * Manages the Vite dev server lifecycle for Jest (both watch and non-watch modes).
 * This class handles starting, stopping, and integrating with Vite's
 * module graph and transform pipeline to improve test performance.
 *
 * Inspired by Angular CLI's Vite integration approach.
 *
 * Design principle: Callers decide which methods to call based on their needs
 * (no boolean flags in constructor per Uncle Bob's clean code principles)
 */
export default class ViteDevServerManager {
  private viteDevServer: ViteDevServer | undefined;
  private config: ViteWatchModeConfig;
  private projectRoot: string;
  private moduleGraphCache = new Map<string, Set<string>>();
  private transformCache = new Map<string, string>();

  constructor(config: ViteWatchModeConfig, projectRoot: string) {
    this.config = config;
    this.projectRoot = projectRoot;
  }

  /**
   * Starts the Vite dev server
   * Works in both watch mode and non-watch mode
   * Call setupHMR() after start() if you want HMR (typically for watch mode)
   */
  async start(): Promise<void> {
    try {
      // Dynamically import Vite only when needed (optional peer dependency)
      const vite = await this.loadVite();
      if (!vite) {
        console.warn(
          'Vite is not installed. Install it to use Vite dev server: npm install --save-dev vite',
        );
        return;
      }

      const viteConfig = await this.createViteConfig(vite);
      this.viteDevServer = await vite.createServer(viteConfig);
      await this.viteDevServer.listen();

      // eslint-disable-next-line no-console
      console.log(
        `Vite dev server started at http://localhost:${this.viteDevServer.config.server.port}`,
      );
      // eslint-disable-next-line no-console
      console.log(
        'Vite features enabled: transform pipeline, module graph tracking',
      );
    } catch (error) {
      console.error(
        'Failed to start Vite dev server:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      // Don't throw - allow Jest to continue without Vite
    }
  }

  /**
   * Stops the Vite dev server
   */
  async stop(): Promise<void> {
    if (this.viteDevServer) {
      try {
        await this.viteDevServer.close();
        this.clearCaches();
        // eslint-disable-next-line no-console
        console.log('Vite dev server stopped');
      } catch (error) {
        console.error(
          'Failed to stop Vite dev server:',
          error instanceof Error ? error.message : 'Unknown error',
        );
      }
      this.viteDevServer = undefined;
    }
  }

  /**
   * Invalidates a module in Vite's module graph
   * @param filePath - The file path to invalidate
   */
  invalidateModule(filePath: string): void {
    if (!this.viteDevServer) {
      return;
    }

    try {
      const module = this.viteDevServer.moduleGraph.getModuleById(filePath);
      if (module) {
        this.viteDevServer.moduleGraph.invalidateModule(module);

        // Clear transform cache for this module
        this.transformCache.delete(filePath);

        // Clear module graph cache entries that include this file
        for (const [key, deps] of this.moduleGraphCache.entries()) {
          if (deps.has(filePath)) {
            this.moduleGraphCache.delete(key);
          }
        }
      }
    } catch (error) {
      console.error(
        'Failed to invalidate module:',
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  /**
   * Transforms a file using Vite's transform pipeline
   * @param filePath - The file path to transform
   * @returns The transformed code or undefined if transformation fails
   */
  async transformFile(filePath: string): Promise<string | undefined> {
    if (!this.viteDevServer) {
      return undefined;
    }

    // Check cache first
    const cached = this.transformCache.get(filePath);
    if (cached) {
      return cached;
    }

    try {
      const result = await this.viteDevServer.transformRequest(filePath);
      if (result?.code) {
        this.transformCache.set(filePath, result.code);
        return result.code;
      }
    } catch (error) {
      console.error(
        `Failed to transform ${filePath}:`,
        error instanceof Error ? error.message : 'Unknown error',
      );
    }

    return undefined;
  }

  /**
   * Gets all test files that depend on the changed file
   * Uses Vite's module graph for smart test selection
   * @param changedFile - The file that changed
   * @param allTestPaths - All available test paths
   * @returns Array of test paths that should be run
   */
  async getAffectedTests(
    changedFile: string,
    allTestPaths: Array<string>,
  ): Promise<Array<string>> {
    if (!this.viteDevServer || allTestPaths.length === 0) {
      return allTestPaths;
    }

    try {
      const affectedTests = new Set<string>();
      const moduleGraph = this.viteDevServer.moduleGraph;
      const changedModule = moduleGraph.getModuleById(changedFile);

      if (!changedModule) {
        return allTestPaths;
      }

      // Get all importers of the changed module (reverse dependency graph)
      const getImporters = (
        module: any,
        visited = new Set<any>(),
      ): void => {
        if (visited.has(module)) {
          return;
        }
        visited.add(module);

        for (const importer of module.importers || []) {
          if (importer.file && allTestPaths.includes(importer.file)) {
            affectedTests.add(importer.file);
          }
          getImporters(importer, visited);
        }
      };

      getImporters(changedModule);

      // If the changed file itself is a test, include it
      if (allTestPaths.includes(changedFile)) {
        affectedTests.add(changedFile);
      }

      // If no specific tests are affected, run all tests
      // This happens when a file changes that no test imports yet
      if (affectedTests.size === 0) {
        return allTestPaths;
      }

      return [...affectedTests];
    } catch (error) {
      console.error(
        'Failed to determine affected tests:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      return allTestPaths;
    }
  }

  /**
   * Sets up HMR (Hot Module Replacement) handlers
   * Call this after start() if you want HMR (typically for watch mode)
   * This allows for faster test re-runs without full reloads
   */
  setupHMR(): void {
    if (!this.viteDevServer) {
      return;
    }

    try {
      // Listen to HMR events
      if (this.viteDevServer.ws) {
        this.viteDevServer.ws.on('connection', () => {
          // Connection established
        });
      }

      // Handle module updates
      if (this.viteDevServer.moduleGraph) {
        const originalOnFileChange =
          this.viteDevServer.moduleGraph.onFileChange;
        this.viteDevServer.moduleGraph.onFileChange = (file: string) => {
          this.invalidateModule(file);
          if (originalOnFileChange) {
            originalOnFileChange.call(this.viteDevServer!.moduleGraph, file);
          }
        };
      }

      // eslint-disable-next-line no-console
      console.log('Vite HMR enabled for faster test re-runs');
    } catch (error) {
      console.error(
        'Failed to setup HMR:',
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  /**
   * Gets module dependencies from the module graph
   * @param filePath - The file path to get dependencies for
   * @returns Set of file paths that this file depends on
   */
  async getModuleDependencies(filePath: string): Promise<Set<string>> {
    if (!this.viteDevServer) {
      return new Set();
    }

    // Check cache first
    const cached = this.moduleGraphCache.get(filePath);
    if (cached) {
      return cached;
    }

    const dependencies = new Set<string>();

    try {
      const moduleGraph = this.viteDevServer.moduleGraph;
      const module = moduleGraph.getModuleById(filePath);

      if (module) {
        const collectDeps = (mod: any, visited = new Set<any>()): void => {
          if (visited.has(mod)) {
            return;
          }
          visited.add(mod);

          for (const imported of mod.importedModules || []) {
            if (imported.file) {
              dependencies.add(imported.file);
              collectDeps(imported, visited);
            }
          }
        };

        collectDeps(module);
      }

      this.moduleGraphCache.set(filePath, dependencies);
    } catch (error) {
      console.error(
        `Failed to get dependencies for ${filePath}:`,
        error instanceof Error ? error.message : 'Unknown error',
      );
    }

    return dependencies;
  }

  /**
   * Clears all caches (transform cache and module graph cache)
   */
  clearCaches(): void {
    this.transformCache.clear();
    this.moduleGraphCache.clear();
  }

  /**
   * Gets the Vite module graph for dependency tracking
   */
  getModuleGraph() {
    return this.viteDevServer?.moduleGraph;
  }

  /**
   * Checks if the dev server is running
   */
  isRunning(): boolean {
    return this.viteDevServer !== undefined;
  }

  /**
   * Dynamically loads Vite module
   * Returns undefined if Vite is not installed
   */
  private async loadVite(): Promise<ViteModuleOrUndefined> {
    try {
      // Vite is an ESM module, so we need to use dynamic import
      // This requires Jest to be configured with ESM support
      // @ts-expect-error - Vite is an optional peer dependency
      const viteModule: ViteModule = await import('vite');
      return viteModule;
    } catch {
      return undefined;
    }
  }

  /**
   * Creates Vite configuration optimized for Jest
   * Merges user-provided config with sensible defaults
   */
  private async createViteConfig(vite: ViteModule): Promise<ViteUserConfig> {
    const baseConfig: ViteUserConfig = {
      // Optimize for testing
      optimizeDeps: {
        disabled: false,
      },
      // Allow configuring resolve to match Jest's module resolution
      resolve: {
        conditions: ['node', 'default'],
      },
      root: this.projectRoot,
      server: {
        hmr: true, // Enable Hot Module Replacement
        port: 5173,
        strictPort: false, // Allow fallback to another port
      },
    };

    // Merge user config from Jest config with base config
    // User config takes precedence over base config
    return vite.mergeConfig(baseConfig, this.config as ViteUserConfig);
  }
}

/**
 * Resolves Vite configuration from Jest config
 * This is a standalone function that can be reused in both watch and non-watch modes
 * 
 * @param configOrViteConfig - Either a Jest ProjectConfig or a direct Vite config
 * @returns The Vite configuration object
 */
export function resolveViteConfig(
  configOrViteConfig: Config.ProjectConfig | ViteWatchModeConfig | undefined,
): ViteWatchModeConfig {
  if (!configOrViteConfig) {
    return {};
  }

  // Check if it's a direct Vite config (passed from runJest)
  // vs a full Jest ProjectConfig (passed from watch.ts)
  const isJestConfig = 'rootDir' in configOrViteConfig;

  if (isJestConfig) {
    // It's a Jest ProjectConfig, extract from future.experimental_vite
    const jestConfig = configOrViteConfig as Config.ProjectConfig;
    const futureConfig = (jestConfig as any).future;
    const viteConfig = futureConfig?.experimental_vite;

    if (!viteConfig || typeof viteConfig !== 'object') {
      return {};
    }

    return viteConfig as ViteWatchModeConfig;
  } else {
    // It's a direct Vite config object
    return configOrViteConfig as ViteWatchModeConfig;
  }
}

/**
 * Checks if Vite integration is enabled in the config
 * 
 * @param configOrViteConfig - Either a Jest ProjectConfig or a direct Vite config
 * @returns true if Vite integration is enabled
 */
export function isViteEnabled(
  configOrViteConfig: Config.ProjectConfig | ViteWatchModeConfig | undefined,
): boolean {
  const viteConfig = resolveViteConfig(configOrViteConfig);
  return Object.keys(viteConfig).length > 0;
}
