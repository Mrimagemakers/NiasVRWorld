// ═════════════════════════════════════════════════════════════════════════════
//  NIA BROWN — curious, kind, count on Nia!
// ═════════════════════════════════════════════════════════════════════════════
function starGeo(r1, r2, depth = 0.02, pts = 5) {
  const s = new THREE.Shape();
  for (let i = 0; i <= pts * 2; i++) { const a = i / (pts * 2) * TAU + Math.PI / 2, r = i % 2 ? r2 : r1; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: depth * 0.6, bevelSize: depth * 0.5, bevelSegments: 2 }); g.center(); return g;
}
function localSparkles(par, n, rad, size = 0.08, color = 0xFFE7A0) {
  const pts = makeSparkles(n, () => new THREE.Vector3(rr(-rad, rad), rr(-rad, rad), rr(-rad, rad)), size, color);
  scene.remove(pts); par.add(pts); return pts;
}
function makeWand(hand, starCol = 0xFFE066, len = 0.38, tip = null) {
  const w = grp(hand); w.position.set(0, -0.03, 0.02); w.rotation.x = Math.PI / 2 - 0.5;
  mk(new THREE.CylinderGeometry(0.008, 0.012, len, 10).translate(0, len / 2 - 0.08, 0), gloss(0x7A4A22, 0.4), w);
  mk(new THREE.TorusGeometry(0.013, 0.004, 6, 14), GOLD, w).position.y = len - 0.1;
  const tipMat = new THREE.MeshPhysicalMaterial({ color: starCol, emissive: starCol, emissiveIntensity: 2.2, roughness: 0.2, clearcoat: 1 });
  if (tip) tipMat.emissiveIntensity = 0.7;
  const star = tip ? text3D(tip, 0.13, tipMat, 0.3) : mk(starGeo(0.075, 0.032, 0.018), tipMat, w, false);
  if (tip) { w.add(star); star.castShadow = false; }
  star.position.y = len - (tip ? -0.035 : 0.02); star.userData.keep = true;
  localSparkles(star, 18, 0.16, 0.07);
  return star;
}

function buildNia() {
  const root = grp(), body = grp(root);
  const SK = skin(0xA3663B), YEL = felt(0xF6C324), CUFF = felt(0xE9A90F), DEN = denim(0x4A6FB2), DEN2 = denim(0x7C9AD0);
  // legs, cuffs, sneakers
  for (const s of [-1, 1]) {
    mk(taperTube([[s * 0.1, 0.5, 0], [s * 0.102, 0.3, 0.01], [s * 0.1, 0.15, 0.012]], 0.082, 0.074, 10, 18), DEN, root);
    const cuff = mk(new THREE.CylinderGeometry(0.09, 0.088, 0.075, 24), DEN2, root); cuff.position.set(s * 0.1, 0.14, 0.012);
    const roll = mk(new THREE.TorusGeometry(0.089, 0.014, 8, 24), DEN2, root); roll.rotation.x = Math.PI / 2; roll.position.set(s * 0.1, 0.177, 0.012);
    mk(new THREE.CylinderGeometry(0.05, 0.048, 0.07, 14), felt(0xFFFFFF), root).position.set(s * 0.1, 0.105, 0.01);
    makeShoe(root, s * 0.1, { upper: gloss(0x7DC443, 0.45), sole: std(0xFFFFFF, 0.6), toe: gloss(0xE45BB0, 0.45), accent: gloss(0x9B4FD0, 0.4), lace: 0xFFFFFF, s: 1.1 });
  }
  // overall shorts / hips
  const hips = mk(lathe([[0.15, 0.42], [0.19, 0.47], [0.205, 0.56], [0.2, 0.64]], 32), DEN, body); hips.scale.z = 0.86;
  // hoodie torso
  const torso = mk(lathe([[0.195, 0.6], [0.21, 0.68], [0.215, 0.77], [0.205, 0.85], [0.165, 0.905], [0.09, 0.94], [0.04, 0.945]], 36), YEL, body); torso.scale.z = 0.84;
  const hem = mk(new THREE.TorusGeometry(0.2, 0.018, 8, 36), CUFF, body); hem.rotation.x = Math.PI / 2; hem.scale.y = 0.86; hem.position.y = 0.62;
  const hoodRing = mk(new THREE.TorusGeometry(0.1, 0.048, 12, 30), YEL, body); hoodRing.rotation.x = Math.PI / 2 - 0.25; hoodRing.position.set(0, 0.935, -0.015);
  const hoodBack = mk(lumpy(new THREE.SphereGeometry(0.16, 24, 16), 0.04, 6), YEL, body); hoodBack.scale.set(1, 0.72, 0.55); hoodBack.position.set(0, 0.92, -0.13);
  for (const s of [-1, 1]) { mk(tube([[s * 0.035, 0.93, 0.105], [s * 0.04, 0.86, 0.15], [s * 0.045, 0.79, 0.158]], 0.006, 10, 6), std(0xFFFFFF, 0.6), body); mk(new THREE.CylinderGeometry(0.009, 0.009, 0.025, 8), std(0xDDDDDD, 0.4, 0.5), body).position.set(s * 0.045, 0.78, 0.158); }
  // bib with the lucky number 8
  const bibG = new RoundedBox(0.28, 0.23, 0.03, 0.035); const bp = bibG.attributes.position;
  for (let i = 0; i < bp.count; i++) { const x = bp.getX(i); bp.setZ(i, bp.getZ(i) - x * x * 1.7); } bibG.computeVertexNormals();
  const bib = mk(bibG, DEN, body); bib.position.set(0, 0.735, 0.19);
  const pocket = mk(new RoundedBox(0.13, 0.1, 0.012, 0.012), denim(0x5A80C4), body); pocket.position.set(0, 0.72, 0.205);
  [0xF6C324, 0x7DC443, 0xF28DB8, 0xFFF4DC].forEach((c, i) => { const st = mk(new THREE.BoxGeometry(0.024, 0.075, 0.006), std(c, 0.7), body, false); st.position.set(-0.039 + i * 0.026, 0.722, 0.213); });
  for (const s of [-1, 1]) {
    mk(new THREE.CylinderGeometry(0.022, 0.022, 0.014, 18).rotateX(Math.PI / 2), gloss(0x8B5A2B, 0.3), body).position.set(s * 0.1, 0.825, 0.2);
    mk(tube([[s * 0.1, 0.83, 0.19], [s * 0.125, 0.935, 0.06], [s * 0.115, 0.9, -0.12], [s * 0.08, 0.66, -0.18]], 0.021, 16, 8), DEN, body);
  }
  // pink crossbody bag (from the Deluxe cover)
  const PINK = gloss(0xF28DB8, 0.45);
  mk(tube([[-0.15, 0.93, 0.05], [-0.06, 0.82, 0.17], [0.1, 0.62, 0.17], [0.2, 0.52, 0.09]], 0.011, 20, 6), PINK, body);
  const bag = mk(new RoundedBox(0.17, 0.14, 0.06, 0.025), PINK, body); bag.position.set(0.24, 0.47, 0.05); bag.rotation.y = 0.6;
  const flap = mk(new RoundedBox(0.172, 0.07, 0.065, 0.02), gloss(0xE0679D, 0.45), body); flap.position.set(0.245, 0.51, 0.055); flap.rotation.y = 0.6;
  // arms
  const armL = makeArm(body, new THREE.Vector3(0.205, 0.875, 0), 1, { len: 0.32, r0: 0.07, r1: 0.056, sleeve: YEL, skinMat: SK, cuffMat: CUFF, spread: 0.18 });
  const armR = makeArm(body, new THREE.Vector3(-0.205, 0.875, 0), -1, { len: 0.32, r0: 0.07, r1: 0.056, sleeve: YEL, skinMat: SK, cuffMat: CUFF, spread: 0.12 });
  armR.rotation.x = -0.75;
  const star = makeWand(armR.userData.hand, 0x4BD15A, 0.38, '3');
  // neck & head
  mk(new THREE.CylinderGeometry(0.056, 0.06, 0.11, 16), SK, body).position.y = 0.97;
  const head = grp(body); head.position.y = 1.21;
  const R = 0.272, S = new THREE.Vector3(1, 0.98, 0.93);
  mk(new THREE.SphereGeometry(R, 48, 36), SK, head).scale.copy(S);
  for (const s of [-1, 1]) { const c = mk(new THREE.SphereGeometry(0.1, 24, 16), SK, head); c.position.copy(onSphere(R, S, s * 0.52, -0.36, -0.1)); c.scale.set(1, 0.85, 0.8); }
  const chin = mk(new THREE.SphereGeometry(0.1, 24, 16), SK, head); chin.position.copy(onSphere(R, S, 0, -0.62, -0.08)); chin.scale.set(1.2, 0.8, 0.9);
  const nose = mk(new THREE.SphereGeometry(0.036, 20, 14), SK, head); nose.position.copy(onSphere(R, S, 0, -0.15, 0.0)); nose.scale.set(1.4, 0.85, 0.9);
  for (const s of [-1, 1]) { const e = mk(new THREE.SphereGeometry(0.075, 16, 12), SK, head); e.position.set(s * R * 0.98, -0.04, -0.01); e.scale.set(0.5, 1, 0.8); }
  const eyes = [-1, 1].map(s => makeEye(head, onSphere(R, S, s * 0.38, -0.03, -0.045), 0.08, 0x5C3218, SK, { lash: s, open: -1.08 }));
  // painted face: brows, freckles, blush, smile
  const paint = (open) => (x, map, px) => {
    for (const s of [-1, 1]) paintBrow(x, map, px, s * 0.4, 0.34, 0.3, 0.055, '#2A150A', -s * 0.12, 0.3);
    paintBlush(x, map, px, 0.52, -0.2, 0.17);
    x.fillStyle = 'rgba(90,45,20,0.55)'; for (const [yy, pp] of [[0.2, -0.08], [0.27, -0.12], [0.24, -0.04], [-0.2, -0.08], [-0.27, -0.12], [-0.24, -0.04], [0.12, -0.06], [-0.12, -0.06]]) { const [cx, cy] = map(yy, pp); x.beginPath(); x.arc(cx, cy, px(0.011), 0, TAU); x.fill(); }
    // big friendly cover-style grin: a wide "D" smile, a full row of white top teeth, soft lower lip
    const [cx, cy] = map(0, -0.38), W2 = px(0.3), D = px(0.17 + open);
    x.save(); x.translate(cx, cy);
    x.beginPath(); x.moveTo(-W2, -px(0.02)); x.quadraticCurveTo(0, px(0.035), W2, -px(0.02)); x.bezierCurveTo(W2 * 0.75, D * 1.15, -W2 * 0.75, D * 1.15, -W2, -px(0.02)); x.closePath();
    x.fillStyle = '#5E1A1C'; x.fill(); x.save(); x.clip();
    x.fillStyle = '#FFFDF7'; x.fillRect(-W2, -px(0.05), W2 * 2, px(0.03) + D * 0.3);
    x.fillStyle = '#E8798A'; x.beginPath(); x.ellipse(0, D * 0.95, W2 * 0.5, D * 0.35, 0, 0, TAU); x.fill(); x.restore();
    x.strokeStyle = '#6E2C20'; x.lineWidth = px(0.022); x.lineJoin = 'round'; x.stroke();
    x.strokeStyle = 'rgba(120,52,38,0.55)'; x.lineWidth = px(0.012); x.lineCap = 'round';
    for (const sd of [-1, 1]) { x.beginPath(); x.arc(sd * (W2 + px(0.012)), -px(0.03), px(0.025), sd > 0 ? -0.6 : Math.PI - 0.9, sd > 0 ? 0.9 : Math.PI + 0.6); x.stroke(); }
    x.restore();
  };
  const face = faceDecal(head, R, S, { w: 2.0, t0: 0.72, tl: 1.5 }, paint(0));
  const mouthOpen = face.make(paint(0.05));
  // hair: cap + two big afro puffs with pink ties
  const HAIR = 0x5A2E19;
  const cap = fur(new THREE.SphereGeometry(R * 1.035, 48, 24, 0, TAU, 0, 1.27), HAIR, { len: 0.012, density: [150, 40], gravity: 0.1 }, head);
  cap.rotation.x = -0.5; cap.scale.copy(S);
  for (const s of [-1, 1]) {
    const pg = lumpy(new THREE.SphereGeometry(0.23, 48, 32), 0.12, 11, s * 3);
    const puff = fur(pg, HAIR, { len: 0.05, density: [90, 45], gravity: 0.05 }, head); puff.position.set(s * 0.25, 0.27, -0.07);
    const tie = mk(new THREE.TorusGeometry(0.062, 0.02, 10, 24), gloss(0xF59AC4, 0.35), head); tie.position.set(s * 0.165, 0.17, -0.05); tie.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(s * 0.25, 0.27, -0.07).normalize());
  }
  root.userData.charScale = 1;
  return registerChar(root, {
    key: 'nia', name: 'Nia Brown', height: 1.65, hitR: 0.45,
    rig: { body, head, eyes, mouth: { mat: face.mat, closed: face.mat.map, open: mouthOpen } },
    dialog: [
      'Hi! I\'m Nia Brown. Welcome to the Number Garden!',
      'My favorite number is 8. Look for the golden 8 on the Magic Gate!',
      'Follow the path to the Addition Bridge — Addie is waiting for us!',
      'Freddy the Fraction Fox is my best friend. He\'s at the Fraction Field.',
      'You can do amazing things — one kind step at a time!',
      'I talk to the flowers here... and they talk back!'
    ],
    update: (t, dt, focus, ud) => {
      armL.rotation.z = 0.18 + Math.sin(t * 1.3) * 0.04;
      if (ud.excite > 0.2) { armL.rotation.z = 2.5 + Math.sin(t * 9) * 0.3; armL.rotation.x = -0.2; } else armL.rotation.x = Math.sin(t * 1.1) * 0.05;
      armR.rotation.x = -0.75 + Math.sin(t * 1.6) * 0.06;
      star.rotation.y = Math.sin(t * 1.2) * 0.6; star.material.emissiveIntensity = 0.7 + Math.sin(t * 3) * 0.25;
    }
  });
}
const NIA = placeChar(buildNia(), 2.4, 41, -0.15);
