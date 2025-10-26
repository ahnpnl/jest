/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as jsdom from 'jsdom';
import DummyLocation from './dummy-location.js';

export class JSDOMWithDummyLocation extends jsdom.JSDOM {
  #mockLocation = new DummyLocation();
  #documentProxy = new Proxy(super.window.document, {
    get: (target, prop, receiver) => {
      if (prop !== 'location') return Reflect.get(target, prop, receiver);
      return this.#mockLocation;
    },
  });
  #windowProxy = new Proxy(super.window, {
    get: (target, prop, receiver) => {
      switch (prop) {
        case 'document':
          return this.#documentProxy;
        case 'location':
          return this.#mockLocation;
        default:
          return Reflect.get(target, prop, receiver);
      }
    },
  });

  get window() {
    return this.#windowProxy;
  }
}
