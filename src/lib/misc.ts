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
    currentErrorHandler = value ?? handleError
}
export namespace setErrorHandler {
    /**
     * The error handler.
     * @param error The thrown error object.
     */
    export type ErrorHandler = (error: Error) => void
}

/**
 * Set the warning handler.
 * @param value The warning handler to set.
 */
export function setWarningHandler(
    value: setWarningHandler.WarningHandler | undefined,
): void {
    assertType(
        typeof value === "function" || value === undefined,
        "The warning handler must be a function or undefined, but got %o.",
        value,
    )
    currentWarnHandler = value ?? handleWarn
}
export namespace setWarningHandler {
    /**
     * The warning handler.
     * @param message The warning message.
     * @param args The arguments for replacing placeholders in the message.
     */
    export type WarningHandler = (message: string, args: any[]) => void
}

/**
 * Assert a condition.
 * @param condition The condition that it should satisfy.
 * @param message The error message.
 * @param args The arguments for replacing placeholders in the message.
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
 * @param message The error message.
 * @param args The arguments for replacing placeholders in the message.
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
 * @param maybeError The error object.
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
 * @param message The warning message.
 * @param args The arguments for replacing placeholders in the message.
 */
export function warn(message: string, ...args: any[]): void {
    try {
        currentWarnHandler(message, args)
    } catch {
        // ignore.
    }
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

/**
 * The default error handler.
 * @param err The error object.
 */
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

/**
 * The default warning handler.
 * @param message The warning message.
 * @param args The arguments for replacing placeholders in the message.
 */
function handleWarn(message: string, args: any[]): void {
    console.warn(message, ...args)
}

/**
 * Convert a text and arguments to one string.
 * @param message The formating text
 * @param args The arguments.
 */
function format(message: string, args: any[]): string {
    const cloned = [...args]
    return [
        message.replace(/%[osdf]/gu, () => anyToString(cloned.shift())),
        ...cloned.map(anyToString),
    ].join(" ")
}

/**
 * Convert a value to a string representation.
 * @param x The value to get the string representation.
 */
function anyToString(x: any): string {
    if (typeof x !== "object" || x === null) {
        return String(x)
    }
    return Object.toString.call(x)
}
