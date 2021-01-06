declare const globalThis: any
declare const window: any
declare const self: any
declare const global: any

/**
 * The global object.
 */
//istanbul ignore next
export const Global: any =
    typeof window !== "undefined"
        ? window
        : typeof self !== "undefined"
        ? self
        : typeof global !== "undefined"
        ? global
        : typeof globalThis !== "undefined"
        ? globalThis
        : undefined
