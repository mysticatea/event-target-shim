/**
 * @author Toru Nagashima
 * @copyright 2015 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//-----------------------------------------------------------------------------
// Requirements
//-----------------------------------------------------------------------------

var createUniqueKey = require("./commons").createUniqueKey

//-----------------------------------------------------------------------------
// Constsnts
//-----------------------------------------------------------------------------

/**
 * The key of the flag which is turned on by `stopImmediatePropagation` method.
 *
 * @type {symbol|string}
 * @private
 */
var STOP_IMMEDIATE_PROPAGATION_FLAG =
    createUniqueKey("stop_immediate_propagation_flag")

/**
 * The key of the flag which is turned on by `preventDefault` method.
 *
 * @type {symbol|string}
 * @private
 */
var CANCELED_FLAG = createUniqueKey("canceled_flag")

/**
 * The key of the flag that it cannot use `preventDefault` method.
 *
 * @type {symbol|string}
 * @private
 */
var PASSIVE_LISTENER_FLAG = createUniqueKey("passive_listener_flag")

/**
 * The key of the original event object.
 *
 * @type {symbol|string}
 * @private
 */
var ORIGINAL_EVENT = createUniqueKey("original_event")

/**
 * Method definitions for the event wrapper.
 *
 * @type {object}
 * @private
 */
var wrapperPrototypeDefinition = Object.freeze({
    stopImmediatePropagation: Object.freeze({
        value: function stopImmediatePropagation() {
            this[STOP_IMMEDIATE_PROPAGATION_FLAG] = true
        },
        writable: true,
        configurable: true,
    }),

    preventDefault: Object.freeze({
        value: function preventDefault() {
            if (this[PASSIVE_LISTENER_FLAG]) {
                return
            }
            if (this.cancelable === true) {
                this[CANCELED_FLAG] = true
            }
        },
        writable: true,
        configurable: true,
    }),

    defaultPrevented: Object.freeze({
        get: function defaultPrevented() {
            return this[CANCELED_FLAG]
        },
        enumerable: true,
        configurable: true,
    }),
})

//-----------------------------------------------------------------------------
// Public Interface
//-----------------------------------------------------------------------------

module.exports.STOP_IMMEDIATE_PROPAGATION_FLAG = STOP_IMMEDIATE_PROPAGATION_FLAG
module.exports.PASSIVE_LISTENER_FLAG = PASSIVE_LISTENER_FLAG

/**
 * Creates an event wrapper.
 *
 * We cannot modify several properties of `Event` object, so we need to create the wrapper.
 * Plus, this wrapper supports non `Event` objects.
 *
 * @param {Event|{type: string}} event - An original event to create the wrapper.
 * @param {EventTarget} eventTarget - The event target of the event.
 * @returns {Event} The created wrapper. This object is implemented `Event` interface.
 * @private
 */
module.exports.createEventWrapper = function createEventWrapper(event, eventTarget) {
    var timeStamp = (
        typeof event.timeStamp === "number" ? event.timeStamp : Date.now()
    )
    var propertyDefinition = {
        target: {value: eventTarget, enumerable: true},
        currentTarget: {value: eventTarget, enumerable: true},
        eventPhase: {value: 2, enumerable: true},
        bubbles: {value: Boolean(event.bubbles), enumerable: true},
        cancelable: {value: Boolean(event.cancelable), enumerable: true},
        timeStamp: {value: timeStamp, enumerable: true},
    }
    propertyDefinition[STOP_IMMEDIATE_PROPAGATION_FLAG] = {value: false, writable: true}
    propertyDefinition[CANCELED_FLAG] = {value: false, writable: true}
    propertyDefinition[PASSIVE_LISTENER_FLAG] = {value: false, writable: true}
    propertyDefinition[ORIGINAL_EVENT] = {value: event}

    // For CustomEvent.
    if (typeof event.detail !== "undefined") {
        propertyDefinition.detail = {value: event.detail, enumerable: true}
    }

    Object.defineProperties(event, Object.assign({}, propertyDefinition, wrapperPrototypeDefinition))

    return event
}
