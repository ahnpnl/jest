/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Config} from '@jest/types';

/**
 * Configuration options for the Vite dev server in watch mode
 * These options are passed directly to Vite's createServer API
 */
export type ViteWatchModeConfig = Record<string, any>;

/**
 * Manages the Vite dev server lifecycle for Jest watch mode.
 * This class handles starting, stopping, and integrating with Vite's
 * module graph and transform pipeline to improve watch mode performance.
 *
 * Inspired by Angular CLI's Vite integration approach.
 */
export default class ViteDevServerManager {
  private viteDevServer: any = null;
  private config: ViteWatchModeConfig;
  private projectRoot: string;
  private moduleGraphCache = new Map<string, Set<string>>();
  private transformCache = new Map<string, string>();
  private enabled: boolean;

  constructor(
    config: ViteWatchModeConfig,
    projectRoot: string,
    enabled: boolean,
  ) {
    this.config = config;
    this.projectRoot = projectRoot;
    this.enabled = enabled;
  }

  /**
   * Starts the Vite dev server for watch mode
   */
  async start(): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      // Dynamically import Vite only when needed (optional peer dependency)
      const vite = await this.loadVite();
      if (!vite) {
        console.warn(
          'Vite is not installed. Install it to use Vite dev server in watch mode: npm install --save-dev vite',
        );
        return;
      }

      const viteConfig = await this.createViteConfig();
      this.viteDevServer = await vite.createServer(viteConfig);
      await this.viteDevServer.listen();

      // Setup HMR (enabled by default)
      this.setupHMR();

      // eslint-disable-next-line no-console
      console.log(
        `Vite dev server started at http://localhost:${
          this.viteDevServer.config.server.port
        }`,
      );
      // eslint-disable-next-line no-console
      console.log('Vite features enabled: transform pipeline, smart test selection, HMR');
    } catch (error: any) {
      console.error('Failed to start Vite dev server:', error.message);
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
      } catch (error: any) {
        console.error('Failed to stop Vite dev server:', error.message);
      }
      this.viteDevServer = null;
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
    } catch (error: any) {
      console.error('Failed to invalidate module:', error.message);
    }
  }

  /**
   * Transforms a file using Vite's transform pipeline
   * @param filePath - The file path to transform
   * @returns The transformed code or null if transformation fails
   */
  async transformFile(filePath: string): Promise<string | null> {
    if (!this.viteDevServer) {
      return null;
    }

    // Check cache first
    if (this.transformCache.has(filePath)) {
      return this.transformCache.get(filePath)!;
    }

    try {
      const result = await this.viteDevServer.transformRequest(filePath);
      if (result?.code) {
        this.transformCache.set(filePath, result.code);
        return result.code;
      }
    } catch (error: any) {
      console.error(`Failed to transform ${filePath}:`, error.message);
    }

    return null;
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
      const getImporters = (module: any, visited = new Set<any>()): void => {
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
    } catch (error: any) {
      console.error('Failed to determine affected tests:', error.message);
      return allTestPaths;
    }
  }

  /**
   * Sets up HMR (Hot Module Replacement) handlers
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
            originalOnFileChange.call(this.viteDevServer.moduleGraph, file);
          }
        };
      }
    } catch (error: any) {
      console.error('Failed to setup HMR:', error.message);
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
    if (this.moduleGraphCache.has(filePath)) {
      return this.moduleGraphCache.get(filePath)!;
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
    } catch (error: any) {
      console.error(
        `Failed to get dependencies for ${filePath}:`,
        error.message,
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
  getModuleGraph(): any {
    return this.viteDevServer?.moduleGraph;
  }

  /**
   * Checks if the dev server is running
   */
  isRunning(): boolean {
    return this.viteDevServer !== null;
  }

  /**
   * Dynamically loads Vite module
   */
  private async loadVite(): Promise<any> {
    try {
      // Vite is an ESM module, so we need to use dynamic import
      // This requires Jest to be configured with ESM support
      // @ts-expect-error - Vite is an optional peer dependency
      const viteModule = await import('vite');
      return viteModule;
    } catch {
      return null;
    }
  }

  /**
   * Creates Vite configuration optimized for Jest watch mode
   */
  /**
   * Creates Vite configuration optimized for Jest watch mode
   * Merges user-provided config with sensible defaults
   */
  private async createViteConfig(): Promise<any> {
    const vite = await this.loadVite();
    
    const baseConfig: any = {
      // Optimize for watch mode
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
    return vite.mergeConfig(baseConfig, this.config);
  }
}

/**
 * Helper to extract Vite watch mode config from Jest config
 */
/**
 * Helper to extract Vite watch mode config from Jest config
 * The experimental_vite object can contain any Vite configuration options
 * that will be passed directly to Vite's createServer API
 */
export function getViteWatchModeConfig(jestConfig: Config.ProjectConfig): {
  config: ViteWatchModeConfig;
  enabled: boolean;
} {
  // Check for future.experimental_vite configuration in Jest config
  const futureConfig = (jestConfig as any).future;
  const viteConfig = futureConfig?.experimental_vite;

  if (!viteConfig || typeof viteConfig !== 'object') {
    return {config: {}, enabled: false};
  }

  // Pass the entire viteConfig object to Vite
  // This allows users to configure any Vite option they need
  return {
    config: viteConfig,
    enabled: true,
  };
}
