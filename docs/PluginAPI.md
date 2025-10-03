---
id: plugin-api
title: Plugin API
---

# Plugin API

:::warning

This is an experimental feature and the API may change in future releases.

:::

Jest's Plugin API allows you to extend Jest's functionality by hooking into various stages of the test execution lifecycle. This API is inspired by [Vite](https://vite.dev/guide/api-plugin.html) and [Vitest](https://vitest.dev/advanced/api/plugin) plugin systems.

## Creating a Plugin

A plugin is an object that implements the `Config.JestPlugin` interface. The simplest plugin needs only a name:

```typescript
import type {Config} from 'jest';

export function myPlugin(): Config.JestPlugin {
  return {
    name: 'jest:my-plugin',
  };
}
```

## Plugin Hooks

Plugins can implement various hooks to customize Jest's behavior:

### `name` (required)

**Type:** `string`

A unique identifier for your plugin. Convention is to use a namespace prefix like `jest:plugin-name`.

### `config`

**Type:** `(config: InitialOptions, context: {configPath: string | null}) => InitialOptions | Promise<InitialOptions> | void | Promise<void>`

Called before Jest configuration is normalized. This hook allows you to modify the configuration before validation and normalization.

```typescript
export function configPlugin(): Config.JestPlugin {
  return {
    config(config, context) {
      return {
        ...config,
        testTimeout: config.testTimeout || 10000,
      };
    },
    name: 'jest:my-plugin',
  };
}
```

### `configResolved`

**Type:** `(config: ProjectConfig, context: PluginContext) => void | Promise<void>`

Called after Jest configuration is resolved and normalized. Use this hook to react to the final configuration.

```typescript
export function configResolvedPlugin(): Config.JestPlugin {
  return {
    configResolved(config, context) {
      console.log('Running tests in:', config.rootDir);
    },
    name: 'jest:my-plugin',
  };
}
```

### `configureJest`

**Type:** `(context: PluginContext) => void | Promise<void>`

Called to configure Jest with access to both project and global configuration. This is the main hook for setting up your plugin.

```typescript
export function configureJestPlugin(): Config.JestPlugin {
  return {
    configureJest(context) {
      console.log('Project root:', context.config.rootDir);
      console.log('CI mode:', context.globalConfig.ci);
    },
    name: 'jest:my-plugin',
  };
}
```

### `transform`

**Type:** `(code: string, id: string) => TransformPluginResult | Promise<TransformPluginResult>`

**Returns:** `{code: string; map?: any} | string | null | undefined`

Transform code before it's executed. This provides a cleaner API compared to traditional Jest transformers.

```typescript
export function transformPlugin(): Config.JestPlugin {
  return {
    name: 'jest:transform-plugin',
    transform(code, id) {
      if (id.endsWith('.custom')) {
        return code.replaceAll('CUSTOM_VAR', '"replaced"');
      }
      return null;
    },
  };
}
```

### Watch Mode Hooks

The Plugin API unifies Jest's watch plugin functionality, allowing plugins to provide interactive watch mode features alongside configuration and transformation capabilities.

#### `subscribeToWatchMode`

**Type:** `(hooks: JestPluginHookSubscriber) => void`

Subscribe to Jest's watch mode lifecycle events. The `hooks` object provides:

- `onFileChange(fn)` - Called when files change
- `onTestRunComplete(fn)` - Called after each test run
- `shouldRunTestSuite(fn)` - Filter which test suites should run

```typescript
export function watchPlugin(): Config.JestPlugin {
  return {
    name: 'jest:watch-plugin',
    subscribeToWatchMode(jestHooks) {
      jestHooks.onTestRunComplete(results => {
        console.log('Tests completed:', results.numPassedTests);
      });
      
      jestHooks.shouldRunTestSuite(testInfo => {
        return testInfo.testPath.includes('important');
      });
    },
  };
}
```

#### `getUsageInfo`

**Type:** `(globalConfig: GlobalConfig) => {key: string; prompt: string} | null`

Define an interactive key binding for watch mode menu. Returns the key and prompt text to display.

```typescript
export function interactivePlugin(): Config.JestPlugin {
  return {
    getUsageInfo(globalConfig) {
      return {
        key: 'x',
        prompt: 'run custom action',
      };
    },
    name: 'jest:interactive-plugin',
  };
}
```

#### `executeInteractiveAction`

**Type:** `(globalConfig: GlobalConfig, updateConfigAndRun: UpdateConfigCallback) => Promise<void | boolean>`

Called when the user presses the key defined in `getUsageInfo`. Use `updateConfigAndRun` to trigger a new test run with modified configuration.

```typescript
export function customRunPlugin(): Config.JestPlugin {
  return {
    name: 'jest:custom-run-plugin',
    getUsageInfo() {
      return {key: 't', prompt: 'run only tests with TODO'};
    },
    executeInteractiveAction(globalConfig, updateConfigAndRun) {
      updateConfigAndRun({
        testNamePattern: 'TODO',
      });
      return Promise.resolve();
    },
  };
}
```

#### `onKey`

**Type:** `(value: string) => void`

Called for every key press in watch mode (when `getUsageInfo` is defined). Use this for custom key handling logic.

```typescript
export function keyHandlerPlugin(): Config.JestPlugin {
  return {
    getUsageInfo() {
      return {key: 'c', prompt: 'custom key handler'};
    },
    name: 'jest:key-handler-plugin',
    onKey(key) {
      console.log('Key pressed:', key);
    },
  };
}
```

### Migrating from Watch Plugins

Existing watch plugins can be migrated to the unified Plugin API by:

1. Changing `watchPlugins` to `plugins` in your configuration
2. Adding a `name` field to your plugin
3. Renaming hook methods:
   - `apply` → `subscribeToWatchMode`
   - `run` → `executeInteractiveAction`
   - `getUsageInfo` and `onKey` remain the same

**Before:**
```javascript
// jest.config.js
module.exports = {
  watchPlugins: ['my-watch-plugin'],
};

// my-watch-plugin.js
class MyWatchPlugin {
  apply(jestHooks) { /* ... */ }
  getUsageInfo() { /* ... */ }
  run() { /* ... */ }
}
```

**After:**
```javascript
// jest.config.js
module.exports = {
  plugins: ['my-plugin'],
};

// my-plugin.js
export function myPlugin() {
  return {
    name: 'jest:my-plugin',
    subscribeToWatchMode(jestHooks) { /* ... */ },
    getUsageInfo() { /* ... */ },
    executeInteractiveAction() { /* ... */ },
  };
}
```

## Plugin Context

The `PluginContext` object passed to hooks contains:

```typescript
interface PluginContext {
  config: ProjectConfig;    // The project configuration
  globalConfig: GlobalConfig;  // The global Jest configuration
}
```

## Using Plugins

Add plugins to your Jest configuration:

```typescript
import type {Config} from 'jest';
import {myPlugin} from './plugins/myPlugin';

const config: Config = {
  plugins: [
    myPlugin(),
  ],
};

export default config;
```

## Example: Environment Variable Plugin

Here's a complete example of a plugin that injects environment variables into tests:

```typescript
import type {Config} from 'jest';

export function envPlugin(envVars: Record<string, string>): Config.JestPlugin {
  return {
    config(config) {
      // Add environment variables to globals
      return {
        ...config,
        globals: {
          ...config.globals,
          __ENV__: envVars,
        },
      };
    },
    configureJest(context) {
      console.log('Environment variables configured');
    },
    name: 'jest:env-plugin',
  };
}

// Usage:
const config: Config = {
  plugins: [
    envPlugin({
      API_URL: 'https://api.example.com',
      DEBUG: 'true',
    }),
  ],
};
```

## Best Practices

1. **Use descriptive names**: Prefix your plugin name with a namespace (e.g., `jest:my-plugin`)
2. **Return values when modifying**: In hooks like `config` and `transform`, return the modified value or `null`/`undefined` to skip
3. **Handle errors gracefully**: Wrap plugin logic in try-catch blocks
4. **Keep plugins focused**: Each plugin should have a single, clear responsibility
5. **Document your plugins**: Provide clear documentation about what your plugin does and how to configure it

## TypeScript Support

The Plugin API is fully typed. Import the types from `@jest/types`:

```typescript
import type {Config} from '@jest/types';

export function myPlugin(): Config.JestPlugin {
  // TypeScript will provide autocomplete and type checking
  return {
    name: 'jest:my-plugin',
    configureJest(context) {
      // context.config and context.globalConfig are fully typed
    },
  };
}
```
