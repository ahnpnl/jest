/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Config} from '@jest/types';
import {defineConfig} from '../';

describe('defineConfig', () => {
  it('should return empty object when no arguments provided', () => {
    expect(defineConfig()).toEqual({});
  });

  it('should return the same config when single config is provided', () => {
    const config: Config.InitialOptions = {
      collectCoverage: true,
      roots: ['<rootDir>/src'],
      testEnvironment: 'node',
    };

    expect(defineConfig(config)).toStrictEqual({
      collectCoverage: true,
      roots: ['<rootDir>/src'],
      testEnvironment: 'node',
    });
  });

  it('should merge multiple config objects', () => {
    const baseConfig: Config.InitialOptions = {
      collectCoverage: true,
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      roots: ['<rootDir>/src'],
      testEnvironment: 'node',
    };
    const overrideConfig: Config.InitialOptions = {
      moduleNameMapper: {
        '^@utils/(.*)$': '<rootDir>/src/utils/$1',
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
      testEnvironment: 'jsdom',
    };

    expect(defineConfig(baseConfig, overrideConfig)).toStrictEqual({
      collectCoverage: true,
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@utils/(.*)$': '<rootDir>/src/utils/$1',
      },
      roots: ['<rootDir>/src'],
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
      testEnvironment: 'jsdom',
    });
  });

  it('should merge arrays correctly', () => {
    const config1: Config.InitialOptions = {
      roots: ['<rootDir>/src'],
      setupFilesAfterEnv: ['<rootDir>/src/setup1.ts'],
    };
    const config2: Config.InitialOptions = {
      roots: ['<rootDir>/tests'],
      setupFilesAfterEnv: ['<rootDir>/src/setup2.ts'],
    };

    expect(defineConfig(config1, config2)).toStrictEqual({
      roots: ['<rootDir>/src', '<rootDir>/tests'],
      setupFilesAfterEnv: [
        '<rootDir>/src/setup1.ts',
        '<rootDir>/src/setup2.ts',
      ],
    });
  });

  it('should handle nested object merging', () => {
    const config1: Config.InitialOptions = {
      coverageThreshold: {
        global: {
          branches: 80,
          functions: 80,
        },
      },
    };
    const config2: Config.InitialOptions = {
      coverageThreshold: {
        global: {
          lines: 90,
          statements: 90,
        },
      },
    };

    expect(defineConfig(config1, config2)).toStrictEqual({
      coverageThreshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 90,
          statements: 90,
        },
      },
    });
  });
});
