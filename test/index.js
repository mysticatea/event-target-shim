import "babel/polyfill";
import assert from "power-assert";
import spy from "spy";

// Test Target.
import EventTarget from "../lib/EventTarget";


const HAS_EVENT_TARGET_INTERFACE =
  (typeof window !== "undefined" && typeof window.EventTarget !== "undefined");
const IS_CHROME =
  (typeof navigator !== "undefined" && /Chrome/.test(navigator.userAgent));

// A helper to create an event.
function createEvent(type, bubbles = false, cancelable = false, detail = null) {
  let event = document.createEvent("Event");
  event.initEvent(type, bubbles, cancelable);
  event.detail = detail;
  return event;
}

describe("EventTarget:", () => {
  // Use extended class to test.
  class TestTarget extends EventTarget {}

  // A test target.
  let target;

  // Initialize a test target.
  beforeEach(() => {
    target = new TestTarget();
  });
  afterEach(() => {
    target = null;
  });

  //
  // Let's test!
  //

  (HAS_EVENT_TARGET_INTERFACE ? it : xit)("should be instanceof `window.EventTarget`.", () => {
    assert(target instanceof window.EventTarget);
  });

  (HAS_EVENT_TARGET_INTERFACE ? it : xit)("should not equal `EventTarget` and `window.EventTarget`.", () => {
    assert(EventTarget !== window.EventTarget);
  });

  it("should call registered listeners on called `dispatchEvent()`.", () => {
    let lastEvent = null;
    let listener = spy(e => { lastEvent = e; });
    let listener2 = spy();
    let event = createEvent("test", false, false, "detail");
    target.addEventListener("test", listener);
    target.addEventListener("test", listener2);
    target.dispatchEvent(event);

    assert(listener.callCount === 1);
    assert(listener2.callCount === 1);
    assert(lastEvent.type === "test");
    assert(lastEvent.target === target);
    assert(lastEvent.currentTarget === target);
    assert(lastEvent.eventPhase === 2);
    assert(lastEvent.bubbles === false);
    assert(lastEvent.cancelable === false);
    assert(lastEvent.defaultPrevented === false);
    assert(lastEvent.isTrusted === false);
    assert(lastEvent.timeStamp === event.timeStamp);
    assert(lastEvent.detail === "detail");
  });

  it("should not call removed listeners.", () => {
    let listener = spy();
    let event = createEvent("test");
    target.addEventListener("test", listener);
    target.removeEventListener("test", listener);
    target.dispatchEvent(event);

    assert(listener.called === false);
  });

  it("it should not allow duplicate in listeners.", () => {
    let listener = spy();
    let event = createEvent("test");
    target.addEventListener("test", listener);
    target.addEventListener("test", listener);
    target.dispatchEvent(event);

    assert(listener.callCount === 1);
  });

  it("should allow duplicate in listeners if those capture flag are different.", () => {
    let listener = spy();
    let event = createEvent("test");
    target.addEventListener("test", listener, true);
    target.addEventListener("test", listener, false);
    target.dispatchEvent(event);

    assert(listener.callCount === 2);
  });

  it("should not call registered listeners if its type is different.", () => {
    let listener = spy();
    let event = createEvent("test");
    target.addEventListener("test2", listener);
    target.dispatchEvent(event);

    assert(listener.called === false);
  });

  it("a result of `dispatchEvent()` should be true if hadn't canceled by listeners.", () => {
    let listener = spy();
    let event = createEvent("test");
    target.addEventListener("test", listener);
    let result = target.dispatchEvent(event);

    assert(result === true);
  });

  it("a result of `dispatchEvent()` should be false if had canceled by listeners.", () => {
    let listener = spy(e => e.preventDefault());
    let event = createEvent("test", false, true);
    target.addEventListener("test", listener);
    let result = target.dispatchEvent(event);

    assert(result === false);
  });

  it("should be not possible to cancel if the event cannot cancel.", () => {
    let listener = spy(e => e.preventDefault());
    let event = createEvent("test");
    target.addEventListener("test", listener);
    let result = target.dispatchEvent(event);

    assert(result === true);
  });

  it("should stop calling registered listeners immediately when called `e.stopImmediatePropagation()` by a listener.", () => {
    let listener1 = spy(e => e.stopImmediatePropagation());
    let listener2 = spy();
    let event = createEvent("test");
    target.addEventListener("test", listener1);
    target.addEventListener("test", listener2);
    let result = target.dispatchEvent(event);

    assert(listener1.callCount === 1);
    assert(listener2.called === false);
    assert(result === true);
  });

  it("should call registered listeners if a listener removed me.", () => {
    let listener1 = spy(() => target.removeEventListener(listener1));
    let listener2 = spy();
    let event = createEvent("test");
    target.addEventListener("test", listener1);
    target.addEventListener("test", listener2);
    let result = target.dispatchEvent(event);

    assert(listener1.callCount === 1);
    assert(listener2.callCount === 1);
    assert(result === true);
  });

  it("should be possible to call `dispatchEvent()` with a plain object.", () => {
    let lastEvent = null;
    let listener = spy(e => { lastEvent = e; });
    let event = {type: "test", detail: "detail"};
    target.addEventListener("test", listener);
    target.dispatchEvent(event);

    assert(listener.callCount === 1);
    assert(lastEvent.type === "test");
    assert(lastEvent.target === target);
    assert(lastEvent.currentTarget === target);
    assert(lastEvent.eventPhase === 2);
    assert(lastEvent.bubbles === false);
    assert(lastEvent.cancelable === false);
    assert(lastEvent.defaultPrevented === false);
    assert(lastEvent.isTrusted === false);
    assert(typeof lastEvent.timeStamp === "number");
    assert(lastEvent.detail === "detail");
  });

});

describe("EventTarget with attribute listeners:", () => {
  // Use extended class to test.
  class TestTarget extends EventTarget("test") {}

  // A test target.
  let target;

  // Initialize a test target.
  beforeEach(() => {
    target = new TestTarget();
  });
  afterEach(() => {
    target = null;
  });

  //
  // Let's test!
  //

  it("should properties of attribute listener are null by default.", () => {
    assert(target.ontest === null);
  });

  // V8 has a bug.
  // See Also: https://code.google.com/p/v8/issues/detail?id=705
  (IS_CHROME ? xit : it)("should properties of attribute listener are enumerable.", () => {
    let keys = [];
    for (let key in target) {
      keys.push(key);
    }

    assert.deepEqual(keys, ["ontest"]);
  });

  it("should call attribute listeners when called `dispatchEvent()`.", () => {
    let listener = spy();
    let event = createEvent("test");
    target.ontest = listener;
    target.dispatchEvent(event);

    assert(target.ontest === listener);
    assert(listener.callCount === 1);
  });

  it("should not call removed listeners.", () => {
    let listener = spy();
    let event = createEvent("test");
    target.ontest = listener;
    target.ontest = null;
    target.dispatchEvent(event);

    assert(target.ontest === null);
    assert(listener.called === false);
  });

  it("it should not allow duplicate in listeners.", () => {
    let listener = spy();
    let event = createEvent("test");
    target.ontest = listener;
    target.ontest = listener;
    target.dispatchEvent(event);

    assert(target.ontest === listener);
    assert(listener.callCount === 1);
  });
});
