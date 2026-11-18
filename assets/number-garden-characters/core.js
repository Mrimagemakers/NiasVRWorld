// Character factories from NiaNumberGardenAR at f30e68f1a07afdf790bc4d60b6320045ebb8d668.
// Shared 3D helpers, characters, effects and sound for the Nia AR book
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { makePetalFlower, makeStoryTree, stoneTex } from './garden.js';
import { makeCarloHD, makeSubbyHD2, makeMillyHD, makeSkippyHD, makeButterfly8HD } from './props.js';

/* ---------- Darnell's character models (Meshy + Mixamo rig) ---------- */
export const MODELS = {};
function normalize(scene) { // wrap so the model stands on y=0, centered, exactly 1 unit tall, facing +z
  const wrap = new THREE.Group(); wrap.add(scene); scene.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(scene), size = b.getSize(new THREE.Vector3());
  const s = 1 / size.y; scene.scale.multiplyScalar(s);
  scene.position.set(-(b.min.x + b.max.x) / 2 * s, -b.min.y * s, -(b.min.z + b.max.z) / 2 * s);
  wrap.updateMatrixWorld(true); return wrap;
}

/* ---------- auto-rig: fit a simple skeleton to a static Meshy model so it can move ---------- */
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const RIGS = {
  addie: { rest: 1.15, hipY: 0.27, neckY: 0.6, sh: [0.085, 0.53], arm: [0.44, 0.62], legX: 0, cx: 0 },
  freddy: { rest: 0.25, hipY: 0.24, neckY: 0.56, sh: [0.13, 0.47], arm: [0.25, 0.52], legX: 0.02, cx: 0.03, tail: { at: [-0.06, 0.24, -0.1], test: (x, y, z) => ss(-0.06, -0.14, x) * ss(0.33, 0.28, y) * ss(-0.02, -0.1, z) } },
  gwenda: { rest: 0, hipY: 0.24, neckY: 0.66, sh: [0.1, 0.62], arm: [0.32, 0.66], armZ: -0.03, legX: 0, cx: 0, wings: { at: [0.05, 0.62, -0.08], test: (x, y, z) => ss(0.08, 0.16, Math.abs(x)) * ss(-0.03, -0.07, z) * ss(0.28, 0.36, y) } },
};
function autoRig(wrap, key) {
  const P = RIGS[key]; let src; wrap.traverse(o => { if (o.isMesh && !src) src = o; }); if (!src || !P) return wrap;
  wrap.updateMatrixWorld(true);
  const geo = src.geometry.clone().applyMatrix4(new THREE.Matrix4().copy(wrap.matrixWorld).invert().multiply(src.matrixWorld));
  geo.computeBoundingBox(); const bb = geo.boundingBox, cx = (bb.min.x + bb.max.x) / 2, cz = (bb.min.z + bb.max.z) / 2;
  // bones (positions in model space, height 1)
  const mk = (name, x, y, z, parent) => { const b = new THREE.Bone(); b.name = key + '_' + name; b.userData.abs = new THREE.Vector3(cx + x, y, cz + z);
    if (parent) { parent.add(b); b.position.copy(b.userData.abs).sub(parent.userData.abs); } else b.position.copy(b.userData.abs); return b; };
  const root = mk('root', 0, 0, 0), hips = mk('hips', 0, P.hipY, 0, root), spine = mk('spine', 0, (P.hipY + P.neckY) / 2, 0, hips), head = mk('head', 0, P.neckY, 0, spine);
  const armL = mk('armL', -P.sh[0], P.sh[1], 0, spine), armR = mk('armR', P.sh[0], P.sh[1], 0, spine);
  const legL = mk('legL', -0.05, P.hipY, 0, hips), legR = mk('legR', 0.05, P.hipY, 0, hips);
  const bones = [root, hips, spine, head, armL, armR, legL, legR];
  let tail, wingL, wingR;
  if (P.tail) { tail = mk('tail', ...P.tail.at, hips); bones.push(tail); }
  if (P.wings) { wingL = mk('wingL', -P.wings.at[0], P.wings.at[1], P.wings.at[2], spine); wingR = mk('wingR', P.wings.at[0], P.wings.at[1], P.wings.at[2], spine); bones.push(wingL, wingR); }
  const I = (b) => bones.indexOf(b);
  const p = geo.attributes.position, n = p.count, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const x = p.getX(i) - cx - P.cx, y = p.getY(i), z = p.getZ(i) - cz, ax = Math.abs(x), side = x < 0;
    const w = [];
    const hd = ss(P.neckY - 0.03, P.neckY + 0.04, y);
    let ex = 0;
    if (P.wings) { const wg = P.wings.test(x, y, z) * (1 - hd * 0.8); if (wg > 0.01) { w.push([side ? I(wingL) : I(wingR), wg]); ex = wg; } }
    if (P.tail) { const tg = P.tail.test(x, y, z); if (tg > 0.01) { w.push([I(tail), tg]); ex = Math.max(ex, tg); } }
    const zOK = P.armZ === undefined ? 1 : ss(P.armZ - 0.04, P.armZ, z);
    const arm = ss(P.sh[0] - 0.01, P.sh[0] + 0.05, ax) * ss(P.arm[0] - 0.03, P.arm[0], y) * ss(P.arm[1] + 0.02, P.arm[1] - 0.02, y) * zOK * (1 - hd) * (1 - ex);
    if (arm > 0.01) w.push([side ? I(armL) : I(armR), arm]);
    const leg = (1 - ss(P.hipY - 0.05, P.hipY + 0.02, y)) * (1 - ex) * (1 - arm);
    if (leg > 0.01) w.push([(x - P.legX) < 0 ? I(legL) : I(legR), leg]);
    if (hd > 0.01) w.push([I(head), hd * (1 - arm)]);
    const rest = Math.max(0, 1 - w.reduce((s, q) => s + q[1], 0));
    if (rest > 0.001) w.push([y < P.hipY + 0.1 ? I(hips) : I(spine), rest]);
    w.sort((a, b) => b[1] - a[1]); const top = w.slice(0, 4), tot = top.reduce((s, q) => s + q[1], 0) || 1;
    top.forEach((q, k) => { si[i * 4 + k] = q[0]; sw[i * 4 + k] = q[1] / tot; });
  }
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
  const sm = new THREE.SkinnedMesh(geo, src.material); sm.castShadow = true; sm.frustumCulled = false;
  sm.add(root); sm.bind(new THREE.Skeleton(bones));
  const out = new THREE.Group(); out.add(sm); out.userData.rigKey = key; return out;
}
// procedural animation for an auto-rigged character: breathing, looking around, walking when moved, wave/hop on tap
function animateRig(g, key) {
  const B = (n) => g.getObjectByName(key + '_' + n);
  const head = B('head'), spine = B('spine'), armL = B('armL'), armR = B('armR'), legL = B('legL'), legR = B('legR'), tail = B('tail'), wingL = B('wingL'), wingR = B('wingR'), hips = B('hips');
  const last = new THREE.Vector3(), cur = new THREE.Vector3(); let lt = null, speed = 0, act = null, actT = 0;
  g.userData.react = (kind = 'wave') => { act = kind; actT = 0; };
  g.userData.idle = (t) => {
    const dt = lt === null ? 0 : Math.min(0.1, t - lt); lt = t; actT += dt;
    g.getWorldPosition(cur); const sc = g.getWorldScale(new THREE.Vector3()).y || 1; const v = dt > 0 ? cur.distanceTo(last) / dt / sc : 0; last.copy(cur); speed += (v - speed) * Math.min(1, dt * 6);
    const walk = Math.min(1, speed * 1.5), ph = t * 9;
    spine.rotation.set(Math.sin(t * 2) * 0.03, 0, Math.sin(t * 1.3) * 0.03);
    head.rotation.set(Math.sin(t * 1.7) * 0.06, Math.sin(t * 0.9) * 0.3, Math.sin(t * 1.1) * 0.07);
    legL.rotation.x = Math.sin(ph) * 0.5 * walk; legR.rotation.x = -Math.sin(ph) * 0.5 * walk;
    hips.position.y = (hips.userData.y0 ?? (hips.userData.y0 = hips.position.y)) + Math.abs(Math.sin(ph)) * 0.015 * walk;
    const rest = RIGS[key].rest || 0; let aL = rest - 0.05 + Math.sin(t * 1.5) * 0.06, aR = -rest + 0.05 - Math.sin(t * 1.5 + 1) * 0.06; let fL = Math.sin(ph) * 0.4 * walk, fR = -fL;
    if (act === 'wave') { const k = Math.min(1, actT * 4) * Math.min(1, Math.max(0, (2.2 - actT) * 4)); aR += k * (1.9 + Math.sin(actT * 14) * 0.35); if (actT > 2.3) act = null; }
    if (act === 'cheer') { const k = Math.min(1, actT * 4) * Math.min(1, Math.max(0, (1.6 - actT) * 4)); aR += k * 2.2; aL -= k * 2.2; if (actT > 1.7) act = null; }
    armL.rotation.set(fL, 0, aL); armR.rotation.set(fR, 0, aR);
    if (tail) tail.rotation.set(0, Math.sin(t * (act ? 9 : 3.5)) * (act ? 0.7 : 0.35), Math.sin(t * 2) * 0.1);
    if (wingL) { const f = Math.sin(t * (act ? 14 : 5)) * (act ? 0.6 : 0.3); wingL.rotation.y = f; wingR.rotation.y = -f; }
  };
}

export function b64ToBuf(b64) { const s = atob(b64), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u.buffer; }
export async function loadModels() {
  const loader = new GLTFLoader();
  const get = async (name) => {
    try {
      const url = new URL(`./models/${name}.glb`, import.meta.url);
      return await loader.loadAsync(url.href);
    } catch (error) {
      console.warn('Could not load Number Garden model:', name, error);
      return null;
    }
  };
  const [nia, addie, freddy, gwenda] = await Promise.all(['nia', 'addie', 'freddy', 'gwenda'].map(get));
  if (nia) {
    nia.scene.traverse(o => { if (o.isMesh) { o.frustumCulled = false; o.castShadow = true; } });
    const wrap = normalize(nia.scene);
    // sparkle-green number wand in her right hand
    let hand; nia.scene.traverse(o => { if (/RightHand$/i.test(o.name)) hand = o; });
    if (hand) {
      const ws = hand.getWorldScale(new THREE.Vector3()).x, k = 1 / ws;
      const wand = new THREE.Group(); wand.name = 'wand';
      const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.22, 8), new THREE.MeshStandardMaterial({ color: '#7a4a1e' })); stick.position.y = 0.12; wand.add(stick);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.028, 16, 12), new THREE.MeshBasicMaterial({ color: '#9dff8a' })); tip.position.y = 0.24; tip.name = 'wandTip'; wand.add(tip);
      wand.scale.setScalar(k); hand.add(wand);
    }
    // keep the walk in place: drop horizontal root motion
    const clips = nia.animations.map(c => { c = c.clone(); c.tracks = c.tracks.filter(t => !/Hips\.position/.test(t.name)); return c; });
    MODELS.nia = { wrap, clips };
  }
  if (addie) { addie.scene.traverse(o => { if (o.isMesh) o.castShadow = true; }); MODELS.addie = { wrap: autoRig(normalize(addie.scene), 'addie') }; }
  if (freddy) { freddy.scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.material = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.75, sheen: 0.8, sheenRoughness: 0.5, sheenColor: new THREE.Color('#ffd2a8') }); o.geometry.computeVertexNormals(); const ca = o.geometry.attributes.color; if (ca) { const col = new THREE.Color(); const arr = new Float32Array(ca.count * 3); for (let i = 0; i < ca.count; i++) { col.setRGB(ca.getX(i), ca.getY(i), ca.getZ(i)).convertSRGBToLinear(); arr.set([col.r, col.g, col.b], i * 3); } o.geometry.setAttribute('color', new THREE.BufferAttribute(arr, 3)); } } }); MODELS.freddy = { wrap: autoRig(normalize(freddy.scene), 'freddy') }; }
  if (gwenda) { gwenda.scene.traverse(o => { if (o.isMesh) { o.castShadow = true; if (o.material) o.material.side = THREE.DoubleSide; } }); MODELS.gwenda = { wrap: autoRig(normalize(gwenda.scene), 'gwenda') }; }
  return MODELS;
}
function glbNia() {
  const g = SkeletonUtils.clone(MODELS.nia.wrap);
  const mixer = new THREE.AnimationMixer(g);
  const walkClip = MODELS.nia.clips.find(c => /walk/i.test(c.name)) || MODELS.nia.clips[0];
  const runClip = MODELS.nia.clips.find(c => /run/i.test(c.name));
  const walk = mixer.clipAction(walkClip); walk.play();
  const run = runClip ? mixer.clipAction(runClip) : null; if (run) { run.play(); run.weight = 0; }
  let tip; g.traverse(o => { if (o.name === 'wandTip') tip = o; });
  const last = new THREE.Vector3(), cur = new THREE.Vector3(); let lt = null, speed = 0;
  g.userData.parts = { tip: tip || g };
  let burst = 0; g.userData.react = () => { burst = 1.2; };
  g.userData.idle = (t) => {
    const dt = lt === null ? 0 : Math.min(0.1, t - lt); lt = t;
    g.getWorldPosition(cur); const sc = g.getWorldScale(new THREE.Vector3()).y || 1;
    const v = dt > 0 ? cur.distanceTo(last) / dt / sc : 0; last.copy(cur);
    speed += (v - speed) * Math.min(1, dt * 6);
    const moving = speed > 0.15;
    walk.timeScale = moving ? Math.min(1.6, 0.6 + speed) : 0;
    if (!moving) { walk.time = 0.1; }
    if (burst > 0) { burst -= dt; walk.timeScale = 0; if (run) { run.weight = 1; walk.weight = 0; run.timeScale = 1.2; } mixer.update(dt); return; }
    if (run) { run.weight = speed > 1.2 ? 1 : 0; walk.weight = 1 - run.weight; }
    mixer.update(dt);
  };
  return g;
}

export const FONT = '"Fredoka", "Baloo 2", system-ui, sans-serif';
export const PAL = { purple: '#7b2cbf', green: '#1f9d55', leaf: '#38b000', yellow: '#ffd23f', pink: '#ff5fa2',
  orange: '#ff8c1a', blue: '#3a86ff', red: '#ef233c', teal: '#2ec4b6', gold: '#ffb703', skin: '#8d5524' };
export const NUM_COLORS = ['#3a86ff', '#2ec4b6', '#ffb703', '#ef233c', '#ff8c1a', '#7b2cbf', '#ff5fa2', '#38b000', '#ff006e', '#00b4d8'];

/* ---------- materials ---------- */
let grad;
function gradMap() {
  if (grad) return grad;
  const d = new Uint8Array([90, 170, 255]);
  grad = new THREE.DataTexture(d, 3, 1, THREE.RedFormat);
  grad.minFilter = grad.magFilter = THREE.NearestFilter; grad.needsUpdate = true;
  return grad;
}
const matCache = new Map();
// Soft glossy "animated film" look: physical material with a hint of clearcoat and sheen, lit by the environment map
export function toon(color, opts = {}) {
  const { unique, gloss = 0.35, fuzz = 0.25, ...rest } = opts;
  const key = color + JSON.stringify(opts);
  if (!unique && matCache.has(key)) return matCache.get(key);
  const m = new THREE.MeshPhysicalMaterial({ color, roughness: 0.5, metalness: 0, clearcoat: gloss, clearcoatRoughness: 0.35, sheen: fuzz, sheenRoughness: 0.6, sheenColor: new THREE.Color('#ffffff'), ...rest });
  if (!unique) matCache.set(key, m);
  return m;
}
/* ---------- painted procedural textures ---------- */
const ptex = new Map();
function painted(key, w, h, draw, repeat) {
  if (ptex.has(key)) return ptex.get(key);
  const t = canvasTex(w, h, draw); if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); }
  ptex.set(key, t); return t;
}
const rnd = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(7);
export function furTex(base, light, dark) { // short brush-stroke fur
  return painted('fur' + base, 256, 256, (c) => {
    c.fillStyle = base; c.fillRect(0, 0, 256, 256); c.lineCap = 'round';
    for (let i = 0; i < 2600; i++) { const x = rnd() * 256, y = rnd() * 256, a = Math.PI / 2 + (rnd() - 0.5) * 0.7, l = 4 + rnd() * 7;
      c.strokeStyle = rnd() < 0.5 ? light : dark; c.globalAlpha = 0.25 + rnd() * 0.35; c.lineWidth = 1 + rnd() * 1.4;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke(); }
    c.globalAlpha = 1;
  }, 2);
}
export function stripeTex(colors, n = 10, key = '') {
  return painted('stripe' + colors.join() + n + key, 256, 64, (c) => { const w = 256 / n; for (let i = 0; i < n; i++) { c.fillStyle = colors[i % colors.length]; c.fillRect(i * w, 0, w + 1, 64); c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(i * w, 0, w * 0.25, 64); } });
}
export function sparkleTex(base, glint = '#ffffff') {
  return painted('spk' + base, 256, 256, (c) => { const g = c.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, base); g.addColorStop(1, shade(base, -0.12)); c.fillStyle = g; c.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 140; i++) { c.fillStyle = glint; c.globalAlpha = 0.3 + rnd() * 0.7; const x = rnd() * 256, y = rnd() * 256, r = 0.6 + rnd() * 1.8; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); } c.globalAlpha = 1; }, 1);
}
export function spotsTex(base, spot) {
  return painted('spots' + base + spot, 256, 128, (c) => { c.fillStyle = base; c.fillRect(0, 0, 256, 128);
    for (let i = 0; i < 18; i++) { c.fillStyle = spot; c.globalAlpha = 0.5; c.beginPath(); c.ellipse(rnd() * 256, rnd() * 128, 6 + rnd() * 10, 4 + rnd() * 6, rnd() * 3, 0, 7); c.fill(); } c.globalAlpha = 1; });
}
export const glowMat = (color, op = 1) => new THREE.MeshBasicMaterial({ color, transparent: op < 1, opacity: op });

/* ---------- geometry shortcuts ---------- */
export function sph(r, color, x = 0, y = 0, z = 0, mat) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), mat || toon(color)); m.position.set(x, y, z); return m;
}
export function cyl(rt, rb, h, color, x = 0, y = 0, z = 0, seg = 16) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), toon(color)); m.position.set(x, y, z); return m;
}
export function cap(r, h, color, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, h, 6, 14), toon(color)); m.position.set(x, y, z); return m;
}
export function box(w, h, d, color, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), toon(color)); m.position.set(x, y, z); return m;
}
export function eye(r) {
  const g = new THREE.Group();
  g.add(sph(r, '#ffffff', 0, 0, 0, toon('#ffffff', { gloss: 1, fuzz: 0, roughness: 0.2 })));
  g.add(sph(r * 0.62, '#3b2410', 0, -r * 0.05, r * 0.5, toon('#3b2410', { gloss: 1, fuzz: 0, roughness: 0.15 })));
  g.add(sph(r * 0.2, '#ffffff', r * 0.18, r * 0.15, r * 0.95, glowMat('#ffffff')));
  return g;
}
function smile(r, color = '#5a1a1a') {
  const m = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.18, 8, 20, Math.PI), toon(color));
  m.rotation.z = Math.PI; return m;
}

/* ---------- canvas textures ---------- */
export function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  t.userData.canvas = c; return t;
}
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

// Speech-bubble style label sprite (always faces the viewer)
export function label(text, o = {}) {
  const size = o.size || 0.07, bg = ('bg' in o) ? o.bg : '#ffffff', fg = o.fg || '#3c1361', pad = 28;
  const fs = 72, ctx0 = document.createElement('canvas').getContext('2d');
  ctx0.font = `700 ${fs}px ${FONT}`;
  const lines = String(text).split('\n');
  const tw = Math.max(...lines.map(l => ctx0.measureText(l).width));
  const w = Math.ceil(tw + pad * 2 + 8), h = Math.ceil(lines.length * fs * 1.15 + pad * 1.6);
  const tex = canvasTex(w, h, (c) => {
    if (bg) { rr(c, 4, 4, w - 8, h - 8, Math.min(46, h / 2 - 4)); c.fillStyle = bg; c.fill();
      c.lineWidth = 7; c.strokeStyle = o.border || '#7b2cbf'; c.stroke(); }
    c.font = `700 ${fs}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = fg;
    if (!bg) { c.lineWidth = 14; c.strokeStyle = '#ffffff'; lines.forEach((l, i) => c.strokeText(l, w / 2, pad * 0.8 + fs * 0.6 + i * fs * 1.15)); }
    lines.forEach((l, i) => c.fillText(l, w / 2, pad * 0.8 + fs * 0.6 + i * fs * 1.15));
  });
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: o.depthTest ?? true }));
  const k = size / fs; sp.scale.set(w * k, h * k, 1);
  sp.userData.baseScale = sp.scale.clone();
  sp.renderOrder = 10;
  return sp;
}

// Round tappable answer chip
export function chip(text, color, onTap, size = 0.13) {
  const tex = canvasTex(256, 256, (c) => {
    const g = c.createRadialGradient(100, 90, 20, 128, 128, 128);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.18, color); g.addColorStop(1, shade(color, -0.35));
    c.beginPath(); c.arc(128, 128, 118, 0, Math.PI * 2); c.fillStyle = g; c.fill();
    c.lineWidth = 10; c.strokeStyle = '#ffffff'; c.stroke();
    const s = String(text); const fs = s.length > 3 ? 70 : s.length > 2 ? 88 : 120;
    c.font = `700 ${fs}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineWidth = 12; c.strokeStyle = shade(color, -0.5); c.strokeText(s, 128, 136);
    c.fillStyle = '#fff'; c.fillText(s, 128, 136);
  });
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  sp.scale.set(size, size, 1); sp.userData.baseScale = sp.scale.clone(); sp.userData.onTap = onTap; sp.renderOrder = 12;
  return sp;
}

export function shade(hex, amt) {
  const c = new THREE.Color(hex); const hsl = {}; c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s, Math.max(0, Math.min(1, hsl.l + amt))); return '#' + c.getHexString();
}

// Chunky candy-style 3D numeral: stacked layers give real depth from any angle
const numTexCache = new Map();
function numTex(text, color, dark) {
  const key = text + color + dark;
  if (numTexCache.has(key)) return numTexCache.get(key);
  const t = canvasTex(256, 256, (c) => {
    const s = String(text), fs = s.length > 2 ? 120 : s.length > 1 ? 160 : 220;
    c.font = `700 ${fs}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    if (dark) { c.lineWidth = 22; c.strokeStyle = shade(color, -0.3); c.lineJoin = 'round'; c.strokeText(s, 128, 140); c.fillStyle = shade(color, -0.3); c.fillText(s, 128, 140); }
    else {
      const g = c.createLinearGradient(0, 30, 0, 230); g.addColorStop(0, shade(color, 0.25)); g.addColorStop(1, color);
      c.lineWidth = 16; c.strokeStyle = '#ffffff'; c.lineJoin = 'round'; c.strokeText(s, 128, 140);
      c.fillStyle = g; c.fillText(s, 128, 140);
      c.globalAlpha = 0.55; c.fillStyle = '#ffffff'; c.font = `700 ${fs * 0.22}px ${FONT}`; c.fillText('✦', 96, 82);
    }
  });
  numTexCache.set(key, t); return t;
}
export function num3D(text, color, size = 0.2, layers = 7) {
  const g = new THREE.Group(); const geo = new THREE.PlaneGeometry(size, size);
  for (let i = 0; i < layers; i++) {
    const front = i === layers - 1;
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: numTex(text, color, !front), transparent: true, alphaTest: 0.4, side: THREE.DoubleSide }));
    m.position.z = (i - layers + 1) * size * 0.022; g.add(m);
  }
  // mirrored front for the back side so it reads from behind as a solid numeral
  const back = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: numTex(text, color, false), transparent: true, alphaTest: 0.4, side: THREE.BackSide }));
  back.position.z = -(layers) * size * 0.022; g.add(back);
  g.userData.billboard = true; g.userData.num = text;
  return g;
}

/* ---------- butterfly-style wing textures ---------- */
function wingTex(fill, edge, motif, glyph) {
  return canvasTex(256, 256, (c) => {
    const gr = c.createRadialGradient(40, 128, 10, 120, 128, 170); gr.addColorStop(0, shade(fill, 0.18)); gr.addColorStop(0.6, fill); gr.addColorStop(1, shade(fill, -0.15));
    c.fillStyle = gr; c.strokeStyle = edge; c.lineWidth = 10;
    c.beginPath(); c.ellipse(120, 82, 110, 72, -0.35, 0, Math.PI * 2); c.fill(); c.stroke();
    c.beginPath(); c.ellipse(96, 186, 76, 58, 0.45, 0, Math.PI * 2); c.fill(); c.stroke();
    c.strokeStyle = shade(edge, 0.1); c.globalAlpha = 0.35; c.lineWidth = 3;
    for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(8, 128); c.quadraticCurveTo(80, 60 + k * 30, 200 - k * 12, 20 + k * 40); c.stroke(); }
    c.globalAlpha = 1; c.fillStyle = 'rgba(255,255,255,.6)';
    for (let k = 0; k < 10; k++) { c.beginPath(); c.arc(200 - k * 9, 40 + (k % 3) * 9, 3, 0, 7); c.fill(); }
    c.fillStyle = motif;
    if (glyph) { c.font = `700 120px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(glyph, 128, 130); }
    else { for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(60 + k * 36, 60 + r * 34, 9, 0, 7); c.fill(); } }
  });
}
export function winged(fill, edge, motif, glyph, bodyColor = '#3c1361', size = 0.3) {
  const g = new THREE.Group(); const tex = wingTex(fill, edge, motif, glyph);
  const geo = new THREE.PlaneGeometry(size, size); geo.translate(size / 2, 0, 0);
  const wm = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide });
  const R = new THREE.Mesh(geo, wm), L = new THREE.Mesh(geo, wm);
  L.scale.x = -1; g.add(R, L);
  const body = cap(size * 0.06, size * 0.45, bodyColor); g.add(body);
  const head = sph(size * 0.08, bodyColor, 0, size * 0.33, 0); g.add(head);
  for (const s of [-1, 1]) { const a = cyl(0.004, 0.004, size * 0.3, bodyColor, s * size * 0.06, size * 0.48, 0); a.rotation.z = -s * 0.4; g.add(a); g.add(sph(size * 0.03, edge, s * size * 0.12, size * 0.62, 0)); }
  g.userData.flap = (t, speed = 9) => { const a = Math.sin(t * speed) * 0.9; R.rotation.y = a; L.rotation.y = -a; };
  return g;
}

/* ---------- characters (about 1 unit tall before scaling) ---------- */
export function makeNia() {
  if (MODELS.nia) return glbNia();
  const g = new THREE.Group(), skin = PAL.skin;
  for (const s of [-1, 1]) {
    g.add(cap(0.075, 0.22, '#3d6fd8', s * 0.09, 0.2, 0));
    const shoe = sph(0.09, '#5ccf3a', s * 0.09, 0.05, 0.04); shoe.scale.set(1, 0.6, 1.4); g.add(shoe);
    g.add(sph(0.05, '#c13bd1', s * 0.09, 0.07, -0.06));
  }
  const torso = cap(0.17, 0.18, '#ffd23f', 0, 0.48, 0); torso.scale.z = 0.85; g.add(torso);
  const bib = box(0.2, 0.17, 0.04, '#3d6fd8', 0, 0.44, 0.13); g.add(bib);
  const eight = label('8', { bg: null, fg: '#ffd23f', size: 0.09 }); eight.position.set(0, 0.45, 0.16); g.add(eight);
  const strap = cyl(0.012, 0.012, 0.5, '#ff7eb6', 0, 0.5, 0.05); strap.rotation.z = 0.7; g.add(strap);
  const bag = box(0.12, 0.1, 0.05, '#ff7eb6', 0.17, 0.3, 0.08); g.add(bag);
  const armL = cap(0.055, 0.2, '#ffd23f', -0.2, 0.47, 0); armL.rotation.z = -0.35; g.add(armL);
  const armR = new THREE.Group(); armR.position.set(0.19, 0.6, 0);
  const ar = cap(0.055, 0.2, '#ffd23f', 0.05, 0.1, 0); ar.rotation.z = -0.5; armR.add(ar);
  armR.add(sph(0.05, skin, 0.12, 0.22, 0));
  const wand = cyl(0.012, 0.012, 0.3, '#7a4a1e', 0.14, 0.34, 0.02); wand.rotation.z = -0.25; armR.add(wand);
  const tip = sph(0.04, '#7dff7a', 0.18, 0.49, 0.03, glowMat('#9dff8a')); armR.add(tip);
  g.add(armR);
  const head = new THREE.Group(); head.position.y = 0.8; g.add(head);
  head.add(sph(0.2, skin));
  for (const s of [-1, 1]) {
    const e = eye(0.045); e.position.set(s * 0.075, 0.02, 0.17); head.add(e);
    head.add(sph(0.035, '#ff8fa3', s * 0.12, -0.06, 0.15, glowMat('#e9748a', 0.6)));
    head.add(sph(0.045, skin, s * 0.2, 0, 0));
    const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(0.15, 1), toon('#3b1d0e', { flatShading: true }));
    puff.position.set(s * 0.17, 0.2, -0.04); head.add(puff);
    const tie = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.02, 8, 16), toon('#ff8fc8')); tie.position.set(s * 0.11, 0.13, -0.02); tie.rotation.set(0.5, 0, s * 0.8); head.add(tie);
  }
  const cap2 = sph(0.205, '#3b1d0e', 0, 0.03, -0.02); cap2.scale.set(1, 0.85, 1); cap2.position.y = 0.05; cap2.position.z = -0.03; head.add(cap2);
  const m = smile(0.06); m.position.set(0, -0.07, 0.18); head.add(m);
  g.userData.parts = { head, armR, tip };
  g.userData.idle = (t) => { armR.rotation.z = Math.sin(t * 3) * 0.25; head.rotation.y = Math.sin(t * 0.9) * 0.2; };
  return g;
}
export function makeAddie() { // the Addition Ant: hard hat, safety vest, no tail
  if (MODELS.addie) { const g = new THREE.Group(); g.add(SkeletonUtils.clone(MODELS.addie.wrap)); animateRig(g, 'addie'); return g; }
  const g = new THREE.Group(), y = '#f6c90e';
  for (const s of [-1, 1]) { g.add(cap(0.04, 0.22, '#3c2a12', s * 0.08, 0.15, 0)); g.add(sph(0.06, '#3c2a12', s * 0.08, 0.04, 0.03)); }
  const body = sph(0.17, y, 0, 0.42, 0); body.scale.set(1, 1.15, 0.9); g.add(body);
  const vest = cyl(0.172, 0.18, 0.24, '#46c25a', 0, 0.42, 0); vest.scale.z = 0.92; g.add(vest);
  for (const s of [-1, 1]) { const st = box(0.03, 0.24, 0.01, '#ff9f1c', s * 0.08, 0.42, 0.165); g.add(st); }
  for (const s of [-1, 1]) for (const k of [0, 1]) { const a = cap(0.03, 0.17, y, s * 0.2, 0.45 - k * 0.12, 0); a.rotation.z = s * (0.9 + k * 0.4); g.add(a); }
  const head = new THREE.Group(); head.position.y = 0.76; g.add(head);
  head.add(sph(0.2, y));
  for (const s of [-1, 1]) {
    const e = eye(0.06); e.position.set(s * 0.08, 0.02, 0.15); head.add(e);
    const an = cyl(0.008, 0.008, 0.22, '#3c2a12', s * 0.08, 0.3, 0); an.rotation.z = -s * 0.4; head.add(an);
    head.add(sph(0.03, '#ff5fa2', s * 0.13, 0.4, 0));
  }
  const m = smile(0.06); m.position.set(0, -0.08, 0.17); head.add(m);
  const hat = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), toon('#ffb703')); hat.position.y = 0.07; head.add(hat);
  const brim = cyl(0.25, 0.25, 0.02, '#ffb703', 0, 0.08, 0.03); head.add(brim);
  g.userData.idle = (t) => { head.rotation.z = Math.sin(t * 2.2) * 0.12; };
  return g;
}
export function makeFreddy() {
  if (MODELS.freddy) { const g = new THREE.Group(); g.add(SkeletonUtils.clone(MODELS.freddy.wrap)); animateRig(g, 'freddy'); return g; }
  const g = new THREE.Group(), o = '#e8742a';
  for (const s of [-1, 1]) g.add(cap(0.06, 0.2, '#4a2c17', s * 0.08, 0.14, 0));
  const furM = toon('#ffffff', { map: furTex('#e8742a', '#ffa45c', '#b8521a'), fuzz: 0.8, gloss: 0 });
  const body = cap(0.15, 0.2, o, 0, 0.44, 0); body.material = furM; g.add(body);
  g.add(box(0.12, 0.25, 0.02, '#fff7e6', 0, 0.46, 0.14));
  const vest = cyl(0.158, 0.16, 0.24, '#7a4a1e', 0, 0.45, -0.01, 16); vest.material = toon('#ffffff', { map: furTex('#7a4a1e', '#8d5a2b', '#5e3714'), gloss: 0, fuzz: 0.4 }); vest.scale.z = 0.9; g.add(vest);
  g.add(box(0.06, 0.2, 0.02, '#fff7e6', 0, 0.47, 0.15));
  const bow = sph(0.03, '#2a9d8f', 0, 0.62, 0.15); bow.scale.x = 2; g.add(bow);
  for (const s of [-1, 1]) { const a = cap(0.045, 0.2, o, s * 0.19, 0.45, 0); a.rotation.z = s * 0.3; g.add(a); }
  const tail = new THREE.Group(); tail.position.set(0, 0.3, -0.13); g.add(tail);
  const tl = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.4, 14), furM); tl.rotation.x = -2.2; tl.position.set(0, 0.08, -0.15); tail.add(tl);
  tail.add(sph(0.06, '#ffffff', 0, 0.21, -0.3));
  const head = new THREE.Group(); head.position.y = 0.8; g.add(head);
  head.add(sph(0.19, o, 0, 0, 0, furM));
  for (const s of [-1, 1]) head.add(sph(0.08, '#fff1e0', s * 0.09, -0.08, 0.12));
  const snout = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.2, 14), toon('#fff1e0')); snout.rotation.x = Math.PI / 2; snout.position.set(0, -0.05, 0.22); head.add(snout);
  head.add(sph(0.03, '#1b1b1b', 0, -0.05, 0.32));
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.17, 4), toon(o)); ear.position.set(s * 0.12, 0.2, 0); ear.rotation.z = -s * 0.3; head.add(ear);
    const e = eye(0.04); e.position.set(s * 0.075, 0.04, 0.15); head.add(e);
    const gl = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.01, 8, 20), toon('#222')); gl.position.set(s * 0.075, 0.04, 0.19); head.add(gl);
  }
  head.add(box(0.05, 0.012, 0.012, '#222', 0, 0.05, 0.19));
  g.userData.idle = (t) => { tail.rotation.y = Math.sin(t * 3) * 0.5; head.rotation.y = Math.sin(t * 1.1) * 0.2; };
  return g;
}
export function makeCarlo(n = 10) {
  return makeCarloHD(n);
  const g = new THREE.Group(), segs = [];
  for (let i = 0; i < n; i++) {
    const s = new THREE.Group();
    const ball = sph(0.075, '#5ccf3a', 0, 0, 0, toon('#ffffff', { unique: true, map: spotsTex('#5fcf48', '#c8f56a'), emissive: '#000000', gloss: 0.9 }));
    s.add(ball);
    const lb = label(String(i + 1), { bg: null, fg: '#ffffff', size: 0.07 }); lb.position.set(0, 0.11, 0.02); s.add(lb);
    s.position.set(-0.4 + i * 0.09, 0.08, Math.sin(i * 0.8) * 0.04);
    s.userData.ball = ball; segs.push(s); g.add(s);
  }
  const head = sph(0.1, '#7ddc4a', 0.53, 0.12, 0); g.add(head);
  for (const s of [-1, 1]) { const e = eye(0.03); e.position.set(0.58, 0.15, s * 0.05); e.rotation.y = Math.PI / 2; g.add(e); }
  g.userData.segs = segs;
  return g;
}
export function makeSubby() {
  return makeSubbyHD2();
  const g = new THREE.Group();
  const foot = cap(0.08, 0.4, '#9b5de5', 0, 0.08, 0); foot.material = toon('#9b5de5', { gloss: 1, roughness: 0.25, fuzz: 0 }); foot.rotation.z = Math.PI / 2; g.add(foot);
  const neck = cap(0.075, 0.14, '#9b5de5', 0.25, 0.2, 0); neck.rotation.z = -0.4; g.add(neck);
  for (const s of [-1, 1]) { const st = cyl(0.01, 0.01, 0.12, '#9b5de5', 0.3, 0.36, s * 0.04); g.add(st); const e = eye(0.03); e.position.set(0.31, 0.43, s * 0.04); e.rotation.y = Math.PI / 2; g.add(e); }
  const shell = new THREE.Group(); shell.position.set(-0.05, 0.28, 0);
  const smat = toon('#ffffff', { unique: true, map: stripeTex(['#f4a261', '#e76f51', '#ffd166'], 12, 'shell'), emissive: '#000000', gloss: 0.9, roughness: 0.3 });
  for (let i = 0; i < 4; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.16 - i * 0.04, 0.05 - i * 0.008, 10, 30), smat); t.position.z = (i - 1.5) * 0.02; shell.add(t); }
  shell.add(new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), smat));
  g.add(shell); g.userData.shell = shell; g.userData.shellMat = smat;
  return g;
}
export function makeMilly() {
  return makeMillyHD();
  const m = winged('#ffb3d9', '#e05297', '#fff2a8', null, '#b5838d', 0.6);
  return m;
}
export function makeButterfly8(size = 0.3) { return makeButterfly8HD(size); return winged('#ffd23f', '#ff8c1a', '#7b2cbf', '8', '#5a189a', size); }
export function makeSkippy() {
  return makeSkippyHD();
  const g = new THREE.Group(), r = '#d64933';
  const sf = toon('#ffffff', { map: furTex('#d64933', '#ff7a52', '#9e2f1c'), fuzz: 0.9, gloss: 0 });
  const body = sph(0.15, r, 0, 0.25, 0, sf); body.scale.set(0.9, 1.1, 0.9); g.add(body);
  g.add(sph(0.09, '#ffe5d0', 0, 0.24, 0.1));
  const head = sph(0.13, r, 0, 0.5, 0.04, sf); g.add(head);
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.1, 6), toon(r)); ear.position.set(s * 0.08, 0.63, 0.02); g.add(ear);
    const e = eye(0.035); e.position.set(s * 0.05, 0.52, 0.14); g.add(e);
    g.add(sph(0.05, r, s * 0.08, 0.08, 0.06));
  }
  g.add(sph(0.02, '#2b2b2b', 0, 0.47, 0.17));
  const tail = new THREE.Group(); tail.position.set(0, 0.18, -0.12); g.add(tail);
  for (let i = 0; i < 7; i++) { const a = i / 6; tail.add(sph(0.06 + a * 0.05, r, 0, Math.sin(a * 2.4) * 0.35, -Math.sin(a * 1.6) * 0.15 - 0.02, sf)); }
  g.userData.idle = (t) => { tail.rotation.x = Math.sin(t * 4) * 0.15; };
  return g;
}
export function makeGwenda() {
  if (MODELS.gwenda) { const g = new THREE.Group(), w = SkeletonUtils.clone(MODELS.gwenda.wrap); g.add(w); animateRig(g, 'gwenda'); const base = g.userData.idle; g.userData.idle = (t) => { base(t); w.position.y = 0.04 + Math.sin(t * 2) * 0.025; }; return g; }
  const g = new THREE.Group();
  const dress = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.5, 28), toon('#ffffff', { map: sparkleTex('#fff3d6', '#ffd23f'), gloss: 0.6, fuzz: 0.6, sheenColor: new THREE.Color('#ffe9a8') })); dress.position.y = 0.3; g.add(dress);
  g.add(sph(0.11, PAL.skin, 0, 0.62, 0));
  const hair = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 1), toon('#2b140a', { flatShading: true })); hair.position.set(0, 0.72, -0.03); g.add(hair);
  const crown = cyl(0.07, 0.06, 0.05, '#ffb703', 0, 0.82, 0, 8); crown.material = new THREE.MeshStandardMaterial({ color: '#ffc300', metalness: 0.9, roughness: 0.2 }); g.add(crown);
  for (const s of [-1, 1]) { const e = eye(0.025); e.position.set(s * 0.04, 0.63, 0.09); g.add(e); }
  const wtex = canvasTex(128, 128, (c) => { const gr = c.createRadialGradient(40, 64, 5, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(1, 'rgba(200,170,255,.15)'); c.fillStyle = gr; c.beginPath(); c.ellipse(64, 64, 60, 40, 0.4, 0, 7); c.fill(); });
  const wings = [];
  for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.4), new THREE.MeshBasicMaterial({ map: wtex, transparent: true, side: THREE.DoubleSide, depthWrite: false })); w.position.set(s * 0.2, 0.5, -0.08); w.scale.x = s; g.add(w); wings.push(w); }
  const wand = cyl(0.008, 0.008, 0.3, '#ffe9a8', 0.18, 0.48, 0.05); wand.rotation.z = -0.5; g.add(wand);
  { const st = label('★', { bg: null, fg: '#ffd23f', size: 0.1 }); st.position.set(0.27, 0.62, 0.05); g.add(st); }
  g.userData.idle = (t) => { wings.forEach((w, i) => w.rotation.y = Math.sin(t * 6) * 0.4 * (i ? -1 : 1)); g.position.y = (g.userData.baseY || 0) + Math.sin(t * 2) * 0.02; };
  return g;
}
export function makeHeart(size = 0.3) {
  const s = new THREE.Shape(); const x = 0, y = 0;
  s.moveTo(x, y + 0.25); s.bezierCurveTo(x, y + 0.25, x - 0.05, y + 0.5, x - 0.25, y + 0.5);
  s.bezierCurveTo(x - 0.55, y + 0.5, x - 0.55, y + 0.15, x - 0.55, y + 0.15);
  s.bezierCurveTo(x - 0.55, y - 0.05, x - 0.35, y - 0.27, x, y - 0.45);
  s.bezierCurveTo(x + 0.35, y - 0.27, x + 0.55, y - 0.05, x + 0.55, y + 0.15);
  s.bezierCurveTo(x + 0.55, y + 0.15, x + 0.55, y + 0.5, x + 0.25, y + 0.5);
  s.bezierCurveTo(x + 0.1, y + 0.5, x, y + 0.25, x, y + 0.25);
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.2, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 4 });
  geo.center(); geo.scale(size, size, size);
  return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: '#ff2e63', emissive: '#a0002a', emissiveIntensity: 0.5, roughness: 0.3, metalness: 0.1 }));
}
export function makeFlower(color = PAL.pink, h = 0.25, petals = 6, center = '#ffd23f') {
  return makePetalFlower(color, h, Math.max(5, petals), center, petals > 8 ? 0.06 : 0.045);
}
export function makeTree(h = 0.5, fruit = '#ef233c') {
  const t = makeStoryTree(h * 1.15, { fruit, bareFruit: true, blossom: '#ffb3d9' });
  t.userData.fruit = fruit; return t;
}
export function makeGate() {
  const g = new THREE.Group();
  const st = stoneTex().clone(); st.needsUpdate = true; st.repeat.set(1, 3);
  const sm = new THREE.MeshStandardMaterial({ map: st, roughness: 0.9 });
  for (const s of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.56, 0.1), sm); p.position.set(s * 0.27, 0.28, 0); g.add(p);
    const capS = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.03, 0.13), sm); capS.position.set(s * 0.27, 0.575, 0); g.add(capS);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), sm); ball.position.set(s * 0.27, 0.63, 0); g.add(ball);
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.05, 0.14), sm); base.position.set(s * 0.27, 0.025, 0); g.add(base);
  }
  const arch = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.03, 10, 40, Math.PI), toon('#2d8a34', { gloss: 0 })); arch.position.y = 0.55; g.add(arch);
  // ivy leaves and blossoms climbing the pillars and arch
  const leafG = new THREE.SphereGeometry(0.022, 8, 6); leafG.scale(1.4, 0.5, 1);
  const lm = [toon('#3fae4a', { gloss: 0.2 }), toon('#6fd06a', { gloss: 0.2 }), toon('#2d8a34', { gloss: 0.2 })];
  for (let i = 0; i < 70; i++) {
    let x, y, z = 0.05 * (Math.random() - 0.3);
    if (i < 40) { const a = i / 39 * Math.PI; x = Math.cos(a) * 0.27 + (Math.random() - 0.5) * 0.04; y = 0.55 + Math.sin(a) * 0.27 + (Math.random() - 0.5) * 0.04; }
    else { const s = i % 2 ? 1 : -1; x = s * (0.27 + (Math.random() - 0.5) * 0.11); y = 0.08 + Math.random() * 0.48; z = 0.055; }
    const l = new THREE.Mesh(leafG, lm[i % 3]); l.position.set(x, y, z); l.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3); g.add(l);
  }
  for (let i = 0; i < 16; i++) { const a = i / 15 * Math.PI; g.add(sph(0.022, NUM_COLORS[i % 10], Math.cos(a) * 0.27, 0.55 + Math.sin(a) * 0.27, 0.035)); }
  const doors = [];
  for (const s of [-1, 1]) {
    const d = new THREE.Group(); d.position.set(s * 0.26, 0, 0);
    for (let k = 0; k < 5; k++) { d.add(cyl(0.008, 0.008, 0.5, '#2b2b35', -s * (0.04 + k * 0.05), 0.27, 0, 6)); d.add(new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.04, 6), new THREE.MeshStandardMaterial({ color: '#d4a017', metalness: 0.8, roughness: 0.3 }))).children.at(-1).position.set(-s * (0.04 + k * 0.05), 0.54, 0); }
    for (const yy of [0.1, 0.45]) d.add(box(0.25, 0.02, 0.015, '#2b2b35', -s * 0.13, yy, 0));
    const sc = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.007, 6, 20), toon('#2b2b35')); sc.position.set(-s * 0.13, 0.28, 0); d.add(sc);
    g.add(d); doors.push(d);
  }
  g.userData.doors = doors;
  return g;
}
let lilyT;
export function makeLily(color = '#3bb273') {
  lilyT = lilyT || canvasTex(256, 256, (c) => { const g = c.createRadialGradient(128, 128, 10, 128, 128, 128); g.addColorStop(0, '#7fd88a'); g.addColorStop(1, '#2f9e55'); c.fillStyle = g; c.fillRect(0, 0, 256, 256);
    c.strokeStyle = 'rgba(30,90,40,.45)'; c.lineWidth = 3; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; c.beginPath(); c.moveTo(128, 128); c.lineTo(128 + Math.cos(a) * 128, 128 + Math.sin(a) * 128); c.stroke(); } });
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.012, 32, 1, false, 0.3, Math.PI * 2 - 0.6), new THREE.MeshPhysicalMaterial({ map: lilyT, roughness: 0.35, clearcoat: 0.8 })); g.add(m);
  if (Math.random() < 0.5) { const b = makePetalFlower('#ffb3d9', 0.03, 8, '#ffd23f', 0.03); b.position.set(0.04, 0, -0.02); g.add(b); }
  return g;
}
export function shapeToken(sides, color, r = 0.05) {
  const seg = sides === 0 ? 40 : sides;
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.03, seg), toon(color));
  if (sides === 4) m.rotation.y = Math.PI / 4;
  const g = new THREE.Group(); g.add(m); m.rotation.x = Math.PI / 2; return g;
}
export function makeCoin(value) {
  const spec = { 1: ['#c46d32', 0.05, '1¢'], 5: ['#c0c6cc', 0.06, '5¢'], 10: ['#d9dde1', 0.045, '10¢'], 25: ['#d0d6db', 0.07, '25¢'] }[value];
  const g = new THREE.Group();
  const c = new THREE.Mesh(new THREE.CylinderGeometry(spec[1], spec[1], 0.012, 28), new THREE.MeshStandardMaterial({ color: spec[0], metalness: 0.7, roughness: 0.35 }));
  c.rotation.x = Math.PI / 2; g.add(c);
  const lb = label(spec[2], { bg: null, fg: '#3c1361', size: 0.045 }); lb.position.z = 0.02; g.add(lb);
  g.userData.value = value; return g;
}

/* ---------- particle FX ---------- */
let glowT;
export function glowTexture() {
  if (glowT) return glowT;
  glowT = canvasTex(64, 64, (c) => { const g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.18, 'rgba(255,255,255,.75)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64);
    c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.moveTo(32, 0); c.quadraticCurveTo(34, 30, 64, 32); c.quadraticCurveTo(34, 34, 32, 64); c.quadraticCurveTo(30, 34, 0, 32); c.quadraticCurveTo(30, 30, 32, 0); c.fill(); });
  return glowT;
}
export class FX {
  constructor(parent, max = 600) {
    this.max = max; this.n = 0;
    this.pos = new Float32Array(max * 3); this.col = new Float32Array(max * 3);
    this.vel = new Float32Array(max * 3); this.life = new Float32Array(max); this.grav = new Float32Array(max);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.05, map: glowTexture(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
    this.pts.frustumCulled = false; parent.add(this.pts); this.i = 0;
  }
  emit(p, color, count = 30, speed = 0.5, grav = -0.6, life = 1.2) {
    const c = new THREE.Color(color);
    for (let k = 0; k < count; k++) {
      const i = this.i = (this.i + 1) % this.max;
      this.pos.set([p.x, p.y, p.z], i * 3);
      const a = Math.random() * Math.PI * 2, b = Math.random() * Math.PI - Math.PI / 2, s = speed * (0.4 + Math.random() * 0.6);
      this.vel.set([Math.cos(a) * Math.cos(b) * s, Math.abs(Math.sin(b)) * s + speed * 0.3, Math.sin(a) * Math.cos(b) * s], i * 3);
      const hsl = {}; c.getHSL(hsl); const cc = new THREE.Color().setHSL(hsl.h + (Math.random() - 0.5) * 0.1, hsl.s, Math.min(0.85, hsl.l + 0.15));
      this.col.set([cc.r, cc.g, cc.b], i * 3); this.life[i] = life * (0.6 + Math.random() * 0.4); this.grav[i] = grav;
    }
  }
  update(dt) {
    for (let i = 0; i < this.max; i++) {
      if (this.life[i] <= 0) { this.pos[i * 3 + 1] = -999; continue; }
      this.life[i] -= dt; const j = i * 3;
      this.vel[j + 1] += this.grav[i] * dt;
      this.pos[j] += this.vel[j] * dt; this.pos[j + 1] += this.vel[j + 1] * dt; this.pos[j + 2] += this.vel[j + 2] * dt;
      const f = Math.min(1, this.life[i] * 2); this.col[j] *= 0.995 + 0.005 * f; this.col[j + 1] *= 0.995 + 0.005 * f; this.col[j + 2] *= 0.995 + 0.005 * f;
    }
    this.pts.geometry.attributes.position.needsUpdate = true; this.pts.geometry.attributes.color.needsUpdate = true;
  }
}

/* ---------- sound ---------- */
let ac;
function audio() { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } } if (ac.state === 'suspended') ac.resume(); return ac; }
export const sound = { on: true };
function tone(freq, t0, dur, type = 'sine', vol = 0.18) {
  const a = audio(); if (!a || !sound.on) return;
  const o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0, a.currentTime + t0); g.gain.linearRampToValueAtTime(vol, a.currentTime + t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + t0 + dur);
  o.connect(g).connect(a.destination); o.start(a.currentTime + t0); o.stop(a.currentTime + t0 + dur + 0.05);
}
export const sfx = {
  unlock: () => audio(),
  pop: () => tone(660, 0, 0.12, 'triangle', 0.15),
  good: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.08, 0.3, 'triangle')); },
  oops: () => { tone(300, 0, 0.18, 'sine', 0.12); tone(240, 0.12, 0.22, 'sine', 0.12); },
  win: () => { [523, 659, 784, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.11, 0.35, 'triangle', 0.16)); },
  page: () => { const a = audio(); if (!a || !sound.on) return; const n = a.createBufferSource(), b = a.createBuffer(1, a.sampleRate * 0.25, a.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2) * 0.25; n.buffer = b; const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800; n.connect(f).connect(a.destination); n.start(); },
  note: (i) => tone([523, 587, 659, 698, 784, 880, 988, 1047, 1175, 1319][i % 10], 0, 0.3, 'triangle', 0.15),
};

/* ---------- speech ---------- */
let voice;
function pickVoice() {
  const vs = (window.speechSynthesis && speechSynthesis.getVoices()) || [];
  voice = vs.find(v => /en-US/i.test(v.lang) && /(Samantha|Female|Zira|Aria|Jenny|Google US English)/i.test(v.name)) || vs.find(v => /^en/i.test(v.lang));
}
export function speak(text, { rate = 0.95, pitch = 1.15, onend } = {}) {
  try {
    if (!sound.on || !window.speechSynthesis) { onend && onend(); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[✦★]/g, '').replace(/¢/g, ' cents').replace(/×/g, ' times ').replace(/−/g, ' minus ').replace(/÷/g, ' divided by '));
    if (voice) u.voice = voice; u.rate = rate; u.pitch = pitch; if (onend) u.onend = onend;
    speechSynthesis.speak(u);
  } catch (e) { onend && onend(); }
}
export function stopSpeech() { try { window.speechSynthesis && speechSynthesis.cancel(); } catch (e) { } }

/* ---------- tween ---------- */
const tweens = [];
export function tween(obj, to, dur = 0.5, ease = 'outBack', onDone) {
  const from = {}; for (const k in to) from[k] = obj[k];
  tweens.push({ obj, from, to, dur, t: 0, ease, onDone });
}
const E = { linear: t => t, out: t => 1 - (1 - t) ** 3, inOut: t => t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2, outBack: t => { const c = 1.7; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2; } };
export function updateTweens(dt) {
  for (let i = tweens.length - 1; i >= 0; i--) {
    const w = tweens[i]; w.t += dt; const p = Math.min(1, w.t / w.dur), e = E[w.ease](p);
    for (const k in w.to) w.obj[k] = w.from[k] + (w.to[k] - w.from[k]) * e;
    if (p >= 1) { tweens.splice(i, 1); w.onDone && w.onDone(); }
  }
}
export const wait = (s) => new Promise(r => setTimeout(r, s * 1000));
export const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export function popIn(obj, delay = 0, s = 1) {
  const target = obj.userData.baseScale ? obj.userData.baseScale.clone() : new THREE.Vector3(s, s, s);
  obj.scale.setScalar(0.0001);
  setTimeout(() => tween(obj.scale, { x: target.x, y: target.y, z: target.z }, 0.55, 'outBack'), delay * 1000);
}
