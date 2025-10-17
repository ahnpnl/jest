# Vite Integration Architecture

This document explains the architectural decisions for integrating Vite dev server into Jest watch mode.

## Architecture Overview

The Vite integration follows Jest's existing architecture patterns and integrates at the appropriate layer for watch mode functionality.

### Component Hierarchy

```
jest-cli (bin/jest.js)
    ↓
jest-cli/src/run.ts (buildArgv, run)
    ↓
@jest/core/cli/index.ts (runCLI)
    ↓
@jest/core/watch.ts (watch function) ← Vite dev server initialized here
    ↓
@jest/core/runJest.ts (test execution)
```

## Why Vite Server is Initialized in `watch.ts`

### 1. **Watch Mode Specific Feature**

The Vite dev server integration is exclusively a watch mode feature. It doesn't apply to:
- One-time test runs (`jest` without `--watch`)
- CI/CD environments
- Coverage reports
- Other non-watch Jest operations

Since it's watch-mode specific, initializing it in the `watch()` function is the most appropriate place.

### 2. **Follows Jest's Existing Patterns**

Jest already initializes watch-mode specific features in `watch.ts`:
- `TestWatcher` instance
- File watching mechanisms
- Interactive prompt handlers
- Watch mode UI

The Vite dev server fits naturally into this pattern as another watch-mode specific service.

### 3. **Single Responsibility**

- **CLI Layer** (`jest-cli`): Argument parsing, user interface
- **Core Layer** (`@jest/core/cli`): Configuration loading, project setup
- **Watch Layer** (`@jest/core/watch`): Watch mode orchestration, file monitoring
- **Execution Layer** (`@jest/core/runJest`): Test execution

The Vite dev server is orchestrated (started, stopped, module invalidation) at the watch layer, which is responsible for managing the watch mode lifecycle.

### 4. **Access to Required Context**

The `watch()` function has access to:
- Test contexts (configurations for all projects)
- File watcher instances
- Global configuration
- Output streams

All of these are needed for proper Vite integration:
- **Test contexts**: To extract Vite configuration from Jest config
- **File watcher**: To invalidate Vite modules when files change
- **Global config**: To determine if watch mode is enabled
- **Output streams**: To display Vite server status messages

### 5. **Lifecycle Management**

The `watch()` function manages the entire watch mode lifecycle:
- Initialization
- File change handling
- Cleanup on exit

This makes it the ideal place to manage the Vite dev server lifecycle, ensuring:
- Server starts when watch mode begins
- Modules are invalidated on file changes
- Server is properly stopped when watch mode ends

## Comparison with Vitest

While Vitest runs the Vite dev server from its CLI entry point, Jest's architecture is different:

**Vitest Architecture:**
```
vitest CLI
    ↓
Vite dev server (main process)
    ↓
Test runner (Vite plugin)
```

**Jest + Vite Architecture:**
```
jest CLI
    ↓
Jest core (watch mode)
    ↓
Vite dev server (auxiliary service)
    ↓
Jest test runner (unchanged)
```

Jest maintains its existing test runner and only uses Vite as an auxiliary service for:
- Fast module transformation
- Module graph for smart test selection
- HMR capabilities

This approach allows Jest to leverage Vite's performance benefits while maintaining backward compatibility and Jest's proven test execution model.

## Alternative Approaches Considered

### Option 1: Initialize in CLI Layer
**Rejected because:**
- Would require passing Vite server instance through multiple layers
- CLI layer doesn't have watch-mode specific logic
- Would complicate non-watch mode executions

### Option 2: Initialize in Core CLI (`runCLI`)
**Rejected because:**
- `runCLI` handles both watch and non-watch modes
- Would add unnecessary complexity to determine when to start Vite
- Less clear separation of concerns

### Option 3: Initialize in Test Runner
**Rejected because:**
- Test runner runs for each test execution
- Would create/destroy Vite server repeatedly
- Vite server should persist across test runs in watch mode

## Benefits of Current Approach

1. **Clean Separation**: Watch mode features in watch mode code
2. **Simple Lifecycle**: Start on entry, stop on exit
3. **Easy to Maintain**: All watch mode logic in one place
4. **Backward Compatible**: Non-watch modes unaffected
5. **Testable**: Clear boundaries for testing
6. **Extensible**: Easy to add more Vite integrations in the future

## Future Considerations

If Jest evolves to use Vite for more than watch mode (e.g., runtime replacement), the architecture might need to be reconsidered. However, for Phase 1 (watch mode only), the current approach is optimal.

## Configuration Flow

```
jest.config.ts (user config with future.experimental_vite)
    ↓
jest-config (readConfigs)
    ↓
@jest/core/cli/index.ts (contexts created)
    ↓
@jest/core/watch.ts
    ↓
ViteDevServerManager.getViteWatchModeConfig() (extract config)
    ↓
ViteDevServerManager (start server)
```

## Code Organization

- **Configuration**: `jest-config/src/getDefaultViteConfig.ts` - Default Vite config helper
- **Schema**: `jest-schemas/src/raw-types.ts` - Configuration validation
- **Manager**: `jest-core/src/ViteDevServerManager.ts` - Vite server lifecycle
- **Integration**: `jest-core/src/watch.ts` - Watch mode integration point
- **Tests**: `jest-core/src/__tests__/ViteDevServerManager.test.ts` - Unit tests
- **E2E Tests**: `e2e/__tests__/viteIntegration.test.ts` - Integration tests

This organization keeps all Vite-related code modular and easy to maintain while integrating seamlessly with Jest's existing architecture.
