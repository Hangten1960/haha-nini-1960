// Palms, bushes, ferns, flowers, rocks.
import * as THREE from 'three';
import { rng } from '../../core/util.js';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const tmpC = new THREE.Color();
function paint(geo, fn) {           // per-vertex colour
  const p = geo.attributes.position, c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { fn(tmpC, p.getX(i), p.getY(i), p.getZ(i), i); c.set([tmpC.r, tmpC.g, tmpC.b], i * 3); }
  geo.setAttribute('color', new THREE.BufferAttribute(c, 3)); return geo;
}
const LEAF_D = new THREE.Color('#2c8a4a'), LEAF_L = new THREE.Color('#8fd163'), LEAF_Y = new THREE.Color('#c9dc6a');
export function leafGeometry(len, wid, droop, tint = 0) {
  const g = new THREE.PlaneGeometry(len, wid, 9, 4), p = g.attributes.position, us = [];
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i) / len + 0.5, v = p.getY(i) / wid;
    const w = Math.pow(Math.sin(Math.PI * Math.min(1, u * 0.96 + 0.04)), 0.6) * (1 - u * 0.3);
    const z = v * wid * w;
    p.setXYZ(i, u * len, -droop * u * u * len - Math.abs(z) * 0.42 + Math.sin(u * 9 + v * 3) * 0.02, z); us.push([u, v]);
  }
  g.computeVertexNormals();
  return paint(g, (c, x, y, z, i) => { const [u, v] = us[i]; c.copy(LEAF_D).lerp(LEAF_L, u * 0.75 + 0.2 * (1 - Math.abs(v) * 2)).lerp(LEAF_Y, tint * u); });
}
const leafMat = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.75 });
const barkMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 });
const BARK = [new THREE.Color('#9a7250'), new THREE.Color('#86603f')];

/** A coconut palm. Returns a group; `group.userData.crown` sways in the breeze. */
// ---- shared geometry ----
// Generating every frond and bush blob one by one was the slowest part of loading a level (most noticeable on
// phones). Instead a few variants of each are generated once, on first use, and shared by every plant.
const VARIANTS = 6, cache = new Map();
const cached = (key, make) => { if (!cache.has(key)) { const g = make(); g.userData.shared = true; cache.set(key, g); } return cache.get(key); };
const nutMat = new THREE.MeshStandardMaterial({ color: '#6a4426', roughness: 0.9 });
const nutGeometry = () => cached('nuts', () => mergeGeometries([0, 1, 2].map((i) => new THREE.SphereGeometry(0.26, 10, 8).translate(Math.cos(i * 2.1) * 0.3, -0.3, Math.sin(i * 2.1) * 0.3))));
function crownGeometry(fronds, v) {
  return cached(`crown${fronds}.${v}`, () => {
    const r = rng(500 + fronds * 10 + v), m = new THREE.Matrix4(), leaves = [];
    for (let i = 0; i < fronds; i++) {
      const g = leafGeometry(r.range(3.0, 3.9), r.range(0.95, 1.25), r.range(0.1, 0.19), r() * 0.5);
      g.applyMatrix4(m.makeRotationZ(r.range(0.05, 0.6))); g.applyMatrix4(m.makeRotationY((i / fronds) * Math.PI * 2 + r.range(-0.25, 0.25))); leaves.push(g);
    }
    for (let i = 0; i < 4; i++) { const g = leafGeometry(r.range(1.8, 2.4), 0.8, 0.04, 0.6); g.applyMatrix4(m.makeRotationZ(r.range(0.9, 1.3))); g.applyMatrix4(m.makeRotationY(i * 1.57 + r())); leaves.push(g); }
    return mergeGeometries(leaves);
  });
}

export function makePalm(r, { height = 7, leanX = 1, leanZ = 0, fronds = 9, scale = 1, shadow = true } = {}) {
  // trunk shapes are shared too (height and lean rounded a little, which nobody can see)
  height = Math.round(height * 4) / 4; leanX = Math.round(leanX * 4) / 4; leanZ = Math.round(leanZ * 4) / 4;
  const group = new THREE.Group(), at = (u) => new THREE.Vector3(leanX * u * u, height * u, leanZ * u * u);
  const trunk = new THREE.Mesh(cached(`trunk${height}|${leanX}|${leanZ}`, () => {
    const segs = 10, parts = [], up = new THREE.Vector3(0, 1, 0), q = new THREE.Quaternion(), m = new THREE.Matrix4();
    for (let i = 0; i < segs; i++) {
      const a = at(i / segs), b = at((i + 1) / segs), dir = b.clone().sub(a), len = dir.length();
      const r0 = 0.3 - 0.15 * (i / segs), r1 = 0.3 - 0.15 * ((i + 1) / segs);
      const g = new THREE.CylinderGeometry(r1 * 0.94, r0 * 1.06, len * 1.04, 9, 1); q.setFromUnitVectors(up, dir.normalize());
      g.applyMatrix4(m.compose(a.clone().add(b).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1)));
      parts.push(paint(g, (c) => c.copy(BARK[i % 2])));
    }
    return mergeGeometries(parts);
  }), barkMat); trunk.castShadow = shadow; trunk.receiveShadow = true; group.add(trunk);
  const crown = new THREE.Group(); crown.position.copy(at(1)); group.add(crown);
  const lm = new THREE.Mesh(crownGeometry(fronds, Math.floor(r() * VARIANTS)), leafMat); lm.castShadow = shadow; lm.rotation.y = r() * 6.28; crown.add(lm);
  crown.add(new THREE.Mesh(nutGeometry(), nutMat));   // 3 coconuts, 1 draw call
  group.userData.crown = crown; group.userData.phase = r() * 6.28; group.scale.setScalar(scale);
  return group;
}

const BUSH = ['#3f9a55', '#57b064', '#2f8a4c', '#6cbf6a'].map((c) => new THREE.Color(c));
const bushMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, flatShading: false });
export function makeBush(r, size = 1) {
  const mesh = new THREE.Mesh(cached('bush' + Math.floor(r() * VARIANTS * 2), () => bushGeometry(rng(700 + cache.size))), bushMat);
  mesh.scale.setScalar(size); mesh.rotation.y = r() * 6.28; mesh.castShadow = true; mesh.receiveShadow = true; return mesh;
}
function bushGeometry(r, size = 1) {
  const parts = [], m = new THREE.Matrix4(), n = 4 + Math.floor(r() * 4);
  for (let i = 0; i < n; i++) { let g = new THREE.IcosahedronGeometry(r.range(0.45, 0.85) * size, 2); g.deleteAttribute('uv'); g.deleteAttribute('normal'); g = mergeVertices(g, 1e-3); const col = r.pick(BUSH);
    { const p = g.attributes.position; for (let k = 0; k < p.count; k++) { const s = 1 + 0.1 * Math.sin(p.getX(k) * 9 + p.getY(k) * 7) * Math.cos(p.getZ(k) * 8); p.setXYZ(k, p.getX(k) * s, p.getY(k) * s * 0.9, p.getZ(k) * s); } }
    g.applyMatrix4(m.makeTranslation(r.range(-0.8, 0.8) * size, r.range(0.2, 0.6) * size, r.range(-0.5, 0.5) * size));
    g.computeVertexNormals(); parts.push(paint(g, (c, x, y) => c.copy(col).multiplyScalar(0.78 + y * 0.3 / size))); }
  return mergeGeometries(parts);
}
export function makeFern(r, size = 1) {
  const geo = cached('fern' + Math.floor(r() * VARIANTS), () => {
    const q = rng(900 + cache.size), leaves = [], m = new THREE.Matrix4(), n = 6 + Math.floor(q() * 3);
    for (let i = 0; i < n; i++) { const g = leafGeometry(q.range(1.1, 1.7), 0.5, 0.28, 0.2); g.applyMatrix4(m.makeRotationZ(q.range(0.5, 1.0))); g.applyMatrix4(m.makeRotationY((i / n) * 6.28 + q())); leaves.push(g); }
    return mergeGeometries(leaves);
  });
  const mesh = new THREE.Mesh(geo, leafMat); mesh.scale.setScalar(size); mesh.rotation.y = r() * 6.28; mesh.castShadow = true; return mesh;
}
const rockMat = new THREE.MeshStandardMaterial({ color: '#a89684', roughness: 0.95, flatShading: true });
export function makeRock(r, size = 1) {
  const g = new THREE.DodecahedronGeometry(size, 0), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) * 1.2, p.getY(i) * 0.7, p.getZ(i));
  g.computeVertexNormals(); const mesh = new THREE.Mesh(g, rockMat); mesh.rotation.set(r() * 0.4, r() * 6.28, r() * 0.4); mesh.castShadow = true; mesh.receiveShadow = true; return mesh;
}
/** Scatter of little flowers as one instanced mesh. `points` = [{x,y,z,color,s}]. */
export function makeFlowers(points) {
  const geo = new THREE.SphereGeometry(0.085, 7, 5), mat = new THREE.MeshStandardMaterial({ roughness: 0.6 });
  const inst = new THREE.InstancedMesh(geo, mat, points.length), m = new THREE.Matrix4(), c = new THREE.Color();
  points.forEach((p, i) => { m.makeScale(p.s, p.s * 0.6, p.s); m.setPosition(p.x, p.y, p.z); inst.setMatrixAt(i, m); inst.setColorAt(i, c.set(p.color)); });
  inst.instanceMatrix.needsUpdate = true; if (inst.instanceColor) inst.instanceColor.needsUpdate = true; return inst;
}
