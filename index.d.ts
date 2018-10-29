export as namespace EventTargetShim;

export interface Event {
    /**
     * The type of this event.
     */
    readonly type: string;

    /**
     * The target of this event.
     */
    readonly target: EventTarget;

    /**
     * The target of this event.
     */
    readonly currentTarget: EventTarget;

    /**
     * The composed path of this event.
     */
    composedPath(): EventTarget[];

    /**
     * Constant of NONE.
     */
    readonly NONE: number;

    /**
     * Constant of CAPTURING_PHASE.
     */
    readonly CAPTURING_PHASE: number;

    /**
     * Constant of AT_TARGET.
     */
    readonly AT_TARGET: number;

    /**
     * Indicates which phase of the event flow is currently being evaluated.
     */
    readonly eventPhase: number;

    /**
     * Stop event bubbling.
     */
    stopPropagation(): void;

    /**
     * Stop event bubbling.
     */
    stopImmediatePropagation(): void;

    /**
     * The flag indicating bubbling.
     */
    readonly bubbles: boolean;

    /**
     * The flag indicating whether the event can be canceled.
     */
    readonly cancelable: boolean;

    /**
     * Cancel this event.
     */
    preventDefault(): void;

    /**
     * The flag to indicating whether the event was canceled.
     */
    readonly defaultPrevented: boolean;

    /**
     * The flag to indicating if event is composed.
     */
    readonly composed: boolean;

    /**
     * Indicates whether the event was dispatched by the user agent.
     */
    readonly isTrusted: boolean;

    /**
     * The unix time of this event.
     */
    readonly timeStamp: number;
}

export interface EventListenerOptions {
    capture?: boolean;
    passive?: boolean;
    once?: boolean;
}

export interface EventTarget {
    /**
     * Add a given listener to this event target.
     * @param eventName The event name to add.
     * @param listener The listener to add.
     * @param options The options for this listener.
     * @returns `true` if the listener was actually added.
     */
    addEventListener(
        eventName: string,
        listener: (this: this, ev: Event) => any,
        options?: boolean | EventListenerOptions,
    ): boolean;

    /**
     * Remove a given listener from this event target.
     * @param eventName The event name to remove.
     * @param listener The listener to remove.
     * @param options The options for this listener.
     * @returns `true` if the listener was actually removed.
     */
    removeEventListener(
        eventName: string,
        listener: (this: this, ev: Event) => any,
        options?: boolean | EventListenerOptions,
    ): boolean;

    /**
     * Dispatch a given event.
     * @param event The event to dispatch.
     * @returns `false` if canceled.
     */
    dispatchEvent(event: Event | { type: string }): boolean;
}

export const EventTarget: {
    prototype: EventTarget;

    /**
     * The event target wrapper.
     * @param events Optional event attributes (e.g. passing in `"click"` adds `onclick` to prototype).
     */
    new(...events: string[]): EventTarget;
};
export default EventTarget;

/**
 * Define an event attribute (e.g. `eventTarget.onclick`).
 * @param eventTargetPrototype The event target prototype to define an event attribute.
 * @param eventName The event name to define.
 */
export function defineEventAttribute(eventTargetPrototype: EventTarget, eventName: string): void;
