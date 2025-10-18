# Investigation: Replacing Watch Logic with Vite Dev Server

## Overview

This document investigates the possibility of replacing Jest's existing watch mode logic with Vite dev server functionality when `experimental_vite` is enabled.

## Current Architecture

### Jest's Watch Mode (packages/jest-core/src/watch.ts)

The current watch mode implementation:

1. **File Watching**: Uses `jest-haste-map` to watch file changes
2. **Test Selection**: Uses `SearchSource` to find and select tests
3. **Interactive Prompts**: Provides interactive UI for filtering tests
4. **Test Execution**: Calls `runJest()` to execute selected tests
5. **Plugin System**: Supports watch plugins for extensibility

### Vite Integration (Current)

The current Vite integration is **non-intrusive**:

```typescript
// In watch.ts
if (isViteEnabled(contexts[0].config)) {
  const viteConfig = resolveViteConfig(contexts[0].config);
  viteDevServerManager = new ViteDevServerManager(viteConfig, rootDir);
  await viteDevServerManager.start();
  viteDevServerManager.setupHMR();
}

// On file change
if (viteDevServerManager) {
  viteDevServerManager.invalidateModule(changedFile);
}
```

**What it does**:
- Starts Vite dev server alongside Jest's watch mode
- Invalidates modules in Vite's module graph when files change
- Provides transform pipeline and module graph for potential future use

**What it doesn't do**:
- Replace file watching
- Replace test selection
- Replace test execution
- Replace interactive UI

## Proposed Enhancement

Replace Jest's watch logic with Vite when `experimental_vite` is enabled:

```typescript
export default async function watch(...args) {
  const isExperimentalViteEnabled = contexts[0].config?.future?.experimental_vite;
  
  if (isExperimentalViteEnabled) {
    // NEW: Use Vite-based watch mode
    return watchWithVite(initialGlobalConfig, contexts, ...);
  } else {
    // EXISTING: Use Jest's traditional watch mode
    return watchWithJest(initialGlobalConfig, contexts, ...);
  }
}
```

## Analysis

### What Could Be Replaced

#### 1. File Watching

**Current**: Jest uses `jest-haste-map` which uses:
- `fb-watchman` on macOS/Linux
- `fsevents` on macOS
- `node:fs.watch` fallback

**Vite Alternative**: Vite uses `chokidar` for file watching

**Feasibility**: ✅ Possible
- Vite's file watcher could replace Jest's
- Would need to map Vite's file change events to Jest's test discovery

#### 2. Module Resolution

**Current**: Jest uses `jest-resolve` and `jest-haste-map`

**Vite Alternative**: Vite has its own module resolution

**Feasibility**: ⚠️ Complex
- Vite's module resolution is optimized for bundling, not testing
- Jest's module resolution supports mocking, which is critical for testing
- Would require significant refactoring

#### 3. Transform Pipeline

**Current**: Jest uses transformers (Babel, ts-jest, etc.)

**Vite Alternative**: Vite uses esbuild and plugins

**Feasibility**: ✅ Possible (already partially done)
- `ViteDevServerManager.transformFile()` already uses Vite's transform
- Could be integrated deeper into Jest's runtime

#### 4. HMR for Test Re-runs

**Current**: Jest re-runs tests from scratch on file changes

**Vite Alternative**: Use Vite's HMR to update modules without full reload

**Feasibility**: ⚠️ Very Complex
- Tests need fresh state for isolation
- HMR's module update mechanism doesn't align with test isolation needs
- Could cause flaky tests

### What Should NOT Be Replaced

#### 1. Test Discovery and Selection

Jest's `SearchSource` is specifically designed for finding and selecting tests. Vite has no equivalent functionality.

**Verdict**: Keep Jest's test discovery

#### 2. Test Execution

Jest's test runner and environment setup is core to its functionality. Vite is not a test runner.

**Verdict**: Keep Jest's test execution

#### 3. Interactive UI

Jest's watch mode UI with keyboard shortcuts and plugins is a key feature.

**Verdict**: Keep Jest's interactive UI

#### 4. Mocking System

Jest's module mocking is essential for testing and has no Vite equivalent.

**Verdict**: Keep Jest's mocking system

## Recommendations

### Phase 2 (Current): Non-Intrusive Integration ✅

**Status**: Implemented

- Vite dev server runs alongside Jest
- Module invalidation on file changes
- Transform pipeline available for future use
- No disruption to existing functionality

### Phase 3 (Near-term): Selective Integration

**Recommendation**: Use Vite for specific tasks while keeping Jest's core:

1. **File Watching**: Optionally use Vite's file watcher
   ```typescript
   const watcher = viteDevServer.watcher;
   watcher.on('change', (file) => {
     // Trigger Jest's test discovery and execution
   });
   ```

2. **Transform Pipeline**: Use Vite transforms for faster module transformation
   ```typescript
   // In Jest runtime
   if (viteDevServerManager) {
     const transformed = await viteDevServerManager.transformFile(filePath);
     if (transformed) return transformed;
   }
   // Fallback to Jest transformer
   ```

3. **Smart Test Selection**: Use Vite's module graph
   ```typescript
   const affectedTests = await viteDevServerManager.getAffectedTests(
     changedFile,
     allTests
   );
   // Run only affected tests
   ```

### Phase 4+ (Future): Deep Integration

**Scope**: Research project, not immediate implementation

- Custom Vite plugin for Jest runtime integration
- Vite-powered module resolution with Jest compatibility layer
- Hybrid transform pipeline (Vite for speed, Jest for compatibility)

## Technical Constraints

### 1. Jest's Runtime Model

Jest has a sandboxed runtime for each test file with:
- Fresh globals for isolation
- Module mocking
- Coverage instrumentation
- Custom environment (jsdom, node, etc.)

**Constraint**: Vite's dev server model doesn't align with test isolation needs

### 2. Backward Compatibility

Any changes must not break existing Jest functionality:
- Existing tests must continue to work
- Transformers must continue to work
- Mocks must continue to work
- Snapshots must continue to work

**Constraint**: Complete replacement is too risky

### 3. Developer Experience

Users expect Jest's watch mode UI and features:
- Interactive test filtering
- Coverage reports
- Clear error messages
- Watch plugins

**Constraint**: Must preserve existing DX

## Conclusion

### Recommendation: Incremental Integration

**DO NOT** replace Jest's watch logic wholesale. Instead:

1. **Phase 2 (Current)** ✅: Non-intrusive integration
   - Vite runs alongside Jest
   - Provides infrastructure for future enhancements
   - Zero risk to existing functionality

2. **Phase 3** (Proposed): Selective feature integration
   - Use Vite's file watcher (optional)
   - Use Vite's transform pipeline for speed
   - Use Vite's module graph for smart test selection
   - Keep all of Jest's core functionality

3. **Phase 4+**: Research deeper integration
   - Custom Vite plugins for Jest
   - Hybrid runtime model
   - Based on real-world feedback from Phase 2-3

### Rationale

1. **Risk Management**: Incremental approach reduces risk of breaking changes
2. **User Feedback**: Gather feedback on Phase 2 before deeper changes
3. **Compatibility**: Preserve Jest's core strengths (mocking, isolation, DX)
4. **Performance**: Get performance benefits without compromising reliability
5. **Maintainability**: Smaller, focused changes are easier to maintain

### Implementation Strategy

For Phase 3 (future work):

```typescript
export default async function watch(...args) {
  // ... existing setup ...
  
  const viteEnabled = isViteEnabled(contexts[0].config);
  
  if (viteEnabled) {
    // Use Vite's capabilities where beneficial
    const viteManager = await setupViteIntegration(contexts[0]);
    
    // Use Vite's file watcher
    const watcher = viteManager.getWatcher();
    
    // Use Vite for transforms (fallback to Jest transformers)
    // Use Vite's module graph for smart test selection
    // Keep Jest's test discovery, execution, UI, and mocking
  }
  
  // All existing Jest watch mode logic continues to work
}
```

## Status

- [x] Investigation completed
- [x] Decision: Incremental integration, not wholesale replacement
- [ ] Phase 3 implementation (future work)
- [ ] Gather Phase 2 feedback first

## References

- Vitest architecture: https://github.com/vitest-dev/vitest
- Jest watch mode: `packages/jest-core/src/watch.ts`
- Vite dev server API: https://vitejs.dev/guide/api-javascript.html#vitedevserver
