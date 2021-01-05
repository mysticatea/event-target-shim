import {
    EventTarget,
    getEventTargetInternalData,
} from "../../src/lib/event-target"

/**
 * Get registered event listeners from an `EventTarget` object.
 * @param target The `EventTarget` object to get.
 * @param type The type of events to get.
 */
export function countEventListeners(
    target: EventTarget<any, any>,
    type?: string,
): number {
    const listenerMap = getEventTargetInternalData(target)
    const keys = type ? [type] : Object.keys(listenerMap)
    return keys.reduce(
        (count, key) => count + (listenerMap[key]?.listeners.length ?? 0),
        0,
    )
}
