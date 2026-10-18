// ═════════════════════════════════════════════════════════════════════════════
//  WORLD MAP — tap any place (or friend) to travel there instantly
// ═════════════════════════════════════════════════════════════════════════════
const WMAP = { open: false, R: 128, hover: null, spots: [] };
const wmCanvas = document.getElementById('wm-canvas');
const wmBase = document.createElement('canvas');

// Where to arrive for each landmark: a dry, walkable spot on a path just outside it, facing it
function arrivalFor(L) {
  let best = null, bs = 1e9;
  for (let ring = 0; ring < 4; ring++) for (let k = 0; k < 24; k++) {
    const a = k / 24 * TAU, r = L.r * 0.55 + ring * 2.2, x = L.x + Math.cos(a) * r, z = L.z + Math.sin(a) * r;
    if (isWet(x, z) || distPond(x, z) < 1.5 || Math.hypot(x, z) > 118) continue;
    const [rx, rz] = resolveXZ(x, z); if (Math.hypot(rx - x, rz - z) > 0.05) continue;     // inside a wall / hedge
    const score = distPath(x, z) * 2 + ring;
    if (score < bs) { bs = score; best = { x, z }; }
  }
  if (!best) best = { x: L.x + L.r * 0.7, z: L.z + L.r * 0.7 };
  return { x: best.x, z: best.z, ry: Math.atan2(L.x - best.x, L.z - best.z) };
}
const DESTS = (() => {
  const out = [];
  for (const k in LM) { if (k === 'lift') continue; const L = LM[k]; out.push({ kind: 'place', key: k, name: L.n.replace(/^\S+\s/, ''), icon: L.icon, ch: L.ch, x: L.x, z: L.z, L }); }
  out.push({ kind: 'place', key: 'island', name: 'Math Dreams Island', icon: '☁️', ch: 17, x: ISLAND.x, z: ISLAND.z, island: true });
  out.sort((a, b) => (a.ch ?? 99) - (b.ch ?? 99));
  return out;
})();
// Special arrivals
const ARRIVE = {
  library: () => ({ x: LIBRARY.bounds.X1 - 3, z: (LIBRARY.bounds.Z0 + LIBRARY.bounds.Z1) / 2, ry: -Math.PI / 2 }),
  maze: () => ({ x: LM.maze.x, z: LM.maze.z + 19, ry: Math.PI }),
  gate: () => ({ x: 0, z: 58, ry: Math.PI }),
};

// ─── Travel (with a little sparkle "poof") ───────────────────────────────────
function travelTo(d) {
  if (GAME.open) closeGame(); closeWorldMap(); releaseKeys(); SFX.unlock(); SFX.sparkle();
  const warp = document.getElementById('warp'); warp.style.transition = 'none'; warp.style.opacity = 1;
  requestAnimationFrame(() => { warp.style.transition = 'opacity 0.7s ease'; warp.style.opacity = 0; });
  if (d.island) {
    onIsland = true; LIFTS.t = -1; const x = ISLAND.x + 3, z = ISLAND.z + 4;
    controls.target.set(x, islandTop(x, z) + EYE, z); camera.position.set(x + 2.5, islandTop(x, z) + EYE + 2, z + 5); controls.update();
    detectLoc(); showToast('☁️ Welcome to Math Dreams Island!'); return;
  }
  onIsland = false; LIFTS.t = -1; let a;
  if (d.kind === 'friend') { const p = d.c.getWorldPosition(new THREE.Vector3()), q = d.c.getWorldQuaternion(new THREE.Quaternion()), fw = new THREE.Vector3(0, 0, 1).applyQuaternion(q); fw.y = 0; fw.normalize(); let x = p.x + fw.x * 3.2, z = p.z + fw.z * 3.2; if (isWet(x, z) || Math.hypot(x, z) > 118) { x = p.x + 3; z = p.z; } a = { x, z, ry: Math.atan2(p.x - x, p.z - z) }; }
  else if (d.kind === 'spot') a = { x: d.x, z: d.z, ry: d.ry };
  else a = (ARRIVE[d.key] || (() => arrivalFor(d.L)))();
  const [x, z] = resolveXZ(a.x, a.z);
  teleportTo(x, z, a.ry);
  burst(new THREE.Vector3(x, groundAt(x, z) + 1, z), 0xFFE27A, 40);
  showToast(`✨ ${d.kind === 'friend' ? 'Hello, ' + d.name.split(' ')[0] + '!' : d.kind === 'spot' ? 'Here you are!' : d.icon + ' ' + d.name}`);
}

// ─── Drawing ─────────────────────────────────────────────────────────────────
const _wmv = new THREE.Vector3();
function wmSize() { return wmCanvas.width; }
const wmTo = (x, z, S = wmSize()) => [(x + WMAP.R) / (2 * WMAP.R) * S, (z + WMAP.R) / (2 * WMAP.R) * S];
const wmFrom = (px, py, S = wmSize()) => [px / S * 2 * WMAP.R - WMAP.R, py / S * 2 * WMAP.R - WMAP.R];
function drawWorldBase() {
  const S = wmSize(); wmBase.width = wmBase.height = S; const b = wmBase.getContext('2d');
  // parchment edge + garden
  b.fillStyle = '#1B3A16'; b.fillRect(0, 0, S, S);
  const g = b.createRadialGradient(S / 2, S / 2, S * 0.1, S / 2, S / 2, S * 0.5); g.addColorStop(0, '#79BE48'); g.addColorStop(0.75, '#5DA235'); g.addColorStop(0.9, '#3A7A28'); g.addColorStop(1, '#244F1C');
  b.fillStyle = g; b.beginPath(); b.arc(S / 2, S / 2, S * 0.47, 0, TAU); b.fill();
  // forest ring dots
  b.fillStyle = 'rgba(30,80,30,0.85)'; for (let i = 0; i < 260; i++) { const a = hash2(i, 1) * TAU, r = S * (0.44 + hash2(i, 2) * 0.06); b.beginPath(); b.arc(S / 2 + Math.cos(a) * r, S / 2 + Math.sin(a) * r, S * (0.008 + hash2(i, 3) * 0.008), 0, TAU); b.fill(); }
  const k = S / (2 * WMAP.R);
  const line = (pts, w, col) => { b.strokeStyle = col; b.lineWidth = w; b.lineJoin = b.lineCap = 'round'; b.beginPath(); pts.forEach((p, i) => { const [x, y] = wmTo(p.x, p.z, S); i ? b.lineTo(x, y) : b.moveTo(x, y); }); b.stroke(); };
  // water
  line(streamC.pts, 10.4 * k, '#4FB8D8'); line(streamC.pts, 6 * k, '#7FD6EC');
  b.fillStyle = '#5CC2DE'; { const [x, y] = wmTo(POND.x, POND.z, S); b.beginPath(); b.arc(x, y, POND.r * k, 0, TAU); b.fill(); const [lx, ly] = wmTo(LAKE.x, LAKE.z, S); b.beginPath(); b.ellipse(lx, ly, LAKE.r * 1.25 * k, LAKE.r * k, 0, 0, TAU); b.fill(); }
  // paths
  [mainC, loopC, outerC, ...spurC].forEach(c => { line(c.pts, 3.4 * k, '#C9B27C'); line(c.pts, 2.2 * k, '#EFE0B4'); });
  // buildings & zones
  { const B = LIBRARY.bounds, [ax, ay] = wmTo(B.X0, B.Z0, S), [bx, by] = wmTo(B.X1, B.Z1, S); b.fillStyle = '#7B2CBF'; b.fillRect(ax, ay, bx - ax, by - ay); b.strokeStyle = '#FFD24A'; b.lineWidth = 2; b.strokeRect(ax, ay, bx - ax, by - ay); }
  { const [mx, my] = wmTo(LM.maze.x - 15, LM.maze.z - 15, S); b.strokeStyle = '#1E5A22'; b.lineWidth = 3; b.strokeRect(mx, my, 30 * k, 30 * k); b.fillStyle = 'rgba(255,210,63,0.35)'; b.fillRect(mx - 10 * k, my - 10 * k, 50 * k, 50 * k); b.strokeRect(mx, my, 30 * k, 30 * k); }
  { const [ix, iy] = wmTo(ISLAND.x, ISLAND.z, S); b.setLineDash([6, 5]); b.strokeStyle = 'rgba(255,255,255,0.9)'; b.lineWidth = 2; b.beginPath(); b.arc(ix, iy, ISLAND.r * k, 0, TAU); b.stroke(); b.setLineDash([]); }
  // compass
  b.fillStyle = 'rgba(255,255,255,0.85)'; b.font = `bold ${Math.round(S * 0.022)}px Arial`; b.textAlign = 'center'; b.fillText('N ▲', S / 2, S * 0.035);
}
function drawWorldMap() {
  const S = wmSize(), x = wmCanvas.getContext('2d'); x.drawImage(wmBase, 0, 0);
  const fs = Math.max(11, Math.round(S * 0.018)), iconR = Math.max(12, S * 0.022);
  WMAP.spots = [];
  // characters (friends)
  for (const c of CHARS) { const cp = c.getWorldPosition(_wmv), [px, py] = wmTo(cp.x, cp.z, S); x.fillStyle = '#FFE27A'; x.strokeStyle = '#5A189A'; x.lineWidth = 2; x.beginPath(); x.arc(px, py, iconR * 0.42, 0, TAU); x.fill(); x.stroke(); WMAP.spots.push({ px, py, r: iconR * 0.7, d: { kind: 'friend', c, name: c.userData.name, icon: '🙂' } }); }
  // places — icons first, then labels placed greedily so they never overlap
  const placed = [], labels = [];
  for (const d of DESTS) {
    const [px, py] = wmTo(d.x, d.z, S), hot = WMAP.hover && WMAP.hover.d === d;
    x.fillStyle = hot ? '#FFD24A' : 'rgba(255,255,255,0.95)'; x.strokeStyle = '#5A189A'; x.lineWidth = hot ? 4 : 2.5;
    x.beginPath(); x.arc(px, py, iconR * (hot ? 1.25 : 1), 0, TAU); x.fill(); x.stroke();
    x.font = `${Math.round(iconR * 1.15)}px serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(d.icon, px, py + 1);
    placed.push([px - iconR, py - iconR, px + iconR, py + iconR]); labels.push({ d, px, py, hot });
    WMAP.spots.push({ px, py, r: iconR * 1.3, d });
  }
  x.font = `800 ${fs}px Nunito, Arial`; x.textBaseline = 'middle';
  const hit = (r) => r[0] < 2 || r[1] < 2 || r[2] > S - 2 || r[3] > S - 2 || placed.some(q => r[0] < q[2] && r[2] > q[0] && r[1] < q[3] && r[3] > q[1]);
  labels.sort((a, b) => b.hot - a.hot);
  for (const L of labels) {
    const label = L.d.name.replace(/^The /, ''), w = x.measureText(label).width + 12, h = fs + 7;
    const opts = [[L.px - w / 2, L.py + iconR + 3], [L.px - w / 2, L.py - iconR - 3 - h], [L.px + iconR + 4, L.py - h / 2], [L.px - iconR - 4 - w, L.py - h / 2], [L.px - w / 2, L.py + iconR + 6 + h]];
    let pos = opts.find(o => !hit([o[0], o[1], o[0] + w, o[1] + h]));
    if (!pos) { if (!L.hot) continue; pos = opts[0]; }
    placed.push([pos[0], pos[1], pos[0] + w, pos[1] + h]);
    x.fillStyle = L.hot ? 'rgba(90,24,154,0.95)' : 'rgba(25,10,50,0.72)'; x.beginPath(); x.roundRect(pos[0], pos[1], w, h, 8); x.fill();
    x.fillStyle = '#FFF6D8'; x.textAlign = 'center'; x.fillText(label, pos[0] + w / 2, pos[1] + h / 2 + 1);
  }
  // other explorers
  for (const a of SOCIAL.avatars.values()) { const [px, py] = wmTo(a.g.position.x, a.g.position.z, S); x.fillStyle = '#5CE1E6'; x.strokeStyle = '#fff'; x.lineWidth = 2; x.beginPath(); x.arc(px, py, iconR * 0.4, 0, TAU); x.fill(); x.stroke(); }
  // me
  const me = onIsland ? { x: controls.target.x, z: controls.target.z } : controls.target, [mx, my] = wmTo(me.x, me.z, S);
  camera.getWorldDirection(_f); const ang = Math.atan2(_f.x, -_f.z), s = iconR * 0.9;
  x.save(); x.translate(mx, my); x.rotate(ang); x.fillStyle = '#FF4FA0'; x.strokeStyle = '#fff'; x.lineWidth = 2.5; x.beginPath(); x.moveTo(0, -s); x.lineTo(s * 0.7, s * 0.7); x.lineTo(0, s * 0.3); x.lineTo(-s * 0.7, s * 0.7); x.closePath(); x.fill(); x.stroke(); x.restore();
  x.font = `800 ${fs}px Nunito, Arial`; x.fillStyle = '#FF4FA0'; x.textAlign = 'center'; x.fillText('You', mx, my - s - 8);
  // tap target preview
  if (WMAP.hover && WMAP.hover.ground) { const [hx, hy] = WMAP.hover.ground; x.strokeStyle = '#FFE27A'; x.lineWidth = 3; x.beginPath(); x.arc(hx, hy, iconR * 0.6, 0, TAU); x.stroke(); }
}
function wmPick(ev) {
  const r = wmCanvas.getBoundingClientRect(), sx = wmCanvas.width / r.width, px = (ev.clientX - r.left) * sx, py = (ev.clientY - r.top) * sx;
  let best = null, bd = 1e9;
  for (const s of WMAP.spots) { const d = Math.hypot(s.px - px, s.py - py); if (d < s.r && d < bd) { bd = d; best = s; } }
  if (best) return { d: best.d };
  return { ground: [px, py] };
}
wmCanvas.addEventListener('pointermove', (e) => { WMAP.hover = wmPick(e); wmCanvas.style.cursor = WMAP.hover.d ? 'pointer' : 'crosshair'; const tip = document.getElementById('wm-tip'); tip.textContent = WMAP.hover.d ? (WMAP.hover.d.kind === 'friend' ? `Visit ${WMAP.hover.d.name}` : `Go to ${WMAP.hover.d.name}`) : 'Tap anywhere on the land to go there'; drawWorldMap(); });
wmCanvas.addEventListener('pointerleave', () => { WMAP.hover = null; drawWorldMap(); });
wmCanvas.addEventListener('click', (e) => {
  const h = wmPick(e); if (h.d) return travelTo(h.d);
  const [x, z] = wmFrom(h.ground[0], h.ground[1]);
  if (Math.hypot(x, z) > 118) return showToast('🌲 That\'s the deep Whisperwood — tap inside the garden!');
  if (isWet(x, z) || distPond(x, z) < 1 || distLake(x, z) < 1) return showToast('💧 That\'s water! Tap on land instead.');
  camera.getWorldDirection(_f); travelTo({ kind: 'spot', x, z, ry: Math.atan2(_f.x, _f.z) });
});

// ─── Open / close + list of destinations ─────────────────────────────────────
function buildWmList() {
  const list = document.getElementById('wm-list'); if (list.dataset.built) return; list.dataset.built = '1';
  const add = (title) => { const h = document.createElement('div'); h.className = 'wm-h'; h.textContent = title; list.appendChild(h); };
  add('📍 Places');
  for (const d of DESTS) { const b = document.createElement('button'); b.className = 'wm-item'; const i = document.createElement('span'); i.textContent = d.icon; const t = document.createElement('span'); t.textContent = d.name; const c = document.createElement('small'); c.textContent = d.ch ? 'Ch. ' + d.ch : 'New'; b.append(i, t, c); b.onclick = () => travelTo(d); list.appendChild(b); }
  add('🙂 Friends');
  for (const c of CHARS) { const b = document.createElement('button'); b.className = 'wm-item'; const i = document.createElement('span'); i.textContent = { nia: '🧒🏾', freddy: '🦊', addie: '🐜', gwenda: '🧚🏾', carlo: '🐛', milly: '🦋', skippy: '🐿️', butterfly: '✨', subby: '🐌', pip: '🐦', daisy: '🦌' }[c.userData.key] || '🙂'; const t = document.createElement('span'); t.textContent = c.userData.name; b.append(i, t); b.onclick = () => travelTo({ kind: 'friend', c, name: c.userData.name }); list.appendChild(b); }
}
window.openWorldMap = () => {
  if (AR.active) return; SFX.unlock(); releaseKeys(); WMAP.open = true;
  document.getElementById('worldmap').style.display = 'flex'; buildWmList();
  const box = document.getElementById('wm-wrap'), portrait = innerHeight > innerWidth || innerWidth < 760;
  const css = Math.max(220, Math.floor(Math.min(box.clientWidth || 600, innerHeight * (portrait ? 0.5 : 0.8)))); wmCanvas.style.width = wmCanvas.style.height = css + 'px';
  const size = Math.min(1400, Math.round(css * Math.min(2, devicePixelRatio || 1))); if (wmCanvas.width !== size) wmCanvas.width = wmCanvas.height = size;
  drawWorldBase(); drawWorldMap();
};
window.closeWorldMap = () => { WMAP.open = false; document.getElementById('worldmap').style.display = 'none'; };
window.toggleWorldMap = () => (WMAP.open ? closeWorldMap() : openWorldMap());
document.getElementById('minimap').addEventListener('click', () => openWorldMap());
// keep friends & "you" fresh while the map is open
setInterval(() => { if (WMAP.open) drawWorldMap(); }, 500);
