import assert from "assert"
import { setErrorHandler, setWarningHandler } from "../../src"
import { Warning } from "../../src/lib/warning-handler"

export function setupErrorCheck() {
    const errors: Error[] = []
    const warnings: setWarningHandler.Warning[] = []

    beforeEach(() => {
        errors.length = 0
        warnings.length = 0
        setErrorHandler(error => {
            errors.push(error)
        })
        setWarningHandler(warning => {
            warnings.push(warning)
        })
    })

    afterEach(function () {
        setErrorHandler(undefined)
        setWarningHandler(undefined)
        try {
            assert.deepStrictEqual(errors, [], "Errors should be nothing.")
            assert.deepStrictEqual(warnings, [], "Warnings should be nothing.")
        } catch (error) {
            ;(this.test as any)?.error(error)
        }
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

    function assertWarning<TArgs extends any[]>(
        warning: Warning<TArgs>,
        ...args: TArgs
    ): void {
        const actualWarning = warnings.shift()
        assert.deepStrictEqual(actualWarning, { ...warning, args })
    }

    return { assertError, assertWarning }
}
