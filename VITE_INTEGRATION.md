# Vite Integration for Jest - Phase 1

## Overview

This document describes the experimental Vite integration feature added to Jest. This is a **Phase 1** implementation that provides the foundational infrastructure for using Vite with Jest, focusing on **mode** and **define** configuration options.

## Phase 1 vs Phase 2

### Phase 1 (Current) ✅
- **Mode Integration**: Full .env file loading following Vite's specification
- **Define Integration**: Merging with Jest's globals configuration
- **Single Global Vite Server**: Lifecycle management following Vitest's pattern
- **Infrastructure**: Type system, schema validation, configuration helpers

### Phase 2 (Planned) 📋
- **Resolver Integration**: Full Vite module resolution mechanism
- **Transform Integration**: Use Vite for file transformation instead of babel/ts-jest
- **Runtime Injection**: Inject `import.meta.env` and `global.*` into test environment
- **Plugin System**: Support for Vite's plugin ecosystem

## Motivation

Vite offers fast development and build times through its use of native ES modules and efficient bundling. By integrating Vite into Jest, we aim to:

- Improve test execution performance
- Leverage Vite's module resolution and transformation capabilities
- Provide a more unified developer experience for projects already using Vite
- Support modern JavaScript/TypeScript features out of the box

## Architecture

### Core Components

1. **@jest/vite Package** (`packages/jest-vite/`)
   - Dedicated package for all Vite integration logic
   - `vite` as peer dependency (user controls version)
   - `vite-node`, `dotenv`, `dotenv-expand` as direct dependencies

2. **Type System** (`packages/jest-types/src/Config.ts`)
   - `ViteConfig`: Defines Phase 1 configuration options (mode, define, resolve)
   - `FutureConfig`: Container for experimental features

3. **Schema Validation** (`packages/jest-schemas/src/raw-types.ts`)
   - Runtime validation for Vite configuration
   - Integration with Jest's configuration validation system

4. **Configuration Helper** (`packages/jest-config/src/withViteConfig.ts`)
   - `withViteConfig()`: Type-safe helper for creating Vite configurations
   - Provides sensible defaults (e.g., mode: 'test')

5. **Integration Module** (`packages/jest-core/src/viteIntegration.ts`)
   - `initializeViteIntegration()`: Initialize global Vite server
   - `isViteEnabled()`: Check if Vite is enabled in config
   - Lifecycle management integrated into `runJest.ts`

## Usage

### Basic Usage

```typescript
// jest.config.ts
import {defineConfig, withViteConfig} from 'jest-config';

export default defineConfig({
  future: {
    experimental_vite: true, // Use default Vite configuration
  },
});
```

### Advanced Configuration (Phase 1)

```typescript
// jest.config.ts
import {defineConfig, withViteConfig} from 'jest-config';

export default defineConfig({
  globals: {
    __LEGACY_VAR__: 'from_jest',
  },
  future: {
    experimental_vite: withViteConfig({
      mode: 'test', // Loads .env.test files
      resolve: {
        alias: {
          '@': '/src',
          '@components': '/src/components',
        },
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
      },
      define: {
        __DEV__: true,
        __TEST__: true,
      },
    }),
  },
});
```

Create `.env.test` file:
```bash
# .env.test
VITE_API_URL=http://test-api.com
VITE_APP_TITLE=Test App
DB_CONNECTION=test_db
```

## Configuration Options (Phase 1)

The `ViteConfig` type currently supports these Phase 1 options:

- **`mode`** (string): Vite mode (default: 'test')
  - Loads `.env`, `.env.local`, `.env.[mode]`, `.env.[mode].local` files
  - Injects all variables into `process.env`
  - Exposes `VITE_*` prefixed variables to `import.meta.env`
  - Includes standard Vite env variables: MODE, DEV, PROD, SSR

- **`define`** (object): Global constant replacements
  - Merges with Jest's `globals` configuration
  - `define` values take precedence over `globals`
  - Variables available as `global.*` (CJS) and `import.meta.jest.*` (ESM)

- **`resolve.alias`** (object): Import path aliases (infrastructure for Phase 2)
- **`resolve.extensions`** (string[]): File extensions (infrastructure for Phase 2)

### Phase 2 Options (Planned)

These options are planned for Phase 2:
- `configFile` - Path to Vite config file
- `root` - Project root directory
- `plugins` - Vite plugins
- `css` - CSS processing options
- `esbuild` - ESBuild configuration
- `optimizeDeps` - Dependency optimization options

## Installation

To use Vite integration, install the required dependencies:

```bash
npm install --save-dev @jest/vite vite

# or with yarn
yarn add --dev @jest/vite vite
```

### Version Requirements

- `@jest/vite`: workspace (included in Jest monorepo)
- `vite`: ^5.0.0 || ^6.0.0 (peer dependency)
- `vite-node`: ^2.0.0 || ^3.0.0 (included with @jest/vite)
- `dotenv`: ^16.0.0 (included with @jest/vite)
- `dotenv-expand`: ^11.0.0 (included with @jest/vite)

## What Works in Phase 1

✅ **Mode Integration** - Full .env file loading following Vite's specification  
✅ **Define Integration** - Merging with Jest's globals configuration  
✅ **Single Global Vite Server** - Lifecycle management following Vitest's pattern  
✅ **Infrastructure** - Complete type system, validation, and configuration helpers  

## Why Resolver is Phase 2

Full Vite resolver integration requires deep architectural changes that should be done together with transform integration:

### Vite's Resolution Flow
1. **Pre-bundling Check** (dev only) - Check if module needs pre-bundling with esbuild
2. **Alias Resolution** - Apply configured aliases from resolve.alias
3. **Extension Resolution** - Try different file extensions based on resolve.extensions
4. **Index File Resolution** - Check for index files in directories
5. **Package Resolution** - For node_modules, resolve using package.json exports/main fields

### Why This Requires Phase 2

1. **Integration with jest-resolve**: Need to replace or wrap Jest's resolver
2. **Coordination with jest-runtime**: Module loading needs Vite's resolved paths
3. **Integration with jest-transform**: Resolved files need Vite transformation
4. **Plugin System Support**: Vite's plugins can affect resolution
5. **Pre-bundling Dependencies**: Requires coordination with Vite's optimization

These changes touch multiple core Jest packages (`jest-resolve`, `jest-runtime`, `jest-transform`) and should be implemented together for a cohesive solution.

### Current Resolver Status

Phase 1 includes:
- ✅ `resolveAlias()` utility function demonstrating alias resolution
- ✅ Infrastructure for Vite server with resolve configuration
- ✅ `createViteResolver()` placeholder function

Phase 2 will add:
- 📋 Integration with `jest-resolve` package
- 📋 Use of Vite's `pluginContainer.resolveId()` API
- 📋 Full resolution flow with plugins
- 📋 Pre-bundling support for dependencies

## Current Limitations (Phase 1)

This Phase 1 implementation provides runtime integration for `mode` and `define` but does not yet:

- ❌ Transform test files using Vite (Phase 2)
- ❌ Use Vite for module resolution during test execution (Phase 2)
- ❌ Inject `import.meta.env` into test files (Phase 2)
- ❌ Support HMR in watch mode (Phase 2)

These features are planned for Phase 2 when transform and resolver integration is added.

## Testing

### Unit Tests

The implementation includes comprehensive unit tests:

- `packages/jest-config/src/__tests__/withViteConfig.test.ts` (4 tests)
- `packages/jest-vite/src/__tests__/index.test.ts` (32 tests)
  - 7 tests for core functions (isViteEnabled, getViteConfig, createViteServer)
  - 6 tests for loadEnvFiles()
  - 5 tests for injectEnvVariables()
  - 5 tests for mergeDefinesAndGlobals()
  - 2 tests for createGlobalVariables()
  - 4 tests for applyDefines()
  - 5 tests for resolveAlias()
  - 2 tests for resolver utilities

Run tests with:

```bash
yarn jest packages/jest-config packages/jest-vite
```

All 36 tests passing ✅

### E2E Tests

A basic e2e test setup is available in `e2e/vite-integration/` demonstrating:
- Configuration with all Phase 1 options
- Vite server lifecycle
- Example usage patterns

## Implementation Details

### Dynamic Loading

The Vite module is loaded dynamically using vite-node for better ESM support:

```typescript
// Uses native ESM imports with vite-node
async function loadViteModule(): Promise<typeof import('vite')> {
  return await import('vite');
}
```

This approach allows:
- Peer dependency pattern (user controls Vite version)
- Better ESM support via vite-node
- TypeScript support out of the box
- No bundling issues with optional dependencies

### Mode Integration (.env files)

Following Vite's specification (https://vite.dev/guide/env-and-mode.html#modes):

```typescript
export function loadEnvFiles(rootDir: string, mode: string): EnvVariables {
  const envFiles = [
    `.env`,                // Loaded first
    `.env.local`,          // Overrides .env
    `.env.${mode}`,        // Overrides .env.local
    `.env.${mode}.local`,  // Overrides everything (highest priority)
  ];
  // Load and expand variables...
}

export function injectEnvVariables(envVars: EnvVariables, mode: string) {
  // Inject all into process.env
  // Only VITE_* exposed to import.meta.env
  // Include MODE, DEV, PROD, SSR
}
```

### Define Integration (merged with globals)

Following Vite's specification (https://vite.dev/config/shared-options.html#define):

```typescript
export function mergeDefinesAndGlobals(
  viteDefines: Record<string, unknown> | undefined,
  jestGlobals: Config.ConfigGlobals | undefined,
): Record<string, unknown> {
  const merged: Record<string, unknown> = {};
  
  // Start with Jest globals
  if (jestGlobals) Object.assign(merged, jestGlobals);
  
  // Override with Vite defines (takes precedence)
  if (viteDefines) Object.assign(merged, viteDefines);
  
  return merged;
}
```

### Type Safety

All configuration is fully typed:

```typescript
export type ViteConfig = {
  configFile?: string | false;
  root?: string;
  mode?: string;
  // ... more options
};
```

TypeScript users get full autocomplete and type checking.

## Future Roadmap

### Phase 2: Transform Integration
- Integrate Vite's transform pipeline with Jest
- Use Vite plugins for file transformation
- Support for JSX, TypeScript, and other formats

### Phase 3: Module Resolution
- Use Vite's module resolution in tests
- Support for Vite's import.meta features
- Alias resolution integration

### Phase 4: Development Server
- Integrate Vite dev server lifecycle
- HMR support in watch mode
- Faster test reruns with Vite's caching

### Phase 5: Performance Optimization
- Benchmarking and optimization
- Parallel test execution with Vite
- Memory usage optimization

## Contributing

To contribute to Vite integration:

1. Read the [Contributing Guide](CONTRIBUTING.md)
2. Understand the architecture (this document)
3. Write tests for new features
4. Update documentation

## References

- [Vite Documentation](https://vitejs.dev/)
- [tsx Documentation](https://tsx.is/)
- [Angular CLI Vite Integration](https://github.com/angular/angular-cli)
- [Vitest](https://vitest.dev/)
- [Jest Configuration](https://jestjs.io/docs/configuration)

## License

MIT - See [LICENSE](LICENSE) file for details.
