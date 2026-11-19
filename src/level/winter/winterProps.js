// Winter props: village houses, HANG TEN flags & signposts (official logo artwork), ice platforms, snowballs,
// footprint collectibles and the Aurora Ice Castle with the footprint emblem above its gate.
import * as THREE from 'three';
import { rng } from '../../core/util.js';

const box = (w, h, d, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m; };
const cyl = (r0, r1, h, mat, x = 0, y = 0, z = 0, seg = 12) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg), mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m; };
const M = {};
function mats(A) {
  if (M.snow) return M;
  M.snow = new THREE.MeshStandardMaterial({ color: '#f6f9ff', roughness: 0.9 });
  M.wood = new THREE.MeshStandardMaterial({ map: A.textures.wood, roughness: 0.85 });
  M.woodDark = new THREE.MeshStandardMaterial({ color: '#6e4b30', roughness: 0.9 });
  M.walls = [new THREE.MeshStandardMaterial({ color: '#b86f4c', roughness: 0.85 }), new THREE.MeshStandardMaterial({ color: '#cf9a5b', roughness: 0.85 }), new THREE.MeshStandardMaterial({ color: '#8fa9c9', roughness: 0.85 })];
  M.window = new THREE.MeshStandardMaterial({ color: '#ffd98a', emissive: '#ffb347', emissiveIntensity: 1.3 });
  M.navy = new THREE.MeshStandardMaterial({ color: '#1f2a44', roughness: 0.6 });
  M.pole = new THREE.MeshStandardMaterial({ color: '#dfe6f2', roughness: 0.4, metalness: 0.4 });
  M.ice = new THREE.MeshStandardMaterial({ color: '#bfe9fb', roughness: 0.12, metalness: 0.1, emissive: '#4fb8e6', emissiveIntensity: 0.25, transparent: true, opacity: 0.93 });
  M.iceTop = new THREE.MeshStandardMaterial({ color: '#f2fbff', roughness: 0.35 });
  M.castle = new THREE.MeshStandardMaterial({ color: '#8fc4ec', roughness: 0.22, metalness: 0.15, emissive: '#3f7fd0', emissiveIntensity: 0.12 });
  M.castleGlow = new THREE.MeshStandardMaterial({ color: '#e9f6ff', emissive: '#9fd8ff', emissiveIntensity: 0.8, roughness: 0.2 });
  M.roof = new THREE.MeshStandardMaterial({ color: '#4f63c9', roughness: 0.3, emissive: '#3a3fa8', emissiveIntensity: 0.25 });
  return M;
}

// ---- brand textures (the official logo artwork is drawn onto these, never redrawn) ----
function canvasTex(A, key, w, h, draw) { if (A.textures[key]) return A.textures[key]; const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return A.fromCanvas(key, c); }
/** Draws a logo image inside a box, keeping its original proportions. */
export function drawLogo(g, img, x, y, w, h) { const s = Math.min(w / img.width, h / img.height), dw = img.width * s, dh = img.height * s; g.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh); }
const flagTex = (A) => canvasTex(A, 'w.flag', 256, 176, (g, w, h) => { g.fillStyle = '#1d4fa3'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(0, h - 14, w, 6); drawLogo(g, A.image('brand.footprint.white'), 0, 18, w, h - 36); });

/** Blue winter flag with the official white HANG TEN footprint (cloth waves in update). */
export function makeFlag(A) {
  const m = mats(A), g = new THREE.Group();
  g.add(cyl(0.06, 0.07, 4.2, m.pole, 0, 2.1, 0, 8)); const top = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), m.pole); top.position.y = 4.25; g.add(top);
  g.add(cyl(0.32, 0.4, 0.25, m.snow, 0, 0.1, 0, 12));
  const geo = new THREE.PlaneGeometry(1.7, 1.17, 10, 4); geo.translate(0.85, 0, 0);
  const cloth = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: flagTex(A), side: THREE.DoubleSide, roughness: 0.8 })); cloth.position.set(0.06, 3.5, 0); cloth.castShadow = true; g.add(cloth);
  cloth.userData.base = Float32Array.from(geo.attributes.position.array); g.userData = { cloth, phase: Math.random() * 6 };
  return g;
}
export function waveFlag(f, T) {
  const c = f.userData.cloth, p = c.geometry.attributes.position, b = c.geometry.userData.b || (c.geometry.userData.b = c.userData.base);
  for (let i = 0; i < p.count; i++) { const x = b[i * 3], y = b[i * 3 + 1]; p.setZ(i, Math.sin(x * 3.2 - T * 4 + f.userData.phase) * 0.12 * x + Math.sin(y * 2 + T * 3) * 0.02 * x); p.setY(i, y - x * 0.05); }
  p.needsUpdate = true; c.geometry.computeVertexNormals();
}

/** Snowy wooden signpost: text + small official footprint symbol (+ bear portrait for team hints). */
export function makeSignpost(A, text, char = null) {
  const m = mats(A), g = new THREE.Group();
  g.add(cyl(0.09, 0.11, 1.9, m.woodDark, 0, 0.95, 0, 8));
  const tex = canvasTex(A, 'w.sign.' + text + (char || ''), 320, 128, (c, w, h) => {
    c.fillStyle = '#b98352'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(70,40,20,.35)'; c.lineWidth = 3; for (let y = 42; y < h; y += 42) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    let x0 = 14; if (char) { const im = A.image(char + '.head'); const s = 104 / im.height; c.drawImage(im, 10, 12, im.width * s, 104); x0 = 18 + im.width * s; }
    drawLogo(c, A.image('brand.footprint.navy'), w - 64, 14, 50, 62);
    c.fillStyle = '#1f2a44'; c.font = '700 40px Fredoka, system-ui, sans-serif'; c.textBaseline = 'middle'; c.fillText(text, x0, h / 2 + 2, w - x0 - 70);
  });
  const board = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.8, 0.1), [m.woodDark, m.woodDark, m.snow, m.woodDark, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 }), m.woodDark]);
  board.position.y = 1.6; board.castShadow = true; g.add(board);
  const cap = box(2.05, 0.1, 0.18, m.snow, 0, 2.03, 0); g.add(cap); g.rotation.y = 0.15; return g;
}

/** Cosy village house with a snowy roof and warm windows. */
export function makeHouse(A, variant = 0) {
  const m = mats(A), g = new THREE.Group(), r = rng(50 + variant), W = 3.6 + variant * 0.5, D = 3.2, H = 2.6 + (variant % 2) * 0.5;
  g.add(box(W, H, D, m.walls[variant % 3], 0, H / 2, 0));
  // gable roof: a triangular prism along x with its ridge on top, covered in snow, with wooden eaves underneath
  const R = (D / 2 + 0.45) / Math.cos(Math.PI / 6), roofGeo = new THREE.CylinderGeometry(R, R, W + 0.6, 3, 1); roofGeo.rotateZ(Math.PI / 2); roofGeo.rotateX(-Math.PI / 2);
  const roof = new THREE.Mesh(roofGeo, m.snow); roof.scale.set(1, 0.62, 1); roof.position.y = H + R * 0.5 * 0.62; roof.castShadow = true; g.add(roof);
  const eaves = new THREE.Mesh(roofGeo, m.woodDark); eaves.scale.set(0.98, 0.6, 1.0); eaves.position.y = roof.position.y - 0.1; g.add(eaves);
  g.add(box(0.9, 1.6, 0.12, m.woodDark, -W * 0.18, 0.8, D / 2 + 0.02));
  for (const x of [W * 0.12, W * 0.34]) { g.add(box(0.75, 0.7, 0.1, m.window, x, H * 0.62, D / 2 + 0.03)); g.add(box(0.85, 0.1, 0.14, m.snow, x, H * 0.62 - 0.4, D / 2 + 0.06)); }
  g.add(box(0.45, 1.2, 0.45, m.walls[(variant + 1) % 3], W * 0.28, H + 1.0, -0.4)); g.add(box(0.55, 0.15, 0.55, m.snow, W * 0.28, H + 1.65, -0.4));
  return g;
}

/** Ice slab platform (floating floe / ice step / moving ice bridge). Origin = walking surface centre. */
export function makeIcePlatform(A, p) {
  const m = mats(A), g = new THREE.Group(), D = p.kind === 'icebridge' ? 3.0 : 3.4;
  if (p.kind === 'icebridge') {
    g.add(box(p.w, 0.3, D, m.ice, 0, -0.15, 0));
    for (const z of [-D / 2 + 0.15, D / 2 - 0.15]) g.add(box(p.w, 0.08, 0.12, m.castleGlow, 0, 0.02, z));
  } else {
    const geo = new THREE.CylinderGeometry(1, 1.12, 1, 8, 1); const pos = geo.attributes.position, r = rng(Math.round(p.x * 10));
    for (let i = 0; i < pos.count; i++) { const k = 1 + (r() - 0.5) * 0.14; pos.setX(i, pos.getX(i) * k); pos.setZ(i, pos.getZ(i) * k); }
    geo.computeVertexNormals();
    const body = new THREE.Mesh(geo, m.ice); body.scale.set(p.w / 2, p.kind === 'floe' ? 1.1 : 0.7, D / 2); body.position.y = p.kind === 'floe' ? -0.55 : -0.35; body.castShadow = true; body.receiveShadow = true; g.add(body);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.08, 8), m.iceTop); top.scale.set(p.w / 2 * 0.98, 1, D / 2 * 0.98); top.position.y = -0.03; top.receiveShadow = true; g.add(top);
  }
  return g;
}

/** Snowball obstacle (rolls down slopes). */
export function makeSnowball(r = 0.5) {
  const g = new THREE.Group(), m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 2), new THREE.MeshStandardMaterial({ color: '#f7faff', roughness: 0.85, flatShading: true }));
  m.castShadow = true; g.add(m); for (let i = 0; i < 5; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(r * 0.22, 6, 5), m.material); const a = i * 1.3; d.position.set(Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85, (i % 2 - 0.5) * r * 0.6); g.add(d); }
  g.userData.mesh = m; return g;
}

/** Hidden HANG TEN footprint collectible: a spinning blue badge with the official white footprint on both faces. */
export function makeFootprintBadge(A) {
  const g = new THREE.Group(), tex = canvasTex(A, 'w.badge', 256, 256, (c, w, h) => {
    const gr = c.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2); gr.addColorStop(0, '#3f7fe0'); gr.addColorStop(1, '#173f8a');
    c.fillStyle = gr; c.beginPath(); c.arc(w / 2, h / 2, w / 2 - 4, 0, 6.29); c.fill(); c.lineWidth = 10; c.strokeStyle = '#f2f7ff'; c.stroke();
    drawLogo(c, A.image('brand.footprint.white'), 48, 40, w - 96, h - 80);
  });
  const face = new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.3, metalness: 0.2, emissive: '#2a5fc0', emissiveIntensity: 0.35, side: THREE.DoubleSide });
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.62, 32), face); g.add(disc);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.045, 8, 32), new THREE.MeshStandardMaterial({ color: '#e9f2ff', metalness: 0.6, roughness: 0.25 })); g.add(rim);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: A.textures.glow, color: '#8fc2ff', transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false })); glow.scale.setScalar(2.4); g.add(glow);
  g.userData = { disc, glow }; return g;
}

/** Finish arch for levels 1–3: an ice arch with two HANG TEN flags. */
export function makeIceArch(A) {
  const m = mats(A), g = new THREE.Group();
  for (const z of [-2.1, 2.1]) { g.add(box(0.5, 3.6, 0.5, m.ice, 0, 1.8, z)); g.add(box(0.62, 0.2, 0.62, m.snow, 0, 3.7, z)); }
  const arch = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.22, 8, 24, Math.PI), m.castleGlow); arch.rotation.y = Math.PI / 2; arch.position.y = 3.6; g.add(arch);
  return g;
}

/** The Aurora Ice Castle. The official footprint emblem sits on a banner above the main gate. Origin = gate threshold. */
export function makeIceCastle(A) {
  const m = mats(A), g = new THREE.Group(), C = m.castle, R = m.roof, glow = m.castleGlow;
  const tower = (x, z, r, h) => { g.add(cyl(r, r * 1.12, h, C, x, h / 2, z, 14)); const roof = new THREE.Mesh(new THREE.ConeGeometry(r * 1.35, h * 0.55, 14), R); roof.position.set(x, h + h * 0.275, z); roof.castShadow = true; g.add(roof);
    const tip = new THREE.Mesh(new THREE.OctahedronGeometry(0.35, 0), glow); tip.position.set(x, h + h * 0.55 + 0.3, z); g.add(tip);
    for (let i = 0; i < 3; i++) { const w = box(0.35, 0.7, 0.1, glow, x, h * (0.45 + i * 0.16), z + r * 1.02); g.add(w); } };
  // back wall + keep
  g.add(box(16, 9, 3, C, 0, 4.5, -7)); tower(0, -7, 2.4, 17);
  tower(-6.5, -6.5, 1.6, 12); tower(6.5, -6.5, 1.6, 12);
  // front wall with gate
  g.add(box(4.6, 6.5, 1.6, C, -4.6, 3.25, -1.2)); g.add(box(4.6, 6.5, 1.6, C, 4.6, 3.25, -1.2));
  g.add(box(4.6, 2.4, 1.6, C, 0, 5.3, -1.2));
  tower(-8.4, -1.2, 1.5, 9); tower(8.4, -1.2, 1.5, 9);
  for (let i = -4; i <= 4; i++) if (i !== 0) g.add(box(0.8, 0.9, 1.7, C, i * 2.05, 7.0, -1.2));
  const arch = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.28, 10, 28, Math.PI), glow); arch.position.set(0, 4.1, -0.35); g.add(arch);
  const door = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 4.1), new THREE.MeshStandardMaterial({ color: '#2b4f9e', emissive: '#4f86ff', emissiveIntensity: 0.6, roughness: 0.4 })); door.position.set(0, 2.05, -0.38); g.add(door);
  // the official HANG TEN footprint emblem, prominent above the entrance
  const emblemTex = canvasTex(A, 'w.emblem', 384, 384, (c, w, h) => {
    const gr = c.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w / 2); gr.addColorStop(0, '#2f6fd8'); gr.addColorStop(1, '#14327a');
    c.fillStyle = gr; c.beginPath(); c.arc(w / 2, h / 2, w / 2 - 6, 0, 6.29); c.fill(); c.lineWidth = 14; c.strokeStyle = '#eaf6ff'; c.stroke();
    drawLogo(c, A.image('brand.footprint.white'), 70, 58, w - 140, h - 116);
  });
  const emblem = new THREE.Mesh(new THREE.CircleGeometry(1.7, 40), new THREE.MeshStandardMaterial({ map: emblemTex, transparent: true, emissive: '#ffffff', emissiveMap: emblemTex, emissiveIntensity: 0.55, roughness: 0.3 }));
  emblem.position.set(0, 7.9, -0.32); g.add(emblem);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.78, 0.12, 8, 40), glow); ring.position.copy(emblem.position); g.add(ring);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: A.textures.glow, color: '#9fd8ff', transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); halo.scale.set(9, 9, 1); halo.position.copy(emblem.position); g.add(halo);
  g.userData = { glowMats: [C, R, glow], halo, emblem, base: { C: C.emissiveIntensity, glow: glow.emissiveIntensity } };
  return g;
}
/** Castle lights up when the stars come home (0..1). */
export function lightCastle(castle, k) { const u = castle.userData, [C, , G] = u.glowMats; C.emissiveIntensity = u.base.C + k * 0.35; G.emissiveIntensity = u.base.glow + k * 1.4; u.halo.material.opacity = 0.35 + k * 0.5; }
