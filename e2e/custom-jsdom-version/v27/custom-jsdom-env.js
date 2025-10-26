/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import jsdom from 'jsdom';
import BaseEnv from '@jest/environment-jsdom-abstract';
import {JSDOMWithDummyLocation} from './dummy-jsdom.js';

export default class JestJSDOMEnvironment extends BaseEnv {
  constructor(config, context) {
    super(config, context, {
      ...jsdom,
      JSDOM: JSDOMWithDummyLocation,
    });
  }
}
