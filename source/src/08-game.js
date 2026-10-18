// ═════════════════════════════════════════════════════════════════════════════
//  GAME — movement, camera, talking, minimap, desktop / mobile / VR
// ═════════════════════════════════════════════════════════════════════════════
var onIsland = false;
const islandTop = (x, z) => { const r = Math.min(1, Math.hypot(x - ISLAND.x, z - ISLAND.z) / ISLAND.r); return ISLAND.y + (1 - r * r) * 0.6; };
function groundAt(x, z) {
  if (onIsland) return islandTop(x, z);
  if (LIBRARY.inside(x, z)) { const b = LIBRARY.bounds; return LIBRARY.floorY + (x < b.X0 + 5.4 && Math.abs(z - (b.Z0 + b.Z1) / 2) < 3.8 ? 0.45 : 0); }
  // walk over the Addition Bridge deck instead of the water
  if (Math.abs(x) < 1.9 && z < BRIDGE.zs && z > BRIDGE.ze) return BRIDGE.deckY(z);
  return Math.max(H(x, z), WATER_Y - 0.2);
}
function resolveXZ(x, z) {
  if (onIsland) { const dx = x - ISLAND.x, dz = z - ISLAND.z, d = Math.hypot(dx, dz), m = ISLAND.r - 0.9; if (d > m) { x = ISLAND.x + dx / d * m; z = ISLAND.z + dz / d * m; } return [x, z]; }
  const R = 0.35;
  for (const c of COLLIDERS) {
    if (x > c.x0 - R && x < c.x1 + R && z > c.z0 - R && z < c.z1 + R) {
      const pl = x - (c.x0 - R), pr = c.x1 + R - x, pt = z - (c.z0 - R), pb = c.z1 + R - z, m = Math.min(pl, pr, pt, pb);
      if (m === pl) x = c.x0 - R; else if (m === pr) x = c.x1 + R; else if (m === pt) z = c.z0 - R; else z = c.z1 + R;
    }
  }
  const r = Math.hypot(x, z); if (r > 120) { x *= 120 / r; z *= 120 / r; }
  return [x, z];
}
function teleportTo(x, z, ry = 0) {
  if (onIsland) onIsland = false;
  const gy = groundAt(x, z) + EYE; controls.target.set(x, gy, z);
  camera.position.set(x - Math.sin(ry) * 4, gy + 1.6, z - Math.cos(ry) * 4); controls.update(); detectLoc();
  if (renderer.xr.isPresenting && camera.parent === dolly) { dolly.position.set(x, gy - EYE, z); dolly.rotation.set(0, ry + Math.PI, 0); }
}
const EYE = 1.35;
function clampFocus() {
  const t = controls.target, gy = groundAt(t.x, t.z) + EYE;
  t.y += (gy - t.y) * 0.25;
  const cy = groundAt(camera.position.x, camera.position.z) + 0.6; if (camera.position.y < cy) camera.position.y = cy;
  // inside the library: keep the camera under the (hidden) roof and within the walls
  const inside = LIBRARY.inside(t.x, t.z); LIBRARY.roof.visible = !inside;
  controls.maxDistance = inside ? 6.5 : onIsland ? 14 : 22;
  if (inside) { const b = LIBRARY.bounds, c = camera.position; c.x = Math.max(b.X0 + 0.7, Math.min(b.X1 - 0.7, c.x)); c.z = Math.max(b.Z0 + 0.7, Math.min(b.Z1 - 0.7, c.z)); c.y = Math.min(LIBRARY.floorY + 5.4, c.y); }
}
function moveFocus(dx, dz) {
  const t = controls.target, [nx, nz] = resolveXZ(t.x + dx, t.z + dz), ddx = nx - t.x, ddz = nz - t.z;
  t.x = nx; t.z = nz; camera.position.x += ddx; camera.position.z += ddz;
}

// ─── Keyboard ────────────────────────────────────────────────────────────────
const keys = {};
// Movement keys by physical key (so Shift / Caps Lock never confuse them)
const MOVE_KEYS = { KeyW: 'w', ArrowUp: 'w', KeyS: 's', ArrowDown: 's', KeyA: 'a', ArrowLeft: 'a', KeyD: 'd', ArrowRight: 'd', ShiftLeft: 'shift', ShiftRight: 'shift' };
let lastKeyAt = 0;
const releaseKeys = () => { for (const k in keys) keys[k] = false; };
const typing = (t) => t && /INPUT|TEXTAREA|SELECT/.test(t.tagName);
addEventListener('keydown', e => {
  if (typing(e.target)) return;
  const k = MOVE_KEYS[e.code]; if (k) { keys[k] = true; lastKeyAt = performance.now(); if (e.code.startsWith('Arrow')) e.preventDefault(); }
  if (e.repeat) return;
  if (e.code === 'KeyE' && nearThing && !GAME.open) nearThing.act();
  if (e.code === 'KeyM' && started && !GAME.open && !AR.active) toggleWorldMap();
  if (e.key === 'Escape') { if (WMAP.open) closeWorldMap(); else if (GAME.open) closeGame(); else if (AR.active) closeAR(); }
});
// Release on key-up even if focus moved into a text box meanwhile
addEventListener('keyup', e => { const k = MOVE_KEYS[e.code]; if (k) keys[k] = false; });
// A key-up we never hear (clicking into chat, switching tabs or windows) must not leave you walking forever
addEventListener('blur', releaseKeys); document.addEventListener('visibilitychange', releaseKeys);
document.addEventListener('focusin', e => { if (typing(e.target)) releaseKeys(); });
const _f = new THREE.Vector3(), _r = new THREE.Vector3();
function handleKeys(dt) {
  if (GAME.open || AR.active || LIFTS.t >= 0 || WMAP.open) return false;
  // held keys auto-repeat many times a second; silence for >1.2 s means we missed the key-up
  if ((keys.w || keys.a || keys.s || keys.d) && performance.now() - lastKeyAt > 1200) releaseKeys();
  let ix = 0, iz = 0;
  if (keys['w'] || keys['arrowup']) iz += 1; if (keys['s'] || keys['arrowdown']) iz -= 1;
  if (keys['a'] || keys['arrowleft']) ix -= 1; if (keys['d'] || keys['arrowright']) ix += 1;
  if (!ix && !iz) return false;
  const spd = (keys['shift'] ? 14 : 7.5) * dt;
  camera.getWorldDirection(_f); _f.y = 0; _f.normalize(); _r.crossVectors(_f, camera.up).normalize();
  const l = Math.hypot(ix, iz);
  moveFocus((_f.x * iz + _r.x * ix) / l * spd, (_f.z * iz + _r.z * ix) / l * spd);
  return true;
}

// ─── Touch: left joystick moves, right side looks / taps to talk ─────────────
const touch = { active: false, id: -1, sx: 0, sy: 0, dx: 0, dy: 0 }, look = { id: -1, lx: 0, ly: 0, moved: 0, t0: 0 };
function initTouchControls() {
  if (!isMobile) return;
  document.getElementById('touch-controls').style.display = 'block';
  document.getElementById('touch-tap-hint').style.display = 'block';
  // Pointer Events cover fingers, mice, pens AND headset laser-pointers (Quest/Pico 2D browser),
  // and pointer capture keeps the stick working even when your thumb slides outside the circle.
  const zone = document.getElementById('joystick-zone'), nub = document.getElementById('joystick-nub');
  const R = () => zone.clientWidth * 0.42;
  const setStick = (cx, cy) => {
    const r = zone.getBoundingClientRect(), ox = r.left + r.width / 2, oy = r.top + r.height / 2, rad = R();
    let dx = cx - ox, dy = cy - oy; const d = Math.hypot(dx, dy); if (d > rad) { dx *= rad / d; dy *= rad / d; }
    touch.dx = dx / rad; touch.dy = dy / rad;                                      // −1…1, circular
    nub.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  };
  const stopStick = () => { touch.active = false; touch.dx = touch.dy = 0; touch.id = -1; nub.style.transform = 'translate(-50%,-50%)'; zone.classList.remove('on'); };
  zone.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); try { zone.setPointerCapture(e.pointerId); } catch (_) {} touch.active = true; touch.id = e.pointerId; zone.classList.add('on'); setStick(e.clientX, e.clientY); });
  zone.addEventListener('pointermove', e => { if (e.pointerId === touch.id) { e.preventDefault(); setStick(e.clientX, e.clientY); } });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => zone.addEventListener(ev, e => { if (e.pointerId === touch.id) stopStick(); }));
  addEventListener('blur', stopStick); document.addEventListener('visibilitychange', stopStick);
  zone.addEventListener('contextmenu', e => e.preventDefault());

  const lz = document.getElementById('touch-look-zone');
  lz.addEventListener('pointerdown', e => { e.preventDefault(); try { lz.setPointerCapture(e.pointerId); } catch (_) {} Object.assign(look, { id: e.pointerId, lx: e.clientX, ly: e.clientY, moved: 0, t0: performance.now() }); });
  lz.addEventListener('pointermove', e => {
    if (e.pointerId !== look.id) return;
    const dx = e.clientX - look.lx, dy = e.clientY - look.ly; look.lx = e.clientX; look.ly = e.clientY; look.moved += Math.abs(dx) + Math.abs(dy);
    orbitBy(-dx * 0.008, -dy * 0.006);
  });
  const endLook = e => { if (e.pointerId !== look.id) return; if (e.type === 'pointerup' && look.moved < 12 && performance.now() - look.t0 < 450) pickAt(e.clientX, e.clientY); look.id = -1; };
  ['pointerup', 'pointercancel'].forEach(ev => lz.addEventListener(ev, endLook));
}
function orbitBy(dAz, dEl) {
  const off = camera.position.clone().sub(controls.target), sph = new THREE.Spherical().setFromVector3(off);
  sph.theta += dAz; sph.phi = Math.max(0.25, Math.min(Math.PI * 0.49, sph.phi + dEl));
  camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(sph));
}
function handleTouch(dt) {
  if (GAME.open || AR.active || LIFTS.t >= 0) return false;
  if (!touch.active) return false;
  const mag = Math.hypot(touch.dx, touch.dy); if (mag < 0.12) return false;          // small dead-zone in the middle
  camera.getWorldDirection(_f); _f.y = 0; _f.normalize(); _r.crossVectors(_f, camera.up).normalize();
  const k = Math.min(1, (mag - 0.12) / 0.88) / mag, nx = touch.dx * k, ny = -touch.dy * k, spd = 7 * dt;
  moveFocus((_f.x * ny + _r.x * nx) * spd, (_f.z * ny + _r.z * nx) * spd); return true;
}

// ─── Talking to characters ───────────────────────────────────────────────────
const ray = new THREE.Raycaster(), mouseV = new THREE.Vector2();
let nearChar = null;
function pickAt(cx, cy) {
  if (document.getElementById('title-screen').style.display !== 'none') return;
  mouseV.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1); ray.setFromCamera(mouseV, camera);
  const hits = ray.intersectObjects(CHARS.map(c => c.userData.hit), false);
  if (hits.length) { talkTo(hits[0].object.userData.owner); return; }
  const sh = ray.intersectObjects(GAME_STONES.map(s => s.obj), true); if (sh.length) { let o = sh[0].object; const st = GAME_STONES.find(s => { let p = o; while (p) { if (p === s.obj) return true; p = p.parent; } return false; }); if (st) stoneAct(st); }
}
let downAt = null;
renderer.domElement.addEventListener('pointerdown', e => { downAt = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener('pointerup', e => { if (e.pointerType === 'touch' || AR.active) return; if (downAt && Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) < 6) pickAt(e.clientX, e.clientY); });

const bubble = (() => {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 400;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, fog: false }));
  sp.scale.set(3.4, 1.33, 1); sp.renderOrder = 10; sp.visible = false; scene.add(sp);
  return { c, tex, sp, owner: null, until: 0 };
})();
function drawBubble(name, text) {
  const x = bubble.c.getContext('2d'), W = 1024, Hh = 400; x.clearRect(0, 0, W, Hh);
  x.fillStyle = 'rgba(255,253,245,0.97)'; x.strokeStyle = '#7B2CBF'; x.lineWidth = 10;
  const r = 50; x.beginPath(); x.moveTo(r, 10); x.lineTo(W - r, 10); x.quadraticCurveTo(W - 10, 10, W - 10, r); x.lineTo(W - 10, 300 - r); x.quadraticCurveTo(W - 10, 300, W - r, 300);
  x.lineTo(560, 300); x.lineTo(512, 380); x.lineTo(470, 300); x.lineTo(r, 300); x.quadraticCurveTo(10, 300, 10, 300 - r); x.lineTo(10, r); x.quadraticCurveTo(10, 10, r, 10); x.fill(); x.stroke();
  x.fillStyle = '#7B2CBF'; x.font = '54px "Fredoka One", Arial'; x.textAlign = 'center'; x.fillText(name, W / 2, 78);
  x.fillStyle = '#2B2B3A'; x.font = '44px "Nunito", Arial';
  const words = text.split(' '), lines = []; let ln = '';
  for (const w of words) { const tl = ln ? ln + ' ' + w : w; if (x.measureText(tl).width > W - 90) { lines.push(ln); ln = w; } else ln = tl; }
  lines.push(ln); lines.slice(0, 4).forEach((l, i) => x.fillText(l, W / 2, 140 + i * 50 - (lines.length > 3 ? 20 : 0)));
  bubble.tex.needsUpdate = true;
}
function talkTo(c) {
  const ud = c.userData, line = ud.dialog[ud.dialogIdx]; ud.dialogIdx = (ud.dialogIdx + 1) % ud.dialog.length;
  document.getElementById('dialog-speaker').textContent = ud.name;
  document.getElementById('dialog-text').textContent = line;
  if (!renderer.xr.isPresenting) document.getElementById('dialog-box').style.display = 'block';
  drawBubble(ud.name, line); bubble.owner = c; bubble.sp.visible = true; bubble.until = clockT + 9;
  clearTimeout(talkTo._t); talkTo._t = setTimeout(() => { document.getElementById('dialog-box').style.display = 'none'; }, 9000);
  ud.excite = 1.5;
  const gk = CHAR_GAME[ud.key], pb = document.getElementById('dialog-play');
  if (pb) { if (gk) { pb.style.display = 'inline-block'; pb.textContent = `▶ Play ${GAMES[gk].title}`; pb.onclick = () => openGame(gk, c.position); } else pb.style.display = 'none'; }
  if (renderer.xr.isPresenting && gk) openGame(gk, c.position);
}
function stoneAct(st) { if (st.game === 'journal') openJournal(); else openGame(st.game, st.pos); }
// ─── Everything you can interact with nearby ─────────────────────────────────
let nearThing = null;
function findNear(focus) {
  let best = null, bs = 1;
  const consider = (pos, r, thing) => { const d = Math.hypot(pos.x - focus.x, pos.z - focus.z), dy = Math.abs((pos.y ?? focus.y) - focus.y); if (dy > 4) return; const s = d / r; if (s < bs) { bs = s; best = thing; } };
  for (const c of CHARS) consider(c.position, 4.5, { label: `talk to ${c.userData.name.split(' ')[0]}`, icon: '💬', act: () => talkTo(c), key: c });
  for (const st of GAME_STONES) consider(st.pos, 2.6, { label: st.game === 'journal' ? 'open the Garden Journal' : `play ${st.label}`, icon: st.game === 'journal' ? '📖' : '▶', act: () => stoneAct(st), key: st });
  for (const sp of LIBRARY.spots) consider(sp.pos, 2.4, { label: sp.label, icon: sp.action === 'shop' ? '🛒' : sp.action === 'events' ? '📅' : '📺', act: () => spotAct(sp), key: sp });
  consider(onIsland ? LIFT.top : LIFT.ground, 2.2, { label: onIsland ? 'ride the Dream Lift down' : 'ride the Dream Lift up to Math Dreams Island', icon: '☁️', act: rideLift, key: LIFT });
  return best;
}
function spotAct(sp) {
  if (sp.action === 'events') openEvents();
  else if (sp.action === 'shop') { if (confirm('Open the book\'s page on Amazon in a new tab?')) window.open('https://www.amazon.com/Number-Garden-Bright-Minds-Explorers/dp/B0GDCNBFYL/', '_blank', 'noopener'); }
  else { camera.position.set(sp.pos.x + 3.2, LIBRARY.floorY + 2.4, sp.pos.z); controls.target.set(LIBRARY.bounds.X0 + 1, LIBRARY.floorY + 3.2, sp.pos.z); controls.update(); }
}
// ─── The Dream Lift ──────────────────────────────────────────────────────────
const LIFTS = { t: -1 };
function rideLift() {
  if (LIFTS.t >= 0) return; SFX.unlock(); SFX.sparkle();
  const up = !onIsland; Object.assign(LIFTS, { t: 0, up, from: (up ? LIFT.ground : LIFT.top).clone(), to: (up ? LIFT.top : LIFT.ground).clone() });
  if (!up) onIsland = false;
  showToast(up ? '☁️ Floating up to Math Dreams Island…' : '☁️ Floating back down to the garden…');
}
function updateLift(dt, xr) {
  if (LIFTS.t < 0) return; LIFTS.t = Math.min(1, LIFTS.t + dt / 3.5); const k = LIFTS.t * LIFTS.t * (3 - 2 * LIFTS.t);
  const p = LIFTS.from.clone().lerp(LIFTS.to, k);
  if (xr) dolly.position.copy(p);
  else { const prev = controls.target.clone(); controls.target.set(p.x, p.y + EYE, p.z); camera.position.add(controls.target.clone().sub(prev)); }
  if (Math.random() < 0.3) burst(new THREE.Vector3(p.x + rr(-1, 1), p.y + rr(0, 2), p.z + rr(-1, 1)), 0xE0C8FF, 6);
  if (LIFTS.t >= 1) { LIFTS.t = -1; onIsland = LIFTS.up; detectLoc(); if (onIsland) showToast('✨ Welcome to Math Dreams Island! Play Math Dreams at the star stone.'); }
}
// ─── Golden 8 hunt ───────────────────────────────────────────────────────────
function applyEights() { for (const e of EIGHTS) { e.mesh.userData.hidden = PROG.eights.includes(e.i); e.mesh.visible = !e.mesh.userData.hidden; } updateHudCounts(); }
function checkEights(focus) {
  for (const e of EIGHTS) {
    if (e.mesh.userData.hidden) continue; const p = e.mesh.position;
    if (Math.hypot(p.x - focus.x, p.z - focus.z) < 1.5 && Math.abs(p.y - focus.y) < 2.5) {
      e.mesh.visible = false; e.mesh.userData.hidden = true; PROG.eights.push(e.i); saveProgress(); SFX.sparkle(); burst(p.clone(), 0xFFD86B, 50);
      const n = PROG.eights.length; showToast(n === EIGHTS.length ? `🏆 You found ALL ${n} golden 8s! You are a true Number Garden explorer!` : `✨ Golden 8 found! ${n} of ${EIGHTS.length}`);
      if (n % 8 === 0) SFX.win();
    }
  }
}
window.closeDialog = () => { document.getElementById('dialog-box').style.display = 'none'; bubble.sp.visible = false; };

// ─── Location HUD & minimap ──────────────────────────────────────────────────
let curLoc = '';
function detectLoc() {
  const t = controls.target; let best = null, bd = 1e9;
  for (const k in LM) { if (k === 'lift') continue; const L = LM[k], d = Math.hypot(t.x - L.x, t.z - L.z); if (d < L.r + 3 && d < bd) { bd = d; best = L; } }
  if (LIBRARY.inside(t.x, t.z)) best = LM.library;
  if (onIsland) best = { n: '☁️ Math Dreams Island', ch: 17 };
  const name = best ? best.n : '🌸 The Number Garden';
  if (name !== curLoc) { curLoc = name; const el = document.getElementById('location-name'); el.textContent = name + (best?.ch ? `  ·  Ch. ${best.ch}` : ''); el.animate([{ transform: 'scale(1.08)' }, { transform: 'scale(1)' }], { duration: 400 }); }
}
const mmc = document.getElementById('mm'); mmc.width = mmc.height = 180;
const mm = mmc.getContext('2d'), MMS = 180, MMR = 124;
const toMM = (x, z) => [(x + MMR) / (2 * MMR) * MMS, (z + MMR) / (2 * MMR) * MMS];
const mmBase = document.createElement('canvas'); mmBase.width = mmBase.height = MMS;
{
  const b = mmBase.getContext('2d');
  const gr = b.createRadialGradient(MMS / 2, MMS / 2, 10, MMS / 2, MMS / 2, MMS / 2); gr.addColorStop(0, '#4E9A3A'); gr.addColorStop(0.8, '#3B7A2C'); gr.addColorStop(1, '#1F4A1A'); b.fillStyle = gr; b.fillRect(0, 0, MMS, MMS);
  const line = (pts, w, col) => { b.strokeStyle = col; b.lineWidth = w; b.lineJoin = b.lineCap = 'round'; b.beginPath(); pts.forEach((p, i) => { const [x, y] = toMM(p.x, p.z); i ? b.lineTo(x, y) : b.moveTo(x, y); }); b.stroke(); };
  line(streamC.pts, 4, '#5CC8E0'); b.fillStyle = '#5CC8E0'; { const [x, y] = toMM(POND.x, POND.z); b.beginPath(); b.arc(x, y, POND.r / (2 * MMR) * MMS, 0, TAU); b.fill(); const [lx, ly] = toMM(LAKE.x, LAKE.z); b.beginPath(); b.ellipse(lx, ly, LAKE.r * 1.25 / (2 * MMR) * MMS, LAKE.r / (2 * MMR) * MMS, 0, 0, TAU); b.fill(); }
  [mainC, loopC, outerC, ...spurC].forEach(c => line(c.pts, 2, '#E9D9A6'));
  { const B = LIBRARY.bounds, [ax, ay] = toMM(B.X0, B.Z0), [bx, by] = toMM(B.X1, B.Z1); b.fillStyle = '#7B2CBF'; b.fillRect(ax, ay, bx - ax, by - ay); }
  b.font = '11px serif'; b.textAlign = 'center'; b.textBaseline = 'middle';
  for (const k in LM) { const L = LM[k], [x, y] = toMM(L.x, L.z); b.fillStyle = 'rgba(0,0,0,0.35)'; b.beginPath(); b.arc(x, y, 6.5, 0, TAU); b.fill(); b.fillText(L.icon, x, y + 1); }
}
function drawMM() {
  mm.drawImage(mmBase, 0, 0);
  const [px, py] = toMM(controls.target.x, controls.target.z);
  camera.getWorldDirection(_f); const ang = Math.atan2(_f.x, -_f.z);
  mm.save(); mm.translate(px, py); mm.rotate(ang); mm.fillStyle = '#FF4FA0'; mm.strokeStyle = '#fff'; mm.lineWidth = 2;
  mm.beginPath(); mm.moveTo(0, -9); mm.lineTo(6, 6); mm.lineTo(0, 3); mm.lineTo(-6, 6); mm.closePath(); mm.fill(); mm.stroke(); mm.restore();
  CHARS.forEach(c => { const [x, y] = toMM(c.position.x, c.position.z); mm.fillStyle = '#FFE27A'; mm.beginPath(); mm.arc(x, y, 2, 0, TAU); mm.fill(); });
  for (const a of SOCIAL.avatars.values()) { const [x, y] = toMM(a.g.position.x, a.g.position.z); mm.fillStyle = '#5CE1E6'; mm.strokeStyle = '#fff'; mm.lineWidth = 1.5; mm.beginPath(); mm.arc(x, y, 3.5, 0, TAU); mm.fill(); mm.stroke(); }
  mm.fillStyle = 'rgba(255,255,255,0.75)'; mm.font = 'bold 10px Arial'; mm.fillText('N ▲', MMS / 2, 10);
}

// ─── WebXR (VR headsets) ─────────────────────────────────────────────────────
const dolly = new THREE.Group(); scene.add(dolly);
let xrControllers = [];
async function initXR() {
  if (!navigator.xr) return;
  const ok = await navigator.xr.isSessionSupported('immersive-vr').catch(() => false);
  if (!ok) { document.getElementById('xr-btn').style.display = 'block'; return; }
  const { VRButton } = await import('three/addons/webxr/VRButton.js');
  const btn = VRButton.createButton(renderer); btn.id = 'VRButton'; document.body.appendChild(btn);
  document.getElementById('xr-btn').style.display = 'none';
  for (let i = 0; i < 2; i++) {
    const c = renderer.xr.getController(i); dolly.add(c); xrControllers.push(c);
    c.addEventListener('connected', (e) => { c.userData.hand = e.data && e.data.handedness; });
    c.addEventListener('disconnected', () => { c.userData.hand = null; });
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -6)]), new THREE.LineBasicMaterial({ color: 0xFFE27A }));
    c.add(line); c.userData.line = line;
    c.addEventListener('selectstart', () => {
      if (AR.xr) return;
      const m = new THREE.Matrix4().extractRotation(c.matrixWorld);
      ray.camera = camera; ray.far = 40;
      ray.ray.origin.setFromMatrixPosition(c.matrixWorld); ray.ray.direction.set(0, 0, -1).applyMatrix4(m);
      if (VRPANEL.mesh.visible) { const ph = ray.intersectObject(VRPANEL.mesh, false)[0]; if (ph) { VRPANEL.hit(ph.uv); return; } }
      const hits = ray.intersectObjects(CHARS.map(ch => ch.userData.hit), false); if (hits.length) { talkTo(hits[0].object.userData.owner); return; }
      const sh = ray.intersectObjects(xrStoneMeshes(), false)[0];
      if (sh) { const st = GAME_STONES.find(s => { let p = sh.object; while (p) { if (p === s.obj) return true; p = p.parent; } return false; }); if (st) { stoneAct(st); return; } }
      if (nearThing && nearThing.key === LIFT) { rideLift(); return; }
      // nothing to interact with → teleport where the controller points
      const o = new THREE.Vector3().setFromMatrixPosition(c.matrixWorld), d = new THREE.Vector3(0, 0, -1).applyMatrix4(m), hit = groundRayHit(o, d);
      if (hit && LIFTS.t < 0) { const [x, z] = resolveXZ(hit.x, hit.z); dolly.position.set(x, groundAt(x, z), z); burst(new THREE.Vector3(x, dolly.position.y + 0.3, z), 0xFFE27A, 20); }
    });
  }
  renderer.xr.addEventListener('sessionstart', () => {
    if (AR.xr) return;
    ['game-panel', 'journal', 'events-panel', 'dialog-box'].forEach(id => { const e = document.getElementById(id); if (e) e.style.display = 'none'; });
    if (GAME.open) VRPANEL.show();
    dolly.position.set(controls.target.x, groundAt(controls.target.x, controls.target.z), controls.target.z);
    camera.getWorldDirection(_f); dolly.rotation.set(0, Math.atan2(-_f.x, -_f.z), 0);   // keep facing the way you were looking
    dolly.add(camera); camera.position.set(0, 0, 0); camera.quaternion.identity(); snapReady = true;
  });
  renderer.xr.addEventListener('sessionend', () => {
    if (TP.marker) TP.marker.visible = false; if (XRUI.hint) XRUI.hint.visible = false; if (XRUI.cursor) XRUI.cursor.visible = false;
    if (camera.parent !== dolly) return;
    scene.add(camera); camera.position.set(dolly.position.x + 3, dolly.position.y + 4, dolly.position.z + 6);
    controls.target.set(dolly.position.x, dolly.position.y + EYE, dolly.position.z); controls.update();
  });
}
window.enterXR = () => alert('🥽 VR: open this page in your headset\'s browser (Meta Quest, Pico…). An "Enter VR" button appears automatically when a headset is detected. Left thumbstick walks, right thumbstick turns, and pulling the trigger on the ground teleports you there. Point the trigger at friends or ▶ stones to talk and play.');
let snapReady = true;
// Point-and-click teleport: march the controller ray over the terrain heightfield
const TP = { marker: null, hit: null };
function groundRayHit(origin, dir, maxD = 28) {
  if (dir.y > -0.02) return null; let prev = 0;
  for (let d = 0.5; d <= maxD; d += 0.4) {
    const x = origin.x + dir.x * d, z = origin.z + dir.z * d, y = origin.y + dir.y * d, g = groundAt(x, z);
    if (y <= g) { const k = prev ? (d + prev) / 2 : d; return new THREE.Vector3(origin.x + dir.x * k, groundAt(origin.x + dir.x * k, origin.z + dir.z * k), origin.z + dir.z * k); }
    prev = d;
  }
  return null;
}
function updateTeleportMarker() {
  if (!TP.marker) { TP.marker = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.5, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xFFE27A, transparent: true, opacity: 0.85, depthWrite: false })); TP.marker.renderOrder = 15; scene.add(TP.marker); }
  TP.hit = null; const c = xrControllers.find(k => k.userData.hand === 'right') || xrControllers.find(k => k.userData.hand) || xrControllers[0];
  if (c && !VRPANEL.mesh.visible && LIFTS.t < 0) {
    const o = new THREE.Vector3().setFromMatrixPosition(c.matrixWorld), d = new THREE.Vector3(0, 0, -1).applyMatrix4(new THREE.Matrix4().extractRotation(c.matrixWorld));
    TP.hit = groundRayHit(o, d);
  }
  TP.marker.visible = !!TP.hit; if (TP.hit) TP.marker.position.set(TP.hit.x, TP.hit.y + 0.05, TP.hit.z);
}
// Read a thumbstick robustly: Quest/Index report it on axes[2,3]; Pico/older runtimes on axes[0,1]
function stickOf(gp) {
  const a = gp.axes, p0 = [a[0] || 0, a[1] || 0], p1 = [a[2] || 0, a[3] || 0];
  return Math.hypot(p1[0], p1[1]) >= Math.hypot(p0[0], p0[1]) ? p1 : p0;
}
const _hp = new THREE.Vector3(), _hp2 = new THREE.Vector3();
function handleXR(dt) {
  const s = renderer.xr.getSession(); if (!s) return;
  // Walk relative to where the HEAD is looking (the user camera inherits the dolly's snap-turn rotation)
  camera.updateMatrixWorld(true); camera.getWorldDirection(_f); _f.y = 0;
  if (_f.lengthSq() < 1e-4) _f.set(0, 0, -1).applyAxisAngle(camera.up, dolly.rotation.y); _f.normalize();
  _r.crossVectors(_f, camera.up).normalize();
  const srcs = [...s.inputSources].filter(x => x.gamepad), hasLeft = srcs.some(x => x.handedness === 'left');
  for (const src of srcs) {
    const [ax, ay] = stickOf(src.gamepad), mag = Math.hypot(ax, ay);
    const isMove = src.handedness === 'left' || !hasLeft;
    if (isMove) {
      if (mag > 0.18 && LIFTS.t < 0) {
        const k = (mag - 0.18) / 0.82 / mag, sp = 3.2 * (src.gamepad.buttons[0]?.pressed && srcs.length === 1 ? 1.8 : 1);
        dolly.position.addScaledVector(_f, -ay * k * sp * dt).addScaledVector(_r, ax * k * sp * dt);
        const [x, z] = resolveXZ(dolly.position.x, dolly.position.z); dolly.position.x = x; dolly.position.z = z;
      }
    }
    if (src.handedness === 'right') {
      if (Math.abs(ax) > 0.7 && Math.abs(ay) < 0.6 && snapReady) {
        // snap-turn 30° around the player's HEAD (not the play-space origin) so you don't slide sideways
        camera.getWorldPosition(_hp); dolly.rotation.y -= Math.sign(ax) * Math.PI / 6; dolly.updateMatrixWorld(true); camera.getWorldPosition(_hp2);
        dolly.position.x += _hp.x - _hp2.x; dolly.position.z += _hp.z - _hp2.z; snapReady = false;
      } else if (Math.abs(ax) < 0.3) snapReady = true;
    }
  }
  if (LIFTS.t < 0) dolly.position.y += (groundAt(dolly.position.x, dolly.position.z) - dolly.position.y) * 0.3;
  updateTeleportMarker(); updateXRUI(s);
}

// ─── VR interaction helpers: laser cursor, A/X = interact, B/Y = close, hint card ──
let _stoneMeshes = null;
function xrStoneMeshes() {           // solid meshes only (label sprites can't be ray-tested reliably in XR)
  if (!_stoneMeshes) { _stoneMeshes = []; for (const st of GAME_STONES) st.obj.traverse(o => { if (o.isMesh && !o.isSprite) _stoneMeshes.push(o); }); }
  return _stoneMeshes;
}
const XRUI = { cursor: null, hint: null, hintText: '', prev: new Map(), _o: new THREE.Vector3(), _d: new THREE.Vector3(), _m: new THREE.Matrix4() };
function xrHint(text) {
  if (!XRUI.hint) { XRUI.hint = labelSprite(' ', { w: 1024, h: 150, scale: 1 }); XRUI.hint.material.depthTest = false; XRUI.hint.renderOrder = 25; scene.add(XRUI.hint); }
  if (text !== XRUI.hintText) {
    XRUI.hintText = text; if (!text) { XRUI.hint.visible = false; return; }
    const old = XRUI.hint.material.map; const sp = labelSprite(text, { w: 1024, h: 150 }); XRUI.hint.material.map = sp.material.map; XRUI.hint.material.needsUpdate = true; old && old.dispose();
    XRUI.hint.scale.set(1.15, 1.15 * 150 / 1024, 1);
  }
  if (!text) return;
  camera.getWorldPosition(XRUI._o); camera.getWorldDirection(XRUI._d); XRUI._d.y = 0; XRUI._d.normalize();
  XRUI.hint.position.copy(XRUI._o).addScaledVector(XRUI._d, 1.6); XRUI.hint.position.y = XRUI._o.y - 0.45; XRUI.hint.visible = true;
}
function updateXRUI(s) {
  if (!XRUI.cursor) { XRUI.cursor = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 8), new THREE.MeshBasicMaterial({ color: 0xFFFFFF, depthTest: false })); XRUI.cursor.renderOrder = 30; scene.add(XRUI.cursor); }
  XRUI.cursor.visible = false; ray.camera = camera; ray.far = 30;
  const targets = VRPANEL.mesh.visible ? [VRPANEL.mesh] : [...CHARS.map(c => c.userData.hit), ...xrStoneMeshes()];
  for (const c of xrControllers) {
    const line = c.userData.line; if (!line) continue; line.visible = !!c.userData.hand;
    if (!c.userData.hand) continue;
    XRUI._o.setFromMatrixPosition(c.matrixWorld); XRUI._d.set(0, 0, -1).applyMatrix4(XRUI._m.extractRotation(c.matrixWorld));
    ray.ray.set(XRUI._o, XRUI._d);
    const h = ray.intersectObjects(targets, false)[0];
    if (h) { line.scale.z = h.distance / 6; line.material.color.set(0x7CFF9B); XRUI.cursor.position.copy(h.point); XRUI.cursor.visible = true; }
    else { line.scale.z = 1; line.material.color.set(0xFFE27A); }
  }
  ray.far = Infinity;
  // buttons: A/X (index 4) interacts with whatever you're standing next to; B/Y (index 5) closes the game card
  for (const src of s.inputSources) {
    const gp = src.gamepad; if (!gp) continue; const b = gp.buttons, A = !!(b[4] && b[4].pressed), B = !!(b[5] && b[5].pressed), p = XRUI.prev.get(src) || {};
    if (A && !p.A) { if (!VRPANEL.mesh.visible && nearThing && LIFTS.t < 0) { SFX.unlock(); nearThing.act(); } }
    if (B && !p.B) { if (GAME.open) closeGame(); }
    XRUI.prev.set(src, { A, B });
  }
  // keep the game card in view if you walk or turn away from it
  if (VRPANEL.mesh.visible) { camera.getWorldPosition(XRUI._o); if (XRUI._o.distanceTo(VRPANEL.mesh.position) > 2.8) VRPANEL.show(); }
  // floating hint near the bottom of your view
  let tip = '';
  if (GAME.open) tip = '🎯 Point & pull the trigger to answer  ·  B / Y closes';
  else if (nearThing && LIFTS.t < 0) tip = `${nearThing.icon} Press A / X to ${nearThing.label}`;
  xrHint(tip);
}

// ─── Main loop ───────────────────────────────────────────────────────────────
const clock = new THREE.Clock(); let clockT = 0, started = false; const XRF = { n: 0 };
// fewer dynamic lights on phones & headsets (each one costs every pixel)
if (Q.lowLights || isMobile) scene.traverse(o => { if (o.isPointLight) o.visible = false; });
const _tp = new THREE.Vector3();
renderer.setAnimationLoop((time, frame) => {
  const dt = Math.min(clock.getDelta(), 0.05), t = (clockT = clock.elapsedTime);
  WIND.value = t; skyMat.uniforms.time.value = t; waterNormal.offset.set(t * 0.015, t * 0.03);
  const xr = renderer.xr.isPresenting && !AR.xr;
  if (started && !xr && !AR.active) { const mv = handleKeys(dt) | handleTouch(dt); controls.update(); if (!window.__noClamp && LIFTS.t < 0) clampFocus(); if (mv) detectLoc(); }
  if (xr) handleXR(dt);
  updateLift(dt, xr); updateBursts(dt); VRPANEL.draw();
  if (HEART.boost > 0) { HEART.boost -= dt; HEART.mesh.scale.setScalar(1 + Math.sin(t * 8) * 0.12 + Math.min(1, HEART.boost) * 0.35); } else if (HEART.mesh) HEART.mesh.scale.setScalar(1);
  if (AR.active) { updateAR(t, dt, frame); if (AR.xr) renderer.render(AR.scene, camera); else renderer.render(AR.scene, AR.camera); return; }
  for (const o of FLOATERS) { const u = o.userData; o.position.y = u.fb + Math.sin(t * u.fspd + u.fph) * u.famp; if (u.fspin) o.rotation.y += u.fspin * dt; }
  for (const f of ANIM) f(t, dt);
  updateAmbient(t);
  // characters
  const focus = xr ? dolly.position : controls.target;
  nearChar = null; let nd = 6;
  for (const c of CHARS) {
    const d = c.position.distanceTo(focus); c.userData.dist = d;
    if (d < nd) { nd = d; nearChar = c; }
    if (d < 70) c.userData.update && c.userData.update(t, dt, focus);
    // fur level-of-detail: full shells up close, a few further away, none in the distance
    const fc = d < 12 ? Q.shells + 1 : d < 30 ? Math.min(3, Q.shells + 1) : 1;
    if (c.userData.furLod !== fc) { c.userData.furLod = fc; for (const f of c.userData.furs || []) f.count = fc; }
  }
  nearThing = started ? findNear(focus) : null;
  const hint = document.getElementById('near-hint'), act = document.getElementById('act-btn');
  const showHint = nearThing && started && !xr && !GAME.open && LIFTS.t < 0;
  if (hint) { if (showHint && !isMobile) { hint.style.display = 'block'; hint.textContent = `${nearThing.icon} Press E to ${nearThing.label}`; } else hint.style.display = 'none'; }
  if (act) { if (showHint && isMobile) { act.style.display = 'block'; act.textContent = `${nearThing.icon} ${nearThing.label.replace(/^./, c => c.toUpperCase())}`; } else act.style.display = 'none'; }
  if (started) checkEights(xr ? new THREE.Vector3(dolly.position.x, dolly.position.y + EYE, dolly.position.z) : focus);
  updateAvatars(t, dt); if (started) sendMyPresence(xr ? dolly.position : focus, xr);
  if (bubble.sp.visible && bubble.owner) { bubble.owner.getWorldPosition(_tp); bubble.sp.position.set(_tp.x, _tp.y + bubble.owner.userData.height + 1.0, _tp.z); if (t > bubble.until) bubble.sp.visible = false; }
  if ((XRF.c = (XRF.c || 0) + 1) % 6 === 0 || !started) updateCull(focus);
  updateSun(focus);
  if (xr) { XRF.n++; renderer.shadowMap.autoUpdate = false; if (XRF.n % 3 === 0) renderer.shadowMap.needsUpdate = true; } else renderer.shadowMap.autoUpdate = true;
  if (started && !xr) { drawMM(); if ((t * 2 | 0) !== (window.__locT | 0)) { window.__locT = t * 2; detectLoc(); } }
  if (composer && !xr) composer.render(); else renderer.render(scene, camera);
});

// ─── Start ───────────────────────────────────────────────────────────────────
window.__enterGarden = () => {
  const ts = document.getElementById('title-screen');
  if (ts.dataset.started) return; ts.dataset.started = '1';
  ts.style.opacity = '0';
  setTimeout(() => {
    ts.style.display = 'none'; started = true;
    document.getElementById('hud').style.display = 'flex';
    document.getElementById('book-link').style.display = 'flex';
    if (innerWidth > 600) document.getElementById('minimap').style.display = 'block';
    if (!isMobile) document.getElementById('controls-hint').style.display = 'flex';
    initTouchControls(); initXR(); detectLoc(); applyEights(); updateHudCounts(); SFX.unlock();
    document.getElementById('hud-bar').style.display = 'flex';
    document.getElementById('emotes').style.display = 'flex';
    if (window.__afterStart === 'ar') setTimeout(openAR, 600); else if (window.__afterStart === 'events') setTimeout(openEvents, 600);
    const nia = CHARS.find(c => c.userData.key === 'nia'); if (nia && !window.__afterStart) setTimeout(() => talkTo(nia), 900);
  }, 1000);
};
function markReady() {
  if (window.__gardenReady) return; window.__gardenReady = true;
  const btn = document.getElementById('start-btn');
  if (btn) { btn.disabled = false; btn.textContent = '🌱 Enter the Garden'; }
  if (window.__pendingStart) window.__enterGarden();
}
// Merge static scenery, then pre-compile every shader in the background
window.__batch = staticBatch(scene);
for (const o of FLOATERS) cullAdd(o, 80);
for (const s of GAME_STONES) cullAdd(s.obj, 90, s.pos.clone());
for (const c of CHARS) cullAdd(c, 75);
{
  const btn = document.getElementById('start-btn'); if (btn && !window.__pendingStart) btn.textContent = '🌱 Enter the Garden';
  const done = () => markReady();
  try { (renderer.compileAsync ? renderer.compileAsync(scene, camera) : Promise.resolve(renderer.compile(scene, camera))).then(done, done); } catch (e) { done(); }
  setTimeout(done, 15000);
}
window.__dbg = { camera, controls, LM, CHARS, renderer, scene, groundAt, H, openGame, GAME, teleportTo, LIBRARY, rideLift, LIFTS, get onIsland() { return onIsland; }, get AR() { return AR; }, get SOCIAL() { return SOCIAL; } };
window.actNear = () => nearThing && nearThing.act();
