/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export function myPlugin() {
  return {
    config(config, context) {
      console.log(
        'Plugin config hook called with configPath:',
        context.configPath,
      );
      // Modify config before it's normalized
      return {
        ...config,
        testEnvironment: config.testEnvironment || 'node',
      };
    },
    configResolved(config) {
      console.log(
        'Plugin configResolved hook called for project:',
        config.rootDir,
      );
    },
    configureJest(context) {
      console.log('Plugin configured with project:', context.config.rootDir);
      console.log('Global config ci mode:', context.globalConfig.ci);
    },
    enforce: 'pre',
    name: 'jest:my-plugin',
  };
}

export function transformPlugin() {
  return {
    name: 'jest:transform-plugin',
    transform(code, id) {
      // Example transform that could be used for custom transformations
      console.log('Transform plugin processing:', id);
      return code;
    },
  };
}
