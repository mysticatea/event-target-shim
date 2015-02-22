"use strict";
import EventTargetBase from "./EventTarget";

const ATTRIBUTE_LISTENERS = Symbol("attributeListeners");

function defineAttributeListener(type) {
  return `
    on${type}: {
      get: function() {
        var listeners = this[ATTRIBUTE_LISTENERS];
        return (listeners && listeners.${type}) || null;
      },
      set: function(value) {
        var listeners = this[ATTRIBUTE_LISTENERS];
        if (listeners == null) {
          listeners = this[ATTRIBUTE_LISTENERS] = Object.create(null);
        }

        var listener = listeners.${type} || null;
        if (listener != null) {
          this.removeEventListener("${type}", listener);
        }

        this.addEventListener("${type}", value);
        listeners.${type} = value;
      }
    },
  `;
}

function EventTarget(...types) {
  if (this instanceof EventTarget) {
    EventTargetBase.call(this);
  }
  else if (types.length > 0) {
    return Function("EventTargetBase", "ATTRIBUTE_LISTENERS", `
      function EventTarget() {
        EventTargetBase.call(this);
      }
      EventTarget.prototype = Object.create(EventTargetBase.prototype, {
        ${types.map(defineAttributeListener).join()}
        constructor: {value: EventTarget}
      });
      return EventTarget;
    `)(EventTargetBase, ATTRIBUTE_LISTENERS);
  }
  else {
    throw new TypeError("Cannot call a class as a function");
  }
}
EventTarget.prototype = Object.create(EventTargetBase.prototype, {
  constructor: {value: EventTarget}
});

export default EventTarget;
