# Custom JSDOM with Proxied Window

This example demonstrates how to create a custom JSDOM implementation that overrides the `window` property with a Proxy to mock browser APIs that are otherwise difficult to work with (like `location`).

## How It Works

1. **Extend JSDOM**: Create a class that extends `JSDOM.JSDOM`
2. **Create a Proxy**: Wrap `super["window"]` in a Proxy to intercept property access
3. **Override window getter**: Return the proxy instead of the original window

## Important Considerations

When creating a Proxy for the JSDOM window, you must handle several special cases:

### 1. Window Self-Reference
```javascript
case "window": return this._windowProxy;
```
The `window` property must return the proxy itself, not the underlying target.

### 2. JSDOM Internal Slot Checks
```javascript
case "addEventListener":
case "removeEventListener":
case "dispatchEvent":
case "close":
  return target[prop].bind(target);
```
JSDOM methods like `addEventListener` check for internal slots. These methods must be bound to the target, not called on the proxy.

### 3. Complete Proxy Traps
```javascript
has: (target, prop) => Reflect.has(target, prop),
set: (target, prop, value, receiver) => Reflect.set(target, prop, value, receiver),
// ... etc
```
Implement all proxy trap operations to ensure transparent behavior.

## Example: Mocking Location

See `CustomJSDOMLoc.js` for a complete example that mocks `window.location` with a `DummyLocation` class that doesn't throw "Not implemented" errors when setting properties.

## Usage

```javascript
// custom-env.js
import BaseJSDOMEnvironment from "@jest/environment-jsdom-abstract";
import JSDOMModule from "jsdom";
import { JSDOMWithDummyLocation } from "./CustomJSDOMLoc.js";

export default class CustomEnvironment extends BaseJSDOMEnvironment {
  constructor(config, context) {
    super(config, context, {...JSDOMModule, JSDOM: JSDOMWithDummyLocation});
  }
}
```

Then in your package.json:
```json
{
  "jest": {
    "testEnvironment": "./custom-env.js"
  }
}
```

## How Jest Handles Custom Windows

When you provide a custom JSDOM instance where `dom.window !== dom.getInternalVMContext()`, Jest automatically:

1. Detects the custom window implementation
2. Creates a new VM context from the custom window (instead of using JSDOM's internal context)
3. Caches this context for reuse
4. Executes test code in this new context, where globals see your proxied window

This allows your proxy's get traps to intercept property access in tests.
