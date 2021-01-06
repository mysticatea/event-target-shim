import { spy } from "@mysticatea/spy"
import assert from "assert"
import { EventTarget } from "../src/index"
import { InvalidEventListener } from "../src/lib/warnings"

describe("The default warning handler", () => {
    it("should print the warning by 'console.warn'.", () => {
        /*eslint-disable no-console */
        const originalWarn = console.warn
        const f = spy((...args: any[]) => {})
        const target = new EventTarget()

        console.warn = f
        target.addEventListener("foo")
        console.warn = originalWarn

        assert.strictEqual(f.calls.length, 1, "f should be called.")
        assert.strictEqual(
            f.calls[0].arguments[0],
            InvalidEventListener.message,
        )
        assert.strictEqual(f.calls[0].arguments[1], undefined)
        /*eslint-enable no-console */
    })
})
