import { ListenerList } from "./listener-list"

/**
 * The map from event types to each listener list.
 */
export interface ListenerListMap {
    [type: string]: ListenerList | undefined
}

/**
 * Create a new `ListenerListMap` object.
 */
export function createListenerListMap(): ListenerListMap {
    return Object.create(null)
}

/**
 * Get the listener list of the given type.
 * If the listener list has not been initialized, initialize and return it.
 * @param listenerMap The listener list map.
 * @param type The event type to get.
 */
export function ensureListenerList(
    listenerMap: Record<string, ListenerList | undefined>,
    type: string,
): ListenerList {
    return (listenerMap[type] ??= {
        attrCallback: undefined,
        attrListener: undefined,
        cow: false,
        listeners: [],
    })
}
