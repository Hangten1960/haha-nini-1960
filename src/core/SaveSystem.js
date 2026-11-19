// Local save (settings + progress) in localStorage, with an in-memory fallback
// for browsers / embeds where storage is blocked.
import { SAVE_KEY } from '../config.js';

const DEFAULTS = () => ({
  version: 1, selected: 'haha',
  settings: { music: true, sfx: true, quality: 'auto', touch: 'auto', outfit: true },
  reward: { earned: false, earnedAt: null },
  levels: {},          // { l1: { completed, bestScore, bestStars, magic, bestTime, rating }, … }
});
export class SaveSystem {
  constructor() { this.persistent = true; this.data = DEFAULTS(); this.load(); }
  load() {
    try { const raw = localStorage.getItem(SAVE_KEY); if (raw) { const d = JSON.parse(raw); this.data = { ...DEFAULTS(), ...d, settings: { ...DEFAULTS().settings, ...(d.settings || {}) } };
      if (d.worlds && d.worlds.w1 && !this.data.levels.l4) this.data.levels.l4 = d.worlds.w1;   // V1 save: the original level is now Level 4
      delete this.data.worlds; } }
    catch { this.persistent = false; }
  }
  save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.data)); } catch { this.persistent = false; } }
  get settings() { return this.data.settings; }
  setSetting(k, v) { this.data.settings[k] = v; this.save(); }
  setSelected(c) { this.data.selected = c; this.save(); }
  level(id) { return this.data.levels[id] || null; }
  /** A level is open when it is the first one, was already played, or the level before it is completed. */
  isUnlocked(levels, i) { return this.unlockAll || i === 0 || !!this.data.levels[levels[i].id]?.completed || !!this.data.levels[levels[i - 1].id]?.completed; }
  /** The level PLAY continues with: the first unlocked level that is not completed yet (or the last one). */
  nextIndex(levels) { for (let i = 0; i < levels.length; i++) if (!this.data.levels[levels[i].id]?.completed) return this.isUnlocked(levels, i) ? i : Math.max(0, i - 1); return levels.length - 1; }
  /** Records a finished run; returns true when it is a new best score. */
  recordRun(id, sc) {
    const prev = this.data.levels[id] || { bestScore: 0, bestStars: 0, magic: false, bestTime: null, rating: 0 };
    const best = sc.total > prev.bestScore;
    this.data.levels[id] = { completed: true, bestScore: Math.max(prev.bestScore, sc.total), bestStars: Math.max(prev.bestStars, sc.stars), magic: prev.magic || sc.magic,
      bestTime: prev.bestTime === null ? sc.time : Math.min(prev.bestTime, sc.time), rating: Math.max(prev.rating || 0, sc.rating), footprints: Math.max(prev.footprints || 0, sc.footprints || 0) };
    this.save(); return best;
  }
  /** Final reward: earned once Level 4 has been completed (kept locally so the screen can be reopened). */
  earnReward() { if (!this.data.reward?.earned) this.data.reward = { earned: true, earnedAt: new Date().toISOString() }; this.save(); }
  get rewardEarned() { return !!this.data.reward?.earned; }
  /** Totals over all levels (best runs). */
  totals(levels) { let stars = 0, total = 0, fp = 0, fpTotal = 0, score = 0; for (const L of levels) { const r = this.data.levels[L.id]; total += L.stars.filter((s) => !s.magic).length; fpTotal += (L.footprints || []).length; if (r) { stars += r.bestStars || 0; fp += r.footprints || 0; score += r.bestScore || 0; } } return { stars, total, footprints: fp, footprintsTotal: fpTotal, score }; }
  reset() { const s = this.data.settings; this.data = DEFAULTS(); this.data.settings = s; this.save(); }
}
