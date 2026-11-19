export class Input {
  constructor(canvas) {
    this.keys = {};
    this.mouseDX = 0; this.mouseDY = 0;
    this.mouseDown = false;
    this.clicked = false;
    this.pressed = {};
    this.canvas = canvas;
    this.dragging = false;
    this.lastX = 0; this.lastY = 0;

    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      this.keys[e.code] = true;
      this.pressed[e.code] = true;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
    window.addEventListener('blur', () => { this.keys = {}; });

    canvas.addEventListener('mousedown', (e) => {
      this.mouseDown = true; this.dragging = true;
      this.lastX = e.clientX; this.lastY = e.clientY;
      if (e.button === 0) this.clicked = true;
      try { canvas.requestPointerLock?.(); } catch {  }
    });
    window.addEventListener('mouseup', () => { this.mouseDown = false; this.dragging = false; });
    window.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement === canvas) {
        this.mouseDX += e.movementX; this.mouseDY += e.movementY;
      } else if (this.dragging) {
        this.mouseDX += e.clientX - this.lastX; this.mouseDY += e.clientY - this.lastY;
        this.lastX = e.clientX; this.lastY = e.clientY;
      }
    });
  }

  down(code) { return !!this.keys[code]; }
  hit(code) { return !!this.pressed[code]; }
  moveVector() {
    let x = 0, z = 0;
    if (this.down('KeyW') || this.down('ArrowUp')) z -= 1;
    if (this.down('KeyS') || this.down('ArrowDown')) z += 1;
    if (this.down('KeyA') || this.down('ArrowLeft')) x -= 1;
    if (this.down('KeyD') || this.down('ArrowRight')) x += 1;
    return { x, z };
  }
  consumeMouse() { const d = { dx: this.mouseDX, dy: this.mouseDY }; this.mouseDX = 0; this.mouseDY = 0; return d; }
  consumeClick() { const c = this.clicked; this.clicked = false; return c; }
  endFrame() { this.pressed = {}; }
}
