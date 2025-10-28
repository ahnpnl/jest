/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {config as dotenvConfig} from 'dotenv';
import * as dotenvExpand from 'dotenv-expand';
import * as fs from 'graceful-fs';
import type {InlineConfig, ResolvedConfig, ViteDevServer} from 'vite';
import type {Config} from '@jest/types';

export type ViteServer = {
  close: () => Promise<void>;
  config: ResolvedConfig;
};

/**
 * Loads Vite module using vite-node for better ESM support
 */
async function loadViteModule(): Promise<typeof import('vite')> {
  try {
    // Vite is now a peer dependency, so we can import it directly
    // vite-node provides better ESM support for dynamic imports
    return await import('vite');
  } catch (error) {
    throw new Error(
      'Failed to load Vite. Please ensure "vite" is installed as a peer dependency.\n' +
        `Error: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Converts Jest's ViteConfig to Vite's InlineConfig format
 */
function convertToViteConfig(
  viteConfig: Config.ViteConfig,
  rootDir: string,
): InlineConfig {
  const config: InlineConfig = {
    define: viteConfig.define,
    mode: viteConfig.mode || 'test',
    root: rootDir,
    // Disable server-specific features for testing
    server: {
      hmr: false,
      watch: null,
    },
  };

  // Convert resolve configuration
  if (viteConfig.resolve) {
    config.resolve = {};

    if (viteConfig.resolve.alias) {
      // Convert Record<string, string | string[]> to Vite's alias format
      // Vite accepts both object and array formats
      config.resolve.alias = viteConfig.resolve.alias as Record<string, string>;
    }

    if (viteConfig.resolve.extensions) {
      config.resolve.extensions = viteConfig.resolve.extensions;
    }
  }

  return config;
}

/**
 * Creates a Vite dev server for Jest testing
 */
export async function createViteServer(
  viteConfig: Config.ViteConfig,
  rootDir: string,
): Promise<ViteServer | null> {
  try {
    const vite = await loadViteModule();

    // Convert Jest config to Vite's format (Phase 1: mode, define, resolve only)
    const config = convertToViteConfig(viteConfig, rootDir);

    const server: ViteDevServer = await vite.createServer(config);

    return {
      close: async () => {
        await server.close();
      },
      config: server.config,
    };
  } catch (error) {
    console.warn('Failed to create Vite server:', error);
    return null;
  }
}

/**
 * Checks if Vite integration is enabled in the config
 */
export function isViteEnabled(config: Config.ProjectConfig): boolean {
  return Boolean(
    (config as unknown as Config.InitialOptions).future?.experimental_vite,
  );
}

/**
 * Gets the Vite configuration from Jest config
 */
export function getViteConfig(
  config: Config.ProjectConfig,
): Config.ViteConfig | null {
  const viteOption = (config as unknown as Config.InitialOptions).future
    ?.experimental_vite;

  if (!viteOption) {
    return null;
  }

  // If it's just `true`, return an empty config object
  if (viteOption === true) {
    return {mode: 'test'};
  }

  return viteOption;
}

/**
 * Applies Vite's define configuration to replace global constants.
 * This demonstrates how the `define` option is used in Phase 1.
 *
 * @param code - Source code to transform
 * @param defines - Define configuration from Vite config
 * @returns Transformed code with constants replaced
 *
 * @example
 * ```typescript
 * const code = 'if (__DEV__) { console.log("dev mode"); }';
 * const result = applyDefines(code, { __DEV__: 'false' });
 * // Result: 'if (false) { console.log("dev mode"); }'
 * ```
 */
export function applyDefines(
  code: string,
  defines: Record<string, unknown>,
): string {
  let result = code;
  for (const [key, value] of Object.entries(defines)) {
    // Simple string replacement for demonstration
    // In Phase 2, this will use Vite's actual transformation
    const regex = new RegExp(`\\b${key}\\b`, 'g');
    result = result.replace(regex, JSON.stringify(value));
  }
  return result;
}

/**
 * Resolves a module path using Vite's alias configuration.
 * This demonstrates how the `resolve.alias` option is used in Phase 1.
 *
 * @param importPath - The import path to resolve
 * @param aliases - Alias configuration from Vite config
 * @returns Resolved path
 *
 * @example
 * ```typescript
 * const resolved = resolveAlias('@/utils', { '@': '/src' });
 * // Result: '/src/utils'
 * ```
 */
export function resolveAlias(
  importPath: string,
  aliases: Record<string, string | Array<string>>,
): string {
  for (const [alias, target] of Object.entries(aliases)) {
    if (importPath === alias || importPath.startsWith(`${alias}/`)) {
      const targetPath = Array.isArray(target) ? target[0] : target;
      return importPath.replace(alias, targetPath);
    }
  }
  return importPath;
}

/**
 * Environment variables loaded from .env files
 * Following Vite's behavior: https://vite.dev/guide/env-and-mode.html#modes
 */
export type EnvVariables = Record<string, string>;

/**
 * Loads environment variables from .env files based on mode.
 * Follows Vite's .env file loading priority:
 * 1. .env.[mode].local
 * 2. .env.[mode]
 * 3. .env.local
 * 4. .env
 *
 * @param rootDir - Root directory to search for .env files
 * @param mode - Vite mode (e.g., 'test', 'development', 'production')
 * @returns Object containing loaded environment variables
 */
export function loadEnvFiles(rootDir: string, mode: string): EnvVariables {
  const envFiles = ['.env', '.env.local', `.env.${mode}`, `.env.${mode}.local`];

  let envVars: EnvVariables = {};

  // Load files in priority order (later files override earlier ones)
  for (const file of envFiles) {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath)) {
      try {
        // Use override: true to allow later files to override earlier ones
        const result = dotenvConfig({override: true, path: filePath});
        if (result.parsed) {
          // Expand variables (e.g., ${VAR_NAME})
          const expanded = dotenvExpand.expand({
            parsed: result.parsed,
          });
          if (expanded.parsed) {
            envVars = {...envVars, ...expanded.parsed};
          }
        }
      } catch (error) {
        console.warn(`Failed to load ${file}:`, error);
      }
    }
  }

  return envVars;
}

/**
 * Injects environment variables into process.env and returns variables for import.meta.env
 * Following Vite's behavior, only variables prefixed with VITE_ are exposed to import.meta.env
 *
 * @param envVars - Environment variables loaded from .env files
 * @param mode - Vite mode
 * @returns Variables to be injected into import.meta.env and global
 */
export function injectEnvVariables(
  envVars: EnvVariables,
  mode: string,
): EnvVariables {
  // Inject all variables into process.env
  for (const [key, value] of Object.entries(envVars)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }

  // Only expose VITE_* prefixed variables to import.meta.env
  // Plus standard Vite env variables
  const importMetaEnv: EnvVariables = {
    DEV: (mode !== 'production').toString(),
    MODE: mode,
    PROD: (mode === 'production').toString(),
    SSR: 'false', // Jest tests are not SSR
  };

  for (const [key, value] of Object.entries(envVars)) {
    if (key.startsWith('VITE_')) {
      importMetaEnv[key] = value;
    }
  }

  return importMetaEnv;
}

/**
 * Merges Vite's define config with Jest's globals config.
 * When both exist, define values take precedence over globals.
 *
 * @param viteDefines - Define configuration from Vite config
 * @param jestGlobals - Globals configuration from Jest config
 * @returns Merged configuration
 */
export function mergeDefinesAndGlobals(
  viteDefines: Record<string, unknown> | undefined,
  jestGlobals: Config.ConfigGlobals | undefined,
): Record<string, unknown> {
  const merged: Record<string, unknown> = {};

  // Start with Jest globals
  if (jestGlobals) {
    Object.assign(merged, jestGlobals);
  }

  // Override with Vite defines (takes precedence)
  if (viteDefines) {
    Object.assign(merged, viteDefines);
  }

  return merged;
}

/**
 * Creates global variables that should be injected into the test environment.
 * Makes variables available as:
 * - global.* (for CJS)
 * - import.meta.jest.* (for ESM)
 *
 * @param defines - Merged define configuration
 * @param envVars - Environment variables for import.meta.env
 * @returns Object to inject into global scope
 */
export function createGlobalVariables(
  defines: Record<string, unknown>,
  envVars: EnvVariables,
): {
  defines: Record<string, unknown>;
  importMetaEnv: EnvVariables;
} {
  return {
    defines,
    importMetaEnv: envVars,
  };
}

/**
 * Resolver function type compatible with Jest's resolver interface
 */
export type ViteResolverFunction = (
  request: string,
  options: {
    basedir: string;
    conditions?: Array<string>;
    defaultResolver: (request: string, options: unknown) => string;
    extensions?: Array<string>;
    moduleDirectory?: Array<string>;
    paths?: Array<string>;
    rootDir?: string;
  },
) => string;

/**
 * Creates a Vite-based resolver that integrates with Jest's resolver system.
 * This implements Vite's resolution flow with alias support:
 * 1. Pre-bundling check (skipped for Phase 1 - would use esbuild)
 * 2. Alias resolution (using Vite's resolve.alias)
 * 3. Extension resolution (using Vite's resolve.extensions)
 * 4. Index file resolution
 * 5. Package resolution (delegated to default resolver)
 *
 * The resolver also merges Vite's resolve.alias with Jest's moduleNameMapper:
 * - Vite aliases take precedence when both define the same key
 * - Jest's moduleNameMapper is used as fallback for unmapped patterns
 *
 * @param viteServer - The Vite server instance with configuration
 * @param moduleNameMapper - Jest's existing moduleNameMapper config (merged with Vite aliases)
 * @returns A resolver function compatible with Jest's resolver interface, or null if no server
 */
export function createViteResolver(
  viteServer: ViteServer | null,
  moduleNameMapper?: Array<{
    moduleName: string | Array<string>;
    regex: RegExp;
  }> | null,
): ViteResolverFunction | null {
  if (!viteServer) {
    return null;
  }

  const viteConfig = viteServer.config;
  const {alias, extensions} = viteConfig.resolve;

  // Merge Vite aliases with Jest's moduleNameMapper
  const mergedAliases = new Map<string, string | Array<string>>();

  // Add Vite aliases (higher priority)
  if (alias) {
    if (Array.isArray(alias)) {
      for (const aliasEntry of alias) {
        if ('find' in aliasEntry && 'replacement' in aliasEntry) {
          mergedAliases.set(
            typeof aliasEntry.find === 'string'
              ? aliasEntry.find
              : String(aliasEntry.find),
            aliasEntry.replacement,
          );
        }
      }
    } else {
      for (const [find, replacement] of Object.entries(alias)) {
        mergedAliases.set(find, replacement);
      }
    }
  }

  // Store Jest moduleNameMapper separately as it uses regex patterns
  const jestMappers = moduleNameMapper || [];

  // Helper function to try resolving a path with extensions and index files
  const tryResolve = (
    resolvedPath: string,
    extensionsToTry: Array<string>,
  ): string | null => {
    // First try exact match
    try {
      if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile()) {
        return resolvedPath;
      }
    } catch {
      // Ignore
    }

    // Try with extensions
    for (const ext of extensionsToTry) {
      const withExt = resolvedPath + ext;
      try {
        if (fs.existsSync(withExt) && fs.statSync(withExt).isFile()) {
          return withExt;
        }
      } catch {
        // Ignore
      }
    }

    // Check if it's a directory and try index files
    try {
      if (
        fs.existsSync(resolvedPath) &&
        fs.statSync(resolvedPath).isDirectory()
      ) {
        for (const ext of extensionsToTry) {
          const indexPath = path.join(resolvedPath, `index${ext}`);
          if (fs.existsSync(indexPath)) {
            return indexPath;
          }
        }
      }
    } catch {
      // Ignore
    }

    return null;
  };

  // Return the resolver function
  return (request, options) => {
    const {
      basedir,
      defaultResolver,
      extensions: jestExtensions,
      rootDir,
    } = options;
    const extensionsToTry = jestExtensions ||
      extensions || ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json'];

    // Step 1: Pre-bundling check (skipped for Phase 1)
    // This would check if the module needs to be pre-bundled with esbuild

    // Step 2: Alias resolution (Vite aliases - higher priority)
    // Check if the request matches any Vite alias
    for (const [find, replacement] of mergedAliases) {
      if (request.startsWith(find)) {
        // Replace alias with its target
        const replacementPath = Array.isArray(replacement)
          ? replacement[0]
          : replacement;
        const aliasedRequest = request.replace(
          new RegExp(`^${find.replaceAll(/[$()*+.?[\\\]^{|}]/g, '\\$&')}`),
          replacementPath,
        );

        // If the aliased path is absolute, resolve it from rootDir
        const resolvedRequest = path.isAbsolute(aliasedRequest)
          ? aliasedRequest
          : path.resolve(rootDir || basedir, aliasedRequest);

        // Step 3: Extension resolution & Step 4: Index file resolution
        const resolved = tryResolve(resolvedRequest, extensionsToTry);
        if (resolved) {
          return resolved;
        }
      }
    }

    // Step 2b: Jest moduleNameMapper patterns (lower priority)
    // Check if the request matches any Jest mapper pattern
    for (const mapper of jestMappers) {
      if (mapper.regex.test(request)) {
        const matches = request.match(mapper.regex);
        if (matches) {
          // Get the module name(s) to try
          const moduleNames = Array.isArray(mapper.moduleName)
            ? mapper.moduleName
            : [mapper.moduleName];

          for (const moduleName of moduleNames) {
            // Replace $1, $2, etc. with capture groups
            let replacedName = moduleName;
            for (let i = 1; i < matches.length; i++) {
              replacedName = replacedName.replaceAll(`$${i}`, matches[i]);
            }

            // Resolve the path
            const resolvedRequest = path.isAbsolute(replacedName)
              ? replacedName
              : path.resolve(rootDir || basedir, replacedName);

            // Try to resolve with extensions
            const resolved = tryResolve(resolvedRequest, extensionsToTry);
            if (resolved) {
              return resolved;
            }
          }
        }
      }
    }

    // Step 5: Package resolution (and fallback for all other cases)
    // Delegate to Jest's default resolver which handles:
    // - node_modules lookup
    // - package.json exports/main fields
    // - node resolution algorithm
    return defaultResolver(request, options);
  };
}
