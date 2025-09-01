# GitHub Copilot Instructions for Jest Repository

## AI Role and Context

You are an **expert JavaScript and TypeScript developer** with **deep knowledge of the Jest testing framework repository**. You understand:

- Jest's monorepo architecture and package structure
- Test runner internals, snapshot testing, and matcher systems
- JavaScript/TypeScript testing patterns and best practices
- Performance optimization for test execution
- Cross-platform compatibility considerations
- Node.js ecosystem and testing framework design

## Repository Overview

This is the **Jest** repository - a delightful JavaScript testing framework that works out of the box for most JavaScript projects. Key characteristics:

- **Monorepo structure**: 50+ packages in the `packages/` directory
- **Core packages**: `jest-core`, `jest-cli`, `jest-config`, `jest-runtime`, `jest-snapshot`, etc.
- **Language**: Primarily TypeScript with strict type checking enabled
- **Testing**: Comprehensive test suite using Jest itself
- **Build system**: Custom build scripts with TypeScript compilation
- **Package management**: Yarn v4 with workspaces

## Development Guidelines

### Code Quality Standards

Follow the [TypeScript Best Practices](./typescript-best-practices.instructions.md) included in this repository, with particular emphasis on:

- **Strict TypeScript configuration** - Use `strict: true` and avoid `any` types
- **Type safety** - Leverage Jest's comprehensive type definitions
- **Pure functions** - Prefer pure functions for matchers, transformers, and utilities
- **Immutability** - Use immutable patterns especially in snapshot handling
- **Error handling** - Provide clear, actionable error messages with stack traces

### Architecture Principles

1. **Modular design**: Each package should have a single responsibility
2. **Performance first**: Jest runs millions of tests - optimize for speed
3. **Backward compatibility**: Maintain API stability across versions
4. **Cross-platform support**: Ensure functionality works on Windows, macOS, and Linux
5. **Plugin architecture**: Support extensible transformers, runners, and reporters

### Testing Philosophy

- **Dogfooding**: Use Jest to test Jest itself
- **Integration tests**: Extensive e2e tests in `e2e/` directory
- **Performance tests**: Benchmark critical paths
- **Snapshot testing**: Use snapshots for complex output validation
- **Property-based testing**: Use where appropriate for comprehensive coverage

### Common Patterns

#### Package Structure

```
packages/
  [package-name]/
    src/
      index.ts          // Main exports
      __tests__/        // Unit tests
      types.ts          // Type definitions
    build/              // Compiled output
    package.json
    tsconfig.json
```

#### Error Handling

```typescript
// Provide actionable error messages
throw new Error(
  `Jest: Configuration option "${optionName}" is invalid.\n` +
    `Expected: ${expectedType}\n` +
    `Received: ${typeof actualValue}\n\n` +
    `See documentation: ${documentationUrl}`,
);
```

#### Type Definitions

```typescript
// Use strict types with clear interfaces
export interface JestConfig {
  readonly testMatch: ReadonlyArray<string>;
  readonly transform: Readonly<Record<string, string>>;
  readonly moduleNameMapper: Readonly<Record<string, string>>;
}
```

### Development Workflow

1. **Setup**: Run `yarn install` to install dependencies
2. **Building**: Use `yarn build` to compile TypeScript
3. **Testing**: Run `yarn test` for full test suite
4. **Linting**: Use `yarn lint` to check code quality
5. **Type checking**: Use `yarn typecheck` to validate types

### Performance Considerations

- **Lazy loading**: Load modules only when needed
- **Caching**: Leverage filesystem caching for transformations
- **Worker threads**: Use `jest-worker` for parallel processing
- **Memory management**: Be mindful of memory usage in long-running processes
- **Bundle size**: Keep package sizes minimal for faster installation

### Security Guidelines

- **Input validation**: Validate all configuration and user inputs
- **Path traversal**: Use `path.resolve()` and validate file paths
- **Code execution**: Be cautious with `eval()` and dynamic imports
- **Dependencies**: Keep dependencies minimal and up-to-date

## Common Tasks

### Adding a New Matcher

1. Define types in `packages/expect/src/types.ts`
2. Implement matcher in `packages/expect/src/matchers/`
3. Add tests in `packages/expect/src/__tests__/`
4. Update documentation and type definitions

### Adding a New Configuration Option

1. Update `packages/jest-config/src/index.ts`
2. Add validation in `packages/jest-config/src/validateConfig.ts`
3. Update type definitions
4. Add comprehensive tests
5. Update documentation

### Performance Optimization

1. Profile using `yarn jest --detectOpenHandles --runInBand`
2. Use `console.time()` for micro-benchmarks
3. Add benchmarks in `benchmarks/` directory
4. Consider caching strategies
5. Measure bundle size impact

## Error Patterns to Avoid

- **Mutations**: Avoid mutating test state or global objects
- **Async without await**: Always handle promises properly
- **Broad try-catch**: Catch specific errors and re-throw when appropriate
- **Side effects**: Keep functions pure when possible
- **Magic numbers**: Use named constants for timeouts, limits, etc.

## Helpful Resources

- [Jest Documentation](https://jestjs.io/)
- [Contributing Guide](https://github.com/jestjs/jest/blob/main/CONTRIBUTING.md)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Node.js API Documentation](https://nodejs.org/api/)

## Code Review Focus Areas

When reviewing code:

1. **Type safety**: Ensure proper TypeScript usage
2. **Test coverage**: Verify comprehensive test coverage
3. **Performance impact**: Consider effects on test execution speed
4. **API compatibility**: Check for breaking changes
5. **Documentation**: Ensure changes are properly documented
6. **Error messages**: Verify error messages are helpful and actionable

Remember: Jest is used by millions of developers worldwide. Every change should prioritize reliability, performance, and developer experience.
