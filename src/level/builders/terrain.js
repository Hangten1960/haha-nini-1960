// Sand islands: a mesh grown from each terrain profile. In the play lane (|z| ≤ 2.6)
// the surface is exactly the collision height; behind it rise dunes, in front it
// slopes into the sea.
import * as THREE from 'three';
import { clamp, lerp, noise2, smooth } from '../../core/util.js';

export const LANE = 2.6;
export function surfaceHeight(world, seg, x, z) {
  const xc = clamp(x, seg.x0, seg.x1), h = world.heightAt(xc) ?? 0;
  if (z > LANE) return lerp(h, -2.7, smooth((z - LANE) / 6.2));
  if (z >= -LANE) return h;
  const endFade = smooth(Math.min(xc - seg.x0, seg.x1 - xc) / 5);
  const b = smooth((-z - LANE) / 9) * (0.35 + 0.65 * endFade);
  const y = h + b * (0.4 + 2.4 * noise2(x * 0.16 + seg.x0, z * 0.2)) + b * 0.5 * noise2(x * 0.55, z * 0.5 + 9);
  return lerp(y, -2.7, smooth((-z - 17.5) / 7));
}

export const TROPICAL = { sand: new THREE.Color('#f4dcaa'), wet: new THREE.Color('#cfae7a'), grass: new THREE.Color('#86bd63'), grass2: new THREE.Color('#5fa257'), rock: new THREE.Color('#c7a276'), under: new THREE.Color('#9fc7b0') };

/** @param C colour palette (TROPICAL sand by default; the winter edition passes a snow palette) */
export function buildTerrain(scene, world, sandTex, C = TROPICAL, bumpScale = 1.2) {
  sandTex.repeat.set(1, 1);
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, map: sandTex, bumpMap: sandTex, bumpScale, roughness: 1, metalness: 0 });
  const zs = [-25, -22.5, -20, -17.5, -15, -12.5, -10, -8, -6, -4.4, -3.2, -LANE, -1.3, 0, 1.3, LANE, 3.3, 4.2, 5.2, 6.3, 7.5, 8.9];
  const meshes = [];
  for (const seg of world.level.terrain) {
    const xs = new Set([seg.x0 - 0.02, seg.x1 + 0.02]);
    for (let x = seg.x0; x <= seg.x1 + 1e-6; x += 0.7) xs.add(Math.min(x, seg.x1));
    xs.add(seg.x1); for (const p of seg.pts) xs.add(p[0]);
    const xl = [...xs].sort((a, b) => a - b), nx = xl.length, nz = zs.length;
    const pos = new Float32Array(nx * nz * 3), uv = new Float32Array(nx * nz * 2), col = new Float32Array(nx * nz * 3);
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const x = xl[i], z = zs[j], k = i * nz + j, wall = x < seg.x0 || x > seg.x1;
      const y = wall ? -3.2 : surfaceHeight(world, seg, x, z);
      pos.set([x, y, z], k * 3); uv.set([x / 7, z / 7], k * 2);
    }
    const idx = [];
    for (let i = 0; i < nx - 1; i++) for (let j = 0; j < nz - 1; j++) { const a = i * nz + j, b = a + 1, c = a + nz, d = c + 1; idx.push(a, b, c, b, d, c); }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx);
    geo.computeVertexNormals();
    const nrm = geo.attributes.normal, tmp = new THREE.Color();
    for (let k = 0; k < nx * nz; k++) {
      const x = pos[k * 3], y = pos[k * 3 + 1], z = pos[k * 3 + 2];
      tmp.copy(C.sand).multiplyScalar(0.94 + 0.1 * noise2(x * 0.3, z * 0.3));
      tmp.lerp(C.wet, smooth((0.15 - y) / 0.9) * (z > LANE ? 1 : 0.6));
      tmp.lerp(C.under, smooth((-1.0 - y) / 1.4) * 0.55);
      const g = smooth((-z - 5.5) / 5) * smooth((y + 0.2) / 0.8) * (0.55 + 0.45 * noise2(x * 0.22 + 3, z * 0.3));
      tmp.lerp(noise2(x * 0.4, z * 0.4 + 7) > 0.5 ? C.grass : C.grass2, clamp(g * 1.1));
      tmp.lerp(C.rock, smooth((0.72 - nrm.getY(k)) / 0.35) * 0.9);
      col.set([tmp.r, tmp.g, tmp.b], k * 3);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mesh = new THREE.Mesh(geo, mat); mesh.receiveShadow = true; scene.add(mesh); meshes.push(mesh);
  }
  return meshes;
}
