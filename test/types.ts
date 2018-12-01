import {EventTarget as EventTargetShim, Event as EventShim} from ".."

let a: EventTargetShim = new EventTargetShim()
let b: EventTarget = new EventTargetShim()
let c = new (EventTargetShim<"ontest">("test"))()

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

c.ontest = (event: EventShim) => { }
c.ontest = (event: Event) => { }
c.ontest = null
