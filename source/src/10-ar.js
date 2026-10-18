// ═════════════════════════════════════════════════════════════════════════════
//  AR — a 3D Nia Brown + "Catch the Number Butterfly"
//  Real AR (camera + floor placement) on WebXR-AR phones/headsets;
//  a magical stage everywhere else.
// ═════════════════════════════════════════════════════════════════════════════
const AR = { active: false, xr: false, scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.02, 100), anchor: new THREE.Group(), placed: false, flies: [], game: null, hitSource: null, reticle: null, controls: null, video: null };
{
  const S = AR.scene; S.environment = scene.environment;
  S.add(new THREE.HemisphereLight(0xFFF4E0, 0x6B8F4A, 1.2));
  const d = new THREE.DirectionalLight(0xFFE9C2, 2.2); d.position.set(2, 4, 3); d.castShadow = true; d.shadow.mapSize.set(1024, 1024); const sc = d.shadow.camera; sc.left = sc.bottom = -3; sc.right = sc.top = 3; S.add(d, d.target);
  S.add(AR.anchor);
  // Nia (her own copy, removed from the garden's character list)
  const nia = buildNia(); CHARS.splice(CHARS.indexOf(nia), 1); scene.remove(nia);
  AR.nia = nia; nia.scale.setScalar(0.8); AR.anchor.add(nia);
  // shadow catcher + little flower stage (the stage is hidden in camera AR)
  const shadowM = new THREE.ShadowMaterial({ opacity: 0.3 }); const sh = new THREE.Mesh(new THREE.CircleGeometry(2.5, 48).rotateX(-Math.PI / 2), shadowM); sh.receiveShadow = true; AR.anchor.add(sh);
  const stage = grp(AR.anchor); AR.stage = stage;
  const disc = mk(new THREE.CylinderGeometry(2.4, 2.6, 0.2, 64).translate(0, -0.1, 0), texMat(texClone(TEX.grass, 4, 4), 0x7CC444, 0.95, 0.8), stage, false, true);
  const fl = new THREE.InstancedMesh(flowerProto.petals, petalMat, 60), fb = new THREE.InstancedMesh(flowerProto.base, flowerBaseMat, 60);
  for (let i = 0; i < 60; i++) { const a = rand() * TAU, r = rr(1.4, 2.3); setInst(fl, i, Math.cos(a) * r, 0, Math.sin(a) * r, rand() * TAU, 0.9); setInst(fb, i, Math.cos(a) * r, 0, Math.sin(a) * r, rand() * TAU, 0.9); fl.setColorAt(i, _c.setHex(FLOWER_COLS[i % 8])); }
  stage.add(fl, fb);
  const sky = new THREE.Mesh(new THREE.SphereGeometry(40, 32, 16), skyMat); sky.frustumCulled = false; stage.add(sky);
  const spk = makeSparkles(120, () => new THREE.Vector3(rr(-2.5, 2.5), rr(0.2, 2.5), rr(-2.5, 2.5)), 0.12); scene.remove(spk); stage.add(spk);
  // reticle for floor placement in camera AR
  const ret = new THREE.Mesh(new THREE.RingGeometry(0.12, 0.16, 36).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xFFD86B })); ret.matrixAutoUpdate = false; ret.visible = false; S.add(ret); AR.reticle = ret;
  AR.camera.position.set(0, 1.4, 3.2);
}
// ─── Number butterflies ──────────────────────────────────────────────────────
const FLY_COLS = [['#FF4D8F', '#FFC2DD'], ['#3A86FF', '#BFE0FF'], ['#FFB703', '#FFE9A8'], ['#8B5CF6', '#E2CCFF'], ['#2EC4B6', '#C8FFF6'], ['#FF7A1A', '#FFD8B5']];
function flyWingTex(n, col) {
  return canvasTex(256, 256, (x) => {
    const [c1, c2] = col; x.clearRect(0, 0, 256, 256);
    const g = x.createRadialGradient(20, 128, 10, 60, 128, 240); g.addColorStop(0, c2); g.addColorStop(1, c1); x.fillStyle = g;
    x.beginPath(); x.moveTo(8, 128); x.bezierCurveTo(60, -20, 270, 0, 240, 110); x.bezierCurveTo(230, 130, 170, 136, 130, 132); x.bezierCurveTo(210, 160, 210, 250, 130, 244); x.bezierCurveTo(80, 240, 20, 180, 8, 128); x.fill();
    x.strokeStyle = 'rgba(40,10,40,0.85)'; x.lineWidth = 8; x.stroke();
    x.fillStyle = '#fff'; x.beginPath(); x.arc(150, 80, 52, 0, TAU); x.fill(); x.strokeStyle = c1; x.lineWidth = 6; x.stroke();
    x.fillStyle = '#2B1A40'; x.font = `${String(n).length > 2 ? 52 : 70}px "Fredoka One", Arial`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(n), 150, 84);
  });
}
function makeFly(n) {
  const g = new THREE.Group(), col = pick(FLY_COLS), tex = flyWingTex(n, col);
  const wm = new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.1, side: THREE.DoubleSide, roughness: 0.5, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.25 });
  const wg = new THREE.PlaneGeometry(0.34, 0.34); wg.translate(0.17, 0, 0); wg.rotateX(-Math.PI / 2 + 0.2);
  const L = new THREE.Mesh(wg, wm), R = new THREE.Mesh(wg, wm); R.scale.x = -1; L.castShadow = R.castShadow = true;
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.16, 4, 8).rotateX(Math.PI / 2), std(0x2B1A10, 0.5));
  const hit = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
  g.add(L, R, body, hit); g.userData = { n, L, R, hit, ph: rand() * 100, sp: rr(0.35, 0.6), rad: rr(0.6, 1.4), h: rr(0.5, 1.6), alive: true };
  hit.userData.fly = g; return g;
}
// ─── Game rounds: catch the right number ─────────────────────────────────────
function arTarget(level) {
  if (level === 0) { const n = ri(1, 10); return { ans: n, say: `Catch the butterfly with number ${n}!`, test: v => v === n, pool: () => ri(1, 10) }; }
  if (level === 1) { const a = ri(1, 9), b = ri(1, 9 - Math.min(8, a - 1)); const n = a + b; return { ans: n, say: `Catch the answer: ${a} + ${b}`, test: v => v === n, pool: () => Math.max(1, n + ri(-4, 4)) }; }
  if (Math.random() < 0.5) { const even = Math.random() < 0.5; return { say: `Catch an ${even ? 'EVEN' : 'ODD'} number!`, test: v => (v % 2 === 0) === even, pool: () => ri(1, 20), ans: even ? 2 * ri(1, 10) : 2 * ri(0, 9) + 1 }; }
  const a = ri(2, 5), b = ri(2, 5), n = a * b; return { ans: n, say: `Catch the answer: ${a} × ${b}`, test: v => v === n, pool: () => Math.max(1, n + ri(-6, 6)) };
}
function arNewRound() {
  const G = AR.game; G.t = arTarget(G.level);
  for (const f of AR.flies) AR.anchor.remove(f); AR.flies = [];
  const nums = new Set([G.t.ans]); while (nums.size < 6) { const v = G.t.pool(); if (!G.t.test(v) || G.level === 2) nums.add(v); if (nums.size < 6 && G.level === 2) nums.add(G.t.pool()); }
  [...nums].slice(0, 6).forEach(n => { const f = makeFly(n); AR.anchor.add(f); AR.flies.push(f); });
  sEl('ar-prompt').textContent = G.t.say; speak(G.t.say); AR.nia.userData.excite = 1.2;
}
window.arStart = (level) => {
  SFX.unlock(); AR.game = { level: level ?? AR.game?.level ?? 0, score: 0, time: 60, running: true, streak: 0 };
  sEl('ar-start').style.display = 'none'; sEl('ar-play').style.display = 'flex'; arNewRound();
};
function arCatch(fly) {
  const G = AR.game; if (!G?.running || !fly.userData.alive) return;
  const v = fly.userData.n, wp = new THREE.Vector3(); fly.getWorldPosition(wp);
  if (G.t.test(v)) {
    fly.userData.alive = false; G.score++; G.streak++; SFX.right(); burst(wp, 0xFFD86B, 50);
    sEl('ar-score').textContent = `⭐ ${G.score}`; sEl('ar-prompt').textContent = pick(['Got it!', 'Nice catch!', 'Butterfly buddy!', 'Amazing!']) + (G.streak > 2 ? ` 🔥 ${G.streak} in a row!` : '');
    AR.nia.userData.excite = 2; setTimeout(() => G.running && arNewRound(), 900);
  } else { G.streak = 0; SFX.wrong(); fly.userData.rad = 1.9; fly.userData.sp *= 1.6; sEl('ar-prompt').textContent = `That one is ${v}. ${G.t.say}`; }
}
function arEnd() {
  const G = AR.game; G.running = false; SFX.win(); PROG.ar = Math.max(PROG.ar || 0, G.score); saveProgress();
  sEl('ar-prompt').textContent = `Time! You caught ${G.score} butterflies. Best: ${PROG.ar} ⭐`; speak(`Great job! You caught ${G.score} butterflies!`);
  sEl('ar-play').style.display = 'none'; sEl('ar-start').style.display = 'flex';
  for (let i = 0; i < 5; i++) setTimeout(() => burst(new THREE.Vector3(rr(-1, 1), 1.5, rr(-1, 1)).applyMatrix4(AR.anchor.matrixWorld), pick([0xFFD86B, 0xFF8FD0, 0x9FE0FF]), 60), i * 200);
}
// ─── Open / close ────────────────────────────────────────────────────────────
window.openAR = async () => {
  SFX.unlock(); AR.active = true; controls.enabled = false; document.body.classList.add('ar-on'); closeDialog();
  sEl('ar-hud').style.display = 'flex'; sEl('ar-play').style.display = 'none'; sEl('ar-start').style.display = 'flex';
  sEl('ar-prompt').textContent = 'Nia: "Help me catch the number butterflies!"';
  AR.anchor.position.set(0, 0, 0); AR.anchor.scale.setScalar(1); AR.stage.visible = true; AR.placed = true;
  if (!AR.controls) { AR.controls = new OrbitControls(AR.camera, renderer.domElement); AR.controls.target.set(0, 0.9, 0); AR.controls.enableDamping = true; AR.controls.maxPolarAngle = Math.PI * 0.49; AR.controls.minDistance = 1.5; AR.controls.maxDistance = 6; }
  AR.controls.enabled = true; AR.camera.aspect = innerWidth / innerHeight; AR.camera.fov = innerWidth / innerHeight < 0.8 ? 70 : 55; AR.camera.updateProjectionMatrix();
  const ok = navigator.xr ? await navigator.xr.isSessionSupported('immersive-ar').catch(() => false) : false;
  sEl('ar-camera').style.display = ok ? 'inline-block' : 'none';
  sEl('ar-note').textContent = ok ? 'Tap "📷 Use my camera" to put Nia in your room!' : 'Camera AR needs a phone or headset with WebXR AR (e.g. Android Chrome, Meta Quest). Playing on the magic stage instead!';
};
window.closeAR = async () => {
  if (AR.xr) { try { await renderer.xr.getSession()?.end(); } catch (e) {} }
  AR.active = false; if (AR.game) AR.game.running = false; controls.enabled = true; if (AR.controls) AR.controls.enabled = false;
  sEl('ar-hud').style.display = 'none'; document.body.classList.remove('ar-on');
};
window.startCameraAR = async () => {
  try {
    const session = await navigator.xr.requestSession('immersive-ar', { requiredFeatures: ['hit-test'], optionalFeatures: ['dom-overlay', 'local-floor'], domOverlay: { root: sEl('ar-hud') } });
    AR.xr = true; AR.placed = false; AR.stage.visible = false; AR.anchor.visible = false;
    renderer.xr.setReferenceSpaceType('local'); await renderer.xr.setSession(session);
    const viewer = await session.requestReferenceSpace('viewer'); AR.hitSource = await session.requestHitTestSource({ space: viewer });
    sEl('ar-note').textContent = 'Point at the floor or a table, then tap to place Nia.';
    const c = renderer.xr.getController(0); AR.anchor.parent || AR.scene.add(AR.anchor);
    const onSel = () => {
      if (!AR.placed && AR.reticle.visible) { AR.anchor.position.setFromMatrixPosition(AR.reticle.matrix); AR.anchor.scale.setScalar(0.75); AR.anchor.visible = true; AR.placed = true; sEl('ar-note').textContent = 'Tap the butterflies to catch them!'; if (!AR.game?.running) arStart(); return; }
      const m = new THREE.Matrix4().extractRotation(c.matrixWorld); ray.ray.origin.setFromMatrixPosition(c.matrixWorld); ray.ray.direction.set(0, 0, -1).applyMatrix4(m);
      const hit = ray.intersectObjects(AR.flies.map(f => f.userData.hit), false)[0]; if (hit) arCatch(hit.object.userData.fly);
    };
    c.addEventListener('select', onSel); AR.scene.add(c);
    session.addEventListener('end', () => { AR.xr = false; AR.hitSource = null; c.removeEventListener('select', onSel); renderer.xr.setReferenceSpaceType('local-floor'); AR.anchor.visible = true; AR.stage.visible = true; AR.anchor.position.set(0, 0, 0); AR.anchor.scale.setScalar(1); });
  } catch (e) { sEl('ar-note').textContent = 'The camera could not start here (' + (e.message || e.name) + '). Playing on the magic stage!'; }
};
renderer.domElement.addEventListener('pointerdown', (e) => {
  if (!AR.active || AR.xr) return; AR._down = [e.clientX, e.clientY];
});
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!AR.active || AR.xr || !AR._down || Math.hypot(e.clientX - AR._down[0], e.clientY - AR._down[1]) > 8) return;
  mouseV.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(mouseV, AR.camera);
  const hit = ray.intersectObjects(AR.flies.map(f => f.userData.hit), false)[0]; if (hit) arCatch(hit.object.userData.fly);
});
// ─── Per-frame ───────────────────────────────────────────────────────────────
function updateAR(t, dt, frame) {
  if (!AR.active) return;
  const G = AR.game;
  if (G?.running) { G.time -= dt; sEl('ar-time').textContent = `⏱ ${Math.max(0, Math.ceil(G.time))}`; if (G.time <= 0) arEnd(); }
  for (const f of AR.flies) {
    const u = f.userData; if (!u.alive) { f.scale.multiplyScalar(0.9); f.position.y += dt * 1.5; continue; }
    const a = t * u.sp + u.ph, x = Math.cos(a) * u.rad + Math.sin(a * 2.1) * 0.25, z = Math.sin(a * 1.3) * u.rad, y = u.h + Math.sin(a * 2.7) * 0.2;
    const prev = f.position.clone(); f.position.set(x, y, z); if (prev.distanceToSquared(f.position) > 1e-6) f.lookAt(prev.lerp(f.position, 2));
    const fl = Math.sin(t * 16 + u.ph) * 1.0; u.L.rotation.z = fl; u.R.rotation.z = -fl;
    if (u.rad > 1.5) u.rad -= dt * 0.4;
  }
  AR.nia.userData.update(t, dt, AR.xr ? new THREE.Vector3().setFromMatrixPosition(renderer.xr.getCamera().matrixWorld).applyMatrix4(new THREE.Matrix4().copy(AR.anchor.matrixWorld).invert()) : AR.camera.position, AR.nia.userData);
  if (AR.xr && frame && AR.hitSource && !AR.placed) {
    const ref = renderer.xr.getReferenceSpace(), hits = frame.getHitTestResults(AR.hitSource);
    if (hits.length) { const pose = hits[0].getPose(ref); AR.reticle.visible = true; AR.reticle.matrix.fromArray(pose.transform.matrix); } else AR.reticle.visible = false;
  } else AR.reticle.visible = false;
  if (!AR.xr && AR.controls) AR.controls.update();
}
