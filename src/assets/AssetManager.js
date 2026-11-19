// Asset management: loads images once, hands out cached textures / pixel data and
// generates the procedural textures (sand, wood, glow…) so the build stays tiny.
import * as THREE from 'three';
import { CHARACTER_ASSETS } from './characters.js';
import { BRAND } from './brand.js';
import { rng } from '../core/util.js';

function loadImage(src) { return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('image failed: ' + src.slice(0, 60))); im.src = src; }); }
function canvas(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; }

export class AssetManager {
  constructor() { this.images = {}; this.textures = {}; this._pixels = {}; }

  async load(onProgress = () => {}) {
    const list = [];
    for (const c of Object.values(CHARACTER_ASSETS)) list.push([c.id + '.head', c.temp.head], [c.id + '.aux', c.temp.aux]);
    list.push(['brand.footprint.white', BRAND.footprintWhite], ['brand.footprint.navy', BRAND.footprintNavy]);
    let done = 0;
    await Promise.all(list.map(async ([key, src]) => { this.images[key] = await loadImage(src); onProgress(++done / list.length); }));
    this._makeProcedural();
  }
  image(key) { return this.images[key]; }
  /** sRGB colour texture from a loaded image. */
  texture(key) {
    if (!this.textures[key]) {
      const t = new THREE.Texture(this.images[key]); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.needsUpdate = true;
      this.textures[key] = t;
    }
    return this.textures[key];
  }
  /** Raw RGBA pixels of an image (used for the head relief depth maps). */
  pixels(key) {
    if (!this._pixels[key]) {
      const im = this.images[key]; const c = canvas(im.width, im.height, (g) => g.drawImage(im, 0, 0));
      this._pixels[key] = { data: c.getContext('2d').getImageData(0, 0, im.width, im.height).data, w: im.width, h: im.height };
    }
    return this._pixels[key];
  }
  fromCanvas(key, c, { repeat = false, srgb = true } = {}) {
    const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; } t.anisotropy = 4; this.textures[key] = t; return t;
  }

  _makeProcedural() {
    const r = rng(11);
    // snow: soft drifts + tiny blue/white sparkles (multiplied with the terrain's vertex colours)
    this.fromCanvas('snow', canvas(512, 512, (g, w, h) => {
      g.fillStyle = '#f7f9fd'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 18; i++) { const y = (i / 18) * h; g.strokeStyle = `rgba(150,170,205,${0.04 + r() * 0.05})`; g.lineWidth = 6 + r() * 10; g.beginPath();
        for (let x = -10; x <= w + 10; x += 16) { const yy = y + Math.sin(x * 0.0123 * 2 + i * 1.7) * 12 + Math.sin(x * 0.049 + i) * 3; x < 0 ? g.moveTo(x, yy) : g.lineTo(x, yy); } g.stroke(); }
      for (let i = 0; i < 6000; i++) { const v = r(); g.fillStyle = v > 0.55 ? `rgba(255,255,255,${0.4 + r() * 0.6})` : `rgba(140,165,210,${r() * 0.18})`; g.fillRect(r() * w, r() * h, 1 + r() * 1.4, 1 + r() * 1.4); }
    }), { repeat: true });
    // frost cracks on frozen rivers
    this.fromCanvas('iceCracks', canvas(512, 512, (g, w, h) => {
      g.fillStyle = '#eaf7ff'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(255,255,255,${0.35 + r() * 0.5})`; g.lineWidth = 0.8 + r() * 1.6; g.beginPath(); let x = r() * w, y = r() * h; g.moveTo(x, y);
        for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 90; y += (r() - 0.5) * 90; g.lineTo(x, y); } g.stroke(); }
      for (let i = 0; i < 30; i++) { const x = r() * w, y = r() * h, gr = g.createRadialGradient(x, y, 0, x, y, 60); gr.addColorStop(0, 'rgba(160,215,240,0.25)'); gr.addColorStop(1, 'rgba(160,215,240,0)'); g.fillStyle = gr; g.fillRect(x - 60, y - 60, 120, 120); }
    }), { repeat: true });
    // sand: fine grain + soft wind ripples (multiplied with vertex colours)
    this.fromCanvas('sand', canvas(512, 512, (g, w, h) => {
      g.fillStyle = '#f4f0ea'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 26; i++) { const y = (i / 26) * h; g.strokeStyle = `rgba(150,120,80,${0.05 + r() * 0.05})`; g.lineWidth = 3 + r() * 5; g.beginPath();
        for (let x = -10; x <= w + 10; x += 16) { const yy = y + Math.sin(x * 0.0245 + i * 1.7) * 9 + Math.sin(x * 0.049 + i) * 4; x < 0 ? g.moveTo(x, yy) : g.lineTo(x, yy); } g.stroke(); }
      for (let i = 0; i < 9000; i++) { const v = r(); g.fillStyle = v > 0.5 ? `rgba(255,255,255,${r() * 0.35})` : `rgba(120,90,55,${r() * 0.22})`; g.fillRect(r() * w, r() * h, 1 + r() * 1.6, 1 + r() * 1.6); }
    }), { repeat: true });
    // wood planks
    this.fromCanvas('wood', canvas(256, 256, (g, w, h) => {
      g.fillStyle = '#b9834f'; g.fillRect(0, 0, w, h);
      for (let p = 0; p < 4; p++) { const x0 = p * 64; g.fillStyle = ['#bd8853', '#b07a48', '#c08d58', '#a97444'][p]; g.fillRect(x0, 0, 64, h);
        for (let i = 0; i < 26; i++) { g.strokeStyle = `rgba(90,55,25,${0.08 + r() * 0.12})`; g.lineWidth = 1 + r(); g.beginPath(); const x = x0 + 4 + r() * 56; g.moveTo(x, 0); g.bezierCurveTo(x + r() * 6 - 3, 80, x + r() * 6 - 3, 170, x + r() * 4 - 2, h); g.stroke(); }
        g.fillStyle = 'rgba(60,35,15,0.55)'; g.fillRect(x0, 0, 2, h); g.fillStyle = 'rgba(255,230,190,0.18)'; g.fillRect(x0 + 2, 0, 2, h); }
    }), { repeat: true });
    // soft round glow (additive sprites, particles)
    this.fromCanvas('glow', canvas(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }));
    this.fromCanvas('dot', canvas(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.6, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }));
    // four-point sparkle
    this.fromCanvas('sparkle', canvas(64, 64, (g) => { g.translate(32, 32); g.fillStyle = '#fff';
      g.beginPath(); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2, rr = i % 2 ? 5 : 30; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill(); }));
    // lighthouse stripes
    this.fromCanvas('lighthouse', canvas(64, 256, (g, w, h) => { g.fillStyle = '#f7f1e3'; g.fillRect(0, 0, w, h); g.fillStyle = '#d9564a'; for (let i = 0; i < 3; i++) g.fillRect(0, 26 + i * 84, w, 42); }));
    // checkpoint flag
    this.fromCanvas('flag', canvas(128, 96, (g, w, h) => { g.fillStyle = '#f6ead0'; g.fillRect(0, 0, w, h); g.fillStyle = '#1f2a44'; g.fillRect(0, 0, w, 10); g.fillRect(0, h - 10, w, 10);
      g.translate(64, 50); g.fillStyle = '#f6b93b'; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i / 10) * Math.PI * 2, rr = i % 2 ? 11 : 26; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill(); }));
  }
  /** Wooden hint sign with a mascot portrait and an icon. */
  signTexture(charId, label) {
    const im = this.images[charId + '.head'];
    return this.fromCanvas('sign.' + charId + label, canvas(256, 192, (g, w, h) => {
      g.fillStyle = '#c6935c'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(80,45,20,0.35)'; g.lineWidth = 2;
      for (let y = 48; y < h; y += 48) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
      const s = 120 / im.height; g.drawImage(im, 14, 14, im.width * s, 120);
      g.fillStyle = '#1f2a44'; g.font = '700 30px Fredoka, system-ui, sans-serif'; g.textAlign = 'center'; g.fillText(label, w / 2, h - 18);
      g.font = '700 70px Fredoka, system-ui, sans-serif'; g.fillText(charId === 'haha' ? '↑' : '⇢', 196, 98);
    }));
  }
}
