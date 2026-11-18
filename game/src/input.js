// Star Shepherd — input: keyboard, mouse and touch, in one place.
// Exposes a plain state object the game loop reads each frame.

export function createInput(canvas) {
  const input = {
    up: false,
    down: false,
    left: false,
    right: false,
    pointerX: 640,
    pointerY: 360,
    pointerActive: false,
    pointerDown: false,
    barkPressed: false, // edge-triggered: consumed by the loop
    anyKeyPressed: false,
    enterPressed: false,
    pausePressed: false,
    mutePressed: false,
    touchMode: false,
  };

  const keyMap = {
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
  };

  function onKeyDown(e) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
    const dir = keyMap[e.code];
    if (dir) input[dir] = true;
    if (e.code === 'Space') {
      if (!e.repeat) input.barkPressed = true;
      input.anyKeyPressed = true;
    }
    if (e.code === 'Enter') {
      if (!e.repeat) input.enterPressed = true;
      input.anyKeyPressed = true;
    }
    if (e.code === 'KeyP' && !e.repeat) input.pausePressed = true;
    if (e.code === 'KeyM' && !e.repeat) input.mutePressed = true;
    if (!e.repeat) input.anyKeyPressed = true;
  }

  function onKeyUp(e) {
    const dir = keyMap[e.code];
    if (dir) input[dir] = false;
  }

  function pointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function onPointerMove(e) {
    const p = pointerPos(e);
    input.pointerX = p.x;
    input.pointerY = p.y;
    input.pointerActive = true;
  }

  function onPointerDown(e) {
    input.touchMode = e.pointerType === 'touch';
    const p = pointerPos(e);
    input.pointerX = p.x;
    input.pointerY = p.y;
    input.pointerActive = true;
    input.pointerDown = true;
    input.barkPressed = true;
    input.anyKeyPressed = true;
  }

  function onPointerUp() {
    input.pointerDown = false;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  // Losing focus (alt-tab, clicking outside) must not leave a key stuck down.
  window.addEventListener('blur', () => {
    input.up = false;
    input.down = false;
    input.left = false;
    input.right = false;
    input.pointerDown = false;
  });
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  // Edge-triggered flags are cleared by the loop after each frame.
  input.consumeEdges = function consumeEdges() {
    input.barkPressed = false;
    input.enterPressed = false;
    input.pausePressed = false;
    input.mutePressed = false;
    input.anyKeyPressed = false;
  };

  return input;
}
