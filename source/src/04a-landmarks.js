// ═════════════════════════════════════════════════════════════════════════════
//  LANDMARKS (part 1) — one for every chapter of the book
// ═════════════════════════════════════════════════════════════════════════════
const ANIM = [];             // per-frame callbacks (t, dt)
const FLOATERS = [];         // bobbing / spinning decorations
function floater(o, amp = 0.25, spd = 1.2, spin = 0) { o.userData.dynamic = true; o.userData.fb = o.position.y; o.userData.fph = rand() * 10; o.userData.famp = amp; o.userData.fspd = spd; o.userData.fspin = spin; FLOATERS.push(o); return o; }
const stoneTex = TEX.stone.map;
const stoneMat = texMat(TEX.stone, 0xF4ECDD, 0.85, 1.2);
const woodTex = TEX.wood.map;
const woodMat = texMat(TEX.wood, 0xffffff, 0.78, 1.2);
const darkWood = texMat(TEX.wood, 0x8A6448, 0.85, 1.2);

// Wooden signboard on two posts. Faces +z after rotation ry.
function signBoard(x, z, ry, lines, w = 3.2, h = 1.2, y0 = 1.6, opts = {}) {
  const g = grp(); g.position.set(x, H(x, z), z); g.rotation.y = ry;
  const tex = signTex(lines, opts);
  const board = mk(new THREE.BoxGeometry(w, h, 0.14), [darkWood, darkWood, darkWood, darkWood, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 }), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 })], g);
  board.position.y = y0 + h / 2;
  for (const s of [-1, 1]) { const p = mk(new THREE.CylinderGeometry(0.09, 0.11, y0 + h + 0.25, 8), darkWood, g); p.position.set(s * (w / 2 - 0.15), (y0 + h + 0.25) / 2, -0.1); }
  const cap = mk(new THREE.BoxGeometry(w + 0.3, 0.1, 0.34), darkWood, g); cap.position.y = y0 + h + 0.08;
  return g;
}
// Directional fingerpost
function fingerPost(x, z, arms) {
  const g = grp(); const y = H(x, z); g.position.set(x, y, z);
  mk(new THREE.CylinderGeometry(0.12, 0.15, 3.6, 10), darkWood, g).position.y = 1.8;
  mk(new THREE.SphereGeometry(0.2, 12, 10), GOLD, g).position.y = 3.7;
  arms.forEach((a, i) => {
    const L = LM[a]; const ang = Math.atan2(L.x - x, L.z - z);
    const arm = grp(g); arm.position.y = 3.25 - i * 0.42; arm.rotation.y = ang - Math.PI / 2;
    const tex = signTex([L.n.replace(/^\S+\s/, '')], { w: 512, h: 96, fs: 70, bg: '#F3E2B3', border: '#8B5A2B', fg: '#2F6B2F' });
    const shape = new THREE.Shape(); shape.moveTo(0, -0.16); shape.lineTo(1.75, -0.16); shape.lineTo(1.98, 0); shape.lineTo(1.75, 0.16); shape.lineTo(0, 0.16);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.06, bevelEnabled: false });
    const uvs = geo.attributes.uv, p = geo.attributes.position; for (let k = 0; k < uvs.count; k++) uvs.setXY(k, p.getX(k) / 1.98, (p.getY(k) + 0.16) / 0.32);
    const m = mk(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75 }), arm); m.position.set(0.1, 0, -0.03);
  });
  return g;
}

// ─── 1 · THE MAGIC GATE ──────────────────────────────────────────────────────
const GATE = {};
{
  const L = LM.gate, g = grp(); g.position.set(L.x, H(L.x, L.z), L.z);
  const pillarG = lathe([[0.95, 0], [0.95, 0.35], [0.7, 0.5], [0.62, 0.8], [0.58, 2.5], [0.6, 4.2], [0.78, 4.5], [0.9, 4.8], [0.9, 5.05], [0.5, 5.2], [0.0001, 5.25]], 24, 60);
  for (const s of [-1, 1]) {
    const p = mk(pillarG, stoneMat, g); p.position.x = s * 4.6;
    for (const yy of [1.0, 4.35]) { const band = mk(new THREE.TorusGeometry(0.64, 0.06, 8, 32), GOLD, p); band.rotation.x = Math.PI / 2; band.position.y = yy; }
    const orb = mk(new THREE.SphereGeometry(0.42, 32, 24), new THREE.MeshPhysicalMaterial({ color: 0xFFF0B0, emissive: 0xFFC94D, emissiveIntensity: 2.4, roughness: 0.1, clearcoat: 1 }), p, false);
    orb.position.y = 5.65; floater(orb, 0.12, 1.5);
    const holder = mk(new THREE.TorusGeometry(0.45, 0.05, 8, 24, Math.PI), GOLD, p); holder.position.y = 5.5; holder.rotation.x = Math.PI;
  }
  // arch
  const arch = mk(new THREE.TorusGeometry(4.6, 0.38, 20, 80, Math.PI), stoneMat, g); arch.position.y = 5.2;
  const archGold = mk(new THREE.TorusGeometry(4.6, 0.06, 8, 80, Math.PI), GOLD, g); archGold.position.set(0, 5.2, 0.38);
  // garland of leaves and blossoms over arch and down the pillars
  {
    const parts = [], pinks = [0xFF7EB6, 0xFFFFFF, 0xFFD23F, 0xC77DFF, 0xFF9E5E];
    const addClump = (x, y, z, s) => {
      const l = lumpy(new THREE.IcosahedronGeometry(s, 2), 0.25, 3, x * 3 + y); l.translate(x, y, z); parts.push(colorize(l.toNonIndexed(), 0x2C7A2A, 0x6CC04A));
      for (let k = 0; k < 3; k++) { const b = new THREE.SphereGeometry(rr(0.05, 0.08), 8, 6); b.translate(x + rr(-s, s), y + rr(-s, s) * 0.8, z + rr(0.1, s)); const col = pinks[(rand() * 5) | 0]; parts.push(colorize(b.toNonIndexed(), col, col)); }
    };
    for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI; addClump(Math.cos(a) * 4.6, 5.2 + Math.sin(a) * 4.6, rr(-0.2, 0.3), rr(0.32, 0.5)); }
    for (const s of [-1, 1]) for (let y = 0.6; y < 5.2; y += 0.42) { const a = rand() * TAU; addClump(s * 4.6 + Math.cos(a) * 0.62, y, Math.sin(a) * 0.62, rr(0.22, 0.34)); }
    mk(mergeGeometries(parts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, normalMap: TEX.leaf.normal }), g);
  }
  // keystone medallion with glowing 8
  const med = grp(g); med.position.set(0, 9.85, 0.15);
  mk(new THREE.CylinderGeometry(0.95, 0.95, 0.22, 40), GOLD, med).rotation.x = Math.PI / 2;
  mk(new THREE.CylinderGeometry(0.78, 0.78, 0.25, 40), new THREE.MeshPhysicalMaterial({ color: 0x5B2A86, roughness: 0.3, clearcoat: 1 }), med).rotation.x = Math.PI / 2;
  const eight = text3D('8', 1.05, glow(0xFFD86B, 2.2), 0.2); eight.position.z = 0.16; med.add(eight);
  GATE.eight = eight;
  // floating title
  const title = grp(g); title.position.set(0, 11.6, 0.2);
  const t1 = text3D('THE NUMBER GARDEN', 0.62, gloss(0x2FA84F, 0.3), 0.3); title.add(t1);
  floater(title, 0.12, 0.8);
  // golden gates, swung open
  for (const s of [-1, 1]) {
    const hinge = grp(g); hinge.position.set(s * 4.0, 0, 0); hinge.rotation.y = s * -1.15;
    const bars = [];
    const add = (geo) => bars.push(geo.toNonIndexed());
    add(tube([[0, 0.3, 0], [-s * 3.9, 0.3, 0]], 0.06, 4, 6)); add(tube([[0, 4.3, 0], [-s * 1.9, 4.6, 0], [-s * 3.9, 3.9, 0]], 0.07, 16, 6));
    for (let i = 0; i <= 8; i++) { const xx = -s * (0.05 + i * 0.47); const top = 4.3 + Math.sin((i / 8) * Math.PI) * 0.3 - (i / 8) * 0.4; add(tube([[xx, 0.3, 0], [xx, top, 0]], 0.035, 2, 6)); }
    for (let i = 0; i < 4; i++) { const cx = -s * (0.5 + i * 0.95); const pts = []; for (let k = 0; k <= 24; k++) { const a = k / 24 * TAU * 1.3; const r = 0.08 + k / 24 * 0.32; pts.push([cx + Math.cos(a) * r, 2.0 + Math.sin(a) * r, 0]); } add(tube(pts, 0.03, 40, 5)); }
    mk(mergeGeometries(bars), GOLD, hinge);
  }
  // glowing portal haze
  const haze = mk(new THREE.PlaneGeometry(8.6, 9.5), new THREE.MeshBasicMaterial({ map: sparkTex, color: 0xFFE9A8, transparent: true, opacity: 0.25, depthWrite: false, blending: THREE.AdditiveBlending }), g, false, false);
  haze.position.set(0, 4.6, 0); GATE.haze = haze;
  // hedge walls stretching from the gate
  {
    const parts = [];
    for (const s of [-1, 1]) for (let x = 5.6; x < 34; x += 0.9) {
      const b = lumpy(new THREE.IcosahedronGeometry(1, 2), 0.22, 1.4, x * s); b.scale(0.8, 1.15, 0.85); b.translate(0, 0.1, 0); b.translate(s * x, 1.05, rr(-0.1, 0.1)); parts.push(colorize(b.toNonIndexed(), 0x23692A, 0x5DAE3E));
      if (rand() < 0.6) { const f = new THREE.SphereGeometry(0.1, 6, 5); f.translate(s * x + rr(-0.5, 0.5), rr(1, 2.1), 0.72); const c = [0xFF7EB6, 0xFFFFFF, 0xFFD23F][(rand() * 3) | 0]; parts.push(colorize(f.toNonIndexed(), c, c)); }
    }
    const hedge = mk(mergeGeometries(parts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, normalMap: TEX.leaf.normal, normalScale: new THREE.Vector2(1.3, 1.3) }), g);
  }
  const pl = new THREE.PointLight(0xFFD27A, 6, 16, 1.6); pl.position.set(0, 5, 1); g.add(pl);
  ANIM.push((t) => { haze.material.opacity = 0.18 + Math.sin(t * 1.4) * 0.08; eight.material.emissiveIntensity = 1.8 + Math.sin(t * 2) * 0.6; });
  makeSparkles(260, () => new THREE.Vector3(L.x + rr(-5, 5), H(L.x, L.z) + rr(0.5, 10), L.z + rr(-3, 3)), 0.28);
}

// ─── 2 · WELCOME PLAZA & FOUNTAIN ────────────────────────────────────────────
{
  const L = LM.plaza, y0 = H(L.x, L.z), g = grp(); g.position.set(L.x, y0, L.z);
  const pave = mk(new THREE.CircleGeometry(8.4, 64), texMat(texClone(TEX.cobble, 4, 4), 0xffffff, 0.82, 1.2), g, false);
  pave.rotation.x = -Math.PI / 2; pave.position.y = 0.07;
  const curb = mk(new THREE.TorusGeometry(8.4, 0.18, 8, 80), stoneMat, g); curb.rotation.x = Math.PI / 2; curb.position.y = 0.08;
  // fountain
  mk(lathe([[3.3, 0], [3.4, 0.2], [3.35, 0.75], [3.1, 0.8], [3.0, 0.3], [0.001, 0.25]], 48), stoneMat, g);
  mk(lathe([[0.55, 0.2], [0.42, 0.6], [0.38, 1.6], [0.5, 2.0], [1.45, 2.15], [1.55, 2.45], [1.4, 2.5], [0.001, 2.3]], 40), stoneMat, g);
  mk(lathe([[0.22, 2.4], [0.16, 2.9], [0.5, 3.15], [0.55, 3.3], [0.001, 3.25]], 32), stoneMat, g);
  const w1 = mk(new THREE.CircleGeometry(3.02, 48), waterMat, g, false); w1.rotation.x = -Math.PI / 2; w1.position.y = 0.62;
  const w2 = mk(new THREE.CircleGeometry(1.38, 40), waterMat, g, false); w2.rotation.x = -Math.PI / 2; w2.position.y = 2.38;
  const sheetMat = new THREE.MeshPhysicalMaterial({ color: 0xBFEFFF, transparent: true, opacity: 0.38, roughness: 0.05, normalMap: waterNormal, normalScale: new THREE.Vector2(0.6, 0.6), side: THREE.DoubleSide, depthWrite: false, clearcoat: 1 });
  const sheet = mk(new THREE.CylinderGeometry(1.5, 1.95, 1.8, 40, 1, true), sheetMat, g, false); sheet.position.y = 1.55;
  const jet = mk(new THREE.CylinderGeometry(0.05, 0.16, 1.1, 12, 1, true), sheetMat, g, false); jet.position.y = 3.8;
  // golden 8 on top
  const top8 = text3D('8', 0.7, GOLD, 0.3); top8.position.set(0, 3.75, 0); g.add(top8); floater(top8, 0.08, 1, 0.6);
  // numbers 0–9 around the rim
  for (let i = 0; i < 10; i++) {
    const a = i / 10 * TAU, n = text3D(String(i), 0.62, gloss(RAINBOW[i], 0.3), 0.35);
    n.position.set(Math.sin(a) * 3.35, 1.25, Math.cos(a) * 3.35); n.rotation.y = a; g.add(n); n.castShadow = true;
  }
  // benches & lanterns
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * TAU + Math.PI / 4, bx = Math.sin(a) * 6.6, bz = Math.cos(a) * 6.6;
    const b = grp(g); b.position.set(bx, 0, bz); b.rotation.y = a + Math.PI;
    for (let k = 0; k < 4; k++) { const s = mk(new THREE.BoxGeometry(2.2, 0.07, 0.16), woodMat, b); s.position.set(0, 0.52, -0.25 + k * 0.17); }
    for (let k = 0; k < 3; k++) { const s = mk(new THREE.BoxGeometry(2.2, 0.14, 0.05), woodMat, b); s.position.set(0, 0.75 + k * 0.17, -0.36); s.rotation.x = -0.12; }
    for (const s of [-1, 1]) { const leg = mk(tube([[s * 0.95, 0, 0.2], [s * 0.95, 0.5, 0.15], [s * 0.95, 0.5, -0.3], [s * 0.95, 1.15, -0.42]], 0.035, 12, 6), std(0x2D3B2F, 0.4, 0.7), b); }
    const la = a + Math.PI / 4, lx = Math.sin(la) * 7.6, lz = Math.cos(la) * 7.6;
    const lamp = grp(g); lamp.position.set(lx, 0, lz);
    mk(lathe([[0.22, 0], [0.18, 0.25], [0.07, 0.4], [0.06, 3.0], [0.1, 3.1], [0.001, 3.12]], 16), std(0x2D3B2F, 0.4, 0.7), lamp);
    const lan = mk(new THREE.SphereGeometry(0.26, 20, 16), new THREE.MeshPhysicalMaterial({ color: 0xFFF5D0, emissive: 0xFFC56B, emissiveIntensity: 1.6, roughness: 0.2, transmission: 0, clearcoat: 1 }), lamp, false); lan.position.y = 3.35;
    mk(new THREE.ConeGeometry(0.34, 0.3, 16), std(0x2D3B2F, 0.4, 0.7), lamp).position.y = 3.7;
  }
  ANIM.push((t) => { waterNormal.offset.set(t * 0.02, t * 0.035); sheetMat.normalMap.offset.y = -t * 0.6; });
  // spray droplets
  makeSparkles(120, () => new THREE.Vector3(L.x + rr(-1.6, 1.6), y0 + rr(0.7, 4.2), L.z + rr(-1.6, 1.6)), 0.12, 0xCFF6FF);
  signBoard(L.x - 4.6, L.z + 9.6, 0, ['Welcome to the', 'Number Garden!'], 3.6, 1.5, 1.2);
}

// ─── 3 · THE ADDITION BRIDGE ─────────────────────────────────────────────────
const BRIDGE = {};
{
  const L = LM.bridge, zs = L.z + 6.5, ze = L.z - 6.5, ys = H(0, zs) + 0.05, ye = H(0, ze) + 0.05, peak = 1.6;
  const deckY = (z) => { const t = (zs - z) / (zs - ze); return ys + (ye - ys) * t + Math.sin(t * Math.PI) * peak; };
  BRIDGE.deckY = deckY; BRIDGE.zs = zs; BRIDGE.ze = ze;
  const n = 46, planks = new THREE.InstancedMesh(new THREE.BoxGeometry(3.8, 0.12, 0.27), woodMat, n);
  planks.castShadow = planks.receiveShadow = true;
  for (let i = 0; i < n; i++) {
    const z = zs - (i + 0.5) / n * (zs - ze), slope = (deckY(z - 0.05) - deckY(z + 0.05)) / 0.1;
    setInst(planks, i, rr(-0.04, 0.04), deckY(z), z, rr(-0.015, 0.015), 1, 1, 1, Math.atan(slope));
    planks.setColorAt(i, _c.setHSL(0.08, 0.45, rr(0.5, 0.65)));
  }
  scene.add(planks);
  const parts = [];
  for (const s of [-1, 1]) {
    const beam = [], rail = [], rail2 = [];
    for (let i = 0; i <= 20; i++) { const z = zs - i / 20 * (zs - ze); beam.push([s * 1.75, deckY(z) - 0.2, z]); rail.push([s * 1.85, deckY(z) + 1.05, z]); rail2.push([s * 1.85, deckY(z) + 0.55, z]); }
    parts.push(tube(beam, 0.16, 40, 8).toNonIndexed(), tube(rail, 0.075, 40, 8).toNonIndexed(), tube(rail2, 0.05, 40, 6).toNonIndexed());
    for (let i = 0; i <= 10; i++) { const z = zs - i / 10 * (zs - ze), y = deckY(z); const p = new THREE.BoxGeometry(0.16, 1.3, 0.16); p.translate(s * 1.85, y + 0.45, z); parts.push(p.toNonIndexed()); }
  }
  mk(mergeGeometries(parts.map(p => { if (p.attributes.uv === undefined) p.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(p.attributes.position.count * 2), 2)); return p; })), darkWood);
  // entrance arch with sign (as in the book illustration)
  const ag = grp(); ag.position.set(0, ys, zs + 0.6);
  for (const s of [-1, 1]) {
    const post = mk(new THREE.BoxGeometry(0.42, 4.6, 0.42), darkWood, ag); post.position.set(s * 2.25, 2.3, 0);
    const plus = text3D('+', 0.62, gloss(0xFFD23F, 0.3), 0.35); plus.position.set(s * 2.25, 4.95, 0); ag.add(plus); floater(plus, 0.06, 2, 1.2);
    const cross = mk(new THREE.BoxGeometry(0.9, 0.2, 0.3), darkWood, ag); cross.position.set(s * 2.25, 3.9, 0);
  }
  const sb = mk(new THREE.BoxGeometry(5.2, 1.05, 0.2), [darkWood, darkWood, darkWood, darkWood,
    new THREE.MeshStandardMaterial({ map: signTex(['+ ADDITION BRIDGE +'], { w: 1024, h: 200, fg: '#FFD23F' }), roughness: 0.7 }),
    new THREE.MeshStandardMaterial({ map: signTex(['+ ADDITION BRIDGE +'], { w: 1024, h: 200, fg: '#FFD23F' }), roughness: 0.7 })], ag);
  sb.position.y = 4.35;
  // floating sum: 3 + 5 = 8
  const sum = grp(); sum.position.set(0, ys + 6.3, zs + 0.6);
  const glyphs = ['3', '+', '5', '=', '8'], cols = [0xFFD23F, 0xFFE27A, 0xFF7A8A, 0xFFE27A, 0x5CE1E6];
  glyphs.forEach((c, i) => { const m = text3D(c, 0.75, new THREE.MeshPhysicalMaterial({ color: cols[i], emissive: cols[i], emissiveIntensity: 0.55, roughness: 0.25, clearcoat: 1 }), 0.3); m.position.x = (i - 2) * 0.95; sum.add(m); floater(m, 0.12, 1.6); });
  BRIDGE.sum = sum;
  makeSparkles(180, () => new THREE.Vector3(rr(-8, 8), rr(-0.2, 3), L.z + rr(-5, 5)), 0.2);
}

// ─── 3b · THE FRACTION FIELD ─────────────────────────────────────────────────
{
  const L = LM.fraction, beds = [[2, -3.2, -3.0], [3, 3.2, -3.0], [4, -3.2, 3.0], [8, 3.2, 3.0]];
  const flowers = [];
  const pal = [[0xFF5D8F, 0xFFD23F], [0xB065E8, 0xFFFFFF, 0xFF8A3D], [0xFF4D4D, 0x5AA9FF, 0xFFD23F, 0xFF9ED2], [0xFF5D8F, 0xFFD23F, 0xB065E8, 0xFF8A3D, 0xFF4D4D, 0x5AA9FF, 0xFFFFFF, 0xFF9ED2]];
  beds.forEach(([den, ox, oz], bi) => {
    const cx = L.x + ox, cz = L.z + oz, y = H(cx, cz), R = 2.5;
    const soil = mk(new THREE.CylinderGeometry(R, R + 0.1, 0.25, 48), std(0x5A3A22, 0.95), scene, false); soil.position.set(cx, y + 0.06, cz);
    const rim = mk(new THREE.TorusGeometry(R + 0.05, 0.1, 8, 48), woodMat, scene); rim.rotation.x = Math.PI / 2; rim.position.set(cx, y + 0.18, cz);
    for (let k = 0; k < den; k++) { const a = k / den * TAU; const e = mk(new THREE.BoxGeometry(0.06, 0.16, R), woodMat, scene); e.position.set(cx + Math.sin(a) * R / 2, y + 0.2, cz + Math.cos(a) * R / 2); e.rotation.y = a; }
    for (let k = 0; k < 90; k++) {
      const a = rand() * TAU, r = Math.sqrt(rand()) * (R - 0.25), slice = Math.floor(((a % TAU) + TAU) % TAU / TAU * den);
      flowers.push({ x: cx + Math.sin(a) * r, z: cz + Math.cos(a) * r, y: y + 0.15, s: rr(0.8, 1.15), c: pal[bi][slice % pal[bi].length] });
    }
    // fraction stake
    const stake = grp(); stake.position.set(cx, y, cz + R + 0.6);
    mk(new THREE.CylinderGeometry(0.05, 0.05, 1.1, 8), darkWood, stake).position.y = 0.55;
    const f = text3D('1/' + den, 0.42, gloss(0xFFFFFF, 0.3), 0.3); f.position.y = 1.35; stake.add(f);
    const bg = mk(new THREE.CylinderGeometry(0.45, 0.45, 0.06, 28), gloss(0x2E7D32, 0.4), stake); bg.rotation.x = Math.PI / 2; bg.position.set(0, 1.35, -0.12);
  });
  plantFlowers(flowers);
  // Freddy's giant fraction pizza on a picnic blanket
  const py = H(L.x, L.z), pg = grp(); pg.position.set(L.x, py + 0.02, L.z);
  const blanket = mk(new THREE.PlaneGeometry(3.6, 3.6), new THREE.MeshStandardMaterial({ map: canvasTex(128, 128, (x) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { x.fillStyle = (i + j) % 2 ? '#E63946' : '#FFF5EE'; x.fillRect(i * 16, j * 16, 16, 16); } }), roughness: 0.9 }), pg, false);
  blanket.rotation.x = -Math.PI / 2; blanket.position.y = 0.04;
  for (let k = 0; k < 8; k++) {
    const sl = grp(pg); const a = k / 8 * TAU; const off = k === 0 ? 0.35 : 0.03;
    sl.position.set(Math.sin(a + TAU / 16) * off, 0.05, Math.cos(a + TAU / 16) * off); sl.rotation.y = a;
    mk(new THREE.CylinderGeometry(1.2, 1.2, 0.1, 10, 1, false, 0, TAU / 8 - 0.02), std(0xE9B35F, 0.8), sl).position.y = 0.05;
    mk(new THREE.CylinderGeometry(1.08, 1.08, 0.04, 10, 1, false, 0.01, TAU / 8 - 0.04), std(0xF4D25A, 0.6), sl).position.y = 0.12;
    for (let p = 0; p < 2; p++) { const pep = mk(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 14), std(0xC0392B, 0.5), sl); const aa = TAU / 16 + rr(-0.15, 0.15), r = rr(0.4, 0.9); pep.position.set(Math.sin(aa) * r, 0.15, Math.cos(aa) * r); }
    mk(new THREE.TorusGeometry(1.2, 0.07, 6, 6, TAU / 8 - 0.02), std(0xD99A4A, 0.8), sl).rotation.set(Math.PI / 2, 0, Math.PI / 2 - TAU / 8 + 0.01);
  }
  signBoard(L.x - 6.5, L.z + 2.5, -Math.PI / 2 + 0.4, ['FRACTION FIELD', '½  ⅓  ¼  ⅛'], 3.2, 1.3);
}

// ─── 4 · CARLO'S COUNTING HILL ───────────────────────────────────────────────
const CARLO_SPOT = {};
{
  const L = LM.carlo, y = H(L.x, L.z), g = grp(); g.position.set(L.x + 1.5, y - 0.05, L.z - 1.5);
  // giant toadstool (Carlo naps on one in the AR game)
  mk(lathe([[0.75, 0], [0.62, 0.4], [0.5, 1.4], [0.55, 2.2], [0.7, 2.5], [0.001, 2.55]], 28), new THREE.MeshPhysicalMaterial({ color: 0xF6EBD6, roughness: 0.7, sheen: 0.5, sheenColor: new THREE.Color(0xffffff) }), g);
  const cap = mk(lathe([[0.001, 3.9], [1.2, 3.75], [2.1, 3.3], [2.55, 2.75], [2.45, 2.45], [1.4, 2.35], [0.5, 2.4]], 48, 40), new THREE.MeshPhysicalMaterial({ color: 0xE0362C, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.3 }), g);
  for (let i = 0; i < 16; i++) {
    const a = rand() * TAU, e = rr(0.05, 0.75), sp = mk(new THREE.SphereGeometry(rr(0.16, 0.3), 14, 10), std(0xFFFBF2, 0.6), g);
    const r = 2.45 * Math.sin(e + 0.35), yy = 2.75 + Math.cos(e + 0.35) * 1.15; sp.position.set(Math.cos(a) * r, yy, Math.sin(a) * r); sp.scale.y = 0.45; sp.lookAt(0, 0.5, 0);
  }
  // little mushrooms
  for (let i = 0; i < 9; i++) {
    const a = rand() * TAU, r = rr(3, 5.5), m = grp(); m.position.set(L.x + Math.cos(a) * r, 0, L.z + Math.sin(a) * r); m.position.y = H(m.position.x, m.position.z); m.scale.setScalar(rr(0.18, 0.35));
    mk(g.children[0].geometry, g.children[0].material, m); mk(cap.geometry, cap.material, m);
  }
  // big leaf where Carlo rests
  const leafTex = canvasTex(256, 256, (x) => {
    const gr = x.createLinearGradient(0, 0, 256, 0); gr.addColorStop(0, '#3E9B2E'); gr.addColorStop(0.5, '#6CC64A'); gr.addColorStop(1, '#3E9B2E'); x.fillStyle = gr; x.fillRect(0, 0, 256, 256);
    x.strokeStyle = 'rgba(220,255,190,0.7)'; x.lineWidth = 4; x.beginPath(); x.moveTo(128, 0); x.lineTo(128, 256); x.stroke(); x.lineWidth = 2;
    for (let i = 1; i < 8; i++) { x.beginPath(); x.moveTo(128, i * 32); x.quadraticCurveTo(60, i * 32 - 14, 4, i * 32 - 30); x.moveTo(128, i * 32); x.quadraticCurveTo(196, i * 32 - 14, 252, i * 32 - 30); x.stroke(); }
  });
  const ls = new THREE.Shape(); ls.moveTo(0, -3.4); ls.bezierCurveTo(2.2, -2.2, 2.2, 2.2, 0, 3.6); ls.bezierCurveTo(-2.2, 2.2, -2.2, -2.2, 0, -3.4);
  const lg = new THREE.ShapeGeometry(ls, 24); const lp = lg.attributes.position, luv = lg.attributes.uv;
  for (let i = 0; i < lp.count; i++) { const x = lp.getX(i), yv = lp.getY(i); luv.setXY(i, x / 4.4 + 0.5, yv / 7 + 0.5); lp.setZ(i, Math.pow(x / 2, 2) * 0.35 + Math.sin(yv * 0.6) * 0.06); }
  lg.computeVertexNormals();
  const leaf = mk(lg, new THREE.MeshPhysicalMaterial({ map: leafTex, roughness: 0.45, clearcoat: 0.4, side: THREE.DoubleSide, sheen: 0.4, sheenColor: new THREE.Color(0xccffaa) }), scene);
  leaf.rotation.set(-Math.PI / 2, 0, Math.PI / 2 + 0.15); leaf.position.set(L.x - 1.6, y + 0.32, L.z + 1.2);
  CARLO_SPOT.pos = new THREE.Vector3(L.x - 1.6, y + 0.36, L.z + 1.2); CARLO_SPOT.ry = Math.PI / 2 + 0.15;
  // numbered stepping stones 1–10 spiraling up the hill
  for (let i = 0; i < 10; i++) {
    const a = -2.4 + i * 0.36, r = 7.2 - i * 0.12, x = L.x + Math.cos(a) * r, z = L.z + Math.sin(a) * r, sy = H(x, z);
    const st = mk(lumpy(new THREE.CylinderGeometry(0.62, 0.7, 0.28, 18), 0.08, 2, i), stoneMat, scene); st.position.set(x, sy + 0.08, z);
    const nm = text3D(String(i + 1), 0.42, gloss(RAINBOW[i], 0.3), 0.3); nm.position.set(x, sy + 0.62, z); nm.lookAt(LM.carlo.x, sy + 0.62, LM.carlo.z + 12); scene.add(nm); floater(nm, 0.08, 1.3);
  }
  signBoard(L.x - 6.8, L.z + 3.5, -Math.PI / 2, ['COUNTING HILL', 'Count with Carlo 1 to 10!'], 3.4, 1.3);
}

// ─── 5 · SUBBY'S SUBTRACTION TRAIL ───────────────────────────────────────────
const SUBBY_TRAIL = (() => {
  const L = LM.subby; return new THREE.CatmullRomCurve3([[-7, -2], [-3, 3], [2, 1.5], [5, -3], [8, -1]].map(([dx, dz]) => new THREE.Vector3(L.x + dx, 0, L.z + dz)));
})();
{
  const L = LM.subby, pts = SUBBY_TRAIL.getSpacedPoints(120), pos = [], idx = [];
  pts.forEach((p, i) => {
    const q = pts[Math.min(i + 1, pts.length - 1)], r = pts[Math.max(i - 1, 0)], dx = q.x - r.x, dz = q.z - r.z, l = Math.hypot(dx, dz) || 1, w = 0.45 + Math.sin(i * 0.3) * 0.08;
    const nx = -dz / l * w, nz = dx / l * w;
    pos.push(p.x + nx, H(p.x + nx, p.z + nz) + 0.05, p.z + nz, p.x - nx, H(p.x - nx, p.z - nz) + 0.05, p.z - nz);
    if (i) { const k = i * 2; idx.push(k - 2, k - 1, k, k - 1, k + 1, k); }
  });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  mk(g, new THREE.MeshPhysicalMaterial({ color: 0xD8C8FF, roughness: 0.05, iridescence: 1, iridescenceIOR: 1.5, transparent: true, opacity: 0.7, clearcoat: 1, emissive: 0x6A4BC4, emissiveIntensity: 0.15 }), scene, false);
  // countdown toadstools 10 → 0
  for (let i = 0; i <= 10; i++) {
    const n = 10 - i, p = SUBBY_TRAIL.getPointAt(i / 10), side = i % 2 ? 1.3 : -1.3, x = p.x + side * 0.6, z = p.z + side, y = H(x, z);
    const s = 0.3 + n * 0.05, m = grp(); m.position.set(x, y, z);
    mk(new THREE.CylinderGeometry(0.12 * s * 3, 0.16 * s * 3, 0.9 * s * 2, 12), std(0xF3E9DA, 0.7), m).position.y = 0.9 * s;
    const c = mk(new THREE.SphereGeometry(0.55 * s * 2, 24, 12, 0, TAU, 0, Math.PI / 2), gloss(0x9B6BE8, 0.35), m); c.position.y = 1.7 * s; c.scale.y = 0.65;
    const nm = text3D(String(n), 0.36, gloss(0xFFFFFF, 0.3), 0.3); nm.position.y = 1.7 * s + 0.7 * s + 0.3; m.add(nm); floater(nm, 0.06, 1.4);
    nm.rotation.y = Math.atan2(LM.heart.x - x, LM.heart.z - z);
  }
  signBoard(L.x - 9.5, L.z + 4, -Math.PI / 2 - 0.6, ['SUBTRACTION TRAIL', '10 − 1 = 9 ... count down!'], 3.6, 1.3);
}
