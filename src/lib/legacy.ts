import { Event } from "./event"
import {
    EventTarget,
    getEventAttributeValue,
    setEventAttributeValue,
} from "./event-target"

/**
 * Define an `EventTarget` class that has event attibutes.
 * @param types The types to define event attributes.
 * @deprecated Use `getEventAttributeValue`/`setEventAttributeValue` pair on your derived class instead because of static analysis friendly.
 */
export function defineCustomEventTarget<
    TEventMap extends Record<string, Event>
>(
    ...types: (string & keyof TEventMap)[]
): defineCustomEventTarget.CustomEventTargetConstructor<TEventMap> {
    class CustomEventTarget extends EventTarget {}
    for (let i = 0; i < types.length; ++i) {
        defineEventAttribute(CustomEventTarget.prototype, types[i])
    }

    return CustomEventTarget as any
}

export namespace defineCustomEventTarget {
    export type CustomEventTargetConstructor<
        TEventMap extends Record<string, Event>
    > = {
        new (): CustomEventTarget<TEventMap>
        prototype: CustomEventTarget<TEventMap>
    }

    export type CustomEventTarget<
        TEventMap extends Record<string, Event>
    > = EventTarget<TEventMap> & EventAttributes<TEventMap>

    export type EventAttributes<TEventMap extends Record<string, Event>> = {
        [P in string &
            keyof TEventMap as `on${P}`]: EventTarget.FunctionEventListener<
            TEventMap[P]
        > | null
    }
}

/**
 * Define an event attribute.
 * @param target The `EventTarget` object to define an event attribute.
 * @param type The event type to define.
 * @param _eventClass Unused, but to infer `Event` class type.
 * @deprecated Use `getEventAttributeValue`/`setEventAttributeValue` pair on your derived class instead because of static analysis friendly.
 */
export function defineEventAttribute<
    TEventTarget extends EventTarget,
    TEventType extends string,
    TEventConstrucor extends typeof Event
>(
    target: TEventTarget,
    type: TEventType,
    _eventClass?: TEventConstrucor,
): asserts target is TEventTarget &
    defineCustomEventTarget.EventAttributes<
        Record<TEventType, InstanceType<TEventConstrucor>>
    > {
    Object.defineProperty(target, `on${type}`, {
        get() {
            return getEventAttributeValue(this, type)
        },
        set(value) {
            setEventAttributeValue(this, type, value)
        },
        configurable: true,
        enumerable: true,
    })
}
