import { Event } from "./lib/event"
import {
    EventTarget,
    getEventAttributeValue,
    setEventAttributeValue,
} from "./lib/event-target"
import { defineCustomEventTarget, defineEventAttribute } from "./lib/legacy"
import { setErrorHandler, setWarningHandler } from "./lib/misc"

export default EventTarget
export {
    defineCustomEventTarget,
    defineEventAttribute,
    Event,
    EventTarget,
    getEventAttributeValue,
    setErrorHandler,
    setEventAttributeValue,
    setWarningHandler,
}
