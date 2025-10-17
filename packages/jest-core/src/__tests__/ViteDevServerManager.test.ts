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
      const config = getViteWatchModeConfig(jestConfig);

      expect(config.enabled).toBe(false);
    });

    it('returns enabled config when vite.enabled is true', () => {
      const jestConfig = {
        vite: {
          enabled: true,
        },
      } as any;
      const config = getViteWatchModeConfig(jestConfig);

      expect(config.enabled).toBe(true);
    });

    it('extracts vite configuration options', () => {
      const jestConfig = {
        vite: {
          config: {
            base: '/app',
          },
          configFile: './vite.config.ts',
          enabled: true,
          port: 3000,
        },
      } as any;
      const config = getViteWatchModeConfig(jestConfig);

      expect(config.enabled).toBe(true);
      expect(config.configFile).toBe('./vite.config.ts');
      expect(config.port).toBe(3000);
      expect(config.viteConfig).toEqual({base: '/app'});
    });

    it('extracts new enhancement options', () => {
      const jestConfig = {
        vite: {
          enableHMR: true,
          enabled: true,
          smartTestSelection: true,
          useTransformPipeline: true,
        },
      } as any;
      const config = getViteWatchModeConfig(jestConfig);

      expect(config.enabled).toBe(true);
      expect(config.useTransformPipeline).toBe(true);
      expect(config.smartTestSelection).toBe(true);
      expect(config.enableHMR).toBe(true);
    });

    it('returns disabled when vite config is not an object', () => {
      const jestConfig = {
        vite: 'invalid',
      } as any;
      const config = getViteWatchModeConfig(jestConfig);

      expect(config.enabled).toBe(false);
    });
  });

  describe('ViteDevServerManager instance', () => {
    it('creates an instance with disabled config', () => {
      const manager = new ViteDevServerManager(
        {enabled: false},
        '/test/project',
      );

      expect(manager.isRunning()).toBe(false);
    });

    it('does not start server when disabled', async () => {
      const manager = new ViteDevServerManager(
        {enabled: false},
        '/test/project',
      );

      await manager.start();
      expect(manager.isRunning()).toBe(false);
    });

    it('gracefully handles missing vite dependency', async () => {
      const manager = new ViteDevServerManager(
        {enabled: true},
        '/test/project',
      );

      // Should not throw even if Vite is not installed
      await expect(manager.start()).resolves.toBeUndefined();
    });

    it('can be stopped safely when not running', async () => {
      const manager = new ViteDevServerManager(
        {enabled: false},
        '/test/project',
      );

      await expect(manager.stop()).resolves.toBeUndefined();
    });

    it('invalidateModule does not throw when server is not running', () => {
      const manager = new ViteDevServerManager(
        {enabled: false},
        '/test/project',
      );

      expect(() => manager.invalidateModule('/test/file.ts')).not.toThrow();
    });

    it('getModuleGraph returns undefined when server is not running', () => {
      const manager = new ViteDevServerManager(
        {enabled: false},
        '/test/project',
      );

      expect(manager.getModuleGraph()).toBeUndefined();
    });

    it('transformFile returns null when server is not running', async () => {
      const manager = new ViteDevServerManager(
        {enabled: false},
        '/test/project',
      );

      const result = await manager.transformFile('/test/file.ts');
      expect(result).toBeNull();
    });

    it('transformFile returns null when useTransformPipeline is false', async () => {
      const manager = new ViteDevServerManager(
        {enabled: true, useTransformPipeline: false},
        '/test/project',
      );

      const result = await manager.transformFile('/test/file.ts');
      expect(result).toBeNull();
    });

    it('getAffectedTests returns all tests when server is not running', async () => {
      const manager = new ViteDevServerManager(
        {enabled: false},
        '/test/project',
      );

      const allTests = ['/test/a.test.ts', '/test/b.test.ts'];
      const result = await manager.getAffectedTests('/src/module.ts', allTests);
      expect(result).toEqual(allTests);
    });

    it('getAffectedTests returns all tests when smartTestSelection is false', async () => {
      const manager = new ViteDevServerManager(
        {enabled: true, smartTestSelection: false},
        '/test/project',
      );

      const allTests = ['/test/a.test.ts', '/test/b.test.ts'];
      const result = await manager.getAffectedTests('/src/module.ts', allTests);
      expect(result).toEqual(allTests);
    });

    it('getModuleDependencies returns empty set when server is not running', async () => {
      const manager = new ViteDevServerManager(
        {enabled: false},
        '/test/project',
      );

      const result = await manager.getModuleDependencies('/test/file.ts');
      expect(result).toEqual(new Set());
    });

    it('clearCaches does not throw', () => {
      const manager = new ViteDevServerManager(
        {enabled: false},
        '/test/project',
      );

      expect(() => manager.clearCaches()).not.toThrow();
    });

    it('setupHMR does not throw when server is not running', () => {
      const manager = new ViteDevServerManager(
        {enabled: false},
        '/test/project',
      );

      expect(() => manager.setupHMR()).not.toThrow();
    });
  });
});
