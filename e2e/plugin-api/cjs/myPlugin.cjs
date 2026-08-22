/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * @returns {import('@jest/types').Config.JestPlugin}
 */
function myPlugin() {
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
    name: 'jest:my-plugin',
  };
}

/**
 * @returns {import('@jest/types').Config.JestPlugin}
 */
function transformPlugin() {
  return {
    name: 'jest:transform-plugin',
    transform(code, id) {
      // Example transform that adds a comment at the top of files
      if (id.endsWith('.test.ts') || id.endsWith('.test.js')) {
        console.log('Transform plugin processing test file:', id);
        return `/* Transformed by jest:transform-plugin */\n${code}`;
      }
      return code;
    },
  };
}

module.exports = {myPlugin, transformPlugin};
