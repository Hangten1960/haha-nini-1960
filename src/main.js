// Entry point: creates the systems and hands them to the Game.
import './ui/ui.css';
import { AssetManager } from './assets/AssetManager.js';
import { SaveSystem } from './core/SaveSystem.js';
import { Input } from './core/Input.js';
import { AudioSystem } from './audio/AudioSystem.js';
import { UISystem } from './ui/UISystem.js';
import { Game } from './core/Game.js';

const q = new URLSearchParams(location.search);
const opts = { autoplay: q.has('autoplay'), capture: q.has('capture'), skipIntro: q.has('skipintro'), level: q.has('level') ? Number(q.get('level')) - 1 : undefined };

(async function boot() {
  const save = new SaveSystem(); save.unlockAll = q.has('unlock') || q.has('level');
  const input = new Input(), audio = new AudioSystem(save.settings), assets = new AssetManager();
  let game;
  const ui = new UISystem(save, {
    click: () => { audio.unlock(); audio.play('click'); },
    play: () => game.play(), select: () => {}, pause: () => game.pause(), resume: () => game.resume(), restart: () => game.restart(), quit: () => game.quit(), replay: () => game.restart(), next: () => game.nextLevel(), playLevel: (i) => game.playLevel(i), showReward: () => game.showReward(),
    skipIntro: () => game.beginPlay(), resetProgress: () => save.reset(),
    settingChanged: (k) => { if (k === 'music' || k === 'sfx') audio.applySettings(); if (k === 'quality') { game.perf.level = 0; game.applyQuality(); } if (k === 'touch') game.touchUpdate(); if (k === 'outfit') game.setOutfit(save.settings.outfit); },
  });
  // Landscape stage: full screen on phones / touch devices; on desktop windows that are extremely wide or tall the
  // stage is centred at a sane landscape ratio (the bands use the dark winter-night colour, never white).
  const stage = document.getElementById('stage');
  const layout = () => {
    const w = innerWidth, h = innerHeight, touch = matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
    let sw = w, sh = h; if (!touch) { if (w / h > 2.4) sw = Math.round(h * 2.4); else if (w / h < 4 / 3) sh = Math.round(w * 0.75); }
    Object.assign(stage.style, { width: sw + 'px', height: sh + 'px', left: Math.round((w - sw) / 2) + 'px', top: Math.round((h - sh) / 2) + 'px' });
    window.scrollTo(0, 0);
  };
  layout(); addEventListener('resize', layout); addEventListener('orientationchange', () => setTimeout(layout, 120));
  if (window.visualViewport) visualViewport.addEventListener('resize', layout);
  for (const [id, name] of [['tLeft', 'left'], ['tRight', 'right'], ['tJump', 'jump'], ['tSwitch', 'switch']]) input.bindPad(document.getElementById(id), name);
  const T = (l) => { (window.__boot = window.__boot || {})[l] = Math.round(performance.now()); };   // startup timings, for QA
  T('script');
  try {
    if (document.fonts?.load) await Promise.race([document.fonts.load('600 20px Fredoka'), new Promise((r) => setTimeout(r, 600))]);
    T('fonts'); await assets.load((f) => ui.loading(f * 0.5)); T('assets');
    game = new Game({ canvas: document.getElementById('game'), ui, audio, save, assets, input, opts });
    await game.init((f) => ui.loading(f)); T('init');
    window.__game = game;                    // handy for QA / debugging in the console
  } catch (err) {
    console.error(err);
    document.getElementById('loading').innerHTML = `<div class="loader"><p>Sorry – the game could not start on this device.</p><p class="muted">${String(err.message || err)}</p></div>`;
  }
})();
