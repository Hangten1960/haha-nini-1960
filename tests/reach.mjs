// Every hidden footprint and magic star must be reachable by at least one bear (brute-force jump search).
import { LEVELS } from '../src/level/levels/index.js';
import { Simulation } from '../src/core/Simulation.js';
import { PHYS as P } from '../src/config.js';
let bad = 0;
function tryReach(L, item, kind) {
  for (const ch of ['haha', 'nini']) for (let dx = -4; dx <= 4; dx += 0.5) for (const dir of [1, -1, 0]) for (let delay = 0; delay < 40; delay += 8) {
    const sim = new Simulation(L, ch), s = sim.player, w = sim.world; const x = item.x + dx;
    let g = w.heightAt(x); let plat = null;
    for (const p of L.platforms) { const q = w.platformPos(p, 0); if (Math.abs(x - q.x) < p.w / 2 - 0.3 && q.y < item.y && (g === null || q.y > g)) { g = q.y; plat = p; } }
    if (g === null || g > item.y) continue;
    s.x = x; s.y = g + 0.01; s.grounded = false; s.ground = null;
    let re = false;
    for (let i = 0; i < 300; i++) {
      const press = i === delay || (ch === 'nini' && !re && i > delay + 5 && s.vy < 0.4 && !s.grounded && (re = true));
      const ev = sim.step({ dir: i > delay ? dir : 0, jumpPressed: press, jumpHeld: true });
      if (ev.some((e) => (kind === 'fp' && e.type === 'footprint') || (kind === 'magic' && e.type === 'magicStar'))) return `${ch} from ${dx >= 0 ? '+' : ''}${dx}`;
      if (sim.respawnTimer > 0) break;
    }
  }
  return null;
}
for (const L of LEVELS) {
  for (const f of L.footprints) { const r = tryReach(L, f, 'fp'); console.log((r ? '  PASS  ' : '  FAIL  ') + `L${L.index} footprint at ${f.x},${f.y}`, r || ''); if (!r) bad++; }
  const m = L.stars.find((s) => s.magic); const r = tryReach(L, m, 'magic'); console.log((r ? '  PASS  ' : '  FAIL  ') + `L${L.index} magic star at ${m.x},${m.y}`, r || ''); if (!r) bad++;
}
process.exit(bad ? 1 : 0);
