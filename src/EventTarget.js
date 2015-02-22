"use strict";

let EventTarget;
if (false/*typeof window !== "undefined" && typeof window.EventTarget !== "undefined"*/) {
  // Occored `Illegal constructor` exception when called.
  EventTarget = window.EventTarget;
}
else {
  // Event's private members.
  const STOP_IMMEDIATE_PROPAGATION_FLAG = Symbol("stop immediate propagation flag");
  const CANCELED_FLAG = Symbol("canceled flag");
  const DISPATCH_FLAG = Symbol("dispatch flag");
  // EventTarget's private members.
  const LISTENERS = Symbol("listeners");

  // Create a LinkedList structure for EventListener.
  function newNode(listener, capture) {
    return {listener, capture, next: null};
  }

  // Create a Event wrapper to rewrite readonly properties.
  function newEventWrapper(event, eventTarget) {
    let timeStamp = (typeof event.timeStamp === "number"
      ? event.timeStamp
      : Date.now());

    return Object.create(event, {
      type: {value: event.type, enumerable: true},
      target: {value: eventTarget, enumerable: true},
      currentTarget: {value: eventTarget, enumerable: true},
      eventPhase: {value: 2, enumerable: true},
      stopPropagation: {value: function stopPropagation() {}},
      stopImmediatePropagation: {value: function stopImmediatePropagation() {
        this[STOP_IMMEDIATE_PROPAGATION_FLAG] = true;
      }},
      bubbles: {value: Boolean(event.bubbles), enumerable: true},
      cancelable: {value: Boolean(event.cancelable), enumerable: true},
      preventDefault: {value: function preventDefault() {
        if (this.cancelable === true) {
          this[CANCELED_FLAG] = true;
        }
      }},
      defaultPrevented: {
        get: function() { return this[CANCELED_FLAG]; },
        enumerable: true
      },
      isTrusted: {value: false, enumerable: true},
      timeStamp: {value: timeStamp, enumerable: true},
      [STOP_IMMEDIATE_PROPAGATION_FLAG]: {value: false, writable: true},
      [CANCELED_FLAG]: {value: false, writable: true},
      [DISPATCH_FLAG]: {value: true}
    });
  }

  // Define EventTarget.
  // See Also: https://dom.spec.whatwg.org/#interface-eventtarget
  EventTarget = class EventTarget {
    constructor() {
      // This object is a Map.
      // Its key is event type.
      // Its value is ListenerNode object or null.
      //
      // interface ListenerNode {
      //   let listener: Function
      //   let capture: boolean
      //   let next: ListenerNode|null
      // }
      this[LISTENERS] = Object.create(null);
    }

    addEventListener(type, listener, capture = false) {
      if (listener == null) {
        return false;
      }
      capture = Boolean(capture);

      let node = this[LISTENERS][type];
      if (node == null) {
        this[LISTENERS][type] = newNode(listener, capture);
        return true;
      }

      let prev = null;
      while (node != null) {
        if (node.listener === listener && node.capture === capture) {
          // Should ignore a duplicated listener.
          return false;
        }
        prev = node;
        node = node.next;
      }

      prev.next = newNode(listener, capture);
      return true;
    }

    removeEventListener(type, listener, capture = false) {
      if (listener == null) {
        return false;
      }
      capture = Boolean(capture);

      let prev = null;
      let node = this[LISTENERS][type];
      while (node != null) {
        if (node.listener === listener && node.capture === capture) {
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
    }

    dispatchEvent(event) {
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
      event = newEventWrapper(event, this);

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
    }
  };
}

export default EventTarget;
