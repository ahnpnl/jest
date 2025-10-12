# Custom JSDOM with Proxied Window

This example demonstrates how to create a custom JSDOM implementation that overrides the `window` property with a Proxy to mock browser APIs that are otherwise difficult to work with (like `location`).

## How It Works

1. **Extend JSDOM**: Create a class that extends `JSDOM.JSDOM`
2. **Create a Proxy**: Wrap `super["window"]` in a Proxy to intercept property access
3. **Override window getter**: Return the proxy instead of the original window

## Important Considerations

When creating a Proxy for the JSDOM window, you must handle several special cases:

### 1. Window Self-Reference

The `window` property must return the proxy itself, not the underlying target:

```javascript
class CustomJSDOM extends JSDOM.JSDOM {
  _windowProxy = new Proxy(this.window, {
    get: (target, prop, receiver) => {
      if (prop === 'window') return this._windowProxy;
      // ... other cases
      return Reflect.get(target, prop, receiver);
    },
  });

  get window() {
    return this._windowProxy;
  }
}
```

### 2. JSDOM Internal Slot Checks

JSDOM methods like `addEventListener` check for internal slots. These methods must be bound to the target, not called on the proxy:

```javascript
class CustomJSDOM extends JSDOM.JSDOM {
  _windowProxy = new Proxy(this.window, {
    get: (target, prop, receiver) => {
      // Bind methods that check internal slots to the target
      if (
        prop === 'addEventListener' ||
        prop === 'removeEventListener' ||
        prop === 'dispatchEvent' ||
        prop === 'close'
      ) {
        return target[prop].bind(target);
      }
      return Reflect.get(target, prop, receiver);
    },
  });

  get window() {
    return this._windowProxy;
  }
}
```

### 3. Complete Proxy Traps

Implement all proxy trap operations to ensure transparent behavior:

```javascript
class CustomJSDOM extends JSDOM.JSDOM {
  _windowProxy = new Proxy(this.window, {
    apply: (target, thisArg, argumentsList) =>
      Reflect.apply(target, thisArg, argumentsList),
    construct: (target, argumentsList, newTarget) =>
      Reflect.construct(target, argumentsList, newTarget),
    defineProperty: (target, prop, descriptor) =>
      Reflect.defineProperty(target, prop, descriptor),
    deleteProperty: (target, prop) => Reflect.deleteProperty(target, prop),
    get: (target, prop, receiver) => Reflect.get(target, prop, receiver),
    getOwnPropertyDescriptor: (target, prop) =>
      Reflect.getOwnPropertyDescriptor(target, prop),
    getPrototypeOf: target => Reflect.getPrototypeOf(target),
    has: (target, prop) => Reflect.has(target, prop),
    isExtensible: target => Reflect.isExtensible(target),
    ownKeys: target => Reflect.ownKeys(target),
    preventExtensions: target => Reflect.preventExtensions(target),
    set: (target, prop, value, receiver) =>
      Reflect.set(target, prop, value, receiver),
    setPrototypeOf: (target, proto) => Reflect.setPrototypeOf(target, proto),
  });

  get window() {
    return this._windowProxy;
  }
}
```

## Example: Mocking Location

See `CustomJSDOMLoc.js` for a complete example that mocks `window.location` with a `DummyLocation` class that doesn't throw "Not implemented" errors when setting properties.

## Usage

```javascript
// custom-env.js
import BaseJSDOMEnvironment from '@jest/environment-jsdom-abstract';
import JSDOMModule from 'jsdom';
import {JSDOMWithDummyLocation} from './CustomJSDOMLoc.js';

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
