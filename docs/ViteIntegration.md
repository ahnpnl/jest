---
id: vite-integration
title: Vite Integration for Watch Mode
---

# Vite Integration for Jest Watch Mode

Jest can leverage Vite's dev server in watch mode to improve performance and developer experience. This integration is inspired by Angular CLI's approach to Vite integration.

## Overview

When enabled, Jest will start a Vite dev server alongside the watch mode process. This allows Jest to:

- Leverage Vite's module graph for efficient dependency tracking
- Use Vite's fast transform pipeline for module transformation
- Take advantage of Vite's HMR (Hot Module Replacement) capabilities
- Benefit from Vite's optimized module resolution

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

Add the `vite` configuration option to your Jest config:

```js
// jest.config.js
module.exports = {
  // ... other Jest config options
  vite: {
    enabled: true,
    // Optional: specify a custom Vite config file
    configFile: './vite.config.ts',
    // Optional: specify a custom port for the dev server
    port: 5173,
    // Optional: enable Vite transform pipeline integration
    useTransformPipeline: true,
    // Optional: enable smart test selection based on module graph
    smartTestSelection: true,
    // Optional: enable Hot Module Replacement (HMR)
    enableHMR: true,
    // Optional: additional Vite configuration
    config: {
      // Custom Vite options
    },
  },
};
```

### Configuration Options

#### `enabled`

Type: `boolean`  
Default: `false`

Enables or disables the Vite dev server in watch mode.

#### `configFile`

Type: `string`  
Optional

Path to a Vite configuration file. If specified, Jest will load this configuration and merge it with the default settings.

#### `port`

Type: `number`  
Default: `5173`

Port number for the Vite dev server. If the port is already in use, Vite will automatically try the next available port.

#### `config`

Type: `object`  
Optional

Additional Vite configuration options to merge with the default configuration. See [Vite's configuration documentation](https://vitejs.dev/config/) for available options.

#### `useTransformPipeline`

Type: `boolean`  
Default: `false`

Enables Vite's transform pipeline for module transformation. When enabled, Jest will use Vite's fast transform pipeline to transform modules, potentially improving performance.

#### `smartTestSelection`

Type: `boolean`  
Default: `false`

Enables smart test selection based on Vite's module graph. When a file changes, Jest will only run tests that depend on the changed file, significantly reducing test execution time.

#### `enableHMR`

Type: `boolean`  
Default: `false`

Enables Hot Module Replacement (HMR) support. This allows for faster test re-runs by leveraging Vite's HMR capabilities to update modules without full reloads.

## Usage

Once configured, simply run Jest in watch mode:

```bash
jest --watch
```

or

```bash
jest --watchAll
```

The Vite dev server will start automatically when watch mode is enabled, and you'll see a message indicating the server URL:

```
Vite dev server started at http://localhost:5173
```

## How It Works

1. **Initialization**: When Jest starts in watch mode with Vite integration enabled, a Vite dev server is initialized in the background.

2. **File Watching**: Jest's file watcher continues to monitor for file changes as usual.

3. **Module Invalidation**: When files change, Jest invalidates the corresponding modules in Vite's module graph, ensuring fresh transforms on the next test run.

4. **Transform Pipeline** (when `useTransformPipeline` is enabled): Jest uses Vite's fast transform pipeline to transform modules, leveraging Vite's optimized transformation and caching.

5. **Smart Test Selection** (when `smartTestSelection` is enabled): When a file changes, Jest analyzes Vite's module graph to determine which tests depend on the changed file and runs only those tests.

6. **HMR Support** (when `enableHMR` is enabled): Vite's Hot Module Replacement capabilities are leveraged to update modules without full reloads, enabling faster test re-runs.

## Limitations and Considerations

- **Experimental Feature**: This integration is in its early stages and should be considered experimental.
- **Optional Dependency**: Vite is an optional peer dependency. If Vite is not installed, Jest will continue to work normally without the integration.
- **Watch Mode Only**: This feature only works in watch mode (`--watch` or `--watchAll`).
- **Transform Pipeline**: When `useTransformPipeline` is enabled, Vite's transformations are used alongside Jest's existing transformers.
- **Smart Test Selection**: The effectiveness of `smartTestSelection` depends on how well your project's module graph is maintained in Vite.
- **HMR Compatibility**: `enableHMR` works best with projects that have clear module boundaries and minimal side effects.

## Example Configuration

Here's a complete example configuration for a TypeScript project using Vite with all features enabled:

```js
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  vite: {
    enabled: true,
    configFile: './vite.config.ts',
    // Enable all enhancement features
    useTransformPipeline: true,
    smartTestSelection: true,
    enableHMR: true,
    config: {
      resolve: {
        conditions: ['node', 'default'],
      },
    },
  },
};
```

```ts
// vite.config.ts
import {defineConfig} from 'vite';

export default defineConfig({
  plugins: [],
  test: {
    // Vite-specific test configuration
  },
});
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
