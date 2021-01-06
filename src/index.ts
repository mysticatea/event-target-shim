import { setErrorHandler } from "./lib/error-handler"
import { Event } from "./lib/event"
import {
    getEventAttributeValue,
    setEventAttributeValue,
} from "./lib/event-attribute-handler"
import { EventTarget } from "./lib/event-target"
import { defineCustomEventTarget, defineEventAttribute } from "./lib/legacy"
import { setWarningHandler } from "./lib/warning-handler"

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
