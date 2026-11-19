// WINTER level manager: builds a winter level scene from level data and keeps its moving parts in sync with the
// simulation. Same interface as the tropical LevelManager, so the engine (Game) drives either one.
import * as THREE from 'three';
import { WATER_Y } from '../../config.js';
import { rng } from '../../core/util.js';
import { buildClouds } from '../builders/environment.js';
import { buildTerrain, surfaceHeight } from '../builders/terrain.js';
import { makePlatform, makeBridge, makeCheckpoint } from '../builders/props.js';
import { makeStar } from '../builders/actors.js';
import { Effects } from '../Effects.js';
import { batchStatic } from '../StaticBatcher.js';
import { winterSky, buildWinterSky, buildWinterLights, buildMountains, buildIcebergs, buildFrozenSea, buildSnowfall } from './winterEnv.js';
import { SNOW_PALETTE, makePine, makeSnowBush, makeSnowRock, makeSnowman, buildIceZones } from './winterNature.js';
import { makeFlag, waveFlag, makeSignpost, makeHouse, makeIcePlatform, makeSnowball, makeFootprintBadge, makeIceArch, makeIceCastle, lightCastle } from './winterProps.js';
import { makePenguin, updatePenguin, makeSeal, updateSeal } from './animals.js';

export class WinterLevelManager {
  constructor(scene, assets, world, { shadows = true, lite = false } = {}) {
    this.lite = lite; this.scene = scene; this.assets = assets; this.world = world; this.level = world.level; this.time = 0; this.celebrating = false; this.castleK = 0;
    const sky = this.skyDef = winterSky(this.level.sky);
    scene.fog = new THREE.Fog(sky.fog, 60, 380);
    this.sky = buildWinterSky(scene, sky); this.lights = buildWinterLights(scene, shadows, sky);
    this.clouds = buildClouds(scene, 5 + this.level.index); if (sky.aurora > 0.8) this.clouds.group.visible = false;
    buildMountains(scene, 3 + this.level.index); buildIcebergs(scene, 4 + this.level.index, this.level.decor.icebergs ? 18 : 10);
    this.ocean = buildFrozenSea(scene, this.level.terrain, sky);
    buildTerrain(scene, world, assets.textures.snow, SNOW_PALETTE, 0.5);
    buildIceZones(scene, world, assets);
    this.effects = new Effects(scene, assets);
    this.snow = buildSnowfall(scene, lite ? 380 : 900, assets.textures.dot);
    this.decor = new THREE.Group(); scene.add(this.decor);
    this._decorate(); this._props(); this._actors();
    this.batchInfo = batchStatic(this.decor, scene);
  }
  ground(x, z) { for (const seg of this.level.terrain) if (x >= seg.x0 && x <= seg.x1) return surfaceHeight(this.world, seg, x, z); return null; }
  _place(obj, x, z, sink = 0, parent = this.decor) { const y = this.ground(x, z); if (y === null || y < WATER_Y + 0.25) return false; obj.position.set(x, y - sink, z); parent.add(obj); return true; }

  _decorate() {
    const L = this.level, D = L.decor, r = rng(4100 + L.index * 31), forest = !!D.forest;
    const cliffs = []; for (const seg of L.terrain) for (let i = 0; i < seg.pts.length - 1; i++) if (seg.pts[i + 1][0] - seg.pts[i][0] < 0.3 && Math.abs(seg.pts[i + 1][1] - seg.pts[i][1]) > 1.5) cliffs.push(seg.pts[i + 1][0]);
    const houses = (D.village || []).map((h) => h[0]);
    const keepOut = (x, z) => cliffs.some((c) => Math.abs(x - c) < 2.2) || (D.menuZone && x > D.menuZone[0] && x < D.menuZone[1] && z > -9) || (z > -9.5 && houses.some((h) => Math.abs(x - h) < 3.2))
      || (D.castle && x > D.castle - 15 && x < D.castle + 15 && z > -24) || (L.signs || []).some((s) => Math.abs(x - s.x) < 1.6 && z > -4.5) || (L.flags || []).some((f) => Math.abs(x - f) < 1.2 && z > -4.5);
    for (const seg of L.terrain) {
      for (let x = seg.x0 + 1.5; x < seg.x1 - 1.5; x += r.range(forest ? 1.6 : 2.4, forest ? 3.0 : 4.4)) {
        const z = -r.range(4.3, 15), roll = r();
        if (roll < (forest ? 0.72 : 0.45)) { if (!keepOut(x, z)) this._place(makePine(r, r.range(0.75, 1.25) * (z < -10 ? 1.25 : 1)), x, z, 0.1); }
        else if (roll < 0.8) { if (!keepOut(x, z)) this._place(makeSnowBush(r, r.range(0.8, 1.6)), x, z, 0.12); }
        else if (!keepOut(x, z)) this._place(makeSnowRock(r, r.range(0.4, 1.0)), x, z, 0.2);
        if (r() < (this.lite ? 0.35 : 0.8)) { const zz = -r.range(15, 22), xx = x + r.range(-1, 1); if (!keepOut(xx, zz)) this._place(makePine(r, r.range(1.1, 1.6)), xx, zz, 0.1); }
        if (r() < 0.35) { const zz = -r.range(3.0, 3.8), xx = x + r.range(-1, 1); if (!keepOut(xx, zz)) this._place(makeSnowBush(r, r.range(0.4, 0.7)), xx, zz, 0.1); }
        if (r() < 0.3) this._place(makeSnowRock(r, r.range(0.25, 0.55)), x + r.range(-1, 1), r.range(3.4, 5.4), 0.08);
      }
      for (const [ex, s] of [[seg.x0 + 0.5, -1], [seg.x1 - 0.5, 1]]) for (let k = 0; k < (this.lite ? 2 : 4); k++) { const rk = makeSnowRock(r, r.range(0.6, 1.4)); rk.position.set(ex + s * r.range(0.2, 1.4), r.range(-1.5, -0.5), r.range(-9, 7)); if (Math.abs(rk.position.z) < 2.8) rk.position.y -= 1.2; this.decor.add(rk); }
    }
    for (const [x, z, v] of D.village || []) { const h = makeHouse(this.assets, v); h.rotation.y = r.range(-0.15, 0.15); this._place(h, x, z, 0.1); }
    if (D.village) for (const x of [9, 70, 124]) { const sm = makeSnowman(r); this._place(sm, x, -3.7, 0.05); }
    else { const sm = makeSnowman(r); this._place(sm, L.spawn.x + 6, -4.0, 0.05); }
    const magic = L.stars.find((s) => s.magic); if (magic && !D.castle) { const gy = this.ground(magic.x - 0.4, -2.2) ?? 0; const pine = makePine(rng(9), Math.max(1, (magic.y + 1.2 - gy) / 7.5)); this._place(pine, magic.x - 0.4, -2.2, 0.1); }
  }

  _props() {
    const L = this.level, A = this.assets; this.platforms = [];
    for (const p of L.platforms) {
      const icy = p.kind === 'floe' || p.kind === 'icebridge' || p.kind === 'icestep', gy = this.world.heightAt(p.x) ?? -3;
      const g = icy ? makeIcePlatform(A, p) : p.kind === 'bridge' ? makeBridge(A, p) : makePlatform(A, p, Math.min(gy, p.y - 0.5));
      if (!icy) { const snowTop = new THREE.Mesh(new THREE.BoxGeometry(p.w * 0.96, 0.06, p.kind === 'bridge' ? 3.0 : 3.2), new THREE.MeshStandardMaterial({ color: '#f6f9ff', roughness: 0.9 })); snowTop.position.y = 0.01; snowTop.scale.z = 0.35; snowTop.position.z = -1.0; g.add(snowTop); }
      g.position.set(p.x, p.y, 0); (p.move ? this.scene : this.decor).add(g); this.platforms.push({ p, g });
    }
    if (L.decor.castle) { this.castle = makeIceCastle(A); this.castle.position.set(L.decor.castle, (this.world.heightAt(L.decor.castle) ?? 2.8) - 0.05, -10); this.castle.scale.setScalar(1.25); this.scene.add(this.castle);
      // an ice path from the lane up to the castle gate
      const path = new THREE.Mesh(new THREE.PlaneGeometry(5, 8.4).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#cdeefa', map: A.textures.iceCracks, roughness: 0.15, metalness: 0.1 })); path.position.set(L.decor.castle, (this.world.heightAt(L.decor.castle) ?? 2.8) + 0.02, -5.4); this.scene.add(path); }
    else { const arch = makeIceArch(A); arch.position.set(L.finishX, this.world.heightAt(L.finishX), -0.3); arch.rotation.y = 0.5; this.decor.add(arch); }
    this.flags = (L.flags || []).map((x) => { const f = makeFlag(A); f.position.set(x, this.world.heightAt(x) ?? 0, -2.7); f.rotation.y = -0.25; this.scene.add(f); return f; });
    if (!L.decor.castle) for (const dz of [-2.6, 2.4]) { const f = makeFlag(A); f.position.set(L.finishX + 0.4, this.world.heightAt(L.finishX), dz); this.scene.add(f); this.flags.push(f); }
    else for (const dx of [-7.5, 7.5]) { const x = L.decor.castle + dx; const f = makeFlag(A); f.scale.setScalar(1.25); f.position.set(x, this.world.heightAt(x) ?? 2.8, -6.5); this.scene.add(f); this.flags.push(f); }
    for (const s of L.signs || []) { const g = makeSignpost(A, s.text, s.char || null); g.position.set(s.x, this.world.heightAt(s.x) ?? 0, -2.3); this.decor.add(g); }
    this.checkpoints = L.checkpoints.map((c) => { const g = makeCheckpoint(A); g.position.set(c.x, this.world.heightAt(c.x) ?? c.y, -1.9); this.scene.add(g); return g; });
  }

  _actors() {
    const L = this.level, A = this.assets;
    this.stars = L.stars.map((s, i) => { const g = makeStar(A, s.magic); g.position.set(s.x, s.y, 0); g.userData.phase = i * 0.7; this.scene.add(g); return g; });
    this.footprints = (L.footprints || []).map((f, i) => { const g = makeFootprintBadge(A); g.position.set(f.x, f.y, 0); g.userData.phase = i * 1.3; this.scene.add(g); return g; });
    this.rolling = L.rollingCoconuts.map((c) => { const g = makeSnowball(c.r); this.scene.add(g); return { c, g }; });
    this.penguins = (L.penguins || []).map((d) => { const g = makePenguin(); const y = this.ground(d.x, d.z) ?? 0; const def = { ...d, y }; g.position.set(d.x, y, d.z); this.scene.add(g); return { g, def }; });
    this.seals = (L.seals || []).map((d) => { const g = makeSeal(); const def = { ...d, y: WATER_Y + 0.2 }; g.position.set(d.x, def.y, d.z); g.rotation.y = d.x % 2 ? 0.5 : -0.4; this.scene.add(g); return { g, def }; });
    // compatibility with the engine (tropical-only features are empty here)
    this.crabs = []; this.falling = []; this.rushes = [];
  }

  reset() {
    for (const s of this.stars) { s.visible = true; s.userData.gone = 0; }
    for (const f of this.footprints) { f.visible = true; f.userData.gone = 0; }
    for (const c of this.checkpoints) c.userData.active = 0;
    this.celebrating = false; this.castleK = 0;
  }
  collectStar(i) { const s = this.stars[i]; s.userData.gone = 1e-4; this.effects.sparkle(s.position.x, s.position.y, s.userData.magic ? '#ffb3d6' : '#ffe08a', s.userData.magic ? 26 : 9); }
  collectFootprint(i) { const f = this.footprints[i]; f.userData.gone = 1e-4; this.effects.sparkle(f.position.x, f.position.y, '#9fc8ff', 18); }
  activateCheckpoint(i) { const c = this.checkpoints[i]; c.userData.active = 1e-4; this.effects.sparkle(c.position.x, c.position.y + 2.6, '#ffe08a', 12, c.position.z); }
  bounceCrab() {}
  rushStarPos() { return { x: 0, y: 0 }; }
  /** The island lights up and every animal cheers (finish / reward). */
  celebrate(on = true) { this.celebrating = on; }
  /** Animals close to x (for friendly sounds). */
  animalsNear(x, d = 6) { return { penguin: this.penguins.some((p) => Math.abs(p.g.position.x - x) < d), seal: this.seals.some((s) => Math.abs(s.g.position.x - x) < d) }; }
  dispose() { this.scene.traverse((o) => { if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose()); }); const sm = this.lights.sun.shadow.map; if (sm) sm.dispose(); }

  update(t, dt, player, camera, sim) {
    this.time += dt; const T = this.time, w = this.world, L = this.level, cx = camera.position.x;
    for (const { p, g } of this.platforms) if (p.move) { const q = w.platformPos(p, t); g.position.set(q.x, q.y, 0); if (p.kind === 'floe') g.rotation.z = Math.sin(T * 1.3 + p.x) * 0.025; }
    for (const rc of this.rolling) { const k = w.rollingCoconut(rc.c, t); rc.g.visible = k.active; if (k.active) { rc.g.position.set(k.x, k.y, 0); rc.g.rotation.z = -k.roll * Math.sign(rc.c.x1 - rc.c.x0); rc.g.scale.setScalar(Math.min(1, k.k * 8, (1 - k.k) * 8)); } }
    for (const s of this.stars) {
      const u = s.userData; if (!s.visible) continue; const i = this.stars.indexOf(s);
      if (u.gone > 0) { u.gone += dt * 4; s.scale.setScalar((u.magic ? 1.7 : 1) * Math.max(0, 1 - u.gone) * (1 + u.gone * 1.5)); s.position.y += dt * 3; if (u.gone >= 1) { s.visible = false; s.position.y = L.stars[i].y; s.scale.setScalar(u.magic ? 1.7 : 1); } continue; }
      if (Math.abs(s.position.x - cx) > 45) continue;
      u.mesh.rotation.y = T * 1.8 + u.phase; s.position.y = L.stars[i].y + Math.sin(T * 2.2 + u.phase) * 0.12; u.glow.material.opacity = (u.magic ? 0.4 : 0.5) + Math.sin(T * 3 + u.phase) * 0.12;
    }
    this.footprints.forEach((f, i) => { const u = f.userData; if (!f.visible) return;
      if (u.gone > 0) { u.gone += dt * 3; f.scale.setScalar(Math.max(0, 1 - u.gone) * (1 + u.gone)); f.position.y += dt * 3; if (u.gone >= 1) { f.visible = false; f.position.y = L.footprints[i].y; f.scale.setScalar(1); } return; }
      f.rotation.y = T * 1.6 + u.phase; f.position.y = L.footprints[i].y + Math.sin(T * 2 + u.phase) * 0.12; u.glow.material.opacity = 0.45 + Math.sin(T * 3 + u.phase) * 0.15; });
    for (const c of this.checkpoints) { const u = c.userData; if (u.active > 0 && u.active < 1) u.active = Math.min(1, u.active + dt * 1.6);
      u.flag.position.y = 1.0 + 1.75 * (1 - Math.pow(1 - u.active, 3)); u.flag.material.color.setScalar(0.6 + 0.4 * u.active); u.flag.rotation.y = Math.sin(T * 2.6 + c.position.x) * 0.22 - 0.1; }
    for (const f of this.flags) if (Math.abs(f.position.x - cx) < 40) waveFlag(f, T);
    const mode = this.celebrating ? 'cheer' : 'walk';
    for (const p of this.penguins) if (Math.abs(p.g.position.x - cx) < 45 || this.celebrating) updatePenguin(p.g, p.def, T, dt, mode);
    for (const s of this.seals) if (Math.abs(s.g.position.x - cx) < 50 || this.celebrating) updateSeal(s.g, s.def, T, dt, this.celebrating ? 'cheer' : 'rest');
    if (this.castle) { const k = sim ? sim.starCount / sim.regularStars : 0; this.castleK += ((this.celebrating ? 1 : k * 0.5) - this.castleK) * Math.min(1, dt * 2); lightCastle(this.castle, this.castleK); }
    if (this.celebrating) { this.sky.setAurora(Math.min(1.6, this.skyDef.aurora + 0.6)); if (Math.random() < dt * 6) this.effects.sparkle(player.x + (Math.random() - 0.5) * 10, player.y + 3 + Math.random() * 4, Math.random() > 0.5 ? '#9fffd0' : '#c9b8ff', 4); }
    else this.sky.setAurora(this.skyDef.aurora);
    this.sky.update(T); this.clouds.update(dt); this.ocean.update(T, camera); this.effects.update(dt);
    this.snow.update(T, camera, this.pixelScale || 1); this.sky.mesh.position.copy(camera.position);
  }
}
