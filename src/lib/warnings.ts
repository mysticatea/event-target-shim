import { EventTarget } from "./event-target" // Used as only type, so no circular.
import { Warning } from "./warning-handler"

export const InitEventWasCalledWhileDispatching = new Warning<[]>(
    "W01",
    "Unable to initialize event under dispatching.",
)

export const FalsyWasAssignedToCancelBubble = new Warning<[]>(
    "W02",
    "Assigning any falsy value to 'cancelBubble' property has no effect.",
)

export const TruthyWasAssignedToReturnValue = new Warning<[]>(
    "W03",
    "Assigning any truthy value to 'returnValue' property has no effect.",
)

export const NonCancelableEventWasCanceled = new Warning<[]>(
    "W04",
    "Unable to preventDefault on non-cancelable events.",
)

export const CanceledInPassiveListener = new Warning<[]>(
    "W05",
    "Unable to preventDefault inside passive event listener invocation.",
)

export const EventListenerWasDuplicated = new Warning<
    [type: "bubble" | "capture", callback: EventTarget.EventListener<any, any>]
>(
    "W06",
    "An event listener wasn't added because it has been added already: %o, %o",
)

export const OptionWasIgnored = new Warning<
    [name: "passive" | "once" | "signal"]
>(
    "W07",
    "The %o option value was abandoned because the event listener wasn't added as duplicated.",
)

export const InvalidEventListener = new Warning<
    [callback: EventTarget.EventListener<any, any> | {} | null | undefined]
>(
    "W08",
    "The 'callback' argument must be a function or an object that has 'handleEvent' method: %o",
)

export const InvalidAttributeHandler = new Warning<
    [callback: EventTarget.EventListener<any, any> | {}]
>("W09", "Event attribute handler must be a function: %o")
