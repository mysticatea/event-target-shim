import assert from "assert"
import { defineCustomEventTarget, Event, EventTarget } from "../src/index"
import { countEventListeners } from "../src/lib/event-target"

describe("'defineCustomEventTarget' function", () => {
    describe("when '{foo:Event; bar:Event}' type argument is present, the returned valuu is", () => {
        const MyEventTarget = defineCustomEventTarget<{
            foo: Event<"foo">
            bar: Event<"bar">
        }>("foo", "bar")
        type MyEventTarget = InstanceType<typeof MyEventTarget>

        it("should be a function.", () => {
            assert.strictEqual(typeof MyEventTarget, "function")
        })

        it("should throw a TypeError on function calls.", () => {
            assert.throws(() => {
                // @ts-expect-error
                MyEventTarget() // eslint-disable-line new-cap
            }, TypeError)
        })

        it("should return an instance on constructor calls.", () => {
            const target = new MyEventTarget()
            assert(
                target instanceof MyEventTarget,
                "should be an instance of MyEventTarget",
            )
            assert(
                target instanceof EventTarget,
                "should be an instance of EventTarget",
            )
        })

        describe("the instance of MyEventTarget", () => {
            let target: MyEventTarget
            beforeEach(() => {
                target = new MyEventTarget()
            })

            describe("'onfoo' property", () => {
                it("should be null at first", () => {
                    assert.strictEqual(target.onfoo, null)
                })

                it("should be able to set a function", () => {
                    const f = () => {}
                    target.onfoo = f
                    assert.strictEqual(target.onfoo, f)
                })

                it("should add an listener on setting a function", () => {
                    const f = () => {}
                    target.onfoo = f
                    assert.strictEqual(countEventListeners(target, "foo"), 1)
                })

                it("should remove the set listener on setting null", () => {
                    const f = () => {}
                    target.onfoo = f
                    assert.strictEqual(countEventListeners(target, "foo"), 1)
                    target.onfoo = null
                    assert.strictEqual(countEventListeners(target, "foo"), 0)
                })
            })

            describe("'onbar' property", () => {
                it("should be null at first", () => {
                    assert.strictEqual(target.onbar, null)
                })

                it("should be able to set a function", () => {
                    const f = () => {}
                    target.onbar = f
                    assert.strictEqual(target.onbar, f)
                })

                it("should add an listener on setting a function", () => {
                    const f = () => {}
                    target.onbar = f
                    assert.strictEqual(countEventListeners(target, "bar"), 1)
                })

                it("should remove the set listener on setting null", () => {
                    const f = () => {}
                    target.onbar = f
                    assert.strictEqual(countEventListeners(target, "bar"), 1)
                    target.onbar = null
                    assert.strictEqual(countEventListeners(target, "bar"), 0)
                })
            })

            describe("for-in", () => {
                it("should enumerate 5 property names", () => {
                    const actualKeys = []
                    const expectedKeys = [
                        "addEventListener",
                        "removeEventListener",
                        "dispatchEvent",
                        "onfoo",
                        "onbar",
                    ]

                    // eslint-disable-next-line @mysticatea/prefer-for-of
                    for (const key in target) {
                        actualKeys.push(key)
                    }

                    assert.deepStrictEqual(
                        actualKeys.sort(undefined),
                        expectedKeys.sort(undefined),
                    )
                })
            })
        })
    })
})
