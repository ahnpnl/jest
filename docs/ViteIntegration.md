---
id: vite-integration
title: Vite Integration for Jest
---

# Vite Integration for Jest

Jest can leverage Vite's dev server in both watch and non-watch modes to improve performance and developer experience. This integration is inspired by Angular CLI's approach to Vite integration.

## Overview

When enabled, Jest will start a Vite dev server alongside the test execution process. This allows Jest to:

- Leverage Vite's module graph for efficient dependency tracking
- Use Vite's fast transform pipeline for module transformation
- Take advantage of Vite's HMR (Hot Module Replacement) capabilities (watch mode)
- Benefit from Vite's optimized module resolution

### Execution Modes

**Watch Mode** (`jest --watch` or `jest --watchAll`):
- Vite server runs throughout the watch session
- HMR enables fast test re-runs on file changes
- Smart test selection runs only affected tests
- Server persists across multiple test runs

**Non-Watch Mode** (`jest`):
- Vite server starts before test execution
- Transform pipeline accelerates module transformation
- Module graph provides dependency insights
- Server stops after tests complete

## Installation

To use Vite integration, you need to install Vite as a peer dependency:

```bash
npm install --save-dev vite
```

or with yarn:

```bash
yarn add --dev vite
```

## Configuration

Add the `future.experimental_vite` configuration option to your Jest config. 

### Using the Default Config Helper (Recommended)

Jest provides a `defineViteConfig()` helper that returns sensible defaults for testing:

```typescript
// jest.config.ts
import type {Config} from 'jest';
import {defineViteConfig} from 'jest-config';

const config: Config = {
  // ... other Jest config options
  future: {
    experimental_vite: defineViteConfig(),
  },
};

export default config;
```

### Custom Configuration

You can also provide your own Vite configuration inspired by Vitest's testing-focused approach:

```typescript
// jest.config.ts
import type {Config} from 'jest';

const config: Config = {
  // ... other Jest config options
  future: {
    experimental_vite: {
      // Root directory for module resolution
      root: process.cwd(),
      
      // Server configuration for dependency handling
      server: {
        deps: {
          // Inline ESM dependencies that need transformation
          inline: ['some-esm-package'],
          // Fallback to CJS for legacy dependencies
          fallbackCJS: true,
        },
        fs: {
          // File system access configuration
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
        },
        // Extensions to resolve
        extensions: ['.mts', '.cts', '.ts', '.tsx', '.js', '.jsx', '.json'],
      },
      
      // Dependency optimization for performance
      optimizeDeps: {
        // Pre-bundle these dependencies
        include: ['react', 'react-dom'],
        // Exclude from bundling
        exclude: [],
      },
    },
  },
};

export default config;
```

### Extending the Default Config

You can also extend the default config with your custom options:

```typescript
// jest.config.ts
import type {Config} from 'jest';
import {defineViteConfig} from 'jest-config';

const defaultViteConfig = defineViteConfig();

const config: Config = {
  // ... other Jest config options
  future: {
    experimental_vite: {
      ...defaultViteConfig,
      // Override or add custom options
      server: {
        ...defaultViteConfig.server,
        deps: {
          ...defaultViteConfig.server.deps,
          inline: ['my-esm-package'], // Add your packages
        },
      },
      resolve: {
        ...defaultViteConfig.resolve,
        alias: {
          '@': './src', // Add your aliases
        },
      },
    },
  },
};

export default config;
```

### Built-in Features

The following features are **enabled automatically** when you use Vite integration:

#### Available in Both Modes

- **Transform Pipeline**: Uses Vite's fast transform pipeline for module transformation
- **Module Graph**: Dependency tracking and insights

#### Watch Mode Only

- **Smart Test Selection**: Only runs tests affected by changed files using Vite's module graph
- **HMR (Hot Module Replacement)**: Enables faster test re-runs without full reloads

### Configuration Options

The `experimental_vite` option accepts any Vite configuration that would be passed to Vite's `createServer` API. Jest merges your configuration with sensible defaults optimized for testing.

#### Phase 1 Options (Vitest-Inspired)

##### Server Configuration

**`server.deps.inline`** (string[] | RegExp[])
Dependencies to inline and transform. Useful for ESM-only packages.

**`server.deps.external`** (string[] | RegExp[])
Dependencies to externalize and not transform.

**`server.deps.fallbackCJS`** (boolean, default: false)
Fallback to CJS for dependencies that fail ESM transformation.

**`server.fs.allow`** (string[])
Directories allowed for file system access.

**`server.fs.strict`** (boolean, default: true)
Enable strict file system mode for security.

##### Module Resolution (Critical for Testing)

**`resolve.conditions`** (string[], default: ['node', 'default'])
Export conditions for module resolution. Common for testing: `['node', 'default', 'development']`.

**`resolve.alias`** (Record<string, string>)
Path aliases for module resolution (e.g., `'@': './src'`).

**`resolve.extensions`** (string[])
File extensions to resolve. Default: `['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json']`.

**`resolve.mainFields`** (string[])
Package.json fields to resolve. Default: `['module', 'jsnext:main', 'jsnext']`.

##### Dependency Optimization

**`optimizeDeps.include`** (string[])
Dependencies to pre-bundle and cache for better performance.

**`optimizeDeps.exclude`** (string[])
Dependencies to exclude from pre-bundling.

**`optimizeDeps.esbuildOptions`** (object)
esbuild options for dependency optimization (e.g., `target: 'es2020'`).

##### Root and Base

**`root`** (string)
Project root directory for module resolution (default: current working directory).

**`base`** (string)
Base public path when serving assets.

For a complete list of available options and phased rollout plan, see [Vite Configuration Phases](./ViteConfigPhases.md).

## Usage

Once configured, the Vite integration works seamlessly in both modes:

### Non-Watch Mode

```bash
jest
```

The Vite dev server will start before test execution and stop after tests complete. You'll see messages indicating the server lifecycle:

```
Vite dev server started at http://localhost:5173 (test mode)
...tests run...
Vite dev server stopped
```

### Watch Mode

```bash
jest --watch
```

or

```bash
jest --watchAll
```

The Vite dev server will start when watch mode is enabled and persist throughout the session:

```
Vite dev server started at http://localhost:5173 (watch mode)
```

## How It Works

### Non-Watch Mode

1. **Initialization**: Jest detects Vite configuration and initializes the server before test execution
2. **Test Execution**: Tests run with Vite's transform pipeline and module graph available
3. **Cleanup**: Server stops automatically after tests complete

### Watch Mode

1. **Initialization**: When Jest starts in watch mode with Vite integration enabled, a Vite dev server is initialized in the background.

2. **File Watching**: Jest's file watcher continues to monitor for file changes as usual.

3. **Module Invalidation**: When files change, Jest invalidates the corresponding modules in Vite's module graph, ensuring fresh transforms on the next test run.

4. **Transform Pipeline**: Jest automatically uses Vite's fast transform pipeline to transform modules, leveraging Vite's optimized transformation and caching.

5. **Smart Test Selection**: When a file changes, Jest automatically analyzes Vite's module graph to determine which tests depend on the changed file and runs only those tests.

6. **HMR Support**: Vite's Hot Module Replacement capabilities are automatically leveraged to update modules without full reloads, enabling faster test re-runs.

## Limitations and Considerations

- **Experimental Feature**: This integration is in its early stages and should be considered experimental.
- **Optional Dependency**: Vite is an optional peer dependency. If Vite is not installed, Jest will continue to work normally without the integration.
- **Supports Both Modes**: Works in both regular test mode and watch mode (`--watch` or `--watchAll`).
- **ESM Support**: The integration uses dynamic `import()` to load Vite. For best results, configure Jest with ESM support as described in the [Jest ESM documentation](https://jestjs.io/docs/ecmascript-modules).

## Example Configuration

Here's a complete example configuration for a TypeScript project using Vite:

```typescript
// jest.config.ts
import type {Config} from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  // @ts-expect-error - experimental_vite is not yet in official types
  future: {
    experimental_vite: {
      // Server configuration
      server: {
        port: 5173,
      },
      
      // Module resolution - matches Jest's behavior
      resolve: {
        conditions: ['node', 'default'],
        alias: {
          '@': './src',
        },
      },
    },
  },
};

export default config;
```

## Troubleshooting

### Vite Server Fails to Start

If you see errors about Vite failing to start:

1. Ensure Vite is installed: `npm install --save-dev vite`
2. Check if the specified port is available
3. Verify your Vite configuration file is valid
4. Check the console output for specific error messages

### Performance Issues

If you experience performance issues with the integration enabled:

1. Try adjusting the `port` configuration
2. Review your Vite configuration for potentially expensive operations
3. Consider disabling the integration if it doesn't provide benefits for your use case

### Integration Not Working

If the Vite integration doesn't seem to be working:

1. Ensure you're running Jest in watch mode (`--watch` or `--watchAll`)
2. Verify `vite.enabled` is set to `true` in your Jest configuration
3. Check that Vite is properly installed as a dependency
4. Review the console output for any error messages

## Related Resources

- [Jest Watch Mode](./WatchPlugins.md)
- [Vite Documentation](https://vitejs.dev/)
- [Jest Configuration](./Configuration.md)
