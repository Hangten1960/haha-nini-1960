// Collision world for a level. Pure logic (no rendering) so it runs in Node tests,
// in the look-ahead bot and in the game. All moving objects are functions of time.
const TAU = Math.PI * 2;
export class World {
  constructor(level) { this.level = level; }

  /** Sand height at x, or null over water. */
  heightAt(x) {
    let best = null;
    for (const seg of this.level.terrain) {
      if (x < seg.x0 || x > seg.x1) continue;
      const p = seg.pts;
      for (let i = 0; i < p.length - 1; i++) {
        if (x >= p[i][0] && x <= p[i + 1][0]) {
          const w = p[i + 1][0] - p[i][0];
          const h = w < 1e-6 ? Math.max(p[i][1], p[i + 1][1]) : p[i][1] + (p[i + 1][1] - p[i][1]) * (x - p[i][0]) / w;
          if (best === null || h > best) best = h;
        }
      }
    }
    return best;
  }
  /** Grip under the player: 1 = normal ground, lower = slippery (frozen river / ice floe). */
  gripAt(x, ground) {
    if (ground && ground.type === 'platform') return ground.ref.ice ? 0.45 : 1;
    for (const z of this.level.ice || []) if (x >= z[0] && x <= z[1]) return 0.22;
    return 1;
  }
  platformPos(p, t) {
    if (!p.move) return { x: p.x, y: p.y };
    const a = TAU * (t / p.move.period + p.move.phase);
    return { x: p.x + p.move.ax * Math.sin(a), y: p.y + p.move.ay * Math.sin(a) };
  }
  crabX(c, t) { return c.x + c.amp * Math.sin(TAU * (t / c.period + c.phase)); }
  crabDir(c, t) { return Math.cos(TAU * (t / c.period + c.phase)) >= 0 ? 1 : -1; }

  /** state: 'hang' (wobbling warning) | 'fall' | 'rest' (harmless) | 'gone' */
  fallingCoconut(c, t) {
    const HANG = 1.1, G = 22, REST = 0.9;
    const u = (((t + c.offset) % c.period) + c.period) % c.period;
    const fallT = Math.sqrt(2 * (c.top - c.ground - 0.4) / G);
    if (u < HANG) return { state: 'hang', y: c.top, k: u / HANG };
    if (u < HANG + fallT) { const s = u - HANG; return { state: 'fall', y: c.top - 0.5 * G * s * s, k: s / fallT }; }
    if (u < HANG + fallT + REST) return { state: 'rest', y: c.ground + 0.4, k: (u - HANG - fallT) / REST };
    return { state: 'gone', y: c.top, k: 0 };
  }
  rollingCoconut(c, t) {
    const u = (((t + c.offset) % c.period) + c.period) % c.period;
    const len = Math.abs(c.x1 - c.x0), dur = len / c.speed;
    if (u > dur) return { active: false };
    const x = c.x0 + Math.sign(c.x1 - c.x0) * c.speed * u;
    return { active: true, x, y: (this.heightAt(x) ?? 0) + c.r, roll: (c.speed * u) / c.r, k: u / dur };
  }
}
