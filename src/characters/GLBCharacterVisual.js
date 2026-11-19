// Professional character slot: a rigged GLB with skeletal animation clips.
// Same interface as TempBearVisual ({ root, height, update(dt, state), popIn(), dispose() }),
// so the rest of the game does not know which one it is driving.
//
// NOTE: implemented but NOT yet exercised with real mascot models (none exist yet).
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { damp } from '../core/util.js';
import { ANIM } from './AnimationStates.js';

// If a clip is missing, fall back to the next best one.
const FALLBACK = { run: ['walk', 'idle'], walk: ['run', 'idle'], jump: ['fall', 'idle'], fall: ['jump', 'idle'], land: ['idle'], celebrate: ['wave', 'idle'], wave: ['idle'], idle: [] };
const ONE_SHOT = new Set([ANIM.JUMP, ANIM.LAND]);

export class GLBCharacterVisual {
  static async load(def) {
    const gltf = await new GLTFLoader().loadAsync(def.glb.url);
    return new GLBCharacterVisual(def, gltf);
  }
  constructor(def, gltf) {
    this.def = def; this.isTemporary = false;
    this.root = new THREE.Group(); this.model = gltf.scene; this.root.add(this.model);
    this.model.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
    // normalise size and put the feet on the origin
    const box = new THREE.Box3().setFromObject(this.model), size = box.getSize(new THREE.Vector3());
    const k = (def.glb.height || 2) / (size.y || 1); this.model.scale.setScalar(k);
    this.model.position.y = -box.min.y * k; this.height = def.glb.height || 2;
    this.mixer = new THREE.AnimationMixer(this.model); this.actions = {};
    const byName = Object.fromEntries(gltf.animations.map((c) => [c.name.toLowerCase(), c]));
    for (const [state, clipName] of Object.entries(def.glb.clips || {})) {
      const clip = byName[String(clipName).toLowerCase()];
      if (clip) { const a = this.mixer.clipAction(clip); if (ONE_SHOT.has(state)) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; } this.actions[state] = a; }
    }
    this.current = null; this.yaw = 0; this.pop = 0;
    this._play(ANIM.IDLE, 0);
  }
  _resolve(state) { if (this.actions[state]) return state; for (const f of FALLBACK[state] || []) if (this.actions[f]) return f; return Object.keys(this.actions)[0] || null; }
  _play(state, fade = 0.15) {
    const key = this._resolve(state); if (!key || key === this.current) return;
    const next = this.actions[key], prev = this.current && this.actions[this.current];
    next.reset().fadeIn(fade).play(); if (prev) prev.fadeOut(fade); this.current = key;
  }
  popIn() { this.pop = 1; }
  update(dt, s) {
    this._play(s.anim);
    const a = this.actions[this.current];
    if (a && (this.current === 'walk' || this.current === 'run')) a.timeScale = Math.max(0.4, Math.abs(s.vx) / (s.speedRef || 7));   // match feet to ground speed
    this.mixer.update(dt);
    const moving = Math.abs(s.vx) > 0.25 || s.anim === ANIM.JUMP || s.anim === ANIM.FALL;
    this.yaw = damp(this.yaw, (moving ? s.facing * 1.2 : s.facing * 0.35) + (this.def.glb.yawOffset || 0), 12, dt);
    this.model.rotation.y = this.yaw;
    this.pop = Math.max(0, this.pop - dt * 4); this.root.scale.setScalar(1 - 0.35 * this.pop * this.pop);
  }
  dispose() { this.mixer.stopAllAction(); this.root.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); }
}
