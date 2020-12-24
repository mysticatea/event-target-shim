import assert from "assert"
import { setErrorHandler, setWarningHandler } from "../../src"

export function setupErrorCheck() {
    const errors: Error[] = []
    const warnings: { message: string; args: any[] }[] = []

    beforeEach(() => {
        errors.length = 0
        warnings.length = 0
        setErrorHandler(error => {
            errors.push(error)
        })
        setWarningHandler((message, args) => {
            warnings.push({ message, args })
        })
    })

    afterEach(() => {
        setErrorHandler(undefined)
        setWarningHandler(undefined)
        assert.deepStrictEqual(errors, [], "Errors should be nothing.")
        assert.deepStrictEqual(warnings, [], "Warnings should be nothing.")
    })

    function assertError(errorOrMessage: Error | string): void {
        const actualError = errors.shift()
        assert.strictEqual(
            typeof errorOrMessage === "string"
                ? actualError?.message
                : actualError,
            errorOrMessage,
        )
    }

    function assertWarning(message: string, ...args: any[]): void {
        const actualWarning = warnings.shift()
        assert.deepStrictEqual(actualWarning, { message, args })
    }

    return { assertError, assertWarning }
}
