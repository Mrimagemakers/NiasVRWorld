// ═════════════════════════════════════════════════════════════════════════════
//  NATURE — grass, trees, flowers, bushes, rocks, sparkles, butterflies
// ═════════════════════════════════════════════════════════════════════════════
const WIND = { value: 0 };
function nearLandmark(x, z, pad = 0) {
  for (const k in LM) { const L = LM[k]; if (Math.hypot(x - L.x, z - L.z) < L.r + pad) return true; }
  return false;
}
// Add wind sway to any instanced material (height-weighted)
function windify(mat, amt = 0.2, darkBase = 0) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = WIND;
    sh.vertexShader = 'uniform float uTime;\nvarying float vHgt;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      vHgt = position.y;
      #ifdef USE_INSTANCING
        vec3 ip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
      #else
        vec3 ip = vec3(0.0);
      #endif
      float sw = sin(uTime*1.5 + ip.x*0.22 + ip.z*0.17)*0.6 + sin(uTime*2.6 + ip.x*0.7 + ip.z*0.4)*0.25;
      transformed.x += sw * ${amt.toFixed(3)} * max(position.y,0.0) * max(position.y,0.0);
      transformed.z += cos(uTime*1.2 + ip.z*0.31) * ${(amt * 0.5).toFixed(3)} * max(position.y,0.0) * max(position.y,0.0);`);
    if (darkBase) sh.fragmentShader = 'varying float vHgt;\n' + sh.fragmentShader.replace('#include <color_fragment>',
      `#include <color_fragment>\n diffuseColor.rgb *= mix(${(1 - darkBase).toFixed(2)}, 1.12, clamp(vHgt,0.0,1.0));`);
  };
  return mat;
}
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _e = new THREE.Euler(), _c = new THREE.Color();
// Distance culling: things beyond their view range are skipped (shorter ranges on phones & headsets)
const CULL = [], CULL_K = Q.headset ? 0.6 : isMobile ? 0.75 : 1;
function cullAdd(obj, range, center) { CULL.push({ obj, range: range * CULL_K, c: center || null }); }
function updateCull(focus) {
  for (const e of CULL) { const p = e.c || e.obj.getWorldPosition(e.tmp || (e.tmp = new THREE.Vector3())); if (!e.c && e.obj.matrixAutoUpdate === false) e.c = p.clone(); const d = Math.hypot(p.x - focus.x, p.z - focus.z); e.obj.visible = d < e.range && !e.obj.userData.hidden; }
}
// Split instances into map tiles so tiles that are off-screen or far away are skipped entirely
function chunked(list, cell, make, range = 0) {
  const m = new Map(); for (const it of list) { const k = Math.floor(it.x / cell) + ',' + Math.floor(it.z / cell); (m.get(k) || m.set(k, []).get(k)).push(it); }
  const out = []; for (const sub of m.values()) for (const im of make(sub)) { im.computeBoundingSphere(); im.boundingSphere.radius += 3; out.push(im); if (range) cullAdd(im, range + im.boundingSphere.radius, im.boundingSphere.center.clone()); } return out;
}
function setInst(im, i, x, y, z, ry, sx, sy = sx, sz = sx, rx = 0, rz = 0) {
  _e.set(rx, ry, rz); _q.setFromEuler(_e); _s.set(sx, sy, sz); _p.set(x, y, z);
  im.setMatrixAt(i, _m4.compose(_p, _q, _s));
}

// ─── Grass ───────────────────────────────────────────────────────────────────
{
  const g = new THREE.BufferGeometry();
  const P = [-0.032, 0, 0, 0.032, 0, 0, -0.026, 0.35, 0.02, 0.026, 0.35, 0.02, -0.016, 0.7, 0.06, 0.016, 0.7, 0.06, 0, 1, 0.13];
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(7).fill([0, 1, 0]).flat(), 3));
  g.setIndex([0, 1, 2, 2, 1, 3, 2, 3, 4, 4, 3, 5, 4, 5, 6]);
  const mat = windify(new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide, roughness: 0.9 }), 0.22, 0.55);
  const items = [];
  const greens = [0x5FAE2E, 0x77C23B, 0x4E9A28, 0x8BCB4A, 0x6BB534];
  let n = 0, tries = 0;
  while (n < Q.grass && tries < Q.grass * 6) {
    tries++;
    const a = rand() * TAU, r = Math.pow(rand(), 0.7) * 104, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (distPath(x, z) < 1.9 || isWet(x, z) || distPond(x, z) < 2) continue;
    if (Math.hypot(x - LM.plaza.x, z - LM.plaza.z) < 8 || Math.hypot(x - LM.greenhouse.x, z - LM.greenhouse.z) < 6.5 || (Math.abs(x - LM.library.x) < 10 && Math.abs(z - LM.library.z) < 13)) continue;
    const clump = fbm(x * 0.2, z * 0.2, 2); if (clump < 0.32 && rand() < 0.6) continue;
    items.push({ x, z, y: H(x, z), ry: rand() * TAU, s: rr(0.8, 1.2), h: rr(0.25, 0.55) * (0.75 + clump * 0.8), rx: rr(-0.2, 0.2), c: greens[n % 5] }); n++;
  }
  chunked(items, 22, sub => { const im = new THREE.InstancedMesh(g, mat, sub.length); im.receiveShadow = true;
    sub.forEach((b, k) => { setInst(im, k, b.x, b.y, b.z, b.ry, b.s, b.h, 1, b.rx); im.setColorAt(k, _c.setHex(b.c).multiplyScalar(0.85 + hash2(b.x, b.z) * 0.25)); }); scene.add(im); return [im]; }, 45);
}

// ─── Trees (instanced prototypes) ───────────────────────────────────────────
const barkTex = TEX.bark.map;
const barkMat = texMat(TEX.bark, 0xffffff, 0.95, 1.4);
const leafBump = dataTex(128, 128, (x, w, h) => {
  x.fillStyle = '#666'; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 400; i++) { const v = Math.random() * 255 | 0; x.fillStyle = `rgb(${v},${v},${v})`; x.beginPath(); x.ellipse(Math.random() * w, Math.random() * h, 3 + Math.random() * 3, 1.5 + Math.random() * 2, Math.random() * TAU, 0, TAU); x.fill(); }
}, [3, 3]);
const canopyMat = windify(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, normalMap: TEX.leaf.normal, normalScale: new THREE.Vector2(1.3, 1.3) }), 0.004);

function makeTreeProto(seed, kind = 'round', detail = 2) {
  const trunkParts = [], leafParts = [];
  if (kind === 'pine') {
    const t = new THREE.CylinderGeometry(0.12, 0.3, 3.2, 8); t.translate(0, 1.6, 0); trunkParts.push(t.toNonIndexed());
    for (let i = 0; i < 4; i++) {
      const c = lumpy(new THREE.ConeGeometry(1.9 - i * 0.38, 2.2, detail > 1 ? 10 : 7, detail > 1 ? 3 : 1), 0.12, 1.5, seed + i); c.translate(0, 2.2 + i * 1.15, 0);
      leafParts.push(colorize(c.toNonIndexed(), 0x2F6E36, 0x4C9447));
    }
  } else {
    const lean = rr(-0.3, 0.3);
    trunkParts.push(taperTube([[0, -0.2, 0], [lean * 0.4, 1.4, 0.1], [lean, 2.8, -0.1]], 0.36, 0.17, 10, 9));
    for (let b = 0; b < 3; b++) { const a = b / 3 * TAU + seed; trunkParts.push(taperTube([[lean * 0.8, 2.3, 0], [Math.cos(a) * 1.1 + lean, 3.1, Math.sin(a) * 1.1]], 0.12, 0.06, 6, 6)); }
    const blobs = 7 + (seed * 3 % 4 | 0);
    for (let i = 0; i < blobs; i++) {
      const a = i / blobs * TAU + seed, r = i === 0 ? 0 : rr(0.9, 1.6), y = 3.5 + rr(-0.3, 1.1) + (i === 0 ? 0.6 : 0);
      const s = i === 0 ? 1.7 : rr(1.0, 1.35);
      const c = lumpy(new THREE.IcosahedronGeometry(s, detail), 0.16, 1.2, seed * 10 + i); c.scale(1, 0.85, 1); c.translate(Math.cos(a) * r + lean, y, Math.sin(a) * r);
      leafParts.push(colorize(c.toNonIndexed(), 0x3E8A2A, 0x8CCB4C, 3.2));
    }
  }
  return { trunk: mergeGeometries(trunkParts), leaves: mergeGeometries(leafParts) };
}
// Vertex color gradient: dark underside → sunlit top
function colorize(g, dark, light, y0 = 0) {
  const p = g.attributes.position, c = new Float32Array(p.count * 3), a = new THREE.Color(dark), b = new THREE.Color(light), t = new THREE.Color();
  g.computeBoundingBox(); const bb = g.boundingBox;
  for (let i = 0; i < p.count; i++) {
    const k = (p.getY(i) - bb.min.y) / (bb.max.y - bb.min.y + 1e-5);
    t.copy(a).lerp(b, Math.pow(k, 0.8)).multiplyScalar(0.9 + fbm(p.getX(i) * 3, p.getZ(i) * 3, 2) * 0.25); c.set([t.r, t.g, t.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return g;
}
const TD = (isMobile || Q.headset) ? 1 : 2;
const TREE_PROTOS = [makeTreeProto(1.3, 'round', TD), makeTreeProto(2.7, 'round', TD), makeTreeProto(4.1, 'round', TD), makeTreeProto(5.9, 'pine', TD), makeTreeProto(7.3, 'pine', TD),
  makeTreeProto(1.3, 'round', 1), makeTreeProto(2.7, 'round', 1), makeTreeProto(4.1, 'round', 1), makeTreeProto(5.9, 'pine', 1), makeTreeProto(7.3, 'pine', 1)];
function plantTrees(list) {
  // list: [{x,z,s,ry,tint,proto}]
  TREE_PROTOS.forEach((P, pi) => {
    const items = list.filter(t => t.proto === pi); if (!items.length) return;
    chunked(items, pi >= 5 ? 80 : 45, sub => {
      const tr = new THREE.InstancedMesh(P.trunk, barkMat, sub.length), lf = new THREE.InstancedMesh(P.leaves, canopyMat, sub.length);
      const far = pi >= 5; tr.castShadow = lf.castShadow = !far; tr.receiveShadow = lf.receiveShadow = true;
      sub.forEach((t, i) => { const y = H(t.x, t.z) - 0.1; setInst(tr, i, t.x, y, t.z, t.ry, t.s); setInst(lf, i, t.x, y, t.z, t.ry, t.s); lf.setColorAt(i, _c.setHex(t.tint ?? 0xffffff)); });
      scene.add(tr, lf); return [tr, lf];
    }, pi >= 5 ? 0 : 150);
  });
}
{
  const trees = [];
  // Whisperwood forest ring around the garden
  for (let i = 0; i < 420; i++) {
    const a = rand() * TAU, r = rr(112, 150), x = Math.cos(a) * r, z = Math.sin(a) * r * 0.95;
    if (Math.abs(x) < 9 && z > 60) continue; // keep the view through the Magic Gate
    trees.push({ x, z, s: rr(1.1, 2.0), ry: rand() * TAU, proto: rand() < 0.45 ? 8 : 5 + (i % 2), tint: _c.setHSL(rr(0.24, 0.32), rr(0.5, 0.8), rr(0.42, 0.6)).getHex() });
  }
  // Shade trees inside the garden
  let placed = 0;
  for (let i = 0; i < 900 && placed < 130; i++) {
    const a = rand() * TAU, r = rr(14, 106), x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (distPath(x, z) < 5 || isWet(x, z) || distPond(x, z) < 5 || distLake(x, z) < 4 || nearLandmark(x, z, 3)) continue;
    trees.push({ x, z, s: rr(0.85, 1.25), ry: rand() * TAU, proto: placed % 3, tint: rand() < 0.15 ? 0xFFB7D0 : 0xffffff }); placed++;
  }
  plantTrees(trees);
}

// ─── Flowers ─────────────────────────────────────────────────────────────────
const FLOWER_COLS = [0xFF5D8F, 0xFFD23F, 0xB065E8, 0xFF8A3D, 0xFF4D4D, 0xFFFFFF, 0x5AA9FF, 0xFF9ED2];
const flowerProto = (() => {
  const stem = new THREE.CylinderGeometry(0.018, 0.024, 0.5, 5); stem.translate(0, 0.25, 0);
  const leaf = new THREE.SphereGeometry(0.07, 5, 3); leaf.scale(1.4, 0.25, 0.6); leaf.translate(0.08, 0.18, 0);
  const center = new THREE.SphereGeometry(0.055, 7, 4); center.scale(1, 0.6, 1); center.translate(0, 0.52, 0);
  const petals = [];
  for (let i = 0; i < 6; i++) {
    const p = new THREE.CircleGeometry(0.075, 6); p.scale(1, 0.55, 1); p.rotateX(-Math.PI / 2); p.translate(0.09, 0, 0); p.rotateZ(0.2); p.rotateY(i / 6 * TAU); p.translate(0, 0.51, 0);
    petals.push(p.toNonIndexed());
  }
  return {
    base: mergeGeometries([colorize(stem.toNonIndexed(), 0x2F7A2A, 0x5BB043), colorize(leaf.toNonIndexed(), 0x3C8E32, 0x6CC04F), colorize(center.toNonIndexed(), 0xC27C0E, 0xFFD54A)]),
    petals: mergeGeometries(petals)
  };
})();
const flowerBaseMat = windify(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7 }), 0.25);
const petalMat = windify(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, side: THREE.DoubleSide }), 0.25);
function plantFlowers(list) {
  return chunked(list, 50, sub => {
    const b = new THREE.InstancedMesh(flowerProto.base, flowerBaseMat, sub.length), p = new THREE.InstancedMesh(flowerProto.petals, petalMat, sub.length);
    b.castShadow = p.castShadow = false; b.receiveShadow = p.receiveShadow = true;
    sub.forEach((f, i) => { const y = f.y ?? H(f.x, f.z), ry = rand() * TAU; setInst(b, i, f.x, y, f.z, ry, f.s); setInst(p, i, f.x, y, f.z, ry, f.s); p.setColorAt(i, _c.setHex(f.c)); });
    scene.add(b, p); return [b, p];
  }, 70);
}
{
  const list = [];
  // along path edges
  for (const c of [mainC, loopC, outerC, ...spurC]) c.pts.forEach((pt, i) => {
    if (i % 2) return;
    for (const sgn of [-1, 1]) {
      if (rand() < 0.35) continue;
      const nx = pt.x + sgn * rr(2.0, 3.6) + rr(-0.4, 0.4), nz = pt.z + rr(-0.6, 0.6);
      if (isWet(nx, nz) || distPath(nx, nz) < 1.9) continue;
      list.push({ x: nx, z: nz, s: rr(0.8, 1.4), c: FLOWER_COLS[(i / 6 | 0) % FLOWER_COLS.length] });
    }
  });
  // wildflower drifts
  for (let i = 0; list.length < Q.flowers && i < 9000; i++) {
    const a = rand() * TAU, r = Math.sqrt(rand()) * 100, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (distPath(x, z) < 2 || isWet(x, z) || nearLandmark(x, z, -2)) continue;
    const drift = fbm(x * 0.08 + 11, z * 0.08, 2); if (drift < 0.52) continue;
    list.push({ x, z, s: rr(0.7, 1.2), c: FLOWER_COLS[Math.floor(fbm(x * 0.03, z * 0.03 + 5, 2) * 16) % FLOWER_COLS.length] });
  }
  plantFlowers(list);
}

// ─── Bushes & rocks ──────────────────────────────────────────────────────────
const bushProto = (() => {
  const parts = [];
  for (let i = 0; i < 5; i++) { const s = lumpy(new THREE.IcosahedronGeometry(rr(0.45, 0.65), 1), 0.18, 2, i); s.translate(rr(-0.5, 0.5), rr(0.25, 0.55), rr(-0.4, 0.4)); parts.push(colorize(s.toNonIndexed(), 0x2E7426, 0x6DBB44)); }
  for (let i = 0; i < 14; i++) { const f = new THREE.SphereGeometry(0.06, 4, 3); const a = rand() * TAU, e = rr(0.2, 1.2); f.translate(Math.cos(a) * 0.75 * Math.sin(e + 0.4), 0.45 + Math.cos(e) * 0.5, Math.sin(a) * 0.7 * Math.sin(e + 0.4)); parts.push(colorize(f.toNonIndexed(), 0xFF8FC0, 0xFFC2DD)); }
  return mergeGeometries(parts);
})();
const bushMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, normalMap: TEX.leaf.normal, normalScale: new THREE.Vector2(1.2, 1.2) });
function plantBushes(list) {
  return chunked(list, 40, sub => { const im = new THREE.InstancedMesh(bushProto, bushMat, sub.length); im.castShadow = im.receiveShadow = true;
    sub.forEach((b, i) => { setInst(im, i, b.x, H(b.x, b.z) - 0.05, b.z, rand() * TAU, b.s); im.setColorAt(i, _c.setHex(b.tint ?? 0xffffff)); });
    scene.add(im); return [im]; }, 100);
}
{
  const list = [];
  for (let i = 0; i < 1200 && list.length < 220; i++) {
    const a = rand() * TAU, r = rr(8, 104), x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (distPath(x, z) < 3 || isWet(x, z) || distPond(x, z) < 3 || nearLandmark(x, z, 1)) continue;
    list.push({ x, z, s: rr(0.8, 1.6), tint: rand() < 0.5 ? 0xffffff : 0xE8FFE0 });
  }
  plantBushes(list);
  // river & pond rocks
  const rockG = lumpy(new THREE.DodecahedronGeometry(0.5, 1), 0.25, 1.6, 3);
  const rocks = new THREE.InstancedMesh(rockG, texMat(TEX.stone, 0xA49C8C, 0.9, 1.6), 160);
  rocks.castShadow = rocks.receiveShadow = true;
  let k = 0;
  streamC.pts.forEach((p, i) => {
    if (i % 2 || Math.abs(p.x) > 85 || k >= 130) return;
    for (const sgn of [-1, 1]) { if (rand() < 0.4) continue; const x = p.x + rr(-1, 1), z = p.z + sgn * rr(4.2, 5.6); if (Math.abs(x) < 5) continue; setInst(rocks, k, x, H(x, z) + 0.05, z, rand() * TAU, rr(0.5, 1.4), rr(0.35, 0.8), rr(0.6, 1.2)); rocks.setColorAt(k++, _c.setHSL(0.09, 0.12, rr(0.45, 0.62))); }
  });
  for (let i = 0; i < 30 && k < 160; i++) { const a = i / 30 * TAU, x = POND.x + Math.cos(a) * (POND.r + rr(0.8, 1.8)), z = POND.z + Math.sin(a) * (POND.r + rr(0.8, 1.8)); setInst(rocks, k, x, H(x, z) + 0.05, z, rand() * TAU, rr(0.6, 1.3), rr(0.4, 0.8), rr(0.6, 1.1)); rocks.setColorAt(k++, _c.setHSL(0.09, 0.1, rr(0.48, 0.62))); }
  rocks.count = k; scene.add(rocks);
}

// ─── Magic sparkles (golden motes everywhere, like the book's pages) ────────
const sparkTex = canvasTex(64, 64, (x) => {
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.18, 'rgba(255,240,180,0.9)'); g.addColorStop(0.5, 'rgba(255,200,80,0.25)'); g.addColorStop(1, 'rgba(255,200,80,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
});
function makeSparkles(count, spawn, size = 0.22, color = 0xFFE7A0) {
  const pos = new Float32Array(count * 3), ph = new Float32Array(count);
  for (let i = 0; i < count; i++) { const p = spawn(i); pos.set([p.x, p.y, p.z], i * 3); ph[i] = rand() * 100; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('phase', new THREE.BufferAttribute(ph, 1));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: WIND, uTex: { value: sparkTex }, uSize: { value: size * 420 }, uCol: { value: new THREE.Color(color) } },
    vertexShader: `uniform float uTime,uSize; attribute float phase; varying float vA;
      void main(){ vec3 p=position; p.y+=sin(uTime*0.7+phase)*0.35; p.x+=sin(uTime*0.4+phase*1.3)*0.4; p.z+=cos(uTime*0.35+phase)*0.4;
        vec4 mv=modelViewMatrix*vec4(p,1.0); gl_Position=projectionMatrix*mv;
        vA=0.35+0.65*pow(0.5+0.5*sin(uTime*2.2+phase*3.0),3.0); gl_PointSize=uSize*vA/-mv.z; }`,
    fragmentShader: `uniform sampler2D uTex; uniform vec3 uCol; varying float vA;
      void main(){ vec4 t=texture2D(uTex,gl_PointCoord); gl_FragColor=vec4(uCol*1.6,t.a*vA); }`
  });
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; scene.add(pts); return pts;
}
makeSparkles(isMobile ? 700 : 1600, () => { const a = rand() * TAU, r = Math.sqrt(rand()) * 62, x = Math.cos(a) * r, z = Math.sin(a) * r; return new THREE.Vector3(x, H(x, z) + rr(0.3, 4.5), z); });

// ─── Ambient butterflies ─────────────────────────────────────────────────────
const AMBIENT_FLIERS = [];
function wingTexture(col1, col2, dots) {
  return canvasTex(128, 128, (x) => {
    x.clearRect(0, 0, 128, 128);
    const g = x.createRadialGradient(10, 64, 4, 10, 64, 120); g.addColorStop(0, col2); g.addColorStop(1, col1);
    x.fillStyle = g; x.beginPath(); x.moveTo(4, 64); x.bezierCurveTo(40, -10, 130, 0, 118, 52); x.bezierCurveTo(112, 70, 80, 70, 60, 66);
    x.bezierCurveTo(100, 80, 104, 124, 64, 120); x.bezierCurveTo(40, 118, 14, 90, 4, 64); x.fill();
    x.strokeStyle = 'rgba(40,20,10,0.8)'; x.lineWidth = 4; x.stroke();
    if (dots) { x.fillStyle = 'rgba(255,255,255,0.9)'; [[90, 30], [100, 46], [70, 96]].forEach(([a, b]) => { x.beginPath(); x.arc(a, b, 5, 0, TAU); x.fill(); }); }
  });
}
{
  const cols = [['#FFB703', '#FFE29A'], ['#4CC9F0', '#C8F1FF'], ['#F72585', '#FFC2E2'], ['#9B5DE5', '#E2CCFF']];
  for (let i = 0; i < (isMobile ? 10 : 18); i++) {
    const [c1, c2] = cols[i % 4], tex = wingTexture(c1, c2, true);
    const b = grp(); const wm = new THREE.MeshStandardMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, alphaTest: 0.1, roughness: 0.6 });
    const wg = new THREE.PlaneGeometry(0.34, 0.34); wg.translate(0.17, 0, 0); wg.rotateX(-Math.PI / 2);
    b.userData.dynamic = true;
    const L = mk(wg, wm, b, false, false), R = mk(wg, wm, b, false, false); R.scale.x = -1; L.userData.keep = R.userData.keep = true;
    mk(new THREE.CapsuleGeometry(0.02, 0.16, 3, 6), std(0x2b1a10), b, false, false).rotation.x = Math.PI / 2;
    const home = loopC.pts[(i * 37) % loopC.pts.length];
    AMBIENT_FLIERS.push({ o: b, L, R, home: home.clone(), ph: rand() * 100, rad: rr(3, 7), sp: rr(0.25, 0.5) });
  }
}
function updateAmbient(t) {
  for (const f of AMBIENT_FLIERS) {
    const a = t * f.sp + f.ph, x = f.home.x + Math.cos(a) * f.rad + Math.sin(a * 2.3) * 1.2, z = f.home.z + Math.sin(a * 1.3) * f.rad;
    const y = H(x, z) + 1.2 + Math.sin(a * 3.1) * 0.6;
    f.o.lookAt(x, y, z); f.o.position.set(x, y, z);
    const flap = Math.sin(t * 18 + f.ph) * 1.1; f.L.rotation.z = flap; f.R.rotation.z = -flap;
  }
}
