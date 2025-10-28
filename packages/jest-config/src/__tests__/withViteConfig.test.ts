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
      mode: 'development',
      resolve: {
        alias: {
          '@': '/src',
        },
      },
    };

    const result = withViteConfig(viteConfig);

    expect(result).toStrictEqual({
      mode: 'development',
      resolve: {
        alias: {
          '@': '/src',
        },
      },
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

  it('should handle all phase 1 vite config options', () => {
    const viteConfig: Config.ViteConfig = {
      define: {
        __DEV__: true,
        __TEST__: true,
      },
      mode: 'development',
      resolve: {
        alias: {
          '@': '/src',
          '@components': '/src/components',
        },
        extensions: ['.ts', '.tsx', '.js'],
      },
    };

    const result = withViteConfig(viteConfig);

    expect(result).toStrictEqual(viteConfig);
  });
});
