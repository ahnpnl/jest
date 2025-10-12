/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import BaseJSDOMEnvironment from '..';
import type {
  EnvironmentContext,
  JestEnvironmentConfig,
} from '@jest/environment';
import * as jsdomModule from 'jsdom';
import {makeGlobalConfig, makeProjectConfig} from '@jest/test-utils';

class CustomJSDOMEnvironment extends BaseJSDOMEnvironment {
  constructor(
    public config: JestEnvironmentConfig,
    public context: EnvironmentContext,
  ) {
    super(config, context, jsdomModule);
  }
}

describe('JSDomEnvironment abstract', () => {
  it('should work with custom jsdom version <= 26', () => {
    Object.defineProperty(jsdomModule.VirtualConsole.prototype, 'sendTo', {
      value: jest.fn(),
      writable: true,
    });
    Object.defineProperty(jsdomModule.VirtualConsole.prototype, 'forwardTo', {
      value: undefined,
      writable: true,
    });
    const env = new CustomJSDOMEnvironment(
      {
        globalConfig: makeGlobalConfig(),
        projectConfig: makeProjectConfig(),
      },
      {console, docblockPragmas: {}, testPath: __filename},
    );

    expect(env.dom).toBeDefined();
  });

  it('should work with custom jsdom version >= 27', () => {
    Object.defineProperty(jsdomModule.VirtualConsole.prototype, 'sendTo', {
      value: undefined,
      writable: true,
    });
    Object.defineProperty(jsdomModule.VirtualConsole.prototype, 'forwardTo', {
      value: jest.fn(),
      writable: true,
    });
    const env = new CustomJSDOMEnvironment(
      {
        globalConfig: makeGlobalConfig(),
        projectConfig: makeProjectConfig(),
      },
      {console, docblockPragmas: {}, testPath: __filename},
    );

    expect(env.dom).toBeDefined();
  });

  it('should set globalThis to the JSDOM window object', () => {
    Object.defineProperty(jsdomModule.VirtualConsole.prototype, 'forwardTo', {
      value: jest.fn(),
      writable: true,
    });
    const env = new CustomJSDOMEnvironment(
      {
        globalConfig: makeGlobalConfig(),
        projectConfig: makeProjectConfig(),
      },
      {console, docblockPragmas: {}, testPath: __filename},
    );

    expect(env.global.globalThis).toBe(env.global);
  });

  it('should set global.global for backwards compatibility', () => {
    Object.defineProperty(jsdomModule.VirtualConsole.prototype, 'forwardTo', {
      value: jest.fn(),
      writable: true,
    });

    // Spy on process.emitWarning to capture deprecation warning
    const emitWarningSpy = jest.spyOn(process, 'emitWarning');

    const env = new CustomJSDOMEnvironment(
      {
        globalConfig: makeGlobalConfig(),
        projectConfig: makeProjectConfig(),
      },
      {console, docblockPragmas: {}, testPath: __filename},
    );

    expect(env.global.global).toBe(env.global);

    // Verify deprecation warning was emitted
    expect(emitWarningSpy).toHaveBeenCalledWith(
      expect.stringContaining('Accessing `global` is deprecated'),
      'DeprecationWarning',
    );

    emitWarningSpy.mockRestore();
  });

  it('should emit deprecation warning only once for global.global', () => {
    Object.defineProperty(jsdomModule.VirtualConsole.prototype, 'forwardTo', {
      value: jest.fn(),
      writable: true,
    });

    const emitWarningSpy = jest.spyOn(process, 'emitWarning');

    const env = new CustomJSDOMEnvironment(
      {
        globalConfig: makeGlobalConfig(),
        projectConfig: makeProjectConfig(),
      },
      {console, docblockPragmas: {}, testPath: __filename},
    );

    // Access global multiple times
    void env.global.global;
    void env.global.global;
    void env.global.global;

    // Warning should only be emitted once
    expect(emitWarningSpy).toHaveBeenCalledTimes(1);

    emitWarningSpy.mockRestore();
  });
});
