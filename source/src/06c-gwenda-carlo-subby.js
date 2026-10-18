// ═════════════════════════════════════════════════════════════════════════════
//  GWENDA THE FAIRY · CARLO THE COUNTING CATERPILLAR · SUBBY THE SUBTRACTION SNAIL
// ═════════════════════════════════════════════════════════════════════════════
function wingPlane(w, h, tex, emissiveTex, opts = {}) {
  const g = new THREE.PlaneGeometry(w, h, 8, 8); g.translate(w / 2, 0, 0);
  const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, -Math.pow(p.getX(i) / w, 2) * 0.06 * w);
  g.computeVertexNormals();
  const m = new THREE.MeshPhysicalMaterial({ map: tex, transparent: true, alphaTest: 0.05, side: THREE.DoubleSide, roughness: 0.35, depthWrite: true, sheen: opts.sheen ?? 0.6, sheenColor: new THREE.Color(0xffffff), iridescence: opts.irid ?? 0.4, emissive: emissiveTex ? 0xffffff : 0x000000, emissiveMap: emissiveTex || null, emissiveIntensity: opts.glow ?? 1.4, opacity: opts.opacity ?? 1 });
  const mesh = new THREE.Mesh(g, m); mesh.castShadow = true; mesh.userData.keep = true; return mesh;
}
// Draw a wing outline path into a canvas (lobe spans the canvas, hinge on the left)
function wingPath(x, w, h, kind) {
  x.beginPath();
  if (kind === 'upper') { x.moveTo(4, h * 0.62); x.bezierCurveTo(w * 0.2, h * 0.05, w * 0.92, -h * 0.02, w * 0.97, h * 0.3); x.bezierCurveTo(w * 1.0, h * 0.62, w * 0.62, h * 0.9, w * 0.3, h * 0.88); x.bezierCurveTo(w * 0.12, h * 0.86, 4, h * 0.75, 4, h * 0.62); }
  else { x.moveTo(4, h * 0.3); x.bezierCurveTo(w * 0.35, h * 0.08, w * 0.85, h * 0.25, w * 0.9, h * 0.55); x.bezierCurveTo(w * 0.94, h * 0.9, w * 0.45, h * 1.0, w * 0.25, h * 0.86); x.bezierCurveTo(w * 0.1, h * 0.72, 4, h * 0.5, 4, h * 0.3); }
  x.closePath();
}

// ─── GWENDA ──────────────────────────────────────────────────────────────────
function fairyWingTex(kind) {
  return canvasTex(512, 512, (x, w, h) => {
    wingPath(x, w, h, kind); x.save(); x.clip();
    const g = x.createRadialGradient(0, h * 0.55, 10, 0, h * 0.55, w); g.addColorStop(0, 'rgba(255,248,225,0.95)'); g.addColorStop(1, 'rgba(250,232,185,0.55)');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(214,170,70,0.9)'; x.lineWidth = 7; x.lineCap = 'round';
    for (let i = 0; i < 6; i++) { const cx = w * (0.3 + (i % 3) * 0.22), cy = h * (0.35 + Math.floor(i / 3) * 0.28), r = 26 + (i % 2) * 14; x.beginPath(); for (let k = 0; k <= 40; k++) { const a = k / 40 * TAU * 1.4, rr2 = r * (1 - k / 52); k ? x.lineTo(cx + Math.cos(a) * rr2, cy + Math.sin(a) * rr2) : x.moveTo(cx + r, cy); } x.stroke(); }
    x.beginPath(); x.moveTo(6, h * 0.6); x.bezierCurveTo(w * 0.4, h * 0.4, w * 0.6, h * 0.5, w * 0.9, h * 0.35); x.stroke();
    x.restore(); wingPath(x, w, h, kind); x.lineWidth = 14; x.strokeStyle = '#E2B44E'; x.stroke();
  });
}
function buildGwenda() {
  const root = grp(), body = grp(root);
  const SK = skin(0x9B6340), GOLDF = new THREE.MeshPhysicalMaterial({ color: 0xF0D9A0, roughness: 0.38, metalness: 0.25, sheen: 1, sheenColor: new THREE.Color(0xFFE08A), bumpMap: feltBump, bumpScale: 1.4, clearcoat: 0.3 });
  const tightsTex = canvasTex(128, 128, (x, w, h) => { x.fillStyle = '#2A1D19'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(190,140,70,0.55)'; x.lineWidth = 2; for (let i = -w; i < w * 2; i += 32) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + h, h); x.stroke(); x.beginPath(); x.moveTo(i, h); x.lineTo(i + h, 0); x.stroke(); } }, [3, 3]);
  const TIGHTS = new THREE.MeshPhysicalMaterial({ map: tightsTex, roughness: 0.6, sheen: 0.8, sheenColor: new THREE.Color(0x8A6A40) });
  for (const s of [-1, 1]) {
    mk(taperTube([[s * 0.075, 0.5, 0], [s * 0.078, 0.28, 0.01], [s * 0.074, 0.07, 0.01]], 0.055, 0.04, 10, 14), TIGHTS, root);
    const shoe = mk(new THREE.SphereGeometry(0.06, 20, 14), new THREE.MeshStandardMaterial({ color: 0xE8C468, metalness: 0.8, roughness: 0.3 }), root); shoe.scale.set(0.85, 0.5, 1.5); shoe.position.set(s * 0.075, 0.035, 0.03);
  }
  // pleated skirt and sweetheart bodice
  const skirt = lathe([[0.13, 0.78], [0.17, 0.7], [0.3, 0.55], [0.39, 0.44], [0.4, 0.42]], 64, 40);
  { const p = skirt.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), y = p.getY(i), a = Math.atan2(x, z), k = (0.78 - y) / 0.36, f = 1 + Math.cos(a * 14) * 0.045 * k; p.setX(i, x * f); p.setZ(i, z * f); } skirt.computeVertexNormals(); }
  mk(skirt, new THREE.MeshPhysicalMaterial({ color: 0xF2DDA6, roughness: 0.4, metalness: 0.2, sheen: 1, sheenColor: new THREE.Color(0xFFE59A), bumpMap: feltBump, bumpScale: 1.2, side: THREE.DoubleSide }), body);
  mk(lathe([[0.12, 0.76], [0.13, 0.82], [0.135, 0.9], [0.13, 0.96]], 36), GOLDF, body).scale.z = 0.8;
  for (const s of [-1, 1]) { const b = mk(new THREE.SphereGeometry(0.075, 20, 14), GOLDF, body); b.position.set(s * 0.055, 0.955, 0.065); b.scale.set(1, 0.6, 0.75); }
  mk(lathe([[0.12, 0.95], [0.13, 1.0], [0.1, 1.06], [0.05, 1.1]], 32), SK, body).scale.z = 0.8;
  // arms
  const armL = makeArm(body, new THREE.Vector3(0.13, 1.03, 0), 1, { len: 0.36, r0: 0.04, r1: 0.032, sleeve: SK, skinMat: SK, bare: true, spread: 0.32, handScale: 0.9 });
  const armR = makeArm(body, new THREE.Vector3(-0.13, 1.03, 0), -1, { len: 0.36, r0: 0.04, r1: 0.032, sleeve: SK, skinMat: SK, bare: true, spread: 0.3, handScale: 0.9 });
  armR.rotation.x = -0.6; const star = makeWand(armR.userData.hand, 0xFFE9A0, 0.4);
  // neck, necklace, head
  mk(new THREE.CylinderGeometry(0.042, 0.048, 0.12, 14), SK, body).position.y = 1.12;
  const nk = mk(new THREE.TorusGeometry(0.052, 0.006, 6, 30), GOLD, body); nk.position.set(0, 1.09, 0.008); nk.rotation.x = Math.PI / 2 + 0.35;
  mk(new THREE.SphereGeometry(0.014, 10, 8), GOLD, body).position.set(0, 1.065, 0.055);
  const head = grp(body); head.position.y = 1.34;
  const R = 0.235, S = new THREE.Vector3(0.96, 1.02, 0.94);
  mk(new THREE.SphereGeometry(R, 48, 36), SK, head).scale.copy(S);
  const chin = mk(new THREE.SphereGeometry(0.085, 20, 14), SK, head); chin.position.copy(onSphere(R, S, 0, -0.62, -0.07)); chin.scale.set(1.1, 0.8, 0.9);
  const nose = mk(new THREE.SphereGeometry(0.03, 16, 12), SK, head); nose.position.copy(onSphere(R, S, 0, -0.17, 0)); nose.scale.set(1.35, 0.85, 0.9);
  for (const s of [-1, 1]) { const e = mk(new THREE.SphereGeometry(0.058, 14, 10), SK, head); e.position.set(s * R * 0.95, -0.03, -0.01); e.scale.set(0.45, 1, 0.8); const er = mk(new THREE.SphereGeometry(0.016, 10, 8), GOLD, head); er.position.set(s * R * 0.97, -0.085, 0.01); const dr = mk(new THREE.SphereGeometry(0.012, 10, 8), GOLD, head); dr.position.set(s * R * 0.97, -0.115, 0.012); dr.scale.y = 1.5; }
  const eyes = [-1, 1].map(s => makeEye(head, onSphere(R, S, s * 0.37, -0.02, -0.035), 0.064, 0x6A3612, SK, { lash: s }));
  const paint = (open) => (x, map, px) => {
    for (const s of [-1, 1]) paintBrow(x, map, px, s * 0.38, 0.32, 0.3, 0.045, '#2A150A', -s * 0.1, 0.32);
    paintBlush(x, map, px, 0.5, -0.22, 0.15, 'rgba(230,110,110,0.3)');
    paintMouth(x, map, px, -0.4, 0.4, open, { lip: '#A0484A', inner: '#5B1414', tongue: '#E46B7B', smile: 1.1 });
  };
  const face = faceDecal(head, R, S, { w: 2.0, t0: 0.72, tl: 1.5 }, paint(0));
  const mouthOpen = face.make(paint(0.12));
  // hair pulled up into a big curly bun, tiara
  const HAIR = 0x3A2214;
  const cap = fur(new THREE.SphereGeometry(R * 1.03, 48, 24, 0, TAU, 0, 1.35), HAIR, { len: 0.008, density: [150, 40], gravity: 0 }, head); cap.rotation.x = -0.4; cap.scale.copy(S);
  const bun = fur(lumpy(new THREE.SphereGeometry(0.2, 48, 32), 0.1, 9, 2), HAIR, { len: 0.045, density: [90, 45], gravity: 0.05 }, head); bun.position.set(0, 0.29, -0.06); bun.scale.set(1, 0.95, 0.95);
  const tiara = grp(head); tiara.position.set(0, 0.2, 0.08); tiara.rotation.x = -0.35;
  mk(new THREE.TorusGeometry(0.13, 0.008, 8, 40, Math.PI), GOLD, tiara).rotation.z = 0;
  for (let i = 0; i < 5; i++) { const a = 0.35 + i / 4 * (Math.PI - 0.7); const sp = mk(new THREE.ConeGeometry(0.014, 0.05 + (i === 2 ? 0.035 : 0), 8), GOLD, tiara); sp.position.set(Math.cos(a) * 0.13, Math.sin(a) * 0.13 + 0.02, 0); sp.rotation.z = a - Math.PI / 2; }
  for (let i = 0; i < 2; i++) { const sw = mk(new THREE.TorusGeometry(0.025, 0.005, 6, 16), GOLD, tiara); sw.position.set((i ? 1 : -1) * 0.045, 0.15, 0); }
  const gem = mk(new THREE.OctahedronGeometry(0.022, 0), new THREE.MeshPhysicalMaterial({ color: 0xF6C343, metalness: 0.6, roughness: 0.1, emissive: 0xA06A10, emissiveIntensity: 0.6 }), tiara); gem.position.set(0, 0.17, 0.01); gem.scale.y = 1.5;
  // four filigree wings
  const wings = grp(body); wings.position.set(0, 0.97, -0.1);
  const up = fairyWingTex('upper'), lo = fairyWingTex('lower');
  const W = [];
  for (const s of [-1, 1]) {
    const u = wingPlane(0.62, 0.62, up, null, { irid: 0.5 }); u.position.set(0, 0.12, 0); u.rotation.set(0, s > 0 ? -0.35 : Math.PI + 0.35, 0.35 * s * 0); u.scale.y = 1;
    const l = wingPlane(0.45, 0.45, lo, null, { irid: 0.5 }); l.position.set(0, -0.12, 0.01); l.rotation.set(0, s > 0 ? -0.35 : Math.PI + 0.35, 0);
    const piv = grp(wings); piv.add(u, l); W.push([piv, s]);
  }
  root.userData.floatY = 0.45;
  return registerChar(root, {
    key: 'gwenda', name: 'Gwenda the Fairy', height: 1.75, hitR: 0.55, hitY: -0.3,
    rig: { body, head, eyes, mouth: { mat: face.mat, closed: face.mat.map, open: mouthOpen } },
    dialog: [
      'Hello! I\'m Gwenda, a fairy from Whisperwood Forest.',
      'Welcome to the Heart of the Garden — it glows brighter when friends help each other.',
      'Count the standing stones around the heart: there are 12, just like a clock!',
      'I can talk to flowers! They love it when you count their petals.',
      'Even the tiniest sparkle can light up the world.'
    ],
    update: (t, dt, focus, ud) => {
      root.position.y = ud.baseY + 0.45 + Math.sin(t * 1.6) * 0.12;
      W.forEach(([p, s]) => { p.rotation.y = s * (0.15 + Math.sin(t * 7) * 0.32); });
      armL.rotation.z = 0.35 + Math.sin(t * 1.3) * 0.08; armR.rotation.x = -0.6 + Math.sin(t * 1.6) * 0.1;
      star.rotation.y = t * 2;
    }
  });
}
const GWENDA = placeChar(buildGwenda(), LM.heart.x + 3.4, LM.heart.z + 3.0, faceYawTo(LM.heart.x + 3.4, LM.heart.z + 3.0, 2, 10));
GWENDA.userData.baseY = GWENDA.position.y;

// ─── CARLO ───────────────────────────────────────────────────────────────────
function buildCarlo() {
  const root = grp(), body = grp(root);
  const COLS = [0xFF3B30, 0xFF7A1A, 0xFFC21A, 0xC6DC2A, 0x5EC43A, 0x22B8A8, 0x2F7BEF, 0x4B4FD0, 0x9B4FE0, 0xF5B83A];
  const GREEN = 0x8BD43A, segs = [];
  const segGeo = lumpy(new THREE.SphereGeometry(0.25, 40, 28), 0.05, 6, 1);
  for (let i = 0; i < 10; i++) {
    const sg = grp(body); sg.position.set(0, 0.26, -0.2 - i * 0.37);
    fur(segGeo, COLS[i], { len: 0.035, density: [45, 25], gravity: 0.05 }, sg).scale.set(1.05, 1, 0.92);
    for (const s of [-1, 1]) {
      const n = text3D(String(i + 1), 0.17, gloss(0xFFFFFF, 0.3), 0.25); n.position.set(s * 0.27, 0.02, 0); n.rotation.y = s * Math.PI / 2; sg.add(n);
      const foot = mk(new THREE.SphereGeometry(0.06, 14, 10), felt(0x6DBE33), sg); foot.position.set(s * 0.13, -0.21, 0.02); foot.scale.set(1, 0.7, 1.2);
    }
    segs.push(sg);
  }
  // neck and head
  const neck = fur(new THREE.SphereGeometry(0.22, 32, 24), GREEN, { len: 0.03, density: [40, 25] }, body); neck.position.set(0, 0.38, 0.08);
  const head = grp(body); head.position.set(0, 0.74, 0.18);
  const R = 0.31, S = new THREE.Vector3(1.05, 0.95, 0.95);
  fur(new THREE.SphereGeometry(R, 48, 32), GREEN, { len: 0.03, density: [70, 35], gravity: 0.1 }, head).scale.copy(S);
  const eyes = [-1, 1].map(s => makeEye(head, onSphere(R, S, s * 0.35, 0.02, -0.03), 0.092, 0x7A4416, felt(GREEN), { lash: s }));
  const paint = (open) => (x, map, px) => {
    for (const s of [-1, 1]) paintBrow(x, map, px, s * 0.36, 0.38, 0.22, 0.04, '#3C7A1A', -s * 0.15, 0.4);
    paintBlush(x, map, px, 0.55, -0.22, 0.16, 'rgba(255,150,80,0.45)');
    paintMouth(x, map, px, -0.33, 0.55, open, { lip: '#2E6A12', inner: '#6B1A12', tongue: '#F06A6A', smile: 1.3 });
  };
  const face = faceDecal(head, R + 0.012, S, { w: 2.0, t0: 0.75, tl: 1.45 }, paint(0.17));
  const mouthOpen = face.make(paint(0.28));
  const ants = [];
  for (const s of [-1, 1]) {
    mk(taperTube([[s * 0.1, 0.26, 0], [s * 0.14, 0.45, 0.02], [s * 0.2, 0.6, 0.06]], 0.018, 0.012, 14, 8), felt(GREEN), head);
    const ball = mk(new THREE.SphereGeometry(0.05, 16, 12), new THREE.MeshStandardMaterial({ color: 0xFFE680, emissive: 0xFFD54A, emissiveIntensity: 1.8, roughness: 0.3 }), head, false); ball.position.set(s * 0.2, 0.63, 0.07); ball.userData.keep = true; ants.push(ball);
  }
  return registerChar(root, {
    key: 'carlo', name: 'Carlo the Counting Caterpillar', height: 1.15, hitR: 0.9, hitY: 0,
    rig: { body: null, head, eyes, mouth: { mat: face.mat, closed: face.mat.map, open: mouthOpen } },
    dialog: [
      'Let\'s count together! 1, 2, 3, 4, 5, 6, 7, 8, 9, 10!',
      'I have 10 fuzzy segments — one for every number. Can you read them?',
      'Hop up the numbered stepping stones from 1 to 10 to wake me all the way up!',
      'When we count to 10, I turn into the Number Ten Butterfly!',
      'Yawn... I was napping on my mushroom. Thanks for waking me!'
    ],
    update: (t) => {
      segs.forEach((s, i) => { s.position.y = 0.26 + Math.max(0, Math.sin(t * 2.4 - i * 0.55)) * 0.07; s.rotation.x = Math.cos(t * 2.4 - i * 0.55) * 0.08; });
      head.position.y = 0.74 + Math.sin(t * 2.4 + 0.6) * 0.03;
      ants.forEach((b, i) => { b.material.emissiveIntensity = 1.5 + Math.sin(t * 3 + i) * 0.6; });
    }
  });
}
const CARLO = buildCarlo();
CARLO.position.copy(CARLO_SPOT.pos); CARLO.rotation.y = -Math.PI / 2 + 0.15;

// ─── SUBBY ───────────────────────────────────────────────────────────────────
function buildSubby() {
  const root = grp(), body = grp(root);
  const BODY = new THREE.MeshPhysicalMaterial({ color: 0xBBAEF2, roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.15, sheen: 0.5, sheenColor: new THREE.Color(0xE8E0FF) });
  // soft body / foot
  const foot = mk(lathe([[0.001, -0.55], [0.12, -0.5], [0.17, -0.25], [0.18, 0.1], [0.16, 0.35], [0.001, 0.42]], 32), BODY, body);
  foot.rotation.x = Math.PI / 2; foot.scale.set(1, 1, 0.55); foot.position.y = 0.1;
  // neck & head rising at the front
  mk(taperTube([[0, 0.12, 0.25], [0, 0.32, 0.38], [0, 0.48, 0.42]], 0.13, 0.15, 14, 18), BODY, body);
  const head = grp(body); head.position.set(0, 0.55, 0.43);
  const R = 0.17, S = new THREE.Vector3(1.1, 1, 1);
  mk(new THREE.SphereGeometry(R, 40, 28), BODY, head).scale.copy(S);
  const paint = (open) => (x, map, px) => { paintBlush(x, map, px, 0.55, -0.15, 0.2, 'rgba(255,120,170,0.45)'); paintMouth(x, map, px, -0.28, 0.75, open, { lip: '#5A3A9A', inner: '#5B1440', tongue: '#F07AA0', smile: 1.3, teeth: false }); };
  const face = faceDecal(head, R, S, { w: 2.2, t0: 0.8, tl: 1.4 }, paint(0.1));
  const mouthOpen = face.make(paint(0.25));
  const eyes = [];
  for (const s of [-1, 1]) {
    mk(taperTube([[s * 0.06, 0.1, 0.02], [s * 0.1, 0.24, 0.04], [s * 0.12, 0.33, 0.05]], 0.028, 0.022, 10, 10), BODY, head);
    const e = makeEye(head, new THREE.Vector3(s * 0.125, 0.38, 0.06), 0.065, 0x7B2CBF, BODY); eyes.push(e);
  }
  // spiral shell
  const pts = [], turns = 2.6, N = 140;
  for (let i = 0; i <= N; i++) { const k = i / N, a = k * turns * TAU, r = 0.32 * Math.pow(1 - k, 1.25) + 0.02; pts.push(new THREE.Vector3(0.02 * k, Math.sin(a) * r, Math.cos(a) * r)); }
  const curve = new THREE.CatmullRomCurve3(pts), shellG = new THREE.TubeGeometry(curve, 220, 1, 24, false);
  const sp = shellG.attributes.position, c = new THREE.Vector3(), col = new Float32Array(sp.count * 3), ca = new THREE.Color(0x7B3FD8), cb = new THREE.Color(0xD9B8FF), cc = new THREE.Color();
  for (let i = 0; i <= 220; i++) { const k = i / 220, r = 0.2 * Math.pow(1 - k, 1.1) + 0.012; c.copy(curve.getPointAt(k)); for (let j = 0; j <= 24; j++) { const idx = i * 25 + j, v = new THREE.Vector3().fromBufferAttribute(sp, idx).sub(c).multiplyScalar(r).add(c); sp.setXYZ(idx, v.x, v.y, v.z); cc.copy(ca).lerp(cb, (j % 25) / 24 * 0.6 + k * 0.4); col.set([cc.r, cc.g, cc.b], idx * 3); } }
  shellG.setAttribute('color', new THREE.BufferAttribute(col, 3)); shellG.computeVertexNormals();
  const shell = mk(shellG, new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1, iridescence: 0.5 }), body);
  shell.position.set(0, 0.5, -0.12); shell.userData.keep = true;
  return registerChar(root, {
    key: 'subby', name: 'Subby the Subtraction Snail', height: 0.95, hitR: 0.6,
    rig: { body, head, eyes, mouth: { mat: face.mat, closed: face.mat.map, open: mouthOpen } },
    dialog: [
      'Hi, I\'m Subby the Subtraction Snail. Slow and steady!',
      'Follow my trail: 10, 9, 8... every toadstool takes one away.',
      'Subtracting means taking away. 10 − 3 = 7!',
      'Can you count all the way down to zero with me?',
      'Shhh... I\'m leaving a sparkly trail so friends can find their way.'
    ],
    update: (t, dt, focus, ud) => {
      const talking = (ud.dist ?? 99) < 5;
      ud.u = (ud.u ?? 0.3) + (talking ? 0 : dt * 0.012 * (ud.dir ?? 1));
      if (ud.u > 0.97) ud.dir = -1; if (ud.u < 0.03) ud.dir = 1;
      const p = SUBBY_TRAIL.getPointAt(ud.u), tg = SUBBY_TRAIL.getTangentAt(ud.u).multiplyScalar(ud.dir ?? 1);
      root.position.set(p.x, H(p.x, p.z) + 0.02, p.z);
      const want = Math.atan2(tg.x, tg.z); let d = want - root.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); root.rotation.y += d * Math.min(1, dt * 2);
      body.scale.z = 1 + Math.sin(t * 2.5) * 0.04; body.scale.y = 1 - Math.sin(t * 2.5) * 0.02;
    }
  });
}
const SUBBY = buildSubby();
