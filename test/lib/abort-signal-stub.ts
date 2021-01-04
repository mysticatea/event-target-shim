import {
    Event,
    EventTarget,
    getEventAttributeValue,
    setEventAttributeValue,
} from "../../src/index"

type AbortSignalEventMap = {
    abort: Event
}

/**
 * Stub for AbortSignal.
 */
export class AbortSignalStub extends EventTarget<AbortSignalEventMap> {
    public aborted = false

    public get onabort(): EventTarget.FunctionEventListener | null {
        return getEventAttributeValue(this, "abort")
    }
    public set onabort(value: EventTarget.FunctionEventListener | null) {
        setEventAttributeValue(this, "abort", value)
    }

    public abort(): void {
        this.aborted = true
        this.dispatchEvent(new Event("abort"))
    }
}
