import { spy } from "@mysticatea/spy"
import assert from "assert"
import { Event, EventTarget, setWarningHandler } from "../src/index"

describe("The default error handler", () => {
    const onBrowser =
        typeof window !== "undefined" &&
        typeof window.dispatchEvent === "function"
    const onNode =
        !onBrowser &&
        typeof process !== "undefined" &&
        typeof process.emit === "function"

    beforeEach(() => {
        setWarningHandler(() => {})
    })
    afterEach(() => {
        setWarningHandler(undefined)
    })

    //
    ;(onBrowser ? describe : xdescribe)("on a browser", () => {
        it("should dispatch an ErrorEvent if a listener threw an error", () => {
            const originalConsoleError = console.error
            const f = spy((_message, _source, _lineno, _colno, _error) => {})
            const consoleError = spy((...args: any[]) => {})
            const target = new EventTarget()
            const error = new Error("test error")
            target.addEventListener("foo", () => {
                throw error
            })

            window.onerror = f
            console.error = consoleError
            try {
                target.dispatchEvent(new Event("foo"))
            } finally {
                window.onerror = null
                console.error = originalConsoleError
            }

            assert.strictEqual(f.calls.length, 1, "f should be called.")
            assert.strictEqual(f.calls[0].arguments[0], error.message)
            assert.strictEqual(f.calls[0].arguments[4], error)
            assert.strictEqual(
                consoleError.calls.length,
                1,
                "console.error should be called.",
            )
            assert.strictEqual(consoleError.calls[0].arguments[0], error)
        })
    })

    //
    ;(onNode ? describe : xdescribe)("on Node.js", () => {
        let mochaListener: any

        // Remove mocha's `uncaughtException` handler while this test case
        // because it expects `uncaughtException` to be thrown.
        beforeEach(() => {
            mochaListener = process.listeners("uncaughtException").pop()
            process.removeListener("uncaughtException", mochaListener)
        })
        afterEach(() => {
            process.addListener("uncaughtException", mochaListener)
        })

        it("should emit an uncaughtException event if a listener threw an error", () => {
            const f = spy(_event => {})
            const target = new EventTarget()
            const error = new Error("test error")
            target.addEventListener("foo", () => {
                throw error
            })

            process.on("uncaughtException", f)
            target.dispatchEvent(new Event("foo"))
            process.removeListener("uncaughtException", f)

            assert.strictEqual(f.calls.length, 1, "f should be called.")
            assert.strictEqual(f.calls[0].arguments[0], error)
        })
    })
})
