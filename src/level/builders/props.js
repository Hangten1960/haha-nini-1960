// Wooden platforms, bridge, lighthouse, checkpoints, signs, beach decor.
import * as THREE from 'three';

const M = {};
function mats(assets) {
  if (M.wood) return M;
  const wood = assets.textures.wood;
  M.wood = new THREE.MeshStandardMaterial({ map: wood, roughness: 0.85 });
  M.woodDark = new THREE.MeshStandardMaterial({ color: '#7a5433', roughness: 0.9 });
  M.rope = new THREE.MeshStandardMaterial({ color: '#d8c39a', roughness: 1 });
  M.navy = new THREE.MeshStandardMaterial({ color: '#1f2a44', roughness: 0.6 });
  M.white = new THREE.MeshStandardMaterial({ color: '#f7f1e3', roughness: 0.7 });
  M.red = new THREE.MeshStandardMaterial({ color: '#d9564a', roughness: 0.6 });
  M.glowCyan = new THREE.MeshStandardMaterial({ color: '#9ff3ff', emissive: '#57e0ff', emissiveIntensity: 1.6, roughness: 0.3 });
  return M;
}
const box = (w, h, d, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m; };
const cyl = (r0, r1, h, mat, x = 0, y = 0, z = 0, seg = 10) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg), mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m; };

/** Platform group with its origin at the centre of the walking surface. */
export function makePlatform(assets, p, groundY = -3) {
  const m = mats(assets), g = new THREE.Group(), D = 3.4, n = Math.max(3, Math.round(p.w / 0.62)), pw = p.w / n;
  for (let i = 0; i < n; i++) { const pl = box(pw - 0.05, 0.2, D + (i % 2 ? 0.12 : 0), m.wood, -p.w / 2 + pw * (i + 0.5), -0.1 - (i % 3 === 0 ? 0.015 : 0), 0); pl.rotation.y = Math.PI / 2 * 0; g.add(pl); }
  g.add(box(p.w + 0.1, 0.22, 0.24, m.woodDark, 0, -0.3, D / 2 - 0.35), box(p.w + 0.1, 0.22, 0.24, m.woodDark, 0, -0.3, -D / 2 + 0.35));
  if (p.move) {          // floating magic platform: glowing lanterns underneath
    for (const sx of [-1, 1]) { const orb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), m.glowCyan); orb.position.set(sx * (p.w / 2 - 0.5), -0.62, 0); g.add(orb);
      g.add(cyl(0.03, 0.03, 0.3, m.rope, sx * (p.w / 2 - 0.5), -0.42, 0, 6)); }
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: assets.textures.glow, color: '#7fe9ff', transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.scale.set(p.w * 1.5, 1.8, 1); glow.position.y = -0.7; g.add(glow);
  } else {
    const h = p.y - groundY;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(cyl(0.13, 0.15, h + 0.5, m.woodDark, sx * (p.w / 2 - 0.3), -h / 2 + 0.1, sz * (D / 2 - 0.35), 8));
  }
  return g;
}
export function makeBridge(assets, p) {
  const m = mats(assets), g = new THREE.Group(), D = 3.2, n = Math.round(p.w / 0.5), pw = p.w / n;
  for (let i = 0; i < n; i++) { const pl = box(pw - 0.06, 0.16, D + ((i * 7) % 3) * 0.06, m.wood, -p.w / 2 + pw * (i + 0.5), -0.08, 0); pl.rotation.z = (((i * 13) % 5) - 2) * 0.006; g.add(pl); }
  g.add(box(p.w, 0.2, 0.2, m.woodDark, 0, -0.27, 1.2), box(p.w, 0.2, 0.2, m.woodDark, 0, -0.27, -1.2));
  const posts = 5;
  for (const sz of [-1, 1]) {
    const hgt = sz < 0 ? 1.25 : 0.7, pts = [];
    for (let i = 0; i < posts; i++) { const x = -p.w / 2 + (p.w / (posts - 1)) * i; g.add(cyl(0.1, 0.12, hgt + 2.4, m.woodDark, x, hgt / 2 - 1.2, sz * (D / 2 + 0.02), 8));
      pts.push(new THREE.Vector3(x, hgt - 0.08, sz * (D / 2 + 0.02))); if (i < posts - 1) pts.push(new THREE.Vector3(x + p.w / (posts - 1) / 2, hgt - 0.38, sz * (D / 2 + 0.02))); }
    const rope = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.045, 6), m.rope); rope.castShadow = true; g.add(rope);
  }
  return g;
}
export function makeLighthouse(assets) {
  const m = mats(assets), g = new THREE.Group();
  const rock = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 4.4, 1.4, 9), new THREE.MeshStandardMaterial({ color: '#a89684', roughness: 1, flatShading: true })); rock.position.y = 0.5; rock.castShadow = true; rock.receiveShadow = true; g.add(rock);
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 2.3, 11, 24), new THREE.MeshStandardMaterial({ map: assets.textures.lighthouse, roughness: 0.7 })); tower.position.y = 6.7; tower.castShadow = true; g.add(tower);
  g.add(cyl(2.1, 2.1, 0.3, m.navy, 0, 12.3, 0, 24));
  const rail = new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.05, 6, 28), m.navy); rail.rotation.x = Math.PI / 2; rail.position.y = 13.0; g.add(rail);
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 1.7, 16), new THREE.MeshStandardMaterial({ color: '#fff3c4', emissive: '#ffd86b', emissiveIntensity: 1.8, roughness: 0.3 })); lamp.position.y = 13.3; g.add(lamp);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.5, 1.4, 16), m.red); roof.position.y = 14.85; roof.castShadow = true; g.add(roof);
  g.add(cyl(0.1, 0.1, 0.5, m.navy, 0, 15.7, 0, 6));
  const door = box(1.0, 1.9, 0.2, m.navy, 0, 2.1, 2.2); door.rotation.x = -0.07; g.add(door);
  for (const y of [5.5, 8.8]) { const w = box(0.55, 0.8, 0.2, m.navy, 0, y, 1.95 - (y - 5.5) * 0.07); g.add(w); }
  // sweeping light beams
  const beams = new THREE.Group(); beams.position.y = 13.3; g.add(beams);
  const beamMat = new THREE.MeshBasicMaterial({ color: '#fff0b0', transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  for (const s of [1, -1]) { const b = new THREE.Mesh(new THREE.ConeGeometry(3.2, 26, 16, 1, true), beamMat); b.rotation.z = s * Math.PI / 2; b.position.x = -s * 13; beams.add(b); }
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: assets.textures.glow, color: '#ffe29a', transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  halo.scale.set(9, 9, 1); halo.position.y = 13.3; g.add(halo);
  g.userData.beams = beams; return g;
}
export function makeCheckpoint(assets) {
  const m = mats(assets), g = new THREE.Group();
  g.add(cyl(0.07, 0.09, 3.2, m.navy, 0, 1.6, 0, 8)); g.add(cyl(0.3, 0.38, 0.22, m.woodDark, 0, 0.1, 0, 10));
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), new THREE.MeshStandardMaterial({ color: '#f6b93b', emissive: '#f6b93b', emissiveIntensity: 0.3 })); top.position.y = 3.25; g.add(top);
  const geo = new THREE.PlaneGeometry(1.2, 0.85, 8, 1); geo.translate(0.6, 0, 0);
  const flag = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: assets.textures.flag, side: THREE.DoubleSide, roughness: 0.8, color: '#9a9a9a' }));
  flag.position.set(0.07, 1.0, 0); flag.castShadow = true; g.add(flag);
  g.userData = { flag, active: 0, top }; return g;
}
export function makeSign(assets, charId, label) {
  const m = mats(assets), g = new THREE.Group();
  g.add(cyl(0.09, 0.1, 1.5, m.woodDark, 0, 0.75, 0, 8));
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.25, 0.1), [m.woodDark, m.woodDark, m.woodDark, m.woodDark, new THREE.MeshStandardMaterial({ map: assets.signTexture(charId, label), roughness: 0.85 }), m.woodDark]);
  board.position.y = 1.75; board.castShadow = true; g.add(board); g.rotation.y = 0.12; return g;
}
export function makeSurfboard(color, stripe) {
  const g = new THREE.Group(), geo = new THREE.SphereGeometry(1, 18, 12);
  const b = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.35 })); b.scale.set(0.42, 1.55, 0.07); b.position.y = 1.35; b.castShadow = true; g.add(b);
  const s = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: stripe, roughness: 0.35 })); s.scale.set(0.1, 1.5, 0.075); s.position.y = 1.35; g.add(s);
  g.rotation.x = -0.16; return g;
}
export function makeUmbrella() {
  const g = new THREE.Group(), pole = cyl(0.04, 0.04, 2.6, new THREE.MeshStandardMaterial({ color: '#f7f1e3' }), 0, 1.3, 0, 6); g.add(pole);
  const geo = new THREE.ConeGeometry(1.7, 0.6, 12, 1, true), c = new Float32Array(geo.attributes.position.count * 3), A = new THREE.Color('#f29a8e'), B = new THREE.Color('#fbf3e2'), uvs = geo.attributes.uv;
  for (let i = 0; i < geo.attributes.position.count; i++) { const k = Math.floor(uvs.getX(i) * 12 - 1e-4) % 2 ? A : B; c.set([k.r, k.g, k.b], i * 3); }
  geo.setAttribute('color', new THREE.BufferAttribute(c, 3));
  const top = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.8, flatShading: true })); top.position.y = 2.6; top.castShadow = true; g.add(top);
  g.rotation.z = 0.12; return g;
}
export function makeFinishGate(assets) {
  const m = mats(assets), g = new THREE.Group();
  for (const z of [-2.2, 2.2]) g.add(cyl(0.1, 0.12, 3.6, m.navy, 0, 1.8, z, 8));
  const flagsMat = [new THREE.MeshStandardMaterial({ color: '#f6b93b', side: THREE.DoubleSide }), new THREE.MeshStandardMaterial({ color: '#f29a8e', side: THREE.DoubleSide }), new THREE.MeshStandardMaterial({ color: '#f7f1e3', side: THREE.DoubleSide })];
  for (let i = 0; i < 9; i++) { const z = -1.9 + i * 0.475, sag = 0.35 * (1 - Math.pow((i - 4) / 4.4, 2)); const f = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.42, 3), flagsMat[i % 3]); f.rotation.x = Math.PI; f.position.set(0, 3.38 - sag, z); f.scale.z = 0.2; g.add(f); }
  return g;
}
