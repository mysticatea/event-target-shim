# event-target-shim

A polyfill for W3C EventTarget, plus few extensions.

See Also: https://dom.spec.whatwg.org/#interface-eventtarget


## Overview

~~This module uses native implementation of EventTarget if it exists.~~
~~otherwise, defines shim.~~

Ummm, occured `Illegal constructor` exception at native.
This module always defines shim.

And this provides an utility to define properties for attribute listeners (e.g. `obj.onclick`).

```ts
declare class EventTarget {
  addEventListener(type: string, listener: (event: Event) => void, capture?: boolean = false): void;
  removeEventListener(type: string, listener: (event: Event) => void, capture?: boolean = false): void;
  dispatchEvent(event: Event): void;
}

// Define EventTarget type with attribute listeners.
declare function EventTarget(...types: string[]): typeof(EventTarget);
```


## Installation

```
npm install event-target-shim --save
```

## Usage

This module has been desined that uses together [Browserify](http://browserify.org/).

```js
import EventTarget from "event-target-shim";

class YourCoolType extends EventTarget {
  // ...
}

// This prototype has getters/setters of `onmessage` and `onerror`.
class YourAwesomeType extends EventTarget("message", "error") {
  // ...
}

// Dispatch with an Event.
{
  let event = document.createEvent("Event");
  event.initEvent("message", false, false);
  event.data = "Hello!";
  obj.dispatchEvent(event);
}

// Dispatch with a plain object.
{
  obj.dispatchEvent({type: "message", data: "Hello!"});
}
```
