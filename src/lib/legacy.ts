import { Event } from "./event"
import {
    getEventAttributeValue,
    setEventAttributeValue,
} from "./event-attribute-handler"
import { EventTarget } from "./event-target"

/**
 * Define an `EventTarget` class that has event attibutes.
 * @param types The types to define event attributes.
 * @deprecated Use `getEventAttributeValue`/`setEventAttributeValue` pair on your derived class instead because of static analysis friendly.
 */
export function defineCustomEventTarget<
    TEventMap extends Record<string, Event>,
    TMode extends "standard" | "strict" = "standard"
>(
    ...types: (string & keyof TEventMap)[]
): defineCustomEventTarget.CustomEventTargetConstructor<TEventMap, TMode> {
    class CustomEventTarget extends EventTarget {}
    for (let i = 0; i < types.length; ++i) {
        defineEventAttribute(CustomEventTarget.prototype, types[i])
    }

    return CustomEventTarget as any
}

export namespace defineCustomEventTarget {
    /**
     * The interface of CustomEventTarget constructor.
     */
    export type CustomEventTargetConstructor<
        TEventMap extends Record<string, Event>,
        TMode extends "standard" | "strict"
    > = {
        /**
         * Create a new instance.
         */
        new (): CustomEventTarget<TEventMap, TMode>
        /**
         * prototype object.
         */
        prototype: CustomEventTarget<TEventMap, TMode>
    }

    /**
     * The interface of CustomEventTarget.
     */
    export type CustomEventTarget<
        TEventMap extends Record<string, Event>,
        TMode extends "standard" | "strict"
    > = EventTarget<TEventMap, TMode> &
        defineEventAttribute.EventAttributes<any, TEventMap>
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
    defineEventAttribute.EventAttributes<
        TEventTarget,
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

export namespace defineEventAttribute {
    /**
     * Definition of event attributes.
     */
    export type EventAttributes<
        TEventTarget extends EventTarget<any, any>,
        TEventMap extends Record<string, Event>
    > = {
        [P in string &
            keyof TEventMap as `on${P}`]: EventTarget.CallbackFunction<
            TEventTarget,
            TEventMap[P]
        > | null
    }
}
