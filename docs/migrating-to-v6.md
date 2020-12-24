# 💥 Migrating to v6

`event-target-shim` v6.0.0 contains large changes of API.

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

## ■ The function call support of `EventTarget` constructor was removed.

```js
// ❌ Before
import { EventTarget } from "event-target-shim";
class DerivedClass extends EventTarget("foo", "bar") {}

// ✅ After
import { defineCustomEventTarget } from "event-target-shim";
type MyEventMap = {
  foo: Event
  bar: Event
}
class DerivedClass extends defineCustomEventTarget<MyEventMap>("foo", "bar") {}
// Or define getters/setters of `onfoo`/`onbar` manually in your derived class.
```

Because that was non-standard behavior and ES2015 class syntax cannot support it.

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
