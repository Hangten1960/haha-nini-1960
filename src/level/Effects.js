// Tiny pooled sprite-particle system: dust, sparkles, splashes, petals.
import * as THREE from 'three';

export class Effects {
  constructor(scene, assets, count = 90) {
    this.pool = []; this.cursor = 0;
    for (let i = 0; i < count; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: assets.textures.dot, transparent: true, depthWrite: false })); s.visible = false; scene.add(s);
      this.pool.push({ s, life: 0, max: 1, vx: 0, vy: 0, vz: 0, g: 0, size: 1, grow: 0, spin: 0 });
    }
    this.tex = assets.textures;
  }
  emit(o) {
    const p = this.pool[this.cursor]; this.cursor = (this.cursor + 1) % this.pool.length;
    p.life = p.max = o.life ?? 0.6; p.vx = o.vx ?? 0; p.vy = o.vy ?? 0; p.vz = o.vz ?? 0; p.g = o.g ?? 0; p.size = o.size ?? 0.3; p.grow = o.grow ?? 0; p.spin = o.spin ?? 0;
    const m = p.s.material; m.map = this.tex[o.tex || 'dot']; m.color.set(o.color || '#ffffff'); m.blending = o.add ? THREE.AdditiveBlending : THREE.NormalBlending; m.opacity = o.opacity ?? 1; p.op = m.opacity; m.rotation = Math.random() * 6;
    p.s.position.set(o.x, o.y, o.z ?? 0); p.s.scale.setScalar(p.size); p.s.visible = true;
  }
  burst(n, fn) { for (let i = 0; i < n; i++) this.emit(fn(i, Math.random)); }
  dust(x, y, n = 5, z = 0) { this.burst(n, (i, r) => ({ x: x + (r() - 0.5) * 0.5, y: y + 0.08, z: z + (r() - 0.5) * 0.4, vx: (r() - 0.5) * 2.2, vy: 0.5 + r() * 0.9, life: 0.45 + r() * 0.25, size: 0.22 + r() * 0.2, grow: 0.7, color: '#eef4ff', opacity: 0.8 })); }
  sparkle(x, y, color = '#ffe08a', n = 10, z = 0) { this.burst(n, (i, r) => { const a = r() * 6.28, v = 2 + r() * 3.5; return { x, y, z, vx: Math.cos(a) * v, vy: Math.sin(a) * v + 1, g: -5, life: 0.5 + r() * 0.35, size: 0.22 + r() * 0.3, tex: 'sparkle', color, add: true, spin: (r() - 0.5) * 6 }; }); }
  splash(x, y) { this.burst(16, (i, r) => ({ x: x + (r() - 0.5) * 0.8, y, vx: (r() - 0.5) * 4, vy: 4 + r() * 5, vz: (r() - 0.5) * 2, g: -16, life: 0.7 + r() * 0.3, size: 0.16 + r() * 0.22, color: '#eaffff', opacity: 0.9 }));
    this.burst(3, (i) => ({ x, y: y + 0.03, life: 0.9, size: 0.6, grow: 3.2 + i, color: '#ffffff', opacity: 0.5 })); }
  petals(x, y, n = 6, z = 0) { this.burst(n, (i, r) => ({ x: x + (r() - 0.5) * 0.9, y: y + r() * 1.2, z, vx: (r() - 0.5) * 1.6, vy: 0.4 + r() * 1.2, g: -1.6, life: 0.9 + r() * 0.5, size: 0.14 + r() * 0.1, color: r() > 0.4 ? '#f6b8c6' : '#fff6ee', spin: (r() - 0.5) * 5 })); }
  update(dt) {
    for (const p of this.pool) {
      if (p.life <= 0) continue;
      p.life -= dt; if (p.life <= 0) { p.s.visible = false; continue; }
      p.vy += p.g * dt; p.s.position.x += p.vx * dt; p.s.position.y += p.vy * dt; p.s.position.z += p.vz * dt;
      const k = p.life / p.max; p.s.material.opacity = p.op * Math.min(1, k * 2.2); p.s.material.rotation += p.spin * dt;
      p.s.scale.setScalar(p.size * (1 + p.grow * (1 - k)));
    }
  }
}
