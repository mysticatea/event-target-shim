import assert from "assert"
import { Event, EventTarget } from "../src/index"
import { Global } from "../src/lib/global"
import { setupErrorCheck } from "./lib/setup-error-check"

const NativeEvent: typeof Event = Global.Event

describe("'Event' class", () => {
    const { assertWarning } = setupErrorCheck()

    describe("constructor", () => {
        it("should return an Event object", () => {
            assert(new Event("") instanceof Event)
        })

        it("should throw a TypeError if called as a function", () => {
            assert.throws(() => {
                // @ts-expect-error
                Event("") // eslint-disable-line new-cap
            })
        })

        const nativeDescribe = NativeEvent ? describe : xdescribe
        nativeDescribe("if native Event class is present", () => {
            it("`event instanceof window.Event` should be true", () => {
                const event = new Event("")
                assert(event instanceof NativeEvent)
            })
        })
    })

    describe("'type' property", () => {
        it("should be the value of the constructor's first argument", () => {
            const event = new Event("foo")
            assert.strictEqual(event.type, "foo")
        })

        it("should be the string representation of the constructor's first argument", () => {
            // @ts-expect-error
            assert.strictEqual(new Event().type, "undefined")
            // @ts-expect-error
            assert.strictEqual(new Event(null).type, "null")
            // @ts-expect-error
            assert.strictEqual(new Event(1e3).type, "1000")
        })

        it("should be readonly", () => {
            const event = new Event("foo")
            assert.throws(() => {
                // @ts-expect-error
                event.type = "bar"
            })
        })
    })

    describe("'target' property", () => {
        it("should be null", () => {
            const event = new Event("foo")
            assert.strictEqual(event.target, null)
        })

        it("should be readonly", () => {
            const event = new Event("foo")
            assert.throws(() => {
                // @ts-expect-error
                event.target = null
            })
        })

        it("should be the event target under dispatching", () => {
            const target = new EventTarget()
            const event = new Event("foo")
            let ok = false

            target.addEventListener("foo", () => {
                assert.strictEqual(event.target, target)
                ok = true
            })
            target.dispatchEvent(event)

            assert.strictEqual(event.target, null)
            assert(ok)
        })
    })

    describe("'srcElement' property", () => {
        it("should be null", () => {
            const event = new Event("foo")
            assert.strictEqual(event.srcElement, null)
        })

        it("should be readonly", () => {
            const event = new Event("foo")
            assert.throws(() => {
                // @ts-expect-error
                event.srcElement = null
            })
        })

        it("should be the event target under dispatching", () => {
            const target = new EventTarget()
            const event = new Event("foo")
            let ok = false

            target.addEventListener("foo", () => {
                assert.strictEqual(event.srcElement, target)
                ok = true
            })
            target.dispatchEvent(event)

            assert.strictEqual(event.srcElement, null)
            assert(ok)
        })
    })

    describe("'currentTarget' property", () => {
        it("should be null", () => {
            const event = new Event("foo")
            assert.strictEqual(event.currentTarget, null)
        })

        it("should be readonly", () => {
            const event = new Event("foo")
            assert.throws(() => {
                // @ts-expect-error
                event.currentTarget = null
            })
        })

        it("should be the event target under dispatching", () => {
            const target = new EventTarget()
            const event = new Event("foo")
            let ok = false

            target.addEventListener("foo", () => {
                assert.strictEqual(event.currentTarget, target)
                ok = true
            })
            target.dispatchEvent(event)

            assert.strictEqual(event.currentTarget, null)
            assert(ok)
        })
    })

    describe("'composedPath' method", () => {
        it("should return an empty array", () => {
            const event = new Event("foo")
            assert.deepStrictEqual(event.composedPath(), [])
        })

        it("should return the event target under dispatching", () => {
            const target = new EventTarget()
            const event = new Event("foo")
            let ok = false

            target.addEventListener("foo", () => {
                assert.deepStrictEqual(event.composedPath(), [target])
                ok = true
            })
            target.dispatchEvent(event)

            assert.deepStrictEqual(event.composedPath(), [])
            assert(ok)
        })
    })

    describe("'NONE' property", () => {
        it("should be 0", () => {
            const event = new Event("foo")
            assert.strictEqual(event.NONE, 0)
        })

        it("should be readonly", () => {
            const event = new Event("foo")
            assert.throws(() => {
                // @ts-expect-error
                event.NONE = -1
            })
        })
    })

    describe("'NONE' static property", () => {
        it("should be 0", () => {
            assert.strictEqual(Event.NONE, 0)
        })

        it("should be readonly", () => {
            assert.throws(() => {
                // @ts-expect-error
                Event.NONE = -1
            })
        })
    })

    describe("'CAPTURING_PHASE' property", () => {
        it("should be 1", () => {
            const event = new Event("foo")
            assert.strictEqual(event.CAPTURING_PHASE, 1)
        })

        it("should be readonly", () => {
            const event = new Event("foo")
            assert.throws(() => {
                // @ts-expect-error
                event.CAPTURING_PHASE = -1
            })
        })
    })

    describe("'CAPTURING_PHASE' static property", () => {
        it("should be 1", () => {
            assert.strictEqual(Event.CAPTURING_PHASE, 1)
        })

        it("should be readonly", () => {
            assert.throws(() => {
                // @ts-expect-error
                Event.CAPTURING_PHASE = -1
            })
        })
    })

    describe("'AT_TARGET' property", () => {
        it("should be 2", () => {
            const event = new Event("foo")
            assert.strictEqual(event.AT_TARGET, 2)
        })

        it("should be readonly", () => {
            const event = new Event("foo")
            assert.throws(() => {
                // @ts-expect-error
                event.AT_TARGET = -1
            })
        })
    })

    describe("'AT_TARGET' static property", () => {
        it("should be 2", () => {
            assert.strictEqual(Event.AT_TARGET, 2)
        })

        it("should be readonly", () => {
            assert.throws(() => {
                // @ts-expect-error
                Event.AT_TARGET = -1
            })
        })
    })

    describe("'BUBBLING_PHASE' property", () => {
        it("should be 3", () => {
            const event = new Event("foo")
            assert.strictEqual(event.BUBBLING_PHASE, 3)
        })

        it("should be readonly", () => {
            const event = new Event("foo")
            assert.throws(() => {
                // @ts-expect-error
                event.BUBBLING_PHASE = -1
            })
        })
    })

    describe("'BUBBLING_PHASE' static property", () => {
        it("should be 3", () => {
            assert.strictEqual(Event.BUBBLING_PHASE, 3)
        })

        it("should be readonly", () => {
            assert.throws(() => {
                // @ts-expect-error
                Event.BUBBLING_PHASE = -1
            })
        })
    })

    describe("'eventPhase' property", () => {
        it("should be 0", () => {
            const event = new Event("foo")
            assert.strictEqual(event.eventPhase, 0)
        })

        it("should be readonly", () => {
            const event = new Event("foo")
            assert.throws(() => {
                // @ts-expect-error
                event.eventPhase = -1
            })
        })

        it("should be 2 under dispatching", () => {
            const target = new EventTarget()
            const event = new Event("foo")
            let ok = false

            target.addEventListener("foo", () => {
                assert.strictEqual(event.eventPhase, 2)
                ok = true
            })
            target.dispatchEvent(event)

            assert.strictEqual(event.eventPhase, 0)
            assert(ok)
        })
    })

    describe("'stopPropagation' method", () => {
        it("should return undefined", () => {
            const event = new Event("foo")
            assert.strictEqual(event.stopPropagation(), undefined)
        })
    })

    describe("'cancelBubble' property", () => {
        it("should be false", () => {
            const event = new Event("foo")
            assert.strictEqual(event.cancelBubble, false)
        })

        it("should be true after 'stopPropagation' method was called", () => {
            const event = new Event("foo")
            event.stopPropagation()
            assert.strictEqual(event.cancelBubble, true)
        })

        it("should be true after 'stopImmediatePropagation' method was called", () => {
            const event = new Event("foo")
            event.stopImmediatePropagation()
            assert.strictEqual(event.cancelBubble, true)
        })

        it("should be writable", () => {
            const event = new Event("foo")
            event.cancelBubble = true
            assert.strictEqual(event.cancelBubble, true)
        })

        it("should NOT be changed by the assignment of false after 'stopPropagation' method was called", () => {
            const event = new Event("foo")
            event.stopPropagation()
            event.cancelBubble = false
            assert.strictEqual(event.cancelBubble, true)
            assertWarning(
                "Assigning any falsy value to 'cancelBubble' property has no effect.",
            )
        })

        it("should NOT be changed by the assignment of false after 'stopImmediatePropagation' method was called", () => {
            const event = new Event("foo")
            event.stopImmediatePropagation()
            event.cancelBubble = false
            assert.strictEqual(event.cancelBubble, true)
            assertWarning(
                "Assigning any falsy value to 'cancelBubble' property has no effect.",
            )
        })

        it("should NOT be changed by the assignment of false after the assignment of true", () => {
            const event = new Event("foo")
            event.cancelBubble = true
            event.cancelBubble = false
            assert.strictEqual(event.cancelBubble, true)
            assertWarning(
                "Assigning any falsy value to 'cancelBubble' property has no effect.",
            )
        })
    })

    describe("'stopImmediatePropagation' method", () => {
        it("should return undefined", () => {
            const event = new Event("foo")
            assert.strictEqual(event.stopImmediatePropagation(), undefined)
        })
    })

    describe("'bubbles' property", () => {
        it("should be false if the constructor option was not present", () => {
            const event = new Event("foo")
            assert.strictEqual(event.bubbles, false)
        })

        it("should be false if the constructor option was false", () => {
            const event = new Event("foo", { bubbles: false })
            assert.strictEqual(event.bubbles, false)
        })

        it("should be true if the constructor option was true", () => {
            const event = new Event("foo", { bubbles: true })
            assert.strictEqual(event.bubbles, true)
        })

        it("should be readonly", () => {
            const event = new Event("foo")
            assert.throws(() => {
                // @ts-expect-error
                event.bubbles = true
            })
        })
    })

    describe("'cancelable' property", () => {
        it("should be false if the constructor option was not present", () => {
            const event = new Event("foo")
            assert.strictEqual(event.cancelable, false)
        })

        it("should be false if the constructor option was false", () => {
            const event = new Event("foo", { cancelable: false })
            assert.strictEqual(event.cancelable, false)
        })

        it("should be true if the constructor option was true", () => {
            const event = new Event("foo", { cancelable: true })
            assert.strictEqual(event.cancelable, true)
        })

        it("should be readonly", () => {
            const event = new Event("foo")
            assert.throws(() => {
                // @ts-expect-error
                event.cancelable = true
            })
        })
    })

    describe("'returnValue' property", () => {
        it("should be true", () => {
            const event = new Event("foo")
            assert.strictEqual(event.returnValue, true)
        })

        it("should be true after 'preventDefault' method was called if 'cancelable' is false", () => {
            const event = new Event("foo")
            event.preventDefault()
            assert.strictEqual(event.returnValue, true)
            assertWarning("Unable to preventDefault on non-cancelable events.")
        })

        it("should be false after 'preventDefault' method was called if 'cancelable' is true", () => {
            const event = new Event("foo", { cancelable: true })
            event.preventDefault()
            assert.strictEqual(event.returnValue, false)
        })

        it("should NOT be changed by assignment if 'cancelable' is false", () => {
            const event = new Event("foo")
            event.returnValue = false
            assert.strictEqual(event.returnValue, true)
            assertWarning("Unable to preventDefault on non-cancelable events.")
        })

        it("should be changed by assignment if 'cancelable' is true", () => {
            const event = new Event("foo", { cancelable: true })
            event.returnValue = false
            assert.strictEqual(event.returnValue, false)
        })

        it("should NOT be changed by the assignment of true after 'preventDefault' method was called", () => {
            const event = new Event("foo", { cancelable: true })
            event.preventDefault()
            event.returnValue = true
            assert.strictEqual(event.returnValue, false)
            assertWarning(
                "Assigning any truthy value to 'returnValue' property has no effect.",
            )
        })

        it("should NOT be changed by the assignment of true after the assginment of false", () => {
            const event = new Event("foo", { cancelable: true })
            event.returnValue = false
            event.returnValue = true
            assert.strictEqual(event.returnValue, false)
            assertWarning(
                "Assigning any truthy value to 'returnValue' property has no effect.",
            )
        })
    })

    describe("'preventDefault' method", () => {
        it("should return undefined", () => {
            const event = new Event("foo", { cancelable: true })
            assert.strictEqual(event.preventDefault(), undefined)
        })

        it("should return undefined", () => {
            const event = new Event("foo")
            assert.strictEqual(event.preventDefault(), undefined)
            assertWarning("Unable to preventDefault on non-cancelable events.")
        })
    })

    describe("'defaultPrevented' property", () => {
        it("should be false", () => {
            const event = new Event("foo")
            assert.strictEqual(event.defaultPrevented, false)
        })

        it("should be false after 'preventDefault' method was called if 'cancelable' is false", () => {
            const event = new Event("foo")
            event.preventDefault()
            assert.strictEqual(event.defaultPrevented, false)
            assertWarning("Unable to preventDefault on non-cancelable events.")
        })

        it("should be false after 'preventDefault' method was called if 'cancelable' is true", () => {
            const event = new Event("foo", { cancelable: true })
            event.preventDefault()
            assert.strictEqual(event.defaultPrevented, true)
        })

        it("should be readonly", () => {
            const event = new Event("foo")
            assert.throws(() => {
                // @ts-expect-error
                event.defaultPrevented = true
            })
        })
    })

    describe("'composed' property", () => {
        it("should be false if the constructor option was not present", () => {
            const event = new Event("foo")
            assert.strictEqual(event.composed, false)
        })

        it("should be false if the constructor option was false", () => {
            const event = new Event("foo", { composed: false })
            assert.strictEqual(event.composed, false)
        })

        it("should be true if the constructor option was true", () => {
            const event = new Event("foo", { composed: true })
            assert.strictEqual(event.composed, true)
        })

        it("should be readonly", () => {
            const event = new Event("foo")
            assert.throws(() => {
                // @ts-expect-error
                event.composed = true
            })
        })
    })

    describe("'isTrusted' property", () => {
        it("should be false", () => {
            const event = new Event("foo")
            assert.strictEqual(event.isTrusted, false)
        })

        it("should be readonly", () => {
            const event = new Event("foo")
            assert.throws(() => {
                // @ts-expect-error
                event.isTrusted = true
            })
        })

        it("should NOT be configurable", () => {
            const event = new Event("foo")
            assert.throws(() => {
                Object.defineProperty(event, "isTrusted", { value: true })
            })
        })

        it("should NOT be overridable", () => {
            class CustomEvent extends Event {
                // eslint-disable-next-line class-methods-use-this
                public get isTrusted(): boolean {
                    return true
                }
            }
            const event = new CustomEvent("foo")
            assert.strictEqual(event.isTrusted, false)
        })
    })

    describe("'timeStamp' property", () => {
        it("should be a number", () => {
            const event = new Event("foo")
            assert.strictEqual(typeof event.timeStamp, "number")
        })

        it("should be readonly", () => {
            const event = new Event("foo")
            assert.throws(() => {
                // @ts-expect-error
                event.timeStamp = 0
            })
        })
    })

    describe("'initEvent' method", () => {
        it("should return undefined", () => {
            const event = new Event("foo")
            assert.strictEqual(event.initEvent("bar"), undefined)
        })

        it("should set type", () => {
            const event = new Event("foo")
            event.initEvent("bar")
            assert.strictEqual(event.type, "bar")
        })

        it("should set type (string representation)", () => {
            const event = new Event("foo")
            // @ts-expect-error
            event.initEvent(1e3)
            assert.strictEqual(event.type, "1000")
        })

        it("should set bubbles", () => {
            const event = new Event("foo")
            event.initEvent("foo", true)
            assert.strictEqual(event.bubbles, true)
            assert.strictEqual(event.cancelable, false)
            assert.strictEqual(event.composed, false)
        })

        it("should set cancelable", () => {
            const event = new Event("foo", { bubbles: true })
            event.initEvent("foo", undefined, true)
            assert.strictEqual(event.bubbles, false)
            assert.strictEqual(event.cancelable, true)
            assert.strictEqual(event.composed, false)
        })

        it("should not change composed", () => {
            const event = new Event("foo", {
                bubbles: true,
                cancelable: true,
                composed: true,
            })
            event.initEvent("foo")
            assert.strictEqual(event.bubbles, false)
            assert.strictEqual(event.cancelable, false)
            assert.strictEqual(event.composed, true)
        })

        it("should reset 'stopPropagation' flag", () => {
            const event = new Event("foo")
            event.stopPropagation()
            assert.strictEqual(event.cancelBubble, true)
            event.initEvent("foo")
            assert.strictEqual(event.cancelBubble, false)
        })

        it("should reset 'canceled' flag", () => {
            const event = new Event("foo", { cancelable: true })
            event.preventDefault()
            assert.strictEqual(event.defaultPrevented, true)
            event.initEvent("foo")
            assert.strictEqual(event.defaultPrevented, false)
        })

        it("should do nothing under dispatching", () => {
            const target = new EventTarget()
            const event = new Event("foo")

            target.addEventListener("foo", () => {
                event.initEvent("bar")
            })
            target.dispatchEvent(event)

            assert.strictEqual(event.type, "foo")
            assertWarning(
                "'initEvent' method calls are ignored while event dispatching.",
            )
        })
    })

    describe("for-in", () => {
        it("should enumerate 22 property names", () => {
            const event = new Event("foo")
            const actualKeys = new Set<string>()

            // eslint-disable-next-line @mysticatea/prefer-for-of
            for (const key in event) {
                actualKeys.add(key)
            }

            for (const expectedKey of [
                "type",
                "target",
                "srcElement",
                "currentTarget",
                "composedPath",
                "NONE",
                "CAPTURING_PHASE",
                "AT_TARGET",
                "BUBBLING_PHASE",
                "eventPhase",
                "stopPropagation",
                "cancelBubble",
                "stopImmediatePropagation",
                "bubbles",
                "cancelable",
                "returnValue",
                "preventDefault",
                "defaultPrevented",
                "composed",
                "isTrusted",
                "timeStamp",
                "initEvent",
            ]) {
                assert(
                    actualKeys.has(expectedKey),
                    `for-in loop should iterate '${expectedKey}' key`,
                )
            }
        })

        it("should enumerate 4 property names in static", () => {
            const actualKeys = []
            const expectedKeys = [
                "AT_TARGET",
                "BUBBLING_PHASE",
                "CAPTURING_PHASE",
                "NONE",
            ]

            // eslint-disable-next-line @mysticatea/prefer-for-of
            for (const key in Event) {
                actualKeys.push(key)
            }

            assert.deepStrictEqual(
                actualKeys.sort(undefined),
                expectedKeys.sort(undefined),
            )
        })
    })
})
