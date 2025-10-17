/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import ViteDevServerManager, {
  getViteWatchModeConfig,
} from '../ViteDevServerManager';
import type {Config} from '@jest/types';

describe('ViteDevServerManager', () => {
  describe('getViteWatchModeConfig', () => {
    it('returns disabled config when vite is not configured', () => {
      const jestConfig = {} as Config.ProjectConfig;
      const result = getViteWatchModeConfig(jestConfig);

      expect(result.enabled).toBe(false);
    });

    it('returns enabled config when future.experimental_vite is set', () => {
      const jestConfig = {
        future: {
          experimental_vite: {},
        },
      } as any;
      const result = getViteWatchModeConfig(jestConfig);

      expect(result.enabled).toBe(true);
    });

    it('extracts vite configuration options', () => {
      const jestConfig = {
        future: {
          experimental_vite: {
            base: '/app',
            port: 3000,
            resolve: {
              conditions: ['node', 'default'],
            },
          },
        },
      } as any;
      const result = getViteWatchModeConfig(jestConfig);

      expect(result.enabled).toBe(true);
      expect(result.config.port).toBe(3000);
      expect(result.config.base).toBe('/app');
      expect(result.config.resolve).toEqual({conditions: ['node', 'default']});
    });

    it('passes entire config object to Vite', () => {
      const jestConfig = {
        future: {
          experimental_vite: {
            root: '/custom/root',
            server: {
              port: 8080,
              strictPort: true,
            },
          },
        },
      } as any;
      const result = getViteWatchModeConfig(jestConfig);

      expect(result.enabled).toBe(true);
      expect(result.config.root).toBe('/custom/root');
      expect(result.config.server).toEqual({port: 8080, strictPort: true});
    });

    it('returns disabled when future.experimental_vite is not an object', () => {
      const jestConfig = {
        future: {
          experimental_vite: 'invalid',
        },
      } as any;
      const result = getViteWatchModeConfig(jestConfig);

      expect(result.enabled).toBe(false);
    });

    it('returns disabled when future is not set', () => {
      const jestConfig = {} as any;
      const result = getViteWatchModeConfig(jestConfig);

      expect(result.enabled).toBe(false);
    });
  });

  describe('ViteDevServerManager instance', () => {
    it('creates an instance with disabled config', () => {
      const manager = new ViteDevServerManager({}, '/test/project', false);

      expect(manager.isRunning()).toBe(false);
    });

    it('does not start server when disabled', async () => {
      const manager = new ViteDevServerManager({}, '/test/project', false);

      await manager.start();
      expect(manager.isRunning()).toBe(false);
    });

    it('gracefully handles missing vite dependency', async () => {
      const manager = new ViteDevServerManager({}, '/test/project', true);

      // Should not throw even if Vite is not installed
      await expect(manager.start()).resolves.toBeUndefined();
    });

    it('can be stopped safely when not running', async () => {
      const manager = new ViteDevServerManager({}, '/test/project', false);

      await expect(manager.stop()).resolves.toBeUndefined();
    });

    it('invalidateModule does not throw when server is not running', () => {
      const manager = new ViteDevServerManager({}, '/test/project', false);

      expect(() => manager.invalidateModule('/test/file.ts')).not.toThrow();
    });

    it('getModuleGraph returns undefined when server is not running', () => {
      const manager = new ViteDevServerManager({}, '/test/project', false);

      expect(manager.getModuleGraph()).toBeUndefined();
    });

    it('transformFile returns null when server is not running', async () => {
      const manager = new ViteDevServerManager({}, '/test/project', false);

      const result = await manager.transformFile('/test/file.ts');
      expect(result).toBeNull();
    });

    it('getAffectedTests returns all tests when server is not running', async () => {
      const manager = new ViteDevServerManager({}, '/test/project', false);

      const allTests = ['/test/a.test.ts', '/test/b.test.ts'];
      const result = await manager.getAffectedTests('/src/module.ts', allTests);
      expect(result).toEqual(allTests);
    });

    it('getModuleDependencies returns empty set when server is not running', async () => {
      const manager = new ViteDevServerManager({}, '/test/project', false);

      const result = await manager.getModuleDependencies('/test/file.ts');
      expect(result).toEqual(new Set());
    });

    it('clearCaches does not throw', () => {
      const manager = new ViteDevServerManager({}, '/test/project', false);

      expect(() => manager.clearCaches()).not.toThrow();
    });

    it('setupHMR does not throw when server is not running', () => {
      const manager = new ViteDevServerManager({}, '/test/project', false);

      expect(() => manager.setupHMR()).not.toThrow();
    });
  });
});
