"use strict";
import "babel/polyfill";
import chai, {expect} from "chai";
import spies from "chai-spies";
import EventTarget from "../src/index";

chai.use(spies);

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

  it("should call registered listeners on called `dispatchEvent()`.", () => {
    let lastEvent = null;
    let listener = chai.spy(e => { lastEvent = e; });
    let listener2 = chai.spy();
    let event = createEvent("test", false, false, "detail");
    target.addEventListener("test", listener);
    target.addEventListener("test", listener2);
    target.dispatchEvent(event);

    expect(listener).to.have.been.called.once;
    expect(listener2).to.have.been.called.once;
    expect(lastEvent.type).to.equal("test");
    expect(lastEvent.target).to.equal(target);
    expect(lastEvent.currentTarget).to.equal(target);
    expect(lastEvent.eventPhase).to.equal(2);
    expect(lastEvent.bubbles).to.equal(false);
    expect(lastEvent.cancelable).to.equal(false);
    expect(lastEvent.defaultPrevented).to.equal(false);
    expect(lastEvent.isTrusted).to.equal(false);
    expect(lastEvent.timeStamp).to.equal(event.timeStamp);
    expect(lastEvent.detail).to.equal("detail");
  });

  it("should not call removed listeners.", () => {
    let listener = chai.spy();
    let event = createEvent("test");
    target.addEventListener("test", listener);
    target.removeEventListener("test", listener);
    target.dispatchEvent(event);

    expect(listener).to.not.have.been.called();
  });

  it("it should not allow duplicate in listeners.", () => {
    let listener = chai.spy();
    let event = createEvent("test");
    target.addEventListener("test", listener);
    target.addEventListener("test", listener);
    target.dispatchEvent(event);

    expect(listener).to.have.been.called.once;
  });

  it("should allow duplicate in listeners if those capture flag are different.", () => {
    let listener = chai.spy();
    let event = createEvent("test");
    target.addEventListener("test", listener, true);
    target.addEventListener("test", listener, false);
    target.dispatchEvent(event);

    expect(listener).to.have.been.called.twice;
  });

  it("should not call registered listeners if its type is different.", () => {
    let listener = chai.spy();
    let event = createEvent("test");
    target.addEventListener("test2", listener);
    target.dispatchEvent(event);

    expect(listener).to.not.have.been.called();
  });

  it("a result of `dispatchEvent()` should be true if hadn't canceled by listeners.", () => {
    let listener = chai.spy();
    let event = createEvent("test");
    target.addEventListener("test", listener);
    let result = target.dispatchEvent(event);

    expect(result).to.be.true;
  });

  it("a result of `dispatchEvent()` should be false if had canceled by listeners.", () => {
    let listener = chai.spy(e => e.preventDefault());
    let event = createEvent("test", false, true);
    target.addEventListener("test", listener);
    let result = target.dispatchEvent(event);

    expect(result).to.be.false;
  });

  it("should be not possible to cancel if the event cannot cancel.", () => {
    let listener = chai.spy(e => e.preventDefault());
    let event = createEvent("test");
    target.addEventListener("test", listener);
    let result = target.dispatchEvent(event);

    expect(result).to.be.true;
  });

  it("should stop calling registered listeners immediately when called `e.stopImmediatePropagation()` by a listener.", () => {
    let listener1 = chai.spy(e => e.stopImmediatePropagation());
    let listener2 = chai.spy();
    let event = createEvent("test");
    target.addEventListener("test", listener1);
    target.addEventListener("test", listener2);
    let result = target.dispatchEvent(event);

    expect(listener1).to.have.been.called.once;
    expect(listener2).to.not.have.been.called();
  });

  it("should call registered listeners if a listener removed me.", () => {
    let listener1 = chai.spy(e => target.removeEventListener(listener1));
    let listener2 = chai.spy();
    let event = createEvent("test");
    target.addEventListener("test", listener1);
    target.addEventListener("test", listener2);
    let result = target.dispatchEvent(event);

    expect(listener1).to.have.been.called.once;
    expect(listener2).to.have.been.called.once;
  });

  it("should be possible to call `dispatchEvent()` with a plain object.", () => {
    let lastEvent = null;
    let listener = chai.spy(e => { lastEvent = e; });
    let event = {type: "test", detail: "detail"};
    target.addEventListener("test", listener);
    target.dispatchEvent(event);

    expect(listener).to.have.been.called.once;
    expect(lastEvent.type).to.equal("test");
    expect(lastEvent.target).to.equal(target);
    expect(lastEvent.currentTarget).to.equal(target);
    expect(lastEvent.eventPhase).to.equal(2);
    expect(lastEvent.bubbles).to.equal(false);
    expect(lastEvent.cancelable).to.equal(false);
    expect(lastEvent.defaultPrevented).to.equal(false);
    expect(lastEvent.isTrusted).to.equal(false);
    expect(lastEvent.timeStamp).to.be.a("number");
    expect(lastEvent.detail).to.equal("detail");
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

  it("should call attribute listeners when called `dispatchEvent()`.", () => {
    let listener = chai.spy();
    let event = createEvent("test");
    target.ontest = listener;
    target.dispatchEvent(event);

    expect(listener).to.have.been.called.once;
  });

  it("should not call removed listeners.", () => {
    let listener = chai.spy();
    let event = createEvent("test");
    target.ontest = listener;
    target.ontest = null;
    target.dispatchEvent(event);

    expect(listener).to.not.have.been.called();
  });

  it("it should not allow duplicate in listeners.", () => {
    let listener = chai.spy();
    let event = createEvent("test");
    target.ontest = listener;
    target.ontest = listener;
    target.dispatchEvent(event);

    expect(listener).to.have.been.called.once;
  });
});
