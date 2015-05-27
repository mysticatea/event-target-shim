import {symbol} from "./commons";

export const STOP_IMMEDIATE_PROPAGATION_FLAG =
  symbol("stop_immediate_propagation_flag");

const CANCELED_FLAG = symbol("canceled_flag");
const ORIGINAL_EVENT = symbol("original_event");

let wrapperPrototypeDefinition = {
  stopPropagation: {
    value: function stopPropagation() {
      const e = this[ORIGINAL_EVENT];
      if (typeof e.stopPropagation === "function") {
        e.stopPropagation();
      }
    },
    writable: true,
    configurable: true
  },

  stopImmediatePropagation: {
    value: function stopImmediatePropagation() {
      this[STOP_IMMEDIATE_PROPAGATION_FLAG] = true;

      const e = this[ORIGINAL_EVENT];
      if (typeof e.stopImmediatePropagation === "function") {
        e.stopImmediatePropagation();
      }
    },
    writable: true,
    configurable: true
  },

  preventDefault: {
    value: function preventDefault() {
      if (this.cancelable === true) {
        this[CANCELED_FLAG] = true;
      }

      const e = this[ORIGINAL_EVENT];
      if (typeof e.preventDefault === "function") {
        e.preventDefault();
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
    const timeStamp = (typeof event.timeStamp === "number"
      ? event.timeStamp
      : Date.now());

    let props = {
      type: {value: event.type, enumerable: true},
      target: {value: eventTarget, enumerable: true},
      currentTarget: {value: eventTarget, enumerable: true},
      eventPhase: {value: 2, enumerable: true},
      bubbles: {value: Boolean(event.bubbles), enumerable: true},
      cancelable: {value: Boolean(event.cancelable), enumerable: true},
      timeStamp: {value: timeStamp, enumerable: true},
      isTrusted: {value: false, enumerable: true}
    };
    if (typeof event.detail !== "undefined") {
      props.detail = event.detail;
    }

    let retv = Object.create(
      Object.create(event, wrapperPrototypeDefinition),
      props
    );
    Object.defineProperty(
      retv, STOP_IMMEDIATE_PROPAGATION_FLAG, {value: false, writable: true});
    Object.defineProperty(retv, CANCELED_FLAG, {value: false, writable: true});
    Object.defineProperty(retv, ORIGINAL_EVENT, {value: event});

    return retv;
}
