import { createInvalidStateError } from "./dom-exception"
import { Event, getEventInternalData } from "./event"
import { EventWrapper } from "./event-wrapper"
import { Global } from "./global"
import {
    invokeCallback,
    isCapture,
    isOnce,
    isPassive,
    isRemoved,
    Listener,
} from "./listener"
import {
    addListener,
    findIndexOfListener,
    removeListener,
    removeListenerAt,
} from "./listener-list"
import {
    createListenerListMap,
    ensureListenerList,
    ListenerListMap,
} from "./listener-list-map"
import { assertType, format } from "./misc"
import {
    EventListenerWasDuplicated,
    InvalidEventListener,
    OptionWasIgnored,
} from "./warnings"

/**
 * An implementation of the `EventTarget` interface.
 * @see https://dom.spec.whatwg.org/#eventtarget
 */
export class EventTarget<
    TEventMap extends Record<string, Event> = Record<string, Event>,
    TMode extends "standard" | "strict" = "standard"
> {
    /**
     * Initialize this instance.
     */
    constructor() {
        internalDataMap.set(this, createListenerListMap())
    }

    /**
     * Add an event listener.
     * @param type The event type.
     * @param callback The event listener.
     * @param options Options.
     */
    addEventListener<T extends string & keyof TEventMap>(
        type: T,
        callback?: EventTarget.EventListener<this, TEventMap[T]> | null,
        options?: EventTarget.AddOptions,
    ): void

    /**
     * Add an event listener.
     * @param type The event type.
     * @param callback The event listener.
     * @param options Options.
     */
    addEventListener(
        type: string,
        callback?: EventTarget.FallbackEventListener<this, TMode>,
        options?: EventTarget.AddOptions,
    ): void

    /**
     * Add an event listener.
     * @param type The event type.
     * @param callback The event listener.
     * @param capture The capture flag.
     * @deprecated Use `{capture: boolean}` object instead of a boolean value.
     */
    addEventListener<T extends string & keyof TEventMap>(
        type: T,
        callback:
            | EventTarget.EventListener<this, TEventMap[T]>
            | null
            | undefined,
        capture: boolean,
    ): void

    /**
     * Add an event listener.
     * @param type The event type.
     * @param callback The event listener.
     * @param capture The capture flag.
     * @deprecated Use `{capture: boolean}` object instead of a boolean value.
     */
    addEventListener(
        type: string,
        callback: EventTarget.FallbackEventListener<this, TMode>,
        capture: boolean,
    ): void

    // Implementation
    addEventListener<T extends string & keyof TEventMap>(
        type0: T,
        callback0?: EventTarget.EventListener<this, TEventMap[T]> | null,
        options0?: boolean | EventTarget.AddOptions,
    ): void {
        const listenerMap = $(this)
        const {
            callback,
            capture,
            once,
            passive,
            signal,
            type,
        } = normalizeAddOptions(type0, callback0, options0)
        if (callback == null || signal?.aborted) {
            return
        }
        const list = ensureListenerList(listenerMap, type)

        // Find existing listener.
        const i = findIndexOfListener(list, callback, capture)
        if (i !== -1) {
            warnDuplicate(list.listeners[i], passive, once, signal)
            return
        }

        // Add the new listener.
        addListener(list, callback, capture, passive, once, signal)
    }

    /**
     * Remove an added event listener.
     * @param type The event type.
     * @param callback The event listener.
     * @param options Options.
     */
    removeEventListener<T extends string & keyof TEventMap>(
        type: T,
        callback?: EventTarget.EventListener<this, TEventMap[T]> | null,
        options?: EventTarget.Options,
    ): void

    /**
     * Remove an added event listener.
     * @param type The event type.
     * @param callback The event listener.
     * @param options Options.
     */
    removeEventListener(
        type: string,
        callback?: EventTarget.FallbackEventListener<this, TMode>,
        options?: EventTarget.Options,
    ): void

    /**
     * Remove an added event listener.
     * @param type The event type.
     * @param callback The event listener.
     * @param capture The capture flag.
     * @deprecated Use `{capture: boolean}` object instead of a boolean value.
     */
    removeEventListener<T extends string & keyof TEventMap>(
        type: T,
        callback:
            | EventTarget.EventListener<this, TEventMap[T]>
            | null
            | undefined,
        capture: boolean,
    ): void

    /**
     * Remove an added event listener.
     * @param type The event type.
     * @param callback The event listener.
     * @param capture The capture flag.
     * @deprecated Use `{capture: boolean}` object instead of a boolean value.
     */
    removeEventListener(
        type: string,
        callback: EventTarget.FallbackEventListener<this, TMode>,
        capture: boolean,
    ): void

    // Implementation
    removeEventListener<T extends string & keyof TEventMap>(
        type0: T,
        callback0?: EventTarget.EventListener<this, TEventMap[T]> | null,
        options0?: boolean | EventTarget.Options,
    ): void {
        const listenerMap = $(this)
        const { callback, capture, type } = normalizeOptions(
            type0,
            callback0,
            options0,
        )
        const list = listenerMap[type]

        if (callback != null && list) {
            removeListener(list, callback, capture)
        }
    }

    /**
     * Dispatch an event.
     * @param event The `Event` object to dispatch.
     */
    dispatchEvent<T extends string & keyof TEventMap>(
        event: EventTarget.EventData<TEventMap, TMode, T>,
    ): boolean

    /**
     * Dispatch an event.
     * @param event The `Event` object to dispatch.
     */
    dispatchEvent(event: EventTarget.FallbackEvent<TMode>): boolean

    // Implementation
    dispatchEvent(
        e:
            | EventTarget.EventData<TEventMap, TMode, string>
            | EventTarget.FallbackEvent<TMode>,
    ): boolean {
        const list = $(this)[String(e.type)]
        if (list == null) {
            return true
        }

        const event = e instanceof Event ? e : EventWrapper.wrap(e)
        const eventData = getEventInternalData(event, "event")
        if (eventData.dispatchFlag) {
            throw createInvalidStateError("This event has been in dispatching.")
        }

        eventData.dispatchFlag = true
        eventData.target = eventData.currentTarget = this

        if (!eventData.stopPropagationFlag) {
            const { cow, listeners } = list

            // Set copy-on-write flag.
            list.cow = true

            // Call listeners.
            for (let i = 0; i < listeners.length; ++i) {
                const listener = listeners[i]

                // Skip if removed.
                if (isRemoved(listener)) {
                    continue
                }

                // Remove this listener if has the `once` flag.
                if (isOnce(listener) && removeListenerAt(list, i, !cow)) {
                    // Because this listener was removed, the next index is the
                    // same as the current value.
                    i -= 1
                }

                // Call this listener with the `passive` flag.
                eventData.inPassiveListenerFlag = isPassive(listener)
                invokeCallback(listener, this, event)
                eventData.inPassiveListenerFlag = false

                // Stop if the `event.stopImmediatePropagation()` method was called.
                if (eventData.stopImmediatePropagationFlag) {
                    break
                }
            }

            // Restore copy-on-write flag.
            if (!cow) {
                list.cow = false
            }
        }

        eventData.target = null
        eventData.currentTarget = null
        eventData.stopImmediatePropagationFlag = false
        eventData.stopPropagationFlag = false
        eventData.dispatchFlag = false

        return !eventData.canceledFlag
    }
}

export namespace EventTarget {
    /**
     * The event listener.
     */
    export type EventListener<
        TEventTarget extends EventTarget<any, any>,
        TEvent extends Event
    > = CallbackFunction<TEventTarget, TEvent> | CallbackObject<TEvent>

    /**
     * The event listener function.
     */
    export interface CallbackFunction<
        TEventTarget extends EventTarget<any, any>,
        TEvent extends Event
    > {
        (this: TEventTarget, event: TEvent): void
    }

    /**
     * The event listener object.
     * @see https://dom.spec.whatwg.org/#callbackdef-eventlistener
     */
    export interface CallbackObject<TEvent extends Event> {
        handleEvent(event: TEvent): void
    }

    /**
     * The common options for both `addEventListener` and `removeEventListener` methods.
     * @see https://dom.spec.whatwg.org/#dictdef-eventlisteneroptions
     */
    export interface Options {
        capture?: boolean
    }

    /**
     * The options for the `addEventListener` methods.
     * @see https://dom.spec.whatwg.org/#dictdef-addeventlisteneroptions
     */
    export interface AddOptions extends Options {
        passive?: boolean
        once?: boolean
        signal?: AbortSignal | null | undefined
    }

    /**
     * The abort signal.
     * @see https://dom.spec.whatwg.org/#abortsignal
     */
    export interface AbortSignal extends EventTarget<{ abort: Event }> {
        readonly aborted: boolean
        onabort: CallbackFunction<this, Event> | null
    }

    /**
     * The event data to dispatch in strict mode.
     */
    export type EventData<
        TEventMap extends Record<string, Event>,
        TMode extends "standard" | "strict",
        TEventType extends string
    > = TMode extends "strict"
        ? IsValidEventMap<TEventMap> extends true
            ? ExplicitType<TEventType> &
                  Omit<TEventMap[TEventType], keyof Event> &
                  Partial<Omit<Event, "type">>
            : never
        : never

    /**
     * Define explicit `type` property if `T` is a string literal.
     * Otherwise, never.
     */
    export type ExplicitType<T extends string> = string extends T
        ? never
        : { readonly type: T }

    /**
     * The event listener type in standard mode.
     * Otherwise, never.
     */
    export type FallbackEventListener<
        TEventTarget extends EventTarget<any, any>,
        TMode extends "standard" | "strict"
    > = TMode extends "standard"
        ? EventListener<TEventTarget, Event> | null | undefined
        : never

    /**
     * The event type in standard mode.
     * Otherwise, never.
     */
    export type FallbackEvent<
        TMode extends "standard" | "strict"
    > = TMode extends "standard" ? Event : never

    /**
     * Check if given event map is valid.
     * It's valid if the keys of the event map are narrower than `string`.
     */
    export type IsValidEventMap<T> = string extends keyof T ? false : true
}

export { $ as getEventTargetInternalData }

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * Internal data for EventTarget
 */
type EventTargetInternalData = ListenerListMap

/**
 * Internal data.
 */
const internalDataMap = new WeakMap<any, EventTargetInternalData>()

/**
 * Get private data.
 * @param target The event target object to get private data.
 * @param name The variable name to report.
 * @returns The private data of the event.
 */
function $(target: any, name = "this"): EventTargetInternalData {
    const retv = internalDataMap.get(target)
    assertType(
        retv != null,
        "'%s' must be an object that EventTarget constructor created, but got another one: %o",
        name,
        target,
    )
    return retv
}

/**
 * Normalize options.
 * @param options The options to normalize.
 */
function normalizeAddOptions(
    type: string,
    callback: EventTarget.EventListener<any, any> | null | undefined,
    options: boolean | EventTarget.AddOptions | undefined,
): {
    type: string
    callback: EventTarget.EventListener<any, any> | undefined
    capture: boolean
    passive: boolean
    once: boolean
    signal: EventTarget.AbortSignal | undefined
} {
    assertCallback(callback)

    if (typeof options === "object" && options !== null) {
        return {
            type: String(type),
            callback: callback ?? undefined,
            capture: Boolean(options.capture),
            passive: Boolean(options.passive),
            once: Boolean(options.once),
            signal: options.signal ?? undefined,
        }
    }

    return {
        type: String(type),
        callback: callback ?? undefined,
        capture: Boolean(options),
        passive: false,
        once: false,
        signal: undefined,
    }
}

/**
 * Normalize options.
 * @param options The options to normalize.
 */
function normalizeOptions(
    type: string,
    callback: EventTarget.EventListener<any, any> | null | undefined,
    options: boolean | EventTarget.Options | undefined,
): {
    type: string
    callback: EventTarget.EventListener<any, any> | undefined
    capture: boolean
} {
    assertCallback(callback)

    if (typeof options === "object" && options !== null) {
        return {
            type: String(type),
            callback: callback ?? undefined,
            capture: Boolean(options.capture),
        }
    }

    return {
        type: String(type),
        callback: callback ?? undefined,
        capture: Boolean(options),
    }
}

/**
 * Assert the type of 'callback' argument.
 * @param callback The callback to check.
 */
function assertCallback(callback: any): void {
    if (
        typeof callback === "function" ||
        (typeof callback === "object" &&
            callback !== null &&
            typeof callback.handleEvent === "function")
    ) {
        return
    }
    if (callback == null || typeof callback === "object") {
        InvalidEventListener.warn(callback)
        return
    }

    throw new TypeError(format(InvalidEventListener.message, [callback]))
}

/**
 * Print warning for duplicated.
 * @param listener The current listener that is duplicated.
 * @param passive The passive flag of the new duplicated listener.
 * @param once The once flag of the new duplicated listener.
 * @param signal The signal object of the new duplicated listener.
 */
function warnDuplicate(
    listener: Listener,
    passive: boolean,
    once: boolean,
    signal: EventTarget.AbortSignal | undefined,
): void {
    EventListenerWasDuplicated.warn(
        isCapture(listener) ? "capture" : "bubble",
        listener.callback,
    )

    if (isPassive(listener) !== passive) {
        OptionWasIgnored.warn("passive")
    }
    if (isOnce(listener) !== once) {
        OptionWasIgnored.warn("once")
    }
    if (listener.signal !== signal) {
        OptionWasIgnored.warn("signal")
    }
}

// Set enumerable
const keys = Object.getOwnPropertyNames(EventTarget.prototype)
for (let i = 0; i < keys.length; ++i) {
    if (keys[i] === "constructor") {
        continue
    }
    Object.defineProperty(EventTarget.prototype, keys[i], { enumerable: true })
}

// Ensure `eventTarget instanceof window.EventTarget` is `true`.
if (
    typeof Global !== "undefined" &&
    typeof Global.EventTarget !== "undefined"
) {
    Object.setPrototypeOf(EventTarget.prototype, Global.EventTarget.prototype)
}
