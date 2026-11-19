// Look-ahead autoplay bot. Used for automated QA (can the level be finished?) and for
// recording gameplay demos. It simulates a handful of candidate moves a couple of
// seconds into the future with the real physics and picks the best one.
import { PHYS as P } from '../config.js';
import { clonePlayer, stepPlayer } from '../characters/CharacterController.js';
import { CHARACTER_STATS } from '../characters/stats.js';

const MACROS = [
  { name: 'run',   input: () => ({ dir: 1 }) },
  { name: 'hop',   input: (f) => ({ dir: 1, jumpPressed: f === 0, jumpHeld: f < 10 }) },
  { name: 'jump',  input: (f) => ({ dir: 1, jumpPressed: f === 0, jumpHeld: true }) },
  { name: 'double', nini: true, input: (f, s, mem) => {       // jump, re-press at the apex, then float
      if (f === 0) mem.re = false;
      const again = f > 4 && s.jumps === 1 && s.vy < 0.6 && !mem.re;
      if (again) mem.re = true;
      return { dir: 1, jumpPressed: f === 0 || again, jumpHeld: f < 2 || mem.re || s.vy > 0.6 }; } },
  { name: 'wait',  input: () => ({ dir: 0 }) },
  { name: 'step',  input: (f) => ({ dir: f < 7 ? 1 : 0 }) },                                            // inch forward
  { name: 'jumpA', input: (f) => ({ dir: f < 28 ? 1 : 0, jumpPressed: f === 0, jumpHeld: true }) },      // jump, then stop steering (shorter arc)
  { name: 'jumpB', input: (f) => ({ dir: f < 48 ? 1 : 0, jumpPressed: f === 0, jumpHeld: true }) },
  { name: 'hopA',  input: (f) => ({ dir: f < 22 ? 1 : 0, jumpPressed: f === 0, jumpHeld: f < 12 }) },
  { name: 'dbl',   nini: true, input: (f, s, mem) => {     // double jump without floating
      if (f === 0) mem.re = false; const again = f > 4 && s.jumps === 1 && s.vy < 0.6 && !mem.re; if (again) mem.re = true;
      return { dir: 1, jumpPressed: f === 0 || again, jumpHeld: s.vy > 0 }; } },
  { name: 'dblA',  nini: true, input: (f, s, mem) => {
      if (f === 0) mem.re = false; const again = f > 4 && s.jumps === 1 && s.vy < 0.6 && !mem.re; if (again) mem.re = true;
      return { dir: f < 60 ? 1 : 0, jumpPressed: f === 0 || again, jumpHeld: s.vy > 0 }; } },
  { name: 'back',  input: (f) => ({ dir: f < 30 ? -1 : 0 }) },
  { name: 'standjump', input: (f) => ({ dir: f < 20 ? 0 : 1, jumpPressed: f === 0, jumpHeld: true }) },
];

export class Bot {
  constructor(sim) { this.sim = sim; this.macro = null; this.frame = 0; this.mem = {}; this.stuckX = sim.player.x; this.stuckT = 0; this.cool = 0; }

  evaluate(macro) {
    const sim = this.sim, w = sim.world, s = clonePlayer(sim.player), mem = {};
    let t = sim.t, bonked = 0, stars = 0; const ev = [], seen = new Set();
    const H = 300;                                     // 2.5 s
    for (let f = 0; f < H; f++) {
      t += P.STEP; ev.length = 0;
      const inp = f < 170 || !s.grounded ? macro.input(f, s, mem) : { dir: 0 };
      stepPlayer(s, inp, w, t, P.STEP, ev);
      for (const e of ev) if (e.type === 'bonk') bonked++;
      if (s.y < P.KILL_Y) return -1e6 + s.x;
      if (f < 170) for (let i = 0; i < sim.level.stars.length; i++) {      // same look-ahead window for every move, so long floats are not over-rewarded
        if (sim.collected.has(i) || seen.has(i)) continue; const st = sim.level.stars[i];
        if (Math.abs(st.x - s.x) < 0.9 && st.y > s.y - 0.6 && st.y < s.y + P.HEIGHT + 0.6) { seen.add(i); stars++; }
      }
      if (f < 170) for (let c = 0; c < sim.challenges.length; c++) {            // Star Rush: touch idle rings, then chase the blue stars
        const cs = sim.challenges[c], cd = sim.level.challenges[c]; if (cs.state === 'won') continue;
        const near = (o) => Math.abs(o.x - s.x) < 0.85 && o.y > s.y - 0.5 && o.y < s.y + P.HEIGHT + 0.5;
        if (cs.state === 'idle' && !seen.has(900 + c) && cs.cool <= 0 && Math.abs(cd.trigger.x - s.x) < 0.8) { seen.add(900 + c); stars += 2; }
        if (cs.state === 'active' || seen.has(900 + c)) cd.stars.forEach((st, k) => { const key = 1000 + c * 100 + k; if (cs.got.has(k) || seen.has(key)) return; if (near(st)) { seen.add(key); stars += 3; } });
      }
      if (f > 150 && s.grounded) break;
    }
    if (!s.grounded) return -1e5 + s.x;                // still in the air: don't trust it
    return (s.x - sim.player.x) * (this.progressWeight ?? 1) + stars * (this.starWeight ?? 1.2) - bonked * 12;
  }

  /** Returns the input for this physics step. */
  next() {
    const sim = this.sim, s = sim.player;
    if (sim.respawnTimer > 0 || sim.finished) { this.macro = null; return { dir: 0 }; }
    // stuck? try the other bear (this is how the bot discovers the two character gates)
    this.stuckT += P.STEP; this.cool -= P.STEP;
    if (s.x > this.stuckX + 1.5) { this.stuckX = s.x; this.stuckT = 0; }
    if (s.x < this.stuckX - 12) this.stuckX = s.x;
    if (this.stuckT > 3.2 && s.grounded && this.cool <= 0) { this.stuckT = 0; this.cool = 4; this.macro = null; return { dir: 0, switch: true }; }

    if (!this.macro || (s.grounded && this.frame > 3 && this.frame % 6 === 0) || (this.macro.name === 'run' && this.frame % 4 === 0)) {
      if (s.grounded || !this.macro) {
        let best = null, bestScore = -Infinity;
        for (const m of MACROS) {
          if (m.nini && !CHARACTER_STATS[s.char].doubleJump) continue;
          let sc = this.evaluate(m);
          if (this.noise) sc += Math.random() * this.noise;
          if (m.name === 'run') sc += 0.15;              // prefer staying on the ground
          if (m.name === 'back') sc -= 2; if (m.name === 'step') sc -= 0.05;
          if (sc > bestScore) { bestScore = sc; best = m; }
        }
        if (best !== this.macro || !s.grounded) { this.macro = best; this.frame = 0; }
        else if (best.name !== 'run' && best.name !== 'wait') { this.frame = 0; }
      }
    }
    const inp = this.macro.input(this.frame, s, this.mem); this.frame++;
    return inp;
  }
}
