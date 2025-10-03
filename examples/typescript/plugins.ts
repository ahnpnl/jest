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
    configureJest(context) {
      console.log('Project root:', context.config.rootDir);
    },
    name: 'jest:simple-plugin',
  };
}

// Example 2: Plugin with config modification
export function configModifierPlugin(): Config.Plugin {
  return {
    config(config, context) {
      return {
        ...config,
        testTimeout: config.testTimeout || 5000,
      };
    },
    name: 'jest:config-modifier',
  };
}

// Example 3: Plugin with all hooks
export function fullPlugin(): Config.Plugin {
  return {
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
    load(id) {
      if (id.startsWith('\0virtual:')) {
        return {
          code: 'export default {};',
          map: null,
        };
      }
      return null;
    },
    name: 'jest:full-plugin',
    resolveId(source, importer, options) {
      if (source.startsWith('virtual:')) {
        return {external: false, id: `\0${source}`};
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
