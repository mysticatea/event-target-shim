import { Global } from "./global"

/**
 * Create a new InvalidStateError instance.
 * @param message The error message.
 */
export function createInvalidStateError(message: string): Error {
    if (Global.DOMException) {
        return new Global.DOMException(message, "InvalidStateError")
    }

    if (DOMException == null) {
        DOMException = class DOMException extends Error {
            constructor(msg: string) {
                super(msg)
                if ((Error as any).captureStackTrace) {
                    ;(Error as any).captureStackTrace(this, DOMException)
                }
            }
            // eslint-disable-next-line class-methods-use-this
            get code() {
                return 11
            }
            // eslint-disable-next-line class-methods-use-this
            get name() {
                return "InvalidStateError"
            }
        }
        Object.defineProperties(DOMException.prototype, {
            code: { enumerable: true },
            name: { enumerable: true },
        })
        defineErrorCodeProperties(DOMException)
        defineErrorCodeProperties(DOMException.prototype)
    }
    return new DOMException(message)
}

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

let DOMException: { new (message: string): Error } | undefined

const ErrorCodeMap = {
    INDEX_SIZE_ERR: 1,
    DOMSTRING_SIZE_ERR: 2,
    HIERARCHY_REQUEST_ERR: 3,
    WRONG_DOCUMENT_ERR: 4,
    INVALID_CHARACTER_ERR: 5,
    NO_DATA_ALLOWED_ERR: 6,
    NO_MODIFICATION_ALLOWED_ERR: 7,
    NOT_FOUND_ERR: 8,
    NOT_SUPPORTED_ERR: 9,
    INUSE_ATTRIBUTE_ERR: 10,
    INVALID_STATE_ERR: 11,
    SYNTAX_ERR: 12,
    INVALID_MODIFICATION_ERR: 13,
    NAMESPACE_ERR: 14,
    INVALID_ACCESS_ERR: 15,
    VALIDATION_ERR: 16,
    TYPE_MISMATCH_ERR: 17,
    SECURITY_ERR: 18,
    NETWORK_ERR: 19,
    ABORT_ERR: 20,
    URL_MISMATCH_ERR: 21,
    QUOTA_EXCEEDED_ERR: 22,
    TIMEOUT_ERR: 23,
    INVALID_NODE_TYPE_ERR: 24,
    DATA_CLONE_ERR: 25,
}
type ErrorCodeMap = typeof ErrorCodeMap

function defineErrorCodeProperties(obj: any): void {
    const keys = Object.keys(ErrorCodeMap) as (keyof ErrorCodeMap)[]
    for (let i = 0; i < keys.length; ++i) {
        const key = keys[i]
        const value = ErrorCodeMap[key]
        Object.defineProperty(obj, key, {
            get() {
                return value
            },
            configurable: true,
            enumerable: true,
        })
    }
}
