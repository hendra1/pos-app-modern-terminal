/**
 * Keyboard Manager — centralized shortcut handling
 * DOS-style: F-keys, number selection, ESC to go back
 */
const Keyboard = (() => {
  let handlers = {};
  let contextStack = [];
  let active = true;

  // Initialize global keyboard listener
  document.addEventListener('keydown', (e) => {
    if (!active) return;

    // Don't capture if in input field (unless it's a function key or ESC)
    const inInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
    const isFnKey = e.key.startsWith('F') && e.key.length <= 3;
    const isEscape = e.key === 'Escape';
    const isEnter = e.key === 'Enter';

    if (inInput && !isFnKey && !isEscape) return;

    const key = e.key;
    const handler = handlers[key];

    if (handler) {
      e.preventDefault();
      e.stopPropagation();
      handler(e);
    }
  });

  function bind(keyMap) {
    handlers = { ...keyMap };
  }

  function add(key, handler) {
    handlers[key] = handler;
  }

  function remove(key) {
    delete handlers[key];
  }

  function clear() {
    handlers = {};
  }

  function push() {
    contextStack.push({ ...handlers });
  }

  function pop() {
    if (contextStack.length > 0) {
      handlers = contextStack.pop();
    }
  }

  function pause() { active = false; }
  function resume() { active = true; }

  return { bind, add, remove, clear, push, pop, pause, resume };
})();
