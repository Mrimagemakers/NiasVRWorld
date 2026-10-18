// ═════════════════════════════════════════════════════════════════════════════
//  TEXTURE WORKSHOP — procedural colour + normal (relief) maps
// ═════════════════════════════════════════════════════════════════════════════
const TQ = (isMobile || isHeadset) ? 0.5 : 1;                       // texture resolution scale
// Fast tileable value noise on a lattice (period p)
function tnoise(x, y, p) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const h = (a, b) => { a = ((a % p) + p) % p; b = ((b % p) + p) % p; const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const a = h(ix, iy), b = h(ix + 1, iy), c = h(ix, iy + 1), d = h(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}
function tfbm(x, y, p, o = 4) { let v = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { v += a * tnoise(x * f, y * f, p * f); f *= 2; a *= 0.5; } return v; }
// Build colour + normal textures from a per-pixel function returning [r,g,b,height]
function surface(W, H2, fn, { repeat = [1, 1], strength = 2, srgb = true } = {}) {
  W = Math.max(64, Math.round(W * TQ)); H2 = Math.max(64, Math.round(H2 * TQ));
  const cc = document.createElement('canvas'); cc.width = W; cc.height = H2;
  const ctx = cc.getContext('2d'), img = ctx.createImageData(W, H2), hgt = new Float32Array(W * H2);
  for (let j = 0; j < H2; j++) for (let i = 0; i < W; i++) {
    const r = fn(i / W, j / H2, i, j, W, H2), o = (j * W + i) * 4;
    img.data[o] = r[0]; img.data[o + 1] = r[1]; img.data[o + 2] = r[2]; img.data[o + 3] = 255; hgt[j * W + i] = r[3];
  }
  ctx.putImageData(img, 0, 0);
  const nc = document.createElement('canvas'); nc.width = W; nc.height = H2;
  const nctx = nc.getContext('2d'), nimg = nctx.createImageData(W, H2);
  for (let j = 0; j < H2; j++) for (let i = 0; i < W; i++) {
    const hl = hgt[j * W + (i + W - 1) % W], hr = hgt[j * W + (i + 1) % W], hd = hgt[((j + H2 - 1) % H2) * W + i], hu = hgt[((j + 1) % H2) * W + i];
    let nx = (hl - hr) * strength, ny = (hd - hu) * strength, nz = 1; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
    const o = (j * W + i) * 4; nimg.data[o] = (nx * 0.5 + 0.5) * 255; nimg.data[o + 1] = (ny * 0.5 + 0.5) * 255; nimg.data[o + 2] = (nz * 0.5 + 0.5) * 255; nimg.data[o + 3] = 255;
  }
  nctx.putImageData(nimg, 0, 0);
  const map = new THREE.CanvasTexture(cc), normal = new THREE.CanvasTexture(nc);
  if (srgb) map.colorSpace = THREE.SRGBColorSpace;
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  for (const t of [map, normal]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); t.anisotropy = Math.min(8, maxAniso); }
  return { map, normal };
}
// Jittered-grid Voronoi (fast): returns [d1, d2, cellId]
function voronoi(u, v, n, jitter = 0.85) {
  const x = u * n, y = v * n, ix = Math.floor(x), iy = Math.floor(y);
  let d1 = 9, d2 = 9, id = 0;
  for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
    const cx = ix + a, cy = iy + b, wx = ((cx % n) + n) % n, wy = ((cy % n) + n) % n;
    const px = cx + 0.5 + (hash2(wx, wy) - 0.5) * jitter, py = cy + 0.5 + (hash2(wy + 17, wx + 3) - 0.5) * jitter;
    const d = Math.hypot(px - x, py - y);
    if (d < d1) { d2 = d1; d1 = d; id = wx * 131 + wy; } else if (d < d2) d2 = d;
  }
  return [d1, d2, id];
}
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

const TEX = {};
// Cobblestones: rounded stones, mossy mortar, worn tops
TEX.cobble = surface(512, 512, (u, v) => {
  const [d1, d2, id] = voronoi(u, v, 9, 0.9), edge = d2 - d1, k = Math.min(1, edge / 0.16);
  const tone = 0.78 + hash2(id, 3) * 0.36, warm = hash2(id, 9);
  const stone = [188 * tone + warm * 18, 172 * tone + warm * 8, 142 * tone], n = tfbm(u * 16, v * 16, 16, 3);
  const top = Math.pow(k, 0.45), moss = (1 - k) * tfbm(u * 30, v * 30, 30, 2);
  let c = mix3([82, 74, 58], stone, top); c = mix3(c, [86, 112, 54], Math.max(0, moss - 0.25) * 1.2);
  c = c.map(x => x * (0.88 + n * 0.24));
  return [c[0], c[1], c[2], top * 1.4 + n * 0.25];
}, { strength: 3.2 });
// Pale building stone (pillars, plaza, greenhouse floor)
TEX.stone = surface(512, 512, (u, v) => {
  const n = tfbm(u * 8, v * 8, 8, 5), cr = tfbm(u * 3 + 7, v * 3, 3, 4), crack = Math.max(0, 1 - Math.abs(cr - 0.5) * 40);
  const g = 205 + (n - 0.5) * 70 - crack * 60;
  return [g, g * 0.965, g * 0.9, n * 1.2 - crack * 0.8];
}, { strength: 2.5 });
// Tree bark: deep vertical furrows
TEX.bark = surface(256, 512, (u, v) => {
  const ridge = Math.abs(Math.sin((u * 12 + tfbm(u * 4, v * 2, 4, 3) * 3) * Math.PI));
  const n = tfbm(u * 16, v * 8, 16, 3), h = Math.pow(ridge, 0.6) * 0.8 + n * 0.4;
  const c = mix3([52, 33, 20], [128, 90, 58], h * 0.85);
  return [c[0], c[1], c[2], h];
}, { repeat: [2, 2], strength: 4 });
// Wood planks with grain
TEX.wood = surface(512, 256, (u, v) => {
  const plank = Math.floor(v * 4), pv = v * 4 - plank, seam = pv < 0.04 || pv > 0.96 ? 1 : 0;
  const off = hash2(plank, 5) * 10, grain = Math.sin((u * 6 + off + tfbm(u * 2 + off, pv, 2, 3) * 2.5) * 22) * 0.5 + 0.5;
  const tone = 0.82 + hash2(plank, 2) * 0.3, n = tfbm(u * 40, v * 10, 40, 2);
  let c = mix3([118, 76, 40], [176, 122, 72], grain * 0.6 + n * 0.4).map(x => x * tone);
  if (seam) c = c.map(x => x * 0.45);
  return [c[0], c[1], c[2], (seam ? -1 : 0) + grain * 0.15 + n * 0.15];
}, { strength: 3 });
// Grass ground detail (blades, clover, soil specks)
TEX.grass = surface(512, 512, (u, v, i, j) => {
  const n = tfbm(u * 12, v * 12, 12, 4), b = tfbm(u * 90, v * 30, 90, 2), clover = tfbm(u * 20 + 5, v * 20, 20, 3);
  let g = 160 + (n - 0.5) * 90 + (b - 0.5) * 70;
  const soil = Math.max(0, 0.42 - n) * 2;
  return [g * (1 - soil * 0.2) + soil * 40, g, g * (1 - soil * 0.3) + soil * 20, b * 0.8 + n * 0.5 + (clover > 0.62 ? 0.4 : 0)];
}, { repeat: [70, 70], strength: 2.5 });
// Leaf clusters (for canopies & hedges) — normal only matters
TEX.leaf = surface(256, 256, (u, v) => {
  const [d1, d2] = voronoi(u, v, 14, 1), h = Math.min(1, (d2 - d1) * 6) * (1 - d1 * 1.2);
  const g = 150 + h * 90; return [g, g, g, h];
}, { repeat: [3, 3], strength: 3, srgb: false });
// Roof tiles (terracotta), plaster walls, red brick, thatch
TEX.roof = surface(256, 256, (u, v) => {
  const row = Math.floor(v * 8), ru = u * 6 + (row % 2) * 0.5, tv = v * 8 - row, tile = ru - Math.floor(ru);
  const curve = Math.sin(tile * Math.PI), lip = Math.pow(tv, 3), tone = 0.85 + hash2(Math.floor(ru), row) * 0.25;
  const c = [188 * tone * (0.6 + curve * 0.4), 92 * tone * (0.6 + curve * 0.4), 64 * tone * (0.6 + curve * 0.4)];
  return [c[0] * (1 - lip * 0.35), c[1] * (1 - lip * 0.35), c[2] * (1 - lip * 0.35), curve * 0.6 - lip * 0.8];
}, { strength: 3 });
TEX.plaster = surface(256, 256, (u, v) => { const n = tfbm(u * 10, v * 10, 10, 5); const g = 238 + (n - 0.5) * 28; return [g, g * 0.97, g * 0.9, n]; }, { strength: 1.5 });
TEX.brick = surface(256, 256, (u, v) => {
  const row = Math.floor(v * 8), bu = u * 4 + (row % 2) * 0.5, bx = bu - Math.floor(bu), by = v * 8 - row;
  const mortar = bx < 0.05 || by < 0.08 ? 1 : 0, tone = 0.8 + hash2(Math.floor(bu), row) * 0.3, n = tfbm(u * 30, v * 30, 30, 2);
  const c = mortar ? [205, 196, 180] : [168 * tone, 74 * tone, 52 * tone];
  return [c[0] * (0.9 + n * 0.2), c[1] * (0.9 + n * 0.2), c[2] * (0.9 + n * 0.2), mortar ? -0.6 : n * 0.3];
}, { strength: 3 });
// Denim twill & felt weave (fabric relief for the characters)
TEX.twill = surface(128, 128, (u, v, i, j) => { const t = ((i + j) % 6) / 6, h = Math.sin(t * TAU) * 0.5 + tfbm(u * 32, v * 32, 32, 2) * 0.4; const g = 210 + h * 40; return [g, g, g, h]; }, { repeat: [10, 10], strength: 2, srgb: false });
TEX.felt = surface(128, 128, (u, v) => { const h = tfbm(u * 24, v * 24, 24, 4); const g = 200 + h * 50; return [g, g, g, h]; }, { repeat: [6, 6], strength: 1.8, srgb: false });

// Material helpers built from the workshop
function texMat(t, color = 0xffffff, rough = 0.85, ns = 1, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, map: t.map, normalMap: t.normal, normalScale: new THREE.Vector2(ns, ns), roughness: rough, ...extra });
}
function texClone(t, rx, ry) {
  const m = t.map.clone(), n = t.normal.clone(); m.repeat.set(rx, ry); n.repeat.set(rx, ry); m.needsUpdate = n.needsUpdate = true; return { map: m, normal: n };
}
