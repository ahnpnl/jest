/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Config} from '@jest/types';
import {withViteConfig} from '../withViteConfig';

describe('withViteConfig', () => {
  it('should return default config when no config is provided', () => {
    const result = withViteConfig();

    expect(result).toStrictEqual({
      mode: 'test',
    });
  });

  it('should merge provided config with defaults', () => {
    const viteConfig: Config.ViteConfig = {
      configFile: './vite.config.ts',
      root: '/path/to/root',
    };

    const result = withViteConfig(viteConfig);

    expect(result).toStrictEqual({
      configFile: './vite.config.ts',
      mode: 'test',
      root: '/path/to/root',
    });
  });

  it('should allow overriding default mode', () => {
    const viteConfig: Config.ViteConfig = {
      mode: 'production',
    };

    const result = withViteConfig(viteConfig);

    expect(result).toStrictEqual({
      mode: 'production',
    });
  });

  it('should handle all vite config options', () => {
    const viteConfig: Config.ViteConfig = {
      configFile: false,
      css: {
        modules: {},
      },
      define: {
        __DEV__: true,
      },
      esbuild: false,
      mode: 'development',
      optimizeDeps: {
        exclude: ['some-package'],
        include: ['another-package'],
      },
      plugins: [],
      resolve: {
        alias: {
          '@': '/src',
        },
        extensions: ['.ts', '.tsx'],
      },
      root: '/app',
    };

    const result = withViteConfig(viteConfig);

    expect(result).toStrictEqual(viteConfig);
  });
});
