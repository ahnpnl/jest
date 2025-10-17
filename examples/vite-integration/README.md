# Vite Integration Example

This example demonstrates how to configure Jest to use Vite's dev server in watch mode.

## Overview

The Vite integration feature allows Jest to leverage Vite's dev server during watch mode, providing:
- Fast module transformation
- Efficient dependency tracking via Vite's module graph
- Hot Module Replacement (HMR) support
- Optimized module resolution

## Setup

1. Install Vite as a peer dependency:
   ```bash
   npm install --save-dev vite
   ```

2. Configure Jest with Vite integration (see `jest.config.js`):
   ```js
   module.exports = {
     vite: {
       enabled: true,
       // Optional configuration
     },
   };
   ```

3. Run Jest in watch mode:
   ```bash
   npm run test:watch
   ```

## Configuration

See `jest.config.js` for a complete example of Vite integration configuration.

## Requirements

- Node.js 18.14.0 or higher
- Vite 5.0.0 or higher (optional peer dependency)

## Note

This is an experimental feature. If Vite is not installed, Jest will continue to work normally without the integration.
