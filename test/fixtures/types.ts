import {
    EventTarget as EventTargetShim,
    Event as EventShim,
    Type,
    defineEventAttribute,
} from "../../index"

let a: EventTargetShim = new EventTargetShim()
let b: EventTarget = new EventTargetShim()
let c = new (EventTargetShim<{ test: Event }, { ontest: Event }>("test"))()
let d = new (EventTargetShim("test"))()

a.addEventListener("test", (event: EventShim) => { })
a.addEventListener("test", (event: Event) => { })

a.addEventListener("test", (event: EventShim) => { }, true)
a.addEventListener("test", (event: EventShim) => { }, { capture: true })
a.addEventListener("test", (event: EventShim) => { }, { capture: true, once: true, passive: true })

a.dispatchEvent(new CustomEvent("test"))
a.dispatchEvent({ type: "test" })

a.removeEventListener("test", (event: EventShim) => { })
a.removeEventListener("test", (event: Event) => { })

a.removeEventListener("test", (event: EventShim) => { }, true)
a.removeEventListener("test", (event: EventShim) => { }, { capture: true })

b.addEventListener("test", (event: EventShim) => { })
b.addEventListener("test", (event: Event) => { })

b.addEventListener("test", (event: EventShim) => { }, true)
b.addEventListener("test", (event: EventShim) => { }, { capture: true })
b.addEventListener("test", (event: EventShim) => { }, { capture: true, once: true, passive: true })

b.dispatchEvent(new CustomEvent("test"))

b.removeEventListener("test", (event: EventShim) => { })
b.removeEventListener("test", (event: Event) => { })

b.removeEventListener("test", (event: EventShim) => { }, true)
b.removeEventListener("test", (event: EventShim) => { }, { capture: true })

c.addEventListener("test", (event: EventShim) => { })
c.addEventListener("test", (event: Event) => { })

c.addEventListener("test", (event: EventShim) => { }, true)
c.addEventListener("test", (event: EventShim) => { }, { capture: true })
c.addEventListener("test", (event: EventShim) => { }, { capture: true, once: true, passive: true })

c.dispatchEvent(new CustomEvent("test"))
c.dispatchEvent({ type: "test" })

c.removeEventListener("test", (event: EventShim) => { })
c.removeEventListener("test", (event: Event) => { })

c.removeEventListener("test", (event: EventShim) => { }, true)
c.removeEventListener("test", (event: EventShim) => { }, { capture: true })

c.ontest = (event: EventShim) => { }
c.ontest = (event: Event) => { }
c.ontest = null

d.addEventListener("test", (event: EventShim) => { })
d.addEventListener("test", (event: Event) => { })

d.addEventListener("test", (event: EventShim) => { }, true)
d.addEventListener("test", (event: EventShim) => { }, { capture: true })
d.addEventListener("test", (event: EventShim) => { }, { capture: true, once: true, passive: true })

d.dispatchEvent(new CustomEvent("test"))
d.dispatchEvent({ type: "test" })

d.removeEventListener("test", (event: EventShim) => { })
d.removeEventListener("test", (event: Event) => { })

d.removeEventListener("test", (event: EventShim) => { }, true)
d.removeEventListener("test", (event: EventShim) => { }, { capture: true })

interface TestEvent extends Event {
    type: "test"
    data: string
}

// In "strict" mode, cannot use undefined event types.
// On the other hand, it cannot be assigned to the standard `EventTarget` type.
// This means the following cases are error.
const StrictCustomEventTarget = EventTargetShim<
    { test: TestEvent },
    { ontest: TestEvent },
    "strict"
>("test")
const e = new StrictCustomEventTarget()

e.addEventListener("test", e => { const e2: TestEvent = e })
e.removeEventListener("test", e => { const e2: TestEvent = e })
e.dispatchEvent({ type: "test", data: "" })
e.dispatchEvent({ type: "test" }) //@expected 2345

e.addEventListener(
    "other", //@expected 2345
    e => { const e2: Event = e } //@expected 7006
)
e.removeEventListener(
    "other", //@expected 2345
    e => { const e2: Event = e } //@expected 7006
)
e.dispatchEvent({ type: "other" }) //@expected 2322
b = e //@expected 2322

// In "loose" mode, can use undefined event types and can be assigned to the
// standard `EventTarget` type.
const LooseCustomEventTarget = EventTargetShim<
    { test: TestEvent },
    { ontest: TestEvent }
>("test")
const f = new LooseCustomEventTarget()

f.addEventListener("test", e => { const e2: TestEvent = e })
f.removeEventListener("test", e => { const e2: TestEvent = e })
f.dispatchEvent({ type: "test", data: "" })
f.dispatchEvent({ type: "test" }) //⚠️ cannot infer type

f.addEventListener("other", e => { const e2: Event = e })
f.removeEventListener("other", e => { const e2: Event = e })
f.dispatchEvent({ type: "other" })
b = f

defineEventAttribute(StrictCustomEventTarget.prototype, "test")
defineEventAttribute(LooseCustomEventTarget.prototype, "test")

class AbortSignal extends EventTargetShim<
    { abort: Event & Type<"abort"> },
    { onabort: Event & Type<"abort"> },
    "loose"
> {
}
defineEventAttribute(AbortSignal.prototype, "abort")

class EventSource extends EventTargetShim<
    { error: Event & Type<"error">, message: MessageEvent & Type<"message">, open: Event & Type<"open"> },
    { onerror: Event & Type<"error">, onmessage: MessageEvent & Type<"message">, onopen: Event & Type<"open"> },
    "strict"
> {
}
defineEventAttribute(EventSource.prototype, "close")
defineEventAttribute(EventSource.prototype, "error")
defineEventAttribute(EventSource.prototype, "message")

let es = new EventSource()
es.addEventListener("message", e => { e.data })
es.dispatchEvent({ type: "message" }) //@expected 2345
