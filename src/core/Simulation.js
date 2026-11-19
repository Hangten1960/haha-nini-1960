// One play-through of a level: player, stars, checkpoints, respawn, finish, score.
// Pure logic – the Game renders it, the bot and the Node tests drive it headlessly.
import { PHYS as P } from '../config.js';
import { World } from '../physics/World.js';
import { createPlayerState, stepPlayer } from '../characters/CharacterController.js';
import { OTHER } from '../characters/stats.js';

export class Simulation {
  constructor(level, startChar = 'haha') {
    this.level = level; this.world = new World(level);
    this.reset(startChar);
  }
  reset(startChar = 'haha') {
    const sp = this.level.spawn;
    this.player = createPlayerState(startChar, sp.x, sp.y);
    this.t = 0; this.collected = new Set(); this.checkpoint = -1; this.respawnTimer = 0;
    this.finished = false; this.falls = 0; this.bonks = 0; this.switches = 0; this.magic = false; this.footprints = new Set();
    // timed 'Star Rush' challenges: idle → active (until `end`) → won, or back to idle to retry
    this.challenges = (this.level.challenges || []).map(() => ({ state: 'idle', end: 0, cool: 0, got: new Set() }));
  }
  get regularStars() { return this.level.stars.filter((s) => !s.magic).length; }
  get starCount() { let n = 0; for (const i of this.collected) if (!this.level.stars[i].magic) n++; return n; }
  get progress() { return Math.max(0, Math.min(1, (this.player.x - this.level.spawn.x) / (this.level.finishX - this.level.spawn.x))); }

  switchCharacter(ev) {
    const s = this.player;
    if (this.finished || this.respawnTimer > 0 || s.stun > 0) return false;
    s.char = OTHER[s.char]; this.switches++;
    if (s.jumps > 1) s.jumps = 1;
    ev.push({ type: 'switch', char: s.char }); return true;
  }
  /** Advance one fixed step. Returns the events of this step. */
  step(input, ev = []) {
    const dt = P.STEP, s = this.player, L = this.level;
    this.t += dt;
    if (this.finished) { stepPlayer(s, { dir: 0 }, this.world, this.t, dt, ev); return ev; }
    if (this.respawnTimer > 0) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        const cp = this.checkpoint >= 0 ? L.checkpoints[this.checkpoint] : L.spawn;
        Object.assign(s, createPlayerState(s.char, cp.x, this.world.heightAt(cp.x) ?? cp.y), { invuln: 1.2 });
        ev.push({ type: 'respawn' });
      }
      return ev;
    }
    const first = ev.length;
    stepPlayer(s, input, this.world, this.t, dt, ev);
    for (let i = first; i < ev.length; i++) if (ev[i].type === 'bonk') this.bonks++;   // count each bonk once, even when `ev` is shared across steps
    // stars
    for (let i = 0; i < L.stars.length; i++) {
      if (this.collected.has(i)) continue;
      const st = L.stars[i], r = st.magic ? 1.0 : 0.75;
      const px = Math.max(s.x - P.HALF_W, Math.min(st.x, s.x + P.HALF_W)), py = Math.max(s.y, Math.min(st.y, s.y + P.HEIGHT));
      if ((px - st.x) ** 2 + (py - st.y) ** 2 <= r * r) {
        this.collected.add(i); if (st.magic) this.magic = true;
        ev.push({ type: st.magic ? 'magicStar' : 'star', index: i });
      }
    }
    // hidden HANG TEN footprint collectibles
    const FP = this.level.footprints || [];
    for (let i = 0; i < FP.length; i++) {
      if (this.footprints.has(i)) continue; const f = FP[i];
      const px = Math.max(s.x - P.HALF_W, Math.min(f.x, s.x + P.HALF_W)), py = Math.max(s.y, Math.min(f.y, s.y + P.HEIGHT));
      if ((px - f.x) ** 2 + (py - f.y) ** 2 <= 0.8 * 0.8) { this.footprints.add(i); ev.push({ type: 'footprint', index: i }); }
    }
    // timed star challenges
    const CH = this.level.challenges || [];
    for (let i = 0; i < CH.length; i++) {
      const c = CH[i], st = this.challenges[i], hit = (o, r) => { const px = Math.max(s.x - P.HALF_W, Math.min(o.x, s.x + P.HALF_W)), py = Math.max(s.y, Math.min(o.y, s.y + P.HEIGHT)); return (px - o.x) ** 2 + (py - o.y) ** 2 <= r * r; };
      if (st.state === 'idle') { st.cool = Math.max(0, st.cool - dt); if (st.cool <= 0 && Math.abs(s.x - c.trigger.x) < 0.8 && s.y > c.trigger.y - 2.6 && s.y < c.trigger.y + 6) { /* the ring is a tall gate: impossible to miss */ st.state = 'active'; st.end = this.t + c.duration; st.got.clear(); ev.push({ type: 'rushStart', index: i }); } }
      else if (st.state === 'active') {
        for (let k = 0; k < c.stars.length; k++) if (!st.got.has(k) && hit(c.stars[k], 0.85)) { st.got.add(k); ev.push({ type: 'rushStar', index: i, star: k }); }
        if (st.got.size === c.stars.length) { st.state = 'won'; ev.push({ type: 'rushWon', index: i }); }
        else if (this.t >= st.end) { st.state = 'idle'; st.cool = 1.2; ev.push({ type: 'rushFail', index: i, got: st.got.size }); }
      }
    }
    // checkpoints
    for (let i = this.checkpoint + 1; i < L.checkpoints.length; i++) {
      if (s.x >= L.checkpoints[i].x && s.grounded) { this.checkpoint = i; ev.push({ type: 'checkpoint', index: i }); }
    }
    if (s.y < P.KILL_Y) { this.falls++; this.respawnTimer = P.RESPAWN_DELAY; s.vx = 0; s.vy = 0; ev.push({ type: 'splash', x: s.x }); }
    else if (s.x >= L.finishX && s.grounded) { this.finished = true; s.vx = 0; ev.push({ type: 'finish' }); }
    return ev;
  }
  /** Score: stars + hidden star + time bonus − coconut bonks. */
  score() {
    const stars = this.starCount, time = this.t;
    const timeBonus = Math.max(0, Math.round(((this.level.par || 240) - time) * 10));
    const rushes = this.challenges.filter((c) => c.state === 'won').length;
    const fps = this.footprints.size;
    const total = stars * 100 + (this.magic ? 1000 : 0) + fps * 250 + rushes * 500 + timeBonus - this.bonks * 50 - this.falls * 25;
    const frac = stars / this.regularStars;
    const rating = 1 + (frac >= 0.6 ? 1 : 0) + (frac >= 0.9 && this.magic ? 1 : 0);
    return { stars, totalStars: this.regularStars, magic: this.magic, footprints: fps, totalFootprints: (this.level.footprints || []).length, rushes, totalRushes: this.challenges.length, time, timeBonus, bonks: this.bonks, falls: this.falls, total: Math.max(0, total), rating };
  }
}
