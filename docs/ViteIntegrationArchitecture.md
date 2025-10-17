# Vite Integration Architecture

This document explains the architectural decisions for integrating Vite dev server into Jest for both watch and non-watch modes.

## Architecture Overview

The Vite integration follows Jest's existing architecture patterns and integrates at the appropriate layers for watch mode and non-watch mode functionality.

### Component Hierarchy

```
jest-cli (bin/jest.js)
    ↓
jest-cli/src/run.ts (buildArgv, run)
    ↓
@jest/core/cli/index.ts (runCLI)
    ↓
    ├─→ @jest/core/watch.ts (watch function) ← Vite server for watch mode
    │       ↓
    │   @jest/core/runJest.ts (test execution in watch mode)
    │
    └─→ @jest/core/runJest.ts (test execution) ← Vite server for non-watch mode
```

## Dual Mode Support

### Watch Mode Integration (`watch.ts`)

The Vite dev server for watch mode is initialized in `watch.ts` because:

#### 1. **Watch Mode Specific Features**

The watch mode integration provides features that only make sense in watch mode:
- **HMR (Hot Module Replacement)**: Updates modules without full reloads between test runs
- **Smart Test Selection**: Only runs tests affected by file changes
- **Persistent Server**: Runs throughout the watch session for optimal performance

#### 2. **Follows Jest's Existing Patterns**

Jest already initializes watch-mode specific features in `watch.ts`:
- `TestWatcher` instance
- File watching mechanisms
- Interactive prompt handlers
- Watch mode UI

The Vite dev server fits naturally into this pattern as another watch-mode specific service.

#### 3. **Access to Required Context**

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

#### 4. **Lifecycle Management**

The `watch()` function manages the entire watch mode lifecycle:
- Initialization
- File change handling  
- Cleanup on exit

This makes it the ideal place to manage the Vite dev server lifecycle, ensuring:
- Server starts when watch mode begins
- Modules are invalidated on file changes
- Server is properly stopped when watch mode ends

### Non-Watch Mode Integration (`runJest.ts`)

The Vite dev server for non-watch mode is initialized in `runJest.ts` because:

#### 1. **Test Execution Lifecycle**

The non-watch mode integration provides:
- **Transform Pipeline**: Fast module transformation during test execution
- **Module Graph**: Dependency tracking for test analysis
- **Scoped Lifecycle**: Server starts before tests, stops after completion

#### 2. **Similar to globalSetup/globalTeardown**

Jest already has a pattern for services that run around test execution:
- `globalSetup` runs before tests
- `globalTeardown` runs after tests
- Vite server follows the same pattern: start → tests → stop

#### 3. **Access to Test Context**

The `runJest()` function has access to:
- All test contexts
- Test configurations
- Test sequencer
- Test scheduler

This allows Vite to be initialized with the correct project configuration.

#### 4. **Clean Separation**

Non-watch mode lifecycle is simple and linear:
```
1. Initialize (Vite server starts)
2. Run tests
3. Cleanup (Vite server stops)
```

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

**Jest + Vite Architecture (Watch Mode):**
```
jest CLI
    ↓
Jest core (watch mode)
    ↓
Vite dev server (auxiliary service)
    ↓
Jest test runner (unchanged)
```

**Jest + Vite Architecture (Non-Watch Mode):**
```
jest CLI
    ↓
Jest core (runJest)
    ↓
Vite dev server (lifecycle service)
    ↓
Jest test runner (unchanged)
```

Jest maintains its existing test runner and only uses Vite as an auxiliary/lifecycle service for:
- Fast module transformation
- Module graph for dependency tracking
- HMR capabilities (watch mode only)
- Smart test selection (watch mode only)

This approach allows Jest to leverage Vite's performance benefits while maintaining backward compatibility and Jest's proven test execution model.

## Alternative Approaches Considered

### Option 1: Initialize in CLI Layer
**Rejected because:**
- Would require passing Vite server instance through multiple layers
- CLI layer doesn't have mode-specific logic
- Would complicate the separation of concerns

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
