# Vite Integration E2E Test

This directory contains end-to-end tests for Jest's experimental Vite integration feature.

## Purpose

This test suite validates that Jest can successfully run tests with Vite integration enabled through the `future.experimental_vite` configuration option.

## Configuration

The `jest.config.ts` file demonstrates how to enable Vite integration:

```typescript
import {defineConfig, withViteConfig} from 'jest-config';

export default defineConfig({
  displayName: 'vite-integration-test',
  future: {
    experimental_vite: withViteConfig({
      mode: 'test',
    }),
  },
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
});
```

## Test Cases

- **sum.test.ts**: Basic test cases to verify that TypeScript files can be imported and tested with Vite integration enabled.

## Running the Tests

To run these tests:

```bash
yarn jest e2e/vite-integration
```

## Requirements

To use Vite integration, the following packages must be installed:

- `vite` (>= 5.0.0)
- `tsx` (>= 4.0.0)

These are optional peer dependencies of `@jest/core`.
