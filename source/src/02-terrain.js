// ═════════════════════════════════════════════════════════════════════════════
//  WORLD LAYOUT — follows Nia's journey through the book, chapter by chapter
//  (north is −Z; the Magic Gate is the southern entrance)
// ═════════════════════════════════════════════════════════════════════════════
const LM = {
  gate:       { x: 0,   z: 46,  r: 9,  n: '🌟 The Magic Gate',            ch: 1,  icon: '🌟' },
  plaza:      { x: 0,   z: 32,  r: 9,  n: '⛲ Welcome Plaza',              ch: 2,  icon: '⛲' },
  market:     { x: -25, z: 35,  r: 10, n: '🪙 The Market of Money',        ch: 13, icon: '🪙' },
  oak:        { x: 27,  z: 36,  r: 10, n: '🐿️ Skippy\'s Leaping Oak',     ch: 14, icon: '🌳' },
  bridge:     { x: 0,   z: 18,  r: 8,  n: '➕ The Addition Bridge',        ch: 3,  icon: '➕' },
  fraction:   { x: 35,  z: 7,   r: 10, n: '🍕 The Fraction Field',         ch: 3,  icon: '🍕' },
  carlo:      { x: 43,  z: -13, r: 9,  n: '🐛 Carlo\'s Counting Hill',     ch: 4,  icon: '🍄' },
  subby:      { x: 29,  z: -33, r: 10, n: '🐌 Subby\'s Subtraction Trail', ch: 5,  icon: '🐌' },
  greenhouse: { x: 6,   z: -49, r: 10, n: '🔷 The Shape Greenhouse',       ch: 6,  icon: '🔷' },
  orchard:    { x: -19, z: -48, r: 11, n: '🦋 Milly\'s Multiplication Trees', ch: 8, icon: '✖️' },
  pond:       { x: -43, z: -23, r: 11, n: '🪷 The Pattern Pond',           ch: 10, icon: '🪷' },
  meadow:     { x: -47, z: -2,  r: 10, n: '📏 The Measurement Meadow',     ch: 11, icon: '📏' },
  timeflower: { x: -32, z: 12,  r: 8,  n: '🕐 The Time Flower',            ch: 12, icon: '🕐' },
  heart:      { x: 0,   z: -12, r: 10, n: '❤️ The Heart of the Garden',    ch: 15, icon: '❤️' },
  lift:       { x: -21, z: -15, r: 4,  n: '☁️ The Dream Lift',             ch: 17, icon: '☁️' },
  // ── the outer ring (expansion) ──
  maze:       { x: 0,   z: -106, r: 17, n: '🌻 The Sunflower Maze',        ch: 7,  icon: '🌻' },
  glade:      { x: -100, z: -34, r: 14, n: '🍄 Whisperwood Glade',          ch: null, icon: '🍄' },
  blockyard:  { x: 100, z: -32, r: 14, n: '🧱 Busy Hill Block Yard',       ch: null, icon: '🧱' },
  village:    { x: 70,  z: 68,  r: 17, n: '🏡 Numberland Village',          ch: 9,  icon: '🏡' },
  lake:       { x: -68, z: 68,  r: 17, n: '🪞 Reflection Lake',             ch: 18, icon: '🪞' },
  library:    { x: -25, z: 60,  r: 15, n: '📚 Story Library & Bookshop',   ch: null, icon: '📚' },
};
const ISLAND = { x: -21, z: -15, y: 30, r: 11 };

const V2 = (x, z) => new THREE.Vector2(x, z);
// Main avenue: gate → plaza → bridge → loop junction
const PATH_MAIN = [[0, 60], [0, 46], [0, 32], [0, 18], [0, 10]];
// The garden loop, passing every chapter landmark in story order
const PATH_LOOP = [[0, 10], [14, 10], [26, 2], [32, -12], [26, -24], [16, -34], [4, -40], [-10, -40], [-24, -34], [-33, -22], [-36, -8], [-30, 4], [-18, 11], [-7, 11]];
const PATH_SPURS = [
  [[0, 32], [-12, 33], [-25, 35]],          // plaza → market
  [[0, 32], [13, 33], [26, 36]],            // plaza → oak
  [[0, 10], [0, 2], [0, -5]],               // junction → heart
  [[26, 2], [31, 5], [35, 7]],              // → fraction field
  [[32, -12], [38, -13]],                   // → carlo
  [[-36, -8], [-44, -4]],                   // → meadow
  [[-33, -22], [-37, -23]],                 // → pond edge
  [[-33, -22], [-25, -18], [-21, -15]],     // → dream lift
  // spokes out to the expansion ring
  [[4, -40], [2, -64], [0, -88]],
  [[-24, -34], [-50, -50], [-72, -58]],
  [[30, -22], [56, -28], [84, -34]],
  [[26, 36], [46, 50], [60, 60]],
  [[-25, 35], [-42, 48], [-54, 58]],
  // little spurs into the new zones
  [[0, -88], [0, -92]], [[-84, -34], [-92, -34]], [[84, -34], [92, -32]],
  [[0, 60], [-8, 60.5], [-14.5, 60]],      // avenue → library door
];
const PATH_OUTER = [[-80, 12], [-86, -10], [-84, -34], [-72, -58], [-50, -76], [-22, -86], [0, -88], [22, -86], [50, -76], [72, -58], [84, -34], [86, -10], [80, 12]];
const STREAM = [[-110, 30], [-80, 27], [-55, 25], [-32, 23], [-14, 19.5], [0, 18], [16, 19], [38, 22], [60, 20], [85, 24], [115, 22]];
const POND = { x: -45, z: -24, r: 8.5 };
const WATER_Y = -0.42;

function sampleCurve(pts, closed, step = 0.5) {
  const c = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], 0, p[1])), closed, 'centripetal');
  const n = Math.max(8, Math.ceil(c.getLength() / step));
  return { curve: c, pts: c.getSpacedPoints(n) };
}
const mainC = sampleCurve(PATH_MAIN, false);
const loopC = sampleCurve(PATH_LOOP, true);
const spurC = PATH_SPURS.map(s => sampleCurve(s, false));
const outerC = sampleCurve(PATH_OUTER, false);
const streamC = sampleCurve(STREAM, false, 1);

// Distance fields on a grid (fast lookups for terrain, grass, flowers)
const GRID = { min: -130, max: 130, res: 1.3 };
const GN = (GRID.max - GRID.min) / GRID.res + 1;
const distPathG = new Float32Array(GN * GN), distStreamG = new Float32Array(GN * GN);
{
  const pathPts = [...mainC.pts, ...loopC.pts, ...outerC.pts, ...spurC.flatMap(s => s.pts)].filter((p, i) => i % 2 === 0);
  const strPts = streamC.pts;
  // bucket points into 6 m cells so each grid sample only checks its neighbourhood (distances capped at 18 m)
  const B = 6, bucket = (pts) => { const m = new Map(); for (const p of pts) { const k = Math.floor(p.x / B) + ',' + Math.floor(p.z / B); (m.get(k) || m.set(k, []).get(k)).push(p); } return m; };
  const pb = bucket(pathPts), sb = bucket(strPts);
  const near = (m, x, z) => { let best = 18 * 18; const bx = Math.floor(x / B), bz = Math.floor(z / B); for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) { const l = m.get((bx + i) + ',' + (bz + j)); if (!l) continue; for (const p of l) { const dx = p.x - x, dz = p.z - z, d = dx * dx + dz * dz; if (d < best) best = d; } } return Math.sqrt(best); };
  for (let gz = 0; gz < GN; gz++) for (let gx = 0; gx < GN; gx++) {
    const x = GRID.min + gx * GRID.res, z = GRID.min + gz * GRID.res;
    distPathG[gz * GN + gx] = near(pb, x, z); distStreamG[gz * GN + gx] = near(sb, x, z);
  }
}
function gridLookup(G, x, z) {
  const fx = (x - GRID.min) / GRID.res, fz = (z - GRID.min) / GRID.res;
  if (fx < 0 || fz < 0 || fx >= GN - 1 || fz >= GN - 1) return 99;
  const ix = fx | 0, iz = fz | 0, tx = fx - ix, tz = fz - iz;
  const a = G[iz * GN + ix], b = G[iz * GN + ix + 1], c = G[(iz + 1) * GN + ix], d = G[(iz + 1) * GN + ix + 1];
  return (a * (1 - tx) + b * tx) * (1 - tz) + (c * (1 - tx) + d * tx) * tz;
}
const distPath = (x, z) => gridLookup(distPathG, x, z);
const distStream = (x, z) => gridLookup(distStreamG, x, z);
const distPond = (x, z) => Math.hypot(x - POND.x, z - POND.z) - POND.r;
const LAKE = { x: -68, z: 70, r: 13 };
const distLake = (x, z) => Math.hypot((x - LAKE.x) * 0.8, z - LAKE.z) - LAKE.r;

function baseH(x, z) {
  const r = Math.hypot(x, z * 0.92);
  let h = (fbm(x * 0.035 + 3, z * 0.035 - 7) - 0.5) * 2.0;
  h += smooth(112, 160, r) * (8 + fbm(x * 0.02 + 5, z * 0.02) * 22);
  h += smooth(70, 110, r) * (fbm(x * 0.05 + 9, z * 0.05 - 3) - 0.4) * 3;
  h += 2.6 * Math.exp(-((x - LM.heart.x) ** 2 + (z - LM.heart.z) ** 2) / 70);
  h += 1.8 * Math.exp(-((x - LM.carlo.x) ** 2 + (z - LM.carlo.z) ** 2) / 45);
  h += 1.2 * Math.exp(-((x - LM.oak.x) ** 2 + (z - LM.oak.z) ** 2) / 60);
  // flatten around building sites
  for (const k of ['plaza', 'gate', 'greenhouse', 'market', 'maze', 'village', 'blockyard', 'glade', 'lift', 'library']) {
    const L = LM[k], d = Math.hypot(x - L.x, z - L.z); h *= smooth(4, 12, d) * 0.85 + 0.15;
  }
  return h;
}
function H(x, z) {
  let h = baseH(x, z);
  const ds = distStream(x, z); h = h + (-1.35 - h) * (1 - smooth(2.2, 6.5, ds));
  const dp = distPond(x, z); h = h + (-1.5 - h) * (1 - smooth(-1, 3.5, dp));
  const dl = distLake(x, z); h = h + (-1.9 - h) * (1 - smooth(-1, 4.5, dl));
  return h;
}
const isWet = (x, z) => distStream(x, z) < 4.2 || distPond(x, z) < 1.5 || distLake(x, z) < 1.5;

// ─── Terrain mesh ────────────────────────────────────────────────────────────
const grassDetail = TEX.grass.map;
{
  const S = 320, N = isMobile ? 180 : 260;
  const g = new THREE.PlaneGeometry(S, S, N, N); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
  const cA = new THREE.Color(0x5DA632), cB = new THREE.Color(0x7FC341), cC = new THREE.Color(0x3F8526), sand = new THREE.Color(0xC9B27C), mud = new THREE.Color(0x6F6A45), worn = new THREE.Color(0xA7A55E);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), y = H(x, z); p.setY(i, y);
    const n = fbm(x * 0.05, z * 0.05, 3);
    c.copy(cA).lerp(cB, smooth(0.35, 0.7, n)).lerp(cC, smooth(0.55, 0.85, fbm(x * 0.11 + 9, z * 0.11, 2)) * 0.6);
    const ds = Math.min(distStream(x, z), distPond(x, z) + 4.5, distLake(x, z) + 4.5);
    c.lerp(sand, 1 - smooth(3.6, 6.2, ds)); c.lerp(mud, 1 - smooth(1.5, 3.4, ds));
    c.lerp(worn, (1 - smooth(1.6, 3.4, distPath(x, z))) * 0.55);
    c.multiplyScalar(0.92 + smooth(-1, 4, y) * 0.1);
    col.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  const ground = mk(g, new THREE.MeshStandardMaterial({ vertexColors: true, map: TEX.grass.map, normalMap: TEX.grass.normal, normalScale: new THREE.Vector2(0.8, 0.8), roughness: 0.95 }), scene, false, true);
  ground.name = 'ground';
}

// ─── Cobblestone paths ───────────────────────────────────────────────────────
const cobbleTex = TEX.cobble.map;
const cobbleMat = new THREE.MeshStandardMaterial({ map: TEX.cobble.map, normalMap: TEX.cobble.normal, normalScale: new THREE.Vector2(1.2, 1.2), roughness: 0.82, polygonOffset: true, polygonOffsetFactor: -2 });
function pathRibbon(pts, width, closed = false) {
  const pos = [], uv = [], idx = []; let len = 0;
  const n = pts.length, dir = new THREE.Vector3(), side = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    dir.subVectors(b, a).setY(0).normalize(); side.set(-dir.z, 0, dir.x);
    if (i > 0) len += pts[i].distanceTo(pts[i - 1]);
    for (let s = 0; s <= 4; s++) {
      const t = s / 4 - 0.5, x = pts[i].x + side.x * width * t, z = pts[i].z + side.z * width * t;
      pos.push(x, Math.max(H(x, z), WATER_Y + 0.3) + 0.06, z); uv.push(t + 0.5, len / width);
    }
  }
  for (let i = 0; i < n - 1; i++) {
    if (distStream(pts[i].x, pts[i].z) < 5.5 || distStream(pts[i + 1].x, pts[i + 1].z) < 5.5) continue; // bridge spans the water
    for (let s = 0; s < 4; s++) { const a = i * 5 + s, b = a + 5; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return mk(g, cobbleMat, scene, false, true);
}
pathRibbon(mainC.pts, 3.6); pathRibbon(loopC.pts, 3.0, true); pathRibbon(outerC.pts, 2.8); spurC.forEach(s => pathRibbon(s.pts, 2.4));

// ─── Water (stream + pond) ───────────────────────────────────────────────────
const waterNormal = (() => {
  const W = 256, c = document.createElement('canvas'); c.width = c.height = W; const x = c.getContext('2d');
  const hgt = new Float32Array(W * W);
  for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) {
    const u = i / W * TAU, v = j / W * TAU;
    hgt[j * W + i] = Math.sin(u * 3 + Math.sin(v * 2) * 1.5) * 0.5 + Math.sin(v * 5 + u * 2) * 0.3 + Math.sin((u + v) * 7) * 0.15 + Math.sin(u * 11 - v * 4) * 0.08;
  }
  const img = x.createImageData(W, W);
  for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) {
    const hL = hgt[j * W + (i + W - 1) % W], hR = hgt[j * W + (i + 1) % W], hD = hgt[((j + W - 1) % W) * W + i], hU = hgt[((j + 1) % W) * W + i];
    const nx = (hL - hR) * 2, ny = (hD - hU) * 2, nz = 1, l = Math.hypot(nx, ny, nz);
    img.data.set([(nx / l * 0.5 + 0.5) * 255, (ny / l * 0.5 + 0.5) * 255, (nz / l * 0.5 + 0.5) * 255, 255], (j * W + i) * 4);
  }
  x.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 6); return t;
})();
const waterMat = new THREE.MeshPhysicalMaterial({
  color: 0x2B9BB0, roughness: 0.14, metalness: 0.0, transparent: true, opacity: 0.82,
  normalMap: waterNormal, normalScale: new THREE.Vector2(0.35, 0.35), clearcoat: 0.5, clearcoatRoughness: 0.12,
  envMapIntensity: 1.6
});
{
  // stream ribbon
  const pts = streamC.pts, pos = [], uv = [], idx = [], dir = new THREE.Vector3();
  let len = 0;
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    dir.subVectors(b, a).normalize(); if (i) len += p.distanceTo(pts[i - 1]);
    pos.push(p.x - dir.z * 5.2, WATER_Y, p.z + dir.x * 5.2, p.x + dir.z * 5.2, WATER_Y, p.z - dir.x * 5.2);
    uv.push(0, len / 10, 1, len / 10);
    if (i) { const k = i * 2; idx.push(k - 2, k, k - 1, k - 1, k, k + 1); }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  mk(g, waterMat, scene, false, true).renderOrder = 1;
  const pond = mk(new THREE.CircleGeometry(POND.r + 1.2, 48), waterMat, scene, false, true);
  pond.rotation.x = -Math.PI / 2; pond.position.set(POND.x, WATER_Y, POND.z); pond.renderOrder = 1;
  const lake = mk(new THREE.CircleGeometry(LAKE.r + 1.6, 64), waterMat, scene, false, true);
  lake.rotation.x = -Math.PI / 2; lake.scale.x = 1.25; lake.position.set(LAKE.x, WATER_Y - 0.15, LAKE.z); lake.renderOrder = 1;
}
