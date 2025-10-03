/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Config} from '@jest/types';

// Example 1: Simple plugin
export function simplePlugin(): Config.Plugin {
  return {
    name: 'jest:simple-plugin',
    configureJest(context) {
      console.log('Project root:', context.config.rootDir);
    },
  };
}

// Example 2: Plugin with config modification
export function configModifierPlugin(): Config.Plugin {
  return {
    name: 'jest:config-modifier',
    enforce: 'pre',
    config(config, context) {
      return {
        ...config,
        testTimeout: config.testTimeout || 5000,
      };
    },
  };
}

// Example 3: Plugin with all hooks
export function fullPlugin(): Config.Plugin {
  return {
    name: 'jest:full-plugin',
    enforce: 'post',
    config(config, context) {
      console.log('Config path:', context.configPath);
      return config;
    },
    configResolved(config, context) {
      console.log('Resolved config for:', config.rootDir);
    },
    configureJest(context) {
      console.log('CI mode:', context.globalConfig.ci);
    },
    resolveId(source, importer, options) {
      if (source.startsWith('virtual:')) {
        return {id: '\0' + source, external: false};
      }
      return null;
    },
    load(id) {
      if (id.startsWith('\0virtual:')) {
        return {
          code: 'export default {};',
          map: null,
        };
      }
      return null;
    },
    transform(code, id) {
      if (id.endsWith('.custom')) {
        return {
          code: code.toUpperCase(),
          map: null,
        };
      }
      return null;
    },
  };
}
