(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.eventTargetShim = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

exports.defineCustomEventTarget = defineCustomEventTarget;
Object.defineProperty(exports, "__esModule", {
  value: true
});

var _commons = require("./commons");

var LISTENERS = _commons.LISTENERS;
var ATTRIBUTE = _commons.ATTRIBUTE;
var newNode = _commons.newNode;

function getAttributeListener(eventTarget, type) {
  var node = eventTarget[LISTENERS][type];
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

  var prev = null;
  var node = eventTarget[LISTENERS][type];
  while (node != null) {
    if (node.kind === ATTRIBUTE) {
      // Remove old value.
      if (prev == null) {
        eventTarget[LISTENERS][type] = node.next;
      } else {
        prev.next = node.next;
      }
    } else {
      prev = node;
    }

    node = node.next;
  }

  // Add new value.
  if (listener != null) {
    if (prev == null) {
      eventTarget[LISTENERS][type] = newNode(listener, ATTRIBUTE);
    } else {
      prev.next = newNode(listener, ATTRIBUTE);
    }
  }
}

function defineCustomEventTarget(EventTargetBase, types) {
  function EventTarget() {
    EventTargetBase.call(this);
  }

  var descripter = {
    constructor: {
      value: EventTarget,
      configurable: true,
      writable: true
    }
  };

  types.forEach(function (type) {
    descripter["on" + type] = {
      get: function get() {
        return getAttributeListener(this, type);
      },
      set: function set(listener) {
        setAttributeListener(this, type, listener);
      },
      configurable: true,
      enumerable: true
    };
  });

  EventTarget.prototype = Object.create(EventTargetBase.prototype, descripter);

  return EventTarget;
}
},{"./commons":4}],2:[function(require,module,exports){
"use strict";

module.exports = EventTarget;

var _commons = require("./commons");

var LISTENERS = _commons.LISTENERS;
var CAPTURE = _commons.CAPTURE;
var BUBBLE = _commons.BUBBLE;
var newNode = _commons.newNode;

var defineCustomEventTarget = require("./CustomEventTarget").defineCustomEventTarget;

var _EventWrapper = require("./EventWrapper");

var createEventWrapper = _EventWrapper.createEventWrapper;
var STOP_IMMEDIATE_PROPAGATION_FLAG = _EventWrapper.STOP_IMMEDIATE_PROPAGATION_FLAG;

var HAS_EVENTTARGET_INTERFACE = typeof window !== "undefined" && typeof window.EventTarget !== "undefined";

function EventTarget() {
  for (var _len = arguments.length, types = Array(_len), _key = 0; _key < _len; _key++) {
    types[_key] = arguments[_key];
  }

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
    Object.defineProperty(this, LISTENERS, { value: Object.create(null) });
  } else if (types.length > 0) {
    // To use to extend with attribute listener properties.
    // e.g.
    //     class MyCustomObject extends EventTarget("message", "error") {
    //       //...
    //     }
    return defineCustomEventTarget(EventTarget, types);
  } else {
    throw new TypeError("Cannot call a class as a function");
  }
}

EventTarget.prototype = Object.create((HAS_EVENTTARGET_INTERFACE ? window.EventTarget : Object).prototype, {
  constructor: {
    value: EventTarget,
    writable: true,
    configurable: true
  },

  addEventListener: {
    value: function addEventListener(type, listener) {
      var capture = arguments[2] === undefined ? false : arguments[2];

      if (listener == null) {
        return false;
      }
      if (typeof listener !== "function") {
        throw new TypeError("listener should be a function.");
      }

      var kind = capture ? CAPTURE : BUBBLE;
      var node = this[LISTENERS][type];
      if (node == null) {
        this[LISTENERS][type] = newNode(listener, kind);
        return true;
      }

      var prev = null;
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
    value: function removeEventListener(type, listener) {
      var capture = arguments[2] === undefined ? false : arguments[2];

      if (listener == null) {
        return false;
      }

      var kind = capture ? CAPTURE : BUBBLE;
      var prev = null;
      var node = this[LISTENERS][type];
      while (node != null) {
        if (node.listener === listener && node.kind === kind) {
          if (prev == null) {
            this[LISTENERS][type] = node.next;
          } else {
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
      // If listeners aren't registered, terminate.
      var node = this[LISTENERS][event.type];
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

      return !event.defaultPrevented;
    },
    configurable: true,
    writable: true
  }
});
},{"./CustomEventTarget":1,"./EventWrapper":3,"./commons":4}],3:[function(require,module,exports){
"use strict";

var _defineProperty = function (obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); };

exports.createEventWrapper = createEventWrapper;
Object.defineProperty(exports, "__esModule", {
  value: true
});

var symbol = require("./commons").symbol;

var STOP_IMMEDIATE_PROPAGATION_FLAG = symbol("stop_immediate_propagation_flag");

exports.STOP_IMMEDIATE_PROPAGATION_FLAG = STOP_IMMEDIATE_PROPAGATION_FLAG;
var CANCELED_FLAG = symbol("canceled_flag");
var ORIGINAL_EVENT = symbol("original_event");

var wrapperPrototypeDefinition = {
  stopPropagation: {
    value: function stopPropagation() {
      var e = this[ORIGINAL_EVENT];
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

      var e = this[ORIGINAL_EVENT];
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

      var e = this[ORIGINAL_EVENT];
      if (typeof e.preventDefault === "function") {
        e.preventDefault();
      }
    },
    writable: true,
    configurable: true
  },

  defaultPrevented: {
    get: function get() {
      return this[CANCELED_FLAG];
    },
    enumerable: true,
    configurable: true
  }
};

function createEventWrapper(event, eventTarget) {
  var timeStamp = typeof event.timeStamp === "number" ? event.timeStamp : Date.now();

  return Object.create(Object.create(event, wrapperPrototypeDefinition), (function () {
    var _Object$create = {
      type: { value: event.type, enumerable: true },
      target: { value: eventTarget, enumerable: true },
      currentTarget: { value: eventTarget, enumerable: true },
      eventPhase: { value: 2, enumerable: true },
      bubbles: { value: Boolean(event.bubbles), enumerable: true },
      cancelable: { value: Boolean(event.cancelable), enumerable: true },
      timeStamp: { value: timeStamp, enumerable: true },
      isTrusted: { value: false, enumerable: true } };

    _defineProperty(_Object$create, STOP_IMMEDIATE_PROPAGATION_FLAG, { value: false, writable: true });

    _defineProperty(_Object$create, CANCELED_FLAG, { value: false, writable: true });

    _defineProperty(_Object$create, ORIGINAL_EVENT, { value: event });

    return _Object$create;
  })());
}
},{"./commons":4}],4:[function(require,module,exports){


// Create a LinkedList structure for EventListener.
"use strict";

exports.newNode = newNode;
Object.defineProperty(exports, "__esModule", {
  value: true
});
var symbol = typeof Symbol !== "undefined" ? Symbol : function Symbol(name) {
  return "[[" + name + "_" + Math.random().toFixed(8).slice(2) + "]]";
};

exports.symbol = symbol;
var LISTENERS = symbol("listeners");
exports.LISTENERS = LISTENERS;
var CAPTURE = 1;
exports.CAPTURE = CAPTURE;
var BUBBLE = 2;
exports.BUBBLE = BUBBLE;
var ATTRIBUTE = 3;exports.ATTRIBUTE = ATTRIBUTE;

function newNode(listener, kind) {
  return { listener: listener, kind: kind, next: null };
}
},{}]},{},[2])(2)
});