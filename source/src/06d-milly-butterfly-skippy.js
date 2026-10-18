// ═════════════════════════════════════════════════════════════════════════════
//  MILLY THE MULTIPLICATION MOTH · NUMBER EIGHT BUTTERFLY · SKIPPY THE SQUIRREL
// ═════════════════════════════════════════════════════════════════════════════
// Purple wings with glowing gold rim + a pattern drawn by `deco` (dots / 8s)
function magicWing(kind, deco, baseA = '#4A148C', baseB = '#9D4EDD') {
  const col = canvasTex(512, 512, (x, w, h) => {
    wingPath(x, w, h, kind); x.save(); x.clip();
    const g = x.createRadialGradient(w * 0.1, h * 0.55, 10, w * 0.4, h * 0.5, w * 0.8); g.addColorStop(0, baseB); g.addColorStop(1, baseA); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(40,0,70,0.35)'; x.lineWidth = 4; for (let i = 0; i < 6; i++) { x.beginPath(); x.moveTo(4, h * 0.55); x.quadraticCurveTo(w * 0.4, h * (0.1 + i * 0.16), w, h * (i * 0.2)); x.stroke(); }
    for (let i = 0; i < 70; i++) { x.fillStyle = `rgba(255,255,255,${Math.random() * 0.5})`; x.beginPath(); x.arc(Math.random() * w, Math.random() * h, Math.random() * 2.5, 0, TAU); x.fill(); }
    deco(x, w, h, false); x.restore();
    wingPath(x, w, h, kind); x.lineWidth = 22; x.strokeStyle = '#F7C35A'; x.stroke();
  });
  const emi = canvasTex(512, 512, (x, w, h) => {
    x.fillStyle = '#000'; x.fillRect(0, 0, w, h); wingPath(x, w, h, kind); x.lineWidth = 16; x.strokeStyle = '#B07A20'; x.stroke();
    x.save(); wingPath(x, w, h, kind); x.clip(); deco(x, w, h, true); x.restore();
  });
  return [col, emi];
}
const dotGrid = (cols, rows, cx, cy, sp, r) => (x, w, h, emissive) => {
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const px = w * cx + (i - (cols - 1) / 2) * w * sp, py = h * cy + (j - (rows - 1) / 2) * h * sp;
    const g = x.createRadialGradient(px, py, 0, px, py, w * r * 1.5); g.addColorStop(0, emissive ? '#FFF6C0' : '#FFFBE0'); g.addColorStop(0.55, emissive ? '#FFC94D' : '#FFD86B'); g.addColorStop(1, 'rgba(255,190,60,0)');
    x.fillStyle = g; x.beginPath(); x.arc(px, py, w * r * 1.5, 0, TAU); x.fill();
  }
};
function mothBody(par, COL, { headR = 0.22, eyeCol = 0x7B2CBF, ruff = 0xFFF0D2, antennaCurl = false } = {}) {
  const thorax = fur(new THREE.SphereGeometry(0.17, 32, 24), COL, { len: 0.03, density: [40, 25] }, par); thorax.position.set(0, 0.62, 0); thorax.scale.set(1, 1.15, 0.95);
  const ruffM = fur(lumpy(new THREE.SphereGeometry(0.14, 32, 24), 0.12, 7, 5), ruff, { len: 0.045, density: [40, 25], gravity: 0.2 }, par); ruffM.position.set(0, 0.72, 0.07); ruffM.scale.set(1.15, 0.8, 0.8);
  for (let i = 0; i < 5; i++) { const s = mk(new THREE.SphereGeometry(0.15 - i * 0.022, 28, 18), felt(i % 2 ? COL : new THREE.Color(COL).multiplyScalar(0.88).getHex()), par); s.position.set(0, 0.46 - i * 0.1, -0.03 - i * 0.025); s.scale.set(1, 0.7, 1); }
  const head = grp(par); head.position.set(0, 0.96, 0.03);
  const R = headR, S = new THREE.Vector3(1.05, 1, 0.95);
  fur(new THREE.SphereGeometry(R, 48, 32), COL, { len: 0.022, density: [70, 35] }, head).scale.copy(S);
  const eyes = [-1, 1].map(s => makeEye(head, onSphere(R, S, s * 0.36, 0.0, -0.03), R * 0.33, eyeCol, felt(COL), { lash: s }));
  const ants = [];
  for (const s of [-1, 1]) {
    const pts = antennaCurl ? [[s * 0.06, R * 0.85, 0.02], [s * 0.12, R + 0.18, 0.05], [s * 0.2, R + 0.28, 0.06], [s * 0.26, R + 0.26, 0.06], [s * 0.25, R + 0.2, 0.06], [s * 0.21, R + 0.21, 0.06]] : [[s * 0.06, R * 0.85, 0.02], [s * 0.12, R + 0.2, 0.05], [s * 0.2, R + 0.34, 0.08]];
    mk(taperTube(pts, 0.014, 0.01, 20, 8), felt(new THREE.Color(COL).multiplyScalar(0.8).getHex()), head);
    if (!antennaCurl) { const b = mk(new THREE.SphereGeometry(0.04, 14, 10), new THREE.MeshStandardMaterial({ color: 0xFFE680, emissive: 0xFFC94D, emissiveIntensity: 2, roughness: 0.3 }), head, false); b.position.set(...pts[2]); b.userData.keep = true; ants.push(b); }
  }
  const arms = [-1, 1].map(s => { const a = grp(par); a.position.set(s * 0.13, 0.66, 0.06); mk(taperTube([[0, 0, 0], [s * 0.1, -0.12, 0.05], [s * 0.12, -0.26, 0.08]], 0.025, 0.018, 12, 8), felt(COL), a); const h = mk(new THREE.SphereGeometry(0.03, 12, 10), felt(COL), a); h.position.set(s * 0.12, -0.28, 0.08); a.rotation.z = s * 0.3; return a; });
  for (const s of [-1, 1]) { const l = mk(taperTube([[s * 0.06, 0.4, 0.05], [s * 0.1, 0.2, 0.08], [s * 0.09, 0.05, 0.1]], 0.022, 0.016, 10, 8), felt(COL), par); }
  return { head, eyes, ants, arms, R, S };
}

// ─── MILLY ───────────────────────────────────────────────────────────────────
function buildMilly() {
  const root = grp(), body = grp(root), COL = 0xF2B24C;
  const m = mothBody(body, COL, { headR: 0.23, eyeCol: 0x7B2CBF });
  const paint = (open) => (x, map, px) => { for (const s of [-1, 1]) paintBrow(x, map, px, s * 0.36, 0.36, 0.22, 0.035, '#8A5A1A', -s * 0.15, 0.4); paintBlush(x, map, px, 0.55, -0.22, 0.15, 'rgba(255,120,110,0.4)'); paintMouth(x, map, px, -0.33, 0.55, open, { lip: '#8A4A12', inner: '#6B1A12', tongue: '#F06A6A', smile: 1.3 }); };
  const face = faceDecal(m.head, m.R + 0.016, m.S, { w: 2.0, t0: 0.75, tl: 1.45 }, paint(0.16));
  const mouthOpen = face.make(paint(0.26));
  // wings: upper 2×3 dot arrays, lower 2×2
  const [uc, ue] = magicWing('upper', dotGrid(2, 3, 0.55, 0.47, 0.17, 0.055)), [lc, le] = magicWing('lower', dotGrid(2, 2, 0.52, 0.56, 0.2, 0.06));
  const wings = grp(body); wings.position.set(0, 0.68, -0.12); const W = [];
  for (const s of [-1, 1]) {
    const piv = grp(wings);
    const u = wingPlane(0.95, 0.95, uc, ue, { glow: 1.6, irid: 0.15, sheen: 0 }); u.position.y = 0.2; const l = wingPlane(0.72, 0.72, lc, le, { glow: 1.6, irid: 0.15, sheen: 0 }); l.position.y = -0.22;
    for (const w of [u, l]) { w.rotation.y = s > 0 ? 0 : Math.PI; piv.add(w); }
    W.push([piv, s]);
  }
  return registerChar(root, {
    key: 'milly', name: 'Milly the Multiplication Moth', height: 1.35, hitR: 0.7, hitY: -0.2,
    rig: { body, head: m.head, eyes: m.eyes, mouth: { mat: face.mat, closed: face.mat.map, open: mouthOpen } },
    dialog: [
      'Hello! I\'m Milly the Multiplication Moth. Multiplication is counting in beautiful groups!',
      'This orchard has 3 rows of 4 trees. 3 × 4 = 12 trees!',
      'Count the glowing dots on my top wing: 2 groups of 3 makes 6!',
      'Every tree has 4 golden fruits. 12 trees × 4 fruits = 48 fruits!',
      'Arrays make multiplication easier to see. Rows times columns!'
    ],
    update: (t, dt, focus, ud) => {
      const near = (ud.dist ?? 99) < 7, L = LM.orchard;
      ud.a = (ud.a ?? 0) + (near ? 0 : dt * 0.18);
      const x = L.x + Math.cos(ud.a) * 7.5, z = L.z + 5 + Math.sin(ud.a) * 2.2;
      root.position.set(x, H(x, z) + 1.5 + Math.sin(t * 1.8) * 0.18, z);
      if (!near) root.rotation.y = ud.a + Math.PI; else { root.rotation.y += (Math.atan2(focus.x - x, focus.z - z) - root.rotation.y) * 0.05; }
      W.forEach(([p, s]) => { p.rotation.y = s * (0.3 + Math.sin(t * 5) * 0.45); });
      m.arms[1].rotation.z = ud.excite > 0.2 ? 2.2 + Math.sin(t * 8) * 0.3 : 0.3 + Math.sin(t * 2) * 0.1;
      m.ants.forEach((b, i) => b.material.emissiveIntensity = 1.6 + Math.sin(t * 3 + i) * 0.6);
    }
  });
}
const MILLY = buildMilly();

// ─── NUMBER EIGHT BUTTERFLY ──────────────────────────────────────────────────
function buildButterfly() {
  const root = grp(), body = grp(root), COL = 0xF4D28A;
  const m = mothBody(body, COL, { headR: 0.2, eyeCol: 0x8E44D9, ruff: 0xFFF3DA, antennaCurl: true });
  const paint = (open) => (x, map, px) => { for (const s of [-1, 1]) paintBrow(x, map, px, s * 0.36, 0.36, 0.22, 0.035, '#9A6A28', -s * 0.15, 0.4); paintBlush(x, map, px, 0.55, -0.22, 0.15, 'rgba(255,120,170,0.45)'); paintMouth(x, map, px, -0.33, 0.5, open, { lip: '#8A4A12', inner: '#6B1A12', tongue: '#F06A6A', smile: 1.3 }); };
  const face = faceDecal(m.head, m.R + 0.016, m.S, { w: 2.0, t0: 0.75, tl: 1.45 }, paint(0.12));
  const mouthOpen = face.make(paint(0.22));
  // each side shows a glowing "8": upper loop on the top wing, lower loop on the bottom wing
  const loop = (cx, cy, r) => (x, w, h, emissive) => {
    x.save(); x.shadowColor = '#FFD86B'; x.shadowBlur = emissive ? 40 : 18; x.strokeStyle = emissive ? '#FFE9A0' : '#FFD86B'; x.lineWidth = w * 0.075;
    x.beginPath(); x.ellipse(w * cx, h * cy, w * r, h * r * 0.92, 0, 0, TAU); x.stroke(); x.restore();
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.6; const px = w * cx + Math.cos(a) * w * r, py = h * cy + Math.sin(a) * h * r * 0.92; x.fillStyle = emissive ? '#FFFFFF' : '#FFF4C8'; x.beginPath(); x.arc(px, py, w * 0.022, 0, TAU); x.fill(); }
    x.fillStyle = emissive ? '#000' : '#FF8FD0'; x.beginPath(); x.arc(w * 0.82, h * 0.25, w * 0.03, 0, TAU); x.fill();
  };
  const [uc, ue] = magicWing('upper', loop(0.5, 0.52, 0.22), '#3C0F78', '#A35CF0'), [lc, le] = magicWing('lower', loop(0.48, 0.52, 0.2), '#3C0F78', '#A35CF0');
  const wings = grp(body); wings.position.set(0, 0.66, -0.12); const W = [];
  for (const s of [-1, 1]) {
    const piv = grp(wings);
    const u = wingPlane(0.85, 0.85, uc, ue, { glow: 1.8, irid: 0.15, sheen: 0 }); u.position.y = 0.2; const l = wingPlane(0.75, 0.75, lc, le, { glow: 1.8, irid: 0.15, sheen: 0 }); l.position.y = -0.24;
    for (const w of [u, l]) { w.rotation.y = s > 0 ? 0 : Math.PI; piv.add(w); }
    W.push([piv, s]);
  }
  // magic 8 trail
  const TN = 70, tp = new Float32Array(TN * 3), tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.BufferAttribute(tp, 3));
  const trail = new THREE.Points(tg, new THREE.PointsMaterial({ map: sparkTex, size: 0.28, color: 0xFFD86B, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
  trail.frustumCulled = false; scene.add(trail);
  const L = LM.gate, cy = H(L.x, L.z - 4) + 3.3;
  return registerChar(root, {
    key: 'butterfly', name: 'The Number Eight Butterfly', height: 1.3, hitR: 0.8, hitY: -0.2,
    rig: { body, head: m.head, eyes: m.eyes, mouth: { mat: face.mat, closed: face.mat.map, open: mouthOpen } },
    dialog: [
      'Follow the magic! I\'m the Number Eight Butterfly, your magical guide.',
      'The number 8 is special — it\'s two circles joined together!',
      'Look at my wings: each side makes a glowing 8!',
      '8 is an even number: 4 + 4 = 8 and 2 × 4 = 8.',
      'I opened the Magic Gate just for you. Go meet Nia and all my friends!'
    ],
    update: (t, dt, focus, ud) => {
      const near = (ud.dist ?? 99) < 6;
      ud.s = (ud.s ?? 0) + dt * (near ? 0.15 : 0.55);
      const x = L.x + Math.sin(ud.s) * 3.4, z = L.z - 4 + Math.sin(ud.s * 2) * 1.6;
      const px = root.position.x, pz = root.position.z;
      root.position.set(x, cy + Math.sin(t * 2.2) * 0.25, z);
      if (near) root.rotation.y += (Math.atan2(focus.x - x, focus.z - z) - root.rotation.y) * 0.06;
      else if (Math.hypot(x - px, z - pz) > 1e-4) root.rotation.y = Math.atan2(x - px, z - pz);
      W.forEach(([p, s]) => { p.rotation.y = s * (0.2 + Math.sin(t * 8) * 0.6); });
      tp.copyWithin(3, 0, (TN - 1) * 3); tp[0] = x + rr(-0.1, 0.1); tp[1] = root.position.y + 0.6 + rr(-0.1, 0.1); tp[2] = z + rr(-0.1, 0.1); tg.attributes.position.needsUpdate = true;
    }
  });
}
const BUTTERFLY = buildButterfly();

// ─── SKIPPY ──────────────────────────────────────────────────────────────────
function buildSkippy() {
  const root = grp(), body = grp(root);
  const FUR = 0xE5602A, LIGHT = 0xFAD3A0, HOOD = felt(0x3E9B3A), HOOD2 = felt(0x2F7E2C);
  // legs & big feet
  for (const s of [-1, 1]) {
    const th = fur(new THREE.SphereGeometry(0.1, 24, 16), FUR, { len: 0.018, density: [30, 18] }, root); th.position.set(s * 0.1, 0.16, -0.02); th.scale.set(0.9, 1, 1.1);
    const ft = fur(new THREE.SphereGeometry(0.06, 20, 14), FUR, { len: 0.012, density: [20, 12] }, root); ft.position.set(s * 0.1, 0.035, 0.08); ft.scale.set(0.8, 0.5, 1.6);
  }
  // hoodie body with "2"
  mk(lathe([[0.13, 0.12], [0.17, 0.2], [0.175, 0.32], [0.15, 0.44], [0.09, 0.5], [0.04, 0.52]], 32), HOOD, body).scale.z = 0.9;
  const two = text3D('2', 0.13, felt(0xFFF1D6), 0.25); two.position.set(0, 0.3, 0.165); body.add(two);
  const hood = mk(lumpy(new THREE.SphereGeometry(0.12, 24, 16), 0.05, 6), HOOD2, body); hood.position.set(0, 0.5, -0.09); hood.scale.set(1.1, 0.7, 0.7);
  const armL = makeArm(body, new THREE.Vector3(0.14, 0.43, 0), 1, { len: 0.2, r0: 0.042, r1: 0.035, sleeve: HOOD, skinMat: felt(FUR), cuffMat: HOOD2, handScale: 0.75, spread: 0.4 });
  const armR = makeArm(body, new THREE.Vector3(-0.14, 0.43, 0), -1, { len: 0.2, r0: 0.042, r1: 0.035, sleeve: HOOD, skinMat: felt(FUR), cuffMat: HOOD2, handScale: 0.75, spread: 0.4 });
  // head
  const head = grp(body); head.position.set(0, 0.68, 0.02);
  const R = 0.19, S = new THREE.Vector3(1.05, 0.98, 1.0);
  fur(new THREE.SphereGeometry(R, 48, 32), FUR, { len: 0.016, density: [80, 40] }, head).scale.copy(S);
  for (const s of [-1, 1]) { const c = fur(new THREE.SphereGeometry(0.085, 24, 16), LIGHT, { len: 0.016, density: [30, 18] }, head); c.position.copy(onSphere(R, S, s * 0.5, -0.4, -0.04)); c.scale.set(1.1, 0.85, 0.85); }
  const muz = fur(new THREE.SphereGeometry(0.075, 24, 16), LIGHT, { len: 0.008, density: [25, 15] }, head); muz.position.copy(onSphere(R, S, 0, -0.32, -0.03)); muz.scale.set(1.15, 0.8, 0.9);
  const nose = mk(new THREE.SphereGeometry(0.028, 16, 12), gloss(0x6B3416, 0.25), head); nose.position.copy(onSphere(R, S, 0, -0.18, 0.025)); nose.scale.set(1.3, 0.85, 1);
  for (const s of [-1, 1]) { const tooth = mk(new RoundedBox(0.026, 0.035, 0.01, 0.005), std(0xFFFDF5, 0.3), head); tooth.position.copy(onSphere(R, S, s * 0.07, -0.55, 0.012)); }
  const eyes = [-1, 1].map(s => makeEye(head, onSphere(R, S, s * 0.38, 0.06, -0.025), 0.062, 0x2E8B1E, felt(FUR)));
  const paint = (open) => (x, map, px) => { for (const s of [-1, 1]) paintBrow(x, map, px, s * 0.38, 0.42, 0.24, 0.045, '#7A2E10', -s * 0.2, 0.4); paintMouth(x, map, px, -0.44, 0.5, open, { lip: '#6B2A10', inner: '#5B1414', tongue: '#E46B7B', teeth: false, smile: 1.4 }); };
  const face = faceDecal(head, R + 0.017, S, { w: 2.0, t0: 0.75, tl: 1.5 }, paint(0.1));
  const mouthOpen = face.make(paint(0.2));
  for (const s of [-1, 1]) {
    const ear = grp(head); ear.position.set(s * 0.12, 0.15, -0.02); ear.rotation.z = -s * 0.25;
    mk(new THREE.ConeGeometry(0.06, 0.15, 20).translate(0, 0.075, 0), felt(FUR), ear).scale.z = 0.55;
    const inn = mk(new THREE.ConeGeometry(0.038, 0.1, 16).translate(0, 0.05, 0), felt(0xF7B48A), ear); inn.scale.z = 0.4; inn.position.z = 0.015;
    fur(new THREE.ConeGeometry(0.025, 0.07, 10).translate(0, 0.035, 0), FUR, { len: 0.015, density: [10, 10] }, ear).position.y = 0.14;
  }
  // big curly tail
  const tailP = grp(body); tailP.position.set(0, 0.18, -0.15); tailP.rotation.set(-0.35, 0, 0);
  const tg = bushyTail(0.75, 0.17, 0, 0.0, FUR, 0xF5A26A); const p = tg.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i), k = y / 0.75, a = k * 2.6; const zz = p.getZ(i) - Math.sin(a) * 0.28 * k, yy = y * (1 - 0.25 * k * k) + 0.0; p.setZ(i, zz); p.setY(i, yy); }
  tg.computeVertexNormals();
  fur(tg, 0xffffff, { len: 0.035, density: [40, 50], vertexColors: true, gravity: 0.05 }, tailP);
  const route = [new THREE.Vector3(LM.oak.x - 2.2, 0, LM.oak.z + 3.4), ...SKIPPY_LEAVES];
  route[0].y = H(route[0].x, route[0].z);
  return registerChar(root, {
    key: 'skippy', name: 'Skippy the Skip-Counting Squirrel', height: 0.95, hitR: 0.5,
    rig: { body, head, eyes, mouth: { mat: face.mat, closed: face.mat.map, open: mouthOpen } },
    dialog: [
      'Leap ahead with numbers! I\'m Skippy the Skip-Counting Squirrel.',
      'Watch me hop up the leaves: 2, 4, 6, 8, 10!',
      'Skip counting by 5s: 5, 10, 15, 20, 25!',
      'Counting by 10s is the fastest: 10, 20, 30, 40, 50!',
      'Can you spot the golden acorn at the top of my oak?'
    ],
    update: (t, dt, focus, ud) => {
      ud.ht = (ud.ht ?? 0) + dt; ud.i = ud.i ?? 0; ud.dir = ud.dir ?? 1;
      const near = (ud.dist ?? 99) < 5 && ud.i === 0;
      const HOP = 0.55, WAIT = 1.6;
      const a = route[ud.i], b = route[Math.max(0, Math.min(route.length - 1, ud.i + ud.dir))];
      if (ud.ht < HOP && !near) {
        const k = ud.ht / HOP; root.position.lerpVectors(a, b, k); root.position.y += Math.sin(k * Math.PI) * 0.9;
        root.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
        tailP.rotation.x = -0.35 - Math.sin(k * Math.PI) * 0.6;
      } else {
        if (!near && ud.ht >= HOP && !ud.landed) { ud.i += ud.dir; ud.landed = true; if (ud.i >= route.length - 1 || ud.i <= 0) ud.dir *= -1; }
        root.position.copy(route[ud.i]); tailP.rotation.x = -0.35 + Math.sin(t * 3) * 0.08;
        if (ud.ht > HOP + WAIT) { ud.ht = 0; ud.landed = false; }
        if (near) root.rotation.y += (Math.atan2(focus.x - root.position.x, focus.z - root.position.z) - root.rotation.y) * 0.08;
      }
      armR.rotation.z = ud.excite > 0.2 ? -2.4 + Math.sin(t * 9) * 0.3 : -0.4;
      armL.rotation.z = 0.4 + Math.sin(t * 2) * 0.05;
    }
  });
}
const SKIPPY = buildSkippy();
