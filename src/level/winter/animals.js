// Friendly arctic animals – pure scenery: they never collide with or block the player.
import * as THREE from 'three';

const sphere = (r, mat, parent, x, y, z, sx = 1, sy = 1, sz = 1) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.castShadow = true; parent.add(m); return m; };
const P = {};
function mats() {
  if (P.black) return P;
  P.black = new THREE.MeshStandardMaterial({ color: '#1f2633', roughness: 0.45 }); P.white = new THREE.MeshStandardMaterial({ color: '#f7f8fb', roughness: 0.5 });
  P.orange = new THREE.MeshStandardMaterial({ color: '#f59a2e', roughness: 0.5 }); P.eye = new THREE.MeshBasicMaterial({ color: '#0d1220' }); P.glint = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  P.cheek = new THREE.MeshStandardMaterial({ color: '#ffb3c1', roughness: 0.6 });
  P.seal = new THREE.MeshStandardMaterial({ color: '#9aa8b8', roughness: 0.55 }); P.sealLight = new THREE.MeshStandardMaterial({ color: '#d5dde6', roughness: 0.6 });
  P.floe = new THREE.MeshStandardMaterial({ color: '#eef8ff', roughness: 0.4, emissive: '#7fc8e8', emissiveIntensity: 0.12 });
  return P;
}
function eyes(parent, y, z, spread, r) { for (const s of [-1, 1]) { sphere(r, P.eye, parent, s * spread, y, z); sphere(r * 0.35, P.glint, parent, s * spread + r * 0.3, y + r * 0.35, z + r * 0.75); } }

/** Penguin that waddles back and forth along x (range) at depth z. */
export function makePenguin() {
  mats(); const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  sphere(0.42, P.black, body, 0, 0.62, 0, 1, 1.35, 0.95);
  sphere(0.36, P.white, body, 0, 0.56, 0.12, 0.92, 1.25, 0.8);
  const head = new THREE.Group(); head.position.y = 1.18; body.add(head);
  sphere(0.3, P.black, head, 0, 0, 0);
  sphere(0.22, P.white, head, 0, -0.04, 0.12, 1.05, 0.9, 0.8);
  eyes(head, 0.06, 0.26, 0.1, 0.045);
  sphere(0.045, P.cheek, head, -0.16, -0.06, 0.2); sphere(0.045, P.cheek, head, 0.16, -0.06, 0.2);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.18, 8), P.orange); beak.rotation.x = Math.PI / 2; beak.position.set(0, -0.04, 0.33); head.add(beak);
  const flips = [-1, 1].map((s) => { const f = new THREE.Group(); f.position.set(s * 0.4, 0.8, 0); body.add(f); sphere(0.12, P.black, f, s * 0.04, -0.22, 0, 0.45, 1.6, 0.8); return f; });
  const feet = [-1, 1].map((s) => sphere(0.1, P.orange, g, s * 0.14, 0.04, 0.12, 1, 0.4, 1.6));
  g.userData = { body, head, flips, feet, t: Math.random() * 10 };
  return g;
}
/** @param mode 'walk' | 'cheer' */
export function updatePenguin(g, def, T, dt, mode = 'walk') {
  const u = g.userData; u.t += dt; const t = u.t;
  if (mode === 'cheer') {
    const hop = Math.abs(Math.sin(t * 6)); g.position.y = def.y + hop * 0.35; g.rotation.y = Math.sin(t * 1.5) * 0.4;
    u.flips[0].rotation.z = -0.6 - Math.abs(Math.sin(t * 12)) * 0.9; u.flips[1].rotation.z = 0.6 + Math.abs(Math.sin(t * 12)) * 0.9; u.body.rotation.z = 0; u.head.rotation.x = -0.25; return;
  }
  // walk to one end, pause and look around, walk back
  const cycle = 7 + def.range, ph = (t % cycle) / cycle, walkPart = 0.36;
  let x, dir = 0;
  if (ph < walkPart) { x = -def.range + 2 * def.range * (ph / walkPart); dir = 1; }
  else if (ph < 0.5) x = def.range;
  else if (ph < 0.5 + walkPart) { x = def.range - 2 * def.range * ((ph - 0.5) / walkPart); dir = -1; }
  else x = -def.range;
  g.position.x = def.x + x; g.position.y = def.y;
  const walking = dir !== 0, w = Math.sin(t * 9);
  g.rotation.y += ((walking ? dir * 0.95 : Math.sin(t * 0.8) * 0.45) - g.rotation.y) * Math.min(1, dt * 6);   // 3/4 view: faces stay visible
  u.body.rotation.z = walking ? w * 0.16 : Math.sin(t * 1.3) * 0.03;                  // waddle
  u.feet[0].position.y = 0.04 + (walking ? Math.max(0, w) * 0.06 : 0); u.feet[1].position.y = 0.04 + (walking ? Math.max(0, -w) * 0.06 : 0);
  u.flips[0].rotation.z = -0.25 - (walking ? Math.abs(w) * 0.25 : 0); u.flips[1].rotation.z = 0.25 + (walking ? Math.abs(w) * 0.25 : 0);
  u.head.rotation.y = walking ? 0 : Math.sin(t * 1.7) * 0.6; u.head.rotation.x = walking ? 0 : Math.sin(t * 0.9) * 0.12;
}

/** Seal resting on a small ice floe in the water. */
export function makeSeal() {
  mats(); const g = new THREE.Group();
  const floe = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.7, 0.45, 9), P.floe); floe.position.y = -0.1; floe.receiveShadow = true; g.add(floe);
  const body = new THREE.Group(); body.position.y = 0.12; g.add(body);
  sphere(0.5, P.seal, body, 0, 0.32, 0, 1.6, 0.75, 0.85);
  sphere(0.36, P.sealLight, body, 0.05, 0.22, 0.12, 1.4, 0.55, 0.75);
  const tail = new THREE.Group(); tail.position.set(-0.85, 0.22, 0); body.add(tail);
  sphere(0.12, P.seal, tail, -0.1, 0, 0.1, 1.4, 0.4, 0.9); sphere(0.12, P.seal, tail, -0.1, 0, -0.1, 1.4, 0.4, 0.9);
  const head = new THREE.Group(); head.position.set(0.72, 0.62, 0); body.add(head);
  sphere(0.3, P.seal, head, 0, 0, 0, 1.05, 0.95, 1);
  sphere(0.13, P.sealLight, head, 0.12, -0.08, 0.2, 1, 0.8, 1);
  eyes(head, 0.06, 0.25, 0.11, 0.05);
  sphere(0.035, P.eye, head, 0.12, -0.04, 0.32);
  const flips = [-1, 1].map((s) => { const f = new THREE.Group(); f.position.set(0.35, 0.12, s * 0.38); body.add(f); sphere(0.12, P.seal, f, 0.05, -0.04, s * 0.08, 1.4, 0.35, 0.8); return f; });
  g.userData = { body, head, tail, flips, t: Math.random() * 10 };
  return g;
}
export function updateSeal(g, def, T, dt, mode = 'rest') {
  const u = g.userData; u.t += dt; const t = u.t;
  g.position.y = def.y + Math.sin(t * 1.1) * 0.06; g.rotation.z = Math.sin(t * 0.9) * 0.03;      // floe bobbing
  if (mode === 'cheer') { u.head.rotation.z = 0.5 + Math.sin(t * 8) * 0.1; u.flips.forEach((f, i) => { f.rotation.y = (i ? -1 : 1) * (0.5 + Math.abs(Math.sin(t * 10)) * 0.8); }); u.tail.rotation.z = Math.sin(t * 8) * 0.3; return; }
  const look = Math.sin(t * 0.35);                                                            // now and then lifts and turns its head
  u.head.rotation.z = Math.max(0, look) * 0.45; u.head.rotation.y = Math.sin(t * 0.6) * 0.5 * Math.max(0, look);
  const flap = Math.max(0, Math.sin(t * 0.5 + 1)) ** 4; u.flips.forEach((f, i) => { f.rotation.y = (i ? -1 : 1) * flap * 0.7 * Math.abs(Math.sin(t * 9)); });
  u.tail.rotation.z = Math.sin(t * 2.2) * 0.15;
}
