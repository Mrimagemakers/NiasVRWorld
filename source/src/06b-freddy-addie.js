// ═════════════════════════════════════════════════════════════════════════════
//  FREDDY THE FRACTION FOX  &  ADDIE THE ADDITION ANT
// ═════════════════════════════════════════════════════════════════════════════
function ringFrame(w, h, t, r) {
  const rr2 = (s, x, y, w2, h2, r2) => { s.moveTo(x + r2, y); s.lineTo(x + w2 - r2, y); s.quadraticCurveTo(x + w2, y, x + w2, y + r2); s.lineTo(x + w2, y + h2 - r2); s.quadraticCurveTo(x + w2, y + h2, x + w2 - r2, y + h2); s.lineTo(x + r2, y + h2); s.quadraticCurveTo(x, y + h2, x, y + h2 - r2); s.lineTo(x, y + r2); s.quadraticCurveTo(x, y, x + r2, y); };
  const s = new THREE.Shape(); rr2(s, -w / 2, -h / 2, w, h, r);
  const hole = new THREE.Path(); rr2(hole, -w / 2 + t, -h / 2 + t, w - 2 * t, h - 2 * t, Math.max(0.005, r - t)); s.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.014, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.003, bevelSegments: 2, curveSegments: 10 }); g.center(); return g;
}
function bushyTail(len, rMax, curl, tipFrac = 0.28, base = 0xEE7A22, tip = 0xFFF4E4) {
  const g = lathe([[0.001, 0], [rMax * 0.5, len * 0.08], [rMax * 0.92, len * 0.32], [rMax, len * 0.55], [rMax * 0.8, len * 0.8], [rMax * 0.35, len * 0.96], [0.001, len]], 28, 40);
  const p = g.attributes.position, col = new Float32Array(p.count * 3), a = new THREE.Color(base), b = new THREE.Color(tip), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i), k = y / len;
    c.copy(a).lerp(b, smooth(1 - tipFrac - 0.05, 1 - tipFrac + 0.06, k)); col.set([c.r, c.g, c.b], i * 3);
    const bend = curl * k * k; p.setX(i, p.getX(i) + bend * len * 0.6); p.setY(i, y - bend * bend * len * 0.15);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals(); return g;
}

// ─── FREDDY ──────────────────────────────────────────────────────────────────
function buildFreddy() {
  const root = grp(), body = grp(root);
  const ORANGE = 0xEE7A22, CREAM = 0xFBE6C8, PAW = skin(0x4E2C16);
  const SHIRT = felt(0xF4BC22), VEST = felt(0x6A3E22, null, THREE.DoubleSide), DEN = denim(0x3F67A8), DEN2 = denim(0x7D9DD2);
  for (const s of [-1, 1]) {
    fur(new THREE.CylinderGeometry(0.058, 0.064, 0.24, 16, 1, true).translate(0, 0.21, 0), ORANGE, { len: 0.012, density: [30, 10] }, root).position.x = s * 0.1;
    makeShoe(root, s * 0.1, { upper: gloss(0x6B4226, 0.55), sole: std(0xEAD9B8, 0.8), toe: std(0x5A361E, 0.6), accent: gloss(0xF2A81D, 0.4), lace: 0xFFE9B0, s: 1.12 });
  }
  mk(lathe([[0.16, 0.42], [0.2, 0.5], [0.208, 0.58], [0.2, 0.64]], 32), DEN, body).scale.z = 0.87;
  for (const s of [-1, 1]) {
    mk(taperTube([[s * 0.1, 0.5, 0], [s * 0.104, 0.36, 0.01]], 0.088, 0.086, 6, 18), DEN, body);
    const roll = mk(new THREE.CylinderGeometry(0.098, 0.096, 0.07, 24), DEN2, body); roll.position.set(s * 0.104, 0.335, 0.01);
    const lip = mk(new THREE.TorusGeometry(0.097, 0.013, 8, 24), DEN2, body); lip.rotation.x = Math.PI / 2; lip.position.set(s * 0.104, 0.37, 0.01);
  }
  // shirt, vest (open front), collar, tie
  mk(lathe([[0.19, 0.6], [0.205, 0.7], [0.21, 0.8], [0.19, 0.88], [0.12, 0.94], [0.05, 0.96]], 36), SHIRT, body).scale.z = 0.85;
  mk(lathe([[0.205, 0.585], [0.22, 0.7], [0.224, 0.8], [0.2, 0.885], [0.15, 0.925]], 40, 40, 0.36, TAU - 0.72), VEST, body).scale.z = 0.86;
  for (const yy of [0.66, 0.745]) mk(new THREE.SphereGeometry(0.014, 12, 8), gloss(0x3B2414, 0.3), body).position.set(Math.sin(0.36) * 0.225, yy, Math.cos(0.36) * 0.225 * 0.86);
  for (const s of [-1, 1]) { const pf = mk(new THREE.BoxGeometry(0.07, 0.022, 0.012), felt(0x5A331C), body); const a = s * 0.85; pf.position.set(Math.sin(a) * 0.224, 0.69, Math.cos(a) * 0.224 * 0.86 + 0.004); pf.rotation.y = a; }
  for (const s of [-1, 1]) { const c = new THREE.Shape(); c.moveTo(0, 0); c.lineTo(s * 0.075, -0.015); c.lineTo(s * 0.03, -0.06); c.closePath(); const cg = new THREE.ExtrudeGeometry(c, { depth: 0.01, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 1 }); const m = mk(cg, felt(0xFFFDF5), body); m.position.set(s * 0.012, 0.935, 0.14); m.rotation.x = -0.45; }
  const tieS = new THREE.Shape(); tieS.moveTo(-0.022, 0); tieS.lineTo(0.022, 0); tieS.lineTo(0.035, -0.17); tieS.lineTo(0, -0.21); tieS.lineTo(-0.035, -0.17); tieS.closePath();
  const tie = mk(new THREE.ExtrudeGeometry(tieS, { depth: 0.01, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2 }), gloss(0xC0262D, 0.45), body); tie.position.set(0, 0.895, 0.178); tie.rotation.x = -0.12;
  mk(new THREE.SphereGeometry(0.025, 14, 10), gloss(0xC0262D, 0.45), body).position.set(0, 0.905, 0.172);
  // arms with dark paws
  const armL = makeArm(body, new THREE.Vector3(0.205, 0.87, 0), 1, { len: 0.33, r0: 0.068, r1: 0.056, sleeve: SHIRT, skinMat: PAW, cuffMat: felt(0xE9A90F), spread: 0.2 });
  const armR = makeArm(body, new THREE.Vector3(-0.205, 0.87, 0), -1, { len: 0.33, r0: 0.068, r1: 0.056, sleeve: SHIRT, skinMat: PAW, cuffMat: felt(0xE9A90F), spread: 0.25 });
  // neck & fox head
  fur(new THREE.CylinderGeometry(0.065, 0.075, 0.1, 16, 1, true).translate(0, 0.965, 0), ORANGE, { len: 0.012, density: [30, 8] }, body);
  const head = grp(body); head.position.y = 1.2;
  const R = 0.24, S = new THREE.Vector3(1.08, 0.95, 1.0);
  const skull = fur(new THREE.SphereGeometry(R, 48, 32), ORANGE, { len: 0.02, density: [90, 45], gravity: 0.3 }, head); skull.scale.copy(S);
  // cream lower face & fluffy cheek ruffs
  for (const s of [-1, 1]) {
    const ch = fur(lumpy(new THREE.SphereGeometry(0.12, 24, 16), 0.1, 6, s), CREAM, { len: 0.022, density: [40, 20] }, head);
    ch.position.copy(onSphere(R, S, s * 0.62, -0.42, -0.05)); ch.scale.set(1.15, 0.8, 0.85);
    const ruff = fur(new THREE.ConeGeometry(0.07, 0.17, 16, 4).rotateZ(s * Math.PI / 2 * 0.85), CREAM, { len: 0.015, density: [30, 20] }, head);
    ruff.position.copy(onSphere(R, S, s * 1.2, -0.42, -0.02));
  }
  const muzzle = grp(head); muzzle.position.set(0, -0.08, 0.17);
  const MS = new THREE.Vector3(1.0, 0.78, 1.3), MR = 0.115;
  fur(new THREE.SphereGeometry(MR, 40, 28), CREAM, { len: 0.008, density: [50, 25] }, muzzle).scale.copy(MS);
  const nose = mk(new THREE.SphereGeometry(0.044, 24, 16), gloss(0x3A2014, 0.2), muzzle); nose.position.set(0, 0.035, MR * MS.z + 0.005); nose.scale.set(1.3, 0.85, 1);
  const paintM = (open) => (x, map, px) => paintMouth(x, map, px, -0.42, 1.25, open, { lip: '#5A2A14', inner: '#4A1010', tongue: '#E36A7A', smile: 1.4 });
  const mDecal = faceDecal(muzzle, MR, MS, { w: 2.2, t0: 1.25, tl: 1.25 }, paintM(0.32));
  const mouthOpen = mDecal.make(paintM(0.5));
  const chin = fur(new THREE.SphereGeometry(0.06, 16, 12), CREAM, { len: 0.01, density: [20, 10] }, head); chin.position.set(0, -0.19, 0.12);
  // eyes, brows, glasses
  const eyes = [-1, 1].map(s => makeEye(head, onSphere(R, S, s * 0.38, 0.12, -0.035), 0.07, 0x6A3812, felt(ORANGE)));
  for (const s of [-1, 1]) { const b = mk(new THREE.CapsuleGeometry(0.016, 0.08, 4, 8), felt(0x7A3A12), head); b.position.copy(onSphere(R, S, s * 0.36, 0.42, 0.012)); b.rotation.set(0, 0, Math.PI / 2 + s * 0.25); }
  const BLACK = gloss(0x101014, 0.25);
  for (const s of [-1, 1]) {
    const fr = mk(ringFrame(0.19, 0.165, 0.026, 0.06), BLACK, head); const ep = onSphere(R, S, s * 0.38, 0.12, 0.0); fr.position.set(ep.x * 1.02, ep.y, ep.z + 0.05); fr.rotation.y = s * 0.3;
    const arm = mk(new THREE.BoxGeometry(0.012, 0.014, 0.24), BLACK, head); arm.position.set(s * 0.255, 0.035, 0.02); arm.rotation.y = s * 0.12;
  }
  mk(new THREE.TorusGeometry(0.03, 0.008, 6, 16, Math.PI), BLACK, head).position.set(0, 0.035, onSphere(R, S, 0, 0.12, 0).z + 0.06);
  // ears: orange outer, cream inner, dark tips
  for (const s of [-1, 1]) {
    const ear = grp(head); ear.position.set(s * 0.15, 0.2, -0.03); ear.rotation.set(-0.12, 0, -s * 0.32);
    mk(new THREE.ConeGeometry(0.105, 0.3, 32, 6).translate(0, 0.15, 0), felt(ORANGE), ear).scale.z = 0.5;
    const inner = mk(new THREE.ConeGeometry(0.07, 0.22, 20).translate(0, 0.11, 0), felt(0xFFE3C4), ear); inner.scale.z = 0.35; inner.position.set(0, 0.01, 0.022);
    const tip = mk(new THREE.ConeGeometry(0.048, 0.1, 20).translate(0, 0.05, 0), felt(0x5A2E14), ear); tip.position.y = 0.205; tip.scale.z = 0.52;
  }
  for (let i = 0; i < 3; i++) { const t = fur(new THREE.ConeGeometry(0.035, 0.11, 12).translate(0, 0.05, 0), ORANGE, { len: 0.008, density: [10, 10] }, head); t.position.set((i - 1) * 0.04, R * S.y - 0.01, 0.06); t.rotation.set(0.5, 0, (i - 1) * 0.4); }
  // bushy tail
  const tailP = grp(body); tailP.position.set(0, 0.5, -0.17); tailP.rotation.set(-0.95, 0, 0.45);
  fur(bushyTail(0.62, 0.15, 1.0), 0xffffff, { len: 0.03, density: [40, 50], vertexColors: true, gravity: 0.1 }, tailP);
  return registerChar(root, {
    key: 'freddy', name: 'Freddy the Fraction Fox', height: 1.62, hitR: 0.5,
    rig: { body, head, eyes, mouth: { mat: mDecal.mat, closed: mDecal.mat.map, open: mouthOpen } },
    dialog: [
      'Hi, I\'m Freddy the Fraction Fox! Make sense, make progress, have fun!',
      'This picnic pizza has 8 equal slices. One slice is 1/8 of the whole pizza!',
      'Look at the flower beds: halves, thirds, quarters and eighths!',
      'Every whole is made of parts — and every part matters!',
      'Nia is my best friend. We split everything into fair shares!'
    ],
    update: (t, dt, focus, ud) => {
      tailP.rotation.z = 0.45 + Math.sin(t * 1.8) * 0.25;
      armL.rotation.z = 0.2 + Math.sin(t * 1.2) * 0.04;
      if (ud.excite > 0.2) { armR.rotation.z = -2.7; armR.rotation.x = 0.1 + Math.sin(t * 6) * 0.08; } else { armR.rotation.z = -0.25 + Math.sin(t * 1.2 + 1) * 0.04; armR.rotation.x = 0; }
    }
  });
}
const FREDDY = placeChar(buildFreddy(), LM.fraction.x - 2.2, LM.fraction.z + 1.6, faceYawTo(LM.fraction.x - 2.2, LM.fraction.z + 1.6, 26, 2));

// ─── ADDIE ───────────────────────────────────────────────────────────────────
function buildAddie() {
  const root = grp(), body = grp(root);
  const YEL = new THREE.MeshPhysicalMaterial({ color: 0xF6CF45, roughness: 0.42, sheen: 0.6, sheenColor: new THREE.Color(0xFFF2B0), clearcoat: 0.25, clearcoatRoughness: 0.35 });
  const BOOT = gloss(0x7A4421, 0.5), LEATHER = gloss(0x7A4A24, 0.55);
  for (const s of [-1, 1]) {
    mk(taperTube([[s * 0.09, 0.5, 0], [s * 0.095, 0.3, 0.02], [s * 0.09, 0.14, 0.01]], 0.055, 0.048, 10, 14), YEL, root);
    const bt = grp(root); bt.position.set(s * 0.09, 0, 0.02);
    mk(new THREE.CylinderGeometry(0.068, 0.075, 0.15, 20).translate(0, 0.1, -0.01), BOOT, bt);
    const toe = mk(new THREE.SphereGeometry(0.075, 20, 14), BOOT, bt); toe.scale.set(1, 0.65, 1.3); toe.position.set(0, 0.05, 0.05);
    mk(new RoundedBox(0.15, 0.03, 0.25, 0.012), std(0x3A2414, 0.8), bt).position.set(0, 0.015, 0.03);
    const fold = mk(new THREE.TorusGeometry(0.072, 0.016, 8, 22), gloss(0x8E5631, 0.5), bt); fold.rotation.x = Math.PI / 2; fold.position.y = 0.18;
    for (let i = 0; i < 3; i++) mk(new THREE.BoxGeometry(0.06, 0.008, 0.01), std(0xF0D9A0), bt).position.set(0, 0.08 + i * 0.03, 0.07);
  }
  // abdomen (gaster) behind
  const gas = mk(new THREE.SphereGeometry(0.21, 32, 24), YEL, body); gas.scale.set(1, 1.1, 1.3); gas.position.set(0, 0.48, -0.2);
  for (let i = 0; i < 3; i++) { const band = mk(new THREE.TorusGeometry(0.2 - i * 0.03, 0.008, 8, 32), std(0xE1B12E, 0.5), body); band.position.set(0, 0.48, -0.26 - i * 0.07); band.scale.set(1, 1.08, 1); }
  // thorax
  mk(lathe([[0.13, 0.5], [0.17, 0.58], [0.18, 0.7], [0.165, 0.82], [0.1, 0.9], [0.05, 0.92]], 32), YEL, body).scale.z = 0.9;
  // safety vest (green with orange reflective bands), open front
  const vestTex = canvasTex(512, 256, (x, w, h) => {
    x.fillStyle = '#7CC243'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#F7941D'; x.fillRect(0, h * 0.45, w, h * 0.13); x.fillRect(0, h * 0.75, w, h * 0.1);
    x.fillRect(0, 0, w * 0.06, h); x.fillRect(w * 0.94, 0, w * 0.06, h);
    x.fillStyle = 'rgba(255,255,255,0.35)'; x.fillRect(0, h * 0.48, w, h * 0.02); x.fillRect(0, h * 0.77, w, h * 0.015);
  });
  const vest = mk(lathe([[0.15, 0.5], [0.182, 0.58], [0.19, 0.7], [0.175, 0.82], [0.12, 0.885]], 40, 30, 0.42, TAU - 0.84), new THREE.MeshPhysicalMaterial({ map: vestTex, roughness: 0.75, sheen: 0.6, sheenColor: new THREE.Color(0xD0FFB0), side: THREE.DoubleSide }), body);
  vest.scale.z = 0.92;
  // tool belt with pouches and buckle
  const belt = mk(new THREE.CylinderGeometry(0.18, 0.18, 0.065, 36, 1, true), new THREE.MeshPhysicalMaterial({ color: 0x7A4A24, roughness: 0.55, side: THREE.DoubleSide, clearcoat: 0.3 }), body); belt.position.y = 0.52; belt.scale.z = 0.92;
  const buckle = mk(ringFrame(0.075, 0.06, 0.014, 0.008), GOLD, body); buckle.position.set(0, 0.52, 0.172);
  for (const s of [-1, 1]) { const p = mk(new RoundedBox(0.09, 0.1, 0.06, 0.015), LEATHER, body); p.position.set(s * 0.15, 0.48, 0.09); p.rotation.y = s * 0.7; const f = mk(new RoundedBox(0.094, 0.035, 0.065, 0.01), gloss(0x8E5631, 0.5), body); f.position.set(s * 0.152, 0.52, 0.092); f.rotation.y = s * 0.7; }
  // arms (yellow, 3 fingers + thumb)
  const armL = makeArm(body, new THREE.Vector3(0.17, 0.83, 0), 1, { len: 0.32, r0: 0.048, r1: 0.04, sleeve: YEL, skinMat: YEL, bare: true, fingers: 3, spread: 0.3, handScale: 1.15 });
  const armR = makeArm(body, new THREE.Vector3(-0.17, 0.83, 0), -1, { len: 0.32, r0: 0.048, r1: 0.04, sleeve: YEL, skinMat: YEL, bare: true, fingers: 3, spread: 0.3, handScale: 1.15 });
  // head
  mk(new THREE.CylinderGeometry(0.05, 0.06, 0.12, 14), YEL, body).position.y = 0.95;
  const head = grp(body); head.position.y = 1.19;
  const R = 0.27, S = new THREE.Vector3(1, 0.95, 0.95);
  mk(new THREE.SphereGeometry(R, 48, 36), YEL, head).scale.copy(S);
  const eyes = [-1, 1].map(s => makeEye(head, onSphere(R, S, s * 0.33, 0.02, -0.04), 0.082, 0x3C9A3E, YEL));
  const paint = (open) => (x, map, px) => {
    for (const s of [-1, 1]) paintBrow(x, map, px, s * 0.34, 0.36, 0.22, 0.04, '#9A6A18', -s * 0.18, 0.4);
    paintBlush(x, map, px, 0.52, -0.22, 0.14, 'rgba(255,140,90,0.35)');
    paintMouth(x, map, px, -0.33, 0.62, open, { lip: '#8A4A12', inner: '#6B1A12', tongue: '#F06A6A', smile: 1.3 });
  };
  const face = faceDecal(head, R, S, { w: 2.0, t0: 0.75, tl: 1.45 }, paint(0.2));
  const mouthOpen = face.make(paint(0.3));
  const nose = mk(new THREE.SphereGeometry(0.03, 16, 12), YEL, head); nose.position.copy(onSphere(R, S, 0, -0.1, -0.005));
  // hard hat
  const HAT = new THREE.MeshPhysicalMaterial({ color: 0xF4C21C, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.15 });
  const hat = grp(head); hat.position.y = 0.05; hat.rotation.x = -0.12;
  mk(new THREE.SphereGeometry(R * 1.06, 48, 24, 0, TAU, 0, Math.PI / 2), HAT, hat).scale.set(1.02, 0.95, 1.05);
  const brim = mk(new THREE.CylinderGeometry(R * 1.2, R * 1.24, 0.022, 48), HAT, hat); brim.position.set(0, 0.0, 0.03); brim.scale.z = 1.12;
  mk(new THREE.TorusGeometry(R * 0.6, 0.022, 10, 40, Math.PI), HAT, hat).rotation.y = Math.PI / 2;
  // curly antennae poking through the hat
  for (const s of [-1, 1]) mk(taperTube([[s * 0.07, 0.24, 0.02], [s * 0.14, 0.42, 0.06], [s * 0.26, 0.55, 0.08], [s * 0.34, 0.52, 0.1], [s * 0.33, 0.47, 0.11]], 0.016, 0.012, 24, 8), YEL, hat);
  return registerChar(root, {
    key: 'addie', name: 'Addie the Addition Ant', height: 1.62, hitR: 0.45,
    rig: { body, head, eyes, mouth: { mat: face.mat, closed: face.mat.map, open: mouthOpen } },
    dialog: [
      'Hi! I\'m Addie the Addition Ant. Build, solve and have fun!',
      'Look up at the bridge: 3 + 5 = 8! Adding brings numbers together.',
      'Together we add up to something great!',
      'I can carry 20 blocks! 10 + 10 = 20.',
      'High five! Now cross the bridge to find Freddy at the Fraction Field.'
    ],
    update: (t, dt, focus, ud) => {
      if (ud.excite > 0.2) { armR.rotation.z = -2.6 + Math.sin(t * 9) * 0.25; } else armR.rotation.z = -0.3 + Math.sin(t * 1.4) * 0.05;
      armL.rotation.z = 0.35 + Math.sin(t * 1.4 + 1) * 0.05; armL.rotation.x = -0.15;
      hat.rotation.z = Math.sin(t * 1.1) * 0.02;
    }
  });
}
const ADDIE = placeChar(buildAddie(), -2.9, BRIDGE.zs + 2.8, 0.35);
