import { reportError } from "./error-handler"
import { Event } from "./event" // Used as only type, so no circular.
import { EventTarget } from "./event-target" // Used as only type, so no circular.

/**
 * The event listener concept.
 * @see https://dom.spec.whatwg.org/#concept-event-listener
 */
export interface Listener {
    /**
     * The callback function.
     */
    readonly callback: Listener.Callback<any, any>
    /**
     * The flags of this listener.
     * This is writable to add the removed flag.
     */
    flags: ListenerFlags
    /**
     * The `AbortSignal` to remove this listener.
     */
    readonly signal: Listener.AbortSignal | undefined
    /**
     * The `abort` event listener for the `signal`.
     * To remove it from the `signal`.
     */
    readonly signalListener: (() => void) | undefined
}

export namespace Listener {
    export type Callback<
        TEventTarget extends EventTarget<any, any>,
        TEvent extends Event
    > = CallbackFunction<TEventTarget, TEvent> | CallbackObject<TEvent>

    export interface CallbackFunction<
        TEventTarget extends EventTarget<any, any>,
        TEvent extends Event
    > {
        (this: TEventTarget, event: TEvent): void
    }

    export interface CallbackObject<TEvent extends Event> {
        handleEvent(event: TEvent): void
    }

    export interface AbortSignal {
        addEventListener(type: string, callback: Callback<any, Event>): void
        removeEventListener(type: string, callback: Callback<any, Event>): void
    }
}

/**
 * Create a new listener.
 * @param callback The callback function.
 * @param capture The capture flag.
 * @param passive The passive flag.
 * @param once The once flag.
 * @param signal The abort signal.
 * @param signalListener The abort event listener for the abort signal.
 */
export function createListener(
    callback: Listener.Callback<any, any>,
    capture: boolean,
    passive: boolean,
    once: boolean,
    signal: Listener.AbortSignal | undefined,
    signalListener: (() => void) | undefined,
): Listener {
    return {
        callback,
        flags:
            (capture ? ListenerFlags.Capture : 0) |
            (passive ? ListenerFlags.Passive : 0) |
            (once ? ListenerFlags.Once : 0),
        signal,
        signalListener,
    }
}

/**
 * Set the `removed` flag to the given listener.
 * @param listener The listener to check.
 */
export function setRemoved(listener: Listener): void {
    listener.flags |= ListenerFlags.Removed
}

/**
 * Check if the given listener has the `capture` flag or not.
 * @param listener The listener to check.
 */
export function isCapture(listener: Listener): boolean {
    return (listener.flags & ListenerFlags.Capture) === ListenerFlags.Capture
}

/**
 * Check if the given listener has the `passive` flag or not.
 * @param listener The listener to check.
 */
export function isPassive(listener: Listener): boolean {
    return (listener.flags & ListenerFlags.Passive) === ListenerFlags.Passive
}

/**
 * Check if the given listener has the `once` flag or not.
 * @param listener The listener to check.
 */
export function isOnce(listener: Listener): boolean {
    return (listener.flags & ListenerFlags.Once) === ListenerFlags.Once
}

/**
 * Check if the given listener has the `removed` flag or not.
 * @param listener The listener to check.
 */
export function isRemoved(listener: Listener): boolean {
    return (listener.flags & ListenerFlags.Removed) === ListenerFlags.Removed
}

/**
 * Call an event listener.
 * @param listener The listener to call.
 * @param target The event target object for `thisArg`.
 * @param event The event object for the first argument.
 * @param attribute `true` if this callback is an event attribute handler.
 */
export function invokeCallback(
    { callback }: Listener,
    target: EventTarget<any, any>,
    event: Event<any>,
): void {
    try {
        if (typeof callback === "function") {
            callback.call(target, event)
        } else if (typeof callback.handleEvent === "function") {
            callback.handleEvent(event)
        }
    } catch (thrownError) {
        reportError(thrownError)
    }
}

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * The flags of listeners.
 */
const enum ListenerFlags {
    Capture = 0x01,
    Passive = 0x02,
    Once = 0x04,
    Removed = 0x08,
}
