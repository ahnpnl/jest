/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Config} from '@jest/types';

export function myPlugin(): Config.Plugin {
  return {
    name: 'jest:my-plugin',
    configureJest(context: Config.PluginContext) {
      console.log('Plugin configured with project:', context.config.rootDir);
    },
  };
}
