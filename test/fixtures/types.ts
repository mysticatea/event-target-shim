/// <reference lib="dom" />
import {
    Event as EventShim,
    EventTarget as EventTargetShim,
    getEventAttributeValue,
    setEventAttributeValue,
} from "../../src/index"

let signal = new AbortController().signal

class MyEvent extends EventShim<"myevent"> {
    readonly value: number
    constructor(value: number) {
        super("myevent")
        this.value = value
    }
}
type EventMap1 = {
    test: EventShim<"test">
    myevent: MyEvent
}

const a = new EventTargetShim()
const b = new EventTargetShim<EventMap1>()

//------------------------------------------------------------------------------
// Assignments
//------------------------------------------------------------------------------

let EventDomToShim: EventShim = new Event("test")
let EventShimToDom: Event = new EventShim("test")
let EventTargetDomToShim: EventTargetShim = new EventTarget()
let EventTargetShimToDom: EventTarget = new EventTargetShim()
let EventTargetDomToShim1: EventTargetShim<EventMap1> = new EventTarget()
let EventTargetShimToDom1: EventTarget = new EventTargetShim<EventMap1>()
let AbortSignalDomToShim: EventTargetShim.AbortSignal = new AbortController()
    .signal
let AbortSignalShimToDom: AbortSignal = {} as EventTargetShim.AbortSignal

//------------------------------------------------------------------------------
// EventTarget#addEventListener
//------------------------------------------------------------------------------

a.addEventListener("test")
a.addEventListener("test", (_event: EventShim) => {})
a.addEventListener("test", (_event: Event) => {})
a.addEventListener("test", event => {
    const domEvent: Event = event
    const shimEvent: EventShim = event
})
b.addEventListener("test", event => {
    // `event` is an `Event`
    const ev: Event = event
    // @ts-expect-error -- `Event` cannot be assigned to `MyEvent`.
    const myEvent: MyEvent = event
    // @ts-expect-error -- `Event` cannot be assigned to `string`.
    const str: string = event
})
b.addEventListener("myevent", event => {
    // `event` is an `MyEvent`
    const ev1: Event = event
    const ev2: MyEvent = event
    // @ts-expect-error -- `MyEvent` cannot be assigned to `string`.
    const str: string = event
})
b.addEventListener("non-exist", event => {
    // `event` is an `Event`
    const ev: Event = event
    // @ts-expect-error -- `Event` cannot be assigned to `MyEvent`.
    const myEvent: MyEvent = event
    // @ts-expect-error -- `Event` cannot be assigned to `string`.
    const str: string = event
})

// Options
a.addEventListener("test", null, true)
a.addEventListener("test", null, { capture: true })
a.addEventListener("test", null, { once: true })
a.addEventListener("test", null, { passive: true })
a.addEventListener("test", null, { signal: signal })
a.addEventListener("test", null, {
    capture: true,
    once: true,
    passive: true,
    signal: signal,
})

// @ts-expect-error -- require `type` argument at least.
a.addEventListener()
// @ts-expect-error -- `foo` doesn't exist.
a.addEventListener("test", null, { foo: true })

//------------------------------------------------------------------------------
// EventTarget#removeEventListener
//------------------------------------------------------------------------------

a.removeEventListener("test")
a.removeEventListener("test", (_event: EventShim) => {})
a.removeEventListener("test", (_event: Event) => {})

// Options
a.removeEventListener("test", null, true)
a.removeEventListener("test", null, { capture: true })

// @ts-expect-error -- require `type` argument at least.
a.removeEventListener()
// @ts-expect-error -- `once` doesn't exist.
a.removeEventListener("test", null, { once: true })
// @ts-expect-error -- `passive` doesn't exist.
a.removeEventListener("test", null, { passive: true })
// @ts-expect-error -- `signal` doesn't exist.
a.removeEventListener("test", null, { signal: signal })

//------------------------------------------------------------------------------
// EventTarget#dispatchEvent
//------------------------------------------------------------------------------

a.dispatchEvent(new Event("test"))
a.dispatchEvent(new EventShim("test"))

// @ts-expect-error -- require `event` argument.
a.dispatchEvent()

//------------------------------------------------------------------------------
// Strict Mode
//------------------------------------------------------------------------------

let my = new EventTargetShim<EventMap1, "strict">()
my.addEventListener("test", event => {
    const test: EventShim<"test"> = event
    // @ts-expect-error -- `Event` cannot be assigned to `MyEvent`.
    const myevent: MyEvent = event
})
my.addEventListener("myevent", event => {
    // @ts-expect-error -- `MyEvent` cannot be assigned to `Event<"test">`.
    const test: EventShim<"test"> = event
    const ev: Event = event
    const myevent: MyEvent = event
})
// @ts-expect-error -- non-exist cannot be assgined to `"test" | "myevent"`.
my.addEventListener("non-exist", _event => {})
my.dispatchEvent(new EventShim("test"))
my.dispatchEvent(new MyEvent(1))
my.dispatchEvent({ type: "test" })
my.dispatchEvent({ type: "myevent", value: 1 })
// @ts-expect-error -- require `value` property
my.dispatchEvent({ type: "myevent" })
// @ts-expect-error -- `type` must be "test" or "myevent"
my.dispatchEvent({ type: "nonexist" })
// @ts-expect-error -- `type` must be "test" or "myevent"
my.dispatchEvent(new Event("test"))

//------------------------------------------------------------------------------
// getEventAttributeValue / setEventAttributeValue
//------------------------------------------------------------------------------

class MyEventTarget1 extends EventTargetShim<EventMap1> {
    get ontest() {
        return getEventAttributeValue<this, EventMap1["test"]>(this, "test")
    }
    set ontest(value) {
        setEventAttributeValue(this, "test", value)
    }
    get onmyevent() {
        return getEventAttributeValue<this, EventMap1["myevent"]>(
            this,
            "myevent",
        )
    }
    set onmyevent(value) {
        setEventAttributeValue(this, "myevent", value)
    }
}
let eav = new MyEventTarget1()
eav.ontest = e => {
    const shim: EventShim<"test"> = e
    // @ts-expect-error -- `e` is EventShim<"test">
    const myevent: MyEvent = e
}
eav.onmyevent = e => {
    const shim: MyEvent = e
    // @ts-expect-error -- `e` is MyEvent
    const myevent: EventShim<"test"> = e
}
