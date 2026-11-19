// Sky, sun light, clouds, ocean and distant islands.
import * as THREE from 'three';
import { WATER_Y } from '../../config.js';
import { rng } from '../../core/util.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export const SKY = { top: new THREE.Color('#1f7fe0'), horizon: new THREE.Color('#bfeaf5'), fog: new THREE.Color('#b9e6f3') };
export const SUN_DIR = new THREE.Vector3(-0.48, 0.72, 0.5).normalize();

/** Per-level sky preset → THREE colours (falls back to the default midday look). */
export function skyPreset(p = {}) { return { top: new THREE.Color(p.top || '#1f7fe0'), horizon: new THREE.Color(p.horizon || '#bfeaf5'), fog: new THREE.Color(p.fog || '#b9e6f3'), sun: p.sun || '#fff0d4', sunI: p.sunI || 2.6 }; }

export function buildSky(scene, sky = SKY) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: sky.top }, horizon: { value: sky.horizon }, sunDir: { value: SUN_DIR } },
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position.z = gl_Position.w; }`,
    fragmentShader: `uniform vec3 top, horizon, sunDir; varying vec3 vDir;
      void main(){ vec3 d = normalize(vDir); float h = clamp(d.y, 0.0, 1.0);
        vec3 c = mix(horizon, top, pow(h, 0.55));
        c = mix(c, vec3(1.0,0.93,0.80), 0.22 * exp(-abs(d.y) * 9.0));                 // warm haze on the horizon
        float s = max(dot(d, normalize(sunDir * vec3(1.0, 1.0, -1.0))), 0.0);        // sun glow, behind the island
        c += vec3(1.0,0.86,0.62) * (pow(s, 28.0) * 0.55 + pow(s, 420.0) * 1.6);
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), mat); dome.frustumCulled = false; dome.renderOrder = -10; scene.add(dome);
  return dome;
}

export function buildLights(scene, shadows, sky = {}) {
  const hemi = new THREE.HemisphereLight('#d9efff', '#f0d6a0', 1.15); scene.add(hemi);
  const sun = new THREE.DirectionalLight(sky.sun || '#fff0d4', sky.sunI || 2.6); sun.position.copy(SUN_DIR).multiplyScalar(60); scene.add(sun); scene.add(sun.target);
  sun.castShadow = shadows;
  const c = sun.shadow.camera; c.left = -30; c.right = 30; c.top = 22; c.bottom = -16; c.near = 5; c.far = 140; c.updateProjectionMatrix();
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.04; sun.shadow.radius = 3;
  return { hemi, sun };
}

export function buildClouds(scene, seed = 5) {
  const r = rng(seed), group = new THREE.Group(), geo = new THREE.SphereGeometry(1, 14, 10);
  const mat = new THREE.MeshLambertMaterial({ color: '#ffffff', emissive: '#bcd8ea', emissiveIntensity: 0.55 });
  const clouds = [];
  for (let i = 0; i < 16; i++) {
    const n = 4 + Math.floor(r() * 4), s = r.range(5, 12), parts = [], m4 = new THREE.Matrix4();
    for (let k = 0; k < n; k++) { const rr = r.range(0.55, 1) * s * (1 - Math.abs(k - (n - 1) / 2) / n);
      m4.compose(new THREE.Vector3((k - (n - 1) / 2) * s * 0.72, r.range(-0.1, 0.25) * s, r.range(-0.3, 0.3) * s), new THREE.Quaternion(), new THREE.Vector3(rr * 1.35, rr * 0.62, rr * 0.8));
      parts.push(geo.clone().applyMatrix4(m4)); }
    const c = new THREE.Mesh(mergeGeometries(parts), mat);   // one draw call per cloud
    c.position.set(r.range(-120, 420), r.range(22, 62), r.range(-320, -95)); c.userData.speed = r.range(0.25, 0.7);
    group.add(c); clouds.push(c);
  }
  scene.add(group);
  return { group, update(dt) { for (const c of clouds) { c.position.x += c.userData.speed * dt; if (c.position.x > 440) c.position.x = -140; } } };
}

export function buildFarIslands(scene, seed = 9) {
  const r = rng(seed), g = new THREE.Group(), mat = new THREE.MeshLambertMaterial({ color: '#5f9d7a' }), sandMat = new THREE.MeshLambertMaterial({ color: '#ecd9a8' });
  const sandG = [], hillG = [], m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), V = (x, y, z) => new THREE.Vector3(x, y, z);
  for (let i = 0; i < 9; i++) {
    const x = -60 + i * 48 + r.range(-12, 12), z = r.range(-260, -120), s = r.range(14, 34);
    sandG.push(new THREE.SphereGeometry(1, 18, 10).applyMatrix4(m4.compose(V(x, WATER_Y, z), q, V(s * 1.5, s * 0.1, s * 0.9))));
    const hills = 1 + Math.floor(r() * 3);
    for (let k = 0; k < hills; k++) { const hs = s * r.range(0.45, 0.8), sy = hs * r.range(0.35, 0.7);
      hillG.push(new THREE.SphereGeometry(1, 14, 10).applyMatrix4(m4.compose(V(x + r.range(-0.5, 0.5) * s, WATER_Y + 0.5, z + r.range(-3, 3)), q, V(hs * 1.1, sy, hs * 0.8)))); }
  }
  g.add(new THREE.Mesh(mergeGeometries(sandG), sandMat), new THREE.Mesh(mergeGeometries(hillG), mat));   // 2 draw calls for all islands
  scene.add(g); return g;
}

export function buildOcean(scene, segments, sky = SKY) {
  const isl = []; for (let i = 0; i < 8; i++) { const s = segments[i]; isl.push(s ? new THREE.Vector4(s.x0, s.x1, -24.2, 8.3) : new THREE.Vector4(1e5, 1e5, 0, 0)); }
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uIslands: { value: isl }, uFog: { value: sky.fog }, uCam: { value: new THREE.Vector3() } },
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `precision highp float; uniform float uTime; uniform vec4 uIslands[8]; uniform vec3 uFog, uCam; varying vec3 vW;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
      void main(){
        vec2 p = vW.xz; float t = uTime;
        float d = 1e3;
        for (int i = 0; i < 8; i++) { vec4 s = uIslands[i]; vec2 q = vec2(max(max(s.x - p.x, p.x - s.y), 0.0), max(max(s.z - p.y, p.y - s.w), 0.0)); d = min(d, length(q)); }
        float dist = length(vW - uCam);
        float far = smoothstep(20.0, 230.0, dist);
        vec3 deep = mix(vec3(0.02,0.42,0.58), vec3(0.015,0.20,0.50), far);                 // turquoise → deep blue
        vec3 shallow = vec3(0.16,0.78,0.72);
        float sh = 1.0 - smoothstep(0.0, 11.0, d + (noise(p * 0.35 + t * 0.05) - 0.5) * 3.0);
        vec3 c = mix(deep, shallow, sh * 0.82);
        // gentle moving light pattern
        vec2 w1 = p * 0.42 + vec2(t * 0.25, t * 0.13), w2 = p * 0.9 - vec2(t * 0.18, -t * 0.22);
        float n = noise(w1) * 0.6 + noise(w2) * 0.4;
        float caust = smoothstep(0.52, 0.6, n) * (1.0 - smoothstep(0.6, 0.7, n));
        c += vec3(0.55,1.0,0.92) * caust * (0.035 + 0.10 * sh) * (1.0 - far);
        c += vec3(1.0,0.97,0.86) * pow(noise(p * vec2(0.55, 2.4) + vec2(t * 0.5, 0.0)), 7.0) * 0.28 * smoothstep(8.0, 60.0, dist);   // sun glitter
        // foam lapping at the shore
        float lap = 0.55 + 0.45 * sin(t * 1.1 + noise(p * 0.5) * 6.0);
        float foam = (1.0 - smoothstep(0.15, 0.9 + lap * 0.9, d)) * step(0.001, d);
        foam *= 0.55 + 0.45 * noise(p * 2.3 + vec2(t * 0.3, 0.0));
        c = mix(c, vec3(1.0), clamp(foam, 0.0, 1.0) * 0.85);
        c = mix(c, uFog, smoothstep(110.0, 700.0, dist) * 0.85);                             // atmospheric perspective
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1800, 1200, 1, 1).rotateX(-Math.PI / 2), mat);
  mesh.position.set(120, WATER_Y, -420); mesh.frustumCulled = false; scene.add(mesh);
  return { mesh, update(time, cam) { mat.uniforms.uTime.value = time; mat.uniforms.uCam.value.copy(cam.position); mesh.position.x = Math.round(cam.position.x / 10) * 10; } };
}
