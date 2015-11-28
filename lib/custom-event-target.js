/**
 * @author Toru Nagashima
 * @copyright 2015 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */

"use strict";

//-----------------------------------------------------------------------------
// Requirements
//-----------------------------------------------------------------------------

var Commons = require("./commons");
var LISTENERS = Commons.LISTENERS;
var newNode = Commons.newNode;

//-----------------------------------------------------------------------------
// Constants
//-----------------------------------------------------------------------------

/**
 * A value of kind for listeners which are registered as an attribute.
 *
 * @type {number}
 * @private
 */
var ATTRIBUTE = 3;

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

function getAttributeListener(eventTarget, type) {
    var node = eventTarget[LISTENERS][type];
    while (node != null) {
        if (node.kind === ATTRIBUTE) {
            return node.listener;
        }
        node = node.next;
    }
    return null;
}

function setAttributeListener(eventTarget, type, listener) {
    if (listener != null && typeof listener !== "function") {
        throw new TypeError("listener should be a function.");
    }

    var prev = null;
    var node = eventTarget[LISTENERS][type];
    while (node != null) {
        if (node.kind === ATTRIBUTE) {
            // Remove old value.
            if (prev == null) {
                eventTarget[LISTENERS][type] = node.next;
            }
            else {
                prev.next = node.next;
            }
        }
        else {
            prev = node;
        }

        node = node.next;
    }

    // Add new value.
    if (listener != null) {
        if (prev == null) {
            eventTarget[LISTENERS][type] = newNode(listener, ATTRIBUTE);
        }
        else {
            prev.next = newNode(listener, ATTRIBUTE);
        }
    }
}

//-----------------------------------------------------------------------------
// Public Interface
//-----------------------------------------------------------------------------

exports.defineCustomEventTarget = function(EventTargetBase, types) {
    function EventTarget() {
        EventTargetBase.call(this);
    }

    var descripter = {
        constructor: {
            value: EventTarget,
            configurable: true,
            writable: true
        }
    };

    types.forEach(function(type) {
        descripter["on" + type] = {
            get: function() { return getAttributeListener(this, type); },
            set: function(listener) { setAttributeListener(this, type, listener); },
            configurable: true,
            enumerable: true
        };
    });

    EventTarget.prototype = Object.create(EventTargetBase.prototype, descripter);

    return EventTarget;
};
