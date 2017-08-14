/**
 * @author Toru Nagashima
 * @copyright 2015 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

/*globals CustomEvent, window */

var assert = require("power-assert")
var spy = require("spy")
var EventTarget = require("../lib/event-target")

//------------------------------------------------------------------------------
// Constants
//------------------------------------------------------------------------------

// To check working on Node.js
var HAS_EVENT_TARGET_INTERFACE = (
    typeof window !== "undefined" &&
    typeof window.EventTarget !== "undefined"
)

// "enumerable" flag cannot be overridden in V8 and IE.
// And the interface methods are enumerable in Blink.
// Firefox is perfect.
// See Also: https://code.google.com/p/v8/issues/detail?id=705
var IS_INTERFACE_METHODS_ENUMERABLE = (function() {
    var obj = Object.create(
        {test: 0},
        {test: {value: 0, enumerable: false}}
    )
    var keys = []
    var key = 0
    for (key in obj) {
        keys.push(key)
    }
    if (HAS_EVENT_TARGET_INTERFACE) {
        for (key in window.EventTarget.prototype) {
            keys.push(key)
        }
    }
    return keys.length === 4
})()

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

/**
 * The helper to create an event.
 *
 * @param {string} type - The type to create.
 * @param {boolean} bubbles - The bubbles flag to create.
 * @param {boolean} cancelable - The cancelable flag to create.
 * @param {any} detail - The detail information to create.
 * @returns {Event|object} The created event.
 */
function createEvent(type, bubbles, cancelable, detail) {
    return new CustomEvent(type, {
        bubbles: Boolean(bubbles),
        cancelable: Boolean(cancelable),
        detail: detail,
    })
}

/**
 * Run basic tests.
 * @returns {void}
 */
function doBasicTests() {
    (HAS_EVENT_TARGET_INTERFACE ? it : xit)("should be instanceof `window.EventTarget`.", /* @this */ function() {
        assert(this.target instanceof window.EventTarget)
    });

    (HAS_EVENT_TARGET_INTERFACE ? it : xit)("should not equal `EventTarget` and `window.EventTarget`.", /* @this */ function() {
        assert(EventTarget !== window.EventTarget)
    })

    it("should call registered listeners on called `dispatchEvent()`.", /* @this */ function() {
        var lastEvent = null
        var listenerThis = null
        var listener = spy(function(e) {
            lastEvent = e
            listenerThis = this // eslint-disable-line no-invalid-this
        })
        var listener2 = spy()
        var event = createEvent("test", false, false, "detail")
        this.target.addEventListener("test", listener)
        this.target.addEventListener("test", listener2)
        this.target.dispatchEvent(event)

        assert(listener.callCount === 1)
        assert(listener2.callCount === 1)
        assert(lastEvent.type === "test")
        assert(lastEvent.target === this.target)
        assert(lastEvent.currentTarget === this.target)
        assert(lastEvent.eventPhase === 2)
        assert(lastEvent.bubbles === false)
        assert(lastEvent.cancelable === false)
        assert(lastEvent.defaultPrevented === false)
        assert(lastEvent.timeStamp === event.timeStamp)
        assert(lastEvent.detail === "detail")
        assert(listenerThis === this.target)
        assert(this.target.removeEventListener("test", listener2))
        assert(this.target.removeEventListener("test", listener))
    })

    it("should not call removed listeners.", /* @this */ function() {
        var listener = spy()
        var event = createEvent("test")
        this.target.addEventListener("test", listener)
        this.target.removeEventListener("test", listener)
        this.target.dispatchEvent(event)

        assert(listener.called === false)
    })

    it("it should not allow duplicate in listeners.", /* @this */ function() {
        var listener = spy()
        var event = createEvent("test")
        this.target.addEventListener("test", listener)
        this.target.addEventListener("test", listener)
        this.target.dispatchEvent(event)

        assert(listener.callCount === 1)
        assert(this.target.removeEventListener("test", listener))
        assert(this.target.removeEventListener("test", listener) === false)
    })

    it("should allow duplicate in listeners if those capture flag are different.", /* @this */ function() {
        var listener = spy()
        var event = createEvent("test")
        this.target.addEventListener("test", listener, true)
        this.target.addEventListener("test", listener, false)
        this.target.dispatchEvent(event)

        assert(listener.callCount === 2)
        assert(this.target.removeEventListener("test", listener, false))
        assert(this.target.removeEventListener("test", listener, true))
    })

    it("should not call registered listeners if its type is different.", /* @this */ function() {
        var listener = spy()
        var event = createEvent("test")
        this.target.addEventListener("test2", listener)
        this.target.dispatchEvent(event)

        assert(listener.called === false)
    })

    it("a result of `dispatchEvent()` should be true if hadn't canceled by listeners.", /* @this */ function() {
        var listener = spy()
        var event = createEvent("test")
        this.target.addEventListener("test", listener)
        var result = this.target.dispatchEvent(event)

        assert(result === true)
    })

    it("a result of `dispatchEvent()` should be false if had canceled by listeners.", /* @this */ function() {
        var listener = spy(function(e) {
            return e.preventDefault()
        })
        var event = createEvent("test", false, true)
        this.target.addEventListener("test", listener)
        var result = this.target.dispatchEvent(event)

        assert(result === false)
    })

    it("should be not possible to cancel if the event cannot cancel.", /* @this */ function() {
        var listener = spy(function(e) {
            return e.preventDefault()
        })
        var event = createEvent("test")
        this.target.addEventListener("test", listener)
        var result = this.target.dispatchEvent(event)

        assert(result === true)
    })

    it("should stop calling registered listeners immediately when called `e.stopImmediatePropagation()` by a listener.", /* @this */ function() {
        var listener1 = spy(function(e) {
            return e.stopImmediatePropagation()
        })
        var listener2 = spy()
        var event = createEvent("test")
        this.target.addEventListener("test", listener1)
        this.target.addEventListener("test", listener2)
        var result = this.target.dispatchEvent(event)

        assert(listener1.callCount === 1)
        assert(listener2.called === false)
        assert(result === true)
    })

    it("should call registered listeners if a listener removed me.", /* @this */ function() {
        var listener1 = spy(function() {
            return this.target.removeEventListener(listener1)
        }.bind(this))
        var listener2 = spy()
        var event = createEvent("test")
        this.target.addEventListener("test", listener1)
        this.target.addEventListener("test", listener2)
        var result = this.target.dispatchEvent(event)

        assert(listener1.callCount === 1)
        assert(listener2.callCount === 1)
        assert(result === true)
    })

    it("should be possible to call `dispatchEvent()` with a plain object.", /* @this */ function() {
        var lastEvent = null
        var listener = spy(function(e) {
            lastEvent = e
        })
        var event = {type: "test", detail: "detail"}
        this.target.addEventListener("test", listener)
        this.target.dispatchEvent(event)

        assert(listener.callCount === 1)
        assert(lastEvent.type === "test")
        assert(lastEvent.target === this.target)
        assert(lastEvent.currentTarget === this.target)
        assert(lastEvent.eventPhase === 2)
        assert(lastEvent.bubbles === false)
        assert(lastEvent.cancelable === false)
        assert(lastEvent.defaultPrevented === false)
        assert(typeof lastEvent.timeStamp === "number")
        assert(lastEvent.detail === "detail")
    });

    it("cannot call a class as a function", /* @this */ function() {
        assert.throws(
            function() {
                EventTarget()
            },
            "Cannot call a class as a function"
        )
    })

    it("should allow the listener is omitted", /* @this */ function() {
        this.target.addEventListener("test")
        this.target.removeEventListener("test")
    })

    it("should throw a TypeError if the listener is neither of a function nor an object with \"handleEvent\" method", /* @this */ function() {
        assert.throws(
            function() {
                this.target.addEventListener("test", "listener")
            }.bind(this),
            TypeError
        )
        assert.throws(
            function() {
                this.target.addEventListener("test", false)
            }.bind(this),
            TypeError
        )
        assert.throws(
            function() {
                this.target.addEventListener("test", 0)
            }.bind(this),
            TypeError
        )
        assert.throws(
            function() {
                this.target.addEventListener("test", "")
            }.bind(this),
            TypeError
        )
    })

    it("should allow an object which has \"handleEvent\" method as a listener.", /* @this */ function() {
        var lastEvent = null
        var listenerThis = null
        var listener = {
            handleEvent: spy(function(e) {
                lastEvent = e
                listenerThis = this // eslint-disable-line no-invalid-this
            }),
        }
        var event = createEvent("test", false, false, "detail")
        this.target.addEventListener("test", listener)
        this.target.dispatchEvent(event)

        assert(listener.handleEvent.callCount === 1)
        assert(lastEvent.type === "test")
        assert(lastEvent.target === this.target)
        assert(lastEvent.currentTarget === this.target)
        assert(lastEvent.eventPhase === 2)
        assert(lastEvent.bubbles === false)
        assert(lastEvent.cancelable === false)
        assert(lastEvent.defaultPrevented === false)
        assert(lastEvent.timeStamp === event.timeStamp)
        assert(lastEvent.detail === "detail")
        assert(listenerThis === listener)
        assert(this.target.removeEventListener("test", listener))
    })

    it("should not call removed listeners (an object with \"handleEvent\" method).", /* @this */ function() {
        var listener = {handleEvent: spy()}
        var event = createEvent("test")
        this.target.addEventListener("test", listener)
        this.target.removeEventListener("test", listener)
        this.target.dispatchEvent(event)

        assert(listener.handleEvent.called === false)
    })

    it("should accept an object without \"handleEvent\" method.", /* @this */ function() {
        var listener = {}
        this.target.addEventListener("test", listener)
        this.target.dispatchEvent(createEvent("test"))

        var handleEvent = listener.handleEvent = spy()
        this.target.dispatchEvent(createEvent("test"))

        listener.handleEvent = {}
        this.target.dispatchEvent(createEvent("test"))

        delete listener.handleEvent
        this.target.dispatchEvent(createEvent("test"))

        assert(handleEvent.callCount === 1)
    })

    it("should not call \"handleEvent\" method if the object is a function.", /* @this */ function() {
        var listener = spy()
        listener.handleEvent = spy()
        this.target.addEventListener("test", listener)
        this.target.dispatchEvent(createEvent("test"))

        assert(listener.callCount === 1)
        assert(listener.handleEvent.callCount === 0)
    })

    it("should allow a listener to be an object with a handleEvent method and have this set correctly", /* @this */ function() {
        var listener = {
            __proto__: {
                handleEvent: function() {
                    this.complete()
                },
                complete: spy(),
            },
        }

        var event = createEvent("test")
        this.target.addEventListener("test", listener)
        this.target.dispatchEvent(event)

        assert(listener.complete.callCount === 1)
    })

    it("should not call removed object listeners.", /* @this */ function() {
        var listener = {
            __proto__: {
                handleEvent: function() {
                    this.complete()
                },
                complete: spy(),
            },
        }

        var event = createEvent("test")
        this.target.addEventListener("test", listener)
        this.target.removeEventListener("test", listener)
        this.target.dispatchEvent(event)

        assert(listener.complete.callCount === 0)
    })

    it("it should call the listener with `once` option only one time.", /* @this */ function() {
        var listener = spy()
        this.target.addEventListener("test", listener, {once: true})
        this.target.dispatchEvent(createEvent("test"))
        this.target.dispatchEvent(createEvent("test"))

        assert(listener.callCount === 1)
        assert(this.target.removeEventListener("test", listener) === false)
    })

    it("should allow duplicate listeners if those capture flag are different (`{}` and `true`).", /* @this */ function() {
        var listener = spy()
        var event = createEvent("test")
        this.target.addEventListener("test", listener, {})
        this.target.addEventListener("test", listener, true)
        this.target.dispatchEvent(event)

        assert(listener.callCount === 2)
        assert(this.target.removeEventListener("test", listener, false))
        assert(this.target.removeEventListener("test", listener, true))
    })

    it("should allow duplicate listeners if those capture flag are different (`{capture: true}` and `false`).", /* @this */ function() {
        var listener = spy()
        var event = createEvent("test")
        this.target.addEventListener("test", listener, {capture: true})
        this.target.addEventListener("test", listener, false)
        this.target.dispatchEvent(event)

        assert(listener.callCount === 2)
        assert(this.target.removeEventListener("test", listener, false))
        assert(this.target.removeEventListener("test", listener, true))
    })

    it("should disallow duplicate listeners if those capture flag are same (`{}` and `false`).", /* @this */ function() {
        var listener = spy()
        var event = createEvent("test")
        this.target.addEventListener("test", listener, {})
        this.target.addEventListener("test", listener, false)
        this.target.dispatchEvent(event)

        assert(listener.callCount === 1)
        assert(this.target.removeEventListener("test", listener, {capture: false}))
        assert(this.target.removeEventListener("test", listener, {capture: false}) === false)
    })

    it("should disallow duplicate listeners if those capture flag are same (`{capture: true}` and `true`).", /* @this */ function() {
        var listener = spy()
        var event = createEvent("test")
        this.target.addEventListener("test", listener, {capture: true})
        this.target.addEventListener("test", listener, true)
        this.target.dispatchEvent(event)

        assert(listener.callCount === 1)
        assert(this.target.removeEventListener("test", listener, {capture: true}))
        assert(this.target.removeEventListener("test", listener, {capture: true}) === false)
    })

    it("a result of `dispatchEvent()` should be true even if had canceled by passive listeners.", /* @this */ function() {
        var listener = spy(function(e) {
            return e.preventDefault()
        })
        var event = createEvent("test", false, true)
        this.target.addEventListener("test", listener, {passive: true})
        var result = this.target.dispatchEvent(event)

        assert(result === true)
    })

    it("a result of `dispatchEvent()` should be false even if had canceled by non-passive listeners.", /* @this */ function() {
        var listener = spy(function(e) {
            return e.preventDefault()
        })
        var event = createEvent("test", false, true)
        this.target.addEventListener("test", listener, {passive: false})
        var result = this.target.dispatchEvent(event)

        assert(result === false)
    })

    it("it should call the listeners with `once` option only one time.", /* @this */ function() {
        var listener1 = spy()
        var listener2 = spy()
        this.target.addEventListener("test", listener1, {once: true})
        this.target.addEventListener("test", listener2, {once: true})
        this.target.dispatchEvent(createEvent("test"))
        this.target.dispatchEvent(createEvent("test"))

        assert(listener1.callCount === 1)
        assert(listener2.callCount === 1)
        assert(this.target.removeEventListener("test", listener1) === false)
        assert(this.target.removeEventListener("test", listener2) === false)
    })
}

/**
 * Run tests for attribute listeners.
 * @returns {void}
 */
function doAttributeListenerTests() {
    it("should properties of attribute listener are null by default.", /* @this */ function() {
        assert(this.target.ontest === null)
    });

    (IS_INTERFACE_METHODS_ENUMERABLE ? xit : it)("should properties of attribute listener are enumerable.", /* @this */ function() {
        var keys = []
        for (var key in this.target) {
            keys.push(key)
        }

        assert.deepEqual(keys, ["ontest", "onhello"])
    })

    it("should call attribute listeners when called `dispatchEvent()`.", /* @this */ function() {
        var listener = spy()
        var event = createEvent("test")
        this.target.ontest = listener
        this.target.dispatchEvent(event)

        assert(this.target.ontest === listener)
        assert(listener.callCount === 1)
    })

    it("should not call removed listeners.", /* @this */ function() {
        var listener = spy()
        var event = createEvent("test")
        this.target.ontest = listener
        this.target.ontest = null
        this.target.dispatchEvent(event)

        assert(this.target.ontest === null)
        assert(listener.called === false)
    })

    it("should not allow duplicate in listeners.", /* @this */ function() {
        var listener = spy()
        var event = createEvent("test")
        this.target.ontest = listener
        this.target.ontest = listener
        this.target.dispatchEvent(event)

        assert(this.target.ontest === listener)
        assert(listener.callCount === 1)
    })

    it("should allow duplicate in listeners if these kind is different.", /* @this */ function() {
        var listener = spy()
        var event = createEvent("test")
        this.target.addEventListener("test", listener, false)
        this.target.ontest = listener
        this.target.addEventListener("test", listener, true)
        this.target.dispatchEvent(event)

        assert(this.target.ontest === listener)
        assert(listener.callCount === 3)

        // for coverage.
        this.target.ontest = null
        assert(this.target.ontest === null)
    })

    it("should ignore if the listener is not an object.", /* @this */ function() {
        this.target.ontest = "listener"
        assert(this.target.ontest === null)

        this.target.ontest = ""
        assert(this.target.ontest === null)

        this.target.ontest = false
        assert(this.target.ontest === null)

        this.target.ontest = 0
        assert(this.target.ontest === null)
    })

    it("should store but not call if the listener is an object.", /* @this */ function() {
        var listener = {handleEvent: spy()}

        this.target.ontest = listener
        this.target.dispatchEvent(createEvent("test"))

        assert(this.target.ontest === listener)
        assert(listener.handleEvent.callCount === 0)
    })

    it("should handle a non object as null.", /* @this */ function() {
        var listener = {}

        this.target.ontest = listener
        assert(this.target.ontest === listener)

        this.target.ontest = "listener"
        assert(this.target.ontest === null)
    })
}

//-----------------------------------------------------------------------------
// Tests
//-----------------------------------------------------------------------------

describe("EventTarget:", function() {
    /**
     * Use extended class to test.
     * @constructor
     */
    function TestTarget() {
        EventTarget.call(this)
    }
    TestTarget.prototype = Object.create(EventTarget.prototype, {
        constructor: {
            value: TestTarget,
            configurable: true,
            writable: true,
        },
    })

    // Initialize a test target.
    beforeEach(/* @this */ function() {
        this.target = new TestTarget()
    })
    afterEach(/* @this */ function() {
        this.target = null
    })

    doBasicTests()
})

describe("EventTarget with attribute listeners:", function() {
    /**
     * Use extended class to test.
     * @constructor
     */
    function TestTarget() {
        EventTarget.call(this)
    }
    TestTarget.prototype = Object.create(EventTarget("test", "hello").prototype, {
        constructor: {
            value: TestTarget,
            configurable: true,
            writable: true,
        },
    })

    // Initialize a test target.
    beforeEach(/* @this */ function() {
        this.target = new TestTarget()
    })
    afterEach(/* @this */ function() {
        this.target = null
    })

    doBasicTests()
    doAttributeListenerTests()
})

describe("EventTarget with an array of attribute listeners:", function() {
    /**
     * Use extended class to test.
     * @constructor
     */
    function TestTarget() {
        EventTarget.call(this)
    }
    var events = ["test", "hello"]
    TestTarget.prototype = Object.create(EventTarget(events).prototype, {
        constructor: {
            value: TestTarget,
            configurable: true,
            writable: true,
        },
    })

    // Initialize a test target.
    beforeEach(/* @this */ function() {
        this.target = new TestTarget()
    })
    afterEach(/* @this */ function() {
        this.target = null
    })

    doBasicTests()
    doAttributeListenerTests()
})
