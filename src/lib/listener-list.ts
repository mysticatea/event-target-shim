import { createListener, isCapture, Listener, setRemoved } from "./listener"

/**
 * Information of an listener list.
 */
export interface ListenerList {
    /**
     * The callback function of the event attribute handler.
     */
    attrCallback: Listener.CallbackFunction<any, any> | undefined
    /**
     * The listener of the event attribute handler.
     */
    attrListener: Listener | undefined
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
 * Find the index of given listener.
 * This returns `-1` if not found.
 * @param list The listener list.
 * @param callback The callback function to find.
 * @param capture The capture flag to find.
 */
export function findIndexOfListener(
    { listeners }: ListenerList,
    callback: Listener.Callback<any, any>,
    capture: boolean,
): number {
    for (let i = 0; i < listeners.length; ++i) {
        if (
            listeners[i].callback === callback &&
            isCapture(listeners[i]) === capture
        ) {
            return i
        }
    }
    return -1
}

/**
 * Add the given listener.
 * Does copy-on-write if needed.
 * @param list The listener list.
 * @param callback The callback function.
 * @param capture The capture flag.
 * @param passive The passive flag.
 * @param once The once flag.
 * @param signal The abort signal.
 */
export function addListener(
    list: ListenerList,
    callback: Listener.Callback<any, any>,
    capture: boolean,
    passive: boolean,
    once: boolean,
    signal: Listener.AbortSignal | undefined,
): Listener {
    let signalListener: (() => void) | undefined
    if (signal) {
        signalListener = removeListener.bind(null, list, callback, capture)
        signal.addEventListener("abort", signalListener)
    }

    const listener = createListener(
        callback,
        capture,
        passive,
        once,
        signal,
        signalListener,
    )

    if (list.cow) {
        list.cow = false
        list.listeners = [...list.listeners, listener]
    } else {
        list.listeners.push(listener)
    }

    return listener
}

/**
 * Remove a listener.
 * @param list The listener list.
 * @param callback The callback function to find.
 * @param capture The capture flag to find.
 * @returns `true` if it mutated the list directly.
 */
export function removeListener(
    list: ListenerList,
    callback: Listener.Callback<any, any>,
    capture: boolean,
): boolean {
    const index = findIndexOfListener(list, callback, capture)
    if (index !== -1) {
        return removeListenerAt(list, index)
    }
    return false
}

/**
 * Remove a listener.
 * @param list The listener list.
 * @param index The index of the target listener.
 * @param disableCow Disable copy-on-write if true.
 * @returns `true` if it mutated the `listeners` array directly.
 */
export function removeListenerAt(
    list: ListenerList,
    index: number,
    disableCow = false,
): boolean {
    const listener = list.listeners[index]

    // Set the removed flag.
    setRemoved(listener)

    // Dispose the abort signal listener if exists.
    if (listener.signal) {
        listener.signal.removeEventListener("abort", listener.signalListener!)
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
