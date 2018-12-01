import {EventTarget as EventTargetShim, Event as EventShim} from ".."

let a: EventTargetShim = new EventTargetShim()
let b: EventTarget = new EventTargetShim()
let c = new (EventTargetShim<"ontest">("test"))()
let d = new (EventTargetShim())()

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
