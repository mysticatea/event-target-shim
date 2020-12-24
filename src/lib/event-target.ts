import DOMException from "domexception"
import { Event, getEventData } from "./event"
import { EventWrapper } from "./event-wrapper"
import { Global } from "./global"
import { assert, assertType, error, warn } from "./misc"

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
        internalDataMap.set(this, Object.create(null))
    }

    /**
     * Add an event listener.
     * @param type The event type.
     * @param callback The event listener.
     * @param options Options.
     */
    addEventListener<T extends string & keyof TEventMap>(
        type: T,
        callback?: EventTarget.EventListener<TEventMap[T]> | null,
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
        callback: EventTarget.EventListener<TEventMap[T]> | null | undefined,
        capture: boolean,
    ): void

    /**
     * Add an event listener.
     * @param type The event type.
     * @param callback The event listener.
     * @param options Options.
     */
    addEventListener(
        type: string,
        callback?: EventTarget.FallbackEventListener<TMode>,
        options?: EventTarget.AddOptions,
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
        callback: EventTarget.FallbackEventListener<TMode>,
        capture: boolean,
    ): void

    // Implementation
    addEventListener<T extends string & keyof TEventMap>(
        type0: T,
        callback0?: EventTarget.EventListener<TEventMap[T]> | null,
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

        // Find existing listener.
        const list = ensureListenerList(listenerMap, type)
        const i = findIndexOfListener(list.listeners, callback, capture)
        if (i !== -1) {
            warnDuplicate(list.listeners[i], callback, passive, once, signal)
            return
        }

        // Init for the signal.
        let signalListener: (() => void) | undefined
        if (signal) {
            signalListener = findAndRemoveListener.bind(
                null,
                listenerMap,
                type,
                callback,
                capture,
            )
            signal.addEventListener("abort", signalListener)
        }

        // Add the new listener.
        addListener(list, {
            callback,
            flags:
                (capture ? ListenerFlags.Capture : 0) |
                (passive ? ListenerFlags.Passive : 0) |
                (once ? ListenerFlags.Once : 0),
            signal,
            signalListener,
        })
    }

    /**
     * Remove an added event listener.
     * @param type The event type.
     * @param callback The event listener.
     * @param options Options.
     */
    removeEventListener<T extends string & keyof TEventMap>(
        type: T,
        callback?: EventTarget.EventListener<TEventMap[T]> | null,
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
        callback: EventTarget.EventListener<TEventMap[T]> | null | undefined,
        capture: boolean,
    ): void

    /**
     * Remove an added event listener.
     * @param type The event type.
     * @param callback The event listener.
     * @param options Options.
     */
    removeEventListener(
        type: string,
        callback?: EventTarget.FallbackEventListener<TMode>,
        options?: EventTarget.Options,
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
        callback: EventTarget.FallbackEventListener<TMode>,
        capture: boolean,
    ): void

    // Implementation
    removeEventListener<T extends string & keyof TEventMap>(
        type0: T,
        callback0?: EventTarget.EventListener<TEventMap[T]> | null,
        options0?: boolean | EventTarget.Options,
    ): void {
        const listenerMap = $(this)
        const { callback, capture, type } = normalizeOptions(
            type0,
            callback0,
            options0,
        )
        if (callback == null) {
            return
        }

        findAndRemoveListener(listenerMap, type, callback, capture)
    }

    /**
     * Dispatch an event.
     * @param event The `Event` object to dispatch.
     */
    dispatchEvent<T extends string & keyof TEventMap>(
        event: EventTarget.EventData<TEventMap, T>,
    ): boolean

    /**
     * Dispatch an event.
     * @param event The `Event` object to dispatch.
     */
    dispatchEvent(event: EventTarget.FallbackEvent<TMode>): boolean

    // Implementation
    dispatchEvent(event0: Event): boolean {
        const list = $(this)[String(event0.type)]
        if (list == null) {
            return true
        }

        const event =
            event0 instanceof Event ? event0 : EventWrapper.wrap(event0)
        const eventData = getEventData(event)
        if (eventData.dispatchFlag) {
            throw new DOMException(
                "This event has been in dispatching.",
                "InvalidStateError",
            )
        }
        assert(event.isTrusted === false, "'isTrusted' property must be false")

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
                if (isOnce(listener) && removeListener(list, i, !cow)) {
                    i -= 1
                }

                // Call this listener with the `passive` flag.
                eventData.inPassiveListenerFlag = isPassive(listener)
                invoke(
                    listener.callback,
                    (this as unknown) as EventTarget,
                    event,
                    isEventAttribute(listener),
                )
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
    export type EventListener<T extends Event = Event> =
        | FunctionEventListener<T>
        | ObjectEventListener<T>

    /**
     * The event listener function.
     */
    export interface FunctionEventListener<T extends Event = Event> {
        (event: T): void
    }

    /**
     * The event listener object.
     * @see https://dom.spec.whatwg.org/#callbackdef-eventlistener
     * @deprecated Use first-class functions instead.
     */
    export interface ObjectEventListener<T extends Event = Event> {
        handleEvent(event: T): void
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
        onabort: FunctionEventListener | null
    }

    export type EventData<
        TEventMap extends Record<string, Event>,
        TEventType extends string
    > = IsString<keyof TEventMap> extends true
        ? never
        : ExplicitType<TEventType> &
              Partial<Omit<Event, "type">> &
              Omit<TEventMap[TEventType], keyof Event>

    export type IsString<T> = T extends string
        ? string extends T
            ? true
            : false
        : false

    export type ExplicitType<T extends string> = string extends T
        ? never
        : { readonly type: T }

    export type FallbackEventListener<
        TMode extends "standard" | "strict"
    > = TMode extends "standard" ? EventListener | null | undefined : never

    export type FallbackEvent<
        TMode extends "standard" | "strict"
    > = TMode extends "standard" ? Event : never
}

/**
 * Get the current value of a given event attribute.
 * @param target The `EventTarget` object to get.
 * @param type The event type.
 */
export function getEventAttributeValue<TEvent extends Event>(
    target: EventTarget,
    type: string,
): EventTarget.FunctionEventListener<TEvent> | null {
    const retv = $(target)[type]?.attr?.callback ?? null
    return retv as EventTarget.FunctionEventListener<TEvent> | null
}

/**
 * Set an event listener to a given event attribute.
 * @param target The `EventTarget` object to set.
 * @param type The event type.
 * @param callback The event listener.
 */
export function setEventAttributeValue<TEvent extends Event>(
    target: EventTarget,
    type: string,
    callback: EventTarget.FunctionEventListener<TEvent> | null,
): void {
    const list = ensureListenerList($(target), String(type))
    if (
        typeof callback === "function" ||
        (typeof callback === "object" && callback !== null)
    ) {
        // Set it
        if (list.attr) {
            list.attr.callback = callback as EventTarget.EventListener
        } else {
            addListener(
                list,
                (list.attr = {
                    callback: callback as EventTarget.EventListener,
                    flags: ListenerFlags.EventAttribute,
                    signal: undefined,
                    signalListener: undefined,
                }),
            )
        }
    } else if (list.attr) {
        // Remove it
        removeListener(list, list.listeners.indexOf(list.attr))
    }
}

/**
 * Get registered event listeners from an `EventTarget` object.
 * @param target The `EventTarget` object to get.
 * @param type The type of events to get.
 */
export function countEventListeners<
    TEventMap extends Record<string, Event> = Record<string, Event>,
    TMode extends "standard" | "strict" = "standard"
>(target: EventTarget<TEventMap, TMode>, type?: string): number {
    const listenerMap = $(target)
    const keys = type ? [type] : Object.keys(listenerMap)
    return keys.reduce(
        (count, key) => count + listenerMap[key]!.listeners.length,
        0,
    )
}

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * Internal data for EventTarget
 */
type EventTargetInternalData = Record<string, ListenerList | undefined>

/**
 * Information of an listener list.
 */
interface ListenerList {
    /**
     * The listener of the event attribute handler.
     */
    attr: Listener | undefined
    /**
     * `true` if the `dispatchEvent` method is traversing the current `listeners` array.
     */
    cow: boolean
    /**
     * The listeners.
     * This is writable for copy-on-write.
     */
    listeners: Listener[]
}

/**
 * The event listener concept.
 * @see https://dom.spec.whatwg.org/#concept-event-listener
 */
interface Listener {
    /**
     * The callback function.
     * This is writable for event attribute handlers.
     */
    callback: EventTarget.EventListener
    /**
     * The flags of this listener.
     * This is writable to add the removed flag.
     */
    flags: ListenerFlags
    /**
     * The `AbortSignal` to remove this listener.
     */
    readonly signal: EventTarget.AbortSignal | undefined
    /**
     * The `abort` event listener for the `signal`.
     * To remove it from the `signal`.
     */
    readonly signalListener: (() => void) | undefined
}

/**
 * The flags of listeners.
 */
const enum ListenerFlags {
    EventAttribute = 0x01,
    Capture = 0x02,
    Passive = 0x04,
    Once = 0x08,
    Removed = 0x10,
}

/**
 * Internal data.
 */
const internalDataMap = new WeakMap<any, EventTargetInternalData>()

/**
 * Get private data.
 * @param target The event target object to get private data.
 * @returns The private data of the event.
 */
function $(target: any): EventTargetInternalData {
    const retv = internalDataMap.get(target)
    assertType(
        retv != null,
        "'this' is expected an EventTarget object, but got %o",
        target,
    )
    return retv
}

/**
 * Normalize options.
 * @param options The options to normalize.
 */
function normalizeAddOptions<TEvent extends Event>(
    type: string,
    callback: EventTarget.EventListener<TEvent> | null | undefined,
    options: boolean | EventTarget.AddOptions | undefined,
): {
    type: string
    callback: EventTarget.EventListener | undefined
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
function normalizeOptions<TEvent extends Event>(
    type: string,
    callback: EventTarget.EventListener<TEvent> | null | undefined,
    options: boolean | EventTarget.Options | undefined,
): {
    type: string
    callback: EventTarget.EventListener | null | undefined
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
function assertCallback(
    callback: any,
): asserts callback is EventTarget.EventListener | null | undefined {
    assertType(
        typeof callback === "function" ||
            typeof callback === "object" ||
            typeof callback === "undefined",
        "The 'callback' argument must be a function or object.",
    )
}

/**
 * Get the listener list of the given type.
 * If the listener list has not been initialized, initialize and return it.
 * @param listenerMap The listener list map.
 * @param type The event type to get.
 */
function ensureListenerList(
    listenerMap: Record<string, ListenerList | undefined>,
    type: string,
): ListenerList {
    return (listenerMap[type] ??= {
        attr: undefined,
        cow: false,
        listeners: [],
    })
}

/**
 * Add the given listener.
 * Does copy-on-write if needed.
 * @param list The listener list.
 * @param newListener The new listener.
 */
function addListener(list: ListenerList, newListener: Listener): void {
    if (list.cow) {
        list.cow = false
        list.listeners = [...list.listeners, newListener]
    } else {
        list.listeners.push(newListener)
    }
}

/**
 * Find the given listener and remove it.
 * @param listenerMap The listener list map.
 * @param type The event type to find.
 * @param callback The callback function to find.
 * @param capture The capture flag to find.
 */
function findAndRemoveListener(
    listenerMap: Record<string, ListenerList | undefined>,
    type: string,
    callback: EventTarget.EventListener,
    capture: boolean,
): void {
    const list = listenerMap[type]
    if (list == null) {
        return
    }

    const index = findIndexOfListener(list.listeners, callback, capture)
    if (index === -1) {
        return
    }

    removeListener(list, index)
}

/**
 * Find the index of given listener.
 * This returns `-1` if not found.
 * @param listeners The listener list.
 * @param callback The callback function to find.
 * @param capture The capture flag to find.
 */
function findIndexOfListener(
    listeners: Listener[],
    callback: EventTarget.EventListener,
    capture: boolean,
): number {
    for (let i = 0; i < listeners.length; ++i) {
        const listener = listeners[i]
        if (
            listener.callback === callback &&
            !isEventAttribute(listener) &&
            isCapture(listener) === capture
        ) {
            return i
        }
    }
    return -1
}

/**
 * Dispose a listener.
 * @param list The listener list.
 * @param index The index of the target listener.
 * @param disableCow Disable copy-on-write if true.
 * @returns `true` if it mutated the list directly.
 */
function removeListener(
    list: ListenerList,
    index: number,
    disableCow = false,
): boolean {
    const listener = list.listeners[index]

    // Set the removed flag.
    listener.flags |= ListenerFlags.Removed

    // Dispose the abort signal listener if exists.
    if (listener.signal) {
        listener.signal.removeEventListener("abort", listener.signalListener)
    }

    // Remove it from the array.
    if (list.cow && !disableCow) {
        list.cow = false
        list.listeners = list.listeners.filter((_, i) => i !== index)
        return false
    }
    list.listeners.splice(index, 1)
    return true
}

/**
 * Check if the given listener has the event attribute flag or not.
 * @param listener The listener to check.
 */
function isEventAttribute(listener: Listener): boolean {
    return (
        (listener.flags & ListenerFlags.EventAttribute) ===
        ListenerFlags.EventAttribute
    )
}

/**
 * Print warning for duplicated.
 * @param listener The current listener that is duplicated.
 * @param callback The callback function of the new duplicated listener.
 * @param passive The passive flag of the new duplicated listener.
 * @param once The once flag of the new duplicated listener.
 * @param signal The signal object of the new duplicated listener.
 */
function warnDuplicate(
    listener: Listener,
    callback: EventTarget.EventListener,
    passive: boolean,
    once: boolean,
    signal: EventTarget.AbortSignal | undefined,
): void {
    const different: string[] = []
    if (isPassive(listener) !== passive) {
        different.push("passive")
    }
    if (isOnce(listener) !== once) {
        different.push("once")
    }
    if (listener.signal !== signal) {
        different.push("signal")
    }

    const message =
        "A listener wasn't added because it has been added already: %o"
    if (different.length === 0) {
        warn(message, callback)
    } else if (different.length === 1) {
        warn(
            `${message}\nThe %o option value was different, but the new value was ignored.`,
            callback,
            different[0],
        )
    } else {
        warn(
            `${message}\nThe %o option values ware different, but the new values ware ignored.`,
            callback,
            different,
        )
    }
}

/**
 * Call an event listener.
 * @param callback The function to call.
 * @param target The event target object for `thisArg`.
 * @param event The event object for the first argument.
 * @param attribute `true` if this callback is an event attribute handler.
 */
function invoke(
    callback: EventTarget.EventListener,
    target: EventTarget,
    event: Event,
    attribute: boolean,
): void {
    try {
        if (typeof callback === "function") {
            callback.call(target, event)
        } else if (typeof callback.handleEvent === "function" && !attribute) {
            callback.handleEvent(event)
        }
    } catch (thrownError) {
        warn("An event listener threw an exception: %o", callback)
        error(thrownError)
    }
}

/**
 * Check if the given listener has the `capture` flag or not.
 * @param listener The listener to check.
 */
function isCapture(listener: Listener): boolean {
    return (listener.flags & ListenerFlags.Capture) === ListenerFlags.Capture
}

/**
 * Check if the given listener has the `passive` flag or not.
 * @param listener The listener to check.
 */
function isPassive(listener: Listener): boolean {
    return (listener.flags & ListenerFlags.Passive) === ListenerFlags.Passive
}

/**
 * Check if the given listener has the `once` flag or not.
 * @param listener The listener to check.
 */
function isOnce(listener: Listener): boolean {
    return (listener.flags & ListenerFlags.Once) === ListenerFlags.Once
}

/**
 * Check if the given listener has the `removed` flag or not.
 * @param listener The listener to check.
 */
function isRemoved(listener: Listener): boolean {
    return (listener.flags & ListenerFlags.Removed) === ListenerFlags.Removed
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
