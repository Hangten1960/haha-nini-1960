// Level manager: turns level data into a 3D scene and keeps its moving parts in
// sync with the simulation (platforms, crabs, coconuts, stars, checkpoints).
import * as THREE from 'three';
import { WATER_Y } from '../config.js';
import { rng } from '../core/util.js';
import { buildSky, buildLights, buildClouds, buildFarIslands, buildOcean, skyPreset } from './builders/environment.js';
import { buildTerrain, surfaceHeight } from './builders/terrain.js';
import { makePalm, makeBush, makeFern, makeRock, makeFlowers } from './builders/flora.js';
import { makePlatform, makeBridge, makeLighthouse, makeCheckpoint, makeSign, makeSurfboard, makeUmbrella, makeFinishGate } from './builders/props.js';
import { makeStar, makeCrab, updateCrab, makeCoconut, makeShadowDisc, makeRushStar, makeRushRing } from './builders/actors.js';
import { Effects } from './Effects.js';
import { batchStatic } from './StaticBatcher.js';

const L0 = (level) => (level.index || 4) === 4 ? 4 : level.index * 37;   // level 4 keeps its original decoration seed

export class LevelManager {
  constructor(scene, assets, world, { shadows = true, lite = false } = {}) {
    this.lite = lite;   // phone profile: fewer decorations
    this.scene = scene; this.assets = assets; this.world = world; this.level = world.level; this.time = 0;
    const sky = skyPreset(this.level.sky);
    scene.fog = new THREE.Fog(sky.fog, 70, 420);
    this.sky = buildSky(scene, sky); this.lights = buildLights(scene, shadows, sky); this.clouds = buildClouds(scene, 5 + this.level.index); buildFarIslands(scene, 9 + this.level.index);
    this.ocean = buildOcean(scene, this.level.terrain, sky);
    buildTerrain(scene, world, assets.textures.sand);
    this.effects = new Effects(scene, assets);
    this.palms = [];
    this.decor = new THREE.Group(); scene.add(this.decor);           // static decoration, batched below
    const t0 = performance.now(); this._decorate(); const t1 = performance.now(); this._props(); this._actors(); const t2 = performance.now();
    this.batchInfo = batchStatic(this.decor, scene); this.buildMs = { decorate: Math.round(t1 - t0), props: Math.round(t2 - t1), batch: Math.round(performance.now() - t2) };
  }
  ground(x, z) { for (const seg of this.level.terrain) if (x >= seg.x0 && x <= seg.x1) return surfaceHeight(this.world, seg, x, z); return null; }
  _place(obj, x, z, sink = 0, parent = this.decor) { const y = this.ground(x, z); if (y === null || y < WATER_Y + 0.25) return false; obj.position.set(x, y - sink, z); parent.add(obj); return true; }

  _decorate() {
    const r = rng(2020 + L0(this.level)), L = this.level, D = L.decor || {}, flowers = [], FL = ['#f6b8c6', '#fff6ee', '#ffd76a', '#f29a8e'];
    // keep the lane readable: no random palms at cliffs, under coconut palms, at the hidden-star palm or behind the menu logo
    const cliffs = []; for (const seg of L.terrain) for (let i = 0; i < seg.pts.length - 1; i++) if (seg.pts[i + 1][0] - seg.pts[i][0] < 0.3 && Math.abs(seg.pts[i + 1][1] - seg.pts[i][1]) > 1.5) cliffs.push(seg.pts[i + 1][0]);
    const magic = L.stars.find((s) => s.magic), spots = [...L.fallingCoconuts.map((c) => c.x), ...(magic ? [magic.x] : [])];
    const keepOut = (x) => cliffs.some((c) => Math.abs(x - c) < 2.2) || (D.menuZone && x > D.menuZone[0] && x < D.menuZone[1]) || spots.some((p) => Math.abs(x - p) < 2.4);
    for (const seg of L.terrain) {
      for (let x = seg.x0 + 1.5; x < seg.x1 - 1.5; x += r.range(2.2, 4.2)) {
        // back of the beach: palms & jungle
        const roll = r(), z = -r.range(4.2, 15);
        if (roll < 0.42 && !keepOut(x)) { const p = makePalm(r, { height: r.range(5.5, 9), leanX: r.range(-1.6, 1.6), leanZ: r.range(-0.5, 1.2), scale: r.range(0.85, 1.2), shadow: z > -11 }); if (this._place(p, x, z, 0.2, this.scene)) this.palms.push(p); }
        else if (roll < 0.72) this._place(makeBush(r, r.range(0.8, 1.7)), x, z, 0.15);
        else if (roll < 0.9) this._place(makeFern(r, r.range(1, 1.6)), x, -r.range(3.4, 9), 0);
        else this._place(makeRock(r, r.range(0.4, 1.1)), x, z, 0.2);
        if (r() < (this.lite ? 0.3 : 0.75)) this._place(makeBush(r, r.range(1.2, 2.2)), x + r.range(-1, 1), -r.range(11, 17), 0.2);
        // little things near the lane and on the shore
        if (r() < 0.45) this._place(makeFern(r, r.range(0.6, 0.95)), x + r.range(-1, 1), -r.range(3.0, 3.8), 0);
        if (r() < 0.3) this._place(makeRock(r, r.range(0.22, 0.5)), x + r.range(-1, 1), r.range(3.4, 5.4), 0.08);
        for (let k = 0; k < (this.lite ? 1 : 3); k++) { const fx = x + r.range(-1.5, 1.5), fz = r() < 0.7 ? -r.range(3.0, 9) : r.range(2.9, 3.6), fy = this.ground(fx, fz); if (fy !== null && fy > 0) flowers.push({ x: fx, y: fy + 0.1, z: fz, color: r.pick(FL), s: r.range(0.7, 1.3) }); }
      }
      // rocks softening the ends of each island
      for (const [ex, s] of [[seg.x0 + 0.5, -1], [seg.x1 - 0.5, 1]]) for (let k = 0; k < (this.lite ? 3 : 5); k++) { const rk = makeRock(r, r.range(0.6, 1.5)); rk.position.set(ex + s * r.range(0.2, 1.4), r.range(-1.5, -0.4), r.range(-9, 7)); if (Math.abs(rk.position.z) < 2.8) rk.position.y -= 1.2; this.decor.add(rk); }
    }
    this.scene.add(makeFlowers(flowers));
    // hand-placed set pieces
    if (magic) {   // the big palm whose crown hides the magic star
      const gy = this.world.heightAt(magic.x - 0.5) ?? 0, big = makePalm(r, { height: (magic.y + 0.8 - gy + 0.2) / 1.05, leanX: 0.5, leanZ: 1.5, fronds: 13, scale: 1.05 }); this._place(big, magic.x - 0.5, -1.9, 0.2, this.scene); this.palms.push(big);
    }
    for (const c of L.fallingCoconuts) {   // each dropping coconut hangs from its own palm (rooted in the sea when it hangs over a platform)
      const base = (this.world.heightAt(c.x) ?? -1.2) - 0.2, p = makePalm(r, { height: c.top + 0.7 - base, leanX: r.range(-0.4, 0.4), leanZ: 1.5, fronds: 9 });
      p.position.set(c.x - p.userData.crown.position.x, base, -1.9); this.scene.add(p); this.palms.push(p); }
    if (D.surfboards !== undefined) { const cols = [['#f29a8e', '#fbf3e2'], ['#7fd6cf', '#1f2a44'], ['#ffd76a', '#f7f1e3']];
      cols.forEach(([a, b], i) => { const sb = makeSurfboard(a, b); sb.rotation.y = -0.25 + i * 0.22; this._place(sb, D.surfboards + i * 1.05, -3.6 - i * 0.25, 0.25); }); }
    if (D.umbrella !== undefined) { const um = makeUmbrella(); this._place(um, D.umbrella, -4.4, 0.1);
      const towel = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.04, 1.2), new THREE.MeshStandardMaterial({ color: '#7fd6cf', roughness: 1 })); this._place(towel, D.umbrella + 0.4, -3.6, -0.03); towel.receiveShadow = true; }
    for (const c of L.rollingCoconuts) { const pile = makeRock(r, 0.9); this._place(pile, c.x0 + 1.5, -3.2, 0.2); }
  }

  _props() {
    const L = this.level, A = this.assets; this.platforms = [];
    for (const p of L.platforms) {
      const gy = this.world.heightAt(p.x) ?? -3;
      const g = p.kind === 'bridge' ? makeBridge(A, p) : makePlatform(A, p, Math.min(gy, p.y - 0.5));
      g.position.set(p.x, p.y, 0); (p.move ? this.scene : this.decor).add(g); this.platforms.push({ p, g });
    }
    const lx = L.finishX + 6; this.lighthouse = makeLighthouse(A); this.lighthouse.position.set(lx, (this.world.heightAt(lx) ?? 0) - 0.1, -5.5); this.scene.add(this.lighthouse);
    const gate = makeFinishGate(A); gate.position.set(L.finishX, this.world.heightAt(L.finishX), -0.4); gate.rotation.y = 0.55; this.decor.add(gate);
    this.checkpoints = L.checkpoints.map((c) => { const g = makeCheckpoint(A); g.position.set(c.x, this.world.heightAt(c.x) ?? c.y, -1.9); this.scene.add(g); return g; });
    for (const h of L.hints) if (h.char) { const s = makeSign(A, h.char, h.char === 'haha' ? 'HIGH JUMP' : 'FLOAT'); const x = h.x0 + (h.char === 'haha' ? 2.6 : 3.3); s.position.set(x, this.world.heightAt(x), -2.1); this.decor.add(s); }
  }

  _actors() {
    const L = this.level, A = this.assets;
    this.stars = L.stars.map((s, i) => { const g = makeStar(A, s.magic); g.position.set(s.x, s.y, 0); g.userData.phase = i * 0.7; this.scene.add(g); return g; });
    this.crabs = L.crabs.map((c) => { const g = makeCrab(); g.position.set(c.x, c.y, 0.2); this.scene.add(g); return g; });
    this.falling = L.fallingCoconuts.map((c) => { const g = makeCoconut(0.42), sh = makeShadowDisc(); sh.position.set(c.x, c.ground + 0.03, 0); this.scene.add(g, sh); return { c, g, sh }; });
    this.rolling = L.rollingCoconuts.map((c) => { const g = makeCoconut(c.r); this.scene.add(g); return { c, g }; });
    this.rushes = (L.challenges || []).map((c) => { const ring = makeRushRing(A); ring.position.set(c.trigger.x, c.trigger.y, 0); this.scene.add(ring);
      const stars = c.stars.map((s, k) => { const g = makeRushStar(A); g.position.set(s.x, s.y, 0); g.userData.phase = k * 0.9; this.scene.add(g); return g; }); return { c, ring, stars }; });
  }

  reset() {
    for (const s of this.stars) { s.visible = true; s.userData.gone = 0; }
    for (const c of this.checkpoints) c.userData.active = 0;
  }
  collectStar(i) { const s = this.stars[i]; s.userData.gone = 1e-4; this.effects.sparkle(s.position.x, s.position.y, s.userData.magic ? '#ffb3d6' : '#ffe08a', s.userData.magic ? 26 : 9); }
  activateCheckpoint(i) { const c = this.checkpoints[i]; c.userData.active = 1e-4; this.effects.sparkle(c.position.x, c.position.y + 2.6, '#ffe08a', 12, c.position.z); }
  bounceCrab(i) { this.crabs[i].userData.squash = 1; }
  rushStarPos(i, k) { const s = this.level.challenges[i].stars[k]; return s; }
  /** Free GPU resources before another level is built. */
  dispose() { this.scene.traverse((o) => { if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose()); }); const sm = this.lights.sun.shadow.map; if (sm) sm.dispose(); }

  /** @param t simulation time (drives gameplay objects)  @param dt real frame time (ambience) */
  update(t, dt, player, camera, sim) {
    this.time += dt; const T = this.time, w = this.world, L = this.level;
    for (const { p, g } of this.platforms) if (p.move) { const q = w.platformPos(p, t); g.position.set(q.x, q.y + Math.sin(T * 2 + p.x) * 0.0, 0); }
    L.crabs.forEach((c, i) => { const g = this.crabs[i], x = w.crabX(c, t); g.position.x = x; updateCrab(g, T + i, w.crabDir(c, t), Math.abs(player.x - x) < 5, dt); });
    for (const f of this.falling) {
      const k = w.fallingCoconut(f.c, t), g = f.g; g.visible = k.state !== 'gone';
      g.position.set(f.c.x, k.y, 0);
      if (k.state === 'hang') { g.scale.setScalar(Math.min(1, k.k * 4)); g.rotation.z = Math.sin(T * 22) * 0.16 * k.k; g.position.x += Math.sin(T * 30) * 0.03 * k.k; }
      else if (k.state === 'fall') { g.scale.setScalar(1); g.rotation.z += dt * 5; }
      else if (k.state === 'rest') { g.scale.setScalar(1 - Math.max(0, k.k - 0.7) / 0.3); g.position.y += Math.max(0, Math.sin(Math.min(1, k.k * 3) * Math.PI)) * 0.35; }
      const warn = k.state === 'hang' ? k.k : k.state === 'fall' ? 1 : 0;
      f.sh.visible = warn > 0.05; f.sh.scale.setScalar(0.5 + warn * 0.7); f.sh.material.opacity = 0.12 + warn * 0.25;
    }
    for (const rc of this.rolling) { const k = w.rollingCoconut(rc.c, t); rc.g.visible = k.active; if (k.active) { rc.g.position.set(k.x, k.y, 0); rc.g.rotation.z = k.roll; rc.g.scale.setScalar(Math.min(1, k.k * 8, (1 - k.k) * 8)); } }
    for (const s of this.stars) {
      const u = s.userData; if (!s.visible) continue;
      if (u.gone > 0) { u.gone += dt * 4; s.scale.setScalar((u.magic ? 1.7 : 1) * Math.max(0, 1 - u.gone) * (1 + u.gone * 1.5)); s.position.y += dt * 3; if (u.gone >= 1) { s.visible = false; s.position.y = L.stars[this.stars.indexOf(s)].y; s.scale.setScalar(u.magic ? 1.7 : 1); } continue; }
      if (Math.abs(s.position.x - camera.position.x) > 45) continue;
      u.mesh.rotation.y = T * 1.8 + u.phase; s.position.y = L.stars[this.stars.indexOf(s)].y + Math.sin(T * 2.2 + u.phase) * 0.12;
      u.glow.material.opacity = (u.magic ? 0.35 : 0.5) + Math.sin(T * 3 + u.phase) * 0.12;
    }
    for (const c of this.checkpoints) { const u = c.userData; if (u.active > 0 && u.active < 1) u.active = Math.min(1, u.active + dt * 1.6);
      u.flag.position.y = 1.0 + 1.75 * (1 - Math.pow(1 - u.active, 3)); u.flag.material.color.setScalar(0.6 + 0.4 * u.active); u.flag.rotation.y = Math.sin(T * 2.6 + c.position.x) * 0.22 - 0.1; }
    for (const p of this.palms) { if (Math.abs(p.position.x - camera.position.x) > 60) continue; const c = p.userData.crown, ph = p.userData.phase; c.rotation.z = Math.sin(T * 0.9 + ph) * 0.045; c.rotation.x = Math.sin(T * 0.7 + ph * 1.7) * 0.035; }
    // Star Rush: ring + blue stars follow the simulation state
    this.rushes.forEach((r, i) => {
      const st = sim ? sim.challenges[i] : { state: 'idle', got: new Set(), end: 0 }, u = r.ring.userData, left = st.state === 'active' ? st.end - t : 0;
      u.ring.rotation.y = Math.sin(T * 1.4) * 0.5; u.star.rotation.y = T * 2; r.ring.scale.setScalar(st.state === 'active' ? 0.8 : 1 + Math.sin(T * 3) * 0.04);
      u.mat.emissive.set(st.state === 'won' ? '#ffb300' : '#2fd2ff'); u.mat.color.set(st.state === 'won' ? '#ffe08a' : '#bff4ff'); u.mat.emissiveIntensity = st.state === 'active' ? 0.4 : 1.3; u.glow.material.opacity = st.state === 'idle' ? 0.55 : 0.2; u.glow.material.color.set(st.state === 'won' ? '#ffd76a' : '#7fe9ff');
      r.stars.forEach((g, k) => { const on = st.state === 'active' && !st.got.has(k); g.visible = on; if (!on) return;
        const hurry = left < r.c.duration * 0.3; g.userData.mesh.rotation.y = T * 2.6 + g.userData.phase; g.position.y = r.c.stars[k].y + Math.sin(T * 3 + g.userData.phase) * 0.1;
        g.scale.setScalar(hurry ? 0.85 + 0.2 * Math.abs(Math.sin(T * 12)) : 1); g.userData.glow.material.opacity = hurry ? 0.4 + 0.4 * Math.abs(Math.sin(T * 12)) : 0.7; });
    });
    this.lighthouse.userData.beams.rotation.y = T * 0.5;
    this.clouds.update(dt); this.ocean.update(T, camera); this.effects.update(dt);
    this.sky.position.copy(camera.position);
  }
}
