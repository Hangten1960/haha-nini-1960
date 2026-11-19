// Static batching: merges many small, never-moving decoration meshes (bushes, ferns, rocks…) into a few big meshes,
// one per material per 32-unit stretch of the level. Far fewer draw calls (the main cost on phones) while each
// chunk can still be frustum-culled when it is off screen.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const CHUNK = 32;
export function batchStatic(root, scene) {
  root.updateMatrixWorld(true);
  const buckets = new Map(), loose = [];
  root.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || Array.isArray(o.material)) { if (o.isMesh) loose.push(o); return; }
    const g = o.geometry, attrs = Object.keys(g.attributes).sort().join(','), idx = g.index ? 'i' : 'n';
    const x = new THREE.Vector3().setFromMatrixPosition(o.matrixWorld).x, chunk = Math.floor(x / CHUNK);
    const key = `${o.material.uuid}|${attrs}|${idx}|${o.castShadow ? 1 : 0}|${chunk}`;
    if (!buckets.has(key)) buckets.set(key, { mat: o.material, cast: o.castShadow, recv: o.receiveShadow, geos: [] });
    buckets.get(key).geos.push(g.clone().applyMatrix4(o.matrixWorld));
  });
  let merged = 0, before = 0;
  for (const b of buckets.values()) {
    before += b.geos.length;
    const geo = b.geos.length === 1 ? b.geos[0] : mergeGeometries(b.geos);
    if (!geo) continue;
    const m = new THREE.Mesh(geo, b.mat); m.castShadow = b.cast; m.receiveShadow = b.recv; scene.add(m); merged++;
    if (b.geos.length > 1) b.geos.forEach((g) => g.dispose());
  }
  // anything that could not be merged keeps its own mesh
  for (const o of loose) { const w = o.matrixWorld.clone(); o.removeFromParent(); w.decompose(o.position, o.quaternion, o.scale); scene.add(o); }
  root.traverse((o) => { if (o.isMesh && o.geometry) o.geometry.dispose(); });
  root.removeFromParent();
  return { before, after: merged + loose.length };
}
