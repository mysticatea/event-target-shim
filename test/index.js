/**
 * @author Toru Nagashima
 * @copyright 2015 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */

"use strict";

//-----------------------------------------------------------------------------
// Requirements
//-----------------------------------------------------------------------------

var assert = require("power-assert");
var spy = require("spy");
var EventTarget = require("../lib/event-target");

//-----------------------------------------------------------------------------
// Constants
//-----------------------------------------------------------------------------

var HAS_EVENT_TARGET_INTERFACE = (
    typeof window !== "undefined" &&
    typeof window.EventTarget !== "undefined"
);
var IS_CHROME = (
    typeof navigator !== "undefined" &&
    /Chrome/.test(navigator.userAgent)
);
var IS_CUSTOM_EVENT_CONSTRUCTOR_SUPPORTED = (function() {
    try {
        new CustomEvent( // eslint-disable-line no-new
            "test",
            {bubbles: false, cancelable: false, detail: "test"});
        return true;
    }
    catch (err) {
        return false;
    }
})();

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

// A helper to create an event.
function createEvent(type, bubbles, cancelable, detail) {
    if (typeof document !== "undefined") {
        var event = document.createEvent("Event");
        event.initEvent(type, Boolean(bubbles), Boolean(cancelable));
        event.detail = detail || null;
        return event;
    }

    return {
        type: type,
        timeStamp: Date.now(),
        bubbles: Boolean(bubbles),
        cancelable: Boolean(cancelable),
        detail: detail || null
    };
}

//-----------------------------------------------------------------------------
// Tests
//-----------------------------------------------------------------------------

describe("EventTarget:", function() {
    // Use extended class to test.
    function TestTarget() {
        EventTarget.call(this);
    }
    TestTarget.prototype = Object.create(EventTarget.prototype, {
        constructor: {
            value: TestTarget,
            configurable: true,
            writable: true
        }
    });

    // A test target.
    var target = null;

    // Initialize a test target.
    beforeEach(function() {
        target = new TestTarget();
    });
    afterEach(function() {
        target = null;
    });

    //
    // var's test!
    //

    (HAS_EVENT_TARGET_INTERFACE ? it : xit)("should be instanceof `window.EventTarget`.", function() {
        assert(target instanceof window.EventTarget);
    });

    (HAS_EVENT_TARGET_INTERFACE ? it : xit)("should not equal `EventTarget` and `window.EventTarget`.", function() {
        assert(EventTarget !== window.EventTarget);
    });

    it("should call registered listeners on called `dispatchEvent()`.", function() {
        var lastEvent = null;
        var listener = spy(function(e) { lastEvent = e; });
        var listener2 = spy();
        var event = createEvent("test", false, false, "detail");
        target.addEventListener("test", listener);
        target.addEventListener("test", listener2);
        target.dispatchEvent(event);

        assert(listener.callCount === 1);
        assert(listener2.callCount === 1);
        assert(lastEvent.type === "test");
        assert(lastEvent.target === target);
        assert(lastEvent.currentTarget === target);
        assert(lastEvent.eventPhase === 2);
        assert(lastEvent.bubbles === false);
        assert(lastEvent.cancelable === false);
        assert(lastEvent.defaultPrevented === false);
        assert(lastEvent.isTrusted === false);
        assert(lastEvent.timeStamp === event.timeStamp);
        assert(lastEvent.detail === "detail");
        assert(target.removeEventListener("test", listener2));
        assert(target.removeEventListener("test", listener));
    });

    it("should not call removed listeners.", function() {
        var listener = spy();
        var event = createEvent("test");
        target.addEventListener("test", listener);
        target.removeEventListener("test", listener);
        target.dispatchEvent(event);

        assert(listener.called === false);
    });

    it("it should not allow duplicate in listeners.", function() {
        var listener = spy();
        var event = createEvent("test");
        target.addEventListener("test", listener);
        target.addEventListener("test", listener);
        target.dispatchEvent(event);

        assert(listener.callCount === 1);
        assert(target.removeEventListener("test", listener));
        assert(target.removeEventListener("test", listener) === false);
    });

    it("should allow duplicate in listeners if those capture flag are different.", function() {
        var listener = spy();
        var event = createEvent("test");
        target.addEventListener("test", listener, true);
        target.addEventListener("test", listener, false);
        target.dispatchEvent(event);

        assert(listener.callCount === 2);
        assert(target.removeEventListener("test", listener, false));
        assert(target.removeEventListener("test", listener, true));
    });

    it("should not call registered listeners if its type is different.", function() {
        var listener = spy();
        var event = createEvent("test");
        target.addEventListener("test2", listener);
        target.dispatchEvent(event);

        assert(listener.called === false);
    });

    it("a result of `dispatchEvent()` should be true if hadn't canceled by listeners.", function() {
        var listener = spy();
        var event = createEvent("test");
        target.addEventListener("test", listener);
        var result = target.dispatchEvent(event);

        assert(result === true);
    });

    it("a result of `dispatchEvent()` should be false if had canceled by listeners.", function() {
        var listener = spy(function(e) { return e.preventDefault(); });
        var event = createEvent("test", false, true);
        target.addEventListener("test", listener);
        var result = target.dispatchEvent(event);

        assert(result === false);
    });

    it("should be not possible to cancel if the event cannot cancel.", function() {
        var listener = spy(function(e) { return e.preventDefault(); });
        var event = createEvent("test");
        target.addEventListener("test", listener);
        var result = target.dispatchEvent(event);

        assert(result === true);
    });

    it("should stop calling registered listeners immediately when called `e.stopImmediatePropagation()` by a listener.", function() {
        var listener1 = spy(function(e) { return e.stopImmediatePropagation(); });
        var listener2 = spy();
        var event = createEvent("test");
        target.addEventListener("test", listener1);
        target.addEventListener("test", listener2);
        var result = target.dispatchEvent(event);

        assert(listener1.callCount === 1);
        assert(listener2.called === false);
        assert(result === true);
    });

    it("should call registered listeners if a listener removed me.", function() {
        var listener1 = spy(function() { return target.removeEventListener(listener1); });
        var listener2 = spy();
        var event = createEvent("test");
        target.addEventListener("test", listener1);
        target.addEventListener("test", listener2);
        var result = target.dispatchEvent(event);

        assert(listener1.callCount === 1);
        assert(listener2.callCount === 1);
        assert(result === true);
    });

    it("should be possible to call `dispatchEvent()` with a plain object.", function() {
        var lastEvent = null;
        var listener = spy(function(e) { lastEvent = e; });
        var event = {type: "test", detail: "detail"};
        target.addEventListener("test", listener);
        target.dispatchEvent(event);

        assert(listener.callCount === 1);
        assert(lastEvent.type === "test");
        assert(lastEvent.target === target);
        assert(lastEvent.currentTarget === target);
        assert(lastEvent.eventPhase === 2);
        assert(lastEvent.bubbles === false);
        assert(lastEvent.cancelable === false);
        assert(lastEvent.defaultPrevented === false);
        assert(lastEvent.isTrusted === false);
        assert(typeof lastEvent.timeStamp === "number");
        assert(lastEvent.detail === "detail");
    });

    // IE is not supported.
    (IS_CUSTOM_EVENT_CONSTRUCTOR_SUPPORTED ? it : xit)("should work with CustomEvent", function() {
        var lastEvent = null;
        var event = new CustomEvent("test", {detail: 123});
        target.addEventListener("test", function(e) { lastEvent = e; });
        target.dispatchEvent(event);

        assert(lastEvent != null);
        assert(lastEvent.detail === event.detail);
    });

    it("cannot call a class as a function", function() {
        assert.throws(
            function() { EventTarget(); },
            "Cannot call a class as a function"
        );
    });

    it("should allow the listener is omitted", function() {
        target.addEventListener("test");
        target.removeEventListener("test");
    });

    it("should throw a TypeError if the listener is not a function or object with a handleEvent method", function() {
        assert.throws(
            function() { target.addEventListener("test", "listener"); },
            TypeError
        );
    });

    it("should allow a listener to be an object with a handleEvent method and have this set correctly", function() {
        var listener = {
            __proto__: {
                handleEvent: function() {
                    this.complete();
                },
                complete: function() {
                    assert(true);
                }
            }
        };
        var event = createEvent("test");
        target.addEventListener("test", listener);
        target.dispatchEvent(event);
    });
});

describe("EventTarget with attribute listeners:", function() {
    // Use extended class to test.
    function TestTarget() {
        EventTarget.call(this);
    }
    TestTarget.prototype = Object.create(EventTarget("test").prototype, {
        constructor: {
            value: TestTarget,
            configurable: true,
            writable: true
        }
    });

    // A test target.
    var target = null;

    // Initialize a test target.
    beforeEach(function() {
        target = new TestTarget();
    });
    afterEach(function() {
        target = null;
    });

    //
    // var's test!
    //

    (HAS_EVENT_TARGET_INTERFACE ? it : xit)("should be instanceof `window.EventTarget`.", function() {
        assert(target instanceof window.EventTarget);
    });

    (HAS_EVENT_TARGET_INTERFACE ? it : xit)("should not equal `EventTarget` and `window.EventTarget`.", function() {
        assert(EventTarget !== window.EventTarget);
    });

    it("should properties of attribute listener are null by default.", function() {
        assert(target.ontest === null);
    });

    // V8 has a bug.
    // See Also: https://code.google.com/p/v8/issues/detail?id=705
    (IS_CHROME ? xit : it)("should properties of attribute listener are enumerable.", function() {
        var keys = [];
        for (var key in target) {
            keys.push(key);
        }

        assert.deepEqual(keys, ["ontest"]);
    });

    it("should call attribute listeners when called `dispatchEvent()`.", function() {
        var listener = spy();
        var event = createEvent("test");
        target.ontest = listener;
        target.dispatchEvent(event);

        assert(target.ontest === listener);
        assert(listener.callCount === 1);
    });

    it("should not call removed listeners.", function() {
        var listener = spy();
        var event = createEvent("test");
        target.ontest = listener;
        target.ontest = null;
        target.dispatchEvent(event);

        assert(target.ontest === null);
        assert(listener.called === false);
    });

    it("should not allow duplicate in listeners.", function() {
        var listener = spy();
        var event = createEvent("test");
        target.ontest = listener;
        target.ontest = listener;
        target.dispatchEvent(event);

        assert(target.ontest === listener);
        assert(listener.callCount === 1);
    });

    it("should allow duplicate in listeners if these kind is different.", function() {
        var listener = spy();
        var event = createEvent("test");
        target.addEventListener("test", listener, false);
        target.ontest = listener;
        target.addEventListener("test", listener, true);
        target.dispatchEvent(event);

        assert(target.ontest === listener);
        assert(listener.callCount === 3);

        // for coverage.
        target.ontest = null;
        assert(target.ontest === null);
    });

    it("should throw a TypeError if the listener is not a function.", function() {
        assert.throws(
            function() { target.ontest = "listener"; },
            TypeError
        );
    });
});

describe("EventTarget with an array of attribute listeners:", function() {
    // Use extended class to test.
    function TestTarget() {
        EventTarget.call(this);
    }
    var events = ["test", "hello"];
    TestTarget.prototype = Object.create(EventTarget(events).prototype, {
        constructor: {
            value: TestTarget,
            configurable: true,
            writable: true
        }
    });

    // A test target.
    var target = null;

    // Initialize a test target.
    beforeEach(function() {
        target = new TestTarget();
    });
    afterEach(function() {
        target = null;
    });

    //
    // var's test!
    //

    (HAS_EVENT_TARGET_INTERFACE ? it : xit)("should be instanceof `window.EventTarget`.", function() {
        assert(target instanceof window.EventTarget);
    });

    (HAS_EVENT_TARGET_INTERFACE ? it : xit)("should not equal `EventTarget` and `window.EventTarget`.", function() {
        assert(EventTarget !== window.EventTarget);
    });

    it("should properties of attribute listener are null by default.", function() {
        assert(target.ontest === null);
    });

    // V8 has a bug.
    // See Also: https://code.google.com/p/v8/issues/detail?id=705
    (IS_CHROME ? xit : it)("should properties of attribute listener are enumerable.", function() {
        var keys = [];
        for (var key in target) {
            keys.push(key);
        }

        assert.deepEqual(keys, ["ontest", "onhello"]);
    });

    it("should call attribute listeners when called `dispatchEvent()`.", function() {
        var listener = spy();
        var event = createEvent("test");
        target.ontest = listener;
        target.dispatchEvent(event);

        assert(target.ontest === listener);
        assert(listener.callCount === 1);
    });

    it("should not call removed listeners.", function() {
        var listener = spy();
        var event = createEvent("test");
        target.ontest = listener;
        target.ontest = null;
        target.dispatchEvent(event);

        assert(target.ontest === null);
        assert(listener.called === false);
    });

    it("should not allow duplicate in listeners.", function() {
        var listener = spy();
        var event = createEvent("test");
        target.ontest = listener;
        target.ontest = listener;
        target.dispatchEvent(event);

        assert(target.ontest === listener);
        assert(listener.callCount === 1);
    });

    it("should allow duplicate in listeners if these kind is different.", function() {
        var listener = spy();
        var event = createEvent("test");
        target.addEventListener("test", listener, false);
        target.ontest = listener;
        target.addEventListener("test", listener, true);
        target.dispatchEvent(event);

        assert(target.ontest === listener);
        assert(listener.callCount === 3);

        // for coverage.
        target.ontest = null;
        assert(target.ontest === null);
    });

    it("should throw a TypeError if the listener is not a function.", function() {
        assert.throws(
            function() { target.ontest = "listener"; },
            TypeError
        );
    });
});
