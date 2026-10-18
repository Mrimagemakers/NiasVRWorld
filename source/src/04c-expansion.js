// ═════════════════════════════════════════════════════════════════════════════
//  EXPANSION — the outer ring of the garden
// ═════════════════════════════════════════════════════════════════════════════
const COLLIDERS = [];                       // axis-aligned boxes the visitor can't walk through
function addCollider(cx, cz, w, d, ry = 0) {
  if (Math.abs(Math.sin(ry * 2)) > 0.01) { const c = Math.abs(Math.cos(ry)), s = Math.abs(Math.sin(ry)); [w, d] = [w * c + d * s, w * s + d * c]; }
  COLLIDERS.push({ x0: cx - w / 2, x1: cx + w / 2, z0: cz - d / 2, z1: cz + d / 2 });
}
const GAME_STONES = [];                     // interactive game pedestals
function labelSprite(text, { w = 512, h = 128, bg = 'rgba(60,20,110,0.88)', fg = '#FFE27A', scale = 1 } = {}) {
  const t = canvasTex(w, h, (x) => {
    x.fillStyle = bg; const r = h / 2.4; x.beginPath(); x.moveTo(r, 4); x.lineTo(w - r, 4); x.quadraticCurveTo(w - 4, 4, w - 4, r); x.lineTo(w - 4, h - r); x.quadraticCurveTo(w - 4, h - 4, w - r, h - 4); x.lineTo(r, h - 4); x.quadraticCurveTo(4, h - 4, 4, h - r); x.lineTo(4, r); x.quadraticCurveTo(4, 4, r, 4); x.fill();
    x.strokeStyle = '#FFD24A'; x.lineWidth = 6; x.stroke();
    x.fillStyle = fg; x.font = `${h * 0.46}px "Fredoka One", Arial`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, w / 2, h / 2 + 3);
  });
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false })); sp.scale.set(2.4 * scale, 0.6 * scale, 1); return sp;
}
function gameStone(x, z, game, label, y) {
  const g = grp(); const gy = y ?? H(x, z); g.position.set(x, gy, z);
  mk(lathe([[0.75, 0], [0.62, 0.15], [0.45, 0.25], [0.4, 0.85], [0.6, 0.95], [0.62, 1.05], [0.001, 1.06]], 28), stoneMat, g);
  const top = mk(new THREE.CylinderGeometry(0.55, 0.55, 0.06, 32), new THREE.MeshPhysicalMaterial({ color: 0x7B2CBF, roughness: 0.2, clearcoat: 1, emissive: 0x5A189A, emissiveIntensity: 0.4 }), g); top.position.y = 1.08;
  const star = mk(starGeoE(0.32, 0.14, 0.08), new THREE.MeshPhysicalMaterial({ color: 0xFFD86B, emissive: 0xFFC94D, emissiveIntensity: 1.8, roughness: 0.2, clearcoat: 1 }), g, false); star.position.y = 1.75; floater(star, 0.12, 1.6, 1.2);
  const lab = labelSprite('▶ ' + label); lab.position.y = 2.55; g.add(lab);
  const ring = mk(new THREE.TorusGeometry(0.85, 0.035, 8, 48), glow(0xFFD86B, 1.6), g, false); ring.rotation.x = Math.PI / 2; ring.position.y = 0.05;
  g.userData.dynamic = true; GAME_STONES.push({ pos: new THREE.Vector3(x, gy, z), game, label, obj: g, ring });
  return g;
}
function starGeoE(r1, r2, depth) {
  const s = new THREE.Shape(); for (let i = 0; i <= 10; i++) { const a = i / 10 * TAU + Math.PI / 2, r = i % 2 ? r2 : r1; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: depth * 0.5, bevelSize: depth * 0.4, bevelSegments: 2 }); g.center(); return g;
}
// Game stones at the inner landmarks that have no host character
gameStone(LM.greenhouse.x - 2.5, LM.greenhouse.z + 6.2, 'shapes', 'Shape Quiz');
gameStone(LM.pond.x + 7.5, LM.pond.z + 8.5, 'patterns', 'Pattern Puzzle');
gameStone(LM.meadow.x + 7.5, LM.meadow.z + 3.5, 'measure', 'Measure It!');
gameStone(LM.timeflower.x + 5.5, LM.timeflower.z + 1.5, 'time', 'Tell the Time');
gameStone(LM.market.x + 3.5, LM.market.z + 6.5, 'money', 'Count Coins');

// ─── Sunflower prototype (instanced fields) ─────────────────────────────────
const sunflowerProto = (() => {
  const parts = [];
  const stem = new THREE.CylinderGeometry(0.035, 0.05, 2.2, 6); stem.translate(0, 1.1, 0); parts.push(colorize(stem.toNonIndexed(), 0x3E7F25, 0x5FA83A));
  for (const [s, y] of [[-1, 0.8], [1, 1.3]]) { const l = new THREE.SphereGeometry(0.22, 8, 5); l.scale(1.5, 0.15, 0.7); l.rotateZ(s * 0.4); l.translate(s * 0.25, y, 0); parts.push(colorize(l.toNonIndexed(), 0x3E8A2A, 0x6CBB45)); }
  const disc = new THREE.CylinderGeometry(0.22, 0.22, 0.08, 18); disc.rotateX(Math.PI / 2 - 0.3); disc.translate(0, 2.25, 0.05); parts.push(colorize(disc.toNonIndexed(), 0x3A1F08, 0x5A3311));
  for (let k = 0; k < 16; k++) { const a = k / 16 * TAU, p = new THREE.CircleGeometry(0.11, 5); p.scale(0.45, 1, 1); p.translate(0, 0.3, 0); p.rotateZ(a); p.rotateX(-0.3); p.translate(0, 2.25, 0.04); parts.push(colorize(p.toNonIndexed(), 0xF2A900, 0xFFD23F)); }
  return mergeGeometries(parts);
})();
const sunflowerMat = windify(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, side: THREE.DoubleSide }), 0.02);
function plantSunflowers(list) {
  return chunked(list, 30, sub => { const im = new THREE.InstancedMesh(sunflowerProto, sunflowerMat, sub.length); im.castShadow = true; im.receiveShadow = true;
    sub.forEach((f, i) => setInst(im, i, f.x, (f.y ?? H(f.x, f.z)) - 0.05, f.z, f.ry ?? rr(-0.6, 0.6), f.s ?? rr(0.85, 1.2)));
    scene.add(im); return [im]; }, 100);
}

// ─── 7 · THE SUNFLOWER MAZE ──────────────────────────────────────────────────
const MAZE = {};
{
  const L = LM.maze, N = 9, C = 3.3, x0 = L.x - N * C / 2, z0 = L.z - N * C / 2, y = H(L.x, L.z);
  // walls[cell] = {n,s,e,w}; carve with a seeded depth-first search from the centre
  const cells = Array.from({ length: N * N }, () => ({ n: 1, s: 1, e: 1, w: 1, v: 0 })), at = (i, j) => cells[j * N + i];
  const ci = (N - 1) / 2, stack = [[ci, ci]]; at(ci, ci).v = 1;
  while (stack.length) {
    const [i, j] = stack[stack.length - 1], nb = [];
    if (j > 0 && !at(i, j - 1).v) nb.push([i, j - 1, 'n', 's']); if (j < N - 1 && !at(i, j + 1).v) nb.push([i, j + 1, 's', 'n']);
    if (i > 0 && !at(i - 1, j).v) nb.push([i - 1, j, 'w', 'e']); if (i < N - 1 && !at(i + 1, j).v) nb.push([i + 1, j, 'e', 'w']);
    if (!nb.length) { stack.pop(); continue; }
    const [ni, nj, a, b] = nb[Math.floor(rand() * nb.length)]; at(i, j)[a] = 0; at(ni, nj)[b] = 0; at(ni, nj).v = 1; stack.push([ni, nj]);
  }
  at(ci, N - 1).s = 0;                               // entrance on the south side (facing the garden)
  // solution path (entrance → centre) for the even-number trail
  const prev = new Map(), q = [[ci, N - 1]], key = (i, j) => i + ',' + j; prev.set(key(ci, N - 1), null);
  while (q.length) { const [i, j] = q.shift(); if (i === ci && j === ci) break; const opts = [[0, -1, 'n'], [0, 1, 's'], [-1, 0, 'w'], [1, 0, 'e']]; for (const [di, dj, w] of opts) { const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= N || nj >= N || at(i, j)[w] || prev.has(key(ni, nj))) continue; prev.set(key(ni, nj), [i, j]); q.push([ni, nj]); } }
  const route = []; for (let c = [ci, ci]; c; c = prev.get(key(...c))) route.unshift(c);
  const cellPos = (i, j) => new THREE.Vector3(x0 + (i + 0.5) * C, y, z0 + (j + 0.5) * C);
  // hedge walls
  const segs = [];
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const c = at(i, j), cx = x0 + (i + 0.5) * C, cz = z0 + (j + 0.5) * C;
    if (c.n) segs.push([cx, cz - C / 2, 0]); if (c.w) segs.push([cx - C / 2, cz, 1]);
    if (j === N - 1 && c.s) segs.push([cx, cz + C / 2, 0]); if (i === N - 1 && c.e) segs.push([cx + C / 2, cz, 1]);
  }
  const hedgeG = lumpy(new THREE.BoxGeometry(C + 0.7, 2.2, 0.85, 10, 5, 3), 0.06, 2.5, 4); hedgeG.translate(0, 1.1, 0);
  colorize(hedgeG, 0x24672A, 0x5FAE3E);
  const hm = new THREE.InstancedMesh(hedgeG, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, normalMap: TEX.leaf.normal, normalScale: new THREE.Vector2(1.4, 1.4) }), segs.length);
  hm.castShadow = hm.receiveShadow = true;
  segs.forEach(([x, z, rot], k) => { setInst(hm, k, x, H(x, z) - 0.05, z, rot ? Math.PI / 2 : 0, 1, rr(0.95, 1.08), 1); hm.setColorAt(k, _c.setHSL(0.3, 0.5, rr(0.42, 0.55))); addCollider(x, z, rot ? 0.9 : C + 0.7, rot ? C + 0.7 : 0.9); });
  scene.add(hm);
  // blossoms on top of the hedges
  plantFlowers(segs.filter((_, k) => k % 2 === 0).map(([x, z, rot]) => ({ x: x + (rot ? 0 : rr(-1, 1)), z: z + (rot ? rr(-1, 1) : 0), y: H(x, z) + 2.05, s: 1.2, c: [0xFFD23F, 0xFF8FC0, 0xFFFFFF][(rand() * 3) | 0] })));
  // follow-the-even-numbers trail; odd numbers mark the dead ends
  route.forEach(([i, j], k) => { if (k === route.length - 1) return; const p = cellPos(i, j); const n = text3D(String((k + 1) * 2), 0.4, gloss(0x2E9E3E, 0.3), 0.3); n.position.set(p.x, H(p.x, p.z) + 0.55, p.z); n.rotation.y = 0; scene.add(n); floater(n, 0.06, 1.5, 0.6); const st = mk(new THREE.CylinderGeometry(0.4, 0.45, 0.12, 16), stoneMat, scene); st.position.set(p.x, H(p.x, p.z) + 0.05, p.z); });
  const onRoute = new Set(route.map(c => key(...c)));
  let odd = 1;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { if (onRoute.has(key(i, j)) || rand() > 0.3) continue; const p = cellPos(i, j); const n = text3D(String(odd), 0.36, gloss(0xC0392B, 0.3), 0.3); odd += 2; n.position.set(p.x, H(p.x, p.z) + 0.5, p.z); scene.add(n); floater(n, 0.06, 1.3, -0.6); }
  // the golden centre
  const cp = cellPos(ci, ci); MAZE.center = cp;
  gameStone(cp.x + 0.9, cp.z + 0.9, 'evenodd', 'Even or Odd?');
  const big8 = text3D('8', 1.2, GOLD, 0.3); big8.position.set(cp.x - 0.8, H(cp.x, cp.z) + 2.2, cp.z - 0.8); scene.add(big8); floater(big8, 0.2, 1, 0.8);
  // entrance arch & sunflower field around the maze
  const ex = x0 + (ci + 0.5) * C, ez = z0 + N * C + 0.4;
  signBoard(ex - 3.4, ez + 2.4, 0, ['SUNFLOWER MAZE', 'Follow the EVEN numbers!'], 3.8, 1.3);
  const sf = [];
  for (let i = 0; i < (isMobile ? 160 : 360); i++) { const a = rand() * TAU, r = rr(N * C * 0.72, N * C * 0.72 + 10), x = L.x + Math.cos(a) * r, z = L.z + Math.sin(a) * r * 0.95; if (distPath(x, z) < 2.4) continue; sf.push({ x, z, ry: Math.atan2(-SUN_DIR.x, -SUN_DIR.z) + Math.PI + rr(-0.4, 0.4) }); }
  plantSunflowers(sf);
}

// ─── WHISPERWOOD GLADE — Gwenda's forest home ────────────────────────────────
const GLADE = {};
{
  const L = LM.glade, y = H(L.x, L.z);
  const trees = [];
  for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + 0.2, r = rr(11, 15); trees.push({ x: L.x + Math.cos(a) * r, z: L.z + Math.sin(a) * r, s: rr(1.8, 2.4), ry: rand() * TAU, proto: i % 3, tint: [0xC9B8FF, 0xA8F0D8, 0xFFFFFF][i % 3] }); }
  plantTrees(trees);
  // fairy ring of glowing mushrooms
  const capM = [0x66F0FF, 0xFF8FD0, 0xB18CFF].map(c => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 1.2, roughness: 0.3 }));
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * TAU, x = L.x + Math.cos(a) * 5.5, z = L.z + Math.sin(a) * 5.5, m = grp(); m.position.set(x, H(x, z), z); m.scale.setScalar(rr(0.7, 1.2));
    mk(new THREE.CylinderGeometry(0.07, 0.1, 0.4, 10).translate(0, 0.2, 0), std(0xF6EBD6, 0.7), m);
    const cap = mk(new THREE.SphereGeometry(0.22, 16, 10, 0, TAU, 0, Math.PI / 2), capM[i % 3], m, false); cap.position.y = 0.38; cap.scale.y = 0.6;
  }
  // stone circle seats, hollow log, fairy lights
  for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + 0.3, x = L.x + Math.cos(a) * 3, z = L.z + Math.sin(a) * 3; const s = mk(lumpy(new THREE.CylinderGeometry(0.5, 0.6, 0.45, 14), 0.08, 2, i), texMat(TEX.stone, 0x9AA890, 0.9, 1.4), scene); s.position.set(x, H(x, z) + 0.2, z); }
  const log = mk(new THREE.CylinderGeometry(0.7, 0.75, 4.5, 20, 1, true), texMat(TEX.bark, 0xffffff, 0.95, 1.4, { side: THREE.DoubleSide }), scene); log.rotation.z = Math.PI / 2; log.rotation.y = 0.5; log.position.set(L.x + 7, H(L.x + 7, L.z + 6) + 0.55, L.z + 6);
  makeSparkles(isMobile ? 120 : 260, () => new THREE.Vector3(L.x + rr(-12, 12), y + rr(0.4, 6), L.z + rr(-12, 12)), 0.22, 0x9FFFE0);
  const pl = new THREE.PointLight(0x9F7BFF, 5, 18, 1.5); pl.position.set(L.x, y + 3, L.z); scene.add(pl);
  signBoard(L.x + 10, L.z + 4, Math.PI / 2 - 0.3, ['WHISPERWOOD GLADE', 'Gwenda\'s forest home'], 3.6, 1.3);
  GLADE.center = new THREE.Vector3(L.x, y, L.z);
}

// ─── BUSY HILL BLOCK YARD — Addie's hometown ────────────────────────────────
{
  const L = LM.blockyard, y = H(L.x, L.z);
  const hill = mk(lumpy(lathe([[6, 0], [5, 1], [3.2, 2.6], [1.4, 3.6], [0.6, 3.75], [0.001, 3.6]], 40, 30), 0.08, 1.2, 8), texMat(texClone(TEX.stone, 3, 3), 0xB98A56, 0.95, 1.6), scene);
  hill.position.set(L.x + 8, H(L.x + 8, L.z - 6) - 0.2, L.z - 6);
  const hole = mk(new THREE.CircleGeometry(0.55, 20), std(0x1A0F06, 1), scene, false); hole.position.set(L.x + 8, hill.position.y + 3.62, L.z - 6); hole.rotation.x = -Math.PI / 2;
  // number towers 1–10: the height of each tower is its number
  const blockG = new RoundedBox(0.9, 0.9, 0.9, 0.1);
  const count = 55, blocks = new THREE.InstancedMesh(blockG, new THREE.MeshPhysicalMaterial({ roughness: 0.3, clearcoat: 0.8 }), count); blocks.castShadow = blocks.receiveShadow = true;
  let k = 0;
  for (let n = 1; n <= 10; n++) {
    const a = -1.9 + n * 0.29, x = L.x + Math.cos(a) * 7.5, z = L.z + Math.sin(a) * 7.5, gy = H(x, z);
    for (let h = 0; h < n; h++) { setInst(blocks, k, x, gy + 0.45 + h * 0.92, z, a, 1); blocks.setColorAt(k++, _c.setHex(RAINBOW[(n - 1) % 10])); }
    const lbl = text3D(String(n), 0.5, gloss(0xFFFFFF, 0.3), 0.3); lbl.position.set(x, gy + n * 0.92 + 0.6, z); lbl.rotation.y = Math.atan2(L.x - x, L.z - z); scene.add(lbl); floater(lbl, 0.08, 1.4);
    addCollider(x, z, 1, 1);
  }
  scene.add(blocks);
  // toy crane with a swinging block
  const cr = grp(); cr.position.set(L.x - 5, H(L.x - 5, L.z - 4), L.z - 4);
  const YEL = gloss(0xF4C21C, 0.35);
  mk(new THREE.BoxGeometry(0.5, 7, 0.5).translate(0, 3.5, 0), YEL, cr); mk(new THREE.BoxGeometry(6, 0.4, 0.4).translate(1.8, 7, 0), YEL, cr); mk(new RoundedBox(1.4, 1, 1.2, 0.1), gloss(0xE76F51, 0.4), cr).position.set(0, 0.5, 0);
  const hook = grp(cr); hook.position.set(4.3, 7, 0); hook.userData.dynamic = true;
  mk(new THREE.CylinderGeometry(0.02, 0.02, 3.2).translate(0, -1.6, 0), std(0x333333, 0.5, 0.8), hook);
  const hb = mk(new RoundedBox(0.9, 0.9, 0.9, 0.1), gloss(0x3A86FF, 0.3), hook); hb.position.y = -3.6;
  const hn = text3D('+', 0.5, gloss(0xffffff), 0.3); hn.position.set(0, -3.6, 0.5); hook.add(hn);
  ANIM.push((t) => { hook.rotation.z = Math.sin(t * 0.9) * 0.15; hook.rotation.x = Math.cos(t * 0.7) * 0.08; });
  addCollider(L.x - 5, L.z - 4, 1.6, 1.4);
  gameStone(L.x - 1, L.z + 4.5, 'missing', 'Tower Builder');
  signBoard(L.x - 9, L.z + 6, -Math.PI / 2 + 0.6, ['BUSY HILL BLOCK YARD', 'Addie\'s hometown!'], 3.8, 1.3);
}

// ─── 9 · NUMBERLAND VILLAGE ──────────────────────────────────────────────────
{
  const L = LM.village;
  const lane = []; for (let i = 0; i <= 12; i++) lane.push(new THREE.Vector3(L.x - 10 + i * 1.7, 0, L.z - 9 + i * 1.5));
  const roofT = texClone(TEX.roof, 2, 1.2), plasterT = texClone(TEX.plaster, 2, 2), brickT = texClone(TEX.brick, 1, 2);
  const roofM = texMat(roofT, 0xffffff, 0.75, 1.3), brickM = texMat(brickT, 0xffffff, 0.9, 1.4), winM = new THREE.MeshPhysicalMaterial({ color: 0xFFE9B0, emissive: 0xFFC56B, emissiveIntensity: 0.55, roughness: 0.1, clearcoat: 1 });
  const pastel = [0xFFF1D6, 0xFFE0E6, 0xE3F1FF, 0xE8FFE0, 0xFFF8C8, 0xF0E4FF, 0xFFE8D0, 0xE0FFF8];
  const flowers = [];
  function house(x, z, ry, num, ci, big = false, label = null) {
    const g = grp(); g.position.set(x, H(x, z), z); g.rotation.y = ry;
    const W = big ? 6 : 4.2, D = big ? 5 : 4, Hh = big ? 3.4 : 2.8;
    mk(new THREE.BoxGeometry(W, Hh, D).translate(0, Hh / 2, 0), texMat(plasterT, pastel[ci % 8], 0.9, 1), g);
    mk(new THREE.BoxGeometry(W + 0.2, 0.3, D + 0.2).translate(0, 0.15, 0), stoneMat, g);
    for (const s of [-1, 1]) { const r = mk(new THREE.BoxGeometry(W + 0.6, 0.14, D * 0.62), roofM, g); r.position.set(0, Hh + D * 0.25, s * D * 0.27); r.rotation.x = s * 0.72; }
    const tri = new THREE.Shape(); tri.moveTo(-D / 2, 0); tri.lineTo(D / 2, 0); tri.lineTo(0, D * 0.5); tri.closePath();
    for (const s of [-1, 1]) { const gb = mk(new THREE.ShapeGeometry(tri), texMat(plasterT, pastel[ci % 8], 0.9, 1, { side: THREE.DoubleSide }), g); gb.position.set(s * W / 2, Hh, 0); gb.rotation.y = Math.PI / 2; }
    mk(new THREE.BoxGeometry(0.7, 1.5, 0.7).translate(0, 0.75, 0), brickM, g).position.set(W * 0.28, Hh + 0.6, -D * 0.18);
    const door = mk(new RoundedBox(1.0, 1.9, 0.12, 0.08), darkWood, g); door.position.set(0, 1.05, D / 2 + 0.02);
    mk(new THREE.SphereGeometry(0.05, 10, 8), GOLD, g).position.set(0.35, 1.0, D / 2 + 0.1);
    for (const s of [-1, 1]) {
      const w = mk(new THREE.BoxGeometry(0.8, 0.8, 0.08), winM, g, false); w.position.set(s * W * 0.3, 1.7, D / 2 + 0.03);
      const fr = mk(new THREE.BoxGeometry(0.95, 0.95, 0.06), std(0xFFFFFF, 0.5), g); fr.position.set(s * W * 0.3, 1.7, D / 2 + 0.01);
      for (const t of [-1, 1]) { const sh = mk(new THREE.BoxGeometry(0.32, 0.9, 0.05), gloss(RAINBOW[(ci + 3) % 10], 0.5), g); sh.position.set(s * W * 0.3 + t * 0.62, 1.7, D / 2 + 0.04); }
      const box = mk(new THREE.BoxGeometry(0.9, 0.2, 0.25), darkWood, g); box.position.set(s * W * 0.3, 1.2, D / 2 + 0.15);
      g.updateMatrixWorld(); for (let f = 0; f < 4; f++) { const p = new THREE.Vector3(s * W * 0.3 - 0.33 + f * 0.22, 1.28, D / 2 + 0.15).applyMatrix4(g.matrixWorld); flowers.push({ x: p.x, z: p.z, y: p.y, s: 0.5, c: FLOWER_COLS[(ci + f) % 8] }); }
    }
    const plaque = text3D(label ?? String(num), label ? 0.32 : 0.42, gloss(0xFFD23F, 0.3), 0.25); plaque.position.set(0, 2.35, D / 2 + 0.08); g.add(plaque);
    const pb = mk(new RoundedBox(label ? 3.4 : 1.0, 0.6, 0.08, 0.05), gloss(0x2E7D32, 0.4), g); pb.position.set(0, 2.35, D / 2 + 0.03);
    addCollider(x, z, W + 0.4, D + 0.4, ry);
    return g;
  }
  // odd numbers on one side of the lane, even on the other
  const dir = new THREE.Vector3(1.7, 0, 1.5).normalize(), side = new THREE.Vector3(dir.z, 0, -dir.x), lr = Math.atan2(dir.x, dir.z);
  [11, 13, 15, 17].forEach((n, i) => { const c = lane[2 + i * 3]; house(c.x - side.x * 6.5, c.z - side.z * 6.5, lr - Math.PI / 2 + Math.PI, n, i); });
  [12, 14, 16, 18].forEach((n, i) => { const c = lane[2 + i * 3]; house(c.x + side.x * 6.5, c.z + side.z * 6.5, lr - Math.PI / 2, n, i + 4); });
  pathRibbon(lane, 3.2);
  // post office at the end of the lane
  const end = lane[lane.length - 1];
  house(end.x + dir.x * 5, end.z + dir.z * 5, lr + Math.PI, 0, 2, true, 'POST OFFICE');
  gameStone(end.x - side.x * 2.5, end.z - side.z * 2.5, 'placevalue', 'Post Office Mail');
  const mb = grp(); mb.position.set(end.x + side.x * 2.4, H(end.x + side.x * 2.4, end.z + side.z * 2.4), end.z + side.z * 2.4);
  mk(new THREE.BoxGeometry(0.1, 1.1, 0.1).translate(0, 0.55, 0), darkWood, mb); mk(new RoundedBox(0.5, 0.45, 0.8, 0.12), gloss(0x2F6FDE, 0.35), mb).position.y = 1.25;
  // village well
  const wc = lane[6], wg = grp(); wg.position.set(wc.x + side.x * 2.6, H(wc.x + side.x * 2.6, wc.z + side.z * 2.6), wc.z + side.z * 2.6);
  mk(new THREE.CylinderGeometry(1.0, 1.05, 0.9, 24, 1, true).translate(0, 0.45, 0), texMat(brickT, 0xffffff, 0.9, 1.4, { side: THREE.DoubleSide }), wg);
  mk(new THREE.CircleGeometry(0.95, 24).rotateX(-Math.PI / 2).translate(0, 0.3, 0), waterMat, wg, false);
  for (const s of [-1, 1]) mk(new THREE.BoxGeometry(0.12, 2.2, 0.12).translate(s * 0.9, 1.1, 0), darkWood, wg);
  const wr = mk(new THREE.ConeGeometry(1.5, 0.9, 4), roofM, wg); wr.position.y = 2.6; wr.rotation.y = Math.PI / 4;
  addCollider(wg.position.x, wg.position.z, 2.1, 2.1);
  plantFlowers(flowers);
  signBoard(lane[0].x - 3, lane[0].z - 1, lr + Math.PI - 0.3, ['NUMBERLAND VILLAGE', 'Odd ↔ Even street'], 3.6, 1.3);
}

// ─── 18 · REFLECTION LAKE ────────────────────────────────────────────────────
{
  const L = LM.lake;
  // gazebo on the shore
  const gx = LAKE.x + 18, gz = LAKE.z - 10, gg = grp(); gg.position.set(gx, H(gx, gz), gz);
  mk(new THREE.CylinderGeometry(3, 3.1, 0.35, 8).translate(0, 0.18, 0), woodMat, gg);
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; if (i === 2) continue; const c = mk(lathe([[0.14, 0], [0.11, 0.2], [0.1, 2.6], [0.15, 2.8]], 12), std(0xFFFFFF, 0.5), gg); c.position.set(Math.cos(a) * 2.7, 0.35, Math.sin(a) * 2.7); }
  const gr = mk(new THREE.ConeGeometry(3.5, 1.8, 8), texMat(texClone(TEX.roof, 3, 1), 0xB0C8FF, 0.7, 1.3), gg); gr.position.y = 4.05;
  mk(new THREE.SphereGeometry(0.18, 12, 10), GOLD, gg).position.y = 5.05;
  const book = grp(gg); book.position.y = 1.2;
  mk(lathe([[0.4, -0.85], [0.18, -0.7], [0.15, -0.1], [0.35, 0]], 16), stoneMat, book);
  for (const s of [-1, 1]) { const pg = mk(new THREE.BoxGeometry(0.5, 0.04, 0.6), std(0xFFF8E7, 0.8), book); pg.position.set(s * 0.26, 0.1, 0); pg.rotation.z = -s * 0.15; }
  gg.userData.dynamic = true; GAME_STONES.push({ pos: new THREE.Vector3(gx, gg.position.y, gz), game: 'journal', label: 'Garden Journal', obj: gg });
  const jl = labelSprite('📖 Garden Journal'); jl.position.set(0, 2.3, 0); gg.add(jl);
  // dock and rowboat
  const dk = grp(); dk.position.set(LAKE.x + 6, 0, LAKE.z + 8); dk.rotation.y = -0.6;
  for (let i = 0; i < 14; i++) { const p = mk(new THREE.BoxGeometry(2, 0.1, 0.34), woodMat, dk); p.position.set(0, WATER_Y + 0.5, -i * 0.38); }
  const boat = grp(); boat.position.set(LAKE.x + 2, WATER_Y - 0.1, LAKE.z + 3); boat.userData.dynamic = true;
  const hull = mk(lathe([[0.001, -1.4], [0.5, -1.1], [0.75, -0.2], [0.7, 0.9], [0.001, 1.4]], 24, 30, Math.PI / 2, Math.PI), texMat(TEX.wood, 0xC98A54, 0.7, 1.2, { side: THREE.DoubleSide }), boat);
  hull.rotation.set(Math.PI / 2, 0, Math.PI); hull.scale.set(1, 1, 0.55);
  for (const zz of [-0.4, 0.5]) mk(new THREE.BoxGeometry(1.25, 0.06, 0.28), woodMat, boat).position.set(0, 0.25, zz);
  ANIM.push((t) => { boat.position.y = WATER_Y - 0.1 + Math.sin(t * 1.1) * 0.05; boat.rotation.z = Math.sin(t * 0.8) * 0.05; boat.rotation.y = Math.sin(t * 0.1) * 0.4; });
  // lily pads and reeds
  const pads = new THREE.InstancedMesh(new THREE.CircleGeometry(0.7, 20, 0.3, TAU - 0.6).rotateX(-Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: 0x4FA63A, roughness: 0.4, clearcoat: 0.6, side: THREE.DoubleSide }), 40);
  for (let i = 0; i < 40; i++) { const a = rand() * TAU, r = rr(5, LAKE.r - 1); setInst(pads, i, LAKE.x + Math.cos(a) * r * 1.2, WATER_Y - 0.12, LAKE.z + Math.sin(a) * r, rand() * TAU, rr(0.6, 1.2)); }
  scene.add(pads);
  signBoard(LAKE.x + 21.5, LAKE.z - 1, Math.PI / 2, ['REFLECTION LAKE', 'Look back at all you learned!'], 3.6, 1.3);
}

// ─── 17 · MATH DREAMS ISLAND + the Dream Lift ────────────────────────────────
const LIFT = {};
{
  const I = ISLAND, g = grp(); g.position.set(I.x, I.y, I.z);
  const top = new THREE.CircleGeometry(I.r, 72, 0, TAU); top.rotateX(-Math.PI / 2);
  { const p = top.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), r = Math.hypot(x, z) / I.r; p.setY(i, (1 - r * r) * 0.6 + (fbm(x * 0.3, z * 0.3, 2) - 0.5) * 0.3 * (1 - r)); } top.computeVertexNormals(); }
  mk(top, texMat(texClone(TEX.grass, 6, 6), 0x7CC444, 0.95, 0.8), g, false, true);
  const under = lumpy(lathe([[0.001, -9.5], [I.r * 0.25, -8.6], [I.r * 0.55, -6], [I.r * 0.85, -2.6], [I.r * 1.02, -0.4], [I.r * 1.0, 0.05]], 72, 40), 0.06, 0.25, 3);
  mk(under, texMat(texClone(TEX.stone, 5, 3), 0xB8916A, 0.95, 0.9), g);
  for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; mk(taperTube([[Math.cos(a) * I.r * 0.8, -1, Math.sin(a) * I.r * 0.8], [Math.cos(a) * I.r * 0.7, -4, Math.sin(a) * I.r * 0.7], [Math.cos(a) * I.r * 0.55, -7 - rand() * 3, Math.sin(a) * I.r * 0.55]], 0.15, 0.04, 10, 6), barkMat, g); }
  // cloud puffs around the rim
  const cloudM = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 1, emissive: 0xFFF0FA, emissiveIntensity: 0.3 });
  for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, c = mk(new THREE.SphereGeometry(rr(1.4, 2.4), 16, 12), cloudM, g, false, false); c.position.set(Math.cos(a) * (I.r + 0.6), rr(-1.6, -0.4), Math.sin(a) * (I.r + 0.6)); c.scale.y = 0.6; }
  // dream crystals, a little tree, floating symbols
  const crysM = new THREE.MeshPhysicalMaterial({ color: 0xC77DFF, emissive: 0x9D4EDD, emissiveIntensity: 0.8, roughness: 0.05, clearcoat: 1, flatShading: true, iridescence: 1 });
  for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + 0.4, cr = mk(new THREE.OctahedronGeometry(rr(0.4, 0.8), 0), crysM, g); cr.position.set(Math.cos(a) * 7.5, 1.2, Math.sin(a) * 7.5); cr.scale.y = 2; floater(cr, 0.2, 1.2, 0.5); }
  const tr = mk(TREE_PROTOS[1].trunk, barkMat, g); tr.position.set(-4, 0.4, -3); const lf = mk(TREE_PROTOS[1].leaves, new THREE.MeshStandardMaterial({ vertexColors: true, color: 0xFFC2E8, roughness: 0.8, normalMap: TEX.leaf.normal }), g); lf.position.copy(tr.position);
  ['+', '-', '×', '÷', '='].forEach((s, i) => { const m = text3D(s, 0.9, glow(RAINBOW[i * 2], 1.3), 0.3); const a = i / 5 * TAU; m.position.set(Math.cos(a) * 9, 3.5, Math.sin(a) * 9); g.add(m); floater(m, 0.3, 1, 0.7); });
  const pFl = []; for (let i = 0; i < 90; i++) { const a = rand() * TAU, r = rr(2, I.r - 1); pFl.push({ x: I.x + Math.cos(a) * r, z: I.z + Math.sin(a) * r, y: I.y + (1 - (r / I.r) ** 2) * 0.6, s: rr(0.8, 1.2), c: [0xFFB7E8, 0xC77DFF, 0xFFFFFF, 0x9FD8FF][i % 4] }); }
  plantFlowers(pFl);
  gameStone(I.x + 2.5, I.z - 2.5, 'dreams', 'Math Dreams', I.y + 0.5);
  makeSparkles(isMobile ? 150 : 300, () => new THREE.Vector3(I.x + rr(-14, 14), I.y + rr(-3, 6), I.z + rr(-14, 14)), 0.26, 0xFFD6F5);
  // lift pads (ground + island) joined by a shimmering beam
  const pad = (x, y, z) => { const p = grp(); p.position.set(x, y, z); mk(new THREE.CylinderGeometry(1.4, 1.5, 0.15, 40), new THREE.MeshPhysicalMaterial({ color: 0xFFFFFF, roughness: 0.2, clearcoat: 1, emissive: 0xCFA8FF, emissiveIntensity: 0.4 }), p); const r = mk(new THREE.TorusGeometry(1.45, 0.06, 8, 48), glow(0xC77DFF, 2), p, false); r.rotation.x = Math.PI / 2; r.position.y = 0.1; return p; };
  const gx = LM.lift.x, gz = LM.lift.z, gy = H(gx, gz);
  LIFT.ground = new THREE.Vector3(gx, gy, gz); LIFT.top = new THREE.Vector3(I.x, I.y + 0.6, I.z + 0); pad(gx, gy + 0.05, gz); pad(I.x, I.y + 0.62, I.z);
  const beam = mk(new THREE.CylinderGeometry(1.1, 1.3, I.y - gy, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0xE0C8FF, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), scene, false, false);
  beam.position.set(gx, gy + (I.y - gy) / 2, gz);
  ANIM.push((t) => { beam.material.opacity = 0.08 + Math.sin(t * 2) * 0.04; });
  const lb = labelSprite('☁️ Dream Lift', { scale: 1 }); lb.position.set(gx, gy + 2.6, gz); scene.add(lb);
}

// ─── THE GOLDEN 8 HUNT — 24 hidden 8s all over the garden ───────────────────
const EIGHTS = [];
{
  const spots = [
    [6, 52], [-8, 28], [12, 20], [40, 2], [48, -16], [34, -36], [12, -52], [-24, -54], [-50, -26], [-52, 2], [-36, 18], [-20, 40],
    [32, 42], [0, -96], [-6, -112], [-100, -26], [-94, -44], [104, -24], [92, -40], [64, 72], [78, 60], [-60, 60], [-74, 78],
  ];
  const mat = new THREE.MeshPhysicalMaterial({ color: 0xFFD86B, emissive: 0xFFB020, emissiveIntensity: 1.1, metalness: 0.7, roughness: 0.2, clearcoat: 1 });
  const geo = text3D('8', 0.55, mat, 0.35).geometry;
  spots.forEach(([x, z], i) => { const m = mk(geo, mat, scene, false); m.position.set(x, groundAtE(x, z) + 1.1, z); floater(m, 0.15, 2, 1.8); EIGHTS.push({ mesh: m, i }); });
  const m = mk(geo, mat, scene, false); m.position.set(ISLAND.x - 6, ISLAND.y + 1.8, ISLAND.z + 4); floater(m, 0.15, 2, 1.8); EIGHTS.push({ mesh: m, i: spots.length, island: true });
}
function groundAtE(x, z) { return Math.max(H(x, z), WATER_Y + 0.2); }
