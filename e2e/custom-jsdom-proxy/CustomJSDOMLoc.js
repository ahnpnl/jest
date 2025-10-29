import JSDOM from 'jsdom';

class DummyLocation {
  hash = '';
  host = '';
  hostname = '';
  href = '';
  toString() {
    return this.href;
  }
  origin = '';
  pathname = '';
  port = '';
  protocol = '';
  search = '';
  assign(url) {
    this.href = String(url);
  }
  reload() {}
  replace(url) {
    this.href = String(url);
  }
}

export class JSDOMWithDummyLocation extends JSDOM.JSDOM {
  _mockLocation = new DummyLocation();
  _documentProxy = new Proxy(super['window'].document, {
    get: (target, prop, receiver) => {
      if (prop !== 'location') return Reflect.get(target, prop, receiver);
      return this._mockLocation;
    },
  });

  _windowProxy = new Proxy(super['window'], {
    // Forward all other operations to maintain proper behavior
    apply: (target, thisArg, argumentsList) =>
      Reflect.apply(target, thisArg, argumentsList),
    construct: (target, argumentsList, newTarget) =>
      Reflect.construct(target, argumentsList, newTarget),
    defineProperty: (target, prop, descriptor) =>
      Reflect.defineProperty(target, prop, descriptor),
    deleteProperty: (target, prop) => Reflect.deleteProperty(target, prop),
    get: (target, prop, receiver) => {
      switch (prop) {
        case 'window':
          return this._windowProxy; // Return the proxy itself for window self-reference
        case 'document':
          return this._documentProxy;
        case 'location':
          return this._mockLocation;
        // Bind methods that check internal slots or have special behavior to the target
        case 'addEventListener':
        case 'removeEventListener':
        case 'dispatchEvent':
        case 'close':
          return target[prop].bind(target);
        default:
          return Reflect.get(target, prop, receiver);
      }
    },
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
