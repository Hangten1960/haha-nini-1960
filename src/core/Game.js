// Game engine: owns the renderer, the fixed-step loop and the game-state machine
// (menu → intro → playing ⇄ paused → finishing → complete) and wires the systems together.
import * as THREE from 'three';
import { PHYS } from '../config.js';
import { clamp, damp } from './util.js';
import { Simulation } from './Simulation.js';
import { LEVELS } from '../level/levels/index.js';
import { WinterLevelManager as LevelManager } from '../level/winter/WinterLevelManager.js';
import { W_SUN as SUN_DIR } from '../level/winter/winterEnv.js';
import { CameraController } from '../camera/CameraController.js';
import { CHARACTER_ASSETS } from '../assets/characters.js';
import { CHARACTER_STATS, OTHER } from '../characters/stats.js';
import { createCharacterVisual } from '../characters/createCharacterVisual.js';
import { ANIM, deriveAnim } from '../characters/AnimationStates.js';
import { Bot } from '../dev/Bot.js';

const STORY = ['One snowy night, a winter storm scattered the island’s magical stars…', '…and the polar island began to lose its sparkle.', 'HAHA and NINI bundle up to bring the winter stars home!'];
const FOLLOW_DELAY = 0.5, FOLLOW_Z = -1.35;

export class Game {
  constructor({ canvas, ui, audio, save, assets, input, opts = {} }) {
    Object.assign(this, { canvas, ui, audio, save, assets, input, opts });
    this.state = 'loading'; this.acc = 0; this.time = 0; this.landTimer = 0; this.landImpact = 0; this.trail = []; this.followOffset = 0; this.stateT = 0;
    this.perf = { t: 0, frames: 0, level: 0 }; this.fxT = 0; this.keysT = 0;
  }
  /** Phone profile: chosen automatically on touch / small screens when Graphics = Auto, or with Graphics = Low. */
  get phone() { const q = this.save.settings.quality; return q === 'low' || (q === 'auto' && (this.coarse || Math.min(innerWidth, innerHeight) < 520)); }
  async init(progress = () => {}) {
    const coarse = matchMedia('(pointer: coarse)').matches; this.coarse = coarse;
    const tick = () => new Promise((r) => setTimeout(r, 0));          // let the loading bar repaint between heavy steps
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!this.opts.capture });
    const r = this.renderer; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.02; r.shadowMap.type = THREE.PCFSoftShadowMap;
    this.camera = new THREE.PerspectiveCamera(36, 16 / 9, 0.5, 1400); this.cam = new CameraController(this.camera);
    this.visuals = {};
    for (const id of ['haha', 'nini']) this.visuals[id] = await createCharacterVisual(CHARACTER_ASSETS[id], this.assets, { outfit: this.save.settings.outfit !== false });
    this.blobs = ['haha', 'nini'].map(() => { const m = new THREE.Mesh(new THREE.CircleGeometry(0.55, 24), new THREE.MeshBasicMaterial({ color: '#4d6185', transparent: true, opacity: 0.32, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.renderOrder = 1; return m; });
    (window.__boot = window.__boot || {}).visuals = Math.round(performance.now()); progress(0.8); await tick();
    this.loadLevel(this.opts.level ?? this.save.nextIndex(LEVELS)); addEventListener('resize', () => this.resize());
    (window.__boot = window.__boot || {}).level = Math.round(performance.now()); progress(0.9); await tick();
    document.addEventListener('visibilitychange', () => { if (document.hidden && this.state === 'playing') this.pause(); });
    this.toMenu(); this.cam.update(0, this.sim.player);
    (window.__boot = window.__boot || {}).menu = Math.round(performance.now());
    try { await this.renderer.compileAsync(this.scene, this.camera); } catch { /* older browsers: shaders compile on the first frame instead */ }
    (window.__boot = window.__boot || {}).compiled = Math.round(performance.now()); progress(1);
    if (this.opts.capture) { window.__advance = (dt) => this.frame(dt); } else { let last = performance.now(); const loop = (now) => { const dt = Math.min(0.05, (now - last) / 1000); last = now; this.frame(dt); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
  }

  /** Winter outfit (jacket + scarf) is optional: rebuilds both bears with or without it. */
  async setOutfit(on) {
    for (const id of ['haha', 'nini']) { const old = this.visuals[id], v = await createCharacterVisual(CHARACTER_ASSETS[id], this.assets, { outfit: on });
      v.root.position.copy(old.root.position); v.root.visible = old.root.visible; this.scene.remove(old.root); old.dispose(); this.scene.add(v.root); this.visuals[id] = v; }
  }

  // ---------- levels ----------
  /** Builds the 3D scene and a fresh simulation for one level (the previous level is disposed). */
  loadLevel(i) {
    i = clamp(i, 0, LEVELS.length - 1);
    if (this.level) { for (const v of Object.values(this.visuals)) this.scene.remove(v.root); this.level.dispose(); }
    this.levelIndex = i; this.levelDef = LEVELS[i];
    this.scene = new THREE.Scene();
    this.sim = new Simulation(this.levelDef, this.ui.selected || this.save.data.selected);
    this.level = new LevelManager(this.scene, this.assets, this.sim.world, { shadows: !this.phone, lite: this.phone });
    for (const v of Object.values(this.visuals)) this.scene.add(v.root);
    for (const b of this.blobs) this.scene.add(b);
    this.trail.length = 0; this.applyQuality();
  }
  /** Start (or restart) a level by index. */
  playLevel(i) { if (!this.save.isUnlocked(LEVELS, i)) return false; this.ui.closeAll(); this.audio.duck(false); if (i !== this.levelIndex) this.loadLevel(i); this.play(); return true; }
  nextLevel() { if (this.levelIndex + 1 < LEVELS.length) this.playLevel(this.levelIndex + 1); else this.ui.open('worlds'); }

  // ---------- quality / layout ----------
  applyQuality() {
    const q = this.save.settings.quality, phone = this.phone, low = phone || this.perf.level >= 2, dpr = window.devicePixelRatio || 1;
    // phones: render at ≤1.25× and drop to 1× if the frame rate is low; real-time shadows are replaced by soft blob shadows
    let pr = q === 'low' ? 1 : Math.min(dpr, q === 'high' ? 2 : phone ? 1.25 : 2); if (q === 'auto' && this.perf.level >= 1) pr = Math.max(1, pr - 0.5);
    if (this.opts.capture) pr = 1;
    this.renderer.setPixelRatio(pr);
    const shadows = !low; this.renderer.shadowMap.enabled = shadows; const sun = this.level.lights.sun; sun.castShadow = shadows;
    for (const b of this.blobs) b.visible = !shadows;
    const size = q === 'high' || (!this.coarse && q === 'auto') ? 2048 : 1024; if (sun.shadow.mapSize.x !== size) { sun.shadow.mapSize.set(size, size); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
    this.scene.traverse((o) => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { m.needsUpdate = true; }); });
    this.lowQuality = low; this.updateColour(true); this.resize();
  }
  /** The canvas fills its stage (the whole screen on phones; a centred landscape frame on very wide/tall desktop windows). */
  resize() { const st = this.canvas.parentElement.getBoundingClientRect(), w = Math.max(1, Math.round(st.width)), h = Math.max(1, Math.round(st.height)); this.viewH = h; this.renderer.setSize(w, h, false); this.cam.resize(w / h); }
  /** The island regains its colours as stars come home. */
  updateColour(force) {
    const f = this.state === 'menu' || this.state === 'loading' ? 1 : this.sim.starCount / this.sim.regularStars, done = this.state === 'finishing' || this.state === 'complete';
    const sat = this.lowQuality || this.phone ? null :   /* a CSS filter on the canvas is expensive on phones */ (done ? 1.12 : 0.74 + 0.34 * f).toFixed(2);
    if (force || sat !== this._sat) { this.canvas.style.filter = sat ? `saturate(${sat})` : ''; this._sat = sat; }
  }
  touchUpdate() { const s = this.save.settings.touch; this.ui.touchVisible(s === 'on' || (s === 'auto' && (this.coarse || this.input.touchUsed || navigator.maxTouchPoints > 0))); }

  // ---------- state changes ----------
  setState(s) { this.state = s; this.stateT = 0; }
  toMenu() {
    const want = this.save.nextIndex(LEVELS); if (want !== this.levelIndex && this.opts.level === undefined) this.loadLevel(want);   // menu backdrop = the level PLAY will start
    this.setState('menu'); this.ui.base('menu'); this.ui.refreshMenu(); this.cam.setMode('menu'); this.audio.duck(false); this.updateColour(true); this.level.celebrate(false);
    const y = this.sim.world.heightAt(4);
    this.visuals.haha.root.position.set(3.5, y, 0); this.visuals.nini.root.position.set(5.6, y, 0.25); this.visuals.haha.root.visible = this.visuals.nini.root.visible = true;
    this.level.reset();
  }
  play() {
    this.audio.unlock(); this.audio.startMusic();
    this.sim.reset(this.ui.selected); this.level.reset(); this.audio.startAmbience(); this.trail.length = 0; this.followOffset = 0; this.landTimer = 0; this.bot = this.opts.autoplay ? new Bot(this.sim) : null;
    this.story = this.levelIndex === 0 ? STORY : [`Level ${this.levelDef.index} · ${this.levelDef.name}`, this.levelDef.teaches];
    this.cam.introDur = this.levelIndex === 0 ? 4.2 : 2.6;
    this.cam.setMode('intro'); this.setState('intro'); this.ui.base('story'); this.ui.story(this.story[0]); this.input.clearEdges(); this.updateColour(true); this.placeIdlePair();
    if (this.opts.skipIntro) this.beginPlay();
  }
  placeIdlePair() { const p = this.sim.player, o = OTHER[p.char]; this.visuals[p.char].root.position.set(p.x, p.y, 0); this.visuals[o].root.position.set(p.x - 1.5, this.sim.world.heightAt(p.x - 1.5), FOLLOW_Z); this.visuals.haha.root.visible = this.visuals.nini.root.visible = true; }
  beginPlay() { this.setState('playing'); this.cam.setMode('follow'); this.cam.snapTo(this.sim.player); this.ui.base('hud'); this.touchUpdate(); this.keysT = 0; this.ui.keysFade(false); this.input.clearEdges(); this.syncHud(); }
  pause() { if (this.state !== 'playing') return; this.setState('paused'); this.ui.open('pause'); this.audio.duck(true); }
  resume() { if (this.state !== 'paused') return; this.ui.closeAll(); this.setState('playing'); this.audio.duck(false); this.input.clearEdges(); }
  restart() { this.ui.closeAll(); this.audio.duck(false); const skip = this.opts.skipIntro; this.opts.skipIntro = true; this.play(); this.opts.skipIntro = skip; }
  quit() { this.ui.closeAll(); this.toMenu(); }
  syncHud() {
    const s = this.sim; this.ui.setHud({ stars: s.starCount, total: s.regularStars, magic: s.magic, progress: s.progress, char: s.player.char, level: this.levelDef.index, fp: s.footprints.size, fpTotal: (this.levelDef.footprints || []).length });
    const i = s.challenges.findIndex((c) => c.state === 'active');
    this.ui.rush(i < 0 ? null : { left: Math.max(0, s.challenges[i].end - s.t), got: s.challenges[i].got.size, total: this.levelDef.challenges[i].stars.length });
  }

  // ---------- gameplay events → sound, particles, UI ----------
  handle(ev) {
    const p = this.sim.player, fx = this.level.effects, A = this.audio;
    for (const e of ev) switch (e.type) {
      case 'jump': A.play('jump', { rate: p.char === 'nini' ? 1.2 : 1 }); fx.dust(p.x, p.y, 4); break;
      case 'doubleJump': A.play('doubleJump'); fx.petals(p.x, p.y, 8); break;
      case 'land': if (e.speed > 4) { A.play(p.onIce || (p.ground && p.ground.ref && p.ground.ref.ice) ? 'iceLand' : 'land', { strength: clamp(e.speed / 16, 0.35, 1) }); fx.dust(p.x, p.y, e.speed > 10 ? 8 : 4); } this.landTimer = e.speed > 9 ? 0.16 : 0.07; this.landImpact = e.speed; break;
      case 'star': A.play('star'); this.level.collectStar(e.index); this.updateColour(); break;
      case 'magicStar': A.play('magicStar'); this.level.collectStar(e.index); this.ui.toast('Hidden Magic Star!'); break;
      case 'switch': A.play('switch'); for (const id of ['haha', 'nini']) { const v = this.visuals[id]; v.popIn(); fx.sparkle(v.root.position.x, v.root.position.y + 1.1, id === 'nini' ? '#ffc9dd' : '#ffe08a', 7, v.root.position.z); } this.swapRoles(); break;
      case 'crabBounce': A.play('bounce'); this.level.bounceCrab(e.index); fx.dust(p.x, p.y, 5); break;
      case 'crabBump': A.play('bump'); break;
      case 'bonk': A.play('bonk'); fx.sparkle(p.x, p.y + 2.1, '#fff3c4', 6); break;
      case 'splash': A.play('splash'); fx.splash(e.x, -0.95); this.visuals[p.char].root.visible = false; break;
      case 'respawn': this.visuals[p.char].root.visible = true; this.visuals[p.char].popIn(); this.trail.length = 0; this.cam.snapTo(p); fx.sparkle(p.x, p.y + 1, '#ffffff', 8); break;
      case 'checkpoint': A.play('checkpoint'); this.level.activateCheckpoint(e.index); break;
      case 'rushStart': A.play('checkpoint'); this.ui.toast('Star Rush!'); break;
      case 'rushStar': { A.play('star'); const q = this.level.rushStarPos(e.index, e.star); fx.sparkle(q.x, q.y, '#9fefff', 8); break; }
      case 'rushWon': A.play('magicStar'); this.ui.toast('Star Rush complete! +500'); fx.sparkle(p.x, p.y + 2, '#9fefff', 22); break;
      case 'rushFail': A.play('bump'); this.ui.toast('Time is up – touch the ring to retry'); break;
      case 'footprint': A.play('footprint'); this.level.collectFootprint(e.index); this.ui.toast('HANG TEN footprint found! +250'); break;
      case 'finish': this.finish(); break;
    }
  }
  /** After a switch the two bears trade places: the new leader stands where the player is. */
  swapRoles() { const p = this.sim.player, lead = this.visuals[p.char].root, fol = this.visuals[OTHER[p.char]].root; const fp = lead.position.clone(); lead.position.set(p.x, p.y, 0); fol.position.copy(fp); this._swapFrom = fp; this._swapT = 0.25; }
  /** Reopen the reward screen from the menu (only once it has been earned). */
  showReward() { if (!this.save.rewardEarned) return false; this.ui.closeAll(); this.level.celebrate(true); this.ui.reward(this.save.totals(LEVELS)); return true; }
  get isFinalLevel() { return this.levelIndex === LEVELS.length - 1; }
  finish() {
    this.setState('finishing'); this.cam.setMode('finish'); this.ui.hint(null); this.ui.keysFade(true); this.updateColour(true);
    this.level.celebrate(true); this.audio.play(this.isFinalLevel ? 'castle' : 'victory');
    const cx = this.levelDef.decor.castle; this.cam.grand = this.isFinalLevel && cx ? { x: cx, y: this.sim.world.heightAt(cx) ?? this.sim.player.y } : null;
    const p = this.sim.player; this.level.effects.sparkle(p.x, p.y + 2.4, '#ffe08a', 24);
  }
  showComplete() {
    const id = this.levelDef.id, sc = this.sim.score(), prev = this.save.level(id)?.bestScore || 0, best = this.save.recordRun(id, sc); this.setState('complete');
    // the dedicated reward screen appears ONLY when Level 4 (the final level) has just been completed
    if (this.isFinalLevel) { this.save.earnReward(); this.ui.reward(this.save.totals(LEVELS)); this.audio.play('rewardFanfare'); }
    else this.ui.complete(sc, best, Math.max(prev, sc.total), this.levelDef, this.levelIndex + 1 < LEVELS.length);
  }

  // ---------- main loop ----------
  frame(dt) {
    this.time += dt; this.stateT += dt; const sim = this.sim, p = sim.player;
    if (this.state === 'intro') {
      const per = this.levelIndex === 0 ? 1.9 : 1.6; this.ui.story(this.story[Math.min(this.story.length - 1, Math.floor(this.stateT / per))]);
      if (this.stateT > Math.max(this.cam.introDur + 1.4, per * this.story.length) || this.input.takeAny()) this.beginPlay();
    } else if (this.state === 'playing') {
      if (this.input.takePause()) this.pause();
      else {
        this.acc += dt; const ev = [];
        while (this.acc >= PHYS.STEP) {
          this.acc -= PHYS.STEP;
          let inp; if (this.bot) { inp = this.bot.next(); if (inp.switch) sim.switchCharacter(ev); } else { inp = this.input.read(); if (this.input.takeSwitch()) sim.switchCharacter(ev); }
          sim.step(inp, ev);
        }
        this.handle(ev); this.syncHud(); this.ambience(dt);
        const h = this.levelDef.hints.find((z) => p.x >= z.x0 && p.x <= z.x1); this.ui.hint(h && this.state === 'playing' ? h.text : null);
        this.keysT += dt; if (this.keysT > 9) this.ui.keysFade(true);
        if (this.input.touchUsed && !this._touchShown) { this._touchShown = true; this.touchUpdate(); }
        this.adaptive(dt);
      }
    } else if (this.state === 'finishing') {
      this.acc += dt; while (this.acc >= PHYS.STEP) { this.acc -= PHYS.STEP; sim.step({ dir: 0 }); }
      if (Math.random() < dt * 8) this.level.effects.sparkle(p.x + (Math.random() - 0.5) * 5, p.y + 2 + Math.random() * 3, Math.random() > 0.5 ? '#ffe08a' : '#ffc9dd', 3);
      if (this.stateT > (this.isFinalLevel ? 4.2 : 2.8)) this.showComplete();
    } else if (this.state === 'paused') { if (this.input.takePause()) { if (this.ui.overlays.length > 1) this.ui.close(); else this.resume(); } }
    else if (this.state === 'menu' || this.state === 'complete') this.input.clearEdges();

    if (this.state !== 'paused') { this.updateCharacters(dt); this.updateBlobs(); }
    const camT = this.state === 'paused' ? 0 : dt;
    this.cam.update(camT, p);
    if (this.debugCam) { this.camera.position.set(...this.debugCam.pos); this.camera.lookAt(...this.debugCam.look); }   // QA close-ups
    const sun = this.level.lights.sun, fx = Math.round(this.camera.position.x); sun.target.position.set(fx, 0, 0); sun.position.set(fx + SUN_DIR.x * 60, SUN_DIR.y * 60, SUN_DIR.z * 60);
    this.level.pixelScale = this.renderer.getPixelRatio() * this.viewH / 720;
    this.level.update(sim.t, camT, this.state === 'menu' ? { x: -99 } : p, this.camera, sim);
    if (!this.noRender) this.renderer.render(this.scene, this.camera);
  }
  /** QA helper: run the game logic forward without drawing. */
  fastForward(seconds, dt = 1 / 30) { this.noRender = true; for (let i = 0; i < seconds / dt; i++) this.frame(dt); this.noRender = false; this.frame(1e-4); }

  updateCharacters(dt) {
    const sim = this.sim, p = sim.player, V = this.visuals, T = this.time;
    if (this.state === 'menu') {
      const w = Math.floor(T / 3.2) % 2;
      V.haha.update(dt, { anim: w === 0 ? ANIM.WAVE : ANIM.IDLE, vx: 0, vy: 0, facing: 1, speedRef: 8 });
      V.nini.update(dt, { anim: w === 1 ? ANIM.WAVE : ANIM.IDLE, vx: 0, vy: 0, facing: -1, speedRef: 6 }); return;
    }
    const lead = V[p.char], fol = V[OTHER[p.char]], stats = CHARACTER_STATS[p.char];
    if (this.state === 'intro') { const wv = this.cam.introDur - 0.4; lead.update(dt, { anim: this.stateT > wv ? ANIM.WAVE : ANIM.IDLE, vx: 0, vy: 0, facing: 1, speedRef: 8 }); fol.update(dt, { anim: this.stateT > wv + 0.4 ? ANIM.WAVE : ANIM.IDLE, vx: 0, vy: 0, facing: 1, speedRef: 8 }); return; }
    this.landTimer = Math.max(0, this.landTimer - dt);
    const celebrate = this.state === 'finishing' || this.state === 'complete';
    const anim = deriveAnim(p, stats.speed, { landTimer: this.landTimer, celebrate });
    lead.root.position.set(p.x, p.y, 0);
    if (sim.respawnTimer <= 0) lead.root.visible = !(p.invuln > 0 && p.stun <= 0 && Math.floor(T * 14) % 2 === 0 && !celebrate);
    lead.update(dt, { anim, vx: p.vx, vy: p.vy, facing: p.facing, speedRef: stats.speed, gliding: p.gliding, landImpact: this.landImpact }); this.landImpact = 0;
    // ambient particles
    this.fxT -= dt;
    if (this.fxT <= 0 && this.state === 'playing') { if (p.gliding) { this.level.effects.petals(p.x, p.y + 0.6, 1); this.fxT = 0.07; } else if (anim === ANIM.RUN) { this.level.effects.dust(p.x - p.facing * 0.3, p.y, 1); this.fxT = 0.2; } }
    // companion: replays the leader's path a moment later, then settles beside them
    const now = sim.t; this.trail.push({ t: now, x: p.x, y: p.y, vx: p.vx, vy: p.vy, facing: p.facing, anim, gliding: p.gliding });
    while (this.trail.length > 2 && this.trail[1].t < now - FOLLOW_DELAY) this.trail.shift();
    const s = this.trail[0];
    if (celebrate) {
      const tx = p.x + 1.6, cur = fol.root.position; cur.x = damp(cur.x, tx, 5, dt); cur.y = damp(cur.y, this.sim.world.heightAt(tx) ?? p.y, 8, dt); cur.z = damp(cur.z, -0.4, 4, dt);
      fol.update(dt, { anim: Math.abs(cur.x - tx) > 0.3 ? ANIM.RUN : ANIM.CELEBRATE, vx: (tx - cur.x) * 5, vy: 0, facing: Math.sign(tx - cur.x) || -1, speedRef: 7 }); fol.root.visible = true; return;
    }
    const still = p.grounded && Math.abs(p.vx) < 0.4 && s.anim !== ANIM.JUMP && s.anim !== ANIM.FALL;
    let want = 0; if (still) { const gx = p.x - p.facing * 1.25, gh = this.sim.world.heightAt(gx); if (gh !== null && Math.abs(gh - p.y) < 0.3 && !(p.ground && p.ground.type === 'platform')) want = -p.facing * 1.25; }
    const before = this.followOffset; this.followOffset = damp(this.followOffset, want, 4, dt);
    const sideV = (this.followOffset - before) / Math.max(dt, 1e-4);
    let fxp = s.x + this.followOffset, fyp = s.y;
    if (this._swapT > 0) { this._swapT -= dt; const k = clamp(this._swapT / 0.25); fxp += (this._swapFrom.x - fxp) * k * 0; }
    fol.root.position.set(fxp, fyp, FOLLOW_Z); fol.root.visible = sim.respawnTimer <= 0;
    const fvx = s.vx + sideV, fanim = Math.abs(sideV) > 0.5 && (s.anim === ANIM.IDLE || s.anim === ANIM.LAND) ? ANIM.WALK : s.anim;
    fol.update(dt, { anim: fanim, vx: fvx, vy: s.vy, facing: Math.abs(sideV) > 0.5 ? Math.sign(sideV) : s.facing, speedRef: 7, gliding: s.gliding });
  }

  /** Friendly animal voices nearby, and the hiss of sliding on ice. */
  ambience(dt) {
    const p = this.sim.player; this._animalT = (this._animalT ?? 3) - dt; this._slideT = (this._slideT ?? 0) - dt;
    if (this._animalT <= 0) { const near = this.level.animalsNear(p.x, 7); this._animalT = 4 + Math.random() * 4;
      if (near.penguin && (!near.seal || Math.random() < 0.6)) this.audio.play('penguin'); else if (near.seal) this.audio.play('seal'); }
    if (p.grounded && p.onIce && Math.abs(p.vx) > 2 && this._slideT <= 0) { this.audio.play('iceSlide', { strength: Math.min(1, Math.abs(p.vx) / 8) }); this._slideT = 0.22; }
  }
  /** Soft round shadows under the bears (used when real-time shadows are off). */
  updateBlobs() {
    if (!this.blobs[0].visible) return;
    const w = this.sim.world, t = this.sim.t;
    ['haha', 'nini'].forEach((id, i) => {
      const v = this.visuals[id].root, b = this.blobs[i]; b.visible = v.visible;
      let gy = w.heightAt(v.position.x); if (gy !== null && gy > v.position.y + 0.3) gy = null;
      for (const p of w.level.platforms) { const q = w.platformPos(p, t); if (Math.abs(v.position.x - q.x) <= p.w / 2 && q.y <= v.position.y + 0.05 && (gy === null || q.y > gy)) gy = q.y; }
      if (gy === null) { b.visible = false; return; }
      const hgt = Math.max(0, v.position.y - gy), k = Math.max(0.35, 1 - hgt / 7);
      b.position.set(v.position.x + 0.1, gy + 0.03, v.position.z + 0.05); b.scale.set(k * 1.05, k * 0.8, 1); b.material.opacity = 0.32 * k;
    });
  }
  /** Auto quality: if the device struggles, step the resolution and shadows down. */
  adaptive(dt) {
    if (this.save.settings.quality !== 'auto' || this.opts.capture || this.perf.level >= 2) return;
    const pf = this.perf; pf.t += dt; pf.frames++;
    if (pf.t > 4) { const fps = pf.frames / pf.t; pf.t = 0; pf.frames = 0; if (fps < 40) { pf.level++; this.applyQuality(); } }
  }
}
