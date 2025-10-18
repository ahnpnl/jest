---
id: vite-integration-design
title: Vite Integration Design Document
---

# Vite Integration for Jest Watch Mode - Design Document

## Overview

This document describes the design and implementation of Vite dev server integration for Jest watch mode, inspired by Angular CLI's approach to leveraging Vite for improved developer experience.

## Motivation

The goal is to gradually improve Jest's watch mode performance by leveraging Vite's:
- Fast dev server with HMR (Hot Module Replacement)
- Efficient module graph for dependency tracking
- Optimized transform pipeline
- Native ESM support

This is an experimental, opt-in feature that sets the foundation for future performance optimizations without changing Jest's core runtime behavior.

## Architecture

### Core Components

#### 1. ViteDevServerManager (`packages/jest-core/src/ViteDevServerManager.ts`)

The main class responsible for managing the Vite dev server lifecycle:

```typescript
class ViteDevServerManager {
  // Start the Vite dev server
  async start(): Promise<void>
  
  // Stop the Vite dev server
  async stop(): Promise<void>
  
  // Invalidate a module in Vite's module graph
  invalidateModule(filePath: string): void
  
  // Get Vite's module graph for dependency tracking
  getModuleGraph(): any
  
  // Check if the dev server is running
  isRunning(): boolean
}
```

**Key Design Decisions:**
- **Optional Dependency**: Vite is loaded dynamically using `require()` to avoid TypeScript compilation errors
- **Graceful Degradation**: If Vite is not installed, Jest continues to work normally
- **Non-Intrusive**: The integration runs in the background without affecting Jest's test execution

#### 2. Watch Mode Integration (`packages/jest-core/src/watch.ts`)

The watch mode has been enhanced to:
1. Initialize ViteDevServerManager when watch mode starts
2. Start the Vite dev server if enabled in configuration
3. Invalidate modules in Vite's module graph when files change
4. Clean up the dev server on exit

**Integration Points:**
```typescript
// Initialize Vite dev server manager
const viteConfig = getViteWatchModeConfig(contexts[0].config);
if (viteConfig.enabled) {
  viteDevServerManager = new ViteDevServerManager(viteConfig, rootDir);
  await viteDevServerManager.start();
}

// On file change
if (viteDevServerManager?.isRunning()) {
  for (const {filePath} of validPaths) {
    viteDevServerManager.invalidateModule(filePath);
  }
}

// On exit
if (viteDevServerManager?.isRunning()) {
  await viteDevServerManager.stop();
}
```

#### 3. Configuration Schema (`packages/jest-schemas/src/raw-types.ts`)

New configuration option added to Jest's schema:

```typescript
Type.Partial(
  Type.Object({
    enabled: Type.Boolean(),
    configFile: Type.String(),
    port: Type.Number(),
    config: Type.Record(Type.String(), Type.Unknown()),
  }),
)
```

### Configuration

Users can enable Vite integration by adding the `vite` option to their Jest config:

```javascript
module.exports = {
  vite: {
    enabled: true,           // Enable Vite dev server
    configFile: './vite.config.ts',  // Optional: Vite config file
    port: 5173,              // Optional: Dev server port
    config: {                // Optional: Additional Vite config
      resolve: {
        conditions: ['node', 'default'],
      },
    },
  },
};
```

## Implementation Details

### Dynamic Vite Loading

Vite is loaded dynamically to avoid making it a hard dependency:

```typescript
private async loadVite(): Promise<any> {
  try {
    return require('vite');
  } catch {
    return null;  // Gracefully handle missing Vite
  }
}
```

### Module Invalidation

When files change, Jest invalidates them in Vite's module graph:

```typescript
invalidateModule(filePath: string): void {
  const module = this.viteDevServer.moduleGraph.getModuleById(filePath);
  if (module) {
    this.viteDevServer.moduleGraph.invalidateModule(module);
  }
}
```

This ensures that Vite's internal cache stays synchronized with Jest's file watching.

### Configuration Merging

The implementation supports multiple ways to configure Vite:
1. Using Jest's `vite.config` option
2. Loading from a separate Vite config file
3. Merging both configurations

```typescript
private async createViteConfig(): Promise<any> {
  const baseConfig = { /* base config */ };
  
  // Load user's Vite config if specified
  if (this.config.configFile) {
    const userConfig = await vite.loadConfigFromFile(/*...*/);
    return vite.mergeConfig(baseConfig, userConfig.config);
  }
  
  // Merge with inline config
  if (this.config.viteConfig) {
    return {...baseConfig, ...this.config.viteConfig};
  }
  
  return baseConfig;
}
```

## Future Enhancements

The implementation now includes the following enhancements:

1. **Transform Pipeline Integration** ✅ - Vite's transform pipeline can be used for faster module transformation when `useTransformPipeline` is enabled
2. **Smarter Test Selection** ✅ - The module graph is leveraged to determine which tests need to run when `smartTestSelection` is enabled
3. **HMR Support** ✅ - Hot Module Replacement is implemented when `enableHMR` is enabled
4. **Runtime Integration** - Future work could explore replacing Jest's runtime with Vite-powered execution

Additional future enhancements:
- Deeper integration with Vite's plugin ecosystem
- Support for Vite's SSR (Server-Side Rendering) capabilities
- Enhanced caching strategies leveraging Vite's cache
- Better integration with Vite's dev server middleware

## Limitations

Current limitations of the integration:

1. **Experimental**: This feature is in early stages and should be considered experimental
2. **Watch Mode Only**: Only works in watch mode (`--watch` or `--watchAll`)
3. **No Runtime Changes**: Jest's runtime behavior remains unchanged
4. **Optional Dependency**: Requires Vite to be manually installed

## Testing

The implementation includes comprehensive testing:

1. **Unit Tests** (`ViteDevServerManager.test.ts`):
   - Tests configuration parsing
   - Tests server lifecycle management
   - Tests graceful degradation without Vite

2. **Integration Tests** (watch mode tests):
   - Verifies watch mode still works with Vite integration
   - Tests file change handling
   - Tests cleanup on exit

3. **E2E Tests** (`viteIntegration.test.ts`):
   - Verifies configuration is recognized
   - Ensures normal Jest execution isn't broken

## Performance Considerations

The integration is designed to have minimal overhead:
- Vite server starts in the background
- Module invalidation is fast (O(1) lookup)
- No changes to test execution path
- Graceful degradation if Vite is not available

## Backward Compatibility

The implementation maintains full backward compatibility:
- Feature is opt-in (disabled by default)
- No breaking changes to existing APIs
- All existing tests pass
- Works with or without Vite installed

## References

- [Angular CLI Vite Integration](https://angular.dev/tools/cli/build-system-migration)
- [Vite Plugin System](https://vitejs.dev/guide/api-plugin.html)
- [Vite Module Graph](https://vitejs.dev/guide/api-javascript.html#modulegraph)
- [Jest Watch Mode](https://jestjs.io/docs/cli#--watch)

## Conclusion

This integration provides a foundation for improving Jest's watch mode performance by leveraging Vite's modern build tooling. The implementation is non-intrusive, backward compatible, and sets the stage for future enhancements that could significantly improve the developer experience.
