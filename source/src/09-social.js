// ═════════════════════════════════════════════════════════════════════════════
//  TOGETHER — multiplayer presence, chat, weekly events & live readings
//  (lights up only where the page runs inside Claude with sharing enabled;
//   everything else keeps working solo)
// ═════════════════════════════════════════════════════════════════════════════
const SOCIAL = { room: null, db: null, user: null, assets: null, me: null, myId: null, canHost: false, canWrite: null, events: [], rsvps: {}, live: null, deck: null, avatars: new Map(), lastSent: 0, lastPos: new THREE.Vector3(1e9, 0, 0) };
const sEl = (id) => document.getElementById(id);
const useCap = (n) => (window.claude && typeof window.claude.use === 'function') ? window.claude.use(n).catch(() => null) : Promise.resolve(null);

// ─── Built-in reading deck: cover + one card per chapter of the book ────────
const CHAPTERS = [
  [1, 'The Butterfly and the Gate', '🦋'], [2, 'Welcome to the Number Garden', '🌸'], [3, 'The Addition Bridge and Fraction Field', '➕'], [4, 'Wake Up Carlo the Counting Caterpillar', '🐛'],
  [5, 'Help Subby the Snail Subtract', '🐌'], [6, 'The Shape Greenhouse', '🔷'], [7, 'The Garden Blooms Brighter', '🌻'], [8, 'Milly and the Multiplication Trees', '🦋'],
  [9, 'Math is Everywhere!', '🔍'], [10, 'The Pattern Pond', '🪷'], [11, 'The Measurement Meadow', '📏'], [12, 'The Time Flower', '🕐'],
  [13, 'The Market of Money', '🪙'], [14, 'Skippy and Skip Counting', '🐿️'], [15, 'The Heart of the Garden', '❤️'], [16, 'Goodbye for Now', '🚪'],
  [17, 'Math Dreams', '☁️'], [18, 'Nia\'s Reflection', '📖'],
];
const BUILTIN_DECK = [{ builtin: 'cover', caption: 'Nia and the Number Garden — Deluxe Edition, by Darnell E. Clark' }, ...CHAPTERS.map(c => ({ builtin: 'ch' + c[0], caption: `Chapter ${c[0]}: ${c[1]}` }))];
const imgCache = new Map();
function loadImg(src) { if (imgCache.has(src)) return imgCache.get(src); const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => drawScreen(); im.src = src; imgCache.set(src, im); return im; }
function slideSrc(s) { return s.builtin === 'cover' ? COVER_URI : s.asset ? '/_blob/' + s.asset : null; }

// ─── Story screen + events board drawing ─────────────────────────────────────
function drawScreen() {
  const { canvas: c, tex } = LIBRARY.screen, x = c.getContext('2d'), W = c.width, Hh = c.height;
  const pg = x.createLinearGradient(0, 0, W, 0); pg.addColorStop(0, '#FFF6E2'); pg.addColorStop(0.48, '#F3E3C0'); pg.addColorStop(0.52, '#F3E3C0'); pg.addColorStop(1, '#FFF6E2'); x.fillStyle = pg; x.fillRect(0, 0, W, Hh);
  const live = SOCIAL.live, deck = (SOCIAL.deck?.slides?.length ? SOCIAL.deck.slides : BUILTIN_DECK);
  if (live?.active) {
    const s = deck[Math.max(0, Math.min(deck.length - 1, live.slide || 0))], src = slideSrc(s);
    if (src) { const im = loadImg(src); if (im.complete && im.naturalWidth) { const sc = Math.min((W - 80) / im.naturalWidth, (Hh - 150) / im.naturalHeight); const w = im.naturalWidth * sc, h = im.naturalHeight * sc; x.drawImage(im, (W - w) / 2, 30 + (Hh - 150 - h) / 2, w, h); } }
    else if (s.builtin?.startsWith('ch')) { const ch = CHAPTERS[Number(s.builtin.slice(2)) - 1]; D.text(x, ch[2], W / 2, 210, 160); D.text(x, 'Chapter ' + ch[0], W / 2, 360, 64, '#7B2CBF'); D.font(x, 58); x.fillStyle = '#2E7D32'; x.textAlign = 'center'; wrapText(x, ch[1], W / 2, 450, W - 200, 64); }
    const cap = live.caption || s.caption || '';
    x.fillStyle = 'rgba(60,20,110,0.86)'; x.fillRect(0, Hh - 110, W, 110); x.fillStyle = '#FFE27A'; D.font(x, 36); x.textAlign = 'center'; x.textBaseline = 'middle'; wrapText(x, cap.slice(0, 160), W / 2, Hh - 72, W - 80, 40);
    x.fillStyle = '#E63946'; x.beginPath(); x.roundRect(30, 26, 150, 52, 26); x.fill(); D.text(x, '● LIVE', 105, 53, 30, '#fff');
  } else {
    const im = loadImg(COVER_URI); if (im.complete && im.naturalWidth) x.drawImage(im, 70, 70, 560, 560);
    D.text(x, 'Story Time', 960, 120, 76, '#7B2CBF');
    const nx = upcoming(1)[0];
    if (nx) { D.text(x, 'Next reading:', 960, 230, 40, '#5A3A10'); D.font(x, 44); x.fillStyle = '#2E7D32'; x.textAlign = 'center'; wrapText(x, nx.ev.title, 960, 300, 560, 50); D.text(x, fmtWhen(nx.when), 960, 470, 38, '#3B1F5C'); }
    else D.text(x, 'Readings are announced here', 960, 300, 34, '#5A3A10');
    D.text(x, 'Walk up to the events board to RSVP!', 960, 600, 28, '#8B5A2B');
  }
  tex.needsUpdate = true;
}
function drawBoard() {
  const { canvas: c, tex } = LIBRARY.board, x = c.getContext('2d'), W = c.width, Hh = c.height;
  x.fillStyle = '#B9824F'; x.fillRect(0, 0, W, Hh); for (let i = 0; i < 300; i++) { x.fillStyle = `rgba(90,50,20,${Math.random() * 0.25})`; x.fillRect(Math.random() * W, Math.random() * Hh, 3, 3); }
  x.fillStyle = '#FFF8E7'; x.fillRect(30, 20, W - 60, 90); D.text(x, '📅 This Week at the Story Library', W / 2, 66, 46, '#5A189A');
  const list = upcoming(4);
  if (!list.length) D.text(x, SOCIAL.db ? 'No events scheduled yet' : 'Events appear in the shared garden', W / 2, 320, 36, '#FFF8E7');
  list.forEach((o, i) => { const y = 140 + i * 120; x.fillStyle = ['#FFF4B0', '#C8F1FF', '#FFD6E8', '#D8FFC8'][i % 4]; x.save(); x.translate(W / 2, y + 50); x.rotate((i % 2 ? 1 : -1) * 0.012); x.fillRect(-W / 2 + 50, -50, W - 100, 104); x.restore();
    x.fillStyle = '#E63946'; x.beginPath(); x.arc(80, y + 10, 10, 0, TAU); x.fill();
    D.text(x, (KIND_ICON[o.ev.kind] || '📖') + ' ' + o.ev.title.slice(0, 40), 110, y + 30, 34, '#3B1F5C', 'left');
    D.text(x, fmtWhen(o.when) + (SOCIAL.rsvps[o.ev.id]?.length ? `  ·  ${SOCIAL.rsvps[o.ev.id].length} going` : ''), 110, y + 75, 26, '#5A3A10', 'left'); });
  tex.needsUpdate = true;
}
const KIND_ICON = { reading: '📖', storytime: '📖', workshop: '✏️', games: '🎲', author: '🎤', tour: '🥽', party: '🎉' };

// ─── Weekly schedule maths (event times are stored in the host's time zone) ─
function tzOffsetMs(utc, tz) { const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(new Date(utc)).map(q => [q.type, q.value])); return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - utc; }
function wallToUtc(y, mo, d, hh, mm, tz) { const guess = Date.UTC(y, mo - 1, d, hh, mm); return guess - tzOffsetMs(guess - tzOffsetMs(guess, tz), tz); }
function occurrences(ev, days = 14) {
  const tz = ev.tz || 'America/New_York', [hh, mm] = String(ev.time || '10:00').split(':').map(Number), out = [], now = Date.now();
  if (ev.date) { const [y, mo, d] = ev.date.split('-').map(Number); const t = wallToUtc(y, mo, d, hh, mm, tz); if (t + (ev.durationMin || 60) * 6e4 > now) out.push(t); return out; }
  for (let k = -1; k <= days; k++) {
    const dayUtc = now + k * 864e5, p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' }).formatToParts(new Date(dayUtc)).map(q => [q.type, q.value]));
    const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
    if (wd !== Number(ev.weekday)) continue;
    const t = wallToUtc(+p.year, +p.month, +p.day, hh, mm, tz); if (t + (ev.durationMin || 60) * 6e4 > now && !out.includes(t)) out.push(t);
  }
  return out;
}
function upcoming(n = 6) { const all = []; for (const ev of SOCIAL.events) for (const t of occurrences(ev)) all.push({ ev, when: t }); return all.sort((a, b) => a.when - b.when).slice(0, n); }
function fmtWhen(t) { const d = new Date(t), now = Date.now(); const live = t <= now; return live ? 'Happening now!' : d.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }

// ─── Events & readings panel ─────────────────────────────────────────────────
window.openEvents = async () => {
  SFX.unlock(); sEl('events-panel').style.display = 'flex'; renderEvents();
};
window.closeEvents = () => { sEl('events-panel').style.display = 'none'; };
async function renderEvents() {
  const list = sEl('ev-list'); list.innerHTML = '';
  const up = upcoming(8);
  sEl('ev-note').textContent = !SOCIAL.db ? 'The live calendar works when you open the shared Number Garden link in Claude. Here is how it will look!' : (up.length ? 'Times are shown in your time zone.' : 'No events yet — check back soon!');
  const ids = Object.values(SOCIAL.rsvps).flat(); const profs = SOCIAL.user && ids.length ? await SOCIAL.user.profiles([...new Set(ids)]) : {};
  for (const o of up) {
    const card = document.createElement('div'); card.className = 'ev-card';
    const h = document.createElement('div'); h.className = 'ev-h'; h.textContent = `${KIND_ICON[o.ev.kind] || '📖'} ${o.ev.title}`;
    const w = document.createElement('div'); w.className = 'ev-w'; w.textContent = `${fmtWhen(o.when)} · ${o.ev.durationMin || 60} min${o.ev.date ? '' : ' · every week'}`;
    const ds = document.createElement('div'); ds.className = 'ev-d'; ds.textContent = o.ev.desc || '';
    const going = SOCIAL.rsvps[o.ev.id] || [], amIn = SOCIAL.myId && going.includes(SOCIAL.myId);
    const who = document.createElement('div'); who.className = 'ev-who'; who.textContent = going.length ? `${going.length} going: ${going.slice(0, 6).map(id => profs[id]?.name || 'A friend').join(', ')}${going.length > 6 ? '…' : ''}` : 'Be the first to RSVP!';
    const row = document.createElement('div'); row.className = 'ev-row';
    const b = document.createElement('button'); b.textContent = amIn ? '✅ Going — cancel' : '🙋 RSVP'; b.disabled = !SOCIAL.db || !SOCIAL.myId; b.onclick = () => toggleRsvp(o.ev.id);
    const go = document.createElement('button'); go.textContent = '📚 Go to the library'; go.onclick = () => { closeEvents(); goToLibrary(); };
    row.append(b, go);
    if (SOCIAL.canHost) { const del = document.createElement('button'); del.className = 'ghost'; del.textContent = '🗑 Remove'; del.onclick = async () => { if (confirm('Remove this event for everyone?')) { await SOCIAL.db.doc('events/' + o.ev.id).delete().catch(e => alert('Could not remove: ' + e.message)); } }; row.append(del); }
    card.append(h, w, ds, who, row); list.appendChild(card);
  }
  sEl('host-tools').style.display = SOCIAL.canHost ? 'block' : 'none';
  sEl('live-info').textContent = SOCIAL.live?.active ? `🔴 Live now: ${SOCIAL.live.title || 'Story Time'} — slide ${(SOCIAL.live.slide || 0) + 1}` : 'No reading is live right now.';
}
async function toggleRsvp(id) {
  if (!SOCIAL.db || !SOCIAL.myId) return; const ref = SOCIAL.db.doc('rsvps/' + SOCIAL.myId);
  const mine = Object.entries(SOCIAL.rsvps).filter(([, ids]) => ids.includes(SOCIAL.myId)).map(([k]) => k);
  const next = mine.includes(id) ? mine.filter(k => k !== id) : [...mine, id];
  try { await ref.set({ events: next }); SFX.right(); } catch (e) { alert('Your RSVP could not be saved here (you may have view-only access).'); }
}
window.addEvent = async () => {
  const f = (id) => sEl(id).value.trim(); if (!SOCIAL.canHost) return;
  const ev = { title: f('ev-title') || 'Story Time', kind: f('ev-kind'), weekday: Number(f('ev-day')), time: f('ev-time') || '10:00', tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York', durationMin: Number(f('ev-dur')) || 45, desc: f('ev-desc'), date: f('ev-date') || null };
  try { await SOCIAL.db.collection('events').add(ev); sEl('ev-title').value = sEl('ev-desc').value = sEl('ev-date').value = ''; SFX.right(); } catch (e) { alert('Could not add the event: ' + e.message); }
};
// Live reading controls (host)
const liveRef = () => SOCIAL.db.doc('live/reading');
window.startReading = async () => { if (!SOCIAL.canHost) return; const nx = upcoming(1)[0]; await liveRef().set({ active: true, title: sEl('live-title').value.trim() || nx?.ev.title || 'Story Time', slide: 0, caption: '', startedAt: Date.now(), host: SOCIAL.myId || null }).catch(e => alert(e.message)); };
window.endReading = async () => { if (!SOCIAL.canHost) return; await liveRef().set({ active: false, slide: 0, caption: '' }).catch(e => alert(e.message)); };
window.slideStep = async (d) => { if (!SOCIAL.canHost || !SOCIAL.live?.active) return; const n = (SOCIAL.deck?.slides?.length || BUILTIN_DECK.length); await liveRef().update({ slide: Math.max(0, Math.min(n - 1, (SOCIAL.live.slide || 0) + d)), caption: '' }).catch(() => {}); };
window.sendCaption = async () => { if (!SOCIAL.canHost || !SOCIAL.live?.active) return; const t = sEl('live-caption').value.trim(); await liveRef().update({ caption: t, captionAt: Date.now() }).catch(() => {}); sEl('live-caption').value = ''; };
window.uploadSlides = async (input) => {
  if (!SOCIAL.assets) { alert('Uploading pages needs editor access to this garden.'); return; }
  const files = [...input.files]; if (!files.length) return; const st = sEl('upload-status');
  const deck = { slides: [...(SOCIAL.deck?.slides?.length ? SOCIAL.deck.slides : BUILTIN_DECK)] };
  for (let i = 0; i < files.length; i++) { st.textContent = `Uploading ${i + 1} of ${files.length}…`; try { const a = await SOCIAL.assets.upload(files[i]); deck.slides.push({ asset: a.id, caption: files[i].name.replace(/\.[^.]+$/, '') }); } catch (e) { st.textContent = 'Upload failed: ' + e.message; return; } }
  await SOCIAL.db.doc('decks/main').set(deck).catch(e => alert(e.message)); st.textContent = `Added ${files.length} page${files.length > 1 ? 's' : ''} to the reading deck.`; input.value = '';
};
window.resetDeck = async () => { if (SOCIAL.canHost && confirm('Reset the reading deck to the built-in chapter cards?')) await SOCIAL.db.doc('decks/main').set({ slides: BUILTIN_DECK }).catch(() => {}); };

// ─── Avatars for everyone else in the garden ─────────────────────────────────
function makeAvatar(color) {
  const g = new THREE.Group(); let col; try { col = new THREE.Color(color || '#7B2CBF'); } catch (e) { col = new THREE.Color('#7B2CBF'); }
  const body = mk(new THREE.CapsuleGeometry(0.26, 0.5, 6, 14), new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.6, sheen: 0.6, sheenColor: new THREE.Color(0xffffff) }), g); body.position.y = 0.62;
  const head = grp(g); head.position.y = 1.22;
  mk(new THREE.SphereGeometry(0.24, 24, 18), skin(0xC98A5A), head);
  for (const s of [-1, 1]) { const e = mk(new THREE.SphereGeometry(0.035, 10, 8), std(0x1A0E08, 0.3), head); e.position.set(s * 0.08, 0.03, 0.21); }
  const smile = mk(new THREE.TorusGeometry(0.06, 0.012, 6, 16, Math.PI), std(0x6E2B1E), head); smile.position.set(0, -0.05, 0.21); smile.rotation.z = Math.PI;
  const hat = mk(new THREE.CylinderGeometry(0.2, 0.34, 0.12, 24), gloss(0xE0B860, 0.6), head); hat.position.y = 0.2;
  mk(new THREE.CylinderGeometry(0.16, 0.2, 0.16, 20), gloss(0xE0B860, 0.6), head).position.y = 0.3;
  const sprout = mk(new THREE.SphereGeometry(0.07, 10, 8), std(0x5EC43A), head); sprout.scale.set(1.4, 0.4, 0.7); sprout.position.set(0.05, 0.42, 0);
  const visor = mk(new THREE.BoxGeometry(0.34, 0.12, 0.1), gloss(0x222233, 0.2), head); visor.position.set(0, 0.03, 0.2); visor.visible = false;
  const hands = [-1, 1].map(s => { const h = mk(new THREE.SphereGeometry(0.06, 12, 10), skin(0xC98A5A), g); h.position.set(s * 0.32, 0.6, 0.1); return h; });
  const label = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false })); label.position.y = 1.85; label.scale.set(1.6, 0.4, 1); g.add(label);
  const emo = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false })); emo.position.y = 2.35; emo.scale.set(0.6, 0.6, 1); emo.visible = false; g.add(emo);
  return { g, head, hands, visor, label, emo, target: new THREE.Vector3(), ry: 0, name: null, emoUntil: 0 };
}
function nameTex(text, color) { return canvasTex(512, 128, (x) => { x.fillStyle = 'rgba(25,10,50,0.8)'; x.beginPath(); x.roundRect(6, 14, 500, 100, 50); x.fill(); x.strokeStyle = color || '#FFD24A'; x.lineWidth = 6; x.stroke(); x.fillStyle = '#fff'; x.font = '52px "Fredoka One", Arial'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text.slice(0, 18), 256, 66); }); }
function emojiTex(e) { return canvasTex(128, 128, (x) => { x.font = '96px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(e, 64, 72); }); }
async function syncAvatars(peers) {
  const seen = new Set(), ids = peers.filter(p => p.by).map(p => p.by);
  const profs = SOCIAL.user && ids.length ? await SOCIAL.user.profiles(ids) : {};
  for (const p of peers) {
    if (p.sameTab || p.kind !== 'viewer') continue; seen.add(p.peer);
    const pr = p.presence || {}; if (!Array.isArray(pr.p)) continue;
    let a = SOCIAL.avatars.get(p.peer);
    if (!a) { a = makeAvatar(profs[p.by]?.color || pr.c); scene.add(a.g); a.g.position.set(pr.p[0], pr.p[1], pr.p[2]); SOCIAL.avatars.set(p.peer, a); }
    const nm = (profs[p.by]?.name || (typeof pr.n === 'string' ? pr.n : '') || 'Explorer') + (p.guest ? ' ✦' : '') + (pr.m === 'v' ? ' 🥽' : pr.m === 'm' ? ' 📱' : '');
    if (nm !== a.name) { a.name = nm; a.label.material.map?.dispose(); a.label.material.map = nameTex(nm, profs[p.by]?.color); a.label.material.needsUpdate = true; }
    a.target.set(pr.p[0], pr.p[1], pr.p[2]); a.ry = Number(pr.r) || 0; a.vr = pr.m === 'v'; a.handsP = pr.hd; a.headP = pr.hp;
    if (pr.e && pr.et && pr.et !== a.emoT) { a.emoT = pr.et; a.emo.material.map = emojiTex(String(pr.e).slice(0, 4)); a.emo.material.needsUpdate = true; a.emoUntil = clockT + 3.5; }
  }
  for (const [k, a] of SOCIAL.avatars) if (!seen.has(k)) { scene.remove(a.g); SOCIAL.avatars.delete(k); }
  const n = SOCIAL.avatars.size; const el = sEl('hud-people'); if (el) { el.textContent = `👥 ${n + 1}`; el.title = n ? `${n} other explorer${n > 1 ? 's' : ''} here` : 'Just you right now'; }
}
function updateAvatars(t, dt) {
  for (const a of SOCIAL.avatars.values()) {
    a.g.position.lerp(a.target, Math.min(1, dt * 8)); let d = a.ry - a.g.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); a.g.rotation.y += d * Math.min(1, dt * 8);
    a.visor.visible = !!a.vr; a.g.children[0].position.y = 0.62 + Math.sin(t * 2 + a.ry) * 0.01;
    if (a.vr && Array.isArray(a.handsP)) { a.hands.forEach((h, i) => { const q = a.handsP[i]; if (Array.isArray(q)) h.position.set(q[0], q[1], q[2]); }); }
    else a.hands.forEach((h, i) => h.position.set((i ? 1 : -1) * 0.32, 0.6 + Math.sin(t * 3 + i * 2) * 0.03, 0.1));
    a.emo.visible = clockT < a.emoUntil; if (a.emo.visible) a.emo.position.y = 2.35 + Math.sin(t * 4) * 0.08;
  }
}
// My own presence — sent at most ~8×/second and only when I move
function sendMyPresence(focus, xr) {
  if (!SOCIAL.room) return; const now = performance.now(); if (now - SOCIAL.lastSent < 125) return;
  const moved = SOCIAL.lastPos.distanceToSquared(focus) > 0.0025; if (!moved && now - SOCIAL.lastSent < 2000) return;
  SOCIAL.lastSent = now; SOCIAL.lastPos.copy(focus);
  camera.getWorldDirection(_f); const ry = Math.atan2(_f.x, _f.z), m = xr ? 'v' : isMobile ? 'm' : 'd';
  const p = { p: [+focus.x.toFixed(2), +(groundAt(focus.x, focus.z)).toFixed(2), +focus.z.toFixed(2)], r: +ry.toFixed(2), m, z: curLoc.slice(0, 40) };
  if (xr) { const cam = renderer.xr.getCamera(); const inv = new THREE.Matrix4().copy(dolly.matrixWorld).invert(); p.hd = xrControllers.map(c => { const v = new THREE.Vector3().setFromMatrixPosition(c.matrixWorld).applyMatrix4(inv); return [+v.x.toFixed(2), +v.y.toFixed(2), +v.z.toFixed(2)]; }); }
  SOCIAL.room.presence(p).catch(() => {});
}
window.sendEmote = (e) => { SFX.tap(); if (!SOCIAL.room) { showToast(`${e} (emotes are shared when friends are in the garden with you)`); return; } SOCIAL.room.presence({ e, et: Date.now() }).catch(() => {}); showToast(`You sent ${e}`); };
window.sendChat = () => {
  const inp = sEl('chat-input'), t = inp.value.trim(); if (!t) return; inp.value = '';
  if (!SOCIAL.room) { addChat('You', t, true); return; }
  SOCIAL.room.emit('chat', { t: t.slice(0, 280) }).catch(e => addChat('Garden', e.code === 'not_permitted' ? 'Chat is open to members with Contributor access.' : 'Message not sent.', false));
};
function addChat(who, text, me) { const box = sEl('chat-log'); const d = document.createElement('div'); d.className = 'chat-line' + (me ? ' me' : ''); const b = document.createElement('b'); b.textContent = who + ': '; const s = document.createElement('span'); s.textContent = text; d.append(b, s); box.appendChild(d); while (box.children.length > 40) box.firstChild.remove(); box.scrollTop = box.scrollHeight; sEl('chat').classList.add('has'); }
function showToast(t) { const el = sEl('toast'); el.textContent = t; el.style.opacity = 1; clearTimeout(showToast._t); showToast._t = setTimeout(() => el.style.opacity = 0, 2600); }
window.goToLibrary = () => { const s = LIBRARY.seats[Math.floor(Math.random() * LIBRARY.seats.length)]; teleportTo(s.x + 0.6, s.z, Math.PI / 2 + Math.PI); };

// ─── Boot: connect whatever this view offers ─────────────────────────────────
(async () => {
  drawScreen(); drawBoard();
  const [room, db, user, assets] = await Promise.all([useCap('room'), useCap('db'), useCap('user'), useCap('assets')]);
  Object.assign(SOCIAL, { room, db, user, assets });
  if (user) { SOCIAL.me = await user.me(); SOCIAL.myId = SOCIAL.me.id; SOCIAL.canHost = await user.canEdit(); }
  if (db) {
    db.collection('events').onSnapshot(s => { SOCIAL.events = s.docs.map(d => ({ id: d.id, ...d.data() })); drawBoard(); drawScreen(); if (sEl('events-panel').style.display === 'flex') renderEvents(); }, () => {});
    db.collection('rsvps').onSnapshot(s => { const r = {}; s.docs.forEach(d => (d.data().events || []).forEach(e => (r[e] ||= []).push(d.id))); SOCIAL.rsvps = r; drawBoard(); if (sEl('events-panel').style.display === 'flex') renderEvents(); }, () => {});
    db.doc('decks/main').onSnapshot(s => { SOCIAL.deck = s.exists ? s.data() : null; drawScreen(); }, () => {});
    let lastCap = '';
    db.doc('live/reading').onSnapshot(s => {
      SOCIAL.live = s.exists ? s.data() : null; drawScreen();
      const ban = sEl('live-banner'); if (SOCIAL.live?.active) { ban.style.display = 'flex'; sEl('live-banner-text').textContent = `🔴 Live at the Story Library: ${SOCIAL.live.title || 'Story Time'}`; } else ban.style.display = 'none';
      const cap = SOCIAL.live?.active ? (SOCIAL.live.caption || '') : ''; if (cap && cap !== lastCap && sEl('narrate')?.checked && LIBRARY.inside(controls.target.x, controls.target.z)) speak(cap); lastCap = cap;
      if (sEl('events-panel').style.display === 'flex') renderEvents();
    }, () => {});
    // progress follows you across devices
    if (SOCIAL.myId) {
      const pref = db.doc('data/users/' + SOCIAL.myId + '/progress');
      pref.get().then(s => { if (!s.exists) return; const d = s.data(); for (const [k, g] of Object.entries(d.games || {})) { const m = PROG.games[k]; if (!m || (g.stars || 0) > (m.stars || 0)) PROG.games[k] = g; } PROG.eights = [...new Set([...(PROG.eights || []), ...(d.eights || [])])]; saveProgress(); applyEights(); }).catch(() => {});
      let tmr = null; progressListeners.push(() => { clearTimeout(tmr); tmr = setTimeout(() => pref.set({ games: PROG.games, eights: PROG.eights, at: Date.now() }).catch(() => {}), 1500); });
    }
  }
  if (room) {
    room.onPeers(ch => syncAvatars(ch.peers), () => {});
    room.on('chat', async (m) => { const t = typeof m.data?.t === 'string' ? m.data.t : ''; if (!t) return; let who = 'Explorer'; if (m.isMe) who = 'You'; else if (m.by && SOCIAL.user) { const ps = await SOCIAL.user.profiles([m.by]); who = ps[m.by]?.name || 'Explorer'; } addChat(who + (m.guest ? ' ✦' : ''), t, m.isMe); if (!m.isMe) SFX.tap(); }, () => {});
    sEl('chat').style.display = 'flex';
  }
  sEl('hud-people').style.display = room ? 'inline-flex' : 'none';
})();
