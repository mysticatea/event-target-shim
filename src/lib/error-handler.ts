import { anyToString, assertType } from "./misc"

declare const console: any
declare const dispatchEvent: any
declare const ErrorEvent: any
declare const process: any

let currentErrorHandler: setErrorHandler.ErrorHandler | undefined

/**
 * Set the error handler.
 * @param value The error handler to set.
 */
export function setErrorHandler(
    value: setErrorHandler.ErrorHandler | undefined,
): void {
    assertType(
        typeof value === "function" || value === undefined,
        "The error handler must be a function or undefined, but got %o.",
        value,
    )
    currentErrorHandler = value
}
export namespace setErrorHandler {
    /**
     * The error handler.
     * @param error The thrown error object.
     */
    export type ErrorHandler = (error: Error) => void
}

/**
 * Print a error message.
 * @param maybeError The error object.
 */
export function reportError(maybeError: unknown): void {
    try {
        const error =
            maybeError instanceof Error
                ? maybeError
                : new Error(anyToString(maybeError))

        // Call the user-defined error handler if exists.
        if (currentErrorHandler) {
            currentErrorHandler(error)
            return
        }

        // Dispatch an `error` event if this is on a browser.
        if (
            typeof dispatchEvent === "function" &&
            typeof ErrorEvent === "function"
        ) {
            dispatchEvent(
                new ErrorEvent("error", { error, message: error.message }),
            )
        }

        // Emit an `uncaughtException` event if this is on Node.js.
        //istanbul ignore else
        else if (
            typeof process !== "undefined" &&
            typeof process.emit === "function"
        ) {
            process.emit("uncaughtException", error)
            return
        }

        // Otherwise, print the error.
        console.error(error)
    } catch {
        // ignore.
    }
}
