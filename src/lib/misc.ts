/**
 * Set the error handler.
 * @param value The error handler to set.
 */
export function setErrorHandler(
    value: setErrorHandler.ErrorHandler | undefined,
): void {
    currentErrorHandler = value ?? handleError
}
export namespace setErrorHandler {
    export type ErrorHandler = (error: Error) => void
}

/**
 * Set the warning handler.
 * @param value The warning handler to set.
 */
export function setWarningHandler(
    value: setWarningHandler.WarningHandler | undefined,
): void {
    currentWarnHandler = value ?? handleWarn
}
export namespace setWarningHandler {
    export type WarningHandler = (format: string, args: any[]) => void
}

/**
 * Assert a condition.
 * @param condition The condition that it should satisfy.
 * @param message The format for the error message.
 * @param args The arguments for the error message.
 */
export function assert(
    condition: boolean,
    message: string,
    ...args: any[]
): asserts condition {
    if (!condition) {
        throw new Error(format(message, args))
    }
}

/**
 * Assert a condition.
 * @param condition The condition that it should satisfy.
 * @param message The format for the error message.
 * @param args The arguments for the error message.
 */
export function assertType(
    condition: boolean,
    message: string,
    ...args: any[]
): asserts condition {
    if (!condition) {
        throw new TypeError(format(message, args))
    }
}

/**
 * Print a error message.
 * @param message The format for the error message.
 * @param args The arguments for the error message.
 */
export function error(maybeError: unknown): void {
    try {
        currentErrorHandler(
            maybeError instanceof Error
                ? maybeError
                : new Error(anyToString(maybeError)),
        )
    } catch {
        // ignore.
    }
}

/**
 * Print a wanring message.
 * @param message The format for the warning message.
 * @param args The arguments for the warning message.
 */
export function warn(message: string, ...args: any[]): void {
    try {
        currentWarnHandler(message, args)
    } catch {
        // ignore.
    }
}

/**
 * Convert a text and arguments to one string.
 * @param message The formating text
 * @param args The arguments.
 */
export function format(message: string, args: any[]): string {
    const cloned = [...args]
    return [
        message.replace(/%[osdf]/gu, () => anyToString(cloned.shift())),
        ...cloned.map(anyToString),
    ].join(" ")
}

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

declare const console: any
declare const dispatchEvent: any
declare const ErrorEvent: any
declare const process: any

let currentErrorHandler: setErrorHandler.ErrorHandler = handleError
let currentWarnHandler: setWarningHandler.WarningHandler = handleWarn

function handleError(err: Error): void {
    if (
        typeof dispatchEvent === "function" &&
        typeof ErrorEvent === "function"
    ) {
        dispatchEvent(
            new ErrorEvent("error", { error: err, message: err.message }),
        )
        return
    }
    if (typeof process !== "undefined" && typeof process.emit === "function") {
        process.emit("uncaughtException", err)
        return
    }

    console.error(error)
}

function handleWarn(formatText: string, args: any[]): void {
    console.warn(formatText, ...args)
}

function anyToString(x: any): string {
    if (typeof x !== "object" || x === null) {
        return String(x)
    }
    return Object.toString.call(x)
}
