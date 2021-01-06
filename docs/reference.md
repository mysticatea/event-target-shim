# 📚 API Reference

## ■ `EventTarget`

```js
import { EventTarget } from "event-target-shim";
// or
const { EventTarget } = require("event-target-shim");
```

> The HTML Standard: [EventTarget interface](https://dom.spec.whatwg.org/#interface-eventtarget)

### ▶ constructor

Create a new instance of the `EventTarget` class.

There are no arguments.

### ▶ `eventTarget.addEventListener(type, callback, options)`

Register an event listener.

- `type` is a string. This is the event name to register.
- `callback` is a function. This is the event listener to register.
- `options` is an object `{ capture?: boolean; passive?: boolean; once?: boolean; signal?: AbortSignal }`. This is optional.
  - `capture` is the flag to register the event listener for capture phase.
  - `passive` is the flag to ignore `event.preventDefault()` method in the event listener.
  - `once` is the flag to remove this callback automatically after the first call.
  - `signal` is an `AbortSignal` object to remove this callback. You can use this option as alternative to the `eventTarget.removeEventListener(...)` method.

### ▶ `eventTarget.removeEventListener(type, callback, options)`

Unregister an event listener.

- `type` is a string. This is the event name to unregister.
- `callback` is a function. This is the event listener to unregister.
- `options` is an object `{ capture?: boolean }`. This is optional.
  - `capture` is the flag to register the event listener for capture phase.

### ▶ `eventTarget.dispatchEvent(event)`

Dispatch an event.

- `event` is a [Event](https://dom.spec.whatwg.org/#event) object to dispatch.

## ■ `Event`

```js
import { Event } from "event-target-shim";
// or
const { Event } = require("event-target-shim");
```

> The HTML Standard: [Event interface](https://dom.spec.whatwg.org/#interface-event)

See [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Event#Properties) for details.

## ■ Event attribute handler

```js
import {
  getEventAttributeValue,
  setEventAttributeValue,
} from "event-target-shim";
// or
const {
  getEventAttributeValue,
  setEventAttributeValue,
} = require("event-target-shim");
```

> Non-standard.

You can define event attributes (e.g. `onclick`) on your derived classes of `EventTarget`.

#### Example

```js
import {
  EventTarget,
  getEventAttributeValue,
  setEventAttributeValue,
} from "event-target-shim";

class AbortSignal extends EventTarget {
  constructor() {
    this.aborted = false;
  }

  // Define `onabort` property
  get onabort() {
    return getEventAttributeValue(this, "abort");
  }
  set onabort(value) {
    setEventAttributeValue(this, "abort", value);
  }
}
```

## ■ Error handling

```js
import { setErrorHandler, setWarningHandler } from "event-target-shim";
```

> Non-standard.

You can customize error/wanring behavior of `EventTarget`-shim.

### ▶ `setErrorHandler(handler)`

Set your error handler. The error means exceptions that event listeners threw.

The default handler is `undefined`. It dispatches an [ErrorEvent](https://developer.mozilla.org/ja/docs/Web/API/ErrorEvent) on `window` on browsers, or emits an [`uncaughtException` event](https://nodejs.org/api/process.html#process_event_uncaughtexception) on `process` on Node.js.

The first argument of the error handler is a thrown error.

#### Example

```js
import { setErrorHandler } from "event-target-shim";

// Print log only.
setErrorHandler((error) => {
  console.error(error);
});
```

### ▶ `setWarningHandler(handler)`

Set your warning handler. The warning is reported when `EventTarget` or `Event` doesn't throw any errors but ignores operations silently.

The default handler is `undefined`. It prints warnings with the `console.warn` method.

The first argument of the warning handler is a reported warning information. It has three properties:

- `code` ... A warning code. Use it for i18n.
- `message` ... The warning message in English.
- `args` ... The array of arguments for replacing placeholders in the message.

The warning handler will be called when...

| Code    | Description                                                                                                                                                                                                                                                            |
| :------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"W01"` | `Event.prototype.initEvent` method was called while dispatching. In this case, the method does nothing.                                                                                                                                                                |
| `"W02"` | `Event.prototype.cancelBubble` setter received a falsy value. In this case, the setter does nothing.                                                                                                                                                                   |
| `"W03"` | `Event.prototype.returnValue` setter received a truthy value. In this case, the setter does nothing.                                                                                                                                                                   |
| `"W04"` | `Event.prototype.preventDefault` method was called or `Event.prototype.returnValue` setter received a falsy value, but the event was not cancelable. In this case, the method or setter does nothing.                                                                  |
| `"W05"` | `Event.prototype.preventDefault` method was called or `Event.prototype.returnValue` setter received a falsy value, but that's in a passive listener. In this case, the method or setter does nothing.                                                                  |
| `"W06"` | `EventTarget.prototype.addEventListener` method received a listener that has been added already. In this case, the method does nothing.                                                                                                                                |
| `"W07"` | `EventTarget.prototype.addEventListener` method received a listener that has been added already, and any of `passive`, `once`, and `signal` options are different between the existing listener and the ignored listener. In this case, the new options are abandoned. |
| `"W08"` | `EventTarget.prototype.{addEventListener,removeEventListener}` methods received an invalid event listener. In this case, the methods ignore the listener.                                                                                                              |
| `"W09"` | `setEventAttributeValue` function received an invalid event attribute handler. If that was a primitive value, the function removes the current event attribute handler. Otherwise, the function adopts the listener, but the listener will never be called.            |

#### Example

```js
import { setWarningHandler } from "event-target-shim";

// Print log only.
setWarningHandler((warning) => {
  console.warn(warning.message, ...warning.args);
});
```

## ■ \[TypeScript] Types

The `EventTarget` and `Event` classes this package provides are compatible with the `EventTarget` and `Event` interfaces in the built-in `DOM` library of TypeScript. We can assign those each other.

Additionally, the `EventTarget` and `Event` classes this package provides have some type parameters.

### ▶ `EventTarget<TEventMap, TMode>`

The `EventTarget` class has two type parameters.

- `TEventMap` ... Optional. The event map. Keys are event types and each value is the type of `Event` class. Default is `Record<string, Event>`.<br>
  This event map provides known event types. It's useful to infer the event types on `addEventListener` method.
- `TMode` ... Optional. The mode of `EventTarget` type. This is `"standard"` or `"strict"`. Default is `"standard"`.<br>
  If this is `"standard"`, the `EventTarget<EventMap, "standard">` type accepts unknown event types as well. It follows the standard.<br>
  If this is `"strict"`, the `EventTarget<EventMap, "strict">` type accepts only known event types. It will protect the mistakes of giving wrong `Event` objects. On the other hand, the `EventTarget<EventMap, "strict">` type is not compatible to the standard.

#### Example

```ts
type AbortSignalEventMap = {
  abort: Event<"abort">;
};

class AbortSignal extends EventTarget<AbortSignalEventMap> {
  // ....
}

type EventSourceEventMap = {
  close: Event<"close">;
  error: Event<"error">;
  message: MessageEvent;
};

class EventSource extends EventTarget<EventSourceEventMap> {
  // ....
}

type MyEventMap = {
  // ....
};

class MyStuff extends EventTarget<MyEventMap, "strict"> {
  // ....
}
```

### ▶ `Event<T>`

The `Event` class has a type parameter.

- `T` ... Optional. The type of the `type` property. Default is `string`.

#### Example

```ts
const e = new Event("myevent");
const t: "myevent" = e.type; // the type of `type` property is `"myevent"`.
```

### ▶ `getEventAttributeValue<T>(target, type)`, `setEventAttributeValue<T>(target, type, value)`

The `getEventAttributeValue` and `setEventAttributeValue` functions have a type parameter.

- `T` ... The type of the `Event` class.

#### Example

```ts
type AbortSignalEventMap = {
  abort: Event<"abort">;
};

class AbortSignal extends EventTarget<AbortSignalEventMap> {
  // ....

  get onabort() {
    return getEventAttributeValue<AbortSignalEventMap["abort"]>(this, "abort");
  }
  set onabort(value) {
    setEventAttributeValue<AbortSignalEventMap["abort"]>(this, "abort", value);
  }
}
```
