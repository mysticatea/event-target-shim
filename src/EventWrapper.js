"use strict";

export const STOP_IMMEDIATE_PROPAGATION_FLAG = Symbol("stop immediate propagation flag");
export const CANCELED_FLAG = Symbol("canceled flag");
export const DISPATCH_FLAG = Symbol("dispatch flag");

let wrapperPrototypeDefinition = {
  stopPropagation: {
    value: function stopPropagation() {},
    writable: true,
    configurable: true
  },
  stopImmediatePropagation: {
    value: function stopImmediatePropagation() {
      this[STOP_IMMEDIATE_PROPAGATION_FLAG] = true;
    },
    writable: true,
    configurable: true
  },
  preventDefault: {
    value: function preventDefault() {
      if (this.cancelable === true) {
        this[CANCELED_FLAG] = true;
      }
    },
    writable: true,
    configurable: true
  },
  defaultPrevented: {
    get: function() { return this[CANCELED_FLAG]; },
    enumerable: true,
    configurable: true
  }
};

export function createEventWrapper(event, eventTarget) {
    let timeStamp = (typeof event.timeStamp === "number"
      ? event.timeStamp
      : Date.now());

    return Object.create(
      Object.create(event, wrapperPrototypeDefinition),
      {
        type: {value: event.type, enumerable: true},
        target: {value: eventTarget, enumerable: true},
        currentTarget: {value: eventTarget, enumerable: true},
        eventPhase: {value: 2, enumerable: true},
        bubbles: {value: Boolean(event.bubbles), enumerable: true},
        cancelable: {value: Boolean(event.cancelable), enumerable: true},
        timeStamp: {value: timeStamp, enumerable: true},
        isTrusted: {value: false, enumerable: true},
        [STOP_IMMEDIATE_PROPAGATION_FLAG]: {value: false, writable: true},
        [CANCELED_FLAG]: {value: false, writable: true},
        [DISPATCH_FLAG]: {value: true, writable: true}
      }
    );
};
