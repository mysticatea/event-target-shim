import {LISTENERS, ATTRIBUTE, newNode} from "./commons";

function getAttributeListener(eventTarget, type) {
  let node = eventTarget[LISTENERS][type];
  while (node != null) {
    if (node.kind === ATTRIBUTE) {
      return node.listener;
    }
    node = node.next;
  }
  return null;
}

function setAttributeListener(eventTarget, type, listener) {
  if (listener != null && typeof listener !== "function") {
    throw new TypeError("listener should be a function.");
  }

  let prev = null;
  let node = eventTarget[LISTENERS][type];
  while (node != null) {
    if (node.kind === ATTRIBUTE) {
      // Remove old value.
      if (prev == null) {
        eventTarget[LISTENERS][type] = node.next;
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
      eventTarget[LISTENERS][type] = newNode(listener, ATTRIBUTE);
    }
    else {
      prev.next = newNode(listener, ATTRIBUTE);
    }
  }
}

export function defineCustomEventTarget(EventTargetBase, types) {
  function EventTarget() {
    EventTargetBase.call(this);
  }

  let descripter = {
    constructor: {
      value: EventTarget,
      configurable: true,
      writable: true
    }
  };

  types.forEach(type => {
    descripter["on" + type] = {
      get: function() { return getAttributeListener(this, type); },
      set: function(listener) { setAttributeListener(this, type, listener); },
      configurable: true,
      enumerable: true
    };
  });

  EventTarget.prototype = Object.create(EventTargetBase.prototype, descripter);

  return EventTarget;
}
