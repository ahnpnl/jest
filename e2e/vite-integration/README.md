# Vite Integration E2E Test

This directory contains an end-to-end test demonstrating Jest's experimental Vite integration (Phase 1).

## What This Demonstrates

This e2e test shows that:

1. **Vite Server Initialization**: When Jest starts, it initializes a Vite dev server for each project context that has Vite integration enabled
2. **Configuration Support**: The Phase 1 Vite integration supports:
   - `mode`: Vite mode (e.g., 'test', 'development')
   - `define`: Global constant replacements
   - `resolve.alias`: Import path aliases
3. **Lifecycle Management**: Jest properly initializes and cleans up Vite servers during test execution

## Running the Test

```bash
# From the repository root
yarn jest e2e/vite-integration
```

When you run this, you should see:
```
[Vite] Initialized 1 Vite server(s) for testing
 PASS  e2e/vite-integration/__tests__/sum.test.ts
[Vite] Closed 1 Vite server(s)
```

## Configuration

The `jest.config.ts` demonstrates Phase 1 Vite integration:

```typescript
export default defineConfig({
  displayName: 'vite-integration-test',
  future: {
    experimental_vite: withViteConfig({
      mode: 'test',
      define: {
        __TEST__: true,
        __DEV__: false,
      },
      resolve: {
        alias: {
          '@': __dirname,
        },
      },
    }),
  },
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
});
```

## How It Works

### 1. Initialization (in runJest.ts)

When `runJest()` starts:
- It checks each project context for `future.experimental_vite` config
- Calls `initializeViteIntegration()` for each context
- Creates Vite dev servers with the specified configuration
- Logs initialization status to the console

### 2. Test Execution

During test execution:
- Vite servers are running in the background
- Ready for future phases to integrate transformations and module resolution

### 3. Cleanup

After all tests complete:
- Jest closes all Vite servers
- Logs cleanup status

## Phase 1 Scope

This Phase 1 integration demonstrates:
- ✅ Configuration infrastructure
- ✅ Vite server lifecycle management
- ✅ Integration with Jest's core test runner

**Not yet implemented** (planned for Phase 2+):
- ❌ Module transformation via Vite
- ❌ Module resolution using Vite's resolver
- ❌ HMR support in watch mode

## Performance Tracking

The integration includes performance markers:
- `jest/viteSetup:start` / `jest/viteSetup:end` - Vite initialization time
- `jest/viteTeardown:start` / `jest/viteTeardown:end` - Vite cleanup time

These can be analyzed to measure the overhead/benefit of Vite integration.

## Requirements

To use Vite integration, the following packages must be installed:

- `vite` (>= 5.0.0) - **peer dependency**
- `vite-node` (>= 2.0.0) - installed with @jest/vite

Install with:
```bash
npm install --save-dev @jest/vite vite
```

