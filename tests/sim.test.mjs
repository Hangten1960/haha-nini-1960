// Headless QA for the gameplay core. Run with: npm test
import { WORLD01 } from '../src/level/world01.js';
import { LEVELS } from '../src/level/levels/index.js';
import { Simulation } from '../src/core/Simulation.js';
import { Bot } from '../src/dev/Bot.js';
import { PHYS as P } from '../src/config.js';
import { World } from '../src/physics/World.js';

let failed = 0;
const check = (name, ok, extra = '') => { console.log(`${ok ? '  PASS' : '  FAIL'}  ${name} ${extra}`); if (!ok) failed++; };
const run = (sim, seconds, inputFn) => { const all = []; for (let i = 0; i < seconds / P.STEP; i++) { const ev = sim.step(inputFn(i, sim) || { dir: 0 }); all.push(...ev); } return all; };
const place = (sim, x, char) => { const s = sim.player; s.char = char; s.x = x; s.y = sim.world.heightAt(x); s.vx = s.vy = 0; s.grounded = true; s.ground = { type: 'terrain' }; s.jumps = 0; };

console.log('Movement & jumping');
{ const sim = new Simulation(WORLD01, 'haha'); run(sim, 1, () => ({ dir: 1 })); const xh = sim.player.x;
  const sim2 = new Simulation(WORLD01, 'nini'); run(sim2, 1, () => ({ dir: 1 }));
  check('both bears move right', xh > 6 && sim2.player.x > 4, `haha ${xh.toFixed(2)} nini ${sim2.player.x.toFixed(2)}`);
  check('HAHA is faster on the ground', xh > sim2.player.x + 1);
  run(sim, 1, () => ({ dir: -1 })); check('moves left', sim.player.x < xh);
  const apex = (char, dbl) => { const s = new Simulation(WORLD01, char); let top = 0, re = false;
    run(s, 2.5, (i, m) => { top = Math.max(top, m.player.y); const p = m.player; let press = i === 0; if (dbl && !re && i > 5 && p.vy < 0.3) { re = true; press = true; } return { dir: 0, jumpPressed: press, jumpHeld: true }; }); return top; };
  const hj = apex('haha', false), nj = apex('nini', false), nd = apex('nini', true), hd = apex('haha', true);
  check('HAHA single jump ≈ 4.5', Math.abs(hj - 4.5) < 0.1, hj.toFixed(2));
  check('NINI single jump ≈ 2.3', Math.abs(nj - 2.3) < 0.1, nj.toFixed(2));
  check('NINI double jump goes higher (≈ 3.5)', nd > nj + 1 && Math.abs(nd - 3.5) < 0.15, nd.toFixed(2));
  check('HAHA has no double jump', Math.abs(hd - hj) < 0.01);
  const s = new Simulation(WORLD01, 'haha'); let top = 0; run(s, 2, (i, m) => { top = Math.max(top, m.player.y); return { jumpPressed: i === 0, jumpHeld: i < 6 }; });
  check('short press = short hop (variable jump)', top < 2.2 && top > 0.5, top.toFixed(2));
  const fall = (hold) => { const s = new Simulation(WORLD01, 'nini'); let n = 0; let re = false; run(s, 4, (i, m) => { const p = m.player; if (!p.grounded) n++; let press = i === 0; if (!re && i > 5 && p.vy < 0.3) { re = true; press = true; } return { jumpPressed: press, jumpHeld: hold || i < 60 }; }); return n * P.STEP; };
  check('NINI floats when jump is held', fall(true) > fall(false) + 0.6, `${fall(true).toFixed(2)}s vs ${fall(false).toFixed(2)}s`);
}
console.log('Character gates');
{ const tryCliff = (char) => { let ok = false; for (let d = 0; d < 60 && !ok; d += 3) { const sim = new Simulation(WORLD01, char); place(sim, 113, char); let re = false;
      run(sim, 4, (i, m) => { const p = m.player; let press = i === d; if (!re && i > d + 5 && p.vy < 0.3 && !p.grounded) { re = true; press = true; } return { dir: 1, jumpPressed: press, jumpHeld: true }; }); if (sim.player.y > 4.5 && sim.player.x > 120) ok = true; }
    if (!ok) for (let start = 112; start < 119.5 && !ok; start += 0.25) { const sim = new Simulation(WORLD01, char); place(sim, start, char); let re = false;
      run(sim, 3, (i, m) => { const p = m.player; let press = i === 0; if (!re && i > 5 && p.vy < 0.3 && !p.grounded) { re = true; press = true; } return { dir: 1, jumpPressed: press, jumpHeld: true }; }); if (sim.player.y > 4.5 && sim.player.x > 120) ok = true; }
    return ok; };
  check('HAHA clears the tall cliff', tryCliff('haha'));
  check('NINI cannot clear the tall cliff', !tryCliff('nini'));
  const tryGap = (char) => { let wins = 0, tries = 0; for (let start = 186; start < 196; start += 0.2) { tries++; const sim = new Simulation(WORLD01, char); place(sim, 190, char); let re = false, pressed = false;
      run(sim, 6, (i, m) => { const p = m.player; let press = false; if (!pressed && p.x >= start + 0 && p.grounded && p.x > 195.9 - (196 - start) * 0.2) { pressed = true; press = true; }
        if (!pressed && p.x >= 195.95) { pressed = true; press = true; }
        if (pressed && !re && p.vy < 0.3 && !p.grounded) { re = true; press = true; } return { dir: 1, jumpPressed: press, jumpHeld: true }; });
      if (sim.player.x > 207.2 && sim.falls === 0) wins++; } return { wins, tries }; };
  const ng = tryGap('nini'), hg = tryGap('haha');
  check('NINI floats across the wide gap', ng.wins > 0, `${ng.wins}/${ng.tries}`);
  check('HAHA cannot cross the wide gap', hg.wins === 0, `${hg.wins}/${hg.tries}`);
}
console.log('Systems');
{ const sim = new Simulation(WORLD01, 'haha'); const ev = run(sim, 3, () => ({ dir: 1 }));
  check('stars are collected and counted', sim.starCount >= 3 && ev.filter((e) => e.type === 'star').length === sim.starCount, `${sim.starCount}`);
  check('score increases with stars', sim.score().total > 0 && sim.score().stars === sim.starCount);
  const e2 = []; sim.switchCharacter(e2); check('character switching', sim.player.char === 'nini' && e2[0].type === 'switch');
  const sim3 = new Simulation(WORLD01, 'haha'); place(sim3, 57, 'haha'); const ev3 = run(sim3, 4, () => ({ dir: 1 }));
  check('falling in the sea triggers respawn at spawn', ev3.some((e) => e.type === 'splash') && ev3.some((e) => e.type === 'respawn') && sim3.falls >= 1);
  const sim4 = new Simulation(WORLD01, 'haha'); place(sim4, 62.5, 'haha'); run(sim4, 0.6, () => ({ dir: 1 })); const cp = sim4.checkpoint;
  place(sim4, 65.5, 'haha'); const ev4 = run(sim4, 3, (i, m) => ({ dir: m.falls ? 0 : 1 }));
  check('checkpoint activates and is used for respawn', cp === 0 && ev4.some((e) => e.type === 'respawn') && Math.abs(sim4.player.x - 63.8) < 0.5, `cp ${cp} x ${sim4.player.x.toFixed(1)}`);
  const w = new World(WORLD01); const m1 = WORLD01.platforms.find((p) => p.id === 'm1');
  const sim5 = new Simulation(WORLD01, 'nini'); const s5 = sim5.player; const p0 = w.platformPos(m1, 0); s5.x = p0.x; s5.y = p0.y + 0.5; s5.grounded = false; s5.ground = null;
  run(sim5, 0.5, () => ({ dir: 0 })); const off = s5.x - w.platformPos(m1, sim5.t).x; const xa = s5.x;
  run(sim5, 1.5, () => ({ dir: 0 })); const pNow = w.platformPos(m1, sim5.t);
  check('moving platform carries the bear', s5.grounded && Math.abs(s5.x - pNow.x - off) < 0.02 && Math.abs(s5.x - xa) > 1, `carried ${(s5.x - xa).toFixed(2)}`);
  const sim6 = new Simulation(WORLD01, 'haha'); const s6 = sim6.player; s6.x = w.crabX(WORLD01.crabs[0], 0); s6.y = 3; s6.grounded = false; s6.ground = null; let top = 0;
  const ev6 = run(sim6, 1.5, (i, m) => { top = Math.max(top, m.player.y); return { dir: 0 }; });
  check('crab bounce launches the bear', ev6.some((e) => e.type === 'crabBounce') && top > 5.5, top.toFixed(2));
  const sim7 = new Simulation(WORLD01, 'haha'); const c = WORLD01.fallingCoconuts[0]; place(sim7, c.x, 'haha'); const ev7 = run(sim7, 4, () => ({ dir: 0 }));
  check('falling coconut bonks (no death)', ev7.some((e) => e.type === 'bonk') && sim7.falls === 0);
}
console.log('Winter mechanics');
{ check('exactly four winter levels', LEVELS.length === 4 && LEVELS.map((l) => l.index).join() === '1,2,3,4');
  const W2 = LEVELS[1], slide = (x, char) => { const sim = new Simulation(W2, char), s = sim.player; s.x = x; s.y = sim.world.heightAt(x); run(sim, 1.2, () => ({ dir: 1 })); const x0 = s.x; run(sim, 2, () => ({ dir: 0 })); return s.x - x0; };
  const iceSlide = slide(14.5, 'haha'), snowSlide = slide(2, 'haha');
  check('ice is slippery: the bear keeps sliding after letting go', iceSlide > snowSlide * 3 && iceSlide < 8, `ice ${iceSlide.toFixed(2)} vs snow ${snowSlide.toFixed(2)}`);
  const sim = new Simulation(LEVELS[0], 'haha'), ev = []; const f = LEVELS[0].footprints[0]; sim.player.x = f.x; sim.player.y = f.y - 1; sim.player.grounded = false; sim.player.ground = null; sim.step({ dir: 0 }, ev);
  check('footprint collectibles are counted and scored', ev.some((e) => e.type === 'footprint') && sim.score().footprints === 1);
  check('levels 1–2 have no character gates, 3–4 have one HAHA cliff and one NINI gap', LEVELS.map((L) => L.hints.filter((h) => h.char).map((h) => h.char).sort().join('+')).join(',') === ',,haha+nini,haha+nini');
}
console.log('All four levels – autoplay bot (must finish from either starting bear)');
const times = {};
for (const L of LEVELS) for (const start of ['haha', 'nini']) {
  const sim = new Simulation(L, start), bot = new Bot(sim); const ev = []; let maxX = 0;
  while (!sim.finished && sim.t < 420) { const inp = bot.next(); if (inp.switch) sim.switchCharacter(ev); sim.step(inp, ev); maxX = Math.max(maxX, sim.player.x); }
  const sc = sim.score(); times[L.id + start] = sim.t;
  check(`L${L.index} ${L.name} – start ${start}`, sim.finished, `time ${sim.t.toFixed(0)}s stars ${sc.stars}/${sc.totalStars} rush ${sc.rushes}/${sc.totalRushes} falls ${sc.falls} bonks ${sc.bonks} switches ${sim.switches} maxX ${maxX.toFixed(0)}`);
  const gated = L.hints.some((h) => h.char); if (gated) check('   needs both bears', sim.switches >= 1, `${sim.switches}`);
}
console.log('Level sanity');
for (const L of LEVELS) {
  const w = new World(L); const bad = [];
  for (const c of L.checkpoints) { const h = w.heightAt(c.x); if (h === null) bad.push(`checkpoint ${c.x} over water`); }
  if (w.heightAt(L.finishX) === null) bad.push('finish over water'); if (w.heightAt(L.spawn.x) === null) bad.push('spawn over water');
  for (const c of L.crabs) for (const dx of [-c.amp - 0.7, c.amp + 0.7]) { const h = w.heightAt(c.x + dx); if (h === null || Math.abs(h - c.y) > 0.05) bad.push(`crab ${c.id} not on flat ground`); }
  if (L.stars.filter((s) => s.magic).length !== 1) bad.push('needs exactly one magic star');
  check(`L${L.index} data is consistent (${L.stars.length - 1} stars, ${L.checkpoints.length} checkpoints, ${Math.round(L.finishX)} long)`, bad.length === 0, bad.join('; '));
}
console.log('Star Rush challenges are winnable by BOTH bears (randomised bot search; reports the winning time)');
for (const L of LEVELS) L.challenges.forEach((c, i) => { for (const ch of ['haha', 'nini']) {
  let best = null, tries = 0, bestGot = 0;
  for (; tries < 150 && best === null; tries++) {
    const sim = new Simulation(L, ch), bot = new Bot(sim), s = sim.player, w = sim.world; const ev = []; bot.noise = tries === 0 ? 0 : 3; bot.starWeight = 6; bot.progressWeight = tries % 2 ? 0.3 : 0.1;
    s.x = c.trigger.x - 1.5; s.y = w.heightAt(s.x); let done = false, t0 = null;
    while (sim.t < c.duration + 6 && !done) { const inp = bot.next(); sim.step(inp, ev); for (const e of ev) { if (e.type === 'rushStart' && e.index === i && t0 === null) t0 = sim.t; if (e.type === 'rushWon' && e.index === i) { best = sim.t - t0; done = true; } if ((e.type === 'rushFail' && e.index === i) || e.type === 'splash') done = true; } ev.length = 0; }
    bestGot = Math.max(bestGot, sim.challenges[i].got.size);
  }
  check(`L${L.index} rush ${i + 1} as ${ch}`, best !== null, best !== null ? `won in ${best.toFixed(1)}s of ${c.duration}s (attempt ${tries})` : `best ${bestGot}/${c.stars.length}`);
} });
console.log('Footprints per level: ' + LEVELS.map((L) => (L.footprints || []).length).join(', '));
console.log('Difficulty curve (bot clear time, seconds): ' + LEVELS.map((L) => `L${L.index} ${Math.round(Math.max(times[L.id + 'haha'], times[L.id + 'nini']))}`).join('  '));
console.log(failed ? `\n${failed} FAILED` : '\nALL PASSED'); process.exit(failed ? 1 : 0);
