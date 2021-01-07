import { Event } from "./event"
import { Global } from "./global"
import { assertType } from "./misc"

/**
 * An implementation of `Event` interface, that wraps a given event object.
 * This class controls the internal state of `Event`.
 * @see https://dom.spec.whatwg.org/#interface-event
 */
export class EventWrapper<TEventType extends string> extends Event<TEventType> {
    /**
     * Wrap a given event object to control states.
     * @param event The event-like object to wrap.
     */
    static wrap<T extends EventLike>(event: T): EventWrapperOf<T> {
        return new (getWrapperClassOf(event))(event)
    }

    protected constructor(event: Event<TEventType>) {
        super(event.type, {
            bubbles: event.bubbles,
            cancelable: event.cancelable,
            composed: event.composed,
        })

        if (event.cancelBubble) {
            super.stopPropagation()
        }
        if (event.defaultPrevented) {
            super.preventDefault()
        }

        internalDataMap.set(this, { original: event })

        // Define accessors
        const keys = Object.keys(event)
        for (let i = 0; i < keys.length; ++i) {
            const key = keys[i]
            if (!(key in this)) {
                Object.defineProperty(
                    this,
                    key,
                    defineRedirectDescriptor(event, key),
                )
            }
        }
    }

    stopPropagation(): void {
        super.stopPropagation()

        const { original } = $(this)
        if ("stopPropagation" in original) {
            original.stopPropagation!()
        }
    }

    get cancelBubble(): boolean {
        return super.cancelBubble
    }
    set cancelBubble(value: boolean) {
        super.cancelBubble = value

        const { original } = $(this)
        if ("cancelBubble" in original) {
            original.cancelBubble = value
        }
    }

    stopImmediatePropagation(): void {
        super.stopImmediatePropagation()

        const { original } = $(this)
        if ("stopImmediatePropagation" in original) {
            original.stopImmediatePropagation!()
        }
    }

    get returnValue(): boolean {
        return super.returnValue
    }
    set returnValue(value: boolean) {
        super.returnValue = value

        const { original } = $(this)
        if ("returnValue" in original) {
            original.returnValue = value
        }
    }

    preventDefault(): void {
        super.preventDefault()

        const { original } = $(this)
        if ("preventDefault" in original) {
            original.preventDefault!()
        }
    }

    get timeStamp(): number {
        const { original } = $(this)
        if ("timeStamp" in original) {
            return original.timeStamp!
        }
        return super.timeStamp
    }
}

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

type EventLike = { readonly type: string } & Partial<Event>
type EventWrapperOf<T extends EventLike> = Event<T["type"]> &
    Omit<T, keyof Event>

interface EventWrapperInternalData {
    readonly original: EventLike
}

/**
 * Private data for event wrappers.
 */
const internalDataMap = new WeakMap<any, EventWrapperInternalData>()

/**
 * Get private data.
 * @param event The event object to get private data.
 * @returns The private data of the event.
 */
function $(event: unknown): EventWrapperInternalData {
    const retv = internalDataMap.get(event)
    assertType(
        retv != null,
        "'this' is expected an Event object, but got",
        event,
    )
    return retv
}

/**
 * Cache for wrapper classes.
 * @type {WeakMap<Object, Function>}
 * @private
 */
const wrapperClassCache = new WeakMap()

// Make association for wrappers.
wrapperClassCache.set(Object.prototype, EventWrapper)
if (typeof Global !== "undefined" && typeof Global.Event !== "undefined") {
    wrapperClassCache.set(Global.Event.prototype, EventWrapper)
}

/**
 * Get the wrapper class of a given prototype.
 * @param originalEvent The event object to wrap.
 */
function getWrapperClassOf<T extends EventLike>(
    originalEvent: T,
): { new (e: T): EventWrapperOf<T> } {
    const prototype = Object.getPrototypeOf(originalEvent)
    if (prototype == null) {
        return EventWrapper as any
    }

    let wrapper: any = wrapperClassCache.get(prototype)
    if (wrapper == null) {
        wrapper = defineWrapper(getWrapperClassOf(prototype), prototype)
        wrapperClassCache.set(prototype, wrapper)
    }

    return wrapper
}

/**
 * Define new wrapper class.
 * @param BaseEventWrapper The base wrapper class.
 * @param originalPrototype The prototype of the original event.
 */
function defineWrapper(BaseEventWrapper: any, originalPrototype: any): any {
    class CustomEventWrapper extends BaseEventWrapper {}

    const keys = Object.keys(originalPrototype)
    for (let i = 0; i < keys.length; ++i) {
        Object.defineProperty(
            CustomEventWrapper.prototype,
            keys[i],
            defineRedirectDescriptor(originalPrototype, keys[i]),
        )
    }

    return CustomEventWrapper
}

/**
 * Get the property descriptor to redirect a given property.
 */
function defineRedirectDescriptor(obj: any, key: string): PropertyDescriptor {
    const d = Object.getOwnPropertyDescriptor(obj, key)!
    return {
        get() {
            const original: any = $(this).original
            const value = original[key]
            if (typeof value === "function") {
                return value.bind(original)
            }
            return value
        },
        set(value: any) {
            const original: any = $(this).original
            original[key] = value
        },
        configurable: d.configurable,
        enumerable: d.enumerable,
    }
}
