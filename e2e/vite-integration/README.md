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
4. **Actual Configuration Usage**: Phase 1 includes utility functions demonstrating how each configuration option is used

## Running the Test

```bash
# From the repository root
yarn jest e2e/vite-integration
```

When you run this, you should see:
```
[Vite] Initialized 1 Vite server(s) for testing
[Vite] Mode: test
[Vite] Global constants defined: __DEV__, __TEST__
[Vite] Path aliases configured: 1
 PASS  e2e/vite-integration/__tests__/sum.test.ts
 PASS  e2e/vite-integration/__tests__/vite-config.test.ts
[Vite] Closed 1 Vite server(s)
```

## Configuration

The `jest.config.ts` demonstrates Phase 1 Vite integration with all supported options:

```typescript
export default defineConfig({
  displayName: 'vite-integration-test',
  future: {
    experimental_vite: withViteConfig({
      define: {
        __DEV__: false,
        __TEST__: true,
      },
      mode: 'test',
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

## How Configuration Options Are Used

### 1. `mode` - Vite Mode

The `mode` option controls which mode Vite runs in. In test mode:
- Vite optimizes for testing performance
- Environment variables are loaded from `.env.test`
- Plugins can behave differently based on mode

**Demonstration**: Vite server is initialized with mode 'test', visible in console output.

### 2. `define` - Global Constant Replacement

The `define` option replaces global constants at build time:

```typescript
define: {
  __DEV__: false,
  __TEST__: true,
}
```

**Demonstration**: See `applyDefines()` function in `@jest/vite`:
```typescript
import {applyDefines} from '@jest/vite';

const code = 'if (__DEV__) { console.log("dev"); }';
const result = applyDefines(code, {__DEV__: false});
// Result: 'if (false) { console.log("dev"); }'
```

**Test**: `e2e/vite-integration/__tests__/vite-config.test.ts` demonstrates this feature.

### 3. `resolve.alias` - Path Aliases

The `resolve.alias` option creates import path shortcuts:

```typescript
resolve: {
  alias: {
    '@': '/src',
    '@components': '/src/components',
  }
}
```

**Demonstration**: See `resolveAlias()` function in `@jest/vite`:
```typescript
import {resolveAlias} from '@jest/vite';

const resolved = resolveAlias('@/utils', {'@': '/src'});
// Result: '/src/utils'
```

**Test**: `e2e/vite-integration/__tests__/vite-config.test.ts` demonstrates this feature.

## How It Works

### 1. Initialization (in runJest.ts)

When `runJest()` starts:
- It checks each project context for `future.experimental_vite` config
- Calls `initializeViteIntegration()` for each context
- Creates Vite dev servers with the specified configuration
- Logs initialization status and configuration details to the console

### 2. Configuration Processing

During initialization, the system:
- Converts Jest's ViteConfig to Vite's InlineConfig format
- Applies the `mode` to the Vite server
- Configures `define` for constant replacement
- Sets up `resolve.alias` for path resolution

### 3. Test Execution

During test execution:
- Vite servers are running in the background
- Configuration utilities (`applyDefines`, `resolveAlias`) are available for use
- Ready for future phases to integrate transformations and module resolution

### 4. Cleanup

After all tests complete:
- Jest closes all Vite servers
- Logs cleanup status

## Phase 1 Scope

This Phase 1 integration demonstrates:
- ✅ Configuration infrastructure
- ✅ Vite server lifecycle management
- ✅ Integration with Jest's core test runner
- ✅ **Actual usage of configuration options (mode, define, resolve)**
- ✅ **Utility functions demonstrating option behavior**

**Not yet implemented** (planned for Phase 2+):
- ❌ Module transformation via Vite
- ❌ Module resolution using Vite's resolver
- ❌ HMR support in watch mode

## Files

- `jest.config.ts` - Jest configuration with all Phase 1 Vite options
- `sum.ts` - Sample module
- `example.ts` - Examples showing configuration usage
- `__tests__/sum.test.ts` - Sample tests
- `__tests__/vite-config.test.ts` - Tests demonstrating configuration features
- `README.md` - This file

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

