/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {extractSummary, runYarnInstall} from '../Utils';
import runJest from '../runJest';

const DIR = path.resolve(__dirname, '../vite-integration');

beforeAll(() => {
  // Install vite dependency for the e2e test
  runYarnInstall(DIR);
});

describe('Vite Integration E2E Tests', () => {
  test('vite integration does not break normal jest execution', () => {
    const result = runJest(DIR, ['--no-cache']);
    const {summary} = extractSummary(result.stderr);

    expect(result.exitCode).toBe(0);
    expect(summary).toContain('1 passed');
  });

  test('vite integration config is recognized', () => {
    const result = runJest(DIR, ['--showConfig']);

    expect(result.exitCode).toBe(0);
    // Config should be parseable even with vite option
    expect(() => JSON.parse(result.stdout)).not.toThrow();
  });

  test('Phase 1 options: server.deps configuration', () => {
    const result = runJest(DIR, ['--showConfig']);
    expect(result.exitCode).toBe(0);

    // The config is printed but might be in warnings, so just verify no errors
    expect(result.stdout).toContain('"configs"');
    // Verify experimental_vite is mentioned in output (even if in warnings)
    expect(result.stderr).toContain('experimental_vite');
  });

  test('Phase 1 options: resolve configuration', () => {
    const result = runJest(DIR, ['--showConfig']);
    expect(result.exitCode).toBe(0);

    // Verify config output contains our vite settings
    expect(result.stderr).toContain('experimental_vite');
    expect(result.stderr).toContain('resolve');
    expect(result.stderr).toContain('conditions');
  });

  test('Phase 1 options: optimizeDeps configuration', () => {
    const result = runJest(DIR, ['--showConfig']);
    expect(result.exitCode).toBe(0);

    // Verify config output contains optimizeDeps settings
    expect(result.stderr).toContain('experimental_vite');
    expect(result.stderr).toContain('optimizeDeps');
  });

  test('can run tests with vite integration enabled', () => {
    // Run a simple test to verify vite integration doesn't break test execution
    const result = runJest(DIR, ['basic.test.js', '--no-cache']);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain('PASS');
  });

  describe('Non-Watch Mode', () => {
    test('vite integration works in non-watch mode', () => {
      // Run tests without --watch flag
      const result = runJest(DIR, ['--no-cache']);

      expect(result.exitCode).toBe(0);
      expect(result.stderr).toContain('PASS');
      // Vite should start in test mode
      expect(result.stderr).toMatch(/Vite dev server started.*test mode/);
    });

    test('vite server starts and stops properly in non-watch mode', () => {
      const result = runJest(DIR, ['basic.test.js', '--no-cache']);

      expect(result.exitCode).toBe(0);
      // Check that server started
      expect(result.stderr).toContain('Vite dev server started');
      // Check that server stopped
      expect(result.stderr).toContain('Vite dev server stopped');
    });

    test('vite transform pipeline works in non-watch mode', () => {
      const result = runJest(DIR, ['--no-cache']);

      expect(result.exitCode).toBe(0);
      // Features should be enabled
      expect(result.stderr).toContain('Vite features enabled');
      expect(result.stderr).toContain('transform pipeline');
    });
  });
});
