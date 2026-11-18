// Storybook garden assets: soft painted trees, bushes, mushrooms, rocks, grass and flowers.
import * as THREE from 'three';
import { canvasTex } from './core.js';

/* ---------- tiny deterministic noise ---------- */
let seed = 11;
export const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
function n3(x, y, z) { // smooth pseudo-noise from layered sines (cheap, no tables)
  return (Math.sin(x * 1.7 + Math.sin(y * 2.3) * 1.3) * Math.cos(z * 1.9 + Math.sin(x * 1.1)) * 0.5
    + Math.sin(x * 3.1 + y * 2.7 + z * 2.2) * 0.25 + Math.sin(y * 5.3 - z * 4.1 + x * 0.7) * 0.12);
}

/* ---------- painted textures (shared) ---------- */
const T = {};
function leafTex() {
  if (T.leaf) return T.leaf;
  T.leaf = canvasTex(512, 512, (c) => {
    c.fillStyle = '#7fbf5a'; c.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 1400; i++) {
      const x = rand() * 512, y = rand() * 512, s = 7 + rand() * 13, a = rand() * Math.PI * 2;
      const g = ['#5aa83f', '#8fd162', '#4a9636', '#a8de78', '#6dbb4c'][i % 5];
      c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = g; c.globalAlpha = 0.85;
      c.beginPath(); c.moveTo(0, -s); c.quadraticCurveTo(s * 0.6, 0, 0, s); c.quadraticCurveTo(-s * 0.6, 0, 0, -s); c.fill();
      c.strokeStyle = 'rgba(40,90,30,.35)'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, -s * 0.8); c.lineTo(0, s * 0.8); c.stroke();
      c.restore();
    }
    c.globalAlpha = 1;
  });
  T.leaf.wrapS = T.leaf.wrapT = THREE.RepeatWrapping; T.leaf.repeat.set(2, 2);
  return T.leaf;
}
function barkTex() {
  if (T.bark) return T.bark;
  T.bark = canvasTex(256, 512, (c) => {
    c.fillStyle = '#8a5a33'; c.fillRect(0, 0, 256, 512);
    for (let i = 0; i < 90; i++) {
      const x = rand() * 256; c.strokeStyle = rand() < 0.5 ? 'rgba(60,35,18,.55)' : 'rgba(170,120,80,.35)'; c.lineWidth = 2 + rand() * 4;
      c.beginPath(); c.moveTo(x, 0); for (let y = 0; y <= 512; y += 32) c.lineTo(x + Math.sin(y * 0.03 + i) * 6, y); c.stroke();
    }
    for (let i = 0; i < 8; i++) { const x = rand() * 256, y = rand() * 512; c.fillStyle = 'rgba(50,30,15,.5)'; c.beginPath(); c.ellipse(x, y, 8, 14, 0, 0, 7); c.fill(); }
  });
  T.bark.wrapS = T.bark.wrapT = THREE.RepeatWrapping;
  return T.bark;
}
export function stoneTex() {
  if (T.stone) return T.stone;
  T.stone = canvasTex(256, 256, (c) => {
    c.fillStyle = '#a99d8e'; c.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 1600; i++) { c.fillStyle = `rgba(${rand() < 0.5 ? '70,62,55' : '220,212,200'},${0.08 + rand() * 0.18})`; c.fillRect(rand() * 256, rand() * 256, 2 + rand() * 4, 2 + rand() * 4); }
    c.strokeStyle = 'rgba(60,52,46,.35)'; c.lineWidth = 2;
    for (let y = 0; y < 256; y += 42) { c.beginPath(); c.moveTo(0, y); c.lineTo(256, y + 4); c.stroke(); for (let x = (y / 42 % 2) * 40; x < 256; x += 80) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + 2, y + 42); c.stroke(); } }
    for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(90,150,60,${0.2 + rand() * 0.3})`; c.beginPath(); c.arc(rand() * 256, rand() * 256, 3 + rand() * 8, 0, 7); c.fill(); }
  });
  T.stone.wrapS = T.stone.wrapT = THREE.RepeatWrapping;
  return T.stone;
}
function grassBladeTex() {
  if (T.blade) return T.blade;
  T.blade = canvasTex(128, 128, (c) => {
    for (let i = 0; i < 26; i++) {
      const x = 14 + rand() * 100, h = 60 + rand() * 62, lean = (rand() - 0.5) * 30, w = 4 + rand() * 4;
      const g = c.createLinearGradient(0, 128, 0, 128 - h); g.addColorStop(0, '#3f8f2c'); g.addColorStop(1, ['#9be06a', '#b7ec84', '#86d35a'][i % 3]);
      c.fillStyle = g; c.beginPath(); c.moveTo(x - w, 128); c.quadraticCurveTo(x + lean * 0.3, 128 - h * 0.6, x + lean, 128 - h); c.quadraticCurveTo(x + lean * 0.3 + w * 0.3, 128 - h * 0.5, x + w, 128); c.fill();
    }
  });
  return T.blade;
}

/* ---------- materials ---------- */
const M = {};
export function cmat(key, make) { return M[key] || (M[key] = make()); } // shared so the world can be merged into few draw calls
export function leafMat() { return M.leaf || (M.leaf = new THREE.MeshStandardMaterial({ map: leafTex(), vertexColors: true, roughness: 0.85 })); }
export function barkMat() { return M.bark || (M.bark = new THREE.MeshStandardMaterial({ map: barkTex(), roughness: 0.95 })); }
export function stoneMat() { return M.stone || (M.stone = new THREE.MeshStandardMaterial({ map: stoneTex(), roughness: 0.9, vertexColors: true })); }

/* ---------- geometry helpers ---------- */
// soft, lumpy foliage blob with sun-lit top and shaded underside baked into vertex colours
export function blobGeo(r = 1, lump = 0.22, top = '#c6f08a', bottom = '#2f7a2a', seg = 28) {
  const g = new THREE.SphereGeometry(r, seg, Math.round(seg * 0.7));
  const p = g.attributes.position, col = [], ct = new THREE.Color(top), cb = new THREE.Color(bottom), c = new THREE.Color(), v = new THREE.Vector3();
  const o = rand() * 10;
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i); const d = 1 + n3(v.x * 2 + o, v.y * 2, v.z * 2) * lump + n3(v.x * 6, v.y * 6 + o, v.z * 6) * lump * 0.25;
    v.multiplyScalar(d); v.y *= 0.82; p.setXYZ(i, v.x, v.y, v.z);
    const h = THREE.MathUtils.clamp((v.y / r + 0.9) / 1.6, 0, 1); c.copy(cb).lerp(ct, h * h * 0.9 + 0.1); col.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals(); return g;
}
// tapered, curved limb following a curve
export function limbGeo(curve, r0, r1, radial = 10, segs = 16) {
  const g = new THREE.CylinderGeometry(1, 1, 1, radial, segs, true); const p = g.attributes.position, v = new THREE.Vector3();
  const frames = curve.computeFrenetFrames(segs, false);
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i); const t = v.y + 0.5, k = Math.round(t * segs), r = r0 + (r1 - r0) * t;
    const pt = curve.getPointAt(t), N = frames.normals[k], B = frames.binormals[k];
    const ang = Math.atan2(v.z, v.x); const off = N.clone().multiplyScalar(Math.cos(ang) * r).add(B.clone().multiplyScalar(Math.sin(ang) * r));
    p.setXYZ(i, pt.x + off.x, pt.y + off.y, pt.z + off.z);
  }
  g.computeVertexNormals(); return g;
}

/* ---------- assets ---------- */
// Storybook tree: curved trunk, 2–3 branches, soft canopy clusters, optional fruit or blossoms
export function makeStoryTree(h = 1, o = {}) {
  const g = new THREE.Group();
  const lean = (rand() - 0.5) * 0.25 * h;
  const trunkC = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(lean * 0.3, h * 0.25, 0.02 * h), new THREE.Vector3(lean, h * 0.55, -0.03 * h), new THREE.Vector3(lean * 0.6, h * 0.72, 0)]);
  const trunk = new THREE.Mesh(limbGeo(trunkC, h * 0.075, h * 0.035, o.far ? 8 : 12, o.far ? 8 : 14), barkMat()); g.add(trunk);
  // root flare
  const flare = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.075, h * 0.12, h * 0.06, 12), barkMat()); flare.position.y = h * 0.03; g.add(flare);
  const tops = [trunkC.getPoint(1)];
  const nb = 2 + Math.floor(rand() * 2);
  for (let i = 0; i < nb; i++) {
    const a = i / nb * Math.PI * 2 + rand(), s = trunkC.getPoint(0.55 + rand() * 0.2);
    const e = s.clone().add(new THREE.Vector3(Math.cos(a) * h * 0.3, h * (0.15 + rand() * 0.12), Math.sin(a) * h * 0.25));
    const bc = new THREE.CatmullRomCurve3([s, s.clone().lerp(e, 0.5).add(new THREE.Vector3(0, h * 0.05, 0)), e]);
    g.add(new THREE.Mesh(limbGeo(bc, h * 0.035, h * 0.015, 8, 8), barkMat())); tops.push(e);
  }
  const top = o.top || ['#d4f59a', '#c6f08a', '#b8ea7c'][Math.floor(rand() * 3)], bot = o.bottom || '#2f7a2a';
  tops.forEach((p, i) => {
    const r = h * (i === 0 ? 0.3 : 0.22) * (0.85 + rand() * 0.3);
    const b = new THREE.Mesh(blobGeo(1, 0.24, top, bot, o.far ? 14 : 28), leafMat()); b.scale.setScalar(r); b.position.copy(p).add(new THREE.Vector3(0, r * 0.35, 0)); g.add(b);
    for (let k = 0; k < 2; k++) { const s = new THREE.Mesh(blobGeo(1, 0.3, top, bot, o.far ? 10 : 18), leafMat()); s.scale.setScalar(r * (0.5 + rand() * 0.25)); s.position.copy(b.position).add(new THREE.Vector3((rand() - 0.5) * r * 1.2, (rand() - 0.2) * r * 0.6, (rand() - 0.5) * r * 1.2)); g.add(s); }
  });
  if (o.fruit) {
    const fm = cmat('fruit' + o.fruit, () => new THREE.MeshPhysicalMaterial({ color: o.fruit, roughness: 0.25, clearcoat: 1 }));
    g.userData.fruitSpots = [];
    tops.forEach(p => { for (let k = 0; k < 4; k++) { const a = rand() * Math.PI * 2, r = h * 0.24; const v = new THREE.Vector3(p.x + Math.cos(a) * r, p.y + h * 0.05 + (rand() - 0.5) * h * 0.12, p.z + Math.sin(a) * r); g.userData.fruitSpots.push(v);
      if (!o.bareFruit) { const f = new THREE.Mesh(new THREE.SphereGeometry(h * 0.035, 12, 10), fm); f.position.copy(v); g.add(f); } } });
  }
  if (o.blossom) { const bm = cmat('bl' + o.blossom, () => new THREE.MeshStandardMaterial({ color: o.blossom, roughness: 0.6 }));
    tops.forEach(p => { for (let k = 0; k < 7; k++) { const a = rand() * Math.PI * 2, r = h * 0.26; const f = new THREE.Mesh(new THREE.SphereGeometry(h * 0.022, 8, 6), bm); f.position.set(p.x + Math.cos(a) * r, p.y + h * 0.1 + (rand() - 0.3) * h * 0.15, p.z + Math.sin(a) * r); g.add(f); } }); }
  g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  return g;
}
export function makeBush(s = 0.3, flowers = '#ff5fa2', far = false) {
  const g = new THREE.Group();
  for (let k = 0; k < 4; k++) { const b = new THREE.Mesh(blobGeo(1, 0.28, '#b7ea7c', '#2f7a2a', far ? 12 : 20), leafMat()); const r = s * (0.45 + rand() * 0.3); b.scale.setScalar(r); b.position.set((rand() - 0.5) * s * 0.9, r * 0.6, (rand() - 0.5) * s * 0.7); g.add(b); }
  if (flowers) { const fm = cmat('bf' + flowers, () => new THREE.MeshStandardMaterial({ color: flowers, roughness: 0.5 })); for (let k = 0; k < 9; k++) { const f = new THREE.Mesh(new THREE.SphereGeometry(s * 0.06, 8, 6), fm); const a = rand() * Math.PI * 2; f.position.set(Math.cos(a) * s * 0.5, s * (0.5 + rand() * 0.45), Math.sin(a) * s * 0.4); g.add(f); } }
  g.traverse(m => { if (m.isMesh) m.castShadow = true; });
  return g;
}
export function makeMushroom(s = 0.2, cap = '#e63946') {
  const g = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.LatheGeometry([[0.0, 0], [0.32, 0], [0.26, 0.15], [0.22, 0.5], [0.25, 0.72], [0.0, 0.74]].map(([x, y]) => new THREE.Vector2(x * s, y * s)), 20), cmat('mstem', () => new THREE.MeshPhysicalMaterial({ color: '#fbf0dc', roughness: 0.6, sheen: 0.5 })));
  g.add(stem);
  const capPts = []; for (let i = 0; i <= 14; i++) { const a = i / 14 * Math.PI / 2; capPts.push(new THREE.Vector2(Math.sin(a) * s * 0.85 * (1 + 0.08 * Math.sin(a * 3)), Math.cos(a) * s * 0.45 + s * 0.62)); }
  capPts.push(new THREE.Vector2(s * 0.7, s * 0.6), new THREE.Vector2(0.2 * s, s * 0.66));
  const capKey = 'cap' + cap; const capMat = M[capKey]; const capTex = capMat ? null : canvasTex(256, 128, (c) => { c.fillStyle = cap; c.fillRect(0, 0, 256, 128); const gr = c.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, 'rgba(255,255,255,.25)'); gr.addColorStop(1, 'rgba(0,0,0,.15)'); c.fillStyle = gr; c.fillRect(0, 0, 256, 128);
    c.fillStyle = '#fffaf0'; for (let i = 0; i < 16; i++) { c.beginPath(); c.ellipse((i * 47) % 256, 20 + (i * 29) % 80, 9 + (i % 3) * 4, 7 + (i % 2) * 3, 0, 0, 7); c.fill(); } });
  const capM = new THREE.Mesh(new THREE.LatheGeometry(capPts, 28), cmat(capKey, () => new THREE.MeshPhysicalMaterial({ map: capTex, roughness: 0.35, clearcoat: 0.8, side: THREE.DoubleSide })));
  g.add(capM); g.userData.cap = capM;
  g.traverse(m => { if (m.isMesh) m.castShadow = true; });
  return g;
}
export function makeRock(s = 0.2, far = false) {
  const geo = new THREE.IcosahedronGeometry(1, far ? 2 : 3); const p = geo.attributes.position, v = new THREE.Vector3(), col = [], c = new THREE.Color();
  const o = rand() * 9;
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); v.multiplyScalar(1 + n3(v.x * 1.5 + o, v.y * 1.5, v.z * 1.5) * 0.25); v.y *= 0.6; p.setXYZ(i, v.x, v.y, v.z); c.set(v.y > 0.25 ? '#8ccf63' : '#ffffff'); col.push(c.r, c.g, c.b); }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, stoneMat()); m.scale.setScalar(s); m.castShadow = true; m.receiveShadow = true; return m;
}
// Petal flower: shaped petals around a domed centre
const petalShape = (() => { const s = new THREE.Shape(); s.moveTo(0, 0); s.bezierCurveTo(0.45, 0.25, 0.45, 0.85, 0, 1); s.bezierCurveTo(-0.45, 0.85, -0.45, 0.25, 0, 0); return s; })();
const petalGeoCache = {};
export function petalGeo() { return petalGeoCache.g || (petalGeoCache.g = (() => { const g = new THREE.ShapeGeometry(petalShape, 8); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setZ(i, Math.sin(y * Math.PI) * 0.12 + y * y * 0.15); } g.computeVertexNormals(); return g; })()); }
export function makePetalFlower(color = '#ff5fa2', h = 0.25, petals = 7, center = '#ffd23f', size = 0.05) {
  const g = new THREE.Group();
  const stemC = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.01, h * 0.5, 0.01), new THREE.Vector3(0, h, 0)]);
  g.add(new THREE.Mesh(limbGeo(stemC, 0.008, 0.006, 6, 6), cmat('stem', () => new THREE.MeshStandardMaterial({ color: '#2f8f37', roughness: 0.6 }))));
  for (const s of [-1, 1]) { const lf = new THREE.Mesh(petalGeo(), cmat('fleaf', () => new THREE.MeshStandardMaterial({ color: '#46b04a', side: THREE.DoubleSide, roughness: 0.6 }))); lf.scale.setScalar(Math.min(h * 0.28, 0.09)); lf.position.set(0, h * 0.35, 0); lf.rotation.set(-0.6, s > 0 ? 0 : Math.PI, s * 1.2); g.add(lf); }
  const head = new THREE.Group(); head.position.y = h; g.add(head);
  const pm = cmat('petal' + color, () => new THREE.MeshPhysicalMaterial({ color, side: THREE.DoubleSide, roughness: 0.45, sheen: 0.6, sheenColor: new THREE.Color('#ffffff') }));
  for (const ring of [0, 1]) for (let i = 0; i < petals; i++) {
    const p = new THREE.Mesh(petalGeo(), pm); const a = (i + ring * 0.5) / petals * Math.PI * 2;
    p.scale.setScalar(size * (ring ? 0.75 : 1)); p.rotation.order = 'YXZ'; p.rotation.set(-Math.PI / 2 + (ring ? 0.7 : 0.35), a, 0); p.position.y = ring * 0.004; head.add(p);
  }
  const ctr = new THREE.Mesh(new THREE.SphereGeometry(size * 0.32, 14, 10), cmat('ctr' + center, () => new THREE.MeshPhysicalMaterial({ color: center, roughness: 0.6, sheen: 1 }))); ctr.scale.y = 0.6; ctr.position.y = 0.006; head.add(ctr);
  head.rotation.x = 0.35; g.userData.head = head;
  g.traverse(m => { if (m.isMesh) m.castShadow = true; });
  return g;
}
export function makeSunflower(h = 0.5) {
  const f = makePetalFlower('#ffc300', h, 14, '#6b3e1f', 0.07);
  f.userData.head.children.forEach(m => { if (m.geometry.type === 'SphereGeometry') m.scale.set(1.6, 0.5, 1.6); });
  return f;
}
// Merge a static group's meshes into one mesh per material (hundreds of draw calls -> a handful)
export function bakeStatic(group, mergeGeometries) {
  group.updateMatrixWorld(true);
  const byMat = new Map();
  group.traverse(o => { if (!o.isMesh || o.isInstancedMesh) return; const g = o.geometry.index ? o.geometry.clone() : o.geometry.clone(); g.applyMatrix4(o.matrixWorld);
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(k)) g.deleteAttribute(k);
    const key = o.material.uuid; if (!byMat.has(key)) byMat.set(key, { mat: o.material, geos: [] }); byMat.get(key).geos.push(g); });
  const out = new THREE.Group();
  for (const { mat, geos } of byMat.values()) {
    const sets = new Map(); geos.forEach(g => { const sig = Object.keys(g.attributes).sort().join() + (g.index ? 'i' : 'n'); if (!sets.has(sig)) sets.set(sig, []); sets.get(sig).push(g); });
    for (const list of sets.values()) { const m = mergeGeometries(list, false); if (!m) continue; const mesh = new THREE.Mesh(m, mat); mesh.castShadow = false; mesh.receiveShadow = true; out.add(mesh); }
  }
  return out;
}
// Instanced, wind-swayed grass tufts scattered on a ring
export function grassField(count = 1400, rMin = 1.6, rMax = 7, y = -0.6, scale = 0.22) {
  const geo = new THREE.PlaneGeometry(1, 1); geo.translate(0, 0.5, 0);
  const g2 = geo.clone(); g2.rotateY(Math.PI / 2); const merged = mergeTwo(geo, g2);
  const mat = new THREE.MeshStandardMaterial({ map: grassBladeTex(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9 });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = mat.userData.time = { value: 0 };
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      vec4 ip = instanceMatrix * vec4(0.,0.,0.,1.);
      float sway = sin(uTime * 1.6 + ip.x * 1.3 + ip.z * 0.9) * 0.12 * position.y;
      transformed.x += sway; transformed.z += sway * 0.5;`);
  };
  const mesh = new THREE.InstancedMesh(merged, mat, count); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  for (let i = 0; i < count; i++) { const a = rand() * Math.PI * 2, r = rMin + Math.sqrt(rand()) * (rMax - rMin); p.set(Math.cos(a) * r, y, Math.sin(a) * r); q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rand() * Math.PI); const k = scale * (0.6 + rand() * 0.8); s.set(k, k * (0.8 + rand() * 0.6), k); mesh.setMatrixAt(i, m4.compose(p, q, s)); }
  mesh.userData.tick = (t) => { if (mat.userData.time) mat.userData.time.value = t; };
  return mesh;
}
function mergeTwo(a, b) {
  const g = new THREE.BufferGeometry();
  for (const k of ['position', 'normal', 'uv']) { const A = a.attributes[k].array, B = b.attributes[k].array, out = new Float32Array(A.length + B.length); out.set(A); out.set(B, A.length); g.setAttribute(k, new THREE.BufferAttribute(out, a.attributes[k].itemSize)); }
  const ia = a.index.array, ib = b.index.array, off = a.attributes.position.count, idx = new Uint16Array(ia.length + ib.length); idx.set(ia); for (let i = 0; i < ib.length; i++) idx[ia.length + i] = ib[i] + off; g.setIndex(new THREE.BufferAttribute(idx, 1));
  return g;
}
