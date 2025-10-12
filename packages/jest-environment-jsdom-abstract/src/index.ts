/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {type Context, createContext} from 'vm';
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

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export default abstract class BaseJSDOMEnvironment
  implements JestEnvironment<number>
{
  dom: jsdom.JSDOM | null;
  fakeTimers: LegacyFakeTimers<number> | null;
  fakeTimersModern: ModernFakeTimers | null;
  global: Win;
  private errorEventListener: ((event: Event & {error: Error}) => void) | null;
  moduleMocker: ModuleMocker | null;
  customExportConditions = ['browser'];
  private readonly _configuredExportConditions?: Array<string>;
  private _cachedVmContext?: Context;
  private _customWindowDetected = false;

  protected constructor(
    config: JestEnvironmentConfig,
    context: EnvironmentContext,
    jsdomModule: typeof jsdom,
  ) {
    const {projectConfig} = config;

    const {JSDOM, ResourceLoader, VirtualConsole} = jsdomModule;

    const virtualConsole = new VirtualConsole();

    if (
      'forwardTo' in virtualConsole &&
      typeof virtualConsole.forwardTo === 'function'
    ) {
      // JSDOM 27+ uses `forwardTo`
      virtualConsole.forwardTo(context.console);
    } else if (
      'sendTo' in virtualConsole &&
      typeof virtualConsole.sendTo === 'function'
    ) {
      // JSDOM 26 uses `sendTo`
      virtualConsole.sendTo(context.console, {omitJSDOMErrors: true});
    } else {
      // Fallback for unexpected API changes
      throw new TypeError(
        'Unable to forward JSDOM console output - neither sendTo nor forwardTo methods are available',
      );
    }

    virtualConsole.on('jsdomError', error => {
      context.console.error(error);
    });

    this.dom = new JSDOM(
      typeof projectConfig.testEnvironmentOptions.html === 'string'
        ? projectConfig.testEnvironmentOptions.html
        : '<!DOCTYPE html>',
      {
        pretendToBeVisual: true,
        resources:
          typeof projectConfig.testEnvironmentOptions.userAgent === 'string'
            ? new ResourceLoader({
                userAgent: projectConfig.testEnvironmentOptions.userAgent,
              })
            : undefined,
        runScripts: 'dangerously',
        url: 'http://localhost/',
        virtualConsole,
        ...projectConfig.testEnvironmentOptions,
      },
    );
    const global = (this.global = this.dom.window as unknown as Win);

    // Check if the custom JSDOM has overridden the window property
    // If so, we detected a custom implementation and should use the custom window
    const internalVMContext = this.dom.getInternalVMContext();
    if (this.dom.window !== internalVMContext) {
      // The custom JSDOM has provided a different window object (likely a Proxy).
      // We need to ensure this custom window is used as the global object.
      // Since JSDOM created its internal VM context from the original window,
      // we'll create a new VM context from the custom window and cache it.
      this._customWindowDetected = true;
    }

    if (global == null) {
      throw new Error('JSDOM did not return a Window object');
    }

    // TODO: remove at some point - for "universal" code (code should use `globalThis`)
    global.global = global;

    // Node's error-message stack size is limited at 10, but it's pretty useful
    // to see more than that when a test fails.
    this.global.Error.stackTraceLimit = 100;
    installCommonGlobals(global, projectConfig.globals);

    // TODO: remove this ASAP, but it currently causes tests to run really slow
    global.Buffer = Buffer;

    // Report uncaught errors.
    this.errorEventListener = event => {
      if (userErrorListenerCount === 0 && event.error != null) {
        process.emit('uncaughtException', event.error);
      }
    };
    global.addEventListener('error', this.errorEventListener);

    // However, don't report them as uncaught if the user listens to 'error' event.
    // In that case, we assume the might have custom error handling logic.
    const originalAddListener = global.addEventListener.bind(global);
    const originalRemoveListener = global.removeEventListener.bind(global);
    let userErrorListenerCount = 0;
    global.addEventListener = function (
      ...args: Parameters<typeof originalAddListener>
    ) {
      if (args[0] === 'error') {
        userErrorListenerCount++;
      }
      return originalAddListener.apply(this, args);
    };
    global.removeEventListener = function (
      ...args: Parameters<typeof originalRemoveListener>
    ) {
      if (args[0] === 'error') {
        userErrorListenerCount--;
      }
      return originalRemoveListener.apply(this, args);
    };

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

    this.moduleMocker = new ModuleMocker(global);

    this.fakeTimers = new LegacyFakeTimers({
      config: projectConfig,
      global: global as unknown as typeof globalThis,
      moduleMocker: this.moduleMocker,
      timerConfig: {
        idToRef: (id: number) => id,
        refToId: (ref: number) => ref,
      },
    });

    this.fakeTimersModern = new ModernFakeTimers({
      config: projectConfig,
      global: global as unknown as typeof globalThis,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async setup(): Promise<void> {}

  async teardown(): Promise<void> {
    if (this.fakeTimers) {
      this.fakeTimers.dispose();
    }
    if (this.fakeTimersModern) {
      this.fakeTimersModern.dispose();
    }
    if (this.global != null) {
      if (this.errorEventListener) {
        this.global.removeEventListener('error', this.errorEventListener);
      }
      this.global.close();
    }
    this.errorEventListener = null;
    // @ts-expect-error: this.global not allowed to be `null`
    this.global = null;
    this.dom = null;
    this.fakeTimers = null;
    this.fakeTimersModern = null;
  }

  exportConditions(): Array<string> {
    return this._configuredExportConditions ?? this.customExportConditions;
  }

  getVmContext(): Context | null {
    if (this.dom) {
      if (this._cachedVmContext) {
        return this._cachedVmContext;
      }

      const internalContext = this.dom.getInternalVMContext();
      // If the custom JSDOM instance has overridden the window property
      // (e.g., with a Proxy), we need to create a new VM context from it
      // so that code running in the context sees the custom window
      if (this.dom.window !== internalContext) {
        this._cachedVmContext = createContext(this.dom.window);
        return this._cachedVmContext;
      }
      return internalContext;
    }
    return null;
  }
}
