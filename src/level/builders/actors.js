// Stars, friendly crabs and coconuts.
import * as THREE from 'three';

let starGeo = null;
function starGeometry() {
  if (starGeo) return starGeo;
  const sh = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + (i / 10) * Math.PI * 2, r = i % 2 ? 0.21 : 0.46; i ? sh.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  starGeo = new THREE.ExtrudeGeometry(sh, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.07, bevelSegments: 3, curveSegments: 1 }); starGeo.center(); return starGeo;
}
const goldMat = new THREE.MeshStandardMaterial({ color: '#ffcb3d', emissive: '#ff9d00', emissiveIntensity: 0.55, roughness: 0.3, metalness: 0.25 });
const magicMat = new THREE.MeshStandardMaterial({ color: '#ffe9f3', emissive: '#ff8fc0', emissiveIntensity: 0.9, roughness: 0.25, metalness: 0.2 });
export function makeStar(assets, magic) {
  const g = new THREE.Group(), mesh = new THREE.Mesh(starGeometry(), magic ? magicMat : goldMat); g.add(mesh);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: assets.textures.glow, color: magic ? '#ffb3d6' : '#ffe08a', transparent: true, opacity: magic ? 0.4 : 0.6, blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.scale.setScalar(magic ? 2.0 : 1.7); g.add(glow);
  if (magic) g.scale.setScalar(1.7);
  g.userData = { mesh, glow, magic }; return g;
}

const rushMat = new THREE.MeshStandardMaterial({ color: '#bff4ff', emissive: '#2fd2ff', emissiveIntensity: 1.1, roughness: 0.25, metalness: 0.2 });
/** Blue timed star (Star Rush). */
export function makeRushStar(assets) {
  const g = new THREE.Group(), mesh = new THREE.Mesh(starGeometry(), rushMat); g.add(mesh);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: assets.textures.glow, color: '#7fe9ff', transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false })); glow.scale.setScalar(1.8); g.add(glow);
  g.userData = { mesh, glow }; g.visible = false; return g;
}
/** The ring that starts a Star Rush: a tall glowing hoop you cannot miss. */
export function makeRushRing(assets) {
  const g = new THREE.Group(), mat = new THREE.MeshStandardMaterial({ color: '#bff4ff', emissive: '#2fd2ff', emissiveIntensity: 1.3, roughness: 0.3 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.11, 10, 36), mat); ring.position.y = 0.5; g.add(ring);
  const star = new THREE.Mesh(starGeometry(), mat); star.position.y = 0.5; star.scale.setScalar(0.9); g.add(star);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: assets.textures.glow, color: '#7fe9ff', transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false })); glow.scale.setScalar(4.6); glow.position.y = 0.5; g.add(glow);
  g.userData = { ring, star, glow, mat }; return g;
}

export function makeCrab() {
  const shell = new THREE.MeshStandardMaterial({ color: '#ee6a50', roughness: 0.55 }), dark = new THREE.MeshStandardMaterial({ color: '#d4513c', roughness: 0.6 }),
    white = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3 }), black = new THREE.MeshStandardMaterial({ color: '#1f2a44', roughness: 0.3 });
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const mk = (geo, mat, parent, x, y, z) => { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); o.castShadow = true; parent.add(o); return o; };
  const sp = new THREE.SphereGeometry(1, 16, 12);
  const sh = mk(sp, shell, body, 0, 0.42, 0); sh.scale.set(0.62, 0.36, 0.48);
  const cheek = new THREE.MeshStandardMaterial({ color: '#ffb3a1', roughness: 0.6 });
  for (const s of [-1, 1]) {
    mk(new THREE.CylinderGeometry(0.035, 0.035, 0.22, 6), dark, body, s * 0.2, 0.78, 0.2);
    const eye = mk(sp, white, body, s * 0.2, 0.93, 0.22); eye.scale.setScalar(0.13);
    const pupil = mk(sp, black, body, s * 0.2, 0.94, 0.33); pupil.scale.setScalar(0.065);
    const ch = mk(sp, cheek, body, s * 0.33, 0.4, 0.4); ch.scale.set(0.09, 0.06, 0.04);
  }
  const smile = mk(new THREE.TorusGeometry(0.11, 0.022, 6, 12, Math.PI), black, body, 0, 0.42, 0.47); smile.rotation.z = Math.PI;
  const claws = [-1, 1].map((s) => { const arm = new THREE.Group(); arm.position.set(s * 0.56, 0.45, 0.1); body.add(arm);
    const up = mk(sp, dark, arm, s * 0.16, 0.14, 0); up.scale.set(0.09, 0.16, 0.09);
    const c1 = mk(sp, shell, arm, s * 0.26, 0.4, 0.02); c1.scale.set(0.2, 0.24, 0.14);
    const c2 = mk(sp, shell, arm, s * 0.14, 0.52, 0.02); c2.scale.set(0.09, 0.15, 0.1); return arm; });
  const legs = []; for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const l = new THREE.Group(); l.position.set(s * (0.42 + i * 0.03), 0.3, -0.18 + i * 0.16); body.add(l);
    const m = mk(new THREE.CapsuleGeometry(0.04, 0.3, 3, 6), dark, l, s * 0.14, -0.13, 0); m.rotation.z = s * 0.75; l.userData = { s, i }; legs.push(l); }
  g.userData = { body, claws, legs, squash: 0 }; return g;
}
export function updateCrab(g, t, dir, near, dt) {
  const u = g.userData; u.squash = Math.max(0, u.squash - dt * 3.5);
  const sq = Math.sin(u.squash * Math.PI) * 0.4;
  u.body.scale.set(1 + sq * 0.5, 1 - sq, 1 + sq * 0.5); u.body.position.y = Math.abs(Math.sin(t * 9)) * 0.035;
  for (const l of u.legs) l.rotation.z = Math.sin(t * 13 + l.userData.i * 2.1 + (l.userData.s > 0 ? 0 : 1.5)) * 0.28;
  const wave = near ? 1 : 0.15; u.claws[0].rotation.z = 0.15 + Math.sin(t * 7) * 0.35 * wave + (near ? 0.35 : 0); u.claws[1].rotation.z = -0.15 - Math.sin(t * 7 + 1) * 0.35 * wave - (near ? 0.35 : 0);
  g.rotation.y = Math.sin(t * 1.3) * 0.12 + dir * 0.12;
}
export function makeCoconut(r = 0.42) {
  const g = new THREE.Group(), m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), new THREE.MeshStandardMaterial({ color: '#6f4627', roughness: 0.95 })); m.castShadow = true; m.scale.y = 1.08; g.add(m);
  const dm = new THREE.MeshStandardMaterial({ color: '#2e1c10', roughness: 1 });
  for (let i = 0; i < 3; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(r * 0.13, 6, 5), dm); const a = i * 2.09; d.position.set(Math.cos(a) * r * 0.3, r * 0.93, Math.sin(a) * r * 0.3); m.add(d); }
  g.userData.mesh = m; return g;
}
export function makeShadowDisc() {
  const m = new THREE.Mesh(new THREE.CircleGeometry(0.6, 20), new THREE.MeshBasicMaterial({ color: '#3a2a12', transparent: true, opacity: 0.3, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; return m;
}
