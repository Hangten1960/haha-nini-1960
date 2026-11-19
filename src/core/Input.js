// Unified input: keyboard for desktop, on-screen pads for touch (multi-touch safe).
export class Input {
  constructor() {
    this.keys = new Set(); this.pads = { left: false, right: false, jump: false };
    this._jumpEdge = false; this._switchEdge = false; this._pauseEdge = false; this._any = false; this.touchUsed = false;
    addEventListener('keydown', (e) => this._key(e, true)); addEventListener('keyup', (e) => this._key(e, false));
    addEventListener('blur', () => { this.keys.clear(); this.pads.left = this.pads.right = this.pads.jump = false; });
  }
  _key(e, down) {
    const k = e.code;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(k)) e.preventDefault();
    if (down) {
      if (e.repeat) return; this._any = true;
      if (k === 'Space' || k === 'ArrowUp' || k === 'KeyW') this._jumpEdge = true;
      if (k === 'KeyS' || k === 'ArrowDown' || k === 'ShiftLeft' || k === 'ShiftRight' || k === 'KeyX' || k === 'Tab') { this._switchEdge = true; e.preventDefault(); }
      if (k === 'KeyP' || k === 'Escape') this._pauseEdge = true;
      this.keys.add(k);
    } else this.keys.delete(k);
  }
  /** Wire an on-screen button. `name` = left | right | jump | switch */
  bindPad(el, name) {
    const set = (v, e) => { e.preventDefault(); this.touchUsed = true; el.classList.toggle('down', v);
      if (name === 'switch') { if (v) this._switchEdge = true; return; }
      if (v && name === 'jump' && !this.pads.jump) this._jumpEdge = true; if (v) this._any = true; this.pads[name] = v; };
    el.addEventListener('pointerdown', (e) => { try { el.setPointerCapture(e.pointerId); } catch {} set(true, e); });
    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) el.addEventListener(ev, (e) => set(false, e));
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  /** Read the current input once per physics step (edges are consumed). */
  read() {
    const K = this.keys, left = K.has('ArrowLeft') || K.has('KeyA') || this.pads.left, right = K.has('ArrowRight') || K.has('KeyD') || this.pads.right;
    const out = { dir: (right ? 1 : 0) - (left ? 1 : 0), jumpHeld: K.has('Space') || K.has('ArrowUp') || K.has('KeyW') || this.pads.jump, jumpPressed: this._jumpEdge };
    this._jumpEdge = false; return out;
  }
  takeSwitch() { const v = this._switchEdge; this._switchEdge = false; return v; }
  takePause() { const v = this._pauseEdge; this._pauseEdge = false; return v; }
  takeAny() { const v = this._any; this._any = false; return v; }
  clearEdges() { this._jumpEdge = this._switchEdge = this._pauseEdge = this._any = false; }
}
