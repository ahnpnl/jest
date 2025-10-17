/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Config} from '@jest/types';

/**
 * Configuration options for the Vite dev server in watch mode
 */
export type ViteWatchModeConfig = {
  /** Enable Vite dev server in watch mode */
  enabled: boolean;
  /** Vite config file path */
  configFile?: string;
  /** Vite server port */
  port?: number;
  /** Additional Vite configuration */
  viteConfig?: Record<string, any>;
};

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

  constructor(config: ViteWatchModeConfig, projectRoot: string) {
    this.config = config;
    this.projectRoot = projectRoot;
  }

  /**
   * Starts the Vite dev server for watch mode
   */
  async start(): Promise<void> {
    if (!this.config.enabled) {
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

      // eslint-disable-next-line no-console
      console.log(
        `Vite dev server started at http://localhost:${
          this.viteDevServer.config.server.port
        }`,
      );
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
      }
    } catch (error: any) {
      console.error('Failed to invalidate module:', error.message);
    }
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
      // Try to require/import vite dynamically, but don't fail if it's not available
      // Using dynamic require to avoid TypeScript compilation errors with optional peer deps

      return require('vite');
    } catch {
      return null;
    }
  }

  /**
   * Creates Vite configuration optimized for Jest watch mode
   */
  private async createViteConfig(): Promise<any> {
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
        port: this.config.port || 5173,
        strictPort: false, // Allow fallback to another port
      },
    };

    // Load custom Vite config if specified
    if (this.config.configFile) {
      try {
        const vite = await this.loadVite();
        const userConfig = await vite.loadConfigFromFile(
          {command: 'serve', mode: 'development'},
          this.config.configFile,
          this.projectRoot,
        );
        if (userConfig?.config) {
          // Merge user config with base config
          return vite.mergeConfig(baseConfig, userConfig.config);
        }
      } catch (error: any) {
        console.warn(
          `Failed to load Vite config from ${this.config.configFile}:`,
          error.message,
        );
      }
    }

    // Merge with additional config from Jest config
    if (this.config.viteConfig) {
      return {...baseConfig, ...this.config.viteConfig};
    }

    return baseConfig;
  }
}

/**
 * Helper to extract Vite watch mode config from Jest config
 */
export function getViteWatchModeConfig(
  jestConfig: Config.ProjectConfig,
): ViteWatchModeConfig {
  // Check for vite configuration in Jest config
  const viteConfig = (jestConfig as any).vite;

  if (!viteConfig || typeof viteConfig !== 'object') {
    return {enabled: false};
  }

  return {
    configFile: viteConfig.configFile,
    enabled: viteConfig.enabled === true,
    port: viteConfig.port,
    viteConfig: viteConfig.config,
  };
}
