/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

module.exports = {
  displayName: 'vite-integration-e2e',
  testEnvironment: 'node',
  // Test with vite integration disabled (since Vite might not be installed in CI)
  // Vite integration is opt-in via future.experimental_vite
};
