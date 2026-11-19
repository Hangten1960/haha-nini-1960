// TEMPORARY character visual.
//
// There is no rigged 3D model of the mascots yet, so this builds a stand-in:
//   • HEAD  – the ORIGINAL 2D mascot artwork, mapped onto a soft relief (height-field)
//             so it catches light and can turn a little. It is still a flat illustration,
//             not a full 3D head: it is designed to be seen from the front / three-quarter.
//   • BODY  – simple primitives in the artwork's fur colours, animated procedurally.
// It implements the same interface as GLBCharacterVisual, which replaces it later.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** Bakes several child meshes that always move together into ONE mesh (one draw call). */
function mergeInto(parent, meshes, mat) {
  const geos = meshes.map((o) => { o.updateMatrix(); const g = o.geometry.clone().applyMatrix4(o.matrix); for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'color') g.deleteAttribute(k); o.removeFromParent(); return g; });
  const m = new THREE.Mesh(mergeGeometries(geos), mat); parent.add(m); return m;
}
import { clamp, damp, lerp } from '../core/util.js';
import { ANIM } from './AnimationStates.js';

function reliefHead(def, assets) {
  const t = def.temp, m = t.meta, W = t.headWidth, H = W * m.h / m.w, D = 0.2 * W;
  const px = assets.pixels(def.id + '.aux');
  const samp = (u, v) => { const x = clamp(u, 0, 1) * (px.w - 1.001), y = clamp(v, 0, 1) * (px.h - 1.001), x0 = x | 0, y0 = y | 0, fx = x - x0, fy = y - y0, i = (y0 * px.w + x0) * 4, r = px.w * 4, d = px.data;
    return ((d[i] * (1 - fx) + d[i + 4] * fx) * (1 - fy) + (d[i + r] * (1 - fx) + d[i + r + 4] * fx) * fy) / 255; };
  const NX = 72, NY = Math.round(NX * m.h / m.w);
  const geo = new THREE.PlaneGeometry(W, H, NX, NY), pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) pos.setZ(i, samp(uv.getX(i), 1 - uv.getY(i)) * D);
  geo.computeVertexNormals();
  const map = assets.texture(def.id + '.head');
  const mat = new THREE.MeshStandardMaterial({ map, roughness: 0.92, metalness: 0, alphaTest: 0.5, alphaToCoverage: true,
    emissive: 0xffffff, emissiveMap: map, emissiveIntensity: 0.3 });
  const mesh = new THREE.Mesh(geo, mat); mesh.castShadow = true;
  mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map, alphaTest: 0.5 });
  // ---- eyes ----
  // The artwork's own eyes stay the design authority: each 3D eye is a glossy lens laid exactly over the painted eye
  // (same centre, same ellipse, colour sampled from the art) with the art's highlight re-created as a small bright
  // fleck, so the eyes stay crisp and lively at any distance. Blinking swaps the lens for a fur-coloured lid + lash line.
  const art = assets.pixels(def.id + '.head'), sx = art.w / m.w, sy = art.h / m.h;
  const col = (c) => new THREE.Color().setRGB(c[0] / 255, c[1] / 255, c[2] / 255, THREE.SRGBColorSpace);
  const lidMat = new THREE.MeshStandardMaterial({ color: col(m.eyes[0].lid), roughness: 1, emissive: col(m.eyes[0].lid), emissiveIntensity: 0.3 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: col(m.eyes[0].dark).multiplyScalar(0.8), roughness: 0.12, metalness: 0.0 });
  const lineMat = new THREE.MeshBasicMaterial({ color: col(m.eyes[0].dark) });
  const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const lids = [], eyes = [];
  for (const e of m.eyes) {
    const u = e.cx / m.w, v = e.cy / m.h, rx = e.rx / m.w * W, ry = e.ry / m.h * H, rz = Math.min(rx, ry) * 0.5;
    const cx = (u - 0.5) * W, cy = (0.5 - v) * H, cz = samp(u, v) * D;
    const eye = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), eyeMat); eye.position.set(cx, cy, cz - rz * 0.25); eye.scale.set(rx * 1.03, ry * 1.03, rz); mesh.add(eye);
    // find the painted highlight inside this eye (bright pixels) and rebuild it on the lens
    let n = 0, hx = 0, hy = 0, x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (let py = Math.floor((e.cy - e.ry) * sy); py <= (e.cy + e.ry) * sy; py++) for (let px2 = Math.floor((e.cx - e.rx) * sx); px2 <= (e.cx + e.rx) * sx; px2++) {
      const dx = (px2 / sx - e.cx) / e.rx, dy = (py / sy - e.cy) / e.ry; if (dx * dx + dy * dy > 0.8) continue;
      const i = (py * art.w + px2) * 4; if ((art.data[i] + art.data[i + 1] + art.data[i + 2]) / 3 > 165) { n++; hx += px2; hy += py; x0 = Math.min(x0, px2); x1 = Math.max(x1, px2); y0 = Math.min(y0, py); y1 = Math.max(y1, py); }
    }
    const glints = [];
    if (n > 3) {
      const gx = ((hx / n) / sx - e.cx) / m.w * W, gy = -((hy / n) / sy - e.cy) / m.h * H, gw = Math.max(2, x1 - x0 + 1) / sx / m.w * W * 0.5, gh = Math.max(2, y1 - y0 + 1) / sy / m.h * H * 0.5;
      const k = Math.sqrt(Math.max(0.05, 1 - (gx / (rx * 1.03)) ** 2 - (gy / (ry * 1.03)) ** 2));
      const g = new THREE.Mesh(new THREE.CircleGeometry(1, 16), glintMat); g.position.set(cx + gx, cy + gy, cz - rz * 0.25 + rz * k + 0.004); g.scale.set(gw, gh, 1); g.rotation.z = 0.5; mesh.add(g); glints.push(g);
      const g2 = new THREE.Mesh(new THREE.CircleGeometry(1, 12), glintMat); g2.position.set(cx - gx * 0.9, cy - gy * 1.1, cz - rz * 0.25 + rz * k + 0.004); g2.scale.set(gw * 0.28, gw * 0.28, 1); mesh.add(g2); glints.push(g2);   // tiny secondary sparkle
    }
    const lid = new THREE.Mesh(new THREE.CircleGeometry(1, 24), lidMat); lid.position.set(cx, cy, cz + rz * 0.2); lid.scale.set(rx * 1.2, ry * 1.2, 1); lid.visible = false; mesh.add(lid);
    const lash = new THREE.Mesh(new THREE.TorusGeometry(1, 0.13, 6, 16, Math.PI), lineMat); lash.rotation.z = Math.PI; lash.position.set(cx, cy + ry * 0.25, cz + rz * 0.2 + 0.004); lash.scale.set(rx * 0.8, ry * 0.45, 0.02); lash.visible = false; mesh.add(lash);
    eyes.push({ eye, glints, lid, lash }); lids.push(lid);
  }
  // both eyes blink together, so each part is merged across the two eyes: 2 draw calls when open, 2 when closed
  const all = (k) => eyes.flatMap((e) => (Array.isArray(e[k]) ? e[k] : [e[k]]));
  const lens = mergeInto(mesh, all('eye'), eyeMat), glint = mergeInto(mesh, all('glints'), glintMat), lid = mergeInto(mesh, all('lid'), lidMat), lash = mergeInto(mesh, all('lash'), lineMat);
  lid.visible = lash.visible = false;
  for (const e of eyes) { e.eye = lens; e.lid = lid; e.lash = lash; e.glints = e.glints.map(() => glint); }
  return { mesh, W, H, lids: [lid], eyes };
}

export class TempBearVisual {
  /** @param opts.outfit  true = winter jacket + scarf (optional accessory; the head, cap and flowers are never covered) */
  constructor(def, assets, opts = {}) {
    this.def = def; this.isTemporary = true; this.outfit = !!(opts.outfit && def.temp.winter);
    // body parts are built as separate shapes, then each rigid part (torso, each leg, each arm) is merged into a single
    // vertex-coloured mesh: 6 draw calls for the body instead of 16 (draw calls are what phones struggle with)
    const t = def.temp, tint = (hex) => { const c = new THREE.Color(hex); const m = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.95 }); m.userData.tint = c; return m; };
    const fur = tint(t.fur), light = tint(t.furLight), cream = tint(t.cream), W = this.outfit ? t.winter : null;
    const coat = W ? tint(W.jacket) : fur, coatLight = W ? tint(W.jacketLight) : light, trimM = W ? tint(W.trim) : null;
    const bodyMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 });
    const mk = (geo, mat, parent, x = 0, y = 0, z = 0) => { const c = mat.userData.tint, n = geo.attributes.position.count, a = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3); geo.setAttribute('color', new THREE.BufferAttribute(a, 3));
      const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); o.castShadow = true; parent.add(o); return o; };
    const bake = (group) => { const parts = group.children.filter((o) => o.isMesh); const m = mergeInto(group, parts, bodyMat); m.castShadow = true; return m; };
    this.root = new THREE.Group();                    // origin = feet
    this.squash = new THREE.Group(); this.root.add(this.squash);
    this.body = new THREE.Group(); this.squash.add(this.body);
    this.torso = mk(new THREE.SphereGeometry(0.4, 20, 16), coat, this.body, 0, 0.64, 0); this.torso.scale.set(1, 1.1, 0.9);
    const belly = mk(new THREE.SphereGeometry(0.3, 16, 12), coatLight, this.body, 0, 0.6, 0.2); belly.scale.set(1, 1.05, 0.55);
    mk(new THREE.SphereGeometry(0.12, 10, 8), W ? fur : light, this.body, 0, 0.46, -0.36);
    if (W) {   // winter jacket details + scarf, merged into the same single body mesh
      const hem = mk(new THREE.TorusGeometry(0.36, 0.06, 8, 24), trimM, this.body, 0, 0.3, 0); hem.rotation.x = Math.PI / 2; hem.scale.set(1, 0.9, 1);
      const zip = mk(new THREE.BoxGeometry(0.035, 0.62, 0.03), tint(W.zip), this.body, 0, 0.66, 0.357); zip.rotation.x = -0.12;
      for (const sx of [-1, 1]) { const pk = mk(new THREE.BoxGeometry(0.16, 0.1, 0.03), tint(W.zip), this.body, sx * 0.17, 0.5, 0.33); pk.rotation.y = sx * 0.4; }
      const scarf = mk(new THREE.TorusGeometry(0.27, 0.095, 10, 28), tint(W.scarf), this.body, 0, 0.99, 0.01); scarf.rotation.x = Math.PI / 2; scarf.scale.set(1, 0.9, 1);
      const stripe = mk(new THREE.TorusGeometry(0.27, 0.1, 10, 28, Math.PI * 2), tint(W.scarfStripe), this.body, 0, 0.99, 0.01); stripe.rotation.x = Math.PI / 2; stripe.scale.set(1.0, 0.9, 0.35);
      const tail = mk(new THREE.BoxGeometry(0.15, 0.42, 0.06), tint(W.scarf), this.body, 0.15, 0.78, 0.3); tail.rotation.set(-0.25, 0, 0.12);
      const fringe = mk(new THREE.BoxGeometry(0.16, 0.06, 0.065), tint(W.scarfStripe), this.body, 0.175, 0.6, 0.345); fringe.rotation.set(-0.25, 0, 0.12);
    }
    bake(this.body);
    this.legs = [-1, 1].map((s) => { const g = new THREE.Group(); g.position.set(s * 0.19, 0.38, 0); this.body.add(g);
      mk(new THREE.CapsuleGeometry(0.14, 0.14, 4, 10), fur, g, 0, -0.14, 0);
      const foot = mk(new THREE.SphereGeometry(0.17, 12, 10), fur, g, 0, -0.29, 0.07); foot.scale.set(1, 0.62, 1.35);
      const pad = mk(new THREE.SphereGeometry(0.1, 10, 8), cream, g, 0, -0.335, 0.09); pad.scale.set(1, 0.3, 1.3); bake(g); return g; });
    this.arms = [-1, 1].map((s) => { const g = new THREE.Group(); g.position.set(s * 0.37, 0.9, 0); this.body.add(g);
      mk(new THREE.CapsuleGeometry(W ? 0.13 : 0.115, 0.26, 4, 10), coat, g, 0, -0.2, 0);
      if (W) { const cuff = mk(new THREE.TorusGeometry(0.12, 0.045, 6, 16), trimM, g, 0, -0.34, 0); cuff.rotation.x = Math.PI / 2; }
      mk(new THREE.SphereGeometry(0.14, 12, 10), fur, g, 0, -0.42, 0);
      const pad = mk(new THREE.SphereGeometry(0.075, 8, 6), cream, g, 0, -0.44, 0.09); pad.scale.set(1, 1, 0.5); g.userData.side = s; bake(g); return g; });
    // head
    this.head = new THREE.Group(); this.head.position.set(0, 1.0, 0.02); this.squash.add(this.head);
    const r = reliefHead(def, assets); this.lids = r.lids; this.eyes = r.eyes; this.headH = r.H;
    r.mesh.position.set(0, r.H * 0.44, 0.06); this.head.add(r.mesh);
    // back-of-head filler: must stay entirely BEHIND the face relief (it used to poke through and hide the eyes)
    const back = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshStandardMaterial({ color: t.fur, roughness: 0.95 })); back.castShadow = true; this.head.add(back);
    back.position.set(0, r.H * 0.40, -r.W * 0.2); back.scale.set(r.W * 0.40, r.H * 0.39, r.W * 0.2); this.back = back;
    this.height = 1.0 + r.H * 0.95;
    // animation memory
    this.phase = 0; this.t = Math.random() * 10; this.yaw = 0.3; this.headYaw = 0; this.land = 0; this.blinkT = 2 + Math.random() * 3; this.pop = 0;
    this.j = { lL: 0, lR: 0, aLx: 0, aRx: 0, aLz: 0.25, aRz: 0.25, lean: 0, headTilt: 0, headNod: 0, hop: 0, sy: 1 };
  }
  /** Quick scale pop (used when swapping characters). */
  popIn() { this.pop = 1; }
  /**
   * @param {number} dt
   * @param {{anim:string, vx:number, vy:number, facing:number, speedRef:number, gliding?:boolean, landImpact?:number}} s
   */
  update(dt, s) {
    this.t += dt; const j = this.j, T = this.t, a = s.anim;
    const moving = a === ANIM.WALK || a === ANIM.RUN, run = a === ANIM.RUN;
    this.phase += Math.abs(s.vx) * dt * (run ? 1.55 : 2.2);          // steps follow distance travelled → no foot sliding
    const sw = Math.sin(this.phase);
    let lL = 0, lR = 0, aLx = 0, aRx = 0, aLz = 0.22, aRz = 0.22, lean = 0, tilt = 0, nod = 0, hop = 0, sy = 1, yawT = s.facing * 0.28, headYawT = s.facing * 0.1;
    if (moving) { const A = run ? 0.95 : 0.6; lL = sw * A; lR = -sw * A; aLx = -sw * A * 0.8; aRx = sw * A * 0.8; lean = run ? 0.16 : 0.07;
      hop = Math.abs(Math.cos(this.phase)) * (run ? 0.09 : 0.045); yawT = s.facing * (run ? 0.95 : 0.8); headYawT = s.facing * 0.34; tilt = sw * 0.04; }
    else if (a === ANIM.JUMP) { lL = -0.5; lR = 0.35; aLx = -2.5; aRx = -2.5; aLz = 0.35; aRz = 0.35; sy = 1.07; yawT = s.facing * 0.8; headYawT = s.facing * 0.3; nod = -0.12; lean = 0.08; }
    else if (a === ANIM.FALL) { const fl = Math.sin(T * 16) * 0.12; lL = 0.25 + fl; lR = -0.2 - fl; aLx = 0; aRx = 0; aLz = s.gliding ? 1.45 : 1.9 + fl; aRz = s.gliding ? 1.45 : 1.9 - fl; yawT = s.facing * 0.7; headYawT = s.facing * 0.28; nod = 0.1;
      if (s.gliding) { tilt = Math.sin(T * 5) * 0.09; lL = 0.15; lR = -0.1; } }
    else if (a === ANIM.LAND) { sy = 0.86; lL = -0.3; lR = -0.3; aLz = 0.8; aRz = 0.8; nod = 0.1; yawT = s.facing * 0.6; }
    else if (a === ANIM.CELEBRATE) { const b = Math.abs(Math.sin(T * 5.2)); hop = b * 0.55; aLx = -2.7 + Math.sin(T * 10.4) * 0.25; aRx = -2.7 - Math.sin(T * 10.4) * 0.25; aLz = 0.5; aRz = 0.5; lL = -b * 0.4; lR = -b * 0.4; tilt = Math.sin(T * 5.2) * 0.12; yawT = Math.sin(T * 1.3) * 0.25; headYawT = 0; sy = 1 + b * 0.05; }
    else if (a === ANIM.WAVE) { aRx = 0; aRz = 2.45 + Math.sin(T * 9) * 0.38; tilt = 0.09 + Math.sin(T * 4.5) * 0.03; yawT = 0.12; headYawT = 0; }
    else { aLx = Math.sin(T * 1.6) * 0.06; aRx = -aLx; tilt = Math.sin(T * 0.9) * 0.035; nod = Math.sin(T * 1.3) * 0.03; sy = 1 + Math.sin(T * 2.1) * 0.012; }
    if (s.landImpact) this.land = Math.min(1, s.landImpact / 14);
    this.land = Math.max(0, this.land - dt * 4.5); sy *= 1 - this.land * 0.2;
    const k = 16;
    j.lL = damp(j.lL, lL, k, dt); j.lR = damp(j.lR, lR, k, dt); j.aLx = damp(j.aLx, aLx, k, dt); j.aRx = damp(j.aRx, aRx, k, dt);
    j.aLz = damp(j.aLz, aLz, k, dt); j.aRz = damp(j.aRz, aRz, k, dt); j.lean = damp(j.lean, lean, 10, dt); j.headTilt = damp(j.headTilt, tilt, 12, dt);
    j.headNod = damp(j.headNod, nod, 12, dt); j.hop = damp(j.hop, hop, 24, dt); j.sy = damp(j.sy, sy, 22, dt);
    this.yaw = damp(this.yaw, yawT, 12, dt); this.headYaw = damp(this.headYaw, headYawT, 10, dt);
    this.legs[0].rotation.x = j.lL; this.legs[1].rotation.x = j.lR;
    this.arms[0].rotation.set(j.aLx, 0, -j.aLz); this.arms[1].rotation.set(j.aRx, 0, j.aRz);
    this.body.rotation.y = this.yaw; this.body.rotation.x = j.lean * 0.6;
    this.head.rotation.set(j.headNod, this.headYaw, j.headTilt + j.lean * -0.2 * Math.sign(this.yaw || 1));
    this.squash.position.y = j.hop;
    this.pop = Math.max(0, this.pop - dt * 4); const pp = 1 - 0.35 * this.pop * this.pop;
    this.squash.scale.set((1 + (1 - j.sy) * 0.6) * pp, j.sy * pp, (1 + (1 - j.sy) * 0.6) * pp);
    // blink
    this.blinkT -= dt; if (this.blinkT < -0.13) this.blinkT = 2.2 + Math.random() * 3.5;
    const closed = this.blinkT < 0;                       // eyes are only ever hidden for the ~0.13 s of a blink
    this.eyesClosed = closed;
    for (const e of this.eyes) { e.lid.visible = e.lash.visible = closed; e.eye.visible = !closed; for (const g of e.glints) g.visible = !closed; }
  }
  dispose() { this.root.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); }
}
