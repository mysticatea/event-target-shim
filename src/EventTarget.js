"use strict";
import {createEventWrapper, STOP_IMMEDIATE_PROPAGATION_FLAG, DISPATCH_FLAG,
        CANCELED_FLAG} from "./EventWrapper";

const LISTENERS = Symbol("listeners");
const SET_ATTRIBUTE_LISTENER = Symbol("setAttributeListener");
const GET_ATTRIBUTE_LISTENER = Symbol("getAttributeListener");
const CAPTURE = 1;
const BUBBLE = 2;
const ATTRIBUTE = 3;

// Return definition of an attribute listener.
function defineAttributeListener(type) {
  type = type.replace(/"/g, "\\\"");
  return `
    "on${type}": {
      get: function() { return this[GET_ATTRIBUTE_LISTENER]("${type}"); },
      set: function(value) { this[SET_ATTRIBUTE_LISTENER]("${type}", value); },
      configurable: true,
      enumerable: true
    },
  `;
}

// Create a LinkedList structure for EventListener.
function newNode(listener, kind) {
  return {listener, kind, next: null};
}

//
// Class Definition.
//
let ET = function EventTarget(...types) {
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
    return Function(
      "EventTargetBase",
      "GET_ATTRIBUTE_LISTENER",
      "SET_ATTRIBUTE_LISTENER",
      `
        function EventTarget() {
          EventTargetBase.call(this);
        }
        EventTarget.prototype = Object.create(EventTargetBase.prototype, {
          ${types.map(defineAttributeListener).join()}
          constructor: {
            value: EventTarget,
            writable: true,
            configurable: true
          }
        });
        return EventTarget;
      `
    )(EventTarget, GET_ATTRIBUTE_LISTENER, SET_ATTRIBUTE_LISTENER);
  }
  else {
    throw new TypeError("Cannot call a class as a function");
  }
};

ET.prototype = Object.create(
  (typeof EventTarget === "function" ? EventTarget : Object).prototype,
  {
    constructor: {
      value: ET,
      writable: true,
      configurable: true
    },

    addEventListener: {
      value: function addEventListener(type, listener, capture = false) {
        if (listener == null) {
          return false;
        }
        if (typeof listener !== "function") {
          throw TypeError("listener should be a function.");
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
      writable: true,
      configurable: true
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
      writable: true,
      configurable: true
    },

    dispatchEvent: {
      value: function dispatchEvent(event) {
        // Should check initialized flag, but impossible.
        if (event[DISPATCH_FLAG]) {
          throw Error("InvalidStateError");
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
      writable: true,
      configurable: true
    },

    [GET_ATTRIBUTE_LISTENER]: {
      value: function getAttributeListener(type) {
        let node = this[LISTENERS][type];
        while (node != null) {
          if (node.kind === ATTRIBUTE) {
            return node.listener;
          }
          node = node.next;
        }
        return null;
      },
      writable: true,
      configurable: true
    },

    [SET_ATTRIBUTE_LISTENER]: {
      value: function setAttributeListener(type, listener) {
        if (listener != null && typeof listener !== "function") {
          throw TypeError("listener should be a function.");
        }

        let prev = null;
        let node = this[LISTENERS][type];
        while (node != null) {
          if (node.kind === ATTRIBUTE) {
            // Remove old value.
            if (prev == null) {
              this[LISTENERS][type] = node.next;
            }
            else {
              prev.next = node.next;
            }
          }
          else {
            prev = node;
          }

          node = node.next;
        }

        // Add new value.
        if (listener != null) {
          if (prev == null) {
            this[LISTENERS][type] = newNode(listener, ATTRIBUTE);
          }
          else {
            prev.next = newNode(listener, ATTRIBUTE);
          }
        }
      },
      writable: true,
      configurable: true
    }
  }
);

export default ET;
