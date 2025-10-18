# Vite Configuration Support - Phase Plan

This document outlines the phased approach for supporting Vite configuration options in Jest's experimental Vite integration.

## Phase 1: Core Configuration (Current Implementation)

**Goal**: Provide essential Vite options that enable basic watch mode functionality and module resolution, inspired by Vitest's testing-focused configuration.

### Supported Options

The following Vite configuration options are supported and recommended for testing (based on Vitest's proven approach):

#### Server Configuration
- **`server.deps.inline`**: Array of dependencies to inline (useful for CJS/ESM interop)
- **`server.deps.external`**: Dependencies to exclude from optimization
- **`server.deps.fallbackCJS`**: Fallback to CJS for legacy dependencies
- **`server.fs.allow`**: Restrict file system access to specific directories (security)
- **`server.fs.strict`**: Enable strict file system mode

#### Module Resolution (Critical for Testing)
- **`resolve.conditions`**: Custom export conditions (default: ['node', 'default'])
  - Common for testing: ['node', 'default', 'development']
- **`resolve.alias`**: Path aliases for module resolution (e.g., `@/` -> `./src/`)
- **`resolve.extensions`**: File extensions to resolve (default: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'])
- **`resolve.mainFields`**: Package.json fields to resolve (default: ['module', 'jsnext:main', 'jsnext'])

#### Dependency Optimization (Critical for Performance)
- **`optimizeDeps.include`**: Dependencies to pre-bundle and cache
- **`optimizeDeps.exclude`**: Dependencies to exclude from pre-bundling
- **`optimizeDeps.esbuildOptions`**: esbuild options for dependency optimization
  - `target`: ECMAScript target (e.g., 'es2020')
  - `supported`: Feature support overrides

#### Root and Base
- **`root`**: Project root directory (critical for resolving modules)
- **`base`**: Base public path when serving assets

### Built-in Features (OOTB)

The following features are **enabled by default** and don't require configuration:
- **Transform Pipeline**: Vite's fast transform pipeline for module transformation
- **Smart Test Selection**: Only run tests affected by changed files using module graph
- **HMR**: Hot Module Replacement for faster test re-runs

### Example Configuration

```typescript
import type {Config} from 'jest';

const config: Config = {
  future: {
    experimental_vite: {
      // Root directory - where Vite will resolve modules from
      root: process.cwd(),
      
      // Server configuration (for dependency handling)
      server: {
        deps: {
          // Inline dependencies that need transformation
          inline: ['some-esm-only-package'],
          // Externalize dependencies that should not be transformed
          external: ['some-native-module'],
          // Fallback to CJS for legacy dependencies
          fallbackCJS: true,
        },
        fs: {
          // Allow access to workspace root and node_modules
          allow: ['.', '../node_modules'],
          strict: false,
        },
      },
      
      // Module resolution (critical for testing)
      resolve: {
        // Export conditions for Node.js environment
        conditions: ['node', 'default', 'development'],
        // Path aliases
        alias: {
          '@': './src',
          '@tests': './tests',
        },
        // Extensions to resolve
        extensions: ['.mts', '.cts', '.ts', '.tsx', '.js', '.jsx', '.json'],
        // Package.json fields
        mainFields: ['module', 'jsnext:main', 'jsnext'],
      },
      
      // Dependency optimization (improves performance)
      optimizeDeps: {
        // Pre-bundle these dependencies
        include: ['react', 'react-dom'],
        // Don't bundle these
        exclude: ['@testing-library/react'],
        // esbuild configuration for optimization
        esbuildOptions: {
          target: 'es2020',
        },
      },
    },
  },
};

export default config;
```

## Phase 2: Plugin System and Transformations (Future)

**Goal**: Support Vite plugins and advanced transformation options.

### Planned Options

- **`plugins`**: Vite plugins for custom transformations
  - Support for common plugins like `@vitejs/plugin-react`, `@vitejs/plugin-vue`
  - Custom plugin integration
  - Plugin configuration and ordering

- **`build.sourcemap`**: Source map generation for debugging
- **`build.target`**: ECMAScript target for transformations
- **`esbuild`**: Global esbuild transformation options
  - `jsxFactory`: JSX factory function
  - `jsxFragment`: JSX fragment
  - `jsxInject`: Automatic JSX runtime injection

## Phase 3: Advanced Features (Future)

**Goal**: Support advanced Vite features for complex testing scenarios.

### Planned Options

- **`define`**: Global constant replacements
- **`css`**: CSS handling configuration
  - `modules`: CSS modules options
  - `preprocessorOptions`: CSS preprocessor options
  
- **`json`**: JSON loading configuration
- **`esbuild`**: esbuild transformation options
- **`assetsInclude`**: Additional file types to treat as assets

## Phase 4: Framework-Specific Integration (Future)

**Goal**: Provide first-class support for popular frameworks.

### Planned Support

- **React**: Pre-configured setup with `@vitejs/plugin-react`
- **Vue**: Pre-configured setup with `@vitejs/plugin-vue`
- **Svelte**: Pre-configured setup with `@sveltejs/vite-plugin-svelte`
- **Solid**: Pre-configured setup with `vite-plugin-solid`

## Phase 5: Performance Optimization (Future)

**Goal**: Enable advanced performance optimizations.

### Planned Options

- **`cacheDir`**: Cache directory configuration
- **`server.fs`**: File system restrictions and allow lists
- **`worker`**: Web worker options
- **`ssr`**: Server-side rendering configuration

## Implementation Notes

- All Vite configuration options are passed directly to Vite's `createServer` API
- Jest merges user configuration with sensible defaults for testing
- The configuration structure follows Vite's native configuration format
- Breaking changes in Vite may require updates to the integration

## Migration Path

Users can start with Phase 1 configuration and gradually add more options as they become available in future phases. The configuration structure is designed to be backward compatible.

## Feedback

We welcome feedback on which options should be prioritized for earlier phases. Please open an issue if you have specific Vite features you need for testing.
