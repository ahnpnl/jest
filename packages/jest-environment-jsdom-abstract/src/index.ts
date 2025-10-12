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

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export default abstract class BaseJSDOMEnvironment
  implements JestEnvironment<number>
{
  dom: jsdom.JSDOM | null;
  fakeTimers: LegacyFakeTimers<number> | null;
  fakeTimersModern: ModernFakeTimers | null;
  private errorEventListener: ((event: Event & {error: Error}) => void) | null;
  moduleMocker: ModuleMocker | null;
  customExportConditions = ['browser'];
  private readonly _configuredExportConditions?: Array<string>;
  private _global: Win;

  get global(): Win {
    return this._global;
  }

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
    const jsdomWindow = this.dom.window as unknown as Win;

    globalThis.global = jsdomWindow;

    // Node's error-message stack size is limited at 10, but it's pretty useful
    // to see more than that when a test fails.
    jsdomWindow.Error.stackTraceLimit = 100;
    installCommonGlobals(jsdomWindow, projectConfig.globals);

    // TODO: remove this ASAP, but it currently causes tests to run really slow
    jsdomWindow.Buffer = Buffer;

    // Report uncaught errors.
    this.errorEventListener = event => {
      if (userErrorListenerCount === 0 && event.error != null) {
        process.emit('uncaughtException', event.error);
      }
    };
    jsdomWindow.addEventListener('error', this.errorEventListener);

    // However, don't report them as uncaught if the user listens to 'error' event.
    // In that case, we assume the might have custom error handling logic.
    const originalAddListener = jsdomWindow.addEventListener.bind(jsdomWindow);
    const originalRemoveListener =
      jsdomWindow.removeEventListener.bind(jsdomWindow);
    let userErrorListenerCount = 0;
    jsdomWindow.addEventListener = function (
      ...args: Parameters<typeof originalAddListener>
    ) {
      if (args[0] === 'error') {
        userErrorListenerCount++;
      }
      return originalAddListener.apply(this, args);
    };
    jsdomWindow.removeEventListener = function (
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

    this.moduleMocker = new ModuleMocker(jsdomWindow);

    this.fakeTimers = new LegacyFakeTimers({
      config: projectConfig,
      global: jsdomWindow,
      moduleMocker: this.moduleMocker,
      timerConfig: {
        idToRef: (id: number) => id,
        refToId: (ref: number) => ref,
      },
    });

    this.fakeTimersModern = new ModernFakeTimers({
      config: projectConfig,
      global: jsdomWindow,
    });

    this._global = jsdomWindow;
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
    this._global = null;
    this.dom = null;
    this.fakeTimers = null;
    this.fakeTimersModern = null;
  }

  exportConditions(): Array<string> {
    return this._configuredExportConditions ?? this.customExportConditions;
  }

  getVmContext(): Context | null {
    if (this.dom) {
      return this.dom.getInternalVMContext();
    }
    return null;
  }
}
