# event-target-shim

[![npm version](https://img.shields.io/npm/v/event-target-shim.svg)](https://www.npmjs.com/package/event-target-shim)
[![Downloads/month](https://img.shields.io/npm/dm/event-target-shim.svg)](http://www.npmtrends.com/event-target-shim)
[![Build Status](https://github.com/mysticatea/event-target-shim/workflows/CI/badge.svg)](https://github.com/mysticatea/event-target-shim/actions)
[![Coverage Status](https://codecov.io/gh/mysticatea/event-target-shim/branch/master/graph/badge.svg)](https://codecov.io/gh/mysticatea/event-target-shim)
[![Dependency Status](https://david-dm.org/mysticatea/event-target-shim.svg)](https://david-dm.org/mysticatea/event-target-shim)

An implementation of [WHATWG `EventTarget` interface](https://dom.spec.whatwg.org/#interface-eventtarget) and [WHATWG `Event` interface](https://dom.spec.whatwg.org/#interface-event). This implementation supports constructor, `passive`, `once`, and `signal`.

This implementation is designed ...

- Working fine on both browsers and Node.js.
- TypeScript friendly.

**Native Support Information:**

| Feature                   | IE  | Edge | Firefox | Chrome | Safari | Node.js |
| :------------------------ | :-- | :--- | :------ | :----- | :----- | :------ |
| `Event` constructor       | ❌  | 12   | 11      | 15     | 6      | 15.4.0  |
| `EventTarget` constructor | ❌  | 87   | 84      | 87     | 14     | 15.4.0  |
| `passive` option          | ❌  | 16   | 49      | 51     | 10     | 15.4.0  |
| `once` option             | ❌  | 16   | 50      | 55     | 10     | 15.4.0  |
| `signal` option           | ❌  | 88   | 86      | 88     | ❌     | ❌      |

---

## 💿 Installation

Use [npm](https://www.npmjs.com/) or a compatible tool.

```
npm install event-target-shim
```

## 📖 Getting started

```js
import { EventTarget, Event } from "event-target-shim";

// constructor (was added to the standard on 8 Jul 2017)
const myNode = new EventTarget();

// passive flag (was added to the standard on 6 Jan 2016)
myNode.addEventListener(
  "hello",
  (e) => {
    e.preventDefault(); // ignored and print warning on console.
  },
  { passive: true }
);

// once flag (was added to the standard on 15 Apr 2016)
myNode.addEventListener("hello", listener, { once: true });
myNode.dispatchEvent(new Event("hello")); // remove the listener after call.

// signal (was added to the standard on 4 Dec 2020)
const ac = new AbortController();
myNode.addEventListener("hello", listener, { signal: ac.signal });
ac.abort(); // remove the listener.
```

- For browsers, there are two ways:
  - use a bundler such as [Webpack](https://webpack.js.org/) to bundle. If you want to support IE11, use `import {} from "event-target-shim/es5"` instead. It's a transpiled code by babel. It depends on `@baebl/runtime` (`^7.12.0`) package.
  - use CDN such as `unpkg.com`. For example, `<script src="https://unpkg.com/event-target-shim@6.0.2"></script>` will define `EventTargetShim` global variable.
- The `AbortController` class was added to the standard on 14 Jul 2017. If you want the shim of that, use [abort-controller](https://www.npmjs.com/package/abort-controller) package.

### Runnable Examples

- [Basic Example](https://jsbin.com/dapuwomamo/1/edit?html,console)
- [Basic Example (IE11)](https://jsbin.com/xigeyetipe/1/edit?html,console)

## 📚 API Reference

See [docs/reference.md](docs/reference.md).

## 💥 Migrating to v6

See [docs/migrating-to-v6.md](docs/migrating-to-v6.md).

## 📰 Changelog

See [GitHub releases](https://github.com/mysticatea/event-target-shim/releases).

## 🍻 Contributing

Contributing is welcome ❤️

Please use GitHub issues/PRs.

### Development tools

- `npm install` installs dependencies for development.
- `npm test` runs tests and measures code coverage.
- `npm run watch:mocha` runs tests on each file change.
