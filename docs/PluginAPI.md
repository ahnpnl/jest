---
id: plugin-api
title: Plugin API
---

# Plugin API

Jest's Plugin API allows you to extend Jest's functionality by hooking into various stages of the test execution lifecycle. This API is inspired by [Vite](https://vite.dev/guide/api-plugin.html) and [Vitest](https://vitest.dev/advanced/api/plugin) plugin systems.

## Creating a Plugin

A plugin is an object that implements the `Config.Plugin` interface. The simplest plugin needs only a name:

```typescript
import type {Config} from 'jest';

export function myPlugin(): Config.Plugin {
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

### `enforce`

**Type:** `'pre' | 'post'`

Controls the order in which plugins are executed:
- `'pre'`: Run before normal plugins
- `'post'`: Run after normal plugins
- Default: Normal execution order

### `config`

**Type:** `(config: InitialOptions, context: {configPath: string | null}) => InitialOptions | Promise<InitialOptions> | void | Promise<void>`

Called before Jest configuration is normalized. This hook allows you to modify the configuration before validation and normalization.

```typescript
export function configPlugin(): Config.Plugin {
  return {
    name: 'jest:config-plugin',
    config(config, context) {
      return {
        ...config,
        testTimeout: config.testTimeout || 10000,
      };
    },
  };
}
```

### `configResolved`

**Type:** `(config: ProjectConfig, context: PluginContext) => void | Promise<void>`

Called after Jest configuration is resolved and normalized. Use this hook to react to the final configuration.

```typescript
export function configResolvedPlugin(): Config.Plugin {
  return {
    name: 'jest:config-resolved-plugin',
    configResolved(config, context) {
      console.log('Running tests in:', config.rootDir);
    },
  };
}
```

### `configureJest`

**Type:** `(context: PluginContext) => void | Promise<void>`

Called to configure Jest with access to both project and global configuration. This is the main hook for setting up your plugin.

```typescript
export function configureJestPlugin(): Config.Plugin {
  return {
    name: 'jest:configure-plugin',
    configureJest(context) {
      console.log('Project root:', context.config.rootDir);
      console.log('CI mode:', context.globalConfig.ci);
    },
  };
}
```

### `resolveId`

**Type:** `(source: string, importer: string | undefined, options: {isEntry: boolean}) => ResolveIdResult | Promise<ResolveIdResult>`

**Returns:** `{id: string; external?: boolean} | string | null | undefined`

Customize module resolution. This is useful for creating virtual modules or redirecting imports.

```typescript
export function resolvePlugin(): Config.Plugin {
  return {
    name: 'jest:resolve-plugin',
    resolveId(source, importer, options) {
      if (source === 'virtual:config') {
        return '\0virtual:config';
      }
      return null;
    },
  };
}
```

### `load`

**Type:** `(id: string) => LoadResult | Promise<LoadResult>`

**Returns:** `{code: string; map?: any} | string | null | undefined`

Load file contents. This is useful for virtual modules or custom file loading.

```typescript
export function loadPlugin(): Config.Plugin {
  return {
    name: 'jest:load-plugin',
    load(id) {
      if (id === '\0virtual:config') {
        return 'export default { version: "1.0.0" };';
      }
      return null;
    },
  };
}
```

### `transform`

**Type:** `(code: string, id: string) => TransformPluginResult | Promise<TransformPluginResult>`

**Returns:** `{code: string; map?: any} | string | null | undefined`

Transform code before it's executed. This provides a cleaner API compared to traditional Jest transformers.

```typescript
export function transformPlugin(): Config.Plugin {
  return {
    name: 'jest:transform-plugin',
    transform(code, id) {
      if (id.endsWith('.custom')) {
        return code.replace(/CUSTOM_VAR/g, '"replaced"');
      }
      return null;
    },
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

export function envPlugin(envVars: Record<string, string>): Config.Plugin {
  return {
    name: 'jest:env-plugin',
    enforce: 'pre',
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

export function myPlugin(): Config.Plugin {
  // TypeScript will provide autocomplete and type checking
  return {
    name: 'jest:my-plugin',
    configureJest(context) {
      // context.config and context.globalConfig are fully typed
    },
  };
}
```
