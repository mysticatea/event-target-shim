# 💥 Migrating to v6

`event-target-shim` v6.0.0 contains large changes of API.

- [CommonJS's default export is no longer `EventTarget`.](#-commonjss-default-export-is-no-longer-eventtarget)
- [The function call support of `EventTarget` constructor was removed.](#-the-function-call-support-of-eventtarget-constructor-was-removed)
- [Internal file structure was changed.](#-internal-file-structure-was-changed)
- [\[Node.js\] Node.js version requirement was updated.](#-nodejs-nodejs-version-requirement-was-updated)
- [\[Node.js\] Throwing errors from listeners now causes `uncaughtExcption` event.](#-nodejs-throwing-errors-from-listeners-now-causes-uncaughtexcption-event)
- [\[Browsers\] ECMAScript version requirement was updated.](#-browsers-ecmascript-version-requirement-was-updated)
- [\[Browsers\] Throwing errors from listeners now causes `error` event on `window`.](#-browsers-throwing-errors-from-listeners-now-causes-error-event-on-window)
- [\[TypeScript\] TypeScript version requirement was updated.](#-typescript-typescript-version-requirement-was-updated)
- [\[TypeScript\] The second type parameter of `EventTarget` was removed.](#-typescript-the-second-type-parameter-of-eventtarget-was-removed)

## ■ CommonJS's default export is no longer `EventTarget`.

```js
// ❌ Before
const EventTarget = require("event-target-shim");

// ✅ After
const { EventTarget } = require("event-target-shim");
// or
const { default: EventTarget } = require("event-target-shim");
```

Because this package has multiple exports (`EventTarget`, `Event`, ...), so we have to modify the static members of `EventTarget` in order to support CommonJS's default export. I don't want to modify `EventTarget` for this purpose.

This change doesn't affect to ESM syntax.
I.e., `import EventTarget from "event-target-shim"` is OK.

## ■ The function call support of `EventTarget` constructor was removed.

```js
// ❌ Before
import { EventTarget } from "event-target-shim";
class DerivedClass extends EventTarget("foo", "bar") {}

// ✅ After
import { defineCustomEventTarget } from "event-target-shim";
class DerivedClass extends defineCustomEventTarget("foo", "bar") {}

// Or define getters/setters of `onfoo`/`onbar` manually in your derived class.
import {
  EventTarget,
  getEventAttributeValue,
  setEventAttributeValue,
} from "event-target-shim";
class DerivedClass extends EventTarget {
  get onfoo() {
    return getEventAttributeValue(this, "foo");
  }
  set onfoo(value) {
    setEventAttributeValue(this, "foo", value);
  }
  get onbar() {
    return getEventAttributeValue(this, "bar");
  }
  set onbar(value) {
    setEventAttributeValue(this, "bar", value);
  }
}
```

Because that was non-standard behavior and ES2015 class syntax cannot support it.

## ■ Internal file structure was changed.

- (previous) → (now)
- `dist/event-target-shim.mjs` → `index.mjs`
- `dist/event-target-shim.js` → `index.js`
- `dist/event-target-shim.umd.js` → `umd.js`

And now the internal file structure is private by the `exports` field of `package.json`.

## ■ \[Node.js] Node.js version requirement was updated.

Now this package requires Node.js **10.13.0** or later.

Because Node.js v9 and older have been End-of-Life already.
10.13.0 is the first LTS version of v10 series.

## ■ \[Node.js] Throwing errors from listeners now causes `uncaughtExcption` event.

If a registered listener threw an exception while event dispatching, it now emits an `uncaughtExcption` event by default.

You can customize this behavior by `setErrorHandler` API.

```js
import { setErrorHandler } from "event-target-shim";

// Only print errors.
setErrorHandler((error) => {
  console.error(error);
});
```

## ■ \[Browsers] ECMAScript version requirement was updated.

Now this package requires **ES2018** or later.

Because modern browsers have supported ES2018 widely.
If you want to support IE11, use `event-target-shim/es5` that is a transpiled version.

```js
import { EventTarget } from "event-target-shim/es5";
```

## ■ \[Browsers] Throwing errors from listeners now causes `error` event on `window`.

If a registered listener threw an exception while event dispatching, it now dispatches an `error` event on `window` by default.

You can customize this behavior by `setErrorHandler` API.

```js
import { setErrorHandler } from "event-target-shim";

// Only print errors.
setErrorHandler((error) => {
  console.error(error);
});
```

## ■ \[TypeScript] TypeScript version requirement was updated.

Now this package requires TypeScript **4.1** or later if you are using this package on TypeScript.

Because this is using [Template Literal Types](https://devblogs.microsoft.com/typescript/announcing-typescript-4-1/#template-literal-types).

## ■ \[TypeScript] The second type parameter of `EventTarget` was removed.

```js
// ❌ Before
import { EventTarget } from "event-target-shim";
interface MyEventTarget
  extends EventTarget<{ myevent: Event }, { onmyevent: Event }> {}

// ✅ After
import { EventTarget } from "event-target-shim";
interface MyEventTarget extends EventTarget<{ myevent: Event }> {
  onmyevent: EventTarget.FunctionEventListener<Event> | null;
}
```

Because the `EventTarget` object never have event attributes. Derived classes can define event attributes. Therefore, it was odd that the `EventTarget` interface had event attributes.
