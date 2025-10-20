# GitHub Copilot Instructions for Jest Project

This document provides instructions for GitHub Copilot when working on the Jest codebase. These guidelines will help generate appropriate code suggestions that align with the project's architecture and conventions.

## Project Context

Jest is a JavaScript testing framework maintained by Meta Platforms. It's a large monorepo with 54+ packages managed using Yarn workspaces and lerna-lite.

- **Language**: TypeScript (strict mode)
- **Package Manager**: Yarn 4.10.3
- **Node Version**: ^18.14.0 || ^20.0.0 || ^22.0.0 || >=24.0.0
- **License**: MIT

## Code Style Guidelines

### TypeScript

- Always use TypeScript with strict mode enabled
- Prefer explicit return types on exported functions
- Use inline type imports: `import {type Foo} from 'bar'`
- Avoid `any` type - use `unknown` or proper types
- Enable all strict compiler options

### Formatting

```typescript
// Prettier configuration
{
  bracketSpacing: false,      // {foo: bar} not { foo: bar }
  singleQuote: true,          // 'string' not "string"
  trailingComma: 'all',       // Always add trailing commas
  arrowParens: 'avoid',       // x => x not (x) => x
  proseWrap: 'never',
}
```

### Style Rules

- Use 2 spaces for indentation (never tabs)
- Prefer 80 character line length
- Always use semicolons
- Use single quotes for strings
- Add trailing commas in arrays, objects, function parameters
- No abbreviations in variable names

### File Headers

Every source file must start with:

```typescript
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
```

## Import Guidelines

### Import Order

Organize imports in this order:

1. Node.js built-in modules
2. External npm packages
3. Internal workspace packages (`@jest/*`, `jest-*`)
4. Parent directory imports (`../`)
5. Sibling imports (`./`)

### Import Restrictions

```typescript
// ❌ NEVER do this
import fs from 'fs';
const x = global.something;

// ✅ ALWAYS do this
import fs from 'graceful-fs';
const x = globalThis.something;
```

**Rules:**

- Never import `fs` - always use `graceful-fs`
- Never use `global` - always use `globalThis`
- Use `workspace:*` for internal package dependencies

### Type Imports

```typescript
// ✅ Preferred - inline type imports
import {someFunction, type SomeType} from './module';

// ❌ Avoid - separate import statements
import type {SomeType} from './module';
import {someFunction} from './module';
```

## Package Structure

When creating or modifying packages, follow this structure:

```
packages/package-name/
├── src/
│   ├── __tests__/           # Unit tests
│   │   ├── __snapshots__/   # Snapshot files
│   │   ├── *.test.ts        # Test files
│   │   └── tsconfig.json    # Test TypeScript config
│   ├── index.ts             # Main entry point
│   └── *.ts                 # Source files
├── package.json
├── tsconfig.json
└── README.md
```

### Package.json Template

```json
{
  "name": "package-name",
  "version": "30.2.0",
  "main": "./build/index.js",
  "types": "./build/index.d.ts",
  "exports": {
    ".": {
      "types": "./build/index.d.ts",
      "require": "./build/index.js",
      "import": "./build/index.mjs",
      "default": "./build/index.js"
    },
    "./package.json": "./package.json"
  },
  "dependencies": {
    "@jest/types": "workspace:*"
  },
  "engines": {
    "node": "^18.14.0 || ^20.0.0 || ^22.0.0 || >=24.0.0"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/jestjs/jest.git",
    "directory": "packages/package-name"
  },
  "license": "MIT",
  "publishConfig": {
    "access": "public"
  }
}
```

## Testing Patterns

### Unit Tests

Located in `packages/*/src/__tests__/`:

```typescript
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {functionToTest} from '../index';

describe('functionToTest', () => {
  it('should do something', () => {
    const result = functionToTest('input');
    expect(result).toBe('expected');
  });

  it('should handle edge cases', () => {
    expect(() => functionToTest(null)).toThrow();
  });
});
```

### E2E Tests

Located in `e2e/__tests__/`:

```typescript
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {runYarnInstall} from '../Utils';
import runJest from '../runJest';

const dir = path.resolve(__dirname, '../fixture-name');

beforeAll(() => {
  runYarnInstall(dir);
});

test('description of test', () => {
  const {stdout, stderr, exitCode} = runJest(dir, ['--option']);
  expect(exitCode).toBe(0);
  expect(stderr).toMatchSnapshot();
});
```

### Snapshot Testing

```typescript
// Use snapshots for complex output
expect(complexObject).toMatchSnapshot();

// Use inline snapshots for simple values
expect(simpleValue).toMatchInlineSnapshot(`'expected value'`);
```

## Common Patterns

### Error Handling

```typescript
// ✅ Use ErrorWithStack for better stack traces
import {ErrorWithStack} from 'jest-util';

function validateInput(input: unknown): void {
  if (typeof input !== 'string') {
    throw new ErrorWithStack('Input must be a string', validateInput);
  }
}
```

### Async Operations

```typescript
// ✅ Prefer async/await over promises
async function loadConfig(path: string): Promise<Config> {
  const content = await fs.promises.readFile(path, 'utf8');
  return JSON.parse(content);
}

// ✅ Handle errors properly
try {
  const config = await loadConfig(configPath);
} catch (error) {
  throw new ErrorWithStack(
    `Failed to load config: ${error.message}`,
    loadConfig,
  );
}
```

### Type Guards

```typescript
// ✅ Use type guards for runtime checks
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function processValue(value: unknown): string {
  if (!isString(value)) {
    throw new TypeError('Expected string');
  }
  return value.toUpperCase();
}
```

### Module Exports

```typescript
// ✅ Use named exports (preferred)
export function myFunction(): void {}
export class MyClass {}
export type MyType = {};

// ⚠️ Default exports allowed for certain patterns
export default class SpecialCase {}
```

## Architecture-Specific Patterns

### Test Runner Code (jest-circus, jest-jasmine2)

```typescript
// When working with test runners, understand the event system
import type {Circus} from '@jest/types';

export const handleTestEvent = async (
  event: Circus.Event,
  state: Circus.State,
): Promise<void> => {
  switch (event.name) {
    case 'test_start':
      // Handle test start
      break;
    case 'test_done':
      // Handle test completion
      break;
  }
};
```

### Transform Code (babel-jest, jest-transform)

```typescript
// Transformers must implement the Transformer interface
import type {Transformer} from '@jest/transform';

const transformer: Transformer = {
  process(sourceText, sourcePath, options) {
    // Transform the source code
    return {
      code: transformedCode,
      map: sourceMap,
    };
  },
};

export default transformer;
```

### Environment Code (jest-environment-\*)

```typescript
// Environments must extend JestEnvironment
import {JestEnvironment} from '@jest/environment';
import type {
  EnvironmentContext,
  JestEnvironmentConfig,
} from '@jest/environment';

export default class CustomEnvironment extends JestEnvironment {
  constructor(config: JestEnvironmentConfig, context: EnvironmentContext) {
    super(config, context);
  }

  async setup(): Promise<void> {
    await super.setup();
    // Setup logic
  }

  async teardown(): Promise<void> {
    // Cleanup logic
    await super.teardown();
  }
}
```

### Reporter Code (jest-reporters)

```typescript
// Reporters must implement the Reporter interface
import type {Reporter, TestResult} from '@jest/reporters';

export default class CustomReporter implements Reporter {
  onTestResult(
    test: Test,
    testResult: TestResult,
    results: AggregatedResult,
  ): void {
    // Handle test result
  }

  onRunComplete(): void {
    // Handle run completion
  }
}
```

## Configuration Patterns

### Jest Configuration

```typescript
// jest.config.ts or jest.config.js
import type {Config} from '@jest/types';

const config: Config.InitialOptions = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': 'babel-jest',
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/__tests__/**'],
};

export default config;
```

### TypeScript Configuration

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "build"
  },
  "include": ["src/**/*"],
  "exclude": ["**/__tests__/**"]
}
```

## Performance Considerations

### Worker Pools

```typescript
// Use jest-worker for parallel processing
import {Worker} from 'jest-worker';

const worker = new Worker(require.resolve('./worker'), {
  numWorkers: 4,
  enableWorkerThreads: true,
});

const result = await worker.processFile(filePath);
await worker.end();
```

### Caching

```typescript
// Leverage caching for expensive operations
import {createHash} from 'crypto';

function getCacheKey(
  sourceText: string,
  sourcePath: string,
  options: TransformOptions,
): string {
  return createHash('md5')
    .update(sourceText)
    .update(sourcePath)
    .update(JSON.stringify(options))
    .digest('hex');
}
```

## Documentation

### JSDoc Comments

```typescript
/**
 * Processes a test file and returns the results.
 *
 * @param filePath - Path to the test file
 * @param options - Test execution options
 * @returns Promise resolving to test results
 * @throws {Error} If file cannot be read
 */
export async function processTestFile(
  filePath: string,
  options: TestOptions,
): Promise<TestResult> {
  // Implementation
}
```

### README Files

Each package should have a README.md with:

- Brief description
- Installation instructions
- Basic usage example
- API documentation link

## Common Utilities

### File System Operations

```typescript
import fs from 'graceful-fs';
import {promisify} from 'util';

// ✅ Use promisified versions
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Or use promises API directly
await fs.promises.readFile(path, 'utf8');
```

### Path Handling

```typescript
import * as path from 'path';
import slash from 'slash';

// ✅ Normalize paths for cross-platform compatibility
const normalizedPath = slash(path.resolve(dir, file));
```

### String Formatting

```typescript
import chalk from 'chalk';
import dedent from 'dedent';

// ✅ Use chalk for colored output
console.log(chalk.green('Success!'));
console.log(chalk.red('Error:'), message);

// ✅ Use dedent for multi-line strings
const message = dedent`
  This is a multi-line
  message that will be
  properly dedented
`;
```

## Debugging Patterns

### Debug Logging

```typescript
// Use conditional logging based on environment
const debug = process.env.DEBUG === 'true';

if (debug) {
  console.log('Debug info:', data);
}
```

### Error Messages

```typescript
// ✅ Provide helpful error messages
throw new Error(
  `Failed to load module "${moduleName}" from "${modulePath}". ` +
    `Make sure the module exists and is properly exported.`,
);

// ❌ Avoid vague errors
throw new Error('Module not found');
```

## Version Compatibility

### Node.js Version Checks

```typescript
import * as semver from 'semver';

if (!semver.satisfies(process.version, '>=18.14.0')) {
  throw new Error('Node.js 18.14.0 or higher is required');
}
```

### Feature Detection

```typescript
// ✅ Use feature detection over version checks
const hasWorkerThreads = typeof Worker !== 'undefined';
```

## Security Considerations

### Input Validation

```typescript
// ✅ Always validate user input
function validateConfig(config: unknown): Config {
  if (typeof config !== 'object' || config === null) {
    throw new TypeError('Config must be an object');
  }

  // Validate each field
  return config as Config;
}
```

### Path Traversal Prevention

```typescript
import * as path from 'path';

// ✅ Prevent path traversal attacks
function safeJoin(base: string, userPath: string): string {
  const resolved = path.resolve(base, userPath);
  if (!resolved.startsWith(base)) {
    throw new Error('Path traversal detected');
  }
  return resolved;
}
```

## Anti-Patterns to Avoid

```typescript
// ❌ Don't use var
var x = 1;

// ✅ Use const/let
const x = 1;
let y = 2;

// ❌ Don't use == or !=
if (x == '1') {
}

// ✅ Use === or !==
if (x === 1) {
}

// ❌ Don't ignore errors
try {
  doSomething();
} catch {}

// ✅ Handle errors properly
try {
  doSomething();
} catch (error) {
  console.error('Failed to do something:', error);
  throw error;
}

// ❌ Don't use any without good reason
function process(data: any) {}

// ✅ Use proper types
function process(data: unknown) {
  if (typeof data === 'string') {
    // Now TypeScript knows data is a string
  }
}

// ❌ Don't mutate parameters
function addItem(arr: Array<string>, item: string) {
  arr.push(item);
  return arr;
}

// ✅ Return new values
function addItem(arr: Array<string>, item: string): Array<string> {
  return [...arr, item];
}
```

## Monorepo-Specific Guidelines

### Cross-Package Dependencies

```json
{
  "dependencies": {
    "@jest/types": "workspace:*",
    "jest-util": "workspace:*"
  }
}
```

Always use `workspace:*` for internal dependencies.

### Circular Dependencies

Avoid circular dependencies between packages. If needed, extract shared code to a common package.

### Package Boundaries

Respect package boundaries - don't import from `src/` of other packages, only from their public exports.

## Testing Best Practices

### Test Organization

```typescript
describe('MyClass', () => {
  describe('constructor', () => {
    it('should initialize with default values', () => {});
    it('should accept custom options', () => {});
  });

  describe('myMethod', () => {
    it('should handle valid input', () => {});
    it('should throw on invalid input', () => {});
  });
});
```

### Test Naming

```typescript
// ✅ Descriptive test names
it('should throw TypeError when config is not an object', () => {});

// ❌ Vague test names
it('works', () => {});
it('test 1', () => {});
```

### Setup and Teardown

```typescript
describe('FileProcessor', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDirectory();
  });

  afterEach(() => {
    removeTempDirectory(tempDir);
  });

  it('should process files', () => {
    // Test uses tempDir
  });
});
```

## Build and Development

### Build Output

Packages compile to:

- `build/index.js` - CommonJS
- `build/index.mjs` - ES Modules
- `build/index.d.ts` - TypeScript definitions

### Watch Mode

When developing, use watch mode:

```bash
yarn watch  # Rebuilds on file changes
```

### Type Checking

Always ensure types are correct:

```bash
yarn typecheck
```

## Summary

When generating code for Jest:

1. **Use TypeScript** with strict mode and proper types
2. **Follow formatting rules** - 2 spaces, single quotes, trailing commas
3. **Add copyright headers** to all source files
4. **Import graceful-fs** instead of fs
5. **Use workspace:\*** for internal dependencies
6. **Write tests** for all new functionality
7. **Handle errors** with descriptive messages
8. **Document with JSDoc** for public APIs
9. **Respect package boundaries** in the monorepo
10. **Follow existing patterns** in the codebase

The Jest codebase is mature and well-structured. When in doubt, look at existing code in the same package or similar packages for patterns to follow.
