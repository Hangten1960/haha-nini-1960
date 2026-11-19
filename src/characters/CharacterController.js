// Character controller: movement, jumping, double jump / float, collisions.
// Pure logic operating on a plain state object, stepped at a fixed rate.
import { PHYS as P } from '../config.js';
import { CHARACTER_STATS } from './stats.js';

export function createPlayerState(char, x, y) {
  return { char, x, y, vx: 0, vy: 0, facing: 1, grounded: true, ground: { type: 'terrain' },
    jumps: 0, coyote: 0, buffer: 0, cutOK: false, stun: 0, invuln: 0, gliding: false, airTime: 0 };
}
export const clonePlayer = (s) => ({ ...s, ground: s.ground });
const approach = (v, target, d) => (v < target ? Math.min(v + d, target) : Math.max(v - d, target));
const jumpSpeed = (h) => Math.sqrt(2 * P.G * h);

/** Advance the player by dt. `inp` = { dir:-1..1, jumpHeld, jumpPressed }. Pushes gameplay events into `ev`. */
export function stepPlayer(s, inp, world, t, dt, ev) {
  const st = CHARACTER_STATS[s.char], L = world.level;
  const wasGrounded = s.grounded;

  // ride moving platforms
  if (s.grounded && s.ground && s.ground.type === 'platform') {
    const a = world.platformPos(s.ground.ref, t - dt), b = world.platformPos(s.ground.ref, t);
    s.x += b.x - a.x; s.y = b.y;
  }
  s.stun = Math.max(0, s.stun - dt); s.invuln = Math.max(0, s.invuln - dt);
  s.coyote = Math.max(0, s.coyote - dt); s.buffer = Math.max(0, s.buffer - dt);

  // horizontal control
  const dir = s.stun > 0 ? 0 : Math.max(-1, Math.min(1, inp.dir || 0));
  if (s.stun <= 0) {
    const grip = s.grounded ? world.gripAt(s.x, s.ground) : 1; s.onIce = grip < 1;   // ice: slow to speed up, slow to stop
    if (dir !== 0) { s.vx = approach(s.vx, dir * st.speed, (s.grounded ? st.accel * grip : st.airAccel) * dt); s.facing = dir > 0 ? 1 : -1; }
    else s.vx = approach(s.vx, 0, (s.grounded ? st.accel * 1.3 * grip : st.airAccel * 0.4) * dt);
  } else s.vx = approach(s.vx, 0, 6 * dt);

  // jumping
  if (inp.jumpPressed) s.buffer = P.BUFFER;
  if (s.buffer > 0 && s.stun <= 0) {
    if (s.grounded || s.coyote > 0) {
      s.vy = jumpSpeed(st.jumpHeight); s.jumps = 1; s.grounded = false; s.ground = null; s.coyote = 0; s.buffer = 0; s.cutOK = true;
      ev.push({ type: 'jump' });
    } else if (st.doubleJump && s.jumps < 2) {
      s.vy = jumpSpeed(st.doubleHeight); s.jumps = 2; s.buffer = 0; s.cutOK = false;
      ev.push({ type: 'doubleJump' });
    }
  }
  if (s.cutOK && !inp.jumpHeld && s.vy > P.JUMP_CUT) { s.vy = P.JUMP_CUT; s.cutOK = false; }

  // gravity (+ NINI's petal float)
  s.gliding = false;
  if (!s.grounded) {
    s.vy -= P.G * dt;
    if (st.floatFall && inp.jumpHeld && s.vy < -st.floatFall && s.stun <= 0) { s.vy = -st.floatFall; s.gliding = true; }
    else if (st.floatFall && inp.jumpHeld && s.vy < 0 && s.stun <= 0) s.gliding = true;
    if (s.vy < -P.MAX_FALL) s.vy = -P.MAX_FALL;
  }

  // horizontal move, blocked by sand walls taller than a step
  let nx = s.x + s.vx * dt;
  if (s.vx !== 0) {
    const h = world.heightAt(nx + Math.sign(s.vx) * P.HALF_W);
    if (h !== null && h > s.y + P.STEP_UP) { nx = s.x; s.vx = 0; }
  }
  s.x = Math.max(L.minX, Math.min(L.maxX, nx));

  // vertical move + landing
  const prevY = s.y; let ny = s.y + s.vy * dt; let landed = null;
  if (s.vy <= 0) {
    let cand = null;
    for (const dx of [-0.26, 0, 0.26]) {
      const h = world.heightAt(s.x + dx);
      if (h !== null && prevY >= h - P.STEP_UP - 0.05 && (cand === null || h > cand)) cand = h;
    }
    if (cand !== null && (ny <= cand || (wasGrounded && s.ground && s.ground.type === 'terrain' && prevY - cand < 0.45))) {
      ny = cand; landed = { type: 'terrain' };
    }
    for (const p of L.platforms) {
      const a = world.platformPos(p, t - dt), b = world.platformPos(p, t);
      if (Math.abs(s.x - b.x) > p.w / 2 + 0.22) continue;
      if (prevY >= a.y - 0.08 && ny <= b.y && (!landed || b.y > ny)) { ny = b.y; landed = { type: 'platform', ref: p }; }
    }
  }
  if (landed) {
    if (!wasGrounded) ev.push({ type: 'land', speed: -s.vy });
    s.vy = 0; s.grounded = true; s.ground = landed; s.jumps = 0; s.cutOK = false; s.airTime = 0;
  } else {
    if (wasGrounded && s.vy <= 0) s.coyote = P.COYOTE;
    s.grounded = false; s.ground = null; s.airTime += dt;
    if (s.jumps === 0 && s.coyote <= 0) s.jumps = 1;   // walked off a ledge: NINI keeps her air jump
  }
  s.y = ny;

  // friendly crabs: bounce pad from above, gentle nudge from the side
  for (let i = 0; i < L.crabs.length; i++) {
    const c = L.crabs[i], cx = world.crabX(c, t), top = c.y + 0.75;
    if (Math.abs(s.x - cx) > 0.65 + P.HALF_W || s.y > top || s.y + P.HEIGHT < c.y) continue;
    if (s.vy < -0.5 && prevY >= top - 0.4) {
      s.vy = P.CRAB_BOUNCE; s.y = top; s.jumps = 1; s.cutOK = false; s.grounded = false; s.ground = null;
      ev.push({ type: 'crabBounce', index: i });
    } else if (s.invuln <= 0) {
      s.vx = (s.x >= cx ? 1 : -1) * 5; s.vy = 4.5; s.grounded = false; s.ground = null; s.stun = 0.25; s.invuln = 0.6;
      ev.push({ type: 'crabBump', index: i });
    }
  }
  // coconuts: a soft bonk and a little knock-back, nothing scary
  if (s.invuln <= 0) {
    const bonk = (cx, cy, r) => {
      const px = Math.max(s.x - P.HALF_W, Math.min(cx, s.x + P.HALF_W)), py = Math.max(s.y, Math.min(cy, s.y + P.HEIGHT));
      if ((px - cx) ** 2 + (py - cy) ** 2 > r * r) return false;
      s.vx = (s.x >= cx ? 1 : -1) * 6.5; s.vy = 7; s.grounded = false; s.ground = null; s.stun = 0.45; s.invuln = 1.3; s.jumps = 1;
      ev.push({ type: 'bonk' }); return true;
    };
    for (const c of L.fallingCoconuts) { const k = world.fallingCoconut(c, t); if (k.state === 'fall' && bonk(c.x, k.y, 0.42)) break; }
    if (s.invuln <= 0) for (const c of L.rollingCoconuts) { const k = world.rollingCoconut(c, t); if (k.active && bonk(k.x, k.y, c.r)) break; }
  }
}
