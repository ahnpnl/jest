/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

module.exports = {
  displayName: 'vite-integration-e2e',
  testEnvironment: 'node',
  // Enable Vite integration with all features for e2e testing
  future: {
    experimental_vite: {
      enableHMR: true,
      smartTestSelection: true,
      useTransformPipeline: true,
    },
  },
};
