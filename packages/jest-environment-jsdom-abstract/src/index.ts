/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Context} from 'vm';
import type * as jsdom from 'jsdom';
import type {
  EnvironmentContext,
  JestEnvironment,
  JestEnvironmentConfig,
} from '@jest/environment';
import {LegacyFakeTimers, ModernFakeTimers} from '@jest/fake-timers';
import type {Global} from '@jest/types';
import {ModuleMocker} from 'jest-mock';
import {installCommonGlobals} from 'jest-util';

// The `Window` interface does not have an `Error.stackTraceLimit` property, but
// `JSDOMEnvironment` assumes it is there.
type Win = Window &
  Global.Global & {
    Error: {
      stackTraceLimit: number;
    };
  };

function catchWindowErrors(win: Win) {
  let userErrorListenerCount = 0;
  function throwUnhandlerError(e: ErrorEvent) {
    if (userErrorListenerCount === 0 && e.error != null) {
      globalThis.process.emit('uncaughtException', e.error);
    }
  }
  const addEventListener = win.addEventListener.bind(win);
  const removeEventListener = win.removeEventListener.bind(win);
  win.addEventListener('error', throwUnhandlerError);
  win.addEventListener = function (...args: [any, any, any]) {
    if (args[0] === 'error') {
      userErrorListenerCount++;
    }
    return addEventListener.apply(this, args);
  };
  win.removeEventListener = function (...args: [any, any, any]) {
    if (args[0] === 'error' && userErrorListenerCount) {
      userErrorListenerCount--;
    }
    return removeEventListener.apply(this, args);
  };

  return function clearErrorHandlers() {
    win.removeEventListener('error', throwUnhandlerError);
  };
}

function patchVirtualConsole(
  VirtualConsoleModule: typeof jsdom.VirtualConsole,
  context: EnvironmentContext,
): jsdom.VirtualConsole {
  const patchedVirtualConsole = new VirtualConsoleModule();

  if (
    'forwardTo' in patchedVirtualConsole &&
    typeof patchedVirtualConsole.forwardTo === 'function'
  ) {
    // JSDOM 27+ uses `forwardTo`
    patchedVirtualConsole.forwardTo(context.console);
  } else if (
    'sendTo' in patchedVirtualConsole &&
    typeof patchedVirtualConsole.sendTo === 'function'
  ) {
    // JSDOM 26 uses `sendTo`
    patchedVirtualConsole.sendTo(context.console, {omitJSDOMErrors: true});
  } else {
    // Fallback for unexpected API changes
    throw new TypeError(
      'Unable to forward JSDOM console output - neither sendTo nor forwardTo methods are available',
    );
  }

  patchedVirtualConsole.on('jsdomError', error => {
    context.console.error(error);
  });

  return patchedVirtualConsole;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

type JestJSDOMEnvironmentOptions = {
  html?: string;
  userAgent?: string;
} & jsdom.BaseOptions;

export default abstract class BaseJSDOMEnvironment
  implements JestEnvironment<number>
{
  global = globalThis as unknown as Win;
  fakeTimers: LegacyFakeTimers<number> | null;
  fakeTimersModern: ModernFakeTimers | null;
  moduleMocker: ModuleMocker | null;
  customExportConditions = ['browser'];
  private _errorEventListener: (() => void) | null;
  private _dom: jsdom.JSDOM | null;
  private readonly _configuredExportConditions?: Array<string>;

  protected constructor(
    config: JestEnvironmentConfig,
    context: EnvironmentContext,
    jsdomModule: typeof jsdom,
  ) {
    const {projectConfig} = config;
    const {JSDOM, ResourceLoader, VirtualConsole} = jsdomModule;
    const {html, userAgent, ...restOptions} =
      projectConfig.testEnvironmentOptions satisfies JestJSDOMEnvironmentOptions;

    const patchedVirtualConsole = patchVirtualConsole(VirtualConsole, context);

    this._dom = new JSDOM(typeof html === 'string' ? html : '<!DOCTYPE html>', {
      pretendToBeVisual: true,
      resources:
        typeof userAgent === 'string'
          ? new ResourceLoader({
              userAgent,
            })
          : undefined,
      runScripts: 'dangerously',
      url: 'http://localhost/',
      virtualConsole: patchedVirtualConsole,
      ...restOptions,
    });

    if (this._dom.window == null) {
      throw new Error('JSDOM did not return a Window object');
    }

    // Node's error-message stack size is limited at 10, but it's pretty useful
    // to see more than that when a test fails.
    globalThis.Error.stackTraceLimit = 100;
    installCommonGlobals(globalThis, projectConfig.globals);

    // TODO: remove this ASAP, but it currently causes tests to run really slow
    globalThis.Buffer = Buffer;

    this._errorEventListener = catchWindowErrors(globalThis as unknown as Win);

    if ('customExportConditions' in projectConfig.testEnvironmentOptions) {
      const {customExportConditions} = projectConfig.testEnvironmentOptions;
      if (
        Array.isArray(customExportConditions) &&
        customExportConditions.every(isString)
      ) {
        this._configuredExportConditions = customExportConditions;
      } else {
        throw new Error(
          'Custom export conditions specified but they are not an array of strings',
        );
      }
    }

    this.moduleMocker = new ModuleMocker(globalThis);

    this.fakeTimers = new LegacyFakeTimers({
      config: projectConfig,
      global: globalThis as unknown as typeof globalThis,
      moduleMocker: this.moduleMocker,
      timerConfig: {
        idToRef: (id: number) => id,
        refToId: (ref: number) => ref,
      },
    });

    this.fakeTimersModern = new ModernFakeTimers({
      config: projectConfig,
      global: globalThis as unknown as typeof globalThis,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async setup(): Promise<void> {}

  async teardown(): Promise<void> {
    this.fakeTimers?.dispose();
    this.fakeTimersModern?.dispose();
    if (this._errorEventListener) {
      this._errorEventListener();
      globalThis.removeEventListener('error', this._errorEventListener);
      this._errorEventListener = null;
    }
    globalThis.close();
    this._dom = null;
    this.fakeTimers = null;
    this.fakeTimersModern = null;
  }

  exportConditions(): Array<string> {
    return this._configuredExportConditions ?? this.customExportConditions;
  }

  getVmContext(): Context | null {
    if (this._dom) {
      return this._dom.getInternalVMContext();
    }

    return null;
  }
}
