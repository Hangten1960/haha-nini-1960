// Snowy nature: pines with snow-laden branches, snowy shrubs, snow-capped rocks, snowmen, ice-zone overlays.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { rng, noise2 } from '../../core/util.js';
import { LANE } from '../builders/terrain.js';

export const SNOW_PALETTE = { sand: new THREE.Color('#f4f7fc'), wet: new THREE.Color('#c7d8ea'), grass: new THREE.Color('#e9eff8'), grass2: new THREE.Color('#dde7f3'), rock: new THREE.Color('#8794ad'), under: new THREE.Color('#9db7cc') };
const cache = new Map();
const cached = (k, make) => { if (!cache.has(k)) { const g = make(); g.userData.shared = true; cache.set(k, g); } return cache.get(k); };
function paint(geo, fn) { const p = geo.attributes.position, c = new Float32Array(p.count * 3), t = new THREE.Color();
  for (let i = 0; i < p.count; i++) { fn(t, p.getX(i), p.getY(i), p.getZ(i)); c.set([t.r, t.g, t.b], i * 3); } geo.setAttribute('color', new THREE.BufferAttribute(c, 3)); return geo; }
const vcMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 });
const PINE_D = new THREE.Color('#1f5a48'), PINE_L = new THREE.Color('#2f7a5c'), SNOW = new THREE.Color('#f7faff'), BARK = new THREE.Color('#6b4a33');

/** Pine tree, 1 draw call: stacked tiers whose upper faces carry snow. 5 shared variants. */
export function makePine(r, scale = 1) {
  const v = Math.floor(r() * 5);
  const geo = cached('pine' + v, () => {
    const q = rng(300 + v), parts = [], tiers = 4 + (v % 2), H = 5.4 + v * 0.35;
    const trunk = new THREE.CylinderGeometry(0.16, 0.24, 1.4, 7).translate(0, 0.7, 0); parts.push(paint(trunk.toNonIndexed(), (c) => c.copy(BARK)));
    for (let i = 0; i < tiers; i++) {
      const k = i / tiers, rad = 1.9 * (1 - k * 0.72) * q.range(0.92, 1.08), h = H / tiers * 1.55, y = 1.0 + i * (H / tiers) * 0.95;
      let g = new THREE.ConeGeometry(rad, h, 9, 2, true); const p = g.attributes.position;
      for (let j = 0; j < p.count; j++) { const yy = p.getY(j); if (yy < -h / 2 + 0.01) { const a = Math.atan2(p.getZ(j), p.getX(j)); const w = 1 + 0.12 * Math.sin(a * 9 + i); p.setX(j, p.getX(j) * w); p.setZ(j, p.getZ(j) * w); p.setY(j, yy - 0.12 * Math.abs(Math.sin(a * 4.5 + i))); } }
      g = g.toNonIndexed(); g.translate(0, y + h / 2, 0); g.computeVertexNormals();
      const nrm = g.attributes.normal;
      parts.push(paint(g, (c, x, yy, z) => { c.copy(PINE_D).lerp(PINE_L, noise2(x * 2 + i, z * 2)); }));
      // snow cap: a slightly smaller, flatter cone on top of each tier
      let s = new THREE.ConeGeometry(rad * 0.86, h * 0.55, 9, 1, true); s = s.toNonIndexed(); s.translate(0, y + h * 0.78 + 0.02, 0); s.computeVertexNormals();
      parts.push(paint(s, (c, x, yy, z) => c.copy(SNOW).multiplyScalar(0.94 + 0.06 * noise2(x * 3, z * 3))));
    }
    return mergeGeometries(parts);
  });
  const m = new THREE.Mesh(geo, vcMat); m.scale.setScalar(scale); m.rotation.y = r() * 6.28; m.castShadow = true; m.receiveShadow = true; return m;
}

/** Snow-covered shrub (white mound with a few green tips). */
export function makeSnowBush(r, size = 1) {
  const v = Math.floor(r() * 4);
  const geo = cached('sbush' + v, () => {
    const q = rng(400 + v), parts = []; const n = 3 + v;
    for (let i = 0; i < n; i++) { let g = new THREE.IcosahedronGeometry(q.range(0.45, 0.8), 1); g = g.toNonIndexed();
      g.translate(q.range(-0.7, 0.7), q.range(0.15, 0.45), q.range(-0.4, 0.4)); g.computeVertexNormals();
      parts.push(paint(g, (c, x, y, z) => { const up = y > 0.35 + noise2(x * 4, z * 4) * 0.2; c.set(up ? '#f6f9ff' : '#3c7a5a'); })); }
    return mergeGeometries(parts);
  });
  const m = new THREE.Mesh(geo, rockMat); m.scale.setScalar(size); m.rotation.y = r() * 6.28; m.castShadow = true; m.receiveShadow = true; return m;
}
const rockMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, flatShading: true });
export function makeSnowRock(r, size = 1) {
  const v = Math.floor(r() * 4);
  const geo = cached('srock' + v, () => { let g = new THREE.DodecahedronGeometry(1, 0); const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) * (1.1 + v * 0.08), p.getY(i) * 0.7, p.getZ(i)); g = g.toNonIndexed(); g.computeVertexNormals();
    const n = g.attributes.normal, t = new THREE.Color(), c = new Float32Array(p.count * 3);
    for (let i = 0; i < g.attributes.position.count; i++) { t.set(n.getY(i) > 0.55 ? '#f4f8ff' : '#8a97ad'); c.set([t.r, t.g, t.b], i * 3); }
    g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return g; });
  const m = new THREE.Mesh(geo, rockMat); m.scale.setScalar(size); m.rotation.set(r() * 0.3, r() * 6.28, r() * 0.3); m.castShadow = true; m.receiveShadow = true; return m;
}
/** A cheerful snowman (pure decoration). */
export function makeSnowman(r) {
  const g = new THREE.Group(), snow = new THREE.MeshStandardMaterial({ color: '#f7faff', roughness: 0.9 }), dark = new THREE.MeshStandardMaterial({ color: '#1f2a44', roughness: 0.5 });
  const ball = (rad, y) => { const m = new THREE.Mesh(new THREE.SphereGeometry(rad, 16, 12), snow); m.position.y = y; m.castShadow = true; g.add(m); };
  ball(0.62, 0.55); ball(0.45, 1.45); ball(0.33, 2.15);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.35, 8), new THREE.MeshStandardMaterial({ color: '#f08a3c' })); nose.rotation.x = Math.PI / 2; nose.position.set(0, 2.15, 0.45); g.add(nose);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), dark); e.position.set(s * 0.12, 2.27, 0.29); g.add(e); }
  for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), dark); b.position.set(0, 1.25 + i * 0.2, 0.43 - i * 0.02); g.add(b); }
  const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.32, 14), dark); hat.position.y = 2.55; g.add(hat);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.04, 16), dark); brim.position.y = 2.4; g.add(brim);
  const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.08, 8, 18), new THREE.MeshStandardMaterial({ color: '#e8607a' })); scarf.rotation.x = Math.PI / 2; scarf.position.y = 1.88; g.add(scarf);
  g.rotation.y = r.range(-0.4, 0.4); return g;
}

/** Glossy frozen-river surface laid over each ice zone in the lane, with frost cracks. */
export function buildIceZones(scene, world, assets) {
  const tex = assets.textures.iceCracks, out = [];
  for (const [x0, x1] of world.level.ice || []) {
    const N = Math.max(2, Math.round((x1 - x0) / 0.5)), geo = new THREE.PlaneGeometry(x1 - x0, LANE * 2 + 0.6, N, 2); geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i) + (x0 + x1) / 2; p.setY(i, (world.heightAt(x) ?? 0) + 0.025); uv.setXY(i, x / 6, p.getZ(i) / 6); }
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({ color: '#cdeefa', map: tex, roughness: 0.08, metalness: 0.15, transparent: true, opacity: 0.92, emissive: '#5fb6d9', emissiveIntensity: 0.12 });
    const m = new THREE.Mesh(geo, mat); m.position.x = (x0 + x1) / 2; m.receiveShadow = true; scene.add(m); out.push(m);
  }
  return out;
}
