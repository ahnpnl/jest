# Vite Integration for Jest - Phase 1

## Overview

This document describes the experimental Vite integration feature added to Jest. This is a **Phase 1** implementation that provides the foundational infrastructure for using Vite with Jest.

## Motivation

Vite offers fast development and build times through its use of native ES modules and efficient bundling. By integrating Vite into Jest, we aim to:

- Improve test execution performance
- Leverage Vite's module resolution and transformation capabilities
- Provide a more unified developer experience for projects already using Vite
- Support modern JavaScript/TypeScript features out of the box

## Architecture

### Core Components

1. **Type System** (`packages/jest-types/src/Config.ts`)
   - `ViteConfig`: Defines the shape of Vite configuration options
   - `FutureConfig`: Container for experimental features

2. **Schema Validation** (`packages/jest-schemas/src/raw-types.ts`)
   - Runtime validation for Vite configuration
   - Integration with Jest's configuration validation system

3. **Configuration Helper** (`packages/jest-config/src/withViteConfig.ts`)
   - `withViteConfig()`: Type-safe helper for creating Vite configurations
   - Provides sensible defaults (e.g., mode: 'test')

4. **Integration Module** (`packages/jest-core/src/lib/viteIntegration.ts`)
   - `isViteEnabled()`: Check if Vite is enabled in config
   - `getViteConfig()`: Extract Vite config from Jest config
   - `createViteServer()`: Foundation for creating Vite dev server
   - `loadViteModule()`: Dynamic loading of Vite with tsx support

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

### Advanced Configuration

```typescript
// jest.config.ts
import {defineConfig, withViteConfig} from 'jest-config';

export default defineConfig({
  future: {
    experimental_vite: withViteConfig({
      configFile: './vite.config.ts',
      mode: 'test',
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
      plugins: [
        // Add Vite plugins here
      ],
    }),
  },
});
```

## Configuration Options

The `ViteConfig` type supports the following options:

- `configFile` (string | false): Path to Vite config file or false to disable
- `root` (string): Project root directory
- `mode` (string): Vite mode (default: 'test')
- `resolve.alias` (object): Import aliases
- `resolve.extensions` (string[]): File extensions for resolution
- `plugins` (array): Vite plugins
- `define` (object): Global constant replacements
- `css` (object): CSS processing options
- `esbuild` (object | false): ESBuild configuration
- `optimizeDeps` (object): Dependency optimization options

## Installation

To use Vite integration, install the required peer dependencies:

```bash
npm install --save-dev vite tsx

# or with yarn
yarn add --dev vite tsx
```

### Version Requirements

- `vite`: >= 5.0.0
- `tsx`: >= 4.0.0

## Current Limitations (Phase 1)

This Phase 1 implementation provides the configuration infrastructure but does not yet:

- ❌ Transform test files using Vite
- ❌ Use Vite for module resolution during test execution
- ❌ Integrate Vite dev server lifecycle with Jest
- ❌ Support HMR in watch mode

These features are planned for future phases.

## Testing

### Unit Tests

The implementation includes comprehensive unit tests:

- `packages/jest-config/src/__tests__/withViteConfig.test.ts` (4 tests)
- `packages/jest-core/src/lib/__tests__/viteIntegration.test.ts` (7 tests)

Run tests with:

```bash
yarn jest packages/jest-config packages/jest-core
```

### E2E Tests

A basic e2e test setup is available in `e2e/vite-integration/` for validation.

## Implementation Details

### Dynamic Loading

The Vite module is loaded dynamically to avoid compile-time dependencies:

```typescript
// Uses tsx for TypeScript config support
const tsxModule = await import('tsx/cjs/api');
const viteModule = tsxRequire('vite', __dirname);
```

This approach allows:
- Optional peer dependency (won't fail if not installed)
- TypeScript config file support via tsx
- No bundling issues with optional dependencies

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
