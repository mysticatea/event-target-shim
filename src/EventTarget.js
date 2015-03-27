import {LISTENERS, CAPTURE, BUBBLE, newNode} from "./commons";
import {defineCustomEventTarget} from "./CustomEventTarget";
import {createEventWrapper,
        STOP_IMMEDIATE_PROPAGATION_FLAG,
        DISPATCH_FLAG,
        CANCELED_FLAG} from "./EventWrapper";

const HAS_EVENTTARGET_INTERFACE =
  (typeof window !== "undefined" && typeof window.EventTarget !== "undefined");


export default function EventTarget(...types) {
  if (this instanceof EventTarget) {
    // this[LISTENERS] is a Map.
    // Its key is event type.
    // Its value is ListenerNode object or null.
    //
    // interface ListenerNode {
    //   let listener: Function
    //   let kind: CAPTURE|BUBBLE|ATTRIBUTE
    //   let next: ListenerNode|null
    // }
    this[LISTENERS] = Object.create(null);
  }
  else if (types.length > 0) {
    // To use to extend with attribute listener properties.
    // e.g.
    //     class MyCustomObject extends EventTarget("message", "error") {
    //       //...
    //     }
    return defineCustomEventTarget(EventTarget, types);
  }
  else {
    throw new TypeError("Cannot call a class as a function");
  }
}

EventTarget.prototype = Object.create(
  (HAS_EVENTTARGET_INTERFACE ? window.EventTarget : Object).prototype,
  {
    constructor: {
      value: EventTarget,
      writable: true,
      configurable: true
    },

    addEventListener: {
      value: function addEventListener(type, listener, capture = false) {
        if (listener == null) {
          return false;
        }
        if (typeof listener !== "function") {
          throw new TypeError("listener should be a function.");
        }

        let kind = (capture ? CAPTURE : BUBBLE);
        let node = this[LISTENERS][type];
        if (node == null) {
          this[LISTENERS][type] = newNode(listener, kind);
          return true;
        }

        let prev = null;
        while (node != null) {
          if (node.listener === listener && node.kind === kind) {
            // Should ignore a duplicated listener.
            return false;
          }
          prev = node;
          node = node.next;
        }

        prev.next = newNode(listener, kind);
        return true;
      },
      configurable: true,
      writable: true
    },

    removeEventListener: {
      value: function removeEventListener(type, listener, capture = false) {
        if (listener == null) {
          return false;
        }

        let kind = (capture ? CAPTURE : BUBBLE);
        let prev = null;
        let node = this[LISTENERS][type];
        while (node != null) {
          if (node.listener === listener && node.kind === kind) {
            if (prev == null) {
              this[LISTENERS][type] = node.next;
            }
            else {
              prev.next = node.next;
            }
            return true;
          }

          prev = node;
          node = node.next;
        }

        return false;
      },
      configurable: true,
      writable: true
    },

    dispatchEvent: {
      value: function dispatchEvent(event) {
        // Should check initialized flag, but impossible.
        if (event[DISPATCH_FLAG]) {
          throw new Error("InvalidStateError");
        }

        // If listeners aren't registered, terminate.
        let node = this[LISTENERS][event.type];
        if (node == null) {
          return true;
        }

        // Since we cannot rewrite several properties, so wrap object.
        event = createEventWrapper(event, this);

        // This doesn't process capturing phase and bubbling phase.
        // This isn't participating in a tree.
        while (node != null) {
          node.listener.call(this, event);
          if (event[STOP_IMMEDIATE_PROPAGATION_FLAG]) {
            break;
          }
          node = node.next;
        }

        return !event[CANCELED_FLAG];
      },
      configurable: true,
      writable: true
    }
  }
);
