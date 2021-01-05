import { spy } from "@mysticatea/spy"
import assert from "assert"
import {
    Event,
    EventTarget,
    getEventAttributeValue,
    setEventAttributeValue,
} from "../src/index"
import { countEventListeners } from "./lib/count-event-listeners"

describe("Event attribute handlers", () => {
    let target: EventTarget
    beforeEach(() => {
        target = new EventTarget()
    })

    describe("'getEventAttributeValue' function", () => {
        it("should throw a TypeError if non-EventTarget object is present", () => {
            assert.throws(() => {
                // @ts-expect-error
                getEventAttributeValue()
            }, TypeError)
            assert.throws(() => {
                // @ts-expect-error
                getEventAttributeValue(null)
            }, TypeError)
            assert.throws(() => {
                // @ts-expect-error
                getEventAttributeValue({})
            }, TypeError)
        })

        it("should return null if any handlers are not set.", () => {
            assert.strictEqual(getEventAttributeValue(target, "foo"), null)
        })

        it("should return null if any handlers are not set, even if listeners are added by 'addEventListener'.", () => {
            target.addEventListener("foo", () => {})
            assert.strictEqual(getEventAttributeValue(target, "foo"), null)
        })

        it("should return null if listeners are set to a different event by 'setEventAttributeValue'.", () => {
            const f = () => {}
            setEventAttributeValue(target, "bar", f)
            assert.strictEqual(getEventAttributeValue(target, "foo"), null)
        })

        it("should return the set function if listeners are set by 'setEventAttributeValue'.", () => {
            const f = () => {}
            setEventAttributeValue(target, "foo", f)
            assert.strictEqual(getEventAttributeValue(target, "foo"), f)
        })

        it("should return the set object if listeners are set by 'setEventAttributeValue'.", () => {
            const f = {}
            // @ts-expect-error
            setEventAttributeValue(target, "foo", f)
            assert.strictEqual(getEventAttributeValue(target, "foo"), f)
        })

        it("should return the last set function if listeners are set by 'setEventAttributeValue' multiple times.", () => {
            const f = () => {}
            setEventAttributeValue(target, "foo", () => {})
            setEventAttributeValue(target, "foo", null)
            setEventAttributeValue(target, "foo", () => {})
            setEventAttributeValue(target, "foo", f)
            assert.strictEqual(getEventAttributeValue(target, "foo"), f)
        })

        it("should handle the string representation of the type argument", () => {
            const f = () => {}
            setEventAttributeValue(target, "1000", f)
            // @ts-expect-error
            assert.strictEqual(getEventAttributeValue(target, 1e3), f)
        })
    })

    describe("'setEventAttributeValue' function", () => {
        it("should throw a TypeError if non-EventTarget object is present", () => {
            assert.throws(() => {
                // @ts-expect-error
                setEventAttributeValue()
            }, TypeError)
            assert.throws(() => {
                // @ts-expect-error
                setEventAttributeValue(null)
            }, TypeError)
            assert.throws(() => {
                // @ts-expect-error
                setEventAttributeValue({})
            }, TypeError)
        })

        it("should add an event listener if a function is given.", () => {
            setEventAttributeValue(target, "foo", () => {})
            assert.strictEqual(countEventListeners(target), 1)
            assert.strictEqual(countEventListeners(target, "foo"), 1)
        })

        it("should add an event listener if an object is given.", () => {
            // @ts-expect-error
            setEventAttributeValue(target, "foo", {})
            assert.strictEqual(countEventListeners(target), 1)
            assert.strictEqual(countEventListeners(target, "foo"), 1)
        })

        it("should remove an event listener if null is given.", () => {
            setEventAttributeValue(target, "foo", () => {})
            assert.strictEqual(countEventListeners(target, "foo"), 1)
            setEventAttributeValue(target, "foo", null)
            assert.strictEqual(countEventListeners(target, "foo"), 0)
        })

        it("should remove an event listener if primitive is given.", () => {
            setEventAttributeValue(target, "foo", () => {})
            assert.strictEqual(countEventListeners(target, "foo"), 1)
            // @ts-expect-error
            setEventAttributeValue(target, "foo", 3)
            assert.strictEqual(countEventListeners(target, "foo"), 0)
        })

        it("should do nothing if primitive is given and the target doesn't have listeners.", () => {
            setEventAttributeValue(target, "foo", null)
            assert.strictEqual(countEventListeners(target, "foo"), 0)
        })

        it("should handle the string representation of the type argument", () => {
            const f = () => {}
            // @ts-expect-error
            setEventAttributeValue(target, 1e3, f)

            assert.strictEqual(countEventListeners(target), 1)
            assert.strictEqual(countEventListeners(target, "1000"), 1)
        })

        it("should keep the added order: attr, normal, capture", () => {
            const list: string[] = []
            const f1 = () => {
                list.push("f1")
            }
            const f2 = () => {
                list.push("f2")
            }
            const f3 = () => {
                list.push("f3")
            }

            setEventAttributeValue(target, "foo", f1)
            target.addEventListener("foo", f2)
            target.addEventListener("foo", f3, { capture: true })
            target.dispatchEvent(new Event("foo"))

            assert.deepStrictEqual(list, ["f1", "f2", "f3"])
        })

        it("should keep the added order: normal, capture, attr", () => {
            const list: string[] = []
            const f1 = () => {
                list.push("f1")
            }
            const f2 = () => {
                list.push("f2")
            }
            const f3 = () => {
                list.push("f3")
            }

            target.addEventListener("foo", f1)
            target.addEventListener("foo", f2, { capture: true })
            setEventAttributeValue(target, "foo", f3)
            target.dispatchEvent(new Event("foo"))

            assert.deepStrictEqual(list, ["f1", "f2", "f3"])
        })

        it("should keep the added order: capture, attr, normal", () => {
            const list: string[] = []
            const f1 = () => {
                list.push("f1")
            }
            const f2 = () => {
                list.push("f2")
            }
            const f3 = () => {
                list.push("f3")
            }

            target.addEventListener("foo", f1, { capture: true })
            setEventAttributeValue(target, "foo", f2)
            target.addEventListener("foo", f3)
            target.dispatchEvent(new Event("foo"))

            assert.deepStrictEqual(list, ["f1", "f2", "f3"])
        })

        it("should not be called by 'dispatchEvent' if the listener is object listener", () => {
            const f = { handleEvent: spy() }
            // @ts-expect-error
            setEventAttributeValue(target, "foo", f)
            target.dispatchEvent(new Event("foo"))

            assert.strictEqual(
                f.handleEvent.calls.length,
                0,
                "handleEvent should not be called",
            )
        })
    })
})
