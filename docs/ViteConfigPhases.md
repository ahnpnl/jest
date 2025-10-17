# Vite Configuration Support - Phase Plan

This document outlines the phased approach for supporting Vite configuration options in Jest's experimental Vite integration.

## Phase 1: Core Configuration (Current Implementation)

**Goal**: Provide essential Vite options that enable basic watch mode functionality and module resolution.

### Supported Options

The following Vite configuration options are supported and recommended for testing:

#### Server Configuration
- **`server.port`**: Dev server port (default: 5173)
- **`server.strictPort`**: Whether to exit if port is already in use (default: false)
- **`server.host`**: Server host address
- **`server.hmr`**: HMR configuration (enabled by default)

#### Module Resolution
- **`resolve.conditions`**: Custom export conditions (default: ['node', 'default'])
- **`resolve.alias`**: Path aliases for module resolution
- **`resolve.extensions`**: File extensions to resolve

#### Root and Base
- **`root`**: Project root directory
- **`base`**: Base public path

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
      // Server configuration
      server: {
        port: 5173,
        strictPort: false,
      },
      
      // Module resolution
      resolve: {
        conditions: ['node', 'default'],
        alias: {
          '@': './src',
        },
      },
      
      // Root directory
      root: process.cwd(),
    },
  },
};

export default config;
```

## Phase 2: Advanced Module Handling (Future)

**Goal**: Support advanced module resolution and transformation options.

### Planned Options

- **`optimizeDeps`**: Dependency optimization configuration
  - `include`: Dependencies to pre-bundle
  - `exclude`: Dependencies to exclude from pre-bundling
  - `esbuildOptions`: esbuild options for dependency pre-bundling

- **`plugins`**: Vite plugins for custom transformations
  - Support for common plugins like `@vitejs/plugin-react`, `@vitejs/plugin-vue`
  - Custom plugin integration

- **`build.sourcemap`**: Source map generation
- **`build.target`**: Browser compatibility targets

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
