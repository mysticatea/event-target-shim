export const symbol = (typeof Symbol !== "undefined" ?
  Symbol :
  function Symbol(name) {
    return `[[${name}_${Math.random().toFixed(8).slice(2)}]]`;
  });

export const LISTENERS = symbol("listeners");
export const CAPTURE = 1;
export const BUBBLE = 2;
export const ATTRIBUTE = 3;

// Create a LinkedList structure for EventListener.
export function newNode(listener, kind) {
  return {listener, kind, next: null};
}
