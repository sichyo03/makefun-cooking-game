// Sizzle Rush — input: keyboard and mouse, both driving the same chef.
// Keys move the chef and interact; a mouse click walks the chef to a station
// and interacts on arrival, or picks up straight from a bin.

export function makeInput(canvas) {
  const input = {
    keys: new Set(),
    // The latest click: { x, y } in canvas coordinates, consumed by main.js.
    click: null,
    // One-shot action flags, set on keydown and cleared after the frame reads them.
    interactPressed: false,
    trashPressed: false,
    pausePressed: false,
    restartPressed: false,
    startPressed: false,
    mutePressed: false,
  };

  function keyName(e) {
    return e.key.toLowerCase();
  }

  window.addEventListener('keydown', (e) => {
    const k = keyName(e);
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
      e.preventDefault();
    }
    if (e.repeat) return;
    input.keys.add(k);
    if (k === 'e' || k === ' ') input.interactPressed = true;
    if (k === 'q') input.trashPressed = true;
    if (k === 'p' || k === 'escape') input.pausePressed = true;
    if (k === 'r') input.restartPressed = true;
    if (k === 'enter') input.startPressed = true;
    if (k === 'm') input.mutePressed = true;
  });

  window.addEventListener('keyup', (e) => {
    input.keys.delete(keyName(e));
  });

  window.addEventListener('blur', () => {
    input.keys.clear();
  });

  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    input.click = { x, y };
  });

  return input;
}

/** Clear the one-shot flags after the frame has read them. */
export function endFrame(input) {
  input.click = null;
  input.interactPressed = false;
  input.trashPressed = false;
  input.pausePressed = false;
  input.restartPressed = false;
  input.startPressed = false;
  input.mutePressed = false;
}
