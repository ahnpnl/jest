# Jest Project Rules for Cursor Agents

This document provides comprehensive rules and guidelines for Cursor agents working on the Jest project. Understanding these rules will help you navigate the codebase, make appropriate changes, and follow the project's conventions.

## Project Overview

Jest is a delightful JavaScript testing framework with a focus on simplicity. It's a large-scale monorepo managed with Yarn workspaces and lerna-lite.

- **Repository**: https://github.com/jestjs/jest
- **License**: MIT
- **Maintainer**: Meta Platforms, Inc. and affiliates
- **Current Version**: 30.2.0 (as of this document)

## Project Structure

### 1. Monorepo Architecture

Jest uses a **monorepo structure** with Yarn workspaces:

```
jest/
├── packages/           # 54+ individual packages
├── e2e/               # End-to-end integration tests
├── examples/          # Example projects (Angular, React Native, etc.)
├── docs/              # Documentation source files
├── website/           # Docusaurus-based documentation website
├── scripts/           # Build and maintenance scripts
└── benchmarks/        # Performance benchmarks
```

### 2. Key Packages

The project consists of 54+ packages in the `packages/` directory. Key packages include:

**Core Packages:**

- `jest` - Main package that users install
- `jest-cli` - Command-line interface (entry point: `bin/jest.js`)
- `jest-core` - Core orchestration logic
- `jest-config` - Configuration handling
- `jest-runtime` - Test runtime environment
- `jest-circus` - Default test runner (replaces jest-jasmine2)
- `jest-jasmine2` - Legacy Jasmine-based test runner

**Testing Infrastructure:**

- `expect` - Assertion library
- `jest-snapshot` - Snapshot testing
- `jest-mock` - Mocking utilities
- `jest-matcher-utils` - Utilities for matchers
- `jest-message-util` - Error message formatting

**Build & Transform:**

- `babel-jest` - Babel transformer
- `jest-transform` - File transformation system
- `babel-plugin-jest-hoist` - Hoists jest.mock calls

**Utilities:**

- `jest-util` - General utilities
- `jest-validate` - Configuration validation
- `jest-worker` - Worker pool for parallel execution
- `pretty-format` - Object formatting
- `diff-sequences` - Diff algorithm

**Environment:**

- `jest-environment` - Base environment interface
- `jest-environment-node` - Node.js environment
- `jest-environment-jsdom` - Browser-like environment

### 3. Package Structure

Each package follows a consistent structure:

```
packages/package-name/
├── src/                    # TypeScript source code
│   ├── __tests__/         # Unit tests for this package
│   │   ├── __snapshots__/ # Snapshot files
│   │   └── tsconfig.json  # Test-specific TypeScript config
│   └── index.ts           # Main entry point
├── build/                  # Compiled JavaScript (gitignored)
├── package.json           # Package metadata
├── tsconfig.json          # TypeScript configuration
└── api-extractor.json     # API documentation config
```

## Development Workflow

### 1. Prerequisites

- **Node.js**: ^18.14.0 || ^20.0.0 || ^22.0.0 || >=24.0.0
- **Yarn**: 4.10.3 (managed via corepack)
- **Python**: Required for node-gyp during installation
- **Mercurial (hg)**: Optional, needed for some tests

### 2. Setup Commands

```bash
# Enable corepack for Yarn
corepack enable

# Install dependencies
yarn install

# Build all packages
yarn build

# Build steps breakdown:
yarn build:js    # Compile JS with webpack
yarn build:ts    # Compile TypeScript
yarn bundle:ts   # Bundle type definitions
```

### 3. Development Commands

```bash
# Run tests
yarn test                    # Run all tests (lint + jest)
yarn jest                    # Run Jest tests only
yarn jest --watch            # Watch mode

# Run specific tests
yarn jest <pattern>          # Run tests matching pattern
yarn jest packages/jest-core # Run tests for specific package

# Linting
yarn lint                    # Run ESLint
yarn lint:prettier           # Format with Prettier
yarn lint:prettier:ci        # Check formatting

# Type checking
yarn typecheck               # Check TypeScript types
yarn typecheck:examples      # Check example projects
yarn typecheck:tests         # Check test files

# Watch mode for development
yarn watch                   # Watch and rebuild on changes
yarn watch:ts                # Watch TypeScript only

# CI-specific
yarn test-ci-partial         # Run tests in CI mode
yarn jest-jasmine            # Run with jest-jasmine2 runner
```

### 4. Build System

The project uses a **custom build system** with multiple stages:

1. **JavaScript Build** (`scripts/build.mjs`):

   - Uses Webpack to bundle packages
   - Transforms TypeScript to CommonJS and ESM
   - Handles workspace dependencies

2. **TypeScript Build** (`scripts/buildTs.mjs`):

   - Generates `.d.ts` type definition files
   - Uses TypeScript's project references

3. **Type Bundling** (`scripts/bundleTs.mjs`):
   - Uses API Extractor to create bundled type definitions
   - Generates `api-extractor.json` files

## Code Standards

### 1. TypeScript Configuration

**Main Config** (`tsconfig.json`):

```json
{
  "extends": "@tsconfig/node18/tsconfig.json",
  "compilerOptions": {
    "module": "preserve",
    "moduleResolution": "bundler",
    "composite": true,
    "declaration": true,
    "emitDeclarationOnly": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": false,
    "isolatedModules": true
  }
}
```

**Key Points:**

- All packages use TypeScript
- Strict mode is enabled
- Each package has its own `tsconfig.json` that extends the root
- Test files have separate `tsconfig.json` in `__tests__/` directories

### 2. Code Style (ESLint + Prettier)

**ESLint Config** (`eslint.config.mjs`):

- Uses flat config format (ESLint 9+)
- Extends: TypeScript ESLint, Unicorn, Promise, Import-X
- Custom rules for Jest-specific patterns

**Prettier Config** (in `package.json`):

```json
{
  "bracketSpacing": false,
  "proseWrap": "never",
  "singleQuote": true,
  "trailingComma": "all",
  "arrowParens": "avoid"
}
```

**Key Conventions:**

- 2 spaces for indentation (no tabs)
- 80 character line length strongly preferred
- Single quotes for strings
- Semicolons required
- Trailing commas everywhere
- No abbreviations in variable names ("Avoid abbreviating words")

### 3. File Headers

All source files must include the copyright header:

```typescript
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
```

### 4. Import Rules

**Order** (enforced by ESLint):

1. Built-in Node.js modules
2. External dependencies
3. Internal workspace packages (e.g., `@jest/*`, `jest-*`)
4. Parent directory imports
5. Sibling imports
6. Index imports

**Type Imports:**

- Use inline type imports: `import {type Foo} from 'bar'`
- Avoid side effects: `@typescript-eslint/no-import-type-side-effects`

**Restricted Imports:**

- Never import `fs` directly - use `graceful-fs` instead
- Never use `global` - use `globalThis` instead

### 5. Naming Conventions

- **Files**: Use camelCase for most files, PascalCase for classes
- **Test files**: `*.test.ts`, `*.test.js`
- **Type files**: `*.d.ts`
- **Config files**: `*.config.js`, `*.config.ts`, `*.config.mjs`
- **Snapshot files**: Stored in `__snapshots__/` directory

## Testing

### 1. Test Structure

**Unit Tests:**

- Located in `packages/*/src/__tests__/`
- Test the package in isolation
- Use Jest's own testing framework
- Fast execution

**Integration Tests (E2E):**

- Located in `e2e/` directory
- Test Jest as a whole by running it on fixture projects
- Use `runJest()` helper from `e2e/runJest.ts`
- Slower but comprehensive

### 2. E2E Test Structure

```
e2e/
├── __tests__/              # Test files that run Jest on fixtures
│   ├── failures.test.ts   # Tests failure scenarios
│   └── ...
├── failures/               # Fixture project for failure tests
│   ├── __tests__/         # Test files that Jest will run
│   ├── package.json
│   └── ...
└── Utils.ts                # Utilities for E2E tests
```

**E2E Test Pattern:**

```typescript
import runJest from '../runJest';

test('test name', () => {
  const {stdout, stderr, exitCode} = runJest('fixture-dir', ['args']);
  expect(stderr).toMatchSnapshot();
});
```

### 3. Running Tests

**Test Runners:**

- **jest-circus** (default): Modern test runner
- **jest-jasmine2** (legacy): Use `JEST_JASMINE=1` environment variable

**Key Test Commands:**

```bash
# Run all tests
yarn jest

# Run specific package tests
yarn jest packages/jest-core

# Run E2E tests
yarn jest e2e/__tests__/failures.test.ts

# Run with jasmine2
JEST_JASMINE=1 yarn jest

# Run with coverage
yarn jest-coverage

# Detect memory leaks
yarn test-leak
```

### 4. Snapshot Testing

- Snapshots stored in `__snapshots__/` directories
- Use `toMatchSnapshot()` for output verification
- Update snapshots with `-u` flag
- Serializers: `jest-serializer-ansi-escapes` for ANSI codes

### 5. Test Utilities

**Key Utilities:**

- `@jest/test-utils` - Testing utilities for Jest itself
- `e2e/Utils.ts` - E2E test helpers
- `e2e/runJest.ts` - Run Jest programmatically in tests

## Package Management

### 1. Workspace Dependencies

**Workspace Protocol:**

```json
{
  "dependencies": {
    "@jest/types": "workspace:*",
    "jest-util": "workspace:*"
  }
}
```

- All internal dependencies use `workspace:*`
- Yarn resolves these to the local packages
- Ensures consistency across the monorepo

### 2. Dependency Constraints

Enforced by `yarn.config.cjs`:

1. **Same version across workspaces**: All packages must use the same version of external dependencies (except exceptions like `@types/node`)
2. **No duplicate dependencies**: A package cannot list the same dependency in both `dependencies` and `devDependencies`
3. **Repository field**: All packages must have correct repository information

**Check constraints:**

```bash
yarn constraints        # Check for violations
yarn constraints --fix  # Auto-fix violations
```

### 3. Package.json Structure

Every package must have:

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

## Architecture Concepts

### 1. Test Runners

Jest supports two test runners:

**jest-circus** (default, modern):

- Event-driven architecture
- Better async support
- Concurrent test execution
- Located in `packages/jest-circus/`

**jest-jasmine2** (legacy):

- Based on Jasmine 2.x
- Maintained for backwards compatibility
- Located in `packages/jest-jasmine2/`

### 2. Test Execution Flow

1. **CLI** (`jest-cli`) - Parse arguments, load config
2. **Core** (`jest-core`) - Orchestrate test execution
3. **Config** (`jest-config`) - Resolve and validate configuration
4. **Runtime** (`jest-runtime`) - Module loading and mocking
5. **Runner** (`jest-circus` or `jest-jasmine2`) - Execute tests
6. **Reporters** (`jest-reporters`) - Output results

### 3. Module System

**Transform Pipeline:**

1. File is requested
2. Check if transform is needed (via `transform` config)
3. Apply transformer (e.g., `babel-jest`)
4. Cache transformed result
5. Execute in isolated environment

**Key Packages:**

- `jest-transform` - Transformation system
- `jest-runtime` - Module resolution and execution
- `jest-haste-map` - Fast file system crawler
- `babel-jest` - Default Babel transformer

### 4. Environments

Tests run in isolated environments:

- **jest-environment-node**: Node.js environment (default for Node projects)
- **jest-environment-jsdom**: Browser-like environment with JSDOM

## Configuration

### 1. Jest Configuration Files

Jest supports multiple config formats:

- `jest.config.js` - CommonJS
- `jest.config.mjs` - ES Modules
- `jest.config.ts` - TypeScript
- `jest.config.json` - JSON
- `package.json` - Under `"jest"` key

### 2. Project Configuration

**Root Config** (`jest.config.mjs`):

```javascript
export default {
  projects: ['<rootDir>', '<rootDir>/examples/*/'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/examples/',
    '/e2e/.*/__tests__',
    // ... more patterns
  ],
  transform: {
    '\\.[jt]sx?$': 'babel-jest',
  },
  // ... more options
};
```

**CI Config** (`jest.config.ci.mjs`):

- Used in continuous integration
- May have different timeouts or settings

### 3. Babel Configuration

**Root Babel Config** (`babel.config.js`):

```javascript
module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {node: supportedNodeVersion},
      },
    ],
  ],
  overrides: [
    {
      presets: [
        [
          '@babel/preset-typescript',
          {
            allowDeclareFields: true,
          },
        ],
      ],
      test: /\.tsx?$/,
    },
  ],
};
```

## Git Workflow

### 1. Branch Strategy

- **main**: Primary development branch
- Feature branches: Create from `main`
- `main` is unsafe - breaking changes may occur

### 2. Commit Messages

Follow conventional commit style:

- Focus on "why" rather than "what"
- Be concise (1-2 sentences)
- Reference issue numbers when applicable

### 3. Changelog

**CHANGELOG.md** must be updated for:

- New features
- Bug fixes
- Breaking changes

**Format:**

```markdown
### Features

- **[package-name]:** Description ([#PR_NUMBER](link))

### Fixes

- **[package-name]:** Description ([#PR_NUMBER](link))
```

Alphabetically order entries by package name.

### 4. Pull Requests

Before submitting:

1. Run `yarn test` - All tests must pass
2. Run `yarn lint` - No linting errors
3. Update CHANGELOG.md
4. Add tests for new features
5. Update documentation if APIs changed

## Publishing

### 1. Versioning

Uses **lerna-lite** for version management:

```bash
yarn lerna publish
```

This will:

1. Prompt for version bump
2. Update all package versions
3. Create git tags
4. Publish to npm

### 2. Pre-releases

```bash
yarn lerna publish 30.0.0-alpha.5 --preid alpha --pre-dist-tag next --dist-tag next
```

## Documentation

### 1. Documentation Structure

```
docs/                    # Markdown documentation source
website/                 # Docusaurus website
├── versioned_docs/     # Previous version docs
├── versioned_sidebars/ # Previous version sidebars
└── blog/               # Blog posts
```

### 2. Updating Documentation

1. Edit files in `docs/` for current version
2. Check if older versions need updates in `website/versioned_docs/`
3. Test locally:
   ```bash
   cd website
   yarn
   yarn start
   ```

### 3. API Documentation

- Generated from TypeScript types using API Extractor
- Configuration in `api-extractor.json` files
- JSDoc comments become API documentation

## Common Tasks

### 1. Adding a New Package

1. Create directory in `packages/`
2. Create `package.json` with required fields
3. Create `src/index.ts`
4. Create `tsconfig.json`
5. Add to workspaces (automatic with `packages/*`)
6. Run `yarn install` to link

### 2. Adding a New Feature

1. Create feature branch
2. Write tests first (TDD)
3. Implement feature
4. Update documentation
5. Update CHANGELOG.md
6. Run full test suite
7. Submit PR

### 3. Fixing a Bug

1. Write failing test that reproduces bug
2. Fix the bug
3. Ensure test passes
4. Update CHANGELOG.md
5. Submit PR

### 4. Running E2E Tests

```bash
# Run specific E2E test
yarn jest e2e/__tests__/failures.test.ts

# Run Jest manually on an E2E fixture
cd e2e/failures
node ../../packages/jest-cli/bin/jest.js

# Debug E2E test
node --inspect ../../packages/jest-cli/bin/jest.js
```

## Debugging

### 1. Debug Tests

```bash
# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand

# Debug specific test
node --inspect-brk packages/jest-cli/bin/jest.js path/to/test
```

### 2. Debug Build

```bash
# Verbose build output
yarn build:js --verbose
```

### 3. Common Issues

**Issue**: Tests fail with "Cannot find module"

- **Solution**: Run `yarn build` to compile packages

**Issue**: Type errors in IDE

- **Solution**: Run `yarn build:ts` to generate type definitions

**Issue**: E2E tests fail

- **Solution**: Ensure fixture has `yarn install` run, check `runYarnInstall()` in test

## Important Files Reference

### Configuration Files

- `package.json` - Root package, scripts, workspaces
- `jest.config.mjs` - Jest configuration
- `jest.config.ci.mjs` - CI-specific Jest config
- `eslint.config.mjs` - ESLint configuration
- `tsconfig.json` - TypeScript configuration
- `babel.config.js` - Babel configuration
- `lerna.json` - Lerna configuration
- `yarn.config.cjs` - Yarn constraints

### Build Scripts

- `scripts/build.mjs` - Main build script
- `scripts/buildTs.mjs` - TypeScript build
- `scripts/bundleTs.mjs` - Type bundling
- `scripts/buildUtils.mjs` - Build utilities
- `scripts/watch.mjs` - Watch mode

### Documentation

- `README.md` - Project README
- `CONTRIBUTING.md` - Contribution guidelines
- `CHANGELOG.md` - Version history
- `docs/Architecture.md` - Architecture overview

### Testing Utilities

- `e2e/Utils.ts` - E2E test utilities
- `e2e/runJest.ts` - Run Jest in E2E tests
- `packages/test-utils/` - Testing utilities

## Key Principles

### 1. Backwards Compatibility

- Jest maintains backwards compatibility
- Deprecations are warned before removal
- Breaking changes only in major versions

### 2. Performance

- Fast test execution is a priority
- Worker pools for parallelization
- Efficient file watching and caching

### 3. Developer Experience

- Clear error messages
- Helpful CLI output
- Interactive watch mode
- Snapshot testing for easy assertions

### 4. Extensibility

- Plugin system for reporters
- Custom matchers
- Custom test environments
- Custom transformers

## Anti-Patterns to Avoid

1. **Don't** import `fs` directly - use `graceful-fs`
2. **Don't** use `global` - use `globalThis`
3. **Don't** skip tests without good reason
4. **Don't** commit without running linter
5. **Don't** add dependencies without checking constraints
6. **Don't** modify `node_modules` - use patches if needed
7. **Don't** use `any` type unless absolutely necessary
8. **Don't** create files without copyright headers
9. **Don't** use interactive git commands in scripts (no `-i` flag)
10. **Don't** push to remote without explicit request

## Useful Commands Cheatsheet

```bash
# Setup
corepack enable
yarn install
yarn build

# Development
yarn watch                    # Watch and rebuild
yarn jest --watch            # Watch tests

# Testing
yarn test                    # Full test suite
yarn jest <pattern>          # Specific tests
JEST_JASMINE=1 yarn jest    # Use jasmine2 runner
yarn test-leak              # Memory leak detection

# Code Quality
yarn lint                    # Lint code
yarn lint:prettier          # Format code
yarn typecheck              # Type check
yarn constraints            # Check dependencies

# Building
yarn build:js               # Build JavaScript
yarn build:ts               # Build TypeScript
yarn bundle:ts              # Bundle types
yarn build-clean            # Clean build artifacts

# Publishing
yarn lerna publish          # Publish new version

# Documentation
cd website && yarn start    # Run docs locally

# Utilities
yarn clean-all              # Clean everything
yarn clean-e2e              # Clean E2E fixtures
```

## Resources

- **Website**: https://jestjs.io
- **GitHub**: https://github.com/jestjs/jest
- **Discord**: #testing on Reactiflux
- **Contributing Guide**: CONTRIBUTING.md
- **Code of Conduct**: CODE_OF_CONDUCT.md

## Summary for Cursor Agents

When working on Jest:

1. **Understand the monorepo structure** - 54+ packages with interdependencies
2. **Follow TypeScript and ESLint rules** - Strict typing, consistent style
3. **Write tests** - Unit tests in `__tests__/`, E2E tests in `e2e/`
4. **Build before testing** - Run `yarn build` after changes
5. **Update CHANGELOG** - Document all user-facing changes
6. **Use workspace dependencies** - `workspace:*` for internal packages
7. **Respect the architecture** - Understand test runners, transforms, environments
8. **Test with both runners** - jest-circus (default) and jest-jasmine2
9. **Check constraints** - Run `yarn constraints` before committing
10. **Read existing code** - Jest has excellent examples throughout

This project is large but well-organized. Take time to understand the architecture before making changes. When in doubt, look at existing patterns in the codebase.
