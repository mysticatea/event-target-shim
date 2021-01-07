import { Event } from "./event"
import { EventTarget, getEventTargetInternalData } from "./event-target"
import { addListener, ListenerList, removeListener } from "./listener-list"
import { ensureListenerList } from "./listener-list-map"
import { InvalidAttributeHandler } from "./warnings"

/**
 * Get the current value of a given event attribute.
 * @param target The `EventTarget` object to get.
 * @param type The event type.
 */
export function getEventAttributeValue<
    TEventTarget extends EventTarget<any, any>,
    TEvent extends Event
>(
    target: TEventTarget,
    type: string,
): EventTarget.CallbackFunction<TEventTarget, TEvent> | null {
    const listMap = getEventTargetInternalData(target, "target")
    return listMap[type]?.attrCallback ?? null
}

/**
 * Set an event listener to a given event attribute.
 * @param target The `EventTarget` object to set.
 * @param type The event type.
 * @param callback The event listener.
 */
export function setEventAttributeValue(
    target: EventTarget<any, any>,
    type: string,
    callback: EventTarget.CallbackFunction<any, any> | null,
): void {
    if (callback != null && typeof callback !== "function") {
        InvalidAttributeHandler.warn(callback)
    }

    if (
        typeof callback === "function" ||
        (typeof callback === "object" && callback !== null)
    ) {
        upsertEventAttributeListener(target, type, callback)
    } else {
        removeEventAttributeListener(target, type)
    }
}

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * Update or insert the given event attribute handler.
 * @param target The `EventTarget` object to set.
 * @param type The event type.
 * @param callback The event listener.
 */
function upsertEventAttributeListener<
    TEventTarget extends EventTarget<any, any>
>(
    target: TEventTarget,
    type: string,
    callback: EventTarget.CallbackFunction<TEventTarget, any>,
): void {
    const list = ensureListenerList(
        getEventTargetInternalData(target, "target"),
        String(type),
    )
    list.attrCallback = callback

    if (list.attrListener == null) {
        list.attrListener = addListener(
            list,
            defineEventAttributeCallback(list),
            false,
            false,
            false,
            undefined,
        )
    }
}

/**
 * Remove the given event attribute handler.
 * @param target The `EventTarget` object to remove.
 * @param type The event type.
 * @param callback The event listener.
 */
function removeEventAttributeListener(
    target: EventTarget<any, any>,
    type: string,
): void {
    const listMap = getEventTargetInternalData(target, "target")
    const list = listMap[String(type)]
    if (list && list.attrListener) {
        removeListener(list, list.attrListener.callback, false)
        list.attrCallback = list.attrListener = undefined
    }
}

/**
 * Define the callback function for the given listener list object.
 * It calls `attrCallback` property if the property value is a function.
 * @param list The `ListenerList` object.
 */
function defineEventAttributeCallback(
    list: ListenerList,
): EventTarget.CallbackFunction<any, any> {
    return function (event) {
        const callback = list.attrCallback
        if (typeof callback === "function") {
            callback.call(this, event)
        }
    }
}
