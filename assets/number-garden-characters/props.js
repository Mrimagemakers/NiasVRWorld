// Detailed characters and props for the chapter pop-ups (Carlo, Subby, Milly, Skippy, shape flowers,
// swing set, flower clock, bed, chalkboard, market stall).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { canvasTex, toon, eye, shade, NUM_COLORS, FONT, furTex, label } from './core.js';
import { petalGeo, blobGeo, leafMat, barkMat, cmat, makePetalFlower } from './garden.js';

/* ---------- helpers ---------- */
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const mesh = (g, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = true; return o; };
const phys = (color, o = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.5, clearcoat: 0.3, clearcoatRoughness: 0.4, ...o });
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
// tube along a curve with a radius function r(t)
export function tube(curve, rf, radial = 12, segs = 24) {
  const g = new THREE.CylinderGeometry(1, 1, 1, radial, segs, false); const p = g.attributes.position, v = new THREE.Vector3();
  const fr = curve.computeFrenetFrames(segs, false);
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i); const t = THREE.MathUtils.clamp(v.y + 0.5, 0, 1), k = Math.round(t * segs), r = rf(t);
    const cap = Math.hypot(v.x, v.z) < 0.99; // cap centre vertices
    const pt = curve.getPointAt(t), ang = Math.atan2(v.z, v.x), rr = cap ? 0 : r;
    const off = fr.normals[k].clone().multiplyScalar(Math.cos(ang) * rr).add(fr.binormals[k].clone().multiplyScalar(Math.sin(ang) * rr));
    p.setXYZ(i, pt.x + off.x, pt.y + off.y, pt.z + off.z);
  }
  g.computeVertexNormals(); return g;
}
function smile(r, color = '#4a1a1a') { const m = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.16, 8, 20, Math.PI), std(color)); m.rotation.z = Math.PI; return m; }
function cheek(r) { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), new THREE.MeshBasicMaterial({ color: '#ff8fa3', transparent: true, opacity: 0.55 })); m.scale.z = 0.4; return m; }
let woodT, plankT;
export function woodTex() {
  if (woodT) return woodT;
  woodT = canvasTex(256, 256, (c) => { c.fillStyle = '#b5773e'; c.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 2) { c.strokeStyle = `rgba(${80 + Math.random() * 40},${45 + Math.random() * 20},15,${0.1 + Math.random() * 0.15})`; c.lineWidth = 1 + Math.random() * 2; c.beginPath(); c.moveTo(0, y); for (let x = 0; x <= 256; x += 16) c.lineTo(x, y + Math.sin(x * 0.04 + y * 0.09) * 2.5); c.stroke(); } });
  woodT.wrapS = woodT.wrapT = THREE.RepeatWrapping; return woodT;
}
function plankTex() {
  if (plankT) return plankT;
  plankT = canvasTex(256, 256, (c) => { c.drawImage(woodTex().userData.canvas, 0, 0); c.fillStyle = 'rgba(60,30,10,.55)'; for (let x = 0; x < 256; x += 51) c.fillRect(x, 0, 3, 256);
    c.fillStyle = 'rgba(40,20,5,.7)'; for (let x = 25; x < 256; x += 51) for (const y of [20, 236]) { c.beginPath(); c.arc(x, y, 3, 0, 7); c.fill(); } });
  plankT.wrapS = plankT.wrapT = THREE.RepeatWrapping; return plankT;
}
const woodMat = () => cmat('pwood', () => std('#ffffff', { map: woodTex(), roughness: 0.65 }));

/* =================== CHARACTERS =================== */

// Carlo the counting caterpillar: ten fuzzy glossy segments with little legs, number decals and a friendly face
export function makeCarloHD(n = 10) {
  const g = new THREE.Group(), segs = [];
  const legM = phys('#2f7a2a', { roughness: 0.6 }), footM = phys('#ffd23f');
  for (let i = 0; i < n; i++) {
    const s = new THREE.Group(); const r = 0.07 + Math.sin(i / (n - 1) * Math.PI) * 0.012;
    const ballM = new THREE.MeshPhysicalMaterial({ color: '#5fcf48', roughness: 0.45, clearcoat: 0.6, sheen: 1, sheenColor: new THREE.Color('#e9ffb0'), sheenRoughness: 0.4, emissive: '#000000' });
    const ball = mesh(new THREE.SphereGeometry(r, 28, 20), ballM); s.add(ball);
    // stripe band and spots
    const band = mesh(new THREE.TorusGeometry(r * 0.96, r * 0.12, 8, 28), phys('#2f9e44', { roughness: 0.5 })); band.rotation.y = Math.PI / 2; s.add(band);
    for (let k = 0; k < 3; k++) { const sp = mesh(new THREE.SphereGeometry(r * 0.16, 10, 8), phys('#d4f59a')); const a = 0.6 + k * 0.7; sp.position.set(0, Math.sin(a) * r * 0.95, Math.cos(a) * r * 0.95 * (k === 1 ? -1 : 1)); sp.scale.z = 0.4; s.add(sp); }
    // number decal on the front, tilted up toward the reader
    const tex = canvasTex(128, 128, (c) => { c.font = `700 ${i >= 9 ? 74 : 92}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 12; c.strokeStyle = '#1b5e20'; c.strokeText(String(i + 1), 64, 70); c.fillStyle = '#ffffff'; c.fillText(String(i + 1), 64, 70); });
    const dec = new THREE.Mesh(new THREE.PlaneGeometry(r * 1.15, r * 1.15), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
    dec.position.set(0, r * 0.45, r * 0.9); dec.rotation.x = -0.45; s.add(dec);
    for (const sd of [-1, 1]) { const leg = mesh(new THREE.CapsuleGeometry(r * 0.16, r * 0.45, 4, 8), legM, 0, -r * 0.95, sd * r * 0.45); leg.rotation.x = sd * 0.35; s.add(leg); s.add(mesh(new THREE.SphereGeometry(r * 0.2, 10, 8), footM, 0, -r * 1.3, sd * r * 0.6)); }
    s.position.set(-0.42 + i * 0.088, 0.085 + Math.sin(i * 0.9) * 0.012 + (i > 6 ? (i - 6) * 0.012 : 0), Math.sin(i * 0.7) * 0.03);
    s.userData.ball = ball; segs.push(s); g.add(s);
  }
  const head = new THREE.Group(); head.position.set(0.5, 0.16, 0.02); g.add(head);
  head.add(mesh(new THREE.SphereGeometry(0.105, 32, 24), phys('#8be05a', { clearcoat: 0.7, sheen: 1, sheenColor: new THREE.Color('#f0ffc0') })));
  for (const sd of [-1, 1]) {
    const e = eye(0.032); e.position.set(0.035, 0.03, sd * 0.045 + 0.06); e.rotation.y = 0.5; head.add(e);
    const ch = cheek(0.022); ch.position.set(0.07, -0.025, sd * 0.06 + 0.04); head.add(ch);
    const ant = mesh(tube(new THREE.CatmullRomCurve3([V(0, 0.08, sd * 0.04), V(-0.01, 0.15, sd * 0.06), V(0.03, 0.2, sd * 0.09)]), () => 0.006, 6, 8), phys('#2f7a2a')); head.add(ant);
    head.add(mesh(new THREE.SphereGeometry(0.018, 12, 8), phys('#ffd23f', { emissive: '#ffb703', emissiveIntensity: 0.4 }), 0.03, 0.2, sd * 0.09));
  }
  const m = smile(0.03); m.position.set(0.075, -0.035, 0.07); m.rotation.y = 0.9; head.add(m);
  g.userData.segs = segs; g.userData.head = head;
  g.userData.idle = (t) => { segs.forEach((s, i) => { s.position.y = s.userData.y0 ?? (s.userData.y0 = s.position.y); s.position.y = s.userData.y0 + Math.sin(t * 3 - i * 0.6) * 0.008; }); head.rotation.z = Math.sin(t * 1.5) * 0.08; };
  return g;
}

// Subby the subtraction snail: logarithmic spiral shell, glossy body, eye stalks
export function makeSubbyHD() {
  const g = new THREE.Group();
  const bodyM = new THREE.MeshPhysicalMaterial({ color: '#9b5de5', roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.15, sheen: 0.5, sheenColor: new THREE.Color('#e0c8ff') });
  const footC = new THREE.CatmullRomCurve3([V(-0.3, 0.05, 0), V(-0.1, 0.06, 0), V(0.15, 0.07, 0), V(0.26, 0.12, 0), V(0.3, 0.26, 0), V(0.3, 0.34, 0)]);
  g.add(mesh(tube(footC, (t) => t < 0.08 ? 0.02 + t * 0.6 : t > 0.85 ? 0.075 - (t - 0.85) * 0.25 : 0.068 + Math.sin(t * Math.PI) * 0.012, 18, 40), bodyM));
  const belly = mesh(new THREE.CapsuleGeometry(0.05, 0.42, 6, 16), new THREE.MeshPhysicalMaterial({ color: '#c9a2ff', roughness: 0.4, clearcoat: 1 }), 0, 0.022, 0); belly.rotation.z = Math.PI / 2; belly.scale.set(1, 1, 1.5); g.add(belly);
  const head = new THREE.Group(); head.position.set(0.3, 0.34, 0); g.add(head);
  for (const sd of [-1, 1]) {
    head.add(mesh(tube(new THREE.CatmullRomCurve3([V(0, 0.04, sd * 0.03), V(0.01, 0.1, sd * 0.045), V(0.015, 0.16, sd * 0.055)]), (t) => 0.012 - t * 0.004, 8, 8), bodyM));
    const e = eye(0.028); e.position.set(0.02, 0.18, sd * 0.055); e.rotation.y = 0.6; head.add(e);
    const ch = cheek(0.018); ch.position.set(0.065, 0.0, sd * 0.045); ch.rotation.y = Math.PI / 2; head.add(ch);
  }
  const m = smile(0.025); m.position.set(0.075, -0.02, 0); m.rotation.y = Math.PI / 2; head.add(m);
  // spiral shell
  const pts = []; const turns = 2.6, b = 0.16;
  for (let i = 0; i <= 80; i++) { const th = i / 80 * turns * Math.PI * 2; const r = 0.018 * Math.exp(b * th); pts.push(V(Math.cos(th) * r, Math.sin(th) * r, (1 - i / 80) * 0.03)); }
  const sc = new THREE.CatmullRomCurve3(pts);
  const stripes = canvasTex(64, 512, (c) => { for (let y = 0; y < 512; y += 32) { const k = (y / 32) % 3; c.fillStyle = ['#f4a261', '#ffd166', '#e76f51'][k]; c.fillRect(0, y, 64, 32); c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(0, y, 64, 6); }
    for (let i = 0; i < 300; i++) { c.fillStyle = `rgba(120,50,20,${Math.random() * 0.15})`; c.fillRect(Math.random() * 64, Math.random() * 512, 2, 2); } });
  stripes.wrapS = stripes.wrapT = THREE.RepeatWrapping; stripes.repeat.set(1, 3);
  const smat = new THREE.MeshPhysicalMaterial({ map: stripes, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1, emissive: '#000000' });
  const shell = new THREE.Group(); shell.add(mesh(tube(sc, (t) => 0.32 * 0.018 * Math.exp(b * t * turns * Math.PI * 2) + 0.004, 18, 120), smat));
  shell.position.set(-0.04, 0.24, 0); shell.rotation.z = -0.3; shell.scale.setScalar(0.72); g.add(shell);
  g.userData.shell = shell; g.userData.shellMat = smat;
  g.userData.idle = (t) => { head.rotation.z = Math.sin(t * 1.2) * 0.06; };
  return g;
}

// Milly the multiplication moth: fluffy body, feathery antennae, shaped wings with glowing dot arrays
function wingShape(fore) {
  const s = new THREE.Shape();
  if (fore) { s.moveTo(0, 0); s.bezierCurveTo(0.15, 0.3, 0.55, 0.42, 0.78, 0.36); s.bezierCurveTo(0.88, 0.2, 0.75, 0.02, 0.5, -0.06); s.bezierCurveTo(0.3, -0.1, 0.1, -0.05, 0, 0); }
  else { s.moveTo(0, 0); s.bezierCurveTo(0.2, -0.04, 0.5, -0.1, 0.55, -0.32); s.bezierCurveTo(0.45, -0.5, 0.18, -0.42, 0.05, -0.22); s.bezierCurveTo(0, -0.12, 0, -0.05, 0, 0); }
  return s;
}
function wingTexture(fill, edge, fore) {
  return canvasTex(512, 512, (c) => {
    const g = c.createRadialGradient(40, 256, 10, 160, 256, 420); g.addColorStop(0, shade(fill, 0.2)); g.addColorStop(0.65, fill); g.addColorStop(1, edge);
    c.fillStyle = g; c.fillRect(0, 0, 512, 512);
    c.strokeStyle = 'rgba(120,40,80,.25)'; c.lineWidth = 3; for (let k = 0; k < 7; k++) { c.beginPath(); c.moveTo(0, 256); c.bezierCurveTo(150, 256 - (k - 3) * 30, 300, 256 - (k - 3) * 70, 512, 256 - (k - 3) * 110); c.stroke(); }
    // glowing dot arrays (her multiplication rows)
    const rows = fore ? 3 : 2, cols = fore ? 4 : 3;
    for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) { const x = 170 + q * 62, y = (fore ? 300 : 170) + r * 52 * (fore ? -1 : 1);
      const dg = c.createRadialGradient(x, y, 2, x, y, 22); dg.addColorStop(0, '#ffffff'); dg.addColorStop(0.35, '#fff3a0'); dg.addColorStop(1, 'rgba(255,240,160,0)'); c.fillStyle = dg; c.beginPath(); c.arc(x, y, 22, 0, 7); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,.18)'; for (let i = 0; i < 400; i++) c.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  });
}
function shapeUV(geo) { // planar UV for wing shapes (x 0..0.9, y -0.5..0.45)
  const p = geo.attributes.position, uv = []; for (let i = 0; i < p.count; i++) uv.push(p.getX(i) / 0.9, (p.getY(i) + 0.5) / 0.95); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); return geo;
}
export function makeMillyHD(fill = '#ffb3d9', edge = '#e05297') {
  const g = new THREE.Group();
  const fuzz = new THREE.MeshPhysicalMaterial({ color: '#f6d6e6', roughness: 0.9, sheen: 1, sheenColor: new THREE.Color('#ffffff'), sheenRoughness: 0.3 });
  const bodyM = new THREE.MeshPhysicalMaterial({ color: '#c77dab', roughness: 0.8, sheen: 1, sheenColor: new THREE.Color('#ffd6ec') });
  for (let i = 0; i < 4; i++) g.add(mesh(new THREE.SphereGeometry(0.06 - i * 0.008, 20, 14), bodyM, 0, -0.04 - i * 0.065, 0));
  g.add(mesh(new THREE.SphereGeometry(0.075, 24, 18), fuzz, 0, 0.05, 0));
  const collar = mesh(new THREE.TorusGeometry(0.06, 0.03, 10, 24), fuzz, 0, 0.1, 0); collar.rotation.x = Math.PI / 2; g.add(collar);
  const head = new THREE.Group(); head.position.set(0, 0.17, 0.02); g.add(head);
  head.add(mesh(new THREE.SphereGeometry(0.065, 24, 18), bodyM));
  for (const sd of [-1, 1]) {
    const e = eye(0.028); e.position.set(sd * 0.03, 0.01, 0.05); head.add(e);
    const ch = cheek(0.016); ch.position.set(sd * 0.045, -0.025, 0.05); head.add(ch);
    // feathery antenna: spine + comb of fine barbs
    const ant = new THREE.Group(); ant.position.set(sd * 0.03, 0.05, 0); ant.rotation.z = -sd * 0.45; head.add(ant);
    ant.add(mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.16, 5), std('#7a4a6a'), 0, 0.08, 0));
    for (let k = 0; k < 9; k++) for (const ss of [-1, 1]) { const b = mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.04 - Math.abs(k - 4) * 0.004, 4), std('#a4688c'), ss * 0.012, 0.03 + k * 0.014, 0); b.rotation.z = ss * 1.1; ant.add(b); }
  }
  const m = smile(0.02); m.position.set(0, -0.025, 0.06); head.add(m);
  const wings = [];
  for (const fore of [true, false]) {
    const tex = wingTexture(fill, edge, fore), geo = shapeUV(new THREE.ShapeGeometry(wingShape(fore), 24));
    const wm = new THREE.MeshPhysicalMaterial({ map: tex, side: THREE.DoubleSide, transparent: true, opacity: 0.96, roughness: 0.35, iridescence: 0.6, sheen: 0.6, sheenColor: new THREE.Color('#ffffff') });
    for (const sd of [-1, 1]) { const piv = new THREE.Group(); piv.position.set(0, fore ? 0.06 : 0.0, -0.01); const w = new THREE.Mesh(geo, wm); w.scale.set(sd * 0.55, 0.55, 0.55); piv.add(w); g.add(piv); wings.push({ piv, sd, fore }); }
  }
  g.userData.flap = (t, speed = 4) => { const a = Math.sin(t * speed) * 0.6 + 0.25; wings.forEach(w => { w.piv.rotation.y = w.sd * a * (w.fore ? 1 : 0.9); }); };
  return g;
}

// Skippy the skip-counting squirrel: fluffy curled tail, belly patch, tufted ears, acorn
export function makeSkippyHD() {
  const g = new THREE.Group();
  const fur = new THREE.MeshPhysicalMaterial({ map: furTex('#d64933', '#ff7a52', '#9e2f1c'), roughness: 0.85, sheen: 1, sheenColor: new THREE.Color('#ffb08a'), sheenRoughness: 0.5 });
  const cream = new THREE.MeshPhysicalMaterial({ map: furTex('#ffe5d0', '#fff6ec', '#e9c9ad'), roughness: 0.9, sheen: 1, sheenColor: new THREE.Color('#ffffff') });
  const body = mesh(new THREE.SphereGeometry(0.15, 32, 24), fur, 0, 0.22, 0); body.scale.set(0.95, 1.15, 0.9); g.add(body);
  const belly = mesh(new THREE.SphereGeometry(0.11, 24, 18), cream, 0, 0.2, 0.07); belly.scale.set(0.9, 1.15, 0.6); g.add(belly);
  for (const sd of [-1, 1]) { const h = mesh(new THREE.SphereGeometry(0.08, 20, 14), fur, sd * 0.1, 0.1, 0.02); h.scale.set(0.9, 0.8, 1.1); g.add(h); g.add(mesh(new THREE.CapsuleGeometry(0.03, 0.06, 4, 10), cream, sd * 0.1, 0.03, 0.08)).children; }
  const acorn = new THREE.Group(); acorn.position.set(0, 0.27, 0.15); g.add(acorn);
  const nut = mesh(new THREE.SphereGeometry(0.035, 16, 12), phys('#c68b59', { clearcoat: 0.8 })); nut.scale.y = 1.25; acorn.add(nut);
  const capA = mesh(new THREE.SphereGeometry(0.038, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), std('#7a4a1e', { roughness: 0.9 }), 0, 0.02, 0); acorn.add(capA);
  acorn.add(mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.02, 5), std('#5e3714'), 0, 0.06, 0));
  for (const sd of [-1, 1]) { const a = mesh(new THREE.CapsuleGeometry(0.025, 0.08, 4, 10), fur, sd * 0.06, 0.28, 0.1); a.rotation.set(-1, 0, sd * 0.6); g.add(a); }
  const head = new THREE.Group(); head.position.set(0, 0.48, 0.03); g.add(head);
  const hd = mesh(new THREE.SphereGeometry(0.12, 32, 24), fur); hd.scale.set(1, 0.95, 0.95); head.add(hd);
  const snout = mesh(new THREE.SphereGeometry(0.06, 20, 14), cream, 0, -0.035, 0.08); snout.scale.set(1.2, 0.8, 0.9); head.add(snout);
  head.add(mesh(new THREE.SphereGeometry(0.018, 12, 8), phys('#2b1a12', { clearcoat: 1 }), 0, -0.015, 0.135));
  const m = smile(0.022); m.position.set(0, -0.055, 0.125); head.add(m);
  for (const sd of [-1, 1]) {
    const e = eye(0.034); e.position.set(sd * 0.05, 0.025, 0.09); head.add(e);
    const ch = mesh(new THREE.SphereGeometry(0.035, 14, 10), cream, sd * 0.07, -0.04, 0.06); head.add(ch);
    const ear = new THREE.Group(); ear.position.set(sd * 0.07, 0.1, -0.01); ear.rotation.z = -sd * 0.25; head.add(ear);
    ear.add(mesh(new THREE.ConeGeometry(0.035, 0.09, 16), fur, 0, 0.04, 0));
    ear.add(mesh(new THREE.ConeGeometry(0.022, 0.06, 12), std('#ffb3c1'), 0, 0.035, 0.012));
    ear.add(mesh(new THREE.ConeGeometry(0.012, 0.05, 6), fur, 0, 0.1, 0));
  }
  // bushy S-curl tail
  const tc = new THREE.CatmullRomCurve3([V(0, 0.12, -0.12), V(0, 0.22, -0.28), V(0, 0.45, -0.3), V(0, 0.62, -0.2), V(0, 0.66, -0.06), V(0, 0.58, 0.0)]);
  const tail = new THREE.Group(); g.add(tail);
  tail.add(mesh(tube(tc, (t) => 0.05 + Math.sin(Math.min(1, t * 1.15) * Math.PI) * 0.075, 18, 40), fur));
  const tipM = mesh(new THREE.SphereGeometry(0.06, 16, 12), cream, 0, 0.6, -0.02); tail.add(tipM);
  g.userData.idle = (t) => { tail.rotation.x = Math.sin(t * 3.5) * 0.06; head.rotation.y = Math.sin(t * 1.3) * 0.2; acorn.rotation.y = t; };
  return g;
}

/* =================== PROPS =================== */

// Shape flower: rounded polygon bloom (circle/triangle/square/pentagon/hexagon) with a petal ring, in a terracotta pot
function roundedPolygon(sides, r) {
  const s = new THREE.Shape();
  if (sides === 0) { s.absarc(0, 0, r, 0, Math.PI * 2, false); return s; }
  const rot = sides === 4 ? Math.PI / 4 : Math.PI / 2, pts = [];
  for (let i = 0; i < sides; i++) { const a = rot + i / sides * Math.PI * 2; pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
  const k = 0.18;
  pts.forEach((p, i) => { const prev = pts[(i - 1 + sides) % sides], next = pts[(i + 1) % sides];
    const a = [p[0] + (prev[0] - p[0]) * k, p[1] + (prev[1] - p[1]) * k], b = [p[0] + (next[0] - p[0]) * k, p[1] + (next[1] - p[1]) * k];
    if (i === 0) s.moveTo(...a); else s.lineTo(...a); s.quadraticCurveTo(p[0], p[1], ...b); });
  s.closePath(); return s;
}
export function makeShapeBloom(sides, color, r = 0.07) {
  const g = new THREE.Group();
  const geo = new THREE.ExtrudeGeometry(roundedPolygon(sides, r), { depth: 0.02, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.01, bevelSegments: 4, curveSegments: 24 });
  geo.center();
  const face = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1, sheen: 0.4 })); face.castShadow = true; g.add(face);
  const n = sides === 0 ? 10 : sides * 2, pm = new THREE.MeshPhysicalMaterial({ color: shade(color, 0.18), side: THREE.DoubleSide, roughness: 0.45, sheen: 0.8, sheenColor: new THREE.Color('#ffffff') });
  for (let i = 0; i < n; i++) { const p = new THREE.Mesh(petalGeo(), pm); const a = i / n * Math.PI * 2; p.scale.setScalar(r * 0.9); p.position.set(Math.cos(a) * r * 0.75, Math.sin(a) * r * 0.75, -0.015); p.rotation.z = a - Math.PI / 2; p.rotation.x = 0.25; g.add(p); }
  // sparkle centre stud
  g.add(mesh(new THREE.SphereGeometry(r * 0.18, 16, 12), phys('#fff3b0', { emissive: '#ffd23f', emissiveIntensity: 0.4 }), 0, 0, 0.02));
  return g;
}
export function makePot(r = 0.065, h = 0.09) {
  const g = new THREE.Group();
  const prof = [[0, 0], [r * 0.7, 0], [r * 0.78, h * 0.1], [r, h * 0.82], [r * 1.12, h * 0.85], [r * 1.14, h], [r * 0.95, h], [r * 0.93, h * 0.9], [0, h * 0.9]].map(([x, y]) => new THREE.Vector2(x, y));
  const tc = canvasTex(256, 64, (c) => { c.fillStyle = '#c8553d'; c.fillRect(0, 0, 256, 64); for (let i = 0; i < 500; i++) { c.fillStyle = `rgba(${Math.random() < 0.5 ? '90,30,20' : '240,150,110'},${Math.random() * 0.2})`; c.fillRect(Math.random() * 256, Math.random() * 64, 2, 2); } });
  g.add(mesh(new THREE.LatheGeometry(prof, 28), std('#ffffff', { map: tc, roughness: 0.85 })));
  g.add(mesh(new THREE.CircleGeometry(r * 0.92, 24).rotateX(-Math.PI / 2), std('#4a2c17', { roughness: 1 }), 0, h * 0.9, 0));
  return g;
}
export function makeGreenhouse(w = 1.5, d = 0.7, h = 0.55) {
  const g = new THREE.Group(), fm = std('#ffffff', { roughness: 0.4 }), glass = new THREE.MeshPhysicalMaterial({ color: '#dff3ff', roughness: 0.05, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide, clearcoat: 1 });
  const beam = (x, y, z, sx, sy, sz) => g.add(mesh(new THREE.BoxGeometry(sx, sy, sz), fm, x, y, z));
  for (const x of [-w / 2, -w / 6, w / 6, w / 2]) for (const z of [-d / 2]) beam(x, h / 2, z, 0.015, h, 0.015);
  for (const x of [-w / 2, w / 2]) beam(x, h / 2, d / 2 - 0.05, 0.015, h, 0.015);
  beam(0, h, -d / 2, w, 0.015, 0.015); beam(0, h * 0.5, -d / 2, w, 0.01, 0.01);
  // gable roof over the back half
  const roof = new THREE.Mesh(new THREE.PlaneGeometry(w, d * 0.62), glass); roof.position.set(0, h + 0.12, -d * 0.2); roof.rotation.x = -Math.PI / 2 + 0.55; g.add(roof);
  for (const x of [-w / 2, -w / 6, w / 6, w / 2]) { const r = mesh(new THREE.BoxGeometry(0.012, 0.012, d * 0.62), fm, x, h + 0.12, -d * 0.2); r.rotation.x = 0.55; g.add(r); }
  const back = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glass); back.position.set(0, h / 2, -d / 2); g.add(back);
  for (const sd of [-1, 1]) { const sp = new THREE.Mesh(new THREE.PlaneGeometry(d * 0.9, h), glass); sp.position.set(sd * w / 2, h / 2, 0); sp.rotation.y = Math.PI / 2; g.add(sp); }
  return g;
}
export function makeSwingSet() {
  const g = new THREE.Group(), wm = woodMat(), H = 0.48, W = 0.34;
  for (const sd of [-1, 1]) for (const fz of [-1, 1]) { const leg = mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.52, 10), wm, sd * W / 2, H / 2, fz * 0.09); leg.rotation.x = -fz * 0.37; g.add(leg); }
  const top = mesh(new THREE.CylinderGeometry(0.014, 0.014, W + 0.06, 12), wm, 0, H, 0); top.rotation.z = Math.PI / 2; g.add(top);
  const seatPivot = new THREE.Group(); seatPivot.position.y = H; g.add(seatPivot);
  const rope = std('#e9d8a6', { roughness: 0.95 });
  for (const sd of [-1, 1]) { const r = mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.32, 5), rope, sd * 0.055, -0.16, 0); seatPivot.add(r); seatPivot.add(mesh(new THREE.TorusGeometry(0.008, 0.002, 4, 10), std('#888', { metalness: 0.8 }), sd * 0.055, -0.002, 0)); }
  seatPivot.add(mesh(new RoundedBoxGeometry(0.14, 0.014, 0.05, 2, 0.005), std('#ff5fa2', { roughness: 0.4 }), 0, -0.32, 0));
  g.userData.seat = seatPivot;
  return g;
}
export function makeSun(r = 0.09) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.SphereGeometry(r, 32, 24), new THREE.MeshBasicMaterial({ color: '#ffd23f' })));
  const halo = canvasTex(128, 128, (c) => { const gr = c.createRadialGradient(64, 64, 10, 64, 64, 64); gr.addColorStop(0, 'rgba(255,230,120,.9)'); gr.addColorStop(0.4, 'rgba(255,210,63,.35)'); gr.addColorStop(1, 'rgba(255,210,63,0)'); c.fillStyle = gr; c.fillRect(0, 0, 128, 128); });
  const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo, transparent: true, depthWrite: false })); h.scale.setScalar(r * 5); g.add(h);
  const rays = new THREE.Group(); g.add(rays);
  for (let i = 0; i < 12; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(r * 0.16, r * 0.55, 8), new THREE.MeshBasicMaterial({ color: '#ffb703' })); const a = i / 12 * Math.PI * 2; c.position.set(Math.cos(a) * r * 1.45, Math.sin(a) * r * 1.45, 0); c.rotation.z = a - Math.PI / 2; rays.add(c); }
  g.userData.rays = rays; return g;
}
export function makeKite(color = '#3a86ff', s = 0.16) {
  const g = new THREE.Group(); const sh = new THREE.Shape(); sh.moveTo(0, s * 0.62); sh.lineTo(s * 0.4, 0.05 * s); sh.lineTo(0, -s * 0.62); sh.lineTo(-s * 0.4, 0.05 * s); sh.closePath();
  const tex = canvasTex(128, 128, (c) => { const q = [color, '#ffd23f', '#ff5fa2', '#2ec4b6']; [[0, 0], [64, 0], [0, 64], [64, 64]].forEach(([x, y], i) => { c.fillStyle = q[i]; c.fillRect(x, y, 64, 64); }); });
  const geo = new THREE.ShapeGeometry(sh); const p = geo.attributes.position, uv = []; for (let i = 0; i < p.count; i++) uv.push(p.getX(i) / (s * 0.8) + 0.5, p.getY(i) / (s * 1.24) + 0.5); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.add(mesh(geo, std('#ffffff', { map: tex, side: THREE.DoubleSide, roughness: 0.5 })));
  const stick = std('#7a4a1e'); g.add(mesh(new THREE.CylinderGeometry(0.002, 0.002, s * 1.24, 4), stick, 0, 0, 0.003)); const cr = mesh(new THREE.CylinderGeometry(0.002, 0.002, s * 0.8, 4), stick, 0, 0.05 * s, 0.003); cr.rotation.z = Math.PI / 2; g.add(cr);
  const tail = new THREE.Group(); tail.position.y = -s * 0.62; g.add(tail);
  for (let i = 0; i < 4; i++) { const b = mesh(new THREE.ConeGeometry(0.012, 0.02, 4), std(NUM_COLORS[i * 2]), 0, -0.035 * (i + 1), 0); b.rotation.z = Math.PI / 2; tail.add(b); const b2 = b.clone(); b2.rotation.z = -Math.PI / 2; tail.add(b2); }
  g.userData.tail = tail; return g;
}

// Flower petal clock: twelve hour petals, painted face, leaf-shaped hands
export function makeFlowerClock() {
  const g = new THREE.Group();
  const stem = mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.45, 10), std('#2f8f37'), 0, -0.225, -0.02); g.add(stem);
  for (const sd of [-1, 1]) { const lf = new THREE.Mesh(petalGeo(), std('#46b04a', { side: THREE.DoubleSide })); lf.scale.setScalar(0.12); lf.position.set(0, -0.3, -0.02); lf.rotation.set(0, 0, sd * 2.2); g.add(lf); }
  for (let i = 0; i < 12; i++) { const a = Math.PI / 2 - i / 12 * Math.PI * 2; const p = new THREE.Mesh(petalGeo(), new THREE.MeshPhysicalMaterial({ color: NUM_COLORS[(i + 1) % 10], roughness: 0.4, sheen: 0.8, side: THREE.DoubleSide, sheenColor: new THREE.Color('#fff') }));
    p.scale.set(0.11, 0.13, 0.11); p.position.set(Math.cos(a) * 0.19, Math.sin(a) * 0.19, -0.012); p.rotation.z = a - Math.PI / 2; p.castShadow = true; g.add(p); }
  const faceT = canvasTex(512, 512, (c) => { const gr = c.createRadialGradient(256, 230, 40, 256, 256, 256); gr.addColorStop(0, '#fffdf5'); gr.addColorStop(1, '#ffe9b8'); c.fillStyle = gr; c.fillRect(0, 0, 512, 512);
    c.strokeStyle = '#c99a00'; for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2; const r0 = i % 5 ? 228 : 210; c.lineWidth = i % 5 ? 3 : 7; c.beginPath(); c.moveTo(256 + Math.cos(a) * r0, 256 + Math.sin(a) * r0); c.lineTo(256 + Math.cos(a) * 244, 256 + Math.sin(a) * 244); c.stroke(); }
    c.font = `700 70px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    for (let i = 1; i <= 12; i++) { const a = -Math.PI / 2 + i / 12 * Math.PI * 2; c.fillStyle = '#3c1361'; c.fillText(String(i), 256 + Math.cos(a) * 165, 262 + Math.sin(a) * 165); } });
  g.add(mesh(new THREE.CircleGeometry(0.17, 64), std('#ffffff', { map: faceT, roughness: 0.5 })));
  const rim = mesh(new THREE.TorusGeometry(0.172, 0.01, 10, 64), new THREE.MeshStandardMaterial({ color: '#ffc300', metalness: 0.85, roughness: 0.25 })); g.add(rim);
  const handGeo = (len, w) => { const s = new THREE.Shape(); s.moveTo(0, -0.02); s.quadraticCurveTo(w, len * 0.4, 0, len); s.quadraticCurveTo(-w, len * 0.4, 0, -0.02); return new THREE.ExtrudeGeometry(s, { depth: 0.006, bevelEnabled: false }); };
  const hourH = new THREE.Group(), minH = new THREE.Group();
  hourH.add(mesh(handGeo(0.1, 0.022), phys('#5a189a', { clearcoat: 1 }), 0, 0, 0.004)); minH.add(mesh(handGeo(0.145, 0.016), phys('#ef233c', { clearcoat: 1 }), 0, 0, 0.012));
  g.add(hourH, minH);
  g.add(mesh(new THREE.SphereGeometry(0.016, 16, 12), new THREE.MeshStandardMaterial({ color: '#ffc300', metalness: 0.9, roughness: 0.2 }), 0, 0, 0.022));
  g.userData.hourH = hourH; g.userData.minH = minH;
  return g;
}

// Nia's bed: arched headboard, quilt with stars and numbers, pillows, nightstand lamp, rug
export function makeBed() {
  const g = new THREE.Group(), wm = woodMat();
  const W = 0.5, D = 0.32;
  for (const x of [-W / 2 + 0.02, W / 2 - 0.02]) for (const z of [-D / 2 + 0.02, D / 2 - 0.02]) g.add(mesh(new THREE.CylinderGeometry(0.012, 0.01, 0.06, 8), wm, x, 0.03, z));
  g.add(mesh(new RoundedBoxGeometry(W, 0.04, D, 3, 0.01), wm, 0, 0.07, 0));
  g.add(mesh(new RoundedBoxGeometry(W - 0.02, 0.05, D - 0.02, 4, 0.02), std('#fbf7f0', { roughness: 0.9 }), 0, 0.115, 0));
  const hb = new THREE.Shape(); hb.moveTo(0, 0); hb.lineTo(0, 0.16); hb.quadraticCurveTo(D / 2, 0.26, D, 0.16); hb.lineTo(D, 0); hb.closePath();
  const hbG = new THREE.ExtrudeGeometry(hb, { depth: 0.025, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 3 }); hbG.translate(-D / 2, 0, 0);
  const head = mesh(hbG, phys('#7b2cbf', { clearcoat: 0.6 }), -W / 2 - 0.005, 0.05, 0); head.rotation.y = Math.PI / 2; g.add(head);
  const qT = canvasTex(512, 256, (c) => { c.fillStyle = '#5a189a'; c.fillRect(0, 0, 512, 256); c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 3; for (let x = 0; x < 512; x += 64) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 256); c.stroke(); } for (let y = 0; y < 256; y += 64) { c.beginPath(); c.moveTo(0, y); c.lineTo(512, y); c.stroke(); }
    c.font = `700 34px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; for (let i = 0; i < 32; i++) { const x = 32 + (i % 8) * 64, y = 32 + Math.floor(i / 8) * 64; c.fillStyle = i % 2 ? '#ffd23f' : '#9be8ff'; c.fillText(i % 2 ? '★' : String(i % 10), x, y); } });
  g.add(mesh(new RoundedBoxGeometry(W * 0.72, 0.03, D + 0.01, 4, 0.012), std('#ffffff', { map: qT, roughness: 0.85 }), 0.07, 0.148, 0));
  for (const z of [-0.07, 0.07]) { const pl = mesh(new RoundedBoxGeometry(0.1, 0.035, 0.12, 4, 0.016), std('#fff0f6', { roughness: 0.95 }), -W / 2 + 0.07, 0.155, z); pl.rotation.z = 0.15; g.add(pl); }
  // nightstand with glowing lamp
  const ns = new THREE.Group(); ns.position.set(-W / 2 + 0.02, 0, -D / 2 - 0.09); g.add(ns);
  ns.add(mesh(new RoundedBoxGeometry(0.1, 0.12, 0.1, 3, 0.01), wm, 0, 0.06, 0));
  ns.add(mesh(new THREE.CylinderGeometry(0.008, 0.02, 0.06, 10), std('#ffd23f', { metalness: 0.5, roughness: 0.3 }), 0, 0.15, 0));
  ns.add(mesh(new THREE.CylinderGeometry(0.025, 0.045, 0.05, 16, 1, true), new THREE.MeshStandardMaterial({ color: '#fff3b0', emissive: '#ffd23f', emissiveIntensity: 0.9, side: THREE.DoubleSide }), 0, 0.2, 0));
  const rugT = canvasTex(256, 256, (c) => { for (let r = 128; r > 0; r -= 16) { c.fillStyle = ['#ff5fa2', '#ffd23f', '#9be8ff', '#b8f28a'][(r / 16) % 4]; c.beginPath(); c.arc(128, 128, r, 0, 7); c.fill(); } });
  const rug = mesh(new THREE.CircleGeometry(0.16, 40).rotateX(-Math.PI / 2), std('#ffffff', { map: rugT, roughness: 1 }), 0.12, 0.002, D / 2 + 0.12); rug.scale.z = 0.6; g.add(rug);
  return g;
}

// Magic chalkboard on an easel, wrapping the drawable board mesh
export function makeChalkboardEasel(board, w = 0.8, h = 0.6) {
  const g = new THREE.Group(), wm = woodMat();
  board.position.set(0, 0, 0.012); g.add(board);
  const fr = (x, y, sx, sy) => g.add(mesh(new RoundedBoxGeometry(sx, sy, 0.03, 2, 0.008), wm, x, y, 0));
  fr(0, h / 2 + 0.015, w + 0.06, 0.03); fr(0, -h / 2 - 0.015, w + 0.06, 0.03); fr(-w / 2 - 0.015, 0, 0.03, h); fr(w / 2 + 0.015, 0, 0.03, h);
  const tray = mesh(new RoundedBoxGeometry(w * 0.8, 0.015, 0.05, 2, 0.005), wm, 0, -h / 2 - 0.04, 0.025); g.add(tray);
  ['#ffffff', '#ffd23f', '#ff5fa2', '#4cc9f0'].forEach((c, i) => { const ch = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.05, 8), std(c, { roughness: 1 }), -0.2 + i * 0.07, -h / 2 - 0.027, 0.03); ch.rotation.z = Math.PI / 2 + (i - 1.5) * 0.15; g.add(ch); });
  const er = new THREE.Group(); er.position.set(0.24, -h / 2 - 0.022, 0.03); er.add(mesh(new RoundedBoxGeometry(0.07, 0.02, 0.03, 2, 0.005), wm)); er.add(mesh(new THREE.BoxGeometry(0.068, 0.008, 0.028), std('#4a4a55', { roughness: 1 }), 0, -0.013, 0)); g.add(er);
  for (const sd of [-1, 1]) { const leg = mesh(new THREE.CylinderGeometry(0.012, 0.012, h + 0.45, 8), wm, sd * (w / 2 - 0.04), -0.05, -0.02); leg.rotation.x = 0.08; leg.rotation.z = -sd * 0.06; g.add(leg); }
  const back = mesh(new THREE.CylinderGeometry(0.012, 0.012, h + 0.4, 8), wm, 0, -0.07, -0.15); back.rotation.x = -0.4; g.add(back);
  const ttl = label('Magic Chalkboard', { size: 0.04, bg: '#ffd23f', border: '#7a4a1e' }); ttl.position.set(0, h / 2 + 0.07, 0.02); g.add(ttl);
  return g;
}

// Market stall: plank counter, scalloped striped awning, crates of starfruit, crystal grapes and rainbow berries, price sign
function starShape(r1, r2, n = 5) { const s = new THREE.Shape(); for (let i = 0; i <= n * 2; i++) { const a = i / (n * 2) * Math.PI * 2 + Math.PI / 2, r = i % 2 ? r2 : r1; const x = Math.cos(a) * r, y = Math.sin(a) * r; i ? s.lineTo(x, y) : s.moveTo(x, y); } return s; }
export function makeMarketStall() {
  const g = new THREE.Group(), wm = woodMat();
  const pm = std('#ffffff', { map: plankTex(), roughness: 0.75 });
  g.add(mesh(new THREE.BoxGeometry(0.9, 0.2, 0.3), pm, 0, 0.1, -0.15));
  g.add(mesh(new RoundedBoxGeometry(0.96, 0.025, 0.34, 2, 0.008), wm, 0, 0.212, -0.15));
  for (const sd of [-1, 1]) for (const z of [-0.02, -0.28]) g.add(mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.62, 10), wm, sd * 0.45, 0.31, z));
  // awning: curved striped canopy + scalloped valance
  const stripe = canvasTex(256, 64, (c) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#ffffff' : '#ff5fa2'; c.fillRect(i * 32, 0, 32, 64); } });
  const canopy = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.02, 32, 1, true, -Math.PI / 2, Math.PI * 0.75), new THREE.MeshStandardMaterial({ map: stripe, side: THREE.DoubleSide, roughness: 0.8 }));
  stripe.wrapS = THREE.RepeatWrapping; stripe.repeat.set(3, 1);
  canopy.rotation.z = Math.PI / 2; canopy.position.set(0, 0.53, -0.18); canopy.castShadow = true; g.add(canopy);
  const val = canvasTex(512, 64, (c) => { for (let i = 0; i < 16; i++) { c.fillStyle = i % 2 ? '#ffffff' : '#ff5fa2'; c.beginPath(); c.moveTo(i * 32, 0); c.lineTo(i * 32 + 32, 0); c.lineTo(i * 32 + 32, 30); c.arc(i * 32 + 16, 30, 16, 0, Math.PI); c.fill(); } });
  const valance = new THREE.Mesh(new THREE.PlaneGeometry(1.02, 0.07), new THREE.MeshStandardMaterial({ map: val, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide })); valance.position.set(0, 0.5, 0.04); g.add(valance);
  // crates
  const crate = (x, fill) => { const c = new THREE.Group(); c.position.set(x, 0.225, -0.15);
    for (const sd of [-1, 1]) { c.add(mesh(new THREE.BoxGeometry(0.22, 0.05, 0.01), wm, 0, 0.025, sd * 0.07)); c.add(mesh(new THREE.BoxGeometry(0.01, 0.05, 0.14), wm, sd * 0.105, 0.025, 0)); }
    c.add(mesh(new THREE.BoxGeometry(0.21, 0.006, 0.13), wm, 0, 0.004, 0)); fill(c); g.add(c); };
  const starGeo = new THREE.ExtrudeGeometry(starShape(0.028, 0.014), { depth: 0.012, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.006, bevelSegments: 3 });
  const starM = phys('#ffd23f', { clearcoat: 1, emissive: '#ffb703', emissiveIntensity: 0.15 });
  crate(-0.28, (c) => { for (let i = 0; i < 6; i++) { const s = mesh(starGeo, starM, -0.07 + (i % 3) * 0.07, 0.04 + Math.floor(i / 3) * 0.015, -0.03 + Math.floor(i / 3) * 0.05); s.rotation.x = -1.2; s.rotation.z = i; c.add(s); } });
  const grapeM = new THREE.MeshPhysicalMaterial({ color: '#b8f2ff', roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.8, emissive: '#7fd8ff', emissiveIntensity: 0.25 });
  crate(0, (c) => { for (let b = 0; b < 2; b++) { const cl = new THREE.Group(); cl.position.set(-0.05 + b * 0.1, 0.05, 0); for (let i = 0; i < 12; i++) { const lay = Math.floor(i / 4); cl.add(mesh(new THREE.SphereGeometry(0.014, 14, 10), grapeM, ((i % 4) - 1.5) * 0.018 * (1 - lay * 0.25), -lay * 0.018, ((i % 2) - 0.5) * 0.02)); } cl.rotation.x = -0.7; c.add(cl); } });
  crate(0.28, (c) => { for (let i = 0; i < 14; i++) c.add(mesh(new THREE.SphereGeometry(0.014, 12, 10), phys(NUM_COLORS[i % 10], { clearcoat: 1, roughness: 0.2 }), -0.08 + (i % 7) * 0.027, 0.02 + Math.floor(i / 7) * 0.015, -0.03 + Math.floor(i / 7) * 0.04)); });
  // chalk price sign
  const sT = canvasTex(256, 160, (c) => { c.fillStyle = '#23412f'; c.fillRect(0, 0, 256, 160); c.strokeStyle = '#b5773e'; c.lineWidth = 14; c.strokeRect(0, 0, 256, 160); c.fillStyle = '#ffffff'; c.font = `700 40px ${FONT}`; c.textAlign = 'center'; c.fillText('Fruit Market', 128, 62); c.fillStyle = '#ffd23f'; c.font = `600 30px ${FONT}`; c.fillText('★ 15¢   ● 6¢', 128, 112); });
  const sign = mesh(new THREE.PlaneGeometry(0.22, 0.14), std('#ffffff', { map: sT }), 0, 0.33, -0.3); g.add(sign);
  return g;
}

/* ---------- The Number Eight Butterfly: a body shaped like an 8, sculpted wings with 8 loops ---------- */
function bfWingTexture(fore) {
  return canvasTex(512, 512, (c) => {
    const g = c.createRadialGradient(30, 256, 10, 140, 256, 460); g.addColorStop(0, '#fff6b0'); g.addColorStop(0.35, '#ffd23f'); g.addColorStop(0.75, '#ff9f1c'); g.addColorStop(1, '#e85d04');
    c.fillStyle = g; c.fillRect(0, 0, 512, 512);
    // dark veins
    c.strokeStyle = 'rgba(90,24,154,.55)'; c.lineWidth = 6;
    for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(0, 256); c.bezierCurveTo(140, 256 - (k - 2.5) * 40, 300, 256 - (k - 2.5) * 90, 512, 256 - (k - 2.5) * 140); c.stroke(); }
    // glowing figure-eight loops (the butterfly's magic number)
    const cx = fore ? 300 : 175, cy = fore ? 150 : 385, r = fore ? 42 : 34;
    c.shadowColor = '#fff3a0'; c.shadowBlur = 24; c.strokeStyle = '#7b2cbf'; c.lineWidth = fore ? 22 : 17;
    c.beginPath(); c.arc(cx, cy - r * 0.95, r * 0.85, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.arc(cx, cy + r * 0.95, r, 0, Math.PI * 2); c.stroke();
    c.shadowBlur = 0; c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.arc(cx, cy - r * 0.95, r * 0.35, 0, 7); c.fill(); c.beginPath(); c.arc(cx, cy + r * 0.95, r * 0.42, 0, 7); c.fill();
    // purple border with white spots
    c.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 260; i++) c.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  });
}
export function makeButterfly8HD(size = 0.3) {
  const g = new THREE.Group(), k = size / 0.3;
  const purple = new THREE.MeshPhysicalMaterial({ color: '#6a1fb0', roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1, sheen: 0.6, sheenColor: new THREE.Color('#d8b4ff') });
  const gold = new THREE.MeshStandardMaterial({ color: '#ffc300', metalness: 0.85, roughness: 0.25 });
  // body: two stacked rings = a living number 8
  const top = mesh(new THREE.TorusGeometry(0.035 * k, 0.017 * k, 16, 36), purple, 0, 0.035 * k, 0); top.scale.set(0.85, 1, 0.9); g.add(top);
  const bot = mesh(new THREE.TorusGeometry(0.045 * k, 0.019 * k, 16, 36), purple, 0, -0.055 * k, 0); g.add(bot);
  g.add(mesh(new THREE.SphereGeometry(0.014 * k, 12, 10), gold, 0, -0.012 * k, 0.012 * k));
  for (const r of [top, bot]) { const ring = mesh(new THREE.TorusGeometry(r.geometry.parameters.radius, 0.004 * k, 8, 36), gold, 0, r.position.y, 0.01 * k); ring.scale.copy(r.scale); g.add(ring); }
  const head = new THREE.Group(); head.position.set(0, 0.1 * k, 0.005 * k); g.add(head);
  head.add(mesh(new THREE.SphereGeometry(0.03 * k, 24, 18), purple));
  for (const sd of [-1, 1]) {
    const e = eye(0.013 * k); e.position.set(sd * 0.013 * k, 0.006 * k, 0.022 * k); head.add(e);
    const ch = cheek(0.007 * k); ch.position.set(sd * 0.02 * k, -0.008 * k, 0.022 * k); head.add(ch);
    // curly antennae ending in tiny spirals
    const pts = [V(sd * 0.01, 0.02, 0), V(sd * 0.025, 0.06, -0.005), V(sd * 0.04, 0.085, 0)]; for (let i = 0; i <= 10; i++) { const a = i / 10 * Math.PI * 1.6, r = 0.012 * (1 - i / 14); pts.push(V(sd * (0.04 + Math.cos(a) * r - r), 0.085 + Math.sin(a) * r, 0)); }
    head.add(mesh(tube(new THREE.CatmullRomCurve3(pts.map(p => p.multiplyScalar(k))), () => 0.0025 * k, 6, 30), purple));
    head.add(mesh(new THREE.SphereGeometry(0.006 * k, 10, 8), new THREE.MeshBasicMaterial({ color: '#fff3a0' }), sd * 0.04 * k, 0.1 * k, 0));
  }
  const sm = smile(0.009 * k); sm.position.set(0, -0.01 * k, 0.027 * k); head.add(sm);
  // wings
  const wings = [];
  for (const fore of [true, false]) {
    const geo = shapeUV(new THREE.ShapeGeometry(wingShape(fore), 28));
    const wm = new THREE.MeshPhysicalMaterial({ map: bfWingTexture(fore), side: THREE.DoubleSide, roughness: 0.3, iridescence: 0.8, iridescenceIOR: 1.6, sheen: 0.5, sheenColor: new THREE.Color('#fff6c0'), emissive: '#ff9f1c', emissiveIntensity: 0.08 });
    const edgeGeo = new THREE.ShapeGeometry(wingShape(fore), 28); edgeGeo.scale(1.06, 1.08, 1); edgeGeo.translate(-0.01, 0, 0);
    const edgeM = new THREE.MeshPhysicalMaterial({ color: '#5a189a', side: THREE.DoubleSide, roughness: 0.35, clearcoat: 0.6 });
    for (const sd of [-1, 1]) { const piv = new THREE.Group(); piv.position.set(sd * 0.01 * k, fore ? 0.03 * k : -0.04 * k, -0.008 * k); const w = new THREE.Mesh(geo, wm); w.scale.set(sd * 0.36 * k, 0.36 * k, 0.36 * k); w.rotation.z = sd * (fore ? 0.1 : -0.05); piv.add(w);
      const ed = new THREE.Mesh(edgeGeo, edgeM); ed.scale.copy(w.scale); ed.rotation.copy(w.rotation); ed.position.z = -0.002 * k; piv.add(ed);
      // white dots along the purple edge
      for (let i = 0; i < 7; i++) { const pt = new THREE.Vector2(); wingShape(fore).getPoint(0.15 + i * 0.1, pt); const d = new THREE.Mesh(new THREE.CircleGeometry(0.006, 10), new THREE.MeshBasicMaterial({ color: '#ffffff', side: THREE.DoubleSide })); const v = new THREE.Vector3(pt.x * 1.035, pt.y * 1.04, 0.001).multiply(w.scale).applyEuler(w.rotation); d.position.copy(v); d.scale.setScalar(k); piv.add(d); }
      g.add(piv); wings.push({ piv, sd, fore }); }
  }
  g.userData.flap = (t, speed = 9) => { const a = Math.sin(t * speed) * 0.85 + 0.15; wings.forEach(w => { w.piv.rotation.y = w.sd * a * (w.fore ? 1 : 0.92); }); head.rotation.z = Math.sin(t * 2) * 0.08; };
  return g;
}

/* ---------- Subby: a conical spiral shell painted with subtraction problems, glossy snail body ---------- */
export function makeSubbyHD2() {
  const g = new THREE.Group();
  const skinT = canvasTex(256, 256, (c) => { const gr = c.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#b98cff'); gr.addColorStop(1, '#7b3fd6'); c.fillStyle = gr; c.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 60; i++) { c.fillStyle = `rgba(255,255,255,${0.08 + Math.random() * 0.15})`; c.beginPath(); c.ellipse(Math.random() * 256, Math.random() * 256, 3 + Math.random() * 8, 2 + Math.random() * 5, Math.random() * 3, 0, 7); c.fill(); } });
  skinT.wrapS = skinT.wrapT = THREE.RepeatWrapping; skinT.repeat.set(2, 1);
  const skin = new THREE.MeshPhysicalMaterial({ map: skinT, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.05, sheen: 0.6, sheenColor: new THREE.Color('#f0e0ff'), iridescence: 0.25 });
  // soft foot with a flattened skirt
  const foot = mesh(tube(new THREE.CatmullRomCurve3([V(-0.34, 0.035, 0), V(-0.2, 0.045, 0), V(0, 0.05, 0), V(0.18, 0.055, 0), V(0.27, 0.09, 0)]), (t) => 0.02 + Math.sin(Math.min(1, t * 1.2) * Math.PI) * 0.055 + t * 0.02, 22, 40), skin);
  foot.scale.set(1, 0.75, 1.25); g.add(foot);
  const skirt = mesh(new THREE.CapsuleGeometry(0.06, 0.48, 8, 20), new THREE.MeshPhysicalMaterial({ color: '#d4b8ff', roughness: 0.3, clearcoat: 1, transparent: true, opacity: 0.9 }), -0.03, 0.018, 0); skirt.rotation.z = Math.PI / 2; skirt.scale.set(0.35, 1, 1.6); g.add(skirt);
  // neck and head
  g.add(mesh(tube(new THREE.CatmullRomCurve3([V(0.24, 0.08, 0), V(0.3, 0.17, 0), V(0.31, 0.27, 0.01)]), (t) => 0.062 - t * 0.008, 22, 16), skin));
  const head = new THREE.Group(); head.position.set(0.31, 0.3, 0.01); g.add(head);
  const hd = mesh(new THREE.SphereGeometry(0.068, 32, 24), skin); hd.scale.set(1.05, 0.95, 1); head.add(hd);
  for (const sd of [-1, 1]) {
    head.add(mesh(tube(new THREE.CatmullRomCurve3([V(0, 0.04, sd * 0.025), V(0.008, 0.1, sd * 0.04), V(0.02, 0.15, sd * 0.05)]), (t) => 0.013 - t * 0.004, 10, 12), skin));
    const e = eye(0.03); e.position.set(0.025, 0.17, sd * 0.05); e.rotation.y = 0.5; head.add(e);
    head.add(mesh(new THREE.TorusGeometry(0.031, 0.004, 6, 20, Math.PI), skin, 0.028, 0.182, sd * 0.05)).children;
    const ch = cheek(0.017); ch.position.set(0.05, -0.012, sd * 0.042); ch.rotation.y = Math.PI / 2 - sd * 0.5; head.add(ch);
    head.add(mesh(tube(new THREE.CatmullRomCurve3([V(0.04, 0.02, sd * 0.02), V(0.07, 0.04, sd * 0.03), V(0.09, 0.04, sd * 0.035)]), (t) => 0.007 - t * 0.004, 6, 6), skin));
  }
  const sm = smile(0.026, '#3c1361'); sm.position.set(0.064, -0.02, 0); sm.rotation.y = Math.PI / 2; head.add(sm);
  // shell: conical log-spiral with whorls that touch, banded and painted with subtraction problems
  const turns = 3, b = 0.15, th0 = turns * Math.PI * 2, R = (th) => 0.016 * Math.exp(b * th);
  const pts = []; for (let i = 0; i <= 140; i++) { const th = i / 140 * th0, r = R(th); pts.push(V(Math.cos(th) * r, Math.sin(th) * r, (1 - i / 140) * 0.09)); }
  const shellT = canvasTex(128, 1024, (c) => {
    const bands = ['#ff9f1c', '#ffd166', '#f4a261', '#ffbf69', '#e76f51'];
    for (let y = 0; y < 1024; y += 64) { const gr = c.createLinearGradient(0, y, 0, y + 64); gr.addColorStop(0, bands[(y / 64) % 5]); gr.addColorStop(1, shade(bands[(y / 64) % 5], -0.12)); c.fillStyle = gr; c.fillRect(0, y, 128, 64); c.fillStyle = 'rgba(120,50,10,.35)'; c.fillRect(0, y, 128, 3); }
    for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(${Math.random() < 0.5 ? '255,255,255' : '120,50,20'},${Math.random() * 0.12})`; c.fillRect(Math.random() * 128, Math.random() * 1024, 2, 3); }
    const probs = ['5−2', '6−4', '7−7', '9−3', '8−5', '4−1'];
    c.font = `700 30px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    probs.forEach((p, i) => { c.save(); c.translate(64, 260 + i * 120); c.rotate(-Math.PI / 2); c.lineWidth = 6; c.strokeStyle = '#ffffff'; c.strokeText(p, 0, 0); c.fillStyle = '#5a189a'; c.fillText(p, 0, 0); c.restore(); });
  });
  const smat = new THREE.MeshPhysicalMaterial({ map: shellT, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08, emissive: '#000000', sheen: 0.3 });
  const shell = new THREE.Group();
  shell.add(mesh(tube(new THREE.CatmullRomCurve3(pts), (t) => 0.33 * R(t * th0) + 0.003, 22, 160), smat));
  const lip = mesh(new THREE.TorusGeometry(0.33 * R(th0), 0.009, 10, 30), new THREE.MeshPhysicalMaterial({ color: '#fff1d6', roughness: 0.3, clearcoat: 1 }));
  shell.position.set(-0.03, 0.2, 0); shell.rotation.set(0, 0, -0.35); shell.scale.setScalar(0.68); g.add(shell);
  g.userData.shell = shell; g.userData.shellMat = smat;
  g.userData.idle = (t) => { head.rotation.z = Math.sin(t * 1.2) * 0.06; head.rotation.y = Math.sin(t * 0.8) * 0.15; foot.scale.x = 1 + Math.sin(t * 2) * 0.02; };
  return g;
}

/* ---------- The Division Fountain: three stone tiers, a golden ÷ crown, equal water streams that divide ---------- */
export function makeDivisionFountain() {
  const g = new THREE.Group();
  const stoneT = canvasTex(256, 256, (c) => { c.fillStyle = '#e8e1d6'; c.fillRect(0, 0, 256, 256); for (let i = 0; i < 2200; i++) { c.fillStyle = `rgba(${Math.random() < 0.5 ? '150,140,128' : '255,255,250'},${Math.random() * 0.18})`; c.fillRect(Math.random() * 256, Math.random() * 256, 2, 2); }
    c.strokeStyle = 'rgba(140,128,112,.35)'; c.lineWidth = 2; for (let y = 0; y < 256; y += 64) { c.beginPath(); c.moveTo(0, y); c.lineTo(256, y); c.stroke(); } });
  stoneT.wrapS = stoneT.wrapT = THREE.RepeatWrapping; stoneT.repeat.set(4, 1);
  const stone = new THREE.MeshPhysicalMaterial({ map: stoneT, roughness: 0.55, clearcoat: 0.3 });
  const gold = new THREE.MeshStandardMaterial({ color: '#ffc300', metalness: 0.9, roughness: 0.2, emissive: '#7a5200', emissiveIntensity: 0.25 });
  const lathe = (pts, seg = 48) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);
  // pool, pedestal, middle bowl, top bowl
  g.add(mesh(lathe([[0, 0], [0.26, 0], [0.27, 0.01], [0.27, 0.06], [0.285, 0.065], [0.285, 0.08], [0.255, 0.08], [0.25, 0.03], [0, 0.03]]), stone));
  g.add(mesh(lathe([[0.05, 0.03], [0.045, 0.06], [0.03, 0.09], [0.028, 0.2], [0.036, 0.215], [0.03, 0.23]], 32), stone));
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const f = mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.11, 6), stone, Math.cos(a) * 0.029, 0.145, Math.sin(a) * 0.029); g.add(f); }
  g.add(mesh(lathe([[0, 0.22], [0.06, 0.22], [0.13, 0.245], [0.155, 0.27], [0.16, 0.285], [0.15, 0.285], [0.125, 0.262], [0, 0.255]]), stone));
  g.add(mesh(lathe([[0.022, 0.285], [0.018, 0.33], [0.024, 0.345]], 24), stone));
  g.add(mesh(lathe([[0, 0.345], [0.03, 0.345], [0.065, 0.36], [0.075, 0.375], [0.068, 0.378], [0, 0.37]]), stone));
  // gold trim bands
  for (const [r, y] of [[0.285, 0.08], [0.16, 0.285], [0.075, 0.376]]) { const t = mesh(new THREE.TorusGeometry(r, 0.005, 8, 64), gold, 0, y, 0); t.rotation.x = Math.PI / 2; g.add(t); }
  // golden ÷ crown
  const div = new THREE.Group(); div.position.y = 0.45; g.add(div);
  div.add(mesh(new RoundedBoxGeometry(0.09, 0.016, 0.016, 3, 0.006), gold));
  div.add(mesh(new THREE.SphereGeometry(0.014, 20, 14), gold, 0, 0.032, 0)); div.add(mesh(new THREE.SphereGeometry(0.014, 20, 14), gold, 0, -0.032, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.006, 0.01, 0.06, 10), gold, 0, 0.395, 0));
  // water surfaces with expanding ripple rings
  const waterM = new THREE.MeshPhysicalMaterial({ color: '#4cc9f0', roughness: 0.05, metalness: 0.1, clearcoat: 1, transparent: true, opacity: 0.85, emissive: '#0a6fa0', emissiveIntensity: 0.15 });
  const surfaces = [[0.25, 0.07], [0.145, 0.275], [0.06, 0.372]];
  const ripples = [];
  surfaces.forEach(([r, y]) => { const w = new THREE.Mesh(new THREE.CircleGeometry(r, 48).rotateX(-Math.PI / 2), waterM); w.position.y = y; g.add(w);
    for (let k = 0; k < 3; k++) { const rg = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.4, depthWrite: false })); rg.position.y = y + 0.001; g.add(rg); ripples.push({ rg, r, ph: k / 3 }); } });
  // droplet streams as one particle system
  const MAXS = 12, PER = 46, SPILL = 16, SPER = 14, JET = 30;
  const total = MAXS * PER + SPILL * SPER + JET;
  const pos = new Float32Array(total * 3), geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dropT = canvasTex(64, 64, (c) => { const gr = c.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(190,240,255,.9)'); gr.addColorStop(1, 'rgba(120,210,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, 64, 64); });
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.022, map: dropT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: '#bff0ff' }));
  pts.frustumCulled = false; g.add(pts);
  let streams = 4, shown = 4, dance = 0;
  g.userData.setStreams = (n) => { streams = Math.max(1, Math.min(MAXS, n)); };
  g.userData.dance = () => { dance = 3; };
  g.userData.update = (t, dt) => {
    shown += (streams - shown) * Math.min(1, dt * 3); dance = Math.max(0, dance - dt);
    let i = 0; const set = (x, y, z) => { pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; i++; };
    const n = Math.round(shown), boost = 1 + (dance > 0 ? 0.35 * Math.sin(t * 6) + 0.3 : 0);
    // equal arcs from the crown into the middle bowl
    for (let s = 0; s < MAXS; s++) for (let p = 0; p < PER; p++) {
      if (s >= n) { set(0, -99, 0); continue; }
      const a = s / n * Math.PI * 2 + t * 0.15, age = ((t * 0.9 + p / PER + s * 0.13) % 1) * 0.55;
      const vh = 0.24 * boost, vy = 0.32 * boost, x = Math.cos(a) * vh * age, z = Math.sin(a) * vh * age, y = 0.41 + vy * age - 1.6 * age * age;
      set(x, Math.max(0.28, y), z);
    }
    // sheets spilling over the middle bowl into the pool (also equal shares)
    for (let s = 0; s < SPILL; s++) for (let p = 0; p < SPER; p++) {
      const a = s / SPILL * Math.PI * 2, age = ((t * 1.1 + p / SPER + s * 0.37) % 1) * 0.28;
      const r = 0.16 + age * 0.12; set(Math.cos(a) * r, 0.28 - 1.8 * age * age, Math.sin(a) * r);
    }
    // central bubbling jet
    for (let p = 0; p < JET; p++) { const age = ((t * 1.4 + p / JET) % 1); set((Math.random() - 0.5) * 0.008, 0.47 + Math.sin(age * Math.PI) * 0.06 * boost, (Math.random() - 0.5) * 0.008); }
    geo.attributes.position.needsUpdate = true;
    ripples.forEach(({ rg, r, ph }) => { const k = (t * 0.5 + ph) % 1; rg.scale.setScalar(r * (0.2 + k * 0.8)); rg.material.opacity = 0.45 * (1 - k); });
    div.rotation.y = t * 0.6;
  };
  return g;
}
