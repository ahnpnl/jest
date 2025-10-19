/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Config} from '@jest/types';
import {applyDefines, getViteConfig, isViteEnabled, resolveAlias} from '../';

describe('@jest/vite', () => {
  describe('isViteEnabled', () => {
    it('should return false when vite is not configured', () => {
      const config = {} as Config.ProjectConfig;
      expect(isViteEnabled(config)).toBe(false);
    });

    it('should return true when vite is enabled with boolean', () => {
      const config = {
        future: {
          experimental_vite: true,
        },
      } as unknown as Config.ProjectConfig;

      expect(isViteEnabled(config)).toBe(true);
    });

    it('should return true when vite is configured with object', () => {
      const config = {
        future: {
          experimental_vite: {mode: 'test'},
        },
      } as unknown as Config.ProjectConfig;

      expect(isViteEnabled(config)).toBe(true);
    });
  });

  describe('getViteConfig', () => {
    it('should return null when vite is not configured', () => {
      const config = {} as Config.ProjectConfig;
      expect(getViteConfig(config)).toBeNull();
    });

    it('should return default config when vite is enabled with boolean true', () => {
      const config = {
        future: {
          experimental_vite: true,
        },
      } as unknown as Config.ProjectConfig;

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
      const config = {
        future: {
          experimental_vite: viteConfig,
        },
      } as unknown as Config.ProjectConfig;

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
      const config = {
        future: {
          experimental_vite: viteConfig,
        },
      } as unknown as Config.ProjectConfig;

      expect(getViteConfig(config)).toStrictEqual(viteConfig);
    });
  });

  describe('applyDefines', () => {
    it('should replace global constants in code', () => {
      const code = 'if (__DEV__) { console.log("dev mode"); }';
      const defines = {__DEV__: false};
      const result = applyDefines(code, defines);
      expect(result).toBe('if (false) { console.log("dev mode"); }');
    });

    it('should handle multiple defines', () => {
      const code = 'const dev = __DEV__; const test = __TEST__;';
      const defines = {__DEV__: true, __TEST__: false};
      const result = applyDefines(code, defines);
      expect(result).toBe('const dev = true; const test = false;');
    });

    it('should handle string values', () => {
      const code = 'const env = __ENV__;';
      const defines = {__ENV__: 'production'};
      const result = applyDefines(code, defines);
      expect(result).toBe('const env = "production";');
    });

    it('should not replace partial matches', () => {
      const code = 'const MY__DEV__VAR = __DEV__;';
      const defines = {__DEV__: true};
      const result = applyDefines(code, defines);
      expect(result).toBe('const MY__DEV__VAR = true;');
    });
  });

  describe('resolveAlias', () => {
    it('should resolve exact alias match', () => {
      const aliases = {'@': '/src'};
      const result = resolveAlias('@', aliases);
      expect(result).toBe('/src');
    });

    it('should resolve alias with path', () => {
      const aliases = {'@': '/src'};
      const result = resolveAlias('@/utils/helper', aliases);
      expect(result).toBe('/src/utils/helper');
    });

    it('should handle multiple aliases', () => {
      const aliases = {
        '@': '/src',
        '@components': '/src/components',
        '@utils': '/src/utils',
      };

      expect(resolveAlias('@/index', aliases)).toBe('/src/index');
      expect(resolveAlias('@components/Button', aliases)).toBe(
        '/src/components/Button',
      );
      expect(resolveAlias('@utils/format', aliases)).toBe('/src/utils/format');
    });

    it('should return original path if no alias matches', () => {
      const aliases = {'@': '/src'};
      const result = resolveAlias('./relative/path', aliases);
      expect(result).toBe('./relative/path');
    });

    it('should handle array-based alias targets', () => {
      const aliases = {'@': ['/src', '/lib']};
      const result = resolveAlias('@/utils', aliases);
      expect(result).toBe('/src/utils');
    });
  });
});
