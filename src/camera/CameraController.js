// Cinematic side-scrolling camera: smooth follow with look-ahead, a gentle dolly when
// running, plus menu / intro / finish shots.
import * as THREE from 'three';
import { clamp, damp, lerp, smooth } from '../core/util.js';

const BASE_FOV = 36, BASE_ASPECT = 16 / 9;
export class CameraController {
  constructor(camera) {
    this.camera = camera; this.mode = 'menu'; this.t = 0;
    this.focus = new THREE.Vector3(4.2, 1.3, 0); this.pos = new THREE.Vector3(4.4, 1.9, 8.6);
    this.look = 0; this.dist = 13.6; this.introT = 0; this.introDur = 4.2; this.finishT = 0;
    this._v = new THREE.Vector3(); this.resize(BASE_ASPECT);
  }
  resize(aspect) {   // keep the horizontal field of view on narrow screens
    const c = this.camera; c.aspect = aspect;
    const h = 2 * Math.atan(Math.tan((BASE_FOV * Math.PI) / 360) * BASE_ASPECT);
    c.fov = aspect >= BASE_ASPECT ? BASE_FOV : clamp((2 * Math.atan(Math.tan(h / 2) / aspect) * 180) / Math.PI, BASE_FOV, 62);
    c.updateProjectionMatrix();
  }
  setMode(mode) { this.mode = mode; if (mode === 'intro') this.introT = 0; if (mode === 'finish') this.finishT = 0; }
  snapTo(p) { this.focus.set(p.x, p.y + 1.7, 0); this.look = 0; this._apply(1); }
  _follow(p, dt, snap = false) {
    const moving = Math.abs(p.vx) > 1;
    this.look = damp(this.look, moving ? p.facing * 3.2 : p.facing * 1.2, 1.8, dt);
    this.dist = damp(this.dist, 13.2 + Math.min(1, Math.abs(p.vx) / 9) * 2.0 + clamp((p.y - 3) * 0.4, 0, 2.5), 1.6, dt);
    const tx = p.x + this.look, ty = Math.max(1.4, p.y + 1.55);
    const kx = snap ? 1e3 : 5.5, ky = snap ? 1e3 : (p.grounded ? 3.6 : Math.abs(ty - this.focus.y) > 2.6 ? 4 : 1.2);
    this.focus.x = damp(this.focus.x, tx, kx, dt); this.focus.y = damp(this.focus.y, ty, ky, dt); this.focus.z = 0;
  }
  _apply(k) {
    this.pos.set(this.focus.x - this.look * 0.22, this.focus.y + 2.0, this.dist);
    this.camera.position.lerp(this.pos, k); this._v.set(this.focus.x, this.focus.y + 0.25, 0); this.camera.lookAt(this._v);
  }
  update(dt, p) {
    this.t += dt; const c = this.camera;
    if (this.mode === 'menu') {
      const a = Math.sin(this.t * 0.25) * 0.12;
      c.position.set(7.3 + Math.sin(a) * 9.6, 2.0 + Math.sin(this.t * 0.4) * 0.08, Math.cos(a) * 9.6); c.lookAt(7.3, 1.36, 0);
    } else if (this.mode === 'intro') {
      this.introT += dt; const u = smooth(this.introT / this.introDur);
      this._follow(p, dt, true); this.dist = 13.6;
      const fx = this.focus.x, fy = this.focus.y;
      // sweep from a high, wide establishing shot down to the gameplay framing
      c.position.set(lerp(fx + 34, fx, u), lerp(fy + 15, fy + 2.0, u), lerp(46, this.dist, u));
      c.lookAt(lerp(fx + 26, fx, u), lerp(fy + 2.5, fy + 0.25, u), 0);
    } else if (this.mode === 'finish') {
      this.finishT += dt; const u = smooth(this.finishT / 2.4);
      if (this.grand) {   // final level: pull back and tilt up – the castle, its footprint emblem and the Northern Lights
        const gx = this.grand.x, gy = this.grand.y;
        c.position.lerp(this._v.set(lerp(p.x, gx - 1.5, u), gy + lerp(3, 5.2, u), lerp(this.dist, 21, u)), 1 - Math.exp(-dt * 2.2));
        c.lookAt(lerp(p.x, gx, u), gy + lerp(2, 7.5, u), lerp(0, -8, u)); return;
      }
      const fx = p.x + 1.2, fy = p.y + 1.6;
      c.position.lerp(this._v.set(fx - 3.5 + Math.sin(this.finishT * 0.35) * 2, fy + 1.2, lerp(this.dist, 9.5, u)), 1 - Math.exp(-dt * 2.5)); c.lookAt(fx + 1.4 * u, fy + 0.6 + u * 0.8, -0.8 * u);
    } else { this._follow(p, dt); this._apply(1); }
  }
}
