// UI system: the four interfaces (main menu, gameplay HUD, character selection,
// level complete) plus settings, pause, world list and story captions.
import { CHARACTER_ASSETS } from '../assets/characters.js';
import { CHARACTER_STATS, OTHER } from '../characters/stats.js';
import { BRAND } from '../assets/brand.js';
import { COUPON_CLAIM_URL, REWARD_COPY, couponReady } from '../reward/rewardConfig.js';
import { LEVELS } from '../level/levels/index.js';

const $ = (id) => document.getElementById(id);
const BASE = ['loading', 'menu', 'story', 'hud', 'complete', 'reward'];
const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export class UISystem {
  /** @param handlers { play, select(id), pause, resume, restart, quit, replay, settingChanged(key,val), resetProgress, skipIntro, click } */
  constructor(save, handlers) {
    this.save = save; this.h = handlers; this.overlays = []; this.selected = save.data.selected; this._hint = null;
    const on = (id, fn) => $(id).addEventListener('click', () => { this.h.click?.(); fn(); });
    on('btnPlay', () => this.h.play()); on('btnLevels', () => this.open('worlds')); on('btnChars', () => this.open('select')); on('btnSettings', () => this.open('settings'));
    on('btnSelectBack', () => this.close()); on('btnSelectPlay', () => { this.close(); this.h.play(); });
    on('btnSettingsClose', () => this.close()); on('btnReset', () => { this.h.resetProgress(); this.refreshMenu(); $('btnReset').textContent = 'PROGRESS RESET'; });
    on('btnPause', () => this.h.pause()); on('btnResume', () => this.h.resume()); on('btnRestart', () => this.h.restart()); on('btnPauseSettings', () => this.open('settings')); on('btnQuit', () => this.h.quit());
    on('btnReplay', () => this.h.replay()); on('btnNext', () => this.h.next()); on('btnCompleteMenu', () => this.h.quit()); on('btnWorldsBack', () => this.close()); on('btnSkip', () => this.h.skipIntro());
    // settings controls
    const tog = (id, key) => { const el = $(id); const paint = () => el.setAttribute('aria-checked', String(!!save.settings[key])); paint(); el.addEventListener('click', () => { save.setSetting(key, !save.settings[key]); paint(); this.h.settingChanged(key, save.settings[key]); this.h.click?.(); }); };
    tog('setMusic', 'music'); tog('setSfx', 'sfx'); tog('setOutfit', 'outfit');
    document.querySelectorAll('[data-brand]').forEach((im) => { im.src = BRAND[im.dataset.brand]; });   // official HANG TEN logo artwork
    on('btnMyReward', () => this.h.showReward()); on('btnRewardMenu', () => this.h.quit()); on('btnRewardReplay', () => this.h.playLevel(0));
    const seg = (id, key) => { const el = $(id), paint = () => [...el.children].forEach((b) => b.classList.toggle('on', b.dataset.v === save.settings[key])); paint();
      el.addEventListener('click', (e) => { const v = e.target.dataset?.v; if (!v) return; save.setSetting(key, v); paint(); this.h.settingChanged(key, v); this.h.click?.(); }); };
    seg('setQuality', 'quality'); seg('setTouch', 'touch');
    this._cards(); this._worlds(); this.refreshMenu();
  }
  _cards() {
    const wrap = $('cards'); wrap.innerHTML = '';
    for (const c of Object.values(CHARACTER_ASSETS)) {
      const st = CHARACTER_STATS[c.id], jump = st.jumpHeight + (st.doubleHeight || 0);
      const b = document.createElement('button'); b.className = 'card'; b.dataset.id = c.id;
      const meter = (label, v) => `<div class="meter"><span>${label}</span><i><b style="width:${Math.round(v * 100)}%"></b></i></div>`;
      b.innerHTML = `<img src="${c.portrait}" alt="${c.name}"><div><h3>${c.name}</h3><p class="who">${c.personality}</p><ul>${c.abilities.map((a) => `<li>${a}</li>`).join('')}</ul>
        ${meter('Speed', st.speed / 9)}${meter('Jump', st.jumpHeight / 4.8)}${meter('Air', st.airAccel / 60)}</div>`;
      b.addEventListener('click', () => { this.selected = c.id; this.save.setSelected(c.id); this.h.select(c.id); this.h.click?.(); this._paintCards(); });
      wrap.appendChild(b);
    }
    this._paintCards();
  }
  _paintCards() { for (const b of $('cards').children) { const on = b.dataset.id === this.selected; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); } }
  /** Level select: the eight levels of World 1 with their best results; later levels unlock one by one. */
  _worlds() {
    const wrap = $('worldList'); wrap.innerHTML = '';
    LEVELS.forEach((L, i) => {
      const rec = this.save.level(L.id), open = this.save.isUnlocked(LEVELS, i), d = document.createElement('button'); d.className = 'world ' + (open ? 'open' : 'locked'); d.disabled = !open; d.dataset.level = L.index;
      const stars = rec?.completed ? '★'.repeat(rec.rating) + '☆'.repeat(3 - rec.rating) : open ? 'Play' : 'Locked';
      d.innerHTML = `<b>${L.index}</b><strong>${L.name}</strong><em class="diff">${L.difficulty}</em><span>${L.teaches}</span><span class="tag">${stars}</span>` + (rec?.completed ? `<small>Best ${rec.bestScore.toLocaleString('en-US')}${rec.magic ? ' · ✦' : ''}</small>` : '');
      if (open) d.addEventListener('click', () => { this.h.click?.(); this.h.playLevel(i); });
      wrap.appendChild(d);
    });
    $('worldsNote').textContent = this.save.rewardEarned ? 'All four levels cleared – your reward is waiting in the main menu!' : 'Clear all four levels to unlock the final HANG TEN reward!';
  }
  refreshMenu() {
    const i = this.save.nextIndex(LEVELS), L = LEVELS[i], done = LEVELS.filter((l) => this.save.level(l.id)?.completed).length;
    $('btnPlay').textContent = done === 0 ? 'PLAY' : done === LEVELS.length ? 'PLAY AGAIN' : `PLAY · LEVEL ${L.index}`;
    $('menuFoot').textContent = `Winter Wonderland — ${done} of ${LEVELS.length} levels cleared`; $('btnMyReward').hidden = !this.save.rewardEarned; this._worlds();
  }

  /** Final reward screen. The claim button only works when COUPON_CLAIM_URL is a real https link. */
  reward(t) {
    $('rwHaha').src = CHARACTER_ASSETS.haha.portrait; $('rwNini').src = CHARACTER_ASSETS.nini.portrait;
    $('rwTotals').textContent = `★ ${t.stars} / ${t.total} stars  ·  👣 ${t.footprints} / ${t.footprintsTotal} footprints  ·  ${t.score.toLocaleString('en-US')} pts`;
    const btn = $('btnClaim'), ready = couponReady(COUPON_CLAIM_URL);
    if (ready) { btn.href = COUPON_CLAIM_URL.trim(); btn.removeAttribute('aria-disabled'); btn.tabIndex = 0; $('claimNote').textContent = ''; }
    else { btn.removeAttribute('href'); btn.setAttribute('aria-disabled', 'true'); btn.tabIndex = -1; $('claimNote').textContent = `${REWARD_COPY.pendingZh} · ${REWARD_COPY.pendingEn}`; }
    btn.dataset.ready = String(ready);
    this.base('reward');
  }
  base(name) { for (const n of BASE) $(n).classList.toggle('show', n === name); this.closeAll(); this.current = name; }
  open(name) { if (name === 'worlds') this._worlds(); this.overlays.push(name); const el = $(name); el.style.zIndex = String(20 + this.overlays.length); el.classList.add('show'); if (name === 'select') this._paintCards(); }   // newest overlay always on top (e.g. Settings opened from Pause)
  close() { const n = this.overlays.pop(); if (n) { $(n).classList.remove('show'); $(n).style.zIndex = ''; } }
  closeAll() { while (this.overlays.length) this.close(); }
  get overlayOpen() { return this.overlays.length > 0; }

  loading(f) { $('loadBar').style.width = Math.round(f * 100) + '%'; }
  story(text) { $('storyText').textContent = text; }
  rush(r) {
    const el = $('rush'); if (!r) { if (this._rush) { el.classList.remove('on'); this._rush = false; } return; }
    this._rush = true; el.classList.add('on'); el.classList.toggle('hurry', r.left < 3); $('rushTime').textContent = r.left.toFixed(1); $('rushCount').textContent = `${r.got}/${r.total}`;
  }
  setHud({ stars, total, magic, progress, char, level, fp = 0, fpTotal = 0 }) {
    if (this._fp !== fp || this._fpT !== fpTotal) { $('hudFp').textContent = fp; $('hudFpTotal').textContent = '/' + fpTotal; this._fp = fp; this._fpT = fpTotal; }
    if (this._level !== level) { $('hudLevel').textContent = 'L' + level; this._level = level; }
    if (this._stars !== stars) { $('hudStars').textContent = stars; if (this._stars !== undefined && stars > this._stars) { const p = $('hudStars').parentElement; p.classList.remove('bump'); void p.offsetWidth; p.classList.add('bump'); } this._stars = stars; }
    if (this._total !== total) { $('hudTotal').textContent = '/' + total; this._total = total; }
    if (this._magic !== magic) { $('hudMagic').classList.toggle('on', magic); this._magic = magic; }
    const pr = Math.round(progress * 1000) / 10; if (this._pr !== pr) { $('hudFill').style.width = pr + '%'; $('hudMarker').style.left = `calc((100% - 1.6em) * ${pr / 100})`; this._pr = pr; }
    if (this._char !== char) { $('hudMarker').src = CHARACTER_ASSETS[char].portrait; $('switchImg').src = CHARACTER_ASSETS[OTHER[char]].portrait; const s = $('tSwitch'); s.classList.remove('spin'); void s.offsetWidth; s.classList.add('spin'); this._char = char; }
  }
  hint(text) { if (text === this._hint) return; this._hint = text; const el = $('hint'); if (text) { el.textContent = text; el.classList.add('on'); } else el.classList.remove('on'); }
  toast(text) { const el = $('toast'); el.textContent = text; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); }
  touchVisible(v) { $('touch').classList.toggle('on', v); $('keys').style.display = v ? 'none' : ''; }
  keysFade(v) { $('keys').classList.toggle('fade', v); }
  complete(sc, isBest, best, L, hasNext) {
    $('resKicker').textContent = `Level ${L.index} complete`; $('resTitle').textContent = hasNext ? `${L.name} cleared!` : 'Sunny Beach shines again!';
    $('resStars').textContent = `${sc.stars} / ${sc.totalStars}`; $('resMagic').textContent = sc.magic ? 'Found! +1000' : 'Not found yet'; $('resFp').textContent = `${sc.footprints || 0} / ${sc.totalFootprints || 0}`; $('resTime').textContent = fmtTime(sc.time); $('resScore').textContent = sc.total.toLocaleString('en-US');
    $('resRushRow').style.display = sc.totalRushes ? '' : 'none'; $('resRush').textContent = `${sc.rushes} / ${sc.totalRushes}`;
    $('btnNext').textContent = hasNext ? 'NEXT LEVEL' : 'ALL LEVELS';
    $('resBest').textContent = isBest ? 'New best score!' : best ? `Best: ${best.toLocaleString('en-US')}` : '';
    const stars = [...$('rating').children]; stars.forEach((s) => s.classList.remove('on')); this.base('complete');
    stars.forEach((s, i) => setTimeout(() => s.classList.toggle('on', i < sc.rating), 350 + i * 320));
    this.refreshMenu();
  }
}
