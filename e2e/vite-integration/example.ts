/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * This file demonstrates how Vite configuration options are used in Phase 1.
 *
 * These examples show what happens when Jest processes code with Vite integration enabled.
 */

// Example 1: Using define configuration
// With define: { __DEV__: false, __TEST__: true }
export function exampleDefines() {
  // In development, __DEV__ would be true
  // In test mode with our config, it's false
  if (__DEV__) {
    console.log('This is development mode');
  }

  // In test mode, __TEST__ is true
  if (__TEST__) {
    console.log('This is test mode');
  }

  return {
    isDev: __DEV__,
    isTest: __TEST__,
  };
}

// Example 2: Using resolve.alias configuration
// With resolve.alias: { '@': __dirname }
// Import from '@/sum' would resolve to './sum'
import {sum} from '@/sum';

export function exampleAlias() {
  // This demonstrates that alias resolution works
  return sum(5, 10);
}

// Example 3: Mode configuration
// With mode: 'test'
// Vite server runs in test mode, which affects how it processes files
export function exampleMode() {
  return {
    description: 'Vite server is running in test mode',
    mode: 'test',
  };
}

// Global constants that would be replaced by Vite's define
declare const __DEV__: boolean;
declare const __TEST__: boolean;
