/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Example Jest configuration with Vite integration enabled for watch mode.
 * 
 * This demonstrates how to configure Jest to use Vite's dev server
 * during watch mode for improved performance and developer experience.
 */
module.exports = {
  displayName: 'vite-integration-example',
  
  // Standard Jest configuration
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  
  // Vite integration configuration
  vite: {
    // Enable Vite dev server in watch mode
    enabled: true,
    
    // Optional: Specify a custom Vite config file
    // configFile: './vite.config.js',
    
    // Optional: Specify a custom port for the Vite dev server
    // port: 5173,
    
    // Optional: Additional Vite configuration
    // config: {
    //   resolve: {
    //     conditions: ['node', 'default'],
    //   },
    // },
  },
};
