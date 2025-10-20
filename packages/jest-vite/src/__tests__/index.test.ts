/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import * as fs from 'graceful-fs';
import type {Config} from '@jest/types';
import {
  applyDefines,
  createGlobalVariables,
  getViteConfig,
  injectEnvVariables,
  isViteEnabled,
  loadEnvFiles,
  mergeDefinesAndGlobals,
  resolveAlias,
} from '../';

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

  describe('loadEnvFiles', () => {
    const tmpDir = path.join(__dirname, '__tmp_env__');

    beforeEach(() => {
      // Create temp directory for test .env files
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, {recursive: true});
      }
    });

    afterEach(() => {
      // Clean up temp directory
      if (fs.existsSync(tmpDir)) {
        const files = fs.readdirSync(tmpDir);
        for (const file of files) {
          fs.unlinkSync(path.join(tmpDir, file));
        }
        fs.rmdirSync(tmpDir);
      }
    });

    it('should load variables from .env file', () => {
      fs.writeFileSync(path.join(tmpDir, '.env'), 'BASE_VAR=base_value');
      const vars = loadEnvFiles(tmpDir, 'test');
      expect(vars).toEqual({BASE_VAR: 'base_value'});
    });

    it('should load variables from mode-specific .env files', () => {
      fs.writeFileSync(path.join(tmpDir, '.env.test'), 'TEST_VAR=test_value');
      const vars = loadEnvFiles(tmpDir, 'test');
      expect(vars).toEqual({
        TEST_VAR: 'test_value',
      });
    });

    it('should override with mode-specific files', () => {
      fs.writeFileSync(path.join(tmpDir, '.env'), 'VAR=base');
      fs.writeFileSync(path.join(tmpDir, '.env.test'), 'VAR=test_override');
      const vars = loadEnvFiles(tmpDir, 'test');
      expect(vars).toEqual({VAR: 'test_override'});
    });

    it('should support variable expansion', () => {
      fs.writeFileSync(
        path.join(tmpDir, '.env'),
        'BASE_URL=http://localhost\nAPI_URL=${BASE_URL}/api',
      );
      const vars = loadEnvFiles(tmpDir, 'test');
      expect(vars).toEqual({
        API_URL: 'http://localhost/api',
        BASE_URL: 'http://localhost',
      });
    });

    it('should return empty object when no .env files exist', () => {
      const vars = loadEnvFiles(tmpDir, 'test');
      expect(vars).toEqual({});
    });
  });

  describe('injectEnvVariables', () => {
    const originalEnv = {...process.env};

    afterEach(() => {
      // Restore original process.env
      process.env = originalEnv;
    });

    it('should inject all variables into process.env', () => {
      const envVars = {
        MY_VAR: 'value1',
        VITE_PUBLIC_VAR: 'value2',
      };
      injectEnvVariables(envVars, 'test');
      expect(process.env.MY_VAR).toBe('value1');
      expect(process.env.VITE_PUBLIC_VAR).toBe('value2');
    });

    it('should only expose VITE_ prefixed variables to import.meta.env', () => {
      const envVars = {
        MY_VAR: 'should_not_expose',
        VITE_PUBLIC_VAR: 'should_expose',
      };
      const importMetaEnv = injectEnvVariables(envVars, 'test');
      expect(importMetaEnv.MY_VAR).toBeUndefined();
      expect(importMetaEnv.VITE_PUBLIC_VAR).toBe('should_expose');
    });

    it('should include standard Vite env variables', () => {
      const envVars = {};
      const importMetaEnv = injectEnvVariables(envVars, 'development');
      expect(importMetaEnv.MODE).toBe('development');
      expect(importMetaEnv.DEV).toBe('true');
      expect(importMetaEnv.PROD).toBe('false');
      expect(importMetaEnv.SSR).toBe('false');
    });

    it('should set PROD to true in production mode', () => {
      const envVars = {};
      const importMetaEnv = injectEnvVariables(envVars, 'production');
      expect(importMetaEnv.MODE).toBe('production');
      expect(importMetaEnv.DEV).toBe('false');
      expect(importMetaEnv.PROD).toBe('true');
    });
  });

  describe('mergeDefinesAndGlobals', () => {
    it('should return empty object when both are undefined', () => {
      const result = mergeDefinesAndGlobals(undefined, undefined);
      expect(result).toEqual({});
    });

    it('should return jest globals when vite defines is undefined', () => {
      const jestGlobals = {__JEST_VAR__: 'jest_value'};
      const result = mergeDefinesAndGlobals(undefined, jestGlobals);
      expect(result).toEqual(jestGlobals);
    });

    it('should return vite defines when jest globals is undefined', () => {
      const viteDefines = {__VITE_VAR__: 'vite_value'};
      const result = mergeDefinesAndGlobals(viteDefines, undefined);
      expect(result).toEqual(viteDefines);
    });

    it('should merge both configs', () => {
      const viteDefines = {__VITE_VAR__: 'vite_value'};
      const jestGlobals = {__JEST_VAR__: 'jest_value'};
      const result = mergeDefinesAndGlobals(viteDefines, jestGlobals);
      expect(result).toEqual({
        __JEST_VAR__: 'jest_value',
        __VITE_VAR__: 'vite_value',
      });
    });

    it('should give precedence to vite defines over jest globals', () => {
      const viteDefines = {__SHARED__: 'from_vite'};
      const jestGlobals = {__SHARED__: 'from_jest'};
      const result = mergeDefinesAndGlobals(viteDefines, jestGlobals);
      expect(result).toEqual({__SHARED__: 'from_vite'});
    });
  });

  describe('createGlobalVariables', () => {
    it('should create global variables object', () => {
      const defines = {__DEV__: true, __TEST__: false};
      const envVars = {MODE: 'test', VITE_API_URL: 'http://api.test'};
      const result = createGlobalVariables(defines, envVars);
      expect(result).toEqual({
        defines: {__DEV__: true, __TEST__: false},
        importMetaEnv: {MODE: 'test', VITE_API_URL: 'http://api.test'},
      });
    });

    it('should handle empty defines and envVars', () => {
      const result = createGlobalVariables({}, {});
      expect(result).toEqual({
        defines: {},
        importMetaEnv: {},
      });
    });
  });
});
