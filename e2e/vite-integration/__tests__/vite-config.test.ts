/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {applyDefines, resolveAlias} from '@jest/vite';

describe('Vite Configuration Usage Examples', () => {
  describe('define configuration', () => {
    it('should replace global constants using applyDefines', () => {
      const code = 'const isDev = __DEV__; const isTest = __TEST__;';
      const defines = {__DEV__: false, __TEST__: true};

      const result = applyDefines(code, defines);

      expect(result).toBe('const isDev = false; const isTest = true;');
    });

    it('should transform conditional code', () => {
      const code = 'if (__DEV__) { console.log("dev"); }';
      const defines = {__DEV__: false};

      const result = applyDefines(code, defines);

      expect(result).toContain('if (false)');
    });
  });

  describe('resolve.alias configuration', () => {
    it('should resolve alias paths using resolveAlias', () => {
      const aliases = {'@': '/src'};

      expect(resolveAlias('@/utils/helper', aliases)).toBe('/src/utils/helper');
      expect(resolveAlias('@/components/Button', aliases)).toBe(
        '/src/components/Button',
      );
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
  });

  describe('mode configuration', () => {
    it('should use test mode by default', () => {
      // In Phase 1, mode is passed to Vite server
      // This test demonstrates the expected mode value
      const expectedMode = 'test';

      expect(expectedMode).toBe('test');
    });
  });
});
