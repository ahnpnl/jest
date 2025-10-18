/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Config} from '@jest/types';
import {makeProjectConfig} from '@jest/test-utils';
import {getViteConfig, isViteEnabled} from '../viteIntegration';

describe('viteIntegration', () => {
  describe('isViteEnabled', () => {
    it('should return false when vite is not configured', () => {
      const config = makeProjectConfig();
      expect(isViteEnabled(config)).toBe(false);
    });

    it('should return true when vite is enabled with boolean', () => {
      const config = makeProjectConfig() as Config.ProjectConfig & {
        future?: {experimental_vite?: boolean};
      };
      (config as unknown as Config.InitialOptions).future = {
        experimental_vite: true,
      };
      expect(isViteEnabled(config)).toBe(true);
    });

    it('should return true when vite is configured with object', () => {
      const config = makeProjectConfig() as Config.ProjectConfig & {
        future?: {experimental_vite?: Config.ViteConfig};
      };
      (config as unknown as Config.InitialOptions).future = {
        experimental_vite: {mode: 'test'},
      };
      expect(isViteEnabled(config)).toBe(true);
    });
  });

  describe('getViteConfig', () => {
    it('should return null when vite is not configured', () => {
      const config = makeProjectConfig();
      expect(getViteConfig(config)).toBeNull();
    });

    it('should return default config when vite is enabled with boolean true', () => {
      const config = makeProjectConfig() as Config.ProjectConfig & {
        future?: {experimental_vite?: boolean};
      };
      (config as unknown as Config.InitialOptions).future = {
        experimental_vite: true,
      };
      expect(getViteConfig(config)).toStrictEqual({mode: 'test'});
    });

    it('should return the vite config when provided', () => {
      const viteConfig: Config.ViteConfig = {
        define: {
          __DEV__: true,
        },
        mode: 'development',
        resolve: {
          alias: {
            '@': '/src',
          },
        },
      };
      const config = makeProjectConfig() as Config.ProjectConfig & {
        future?: {experimental_vite?: Config.ViteConfig};
      };
      (config as unknown as Config.InitialOptions).future = {
        experimental_vite: viteConfig,
      };
      expect(getViteConfig(config)).toStrictEqual(viteConfig);
    });

    it('should handle phase 1 vite config options', () => {
      const viteConfig: Config.ViteConfig = {
        define: {
          __DEV__: true,
          __TEST__: true,
        },
        mode: 'test',
        resolve: {
          alias: {
            '@': '/src',
            '@components': '/src/components',
          },
          extensions: ['.ts', '.tsx', '.js'],
        },
      };
      const config = makeProjectConfig() as Config.ProjectConfig & {
        future?: {experimental_vite?: Config.ViteConfig};
      };
      (config as unknown as Config.InitialOptions).future = {
        experimental_vite: viteConfig,
      };
      expect(getViteConfig(config)).toStrictEqual(viteConfig);
    });
  });
});
