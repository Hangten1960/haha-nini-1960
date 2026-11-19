// WINTER environment: twilight sky with Northern Lights, snowy mountain range, icebergs, frozen sea, falling snow.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { WATER_Y } from '../../config.js';
import { rng, noise2 } from '../../core/util.js';

export const W_SUN = new THREE.Vector3(-0.5, 0.42, 0.62).normalize();   // low winter sun
export function winterSky(p = {}) {
  return { top: new THREE.Color(p.top || '#4f86d0'), horizon: new THREE.Color(p.horizon || '#ffe3cc'), fog: new THREE.Color(p.fog || '#e3e6f0'),
    sun: p.sun || '#ffe6c8', sunI: p.sunI ?? 2.4, hemi: p.hemi ?? 1.2, aurora: p.aurora ?? 0.3 };
}

/** Sky dome: gradient, low sun glow, night stars and animated aurora curtains. */
export function buildWinterSky(scene, sky) {
  const night = Math.max(0, (sky.aurora - 0.5) * 2);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: sky.top }, horizon: { value: sky.horizon }, sunDir: { value: W_SUN }, uTime: { value: 0 }, uAurora: { value: sky.aurora }, uNight: { value: night } },
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position.z = gl_Position.w; }`,
    fragmentShader: `uniform vec3 top, horizon, sunDir; uniform float uTime, uAurora, uNight; varying vec3 vDir;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
      void main(){
        vec3 d = normalize(vDir); float h = clamp(d.y, 0.0, 1.0);
        vec3 c = mix(horizon, top, pow(h, 0.5));
        float s = max(dot(d, normalize(sunDir * vec3(1.0, 1.0, -1.0))), 0.0);
        c += vec3(1.0,0.82,0.62) * (pow(s, 18.0) * 0.45 + pow(s, 300.0) * 1.2) * (1.0 - uNight);
        // stars (night only)
        vec2 sp = vec2(atan(d.z, d.x) * 120.0, d.y * 120.0); float st = step(0.996, hash(floor(sp))) * smoothstep(0.04, 0.2, d.y);
        c += vec3(0.9,0.95,1.0) * st * uNight * (0.6 + 0.4 * sin(uTime * 2.0 + hash(floor(sp)) * 40.0));
        // aurora: soft green/teal/violet curtains drifting across the upper sky
        float az = atan(d.z, d.x);
        float band = 0.0;
        for (int i = 0; i < 3; i++) {
          float fi = float(i);
          float wave = 0.13 + 0.07 * fi + 0.04 * sin(az * (3.0 + fi) + uTime * (0.12 + 0.05 * fi) + fi * 2.0) + 0.03 * noise(vec2(az * 6.0 + fi * 10.0, uTime * 0.2));
          float curtain = exp(-pow((d.y - wave) / (0.035 + 0.015 * fi), 2.0)) + 0.6 * smoothstep(wave, wave - 0.09, d.y) * smoothstep(wave - 0.14, wave - 0.03, d.y);
          float rays = 0.55 + 0.45 * noise(vec2(az * 70.0 + fi * 13.0, uTime * 0.35));
          band += curtain * rays * (1.0 - 0.25 * fi);
        }
        vec3 auroraCol = mix(vec3(0.25,1.0,0.65), vec3(0.6,0.45,1.0), smoothstep(0.14, 0.32, d.y));
        c += auroraCol * band * 0.6 * uAurora * smoothstep(0.03, 0.1, d.y);
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), mat); dome.frustumCulled = false; dome.renderOrder = -10; scene.add(dome);
  return { mesh: dome, mat, update(t) { mat.uniforms.uTime.value = t; }, setAurora(v) { mat.uniforms.uAurora.value = v; } };
}

export function buildWinterLights(scene, shadows, sky) {
  const hemi = new THREE.HemisphereLight('#e6f0ff', '#c9d6ea', sky.hemi); scene.add(hemi);
  const sun = new THREE.DirectionalLight(sky.sun, sky.sunI); sun.position.copy(W_SUN).multiplyScalar(60); scene.add(sun); scene.add(sun.target);
  sun.castShadow = shadows;
  const c = sun.shadow.camera; c.left = -30; c.right = 30; c.top = 22; c.bottom = -16; c.near = 5; c.far = 140; c.updateProjectionMatrix();
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.04; sun.shadow.radius = 3;
  return { hemi, sun };
}

const snowRock = (geo, snowLine, rock = '#7d8ba3', snow = '#f4f8ff', seed = 0) => {
  const p = geo.attributes.position, col = new Float32Array(p.count * 3), a = new THREE.Color(rock), b = new THREE.Color(snow), c = new THREE.Color();
  geo.computeBoundingBox(); const y0 = geo.boundingBox.min.y, y1 = geo.boundingBox.max.y;
  for (let i = 0; i < p.count; i++) { const k = (p.getY(i) - y0) / (y1 - y0 || 1), n = noise2(p.getX(i) * 0.08 + seed, p.getZ(i) * 0.08);
    c.copy(a).lerp(b, THREE.MathUtils.smoothstep(k + (n - 0.5) * 0.35, snowLine - 0.06, snowLine + 0.06)); col.set([c.r, c.g, c.b], i * 3); }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); return geo;
};

/** Distant snowy mountain range – one mesh. */
export function buildMountains(scene, seed = 3) {
  const r = rng(seed), parts = [], m = new THREE.Matrix4();
  for (let i = 0; i < 22; i++) {
    const x = -140 + i * 26 + r.range(-10, 10), z = r.range(-380, -230), h = r.range(55, 120), w = h * r.range(0.9, 1.5);
    let g = new THREE.ConeGeometry(1, 1, 9, 6); const p = g.attributes.position;
    for (let k = 0; k < p.count; k++) { const yy = p.getY(k) + 0.5, n = 1 + (noise2(p.getX(k) * 3 + i, p.getZ(k) * 3) - 0.5) * 0.35 * (1 - yy); p.setXYZ(k, p.getX(k) * n, p.getY(k), p.getZ(k) * n); }
    g = g.toNonIndexed(); g.computeVertexNormals(); g.applyMatrix4(m.compose(new THREE.Vector3(x, WATER_Y + h / 2 - 2, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), r() * 6), new THREE.Vector3(w, h, w * 0.7)));
    parts.push(snowRock(g, 0.42 + r() * 0.15, '#6f7f9c', '#f2f6ff', i));
  }
  const mesh = new THREE.Mesh(mergeGeometries(parts), new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, fog: false, emissive: '#3c4f78', emissiveIntensity: 0.25 })); scene.add(mesh); return mesh;
}

/** Icebergs drifting in the mid-distance – one mesh, gently bobbing. */
export function buildIcebergs(scene, seed = 4, count = 14) {
  const r = rng(seed), parts = [], m = new THREE.Matrix4();
  for (let i = 0; i < count; i++) {
    let g = new THREE.IcosahedronGeometry(1, 1); const p = g.attributes.position;
    for (let k = 0; k < p.count; k++) { const s = 0.75 + 0.5 * noise2(p.getX(k) * 2 + i, p.getY(k) * 2 + p.getZ(k)); p.setXYZ(k, p.getX(k) * s, Math.max(-0.3, p.getY(k)) * s, p.getZ(k) * s); }
    g = g.toNonIndexed(); g.computeVertexNormals();
    const sz = r.range(4, 12); g.applyMatrix4(m.compose(new THREE.Vector3(-60 + i * 22 + r.range(-8, 8), WATER_Y - 0.4, r.range(-120, -45)), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), r() * 6), new THREE.Vector3(sz * r.range(1, 1.8), sz * r.range(0.45, 0.9), sz)));
    parts.push(snowRock(g, 0.35, '#8fd3ee', '#f6fbff', i));
  }
  const mesh = new THREE.Mesh(mergeGeometries(parts), new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.35, metalness: 0.05 })); scene.add(mesh); return mesh;
}

/** Cold sea: deep teal water, frosty shore rims, drifting ice sheets far away, gentle light pattern. */
export function buildFrozenSea(scene, segments, sky) {
  const isl = []; for (let i = 0; i < 8; i++) { const s = segments[i]; isl.push(s ? new THREE.Vector4(s.x0, s.x1, -24.2, 8.3) : new THREE.Vector4(1e5, 1e5, 0, 0)); }
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uIslands: { value: isl }, uFog: { value: sky.fog }, uCam: { value: new THREE.Vector3() }, uAurora: { value: sky.aurora } },
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `precision highp float; uniform float uTime, uAurora; uniform vec4 uIslands[8]; uniform vec3 uFog, uCam; varying vec3 vW;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
      void main(){
        vec2 p = vW.xz; float t = uTime; float d = 1e3;
        for (int i = 0; i < 8; i++) { vec4 s = uIslands[i]; vec2 q = vec2(max(max(s.x - p.x, p.x - s.y), 0.0), max(max(s.z - p.y, p.y - s.w), 0.0)); d = min(d, length(q)); }
        float dist = length(vW - uCam), far = smoothstep(20.0, 260.0, dist);
        vec3 deep = mix(vec3(0.03,0.30,0.42), vec3(0.06,0.20,0.38), far);
        vec3 shallow = vec3(0.30,0.70,0.78);
        float sh = 1.0 - smoothstep(0.0, 8.0, d + (noise(p * 0.35 + t * 0.03) - 0.5) * 3.0);
        vec3 c = mix(deep, shallow, sh * 0.7);
        float n = noise(p * 0.42 + vec2(t * 0.12, t * 0.07)) * 0.6 + noise(p * 0.9 - vec2(t * 0.09, -t * 0.11)) * 0.4;
        c += vec3(0.6,0.9,1.0) * smoothstep(0.55, 0.62, n) * (1.0 - smoothstep(0.62, 0.7, n)) * 0.08 * (1.0 - far);
        // aurora reflections on the water
        c += vec3(0.2,0.8,0.55) * uAurora * 0.10 * noise(vec2(p.x * 0.05 + t * 0.05, p.y * 0.4)) * smoothstep(30.0, 200.0, dist);
        // frosty ice rim along every shore
        float rim = (1.0 - smoothstep(0.1, 1.4, d)) * step(0.001, d);
        c = mix(c, vec3(0.92,0.97,1.0), rim * (0.65 + 0.35 * noise(p * 2.0)));
        // drifting ice sheets far from the play lane (never near the gaps you must jump)
        float sheets = smoothstep(0.62, 0.66, noise(p * 0.08 + vec2(t * 0.01, 0.0))) * smoothstep(-30.0, -60.0, vW.z);
        c = mix(c, vec3(0.88,0.94,0.99), sheets * 0.9);
        c = mix(c, uFog, smoothstep(110.0, 700.0, dist) * 0.85);
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1800, 1200, 1, 1).rotateX(-Math.PI / 2), mat);
  mesh.position.set(120, WATER_Y, -420); mesh.frustumCulled = false; scene.add(mesh);
  return { mesh, update(time, cam) { mat.uniforms.uTime.value = time; mat.uniforms.uCam.value.copy(cam.position); mesh.position.x = Math.round(cam.position.x / 10) * 10; } };
}

/** Soft falling snow around the camera (GPU points, wraps around a box that follows the view). */
export function buildSnowfall(scene, count, dotTex) {
  const r = rng(77), pos = new Float32Array(count * 3), seed = new Float32Array(count);
  for (let i = 0; i < count; i++) { pos.set([r.range(-40, 40), r.range(-6, 26), r.range(-22, 12)], i * 3); seed[i] = r(); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false,
    uniforms: { uTime: { value: 0 }, uOrigin: { value: new THREE.Vector3() }, uMap: { value: dotTex }, uScale: { value: 1 } },
    vertexShader: `attribute float seed; uniform float uTime, uScale; uniform vec3 uOrigin; varying float vA;
      void main(){
        vec3 p = position; float fall = uTime * (0.9 + seed * 0.8);
        p.y = mod(p.y - fall - uOrigin.y + 6.0, 32.0) - 6.0 + uOrigin.y;
        p.x = mod(p.x + sin(uTime * 0.6 + seed * 30.0) * 0.8 + uTime * 0.4 - uOrigin.x + 40.0, 80.0) - 40.0 + uOrigin.x;
        vec4 mv = viewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv;
        gl_PointSize = (2.0 + seed * 3.5) * uScale * 30.0 / -mv.z; vA = 0.55 + 0.45 * seed; }`,
    fragmentShader: `uniform sampler2D uMap; varying float vA; void main(){ vec4 t = texture2D(uMap, gl_PointCoord); gl_FragColor = vec4(1.0, 1.0, 1.0, t.a * vA * 0.85); }`,
  });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = 5; scene.add(pts);
  return { pts, update(t, cam, pixelScale) { mat.uniforms.uTime.value = t; mat.uniforms.uOrigin.value.set(cam.position.x, cam.position.y - 6, 0); mat.uniforms.uScale.value = pixelScale; } };
}
