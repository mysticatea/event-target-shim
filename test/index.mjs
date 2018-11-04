/**
 * @author Toru Nagashima
 * @copyright 2015 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
import assert from "assert"
import { spy } from "@mysticatea/spy"
import EventTarget from "../src/event-target.mjs"

/*globals CustomEvent, document, window */

// To check working on Node.js
const HAS_EVENT_TARGET_INTERFACE =
    typeof window !== "undefined" && typeof window.EventTarget !== "undefined"

// CustomEvent constructor cannot be used in IE.
const IS_CUSTOM_EVENT_CONSTRUCTOR_SUPPORTED = (function() {
    try {
        //eslint-disable-next-line no-new
        new CustomEvent("test", {
            bubbles: false,
            cancelable: false,
            detail: "test",
        })
        return true
    } catch (_err) {
        return false
    }
})()

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
    if (typeof document !== "undefined") {
        const event = document.createEvent("Event")
        event.initEvent(type, Boolean(bubbles), Boolean(cancelable))
        event.detail = detail || null
        return event
    }

    return {
        type,
        timeStamp: Date.now(),
        bubbles: Boolean(bubbles),
        cancelable: Boolean(cancelable),
        detail: detail || null,
    }
}

/**
 * Run basic tests.
 * @returns {void}
 */
function doBasicTests() {
    ;(HAS_EVENT_TARGET_INTERFACE ? it : xit)(
        "should be instanceof `window.EventTarget`.",
        /* @this */ function() {
            assert(this.target instanceof window.EventTarget)
        },
    )
    ;(HAS_EVENT_TARGET_INTERFACE ? it : xit)(
        "should not equal `EventTarget` and `window.EventTarget`.",
        () => {
            assert(EventTarget !== window.EventTarget)
        },
    )

    it("should call registered listeners on called `dispatchEvent()`.", /* @this */ function() {
        let lastEvent = null
        let eventPhase = 0
        let currentTarget = null
        let composedPath = null
        let listenerThis = null
        const listener = spy(function(e) {
            lastEvent = e
            eventPhase = e.eventPhase
            currentTarget = e.currentTarget
            composedPath = e.composedPath()
            listenerThis = this // eslint-disable-line no-invalid-this
        })
        const listener2 = spy()
        const event = createEvent("test", false, false, "detail")
        this.target.addEventListener("test", listener)
        this.target.addEventListener("test", listener2)
        this.target.dispatchEvent(event)

        assert(listener.calls.length === 1)
        assert(listener2.calls.length === 1)
        assert(lastEvent.type === "test")
        assert(lastEvent.target === this.target)
        assert(lastEvent.currentTarget === null)
        assert(currentTarget === this.target)
        assert(lastEvent.eventPhase === 0)
        assert(eventPhase === 2)
        assert(lastEvent.bubbles === false)
        assert(lastEvent.cancelable === false)
        assert(lastEvent.defaultPrevented === false)
        assert(lastEvent.isTrusted === false)
        assert(lastEvent.timeStamp === event.timeStamp)
        assert(lastEvent.detail === "detail")
        assert(lastEvent.composedPath().length === 0)
        assert(composedPath.length === 1)
        assert(composedPath[0] === this.target)
        assert(lastEvent.NONE === 0)
        assert(lastEvent.CAPTURING_PHASE === 1)
        assert(lastEvent.AT_TARGET === 2)
        assert(lastEvent.BUBBLING_PHASE === 3)
        assert(listenerThis === this.target)
        assert(this.target.removeEventListener("test", listener2))
        assert(this.target.removeEventListener("test", listener))
    })

    it("should not call removed listeners.", /* @this */ function() {
        const listener = spy()
        const event = createEvent("test")
        this.target.addEventListener("test", listener)
        this.target.removeEventListener("test", listener)
        this.target.dispatchEvent(event)

        assert(listener.calls.length === 0)
    })

    it("it should not allow duplicate in listeners.", /* @this */ function() {
        const listener = spy()
        const event = createEvent("test")
        this.target.addEventListener("test", listener)
        this.target.addEventListener("test", listener)
        this.target.dispatchEvent(event)

        assert(listener.calls.length === 1)
        assert(this.target.removeEventListener("test", listener))
        assert(this.target.removeEventListener("test", listener) === false)
    })

    it("should allow duplicate in listeners if those capture flag are different.", /* @this */ function() {
        const listener = spy()
        const event = createEvent("test")
        this.target.addEventListener("test", listener, true)
        this.target.addEventListener("test", listener, false)
        this.target.dispatchEvent(event)

        assert(listener.calls.length === 2)
        assert(this.target.removeEventListener("test", listener, false))
        assert(this.target.removeEventListener("test", listener, true))
    })

    it("should not call registered listeners if its type is different.", /* @this */ function() {
        const listener = spy()
        const event = createEvent("test")
        this.target.addEventListener("test2", listener)
        this.target.dispatchEvent(event)

        assert(listener.calls.length === 0)
    })

    it("a result of `dispatchEvent()` should be true if hadn't canceled by listeners.", /* @this */ function() {
        const listener = spy()
        const event = createEvent("test")
        this.target.addEventListener("test", listener)
        const result = this.target.dispatchEvent(event)

        assert(result === true)
    })

    it("a result of `dispatchEvent()` should be false if had canceled by listeners.", /* @this */ function() {
        const listener = spy(e => e.preventDefault())
        const event = createEvent("test", false, true)
        this.target.addEventListener("test", listener)
        const result = this.target.dispatchEvent(event)

        assert(result === false)
    })

    it("'event.preventDefault' should be called when 'preventDefault' is called.", /* @this */ function() {
        const listener = spy(e => e.preventDefault())
        const event = createEvent("test", false, true)
        event.preventDefault = spy()

        this.target.addEventListener("test", listener)
        this.target.dispatchEvent(event)

        assert(event.preventDefault.calls.length === 1)
    })

    it("should be not possible to cancel if the event cannot cancel.", /* @this */ function() {
        const listener = spy(e => e.preventDefault())
        const event = createEvent("test")
        this.target.addEventListener("test", listener)
        const result = this.target.dispatchEvent(event)

        assert(result === true)
    })

    it("'event.stopPropagation' should be called when 'stopPropagation' is called.", /* @this */ function() {
        const listener = spy(e => e.stopPropagation())
        const event = createEvent("test", false, true)
        event.stopPropagation = spy()

        this.target.addEventListener("test", listener)
        this.target.dispatchEvent(event)

        assert(event.stopPropagation.calls.length === 1)
    })

    it("should stop calling registered listeners immediately when called `e.stopImmediatePropagation()` by a listener.", /* @this */ function() {
        const listener1 = spy(e => e.stopImmediatePropagation())
        const listener2 = spy()
        const event = createEvent("test")
        this.target.addEventListener("test", listener1)
        this.target.addEventListener("test", listener2)
        const result = this.target.dispatchEvent(event)

        assert(listener1.calls.length === 1)
        assert(listener2.calls.length === 0)
        assert(result === true)
    })

    it("'event.stopImmediatePropagation' should be called when 'stopImmediatePropagation' is called.", /* @this */ function f() {
        const listener = spy(e => e.stopImmediatePropagation())
        const event = createEvent("test", false, true)
        event.stopImmediatePropagation = spy()

        this.target.addEventListener("test", listener)
        this.target.dispatchEvent(event)

        assert(event.stopImmediatePropagation.calls.length === 1)
    })

    it("should call registered listeners if a listener removed me.", /* @this */ function() {
        const listener1 = spy(() => this.target.removeEventListener(listener1))
        const listener2 = spy()
        const event = createEvent("test")
        this.target.addEventListener("test", listener1)
        this.target.addEventListener("test", listener2)
        const result = this.target.dispatchEvent(event)

        assert(listener1.calls.length === 1)
        assert(listener2.calls.length === 1)
        assert(result === true)
    })

    it("should be possible to call `dispatchEvent()` with a plain object.", /* @this */ function() {
        let lastEvent = null
        let currentTarget = null
        const listener = spy(e => {
            lastEvent = e
            currentTarget = e.currentTarget
        })
        const event = { type: "test", detail: "detail" }
        this.target.addEventListener("test", listener)
        this.target.dispatchEvent(event)

        assert(listener.calls.length === 1)
        assert(lastEvent.type === "test")
        assert(lastEvent.target === this.target)
        assert(currentTarget === this.target)
        assert(lastEvent.eventPhase === 0)
        assert(lastEvent.bubbles === false)
        assert(lastEvent.cancelable === false)
        assert(lastEvent.defaultPrevented === false)
        assert(lastEvent.isTrusted === false)
        assert(typeof lastEvent.timeStamp === "number")
        assert(lastEvent.detail === "detail")
    })

    // IE is not supported.
    ;(IS_CUSTOM_EVENT_CONSTRUCTOR_SUPPORTED ? it : xit)(
        "should work with CustomEvent",
        /* @this */ function() {
            let lastEvent = null
            const event = new CustomEvent("test", { detail: 123 })
            this.target.addEventListener("test", e => {
                lastEvent = e
            })
            this.target.dispatchEvent(event)

            assert(lastEvent != null)
            assert(lastEvent.detail === event.detail)
        },
    )

    it("cannot call a class as a function", () => {
        assert.throws(() => {
            EventTarget()
        }, /Cannot call a class as a function/u)
    })

    it("should allow the listener is omitted", /* @this */ function() {
        this.target.addEventListener("test")
        this.target.removeEventListener("test")
    })

    it('should throw a TypeError if the listener is neither of a function nor an object with "handleEvent" method', /* @this */ function() {
        assert.throws(() => {
            this.target.addEventListener("test", "listener")
        }, TypeError)
        assert.throws(() => {
            this.target.addEventListener("test", false)
        }, TypeError)
        assert.throws(() => {
            this.target.addEventListener("test", 0)
        }, TypeError)
        assert.throws(() => {
            this.target.addEventListener("test", "")
        }, TypeError)
    })

    it('should allow an object which has "handleEvent" method as a listener.', /* @this */ function() {
        let lastEvent = null
        let currentTarget = null
        let listenerThis = null
        const listener = {
            handleEvent: spy(function(e) {
                lastEvent = e
                currentTarget = e.currentTarget
                listenerThis = this // eslint-disable-line no-invalid-this
            }),
        }
        const event = createEvent("test", false, false, "detail")
        this.target.addEventListener("test", listener)
        this.target.dispatchEvent(event)

        assert(listener.handleEvent.calls.length === 1)
        assert(lastEvent.type === "test")
        assert(lastEvent.target === this.target)
        assert(currentTarget === this.target)
        assert(lastEvent.eventPhase === 0)
        assert(lastEvent.bubbles === false)
        assert(lastEvent.cancelable === false)
        assert(lastEvent.defaultPrevented === false)
        assert(lastEvent.isTrusted === false)
        assert(lastEvent.timeStamp === event.timeStamp)
        assert(lastEvent.detail === "detail")
        assert(listenerThis === listener)
        assert(this.target.removeEventListener("test", listener))
    })

    it('should not call removed listeners (an object with "handleEvent" method).', /* @this */ function() {
        const listener = { handleEvent: spy() }
        const event = createEvent("test")
        this.target.addEventListener("test", listener)
        this.target.removeEventListener("test", listener)
        this.target.dispatchEvent(event)

        assert(listener.handleEvent.calls.length === 0)
    })

    it('should accept an object without "handleEvent" method.', /* @this */ function() {
        const listener = {}
        this.target.addEventListener("test", listener)
        this.target.dispatchEvent(createEvent("test"))

        const handleEvent = (listener.handleEvent = spy())
        this.target.dispatchEvent(createEvent("test"))

        listener.handleEvent = {}
        this.target.dispatchEvent(createEvent("test"))

        delete listener.handleEvent
        this.target.dispatchEvent(createEvent("test"))

        assert(handleEvent.calls.length === 1)
    })

    it('should not call "handleEvent" method if the object is a function.', /* @this */ function() {
        const listener = spy()
        listener.handleEvent = spy()
        this.target.addEventListener("test", listener)
        this.target.dispatchEvent(createEvent("test"))

        assert(listener.calls.length === 1)
        assert(listener.handleEvent.calls.length === 0)
    })

    it("should allow a listener to be an object with a handleEvent method and have this set correctly", /* @this */ function() {
        const listener = {
            __proto__: {
                handleEvent() {
                    this.complete()
                },
                complete: spy(),
            },
        }

        const event = createEvent("test")
        this.target.addEventListener("test", listener)
        this.target.dispatchEvent(event)

        assert(listener.complete.calls.length === 1)
    })

    it("should not call removed object listeners.", /* @this */ function() {
        const listener = {
            __proto__: {
                handleEvent() {
                    this.complete()
                },
                complete: spy(),
            },
        }

        const event = createEvent("test")
        this.target.addEventListener("test", listener)
        this.target.removeEventListener("test", listener)
        this.target.dispatchEvent(event)

        assert(listener.complete.calls.length === 0)
    })

    it("it should call the listener with `once` option only one time.", /* @this */ function() {
        const listener = spy()
        this.target.addEventListener("test", listener, { once: true })
        this.target.dispatchEvent(createEvent("test"))
        this.target.dispatchEvent(createEvent("test"))

        assert(listener.calls.length === 1)
        assert(this.target.removeEventListener("test", listener) === false)
    })

    it("should allow duplicate listeners if those capture flag are different (`{}` and `true`).", /* @this */ function() {
        const listener = spy()
        const event = createEvent("test")
        this.target.addEventListener("test", listener, {})
        this.target.addEventListener("test", listener, true)
        this.target.dispatchEvent(event)

        assert(listener.calls.length === 2)
        assert(this.target.removeEventListener("test", listener, false))
        assert(this.target.removeEventListener("test", listener, true))
    })

    it("should allow duplicate listeners if those capture flag are different (`{capture: true}` and `false`).", /* @this */ function() {
        const listener = spy()
        const event = createEvent("test")
        this.target.addEventListener("test", listener, { capture: true })
        this.target.addEventListener("test", listener, false)
        this.target.dispatchEvent(event)

        assert(listener.calls.length === 2)
        assert(this.target.removeEventListener("test", listener, false))
        assert(this.target.removeEventListener("test", listener, true))
    })

    it("should disallow duplicate listeners if those capture flag are same (`{}` and `false`).", /* @this */ function() {
        const listener = spy()
        const event = createEvent("test")
        this.target.addEventListener("test", listener, {})
        this.target.addEventListener("test", listener, false)
        this.target.dispatchEvent(event)

        assert(listener.calls.length === 1)
        assert(
            this.target.removeEventListener("test", listener, {
                capture: false,
            }),
        )
        assert(
            this.target.removeEventListener("test", listener, {
                capture: false,
            }) === false,
        )
    })

    it("should disallow duplicate listeners if those capture flag are same (`{capture: true}` and `true`).", /* @this */ function() {
        const listener = spy()
        const event = createEvent("test")
        this.target.addEventListener("test", listener, { capture: true })
        this.target.addEventListener("test", listener, true)
        this.target.dispatchEvent(event)

        assert(listener.calls.length === 1)
        assert(
            this.target.removeEventListener("test", listener, {
                capture: true,
            }),
        )
        assert(
            this.target.removeEventListener("test", listener, {
                capture: true,
            }) === false,
        )
    })

    it("a result of `dispatchEvent()` should be true even if had canceled by passive listeners.", /* @this */ function() {
        const listener = spy(e => e.preventDefault())
        const event = createEvent("test", false, true)
        this.target.addEventListener("test", listener, { passive: true })
        const result = this.target.dispatchEvent(event)

        assert(result === true)
    })

    it("a result of `dispatchEvent()` should be false even if had canceled by non-passive listeners.", /* @this */ function() {
        const listener = spy(e => e.preventDefault())
        const event = createEvent("test", false, true)
        this.target.addEventListener("test", listener, { passive: false })
        const result = this.target.dispatchEvent(event)

        assert(result === false)
    })

    it("'event.preventDefault` should not be called if had canceled by passive listeners.", /* @this */ function() {
        const listener = spy(e => e.preventDefault())
        const event = createEvent("test", false, true)
        event.preventDefault = spy()

        this.target.addEventListener("test", listener, { passive: true })
        this.target.dispatchEvent(event)

        assert(event.preventDefault.calls.length === 0)
    })

    it("'event.stopPropagation` should be called even if had called by passive listeners.", /* @this */ function() {
        const listener = spy(e => e.stopPropagation())
        const event = createEvent("test", false, true)
        event.stopPropagation = spy()

        this.target.addEventListener("test", listener, { passive: true })
        this.target.dispatchEvent(event)

        assert(event.stopPropagation.calls.length === 1)
    })

    it("'event.stopImmediatePropagation` should be called even if had called by passive listeners.", /* @this */ function() {
        const listener = spy(e => e.stopImmediatePropagation())
        const event = createEvent("test", false, true)
        event.stopImmediatePropagation = spy()

        this.target.addEventListener("test", listener, { passive: true })
        this.target.dispatchEvent(event)

        assert(event.stopImmediatePropagation.calls.length === 1)
    })

    it("it should call the listeners with `once` option only one time.", /* @this */ function() {
        const listener1 = spy()
        const listener2 = spy()
        this.target.addEventListener("test", listener1, { once: true })
        this.target.addEventListener("test", listener2, { once: true })
        this.target.dispatchEvent(createEvent("test"))
        this.target.dispatchEvent(createEvent("test"))

        assert(listener1.calls.length === 1)
        assert(listener2.calls.length === 1)
        assert(this.target.removeEventListener("test", listener1) === false)
        assert(this.target.removeEventListener("test", listener2) === false)
    })

    it("should can get a value from original event property even if the property is a getter of prototype.", /* @this */ function() {
        let eventThis = null
        let lastValue = null
        const proto = {
            get value() {
                eventThis = this
                return 0
            },
        }
        const event = Object.create(proto)
        event.type = "test"

        this.target.addEventListener("test", e => (lastValue = e.value))
        this.target.dispatchEvent(event)

        assert(eventThis === event)
        assert(lastValue === 0)
    })

    it("should can set a value to original event property even if the property is a setter of prototype.", /* @this */ function() {
        let eventThis = null
        let lastValue = null
        const proto = {
            get value() {
                return 0
            },
            set value(value) {
                eventThis = this
                lastValue = value
            },
        }
        const event = Object.create(proto)
        event.type = "test"

        this.target.addEventListener("test", e => (e.value = 10))
        this.target.dispatchEvent(event)

        assert(eventThis === event)
        assert(lastValue === 10)
    })

    it("should can call a method of original event even if the property is a method of prototype.", /* @this */ function() {
        let eventThis = null
        let lastValue = null
        const proto = {
            foo(value) {
                eventThis = this
                lastValue = value
            },
        }
        const event = Object.create(proto)
        event.type = "test"

        this.target.addEventListener("test", e => e.foo(100))
        this.target.dispatchEvent(event)

        assert(eventThis === event)
        assert(lastValue === 100)
    })

    it("'event.srcElement` should equal to `event.target`.", /* @this */ function() {
        const listener = spy(event => {
            assert.strictEqual(event.srcElement, event.target)
        })

        this.target.addEventListener("test", listener)
        this.target.dispatchEvent(createEvent("test", false, false))

        assert.strictEqual(listener.calls.length, 1)
    })

    //
    ;[true, false].forEach(bubbles => {
        it(`'event.cancelBubble' should apply to the original event object if 'bubbles' is ${bubbles}.`, /* @this */ function() {
            const values = []
            const listener = spy(event => {
                values.push(event.cancelBubble)
                event.cancelBubble = true
                values.push(event.cancelBubble)

                // Assigning false does nothing.
                event.cancelBubble = false
                values.push(event.cancelBubble)
            })
            const event = createEvent("test", bubbles, false)
            const hasCancelBubble = typeof event.cancelBubble === "boolean"
            let setCancelBubble = null

            if (hasCancelBubble) {
                const d = Object.getOwnPropertyDescriptor(
                    Object.getPrototypeOf(event),
                    "cancelBubble",
                )
                Object.defineProperty(event, "cancelBubble", {
                    get: () => d.get.call(event),
                    set: (setCancelBubble = spy(value => {
                        d.set.call(event, value)
                    })),
                })
            }

            this.target.addEventListener("test", listener)
            this.target.dispatchEvent(event)

            assert.strictEqual(listener.calls.length, 1)
            assert.deepStrictEqual(values, [false, true, true])
            assert.strictEqual(
                hasCancelBubble ? setCancelBubble.calls.length : 1,
                1,
            )
        })
    })

    it("'event.cancelBubble` should be true after 'event.stopPropagation' is called.", /* @this */ function() {
        const values = []
        const listener = spy(event => {
            values.push(event.cancelBubble)
            event.stopPropagation()
            values.push(event.cancelBubble)
        })
        const event = createEvent("test", false, false)
        const hasCancelBubble = typeof event.cancelBubble === "boolean"

        this.target.addEventListener("test", listener)
        this.target.dispatchEvent(event)

        assert.strictEqual(listener.calls.length, 1)
        assert.deepStrictEqual(values, [false, true])
        assert.strictEqual(
            event.cancelBubble,
            hasCancelBubble ? true : undefined,
        )
    })

    it("'event.cancelBubble` should be true after 'event.stopImmediatePropagation' is called.", /* @this */ function() {
        const values = []
        const listener = spy(event => {
            values.push(event.cancelBubble)
            event.stopImmediatePropagation()
            values.push(event.cancelBubble)
        })
        const event = createEvent("test", false, false)
        const hasCancelBubble = typeof event.cancelBubble === "boolean"

        this.target.addEventListener("test", listener)
        this.target.dispatchEvent(event)

        assert.strictEqual(listener.calls.length, 1)
        assert.deepStrictEqual(values, [false, true])
        assert.strictEqual(
            event.cancelBubble,
            hasCancelBubble ? true : undefined,
        )
    })

    it("'event.returnValue` should apply to the original event object if `cancelable` is true.", /* @this */ function() {
        const values = []
        const listener = spy(event => {
            values.push(event.returnValue)
            event.returnValue = false
            values.push(event.returnValue)

            // Assigning true does nothing.
            event.returnValue = true
            values.push(event.returnValue)
        })
        const event = createEvent("test", false, true)
        const hasReturnValue = typeof event.returnValue === "boolean"

        this.target.addEventListener("test", listener)
        const retv = this.target.dispatchEvent(event)

        assert.strictEqual(listener.calls.length, 1)
        assert.deepStrictEqual(values, [true, false, false])
        assert.strictEqual(retv, false)
        assert.strictEqual(
            event.returnValue,
            hasReturnValue ? false : undefined,
            5,
        )
    })

    it("'event.returnValue` should do nothing if cancelable is false.", /* @this */ function() {
        const values = []
        const listener = spy(event => {
            values.push(event.returnValue)
            event.returnValue = false
            values.push(event.returnValue)
        })
        const event = createEvent("test", false, false)
        const hasReturnValue = typeof event.returnValue === "boolean"

        this.target.addEventListener("test", listener)
        const retv = this.target.dispatchEvent(event)

        assert.strictEqual(listener.calls.length, 1)
        assert.deepStrictEqual(values, [true, true])
        assert.strictEqual(retv, true)
        assert.strictEqual(
            event.returnValue,
            hasReturnValue ? true : undefined,
            5,
        )
    })

    it("'event.returnValue` should do nothing if passive is true.", /* @this */ function() {
        const values = []
        const listener = spy(event => {
            values.push(event.returnValue)
            event.returnValue = false
            values.push(event.returnValue)
        })
        const event = createEvent("test", false, true)
        const hasReturnValue = typeof event.returnValue === "boolean"

        this.target.addEventListener("test", listener, { passive: true })
        const retv = this.target.dispatchEvent(event)

        assert.strictEqual(listener.calls.length, 1)
        assert.deepStrictEqual(values, [true, true])
        assert.strictEqual(retv, true)
        assert.strictEqual(
            event.returnValue,
            hasReturnValue ? true : undefined,
            5,
        )
    })

    it("'event.initEvent` should do nothing.", /* @this */ function() {
        let error = null
        const listener = spy(event => {
            try {
                event.initEvent()
            } catch (e) {
                error = e
            }
        })
        const event = createEvent("test", false, false)

        this.target.addEventListener("test", listener)
        this.target.dispatchEvent(event)

        assert.strictEqual(listener.calls.length, 1)
        assert.strictEqual(error, null)
    })
}

/**
 * Run tests for attribute listeners.
 * @returns {void}
 */
function doAttributeListenerTests() {
    it("should properties of attribute listener are null by default.", /* @this */ function() {
        assert(this.target.ontest === null)
    })

    it("should properties of attribute listener are enumerable.", /* @this */ function() {
        const expectedKeys = [
            "addEventListener",
            "removeEventListener",
            "dispatchEvent",
            "ontest",
            "onhello",
        ]
        const keys = []
        for (const key in this.target) {
            keys.push(key)
        }

        assert(keys.length === expectedKeys.length)
        for (let i = 0; i < keys.length; ++i) {
            assert(
                expectedKeys.indexOf(keys[i]) !== -1,
                `Found an unknown key '${keys[i]}'`,
            )
        }
    })

    it("should call attribute listeners when called `dispatchEvent()`.", /* @this */ function() {
        const listener = spy()
        const event = createEvent("test")
        this.target.ontest = listener
        this.target.dispatchEvent(event)

        assert(this.target.ontest === listener)
        assert(listener.calls.length === 1)
    })

    it("should not call removed listeners.", /* @this */ function() {
        const listener = spy()
        const event = createEvent("test")
        this.target.ontest = listener
        this.target.ontest = null
        this.target.dispatchEvent(event)

        assert(this.target.ontest === null)
        assert(listener.calls.length === 0)
    })

    it("should not allow duplicate in listeners.", /* @this */ function() {
        const listener = spy()
        const event = createEvent("test")
        this.target.ontest = listener
        this.target.ontest = listener
        this.target.dispatchEvent(event)

        assert(this.target.ontest === listener)
        assert(listener.calls.length === 1)
    })

    it("should allow duplicate in listeners if these kind is different.", /* @this */ function() {
        const listener = spy()
        const event = createEvent("test")
        this.target.addEventListener("test", listener, false)
        this.target.ontest = listener
        this.target.addEventListener("test", listener, true)
        this.target.dispatchEvent(event)

        assert(this.target.ontest === listener)
        assert(listener.calls.length === 3)

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
        const listener = { handleEvent: spy() }

        this.target.ontest = listener
        this.target.dispatchEvent(createEvent("test"))

        assert(this.target.ontest === listener)
        assert(listener.handleEvent.calls.length === 0)
    })

    it("should handle a non object as null.", /* @this */ function() {
        const listener = {}

        this.target.ontest = listener
        assert(this.target.ontest === listener)

        this.target.ontest = "listener"
        assert(this.target.ontest === null)
    })

    it("should throw a TypeError if 'this' is invalid.", /* @this */ function() {
        assert.throws(() => {
            const obj = Object.create(this.target)
            obj.ontest = null
        }, /'this' is expected an EventTarget object, but got another value\./u)
    })

    it("should catch exceptions the listeners threw.", /* @this */ function() {
        const listener = spy()
        this.target.addEventListener("test", () => {
            throw new Error()
        })
        this.target.addEventListener("test", listener)
        this.target.dispatchEvent(createEvent("test"))

        assert(listener.calls.length === 1)
    })
}

//-----------------------------------------------------------------------------
// Tests
//-----------------------------------------------------------------------------

describe("EventTarget:", () => {
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

describe("EventTarget with attribute listeners:", () => {
    /**
     * Use extended class to test.
     * @constructor
     */
    const TestTarget = EventTarget("test", "hello")

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

describe("EventTarget with an array of attribute listeners:", () => {
    /**
     * Use extended class to test.
     * @constructor
     */
    const TestTarget = EventTarget(["test", "hello"])

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
