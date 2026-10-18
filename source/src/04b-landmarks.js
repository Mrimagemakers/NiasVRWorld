// ═════════════════════════════════════════════════════════════════════════════
//  LANDMARKS (part 2)
// ═════════════════════════════════════════════════════════════════════════════

// ─── 6 · THE SHAPE GREENHOUSE ────────────────────────────────────────────────
{
  const L = LM.greenhouse, y = H(L.x, L.z), g = grp(); g.position.set(L.x, y, L.z);
  const W = 10, D = 7, WH = 3.1, PK = 5.2;
  const floor = mk(new THREE.BoxGeometry(W + 0.6, 0.3, D + 0.6), stoneMat, g); floor.position.y = 0.05;
  const frame = new THREE.MeshStandardMaterial({ color: 0xF6F4EE, roughness: 0.4, metalness: 0.2 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xE6FFF5, transparent: true, opacity: 0.16, roughness: 0.02, metalness: 0, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 2 });
  const beams = [];
  const beam = (x1, y1, z1, x2, y2, z2, r = 0.06) => { const a = new THREE.Vector3(x1, y1, z1), b = new THREE.Vector3(x2, y2, z2), l = a.distanceTo(b); const c = new THREE.BoxGeometry(r * 2, l, r * 2); c.translate(0, l / 2, 0); c.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize())); c.translate(a.x, a.y, a.z); beams.push(c.toNonIndexed()); };
  for (let i = 0; i <= 5; i++) { const x = -W / 2 + i * W / 5; for (const z of [-D / 2, D / 2]) { if (z > 0 && Math.abs(x) < 1.1) continue; beam(x, 0.2, z, x, WH, z); beam(x, WH, z, x, PK, 0); } }
  for (let i = 0; i <= 4; i++) { const z = -D / 2 + i * D / 4; for (const x of [-W / 2, W / 2]) beam(x, 0.2, z, x, PK - (PK - WH) * Math.abs(z) / (D / 2), z); }
  for (const z of [-D / 2, D / 2]) { beam(-W / 2, WH, z, W / 2, WH, z); beam(-W / 2, 1.2, z, z > 0 ? -1.1 : W / 2, 1.2, z); if (z > 0) beam(1.1, 1.2, z, W / 2, 1.2, z); }
  for (const x of [-W / 2, W / 2]) { beam(x, WH, -D / 2, x, WH, D / 2); beam(x, WH, -D / 2, x, PK, 0); beam(x, WH, D / 2, x, PK, 0); }
  beam(-W / 2, PK, 0, W / 2, PK, 0, 0.09);
  // door frame
  beam(-1.1, 0.2, D / 2, -1.1, 2.5, D / 2); beam(1.1, 0.2, D / 2, 1.1, 2.5, D / 2); beam(-1.1, 2.5, D / 2, 1.1, 2.5, D / 2);
  mk(mergeGeometries(beams), frame, g);
  // glass panels
  const pane = (geo, x, yy, z, ry = 0, rx = 0) => { const m = mk(geo, glass, g, false, false); m.position.set(x, yy, z); m.rotation.set(rx, ry, 0); m.renderOrder = 2; };
  pane(new THREE.PlaneGeometry(W, WH - 0.2), 0, WH / 2 + 0.1, -D / 2);
  pane(new THREE.PlaneGeometry(W / 2 - 1.1, WH - 0.2), -W / 4 - 0.55, WH / 2 + 0.1, D / 2); pane(new THREE.PlaneGeometry(W / 2 - 1.1, WH - 0.2), W / 4 + 0.55, WH / 2 + 0.1, D / 2);
  pane(new THREE.PlaneGeometry(D, WH - 0.2), -W / 2, WH / 2 + 0.1, 0, Math.PI / 2); pane(new THREE.PlaneGeometry(D, WH - 0.2), W / 2, WH / 2 + 0.1, 0, Math.PI / 2);
  const rl = Math.hypot(D / 2, PK - WH), ra = Math.atan2(PK - WH, D / 2);
  pane(new THREE.PlaneGeometry(W, rl), 0, (WH + PK) / 2, -D / 4, 0, Math.PI / 2 - ra); pane(new THREE.PlaneGeometry(W, rl), 0, (WH + PK) / 2, D / 4, 0, -Math.PI / 2 + ra);
  for (const s of [-1, 1]) { const tri = new THREE.Shape(); tri.moveTo(-D / 2, 0); tri.lineTo(D / 2, 0); tri.lineTo(0, PK - WH); tri.closePath(); pane(new THREE.ShapeGeometry(tri), s * W / 2, WH, 0, Math.PI / 2); }
  // shape sculptures on pedestals
  const shapes = [
    [new THREE.SphereGeometry(0.55, 40, 30), 0xFF4D4D, 'SPHERE'], [new RoundedBox(0.95, 0.95, 0.95), 0x3A86FF, 'CUBE'], [new THREE.ConeGeometry(0.62, 1.1, 4), 0xFFD23F, 'PYRAMID'],
    [new THREE.CylinderGeometry(0.45, 0.45, 1.0, 40), 0x2EC4B6, 'CYLINDER'], [new THREE.TorusGeometry(0.42, 0.18, 24, 48), 0x8B5CF6, 'TORUS'], [new THREE.ConeGeometry(0.55, 1.1, 40), 0xFF8A1F, 'CONE']
  ];
  shapes.forEach(([geo, col, name], i) => {
    const px = -3.6 + (i % 3) * 3.6, pz = i < 3 ? -1.6 : 1.1;
    mk(lathe([[0.55, 0], [0.45, 0.12], [0.32, 0.25], [0.3, 0.85], [0.48, 0.95], [0.48, 1.05], [0.001, 1.06]], 24), stoneMat, g).position.set(px, 0.2, pz);
    const m = mk(geo, new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.1 }), g); m.position.set(px, 2.0, pz);
    floater(m, 0.15, 1.1, 0.5);
  });
  // hexagon & triangle planters outside
  for (let i = 0; i < 6; i++) {
    const sides = [3, 4, 5, 6, 8, 3][i], x = L.x + (i < 3 ? -7 : 7.2), z = L.z - 2.5 + (i % 3) * 2.6, yy = H(x, z);
    const pl = mk(new THREE.CylinderGeometry(0.75, 0.6, 0.6, sides), gloss(RAINBOW[i + 2], 0.4), scene); pl.position.set(x, yy + 0.3, z);
    const soil = mk(new THREE.CylinderGeometry(0.7, 0.7, 0.05, sides), std(0x4a3020, 1), scene, false); soil.position.set(x, yy + 0.58, z);
    plantFlowers(Array.from({ length: 5 }, () => ({ x: x + rr(-0.35, 0.35), z: z + rr(-0.35, 0.35), y: yy + 0.6, s: rr(0.7, 1), c: FLOWER_COLS[i % FLOWER_COLS.length] })));
  }
  const sg = signBoard(L.x, L.z + D / 2 + 0.25, 0, ['SHAPE GREENHOUSE'], 4.4, 0.8, 2.75, { w: 1024, h: 180 });
}
function RoundedBox(w, h, d, r = 0.12) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ExtrudeGeometry(s, { depth: d - r * 2, bevelEnabled: true, bevelThickness: r, bevelSize: r * 0.9, bevelSegments: 4, curveSegments: 6 });
  g.translate(0, 0, -(d - r * 2) / 2); g.computeVertexNormals(); return g;
}

// ─── 8 · MILLY'S MULTIPLICATION TREES (3 rows × 4 trees) ─────────────────────
const ORCHARD = {};
{
  const L = LM.orchard, trees = [], fruits = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
    const x = L.x - 6 + c * 4, z = L.z - 3.6 + r * 3.8;
    trees.push({ x, z, s: 0.72, ry: rand() * TAU, proto: (r + c) % 3, tint: 0xD8FFC8 });
    for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + 0.4; fruits.push(new THREE.Vector3(x + Math.cos(a) * 1.25, H(x, z) + 2.4 + (k % 2) * 0.5, z + Math.sin(a) * 1.25)); }
  }
  plantTrees(trees);
  const fm = new THREE.InstancedMesh(new THREE.SphereGeometry(0.2, 16, 12), new THREE.MeshStandardMaterial({ color: 0xFFE27A, emissive: 0xFFC94D, emissiveIntensity: 1.6, roughness: 0.3 }), fruits.length);
  fruits.forEach((p, i) => setInst(fm, i, p.x, p.y, p.z, 0, 1)); scene.add(fm);
  ORCHARD.fruits = fm;
  plantFlowers(Array.from({ length: 160 }, () => { const x = L.x + rr(-8.5, 8.5), z = L.z + rr(-5.5, 5.5); return { x, z, s: rr(0.7, 1.1), c: [0xB065E8, 0xC77DFF, 0xE2CCFF, 0xFFE27A][(rand() * 4) | 0] }; }));
  const eq = grp(); eq.position.set(L.x, H(L.x, L.z) + 6.2, L.z + 4);
  ['3', '×', '4', '=', '12'].forEach((c, i) => { const m = text3D(c, 0.7, new THREE.MeshPhysicalMaterial({ color: i % 2 ? 0xFFE27A : 0xC77DFF, emissive: i % 2 ? 0xFFC94D : 0x7B2CBF, emissiveIntensity: 0.6, roughness: 0.25, clearcoat: 1 }), 0.3); m.position.x = (i - 2) * 1.0 + (i === 4 ? 0.25 : 0); eq.add(m); floater(m, 0.1, 1.4); });
  signBoard(L.x + 9.5, L.z + 6.2, 0.5, ['MULTIPLICATION TREES', '3 groups of 4'], 3.8, 1.3);
}

// ─── 10 · THE PATTERN POND ───────────────────────────────────────────────────
{
  const L = LM.pond, P = POND;
  // lily pads in a repeating A-B pattern ring
  const padG = new THREE.CircleGeometry(0.75, 28, 0.35, TAU - 0.7); padG.rotateX(-Math.PI / 2);
  const padMat = new THREE.MeshPhysicalMaterial({ color: 0x3E9B3A, roughness: 0.35, clearcoat: 0.7, side: THREE.DoubleSide });
  const pads = new THREE.InstancedMesh(padG, padMat, 16); pads.receiveShadow = true;
  const lilies = [];
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * TAU, x = P.x + Math.cos(a) * 5.2, z = P.z + Math.sin(a) * 5.2;
    setInst(pads, i, x, WATER_Y + 0.03, z, rand() * TAU, i % 2 ? 0.8 : 1.05);
    pads.setColorAt(i, _c.setHex(i % 2 ? 0x9FE07A : 0xffffff));
    // pattern: pink, white, pink, white …
    const fl = grp(); fl.position.set(x, WATER_Y + 0.05, z);
    const col = i % 2 ? 0xFFFFFF : 0xFF7EB6;
    for (let k = 0; k < 10; k++) { const pt = mk(new THREE.SphereGeometry(0.2, 10, 8), new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.4, sheen: 1, sheenColor: new THREE.Color(0xffffff) }), fl, false); pt.scale.set(0.45, 0.25, 1); pt.position.set(Math.cos(k / 10 * TAU) * 0.16, 0.12 + (k % 2) * 0.05, Math.sin(k / 10 * TAU) * 0.16); pt.rotation.y = -k / 10 * TAU; pt.rotation.z = 0.5; }
    mk(new THREE.SphereGeometry(0.08, 10, 8), std(0xFFD23F, 0.5), fl, false).position.y = 0.16;
    lilies.push(fl); fl.userData.dynamic = true;
  }
  scene.add(pads);
  // stepping stones in a red-yellow-blue pattern across the pond
  const sc = [0xFF4D4D, 0xFFD23F, 0x3A86FF];
  for (let i = 0; i < 9; i++) {
    const t = i / 8, x = P.x - 7 + t * 14, z = P.z + Math.sin(t * Math.PI) * 1.6;
    const st = mk(lumpy(new THREE.CylinderGeometry(0.55, 0.65, 0.4, 16), 0.08, 2, i), new THREE.MeshPhysicalMaterial({ color: sc[i % 3], roughness: 0.45, clearcoat: 0.5 }), scene); st.position.set(x, WATER_Y + 0.12, z);
  }
  // reeds & cattails
  const reedN = 90, reeds = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.02, 0.035, 1.6, 5).translate(0, 0.8, 0), windify(std(0x4F8A2E, 0.8), 0.04), reedN);
  const tails = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.06, 0.28, 4, 8).translate(0, 1.55, 0), windify(std(0x6B3F1F, 0.9), 0.04), reedN);
  for (let i = 0; i < reedN; i++) { const a = rand() * TAU, r = P.r + rr(-0.6, 1.2), x = P.x + Math.cos(a) * r, z = P.z + Math.sin(a) * r, s = rr(0.7, 1.3); if (Math.abs(Math.sin(a)) < 0.25) { setInst(reeds, i, 0, -99, 0, 0, 0); setInst(tails, i, 0, -99, 0, 0, 0); continue; } setInst(reeds, i, x, WATER_Y, z, rand() * TAU, 1, s, 1, rr(-0.1, 0.1)); setInst(tails, i, x, WATER_Y, z, rand() * TAU, 1, s, 1); }
  scene.add(reeds, tails);
  // little dock
  const dk = grp(); dk.position.set(P.x + 2, 0, P.z + P.r + 1.2); dk.rotation.y = 0.1;
  for (let i = 0; i < 9; i++) { const pl = mk(new THREE.BoxGeometry(1.8, 0.1, 0.32), woodMat, dk); pl.position.set(0, WATER_Y + 0.55, -i * 0.36); }
  for (const s of [-1, 1]) for (const zz of [0, -2.9]) { const p = mk(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 8), darkWood, dk); p.position.set(s * 0.85, WATER_Y + 0.2, zz); }
  ANIM.push((t) => { lilies.forEach((l, i) => { l.position.y = WATER_Y + 0.05 + Math.sin(t * 1.3 + i) * 0.02; }); });
  signBoard(P.x + 10, P.z + 6, -0.9, ['PATTERN POND', 'Pink, White, Pink, White...'], 3.6, 1.3);
}

// ─── 11 · THE MEASUREMENT MEADOW ─────────────────────────────────────────────
{
  const L = LM.meadow, y = H(L.x, L.z), g = grp(); g.position.set(L.x, y, L.z); g.rotation.y = Math.PI / 2 - 0.2;
  const rulerTex = canvasTex(1024, 128, (x, w, h) => {
    x.fillStyle = '#FFD54A'; x.fillRect(0, 0, w, h); x.strokeStyle = '#5A3A10'; x.fillStyle = '#5A3A10';
    for (let i = 0; i <= 120; i++) { const px = 12 + i * (w - 24) / 120, len = i % 10 === 0 ? 60 : i % 5 === 0 ? 40 : 22; x.lineWidth = i % 10 ? 2 : 4; x.beginPath(); x.moveTo(px, 0); x.lineTo(px, len); x.stroke(); }
    x.font = 'bold 40px "Fredoka One", Arial'; x.textAlign = 'center';
    for (let i = 0; i <= 12; i++) x.fillText(String(i), 12 + i * (w - 24) / 12, 112);
  });
  const ruler = mk(new THREE.BoxGeometry(12, 1.0, 0.18), [std(0xE0B23A), std(0xE0B23A), std(0xE0B23A), std(0xE0B23A), new THREE.MeshStandardMaterial({ map: rulerTex, roughness: 0.6 }), new THREE.MeshStandardMaterial({ map: rulerTex, roughness: 0.6 })], g);
  ruler.position.set(0, 1.0, -1.6);
  for (const xx of [-5.6, 0, 5.6]) mk(new THREE.BoxGeometry(0.2, 1.2, 0.2), darkWood, g).position.set(xx, 0.55, -1.75);
  // sunflowers of increasing height (Nia's favourite flower)
  const sunTex = canvasTex(256, 256, (x) => {
    x.fillStyle = '#5A3311'; x.beginPath(); x.arc(128, 128, 120, 0, TAU); x.fill();
    for (let i = 0; i < 300; i++) { const a = i * 2.39996, r = Math.sqrt(i) * 6.8; x.fillStyle = i % 3 ? '#3B1F08' : '#7A4A1C'; x.beginPath(); x.arc(128 + Math.cos(a) * r, 128 + Math.sin(a) * r, 3.2, 0, TAU); x.fill(); }
  });
  for (let i = 0; i < 6; i++) {
    const hgt = 1.0 + i * 0.75, sx = -5 + i * 2, sf = grp(g); sf.position.set(sx, 0, 0.2);
    mk(new THREE.CylinderGeometry(0.06, 0.09, hgt, 8).translate(0, hgt / 2, 0), std(0x4E9A2E, 0.7), sf);
    for (const s of [-1, 1]) { const lf = mk(new THREE.SphereGeometry(0.3, 12, 8), std(0x4E9A2E, 0.6), sf); lf.scale.set(1.3, 0.12, 0.6); lf.position.set(s * 0.3, hgt * 0.45, 0); lf.rotation.z = s * 0.4; }
    const head = grp(sf); head.position.set(0, hgt, 0.08); head.rotation.x = 0.25; head.userData.dynamic = true;
    const disc = mk(new THREE.CylinderGeometry(0.42, 0.42, 0.14, 32), [std(0x5A3311), new THREE.MeshStandardMaterial({ map: sunTex, roughness: 0.9 }), std(0x5A3311)], head); disc.rotation.x = Math.PI / 2;
    for (let k = 0; k < 22; k++) { const a = k / 22 * TAU, p = mk(new THREE.SphereGeometry(0.2, 10, 6), new THREE.MeshPhysicalMaterial({ color: k % 2 ? 0xFFC915 : 0xFFD84A, roughness: 0.5, sheen: 1, sheenColor: new THREE.Color(0xFFF2A0) }), head, false); p.scale.set(0.42, 1, 0.12); p.position.set(Math.cos(a) * 0.55, Math.sin(a) * 0.55, -0.02); p.rotation.z = a - Math.PI / 2; }
    const lbl = text3D(String(i + 1), 0.3, gloss(0xFFFFFF, 0.3), 0.3); lbl.position.set(0, 0.25, 0.4); sf.add(lbl);
    ANIM.push((t) => { head.rotation.z = Math.sin(t * 0.8 + i) * 0.06; });
  }
  // giant measuring wand stuck in the ground
  const wand = grp(g); wand.position.set(6.8, 0, 0.6); wand.rotation.z = -0.12;
  mk(new THREE.BoxGeometry(0.3, 3.4, 0.12).translate(0, 1.7, 0), new THREE.MeshStandardMaterial({ map: rulerTex, roughness: 0.6 }), wand);
  const star = text3D('8', 0.5, glow(0xFFD86B, 1.8), 0.3); star.position.y = 3.75; wand.add(star); floater(star, 0.08, 2, 1.5);
  signBoard(L.x + 6.5, L.z + 6.5, -Math.PI / 2 - 0.8, ['MEASUREMENT MEADOW', 'Which sunflower is tallest?'], 3.8, 1.3);
}

// ─── 12 · THE TIME FLOWER ────────────────────────────────────────────────────
const TIMEFLOWER = {};
{
  const L = LM.timeflower, y = H(L.x, L.z), g = grp(); g.position.set(L.x, y, L.z);
  g.rotation.y = 1.95;   // face the loop path
  mk(taperTube([[0, 0, 0], [0.3, 2, 0.1], [0.1, 4, 0.3], [0, 5.2, 0.5]], 0.28, 0.16, 24, 12), new THREE.MeshPhysicalMaterial({ color: 0x3E9B3A, roughness: 0.5, sheen: 0.4, sheenColor: new THREE.Color(0xCCFFAA) }), g);
  for (const [s, hh] of [[-1, 1.4], [1, 2.6]]) { const lf = mk(new THREE.SphereGeometry(1, 20, 12), new THREE.MeshPhysicalMaterial({ color: 0x4DB04A, roughness: 0.45, clearcoat: 0.3 }), g); lf.scale.set(1.5, 0.12, 0.55); lf.position.set(s * 1.1, hh, 0.1); lf.rotation.z = s * 0.45; }
  const head = grp(g); head.position.set(0, 5.4, 0.6); head.rotation.x = 0.2; head.userData.dynamic = true;
  for (let k = 0; k < 12; k++) { const a = k / 12 * TAU, p = mk(new THREE.SphereGeometry(0.7, 20, 14), new THREE.MeshPhysicalMaterial({ color: k % 2 ? 0xFF6FAE : 0xFF8FC0, roughness: 0.45, sheen: 1, sheenColor: new THREE.Color(0xFFE0F0) }), head); p.scale.set(0.62, 1.15, 0.2); p.position.set(Math.cos(a) * 1.75, Math.sin(a) * 1.75, -0.1); p.rotation.z = a - Math.PI / 2; }
  const faceTex = canvasTex(512, 512, (x) => {
    const gr = x.createRadialGradient(256, 256, 30, 256, 256, 256); gr.addColorStop(0, '#FFFDF2'); gr.addColorStop(1, '#FFE7A8'); x.fillStyle = gr; x.beginPath(); x.arc(256, 256, 250, 0, TAU); x.fill();
    x.strokeStyle = '#C98A1B'; x.lineWidth = 14; x.stroke();
    x.fillStyle = '#7A3E8E'; x.font = '64px "Fredoka One", Arial'; x.textAlign = 'center'; x.textBaseline = 'middle';
    for (let i = 1; i <= 12; i++) { const a = i / 12 * TAU - Math.PI / 2; x.fillText(String(i), 256 + Math.cos(a) * 190, 256 + Math.sin(a) * 190); }
    for (let i = 0; i < 60; i++) { const a = i / 60 * TAU; x.lineWidth = i % 5 ? 3 : 7; x.strokeStyle = '#B07A20'; x.beginPath(); x.moveTo(256 + Math.cos(a) * 232, 256 + Math.sin(a) * 232); x.lineTo(256 + Math.cos(a) * (i % 5 ? 222 : 212), 256 + Math.sin(a) * (i % 5 ? 222 : 212)); x.stroke(); }
  });
  const face = mk(new THREE.CylinderGeometry(1.35, 1.35, 0.22, 64), [GOLD, new THREE.MeshPhysicalMaterial({ map: faceTex, roughness: 0.4, clearcoat: 1 }), GOLD], head); face.rotation.x = Math.PI / 2;
  const handM = new THREE.MeshStandardMaterial({ color: 0x5B2A86, roughness: 0.3, metalness: 0.4 });
  const hourP = grp(head), minP = grp(head); hourP.position.z = minP.position.z = 0.14;
  mk(new THREE.BoxGeometry(0.11, 0.7, 0.05).translate(0, 0.33, 0), handM, hourP); mk(new THREE.BoxGeometry(0.07, 1.05, 0.05).translate(0, 0.5, 0.03), handM, minP);
  mk(new THREE.SphereGeometry(0.11, 16, 12), GOLD, head).position.z = 0.2;
  TIMEFLOWER.hour = hourP; TIMEFLOWER.min = minP;
  ANIM.push(() => { const d = new Date(), m = d.getMinutes() + d.getSeconds() / 60, hh = (d.getHours() % 12) + m / 60; minP.rotation.z = -m / 60 * TAU; hourP.rotation.z = -hh / 12 * TAU; });
  ANIM.push((t) => { head.rotation.z = Math.sin(t * 0.5) * 0.03; });
  signBoard(L.x + 4.5, L.z - 3, 1.75, ['THE TIME FLOWER', 'It shows the real time!'], 3.4, 1.2);
}

// ─── 13 · THE MARKET OF MONEY ────────────────────────────────────────────────
{
  const L = LM.market, stalls = [[-5, 0, 0.6, '#E63946', 'APPLES 5¢', 0xD62828], [0, -3.5, 0, '#3A86FF', 'FLOWERS 10¢', 0xFF7EB6], [5, 0, -0.6, '#2A9D8F', 'BERRIES 25¢', 0x7B2CBF]];
  stalls.forEach(([dx, dz, ry, col, label, fruit]) => {
    const x = L.x + dx, z = L.z + dz, g = grp(); g.position.set(x, H(x, z), z); g.rotation.y = ry;
    mk(new THREE.BoxGeometry(3.2, 1.0, 1.3).translate(0, 0.5, 0), woodMat, g);
    for (const sx of [-1.5, 1.5]) for (const sz of [-0.55, 0.55]) mk(new THREE.CylinderGeometry(0.06, 0.06, 2.8, 8).translate(0, 1.4, 0), darkWood, g).position.set(sx, 0, sz);
    const aw = canvasTex(256, 64, (c) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#FFFFFF' : col; c.fillRect(i * 32, 0, 32, 64); } });
    const awning = mk(new THREE.CylinderGeometry(1.0, 1.0, 3.5, 24, 1, true, -Math.PI / 2, Math.PI), new THREE.MeshPhysicalMaterial({ map: aw, side: THREE.DoubleSide, roughness: 0.8, sheen: 0.6, sheenColor: new THREE.Color(0xffffff) }), g);
    awning.rotation.z = Math.PI / 2; awning.position.y = 2.75; awning.scale.set(0.5, 1, 1.05);
    // wares
    const crate = mk(new THREE.BoxGeometry(1.0, 0.35, 0.8), darkWood, g); crate.position.set(-0.8, 1.17, 0);
    for (let i = 0; i < 9; i++) { const f = mk(new THREE.SphereGeometry(0.13, 14, 10), gloss(fruit, 0.3), g); f.position.set(-1.1 + (i % 3) * 0.3, 1.42, -0.25 + Math.floor(i / 3) * 0.25); }
    for (let s = 0; s < 3; s++) { const n = 3 + s * 2; for (let k = 0; k < n; k++) { const c = mk(new THREE.CylinderGeometry(0.14, 0.14, 0.04, 20), GOLD, g); c.position.set(0.4 + s * 0.38, 1.02 + k * 0.045, 0.2); } }
    const tag = signBoard(0, 0, 0, [label], 1.6, 0.5, 0, { w: 512, h: 160, bg: '#FFF5DC', border: '#8B5A2B', fg: '#2F6B2F' }); g.add(tag); tag.position.set(0, 1.05, 0.68); tag.rotation.y = 0;
  });
  // bunting
  const bunt = []; for (let i = 0; i <= 20; i++) { const t = i / 20, x = L.x - 6.5 + t * 13, z = L.z + 1.5 - Math.sin(t * Math.PI) * 2; bunt.push([x, H(x, z) + 3.6 - Math.sin(t * Math.PI) * 0.5, z]); }
  mk(tube(bunt, 0.015, 40, 4), std(0xFFFFFF), scene, false);
  for (let i = 1; i < 20; i++) { const [x, yy, z] = bunt[i]; const f = mk(new THREE.ConeGeometry(0.18, 0.4, 3), std(RAINBOW[i % 10], 0.7), scene, false); f.position.set(x, yy - 0.22, z); f.rotation.x = Math.PI; }
  // giant golden coin
  const coin = grp(); coin.position.set(L.x, H(L.x, L.z) + 2.4, L.z + 3);
  mk(new THREE.CylinderGeometry(1.0, 1.0, 0.18, 48), GOLD, coin).rotation.x = Math.PI / 2;
  const cs = text3D('25', 0.6, new THREE.MeshStandardMaterial({ color: 0xFFE9A8, metalness: 1, roughness: 0.2 }), 0.25); cs.position.z = 0.11; coin.add(cs);
  const cs2 = cs.clone(); cs2.rotation.y = Math.PI; cs2.position.z = -0.11; coin.add(cs2);
  floater(coin, 0.15, 1, 0.8);
  mk(lathe([[0.7, 0], [0.55, 0.2], [0.4, 0.3], [0.38, 1.1], [0.55, 1.2], [0.001, 1.22]], 24), stoneMat).position.set(L.x, H(L.x, L.z), L.z + 3);
  signBoard(L.x + 7.5, L.z - 3.5, 0.4, ['MARKET OF MONEY', 'Count coins & pay!'], 3.4, 1.2);
}

// ─── 14 · SKIPPY'S LEAPING OAK ───────────────────────────────────────────────
const SKIPPY_LEAVES = [];
{
  const L = LM.oak, y = H(L.x, L.z), g = grp(); g.position.set(L.x, y - 0.2, L.z);
  const trunkParts = [taperTube([[0, -0.3, 0], [0.2, 2.5, 0.1], [-0.1, 5.2, 0], [0.1, 7.5, 0.1]], 1.25, 0.55, 20, 18)];
  const branchEnds = [];
  for (let b = 0; b < 6; b++) {
    const a = b / 6 * TAU + 0.3, h0 = 3.4 + b * 0.55, len = rr(3.6, 4.8);
    const end = [Math.cos(a) * len, h0 + 1.6, Math.sin(a) * len]; branchEnds.push(end);
    trunkParts.push(taperTube([[0, h0, 0], [Math.cos(a) * len * 0.5, h0 + 0.9, Math.sin(a) * len * 0.5], end], 0.42, 0.14, 14, 10));
  }
  // roots
  for (let r = 0; r < 6; r++) { const a = r / 6 * TAU; trunkParts.push(taperTube([[0, 0.8, 0], [Math.cos(a) * 1.4, 0.2, Math.sin(a) * 1.4], [Math.cos(a) * 2.4, -0.3, Math.sin(a) * 2.4]], 0.45, 0.12, 10, 8)); }
  mk(mergeGeometries(trunkParts), barkMat, g);
  const leafParts = [];
  for (const e of branchEnds) for (let k = 0; k < 3; k++) { const s = lumpy(new THREE.IcosahedronGeometry(rr(1.8, 2.4), 3), 0.16, 1.1, e[0] + k); s.translate(e[0] + rr(-0.9, 0.9), e[1] + rr(0, 1.4), e[2] + rr(-0.9, 0.9)); leafParts.push(colorize(s.toNonIndexed(), 0x2F7A28, 0x8ACB4E)); }
  for (let k = 0; k < 4; k++) { const s = lumpy(new THREE.IcosahedronGeometry(2.6, 3), 0.15, 1, 50 + k); s.translate(rr(-1.5, 1.5), 9.3 + rr(0, 1.2), rr(-1.5, 1.5)); leafParts.push(colorize(s.toNonIndexed(), 0x357F2B, 0x9AD45A)); }
  mk(mergeGeometries(leafParts), canopyMat, g);
  // leaf platforms numbered 2-4-6-8-10, spiralling up
  const lpTex = canvasTex(128, 128, (x) => { const gr = x.createRadialGradient(64, 64, 10, 64, 64, 64); gr.addColorStop(0, '#9BE070'); gr.addColorStop(1, '#3E9B2E'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); x.strokeStyle = 'rgba(230,255,200,0.7)'; x.lineWidth = 3; x.beginPath(); x.moveTo(64, 0); x.lineTo(64, 128); x.stroke(); });
  const lpM = new THREE.MeshPhysicalMaterial({ map: lpTex, roughness: 0.5, clearcoat: 0.4, side: THREE.DoubleSide });
  for (let i = 0; i < 5; i++) {
    const a = i * 1.3 + 0.6, r = 3.2, h = 1.0 + i * 1.25, x = Math.cos(a) * r, z = Math.sin(a) * r;
    const lf = mk(new THREE.SphereGeometry(1, 24, 10), lpM, g); lf.scale.set(1.25, 0.08, 0.8); lf.position.set(x, h, z); lf.rotation.y = -a;
    mk(taperTube([[0, h - 0.2, 0], [x * 0.8, h - 0.1, z * 0.8]], 0.18, 0.08, 6, 6), barkMat, g);
    const n = text3D(String((i + 1) * 2), 0.5, gloss(0xFFFFFF, 0.25), 0.35); n.position.set(x * 1.12, h + 0.5, z * 1.12); n.lookAt(x * 3, h + 0.5, z * 3); g.add(n); floater(n, 0.08, 1.8);
    SKIPPY_LEAVES.push(new THREE.Vector3(L.x + x, y - 0.2 + h + 0.08, L.z + z));
  }
  // acorns + golden acorn at the top
  const acorn = (s, gold) => { const a = grp(); mk(new THREE.SphereGeometry(0.18 * s, 16, 12).scale(1, 1.25, 1), gold ? glow(0xFFD86B, 1.4) : gloss(0x9A5B2A, 0.35), a); const c = mk(new THREE.SphereGeometry(0.2 * s, 16, 8, 0, TAU, 0, Math.PI / 2), std(0x6B4426, 0.9), a); c.position.y = 0.1 * s; mk(new THREE.CylinderGeometry(0.02 * s, 0.02 * s, 0.12 * s), std(0x6B4426), a).position.y = 0.26 * s; return a; };
  for (let i = 0; i < 14; i++) { const a = acorn(1, false), aa = rand() * TAU, r = rr(2.6, 6), x = L.x + Math.cos(aa) * r, z = L.z + Math.sin(aa) * r; a.position.set(x, H(x, z) + 0.2, z); a.rotation.z = rr(-1.4, 1.4); }
  const ga = acorn(3, true); const top = SKIPPY_LEAVES[4]; ga.position.set(top.x, top.y + 1.6, top.z); floater(ga, 0.15, 1.5, 1);
  signBoard(L.x - 7.2, L.z - 2, -Math.PI / 2 + 0.3, ['SKIPPY\'S LEAPING OAK', 'Skip count by 2s!'], 3.6, 1.3);
}

// ─── 15 · THE HEART OF THE GARDEN ────────────────────────────────────────────
const HEART = {};
{
  const L = LM.heart, y = H(L.x, L.z), g = grp(); g.position.set(L.x, y, L.z);
  mk(new THREE.CylinderGeometry(4.2, 4.5, 0.3, 64), stoneMat, g).position.y = 0.05;
  const ring = mk(new THREE.TorusGeometry(4.25, 0.12, 8, 80), GOLD, g); ring.rotation.x = Math.PI / 2; ring.position.y = 0.22;
  mk(lathe([[1.2, 0], [1.0, 0.3], [0.7, 0.45], [0.6, 1.3], [0.85, 1.5], [0.9, 1.65], [0.001, 1.66]], 32), new THREE.MeshPhysicalMaterial({ color: 0xFFFFFF, roughness: 0.2, clearcoat: 1, map: stoneTex }), g).position.y = 0.2;
  // faceted ruby heart
  const hs = new THREE.Shape(); hs.moveTo(0, -1.25); hs.bezierCurveTo(-0.9, -0.6, -1.55, 0.05, -1.25, 0.75); hs.bezierCurveTo(-0.95, 1.4, -0.2, 1.35, 0, 0.75); hs.bezierCurveTo(0.2, 1.35, 0.95, 1.4, 1.25, 0.75); hs.bezierCurveTo(1.55, 0.05, 0.9, -0.6, 0, -1.25);
  const hg = new THREE.ExtrudeGeometry(hs, { depth: 0.5, bevelEnabled: true, bevelThickness: 0.35, bevelSize: 0.3, bevelSegments: 2, curveSegments: 7 }); hg.center();
  const heart = mk(hg, new THREE.MeshPhysicalMaterial({ color: 0xE0103A, emissive: 0xFF1E56, emissiveIntensity: 0.45, roughness: 0.08, metalness: 0.1, clearcoat: 1, flatShading: true, iridescence: 0.4, sheen: 0.5, sheenColor: new THREE.Color(0xFF9DB5) }), g);
  heart.position.y = 3.2; HEART.mesh = heart; heart.userData.dynamic = true;
  const pl = new THREE.PointLight(0xFF3B6B, 10, 14, 1.5); pl.position.y = 3.2; g.add(pl);
  // light beam
  const beam = mk(new THREE.CylinderGeometry(0.4, 1.6, 9, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0xFF9DB5, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), g, false, false);
  beam.position.y = 6.5;
  // ring of standing stones 1–12
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * TAU, x = Math.sin(a) * 6.6, z = Math.cos(a) * 6.6, st = mk(lumpy(new THREE.BoxGeometry(0.7, 1.6, 0.45, 2, 3, 2), 0.06, 2, i), stoneMat, g);
    st.position.set(x, H(L.x + x, L.z + z) - y + 0.7, z); st.rotation.y = a;
    const n = text3D(String(i + 1), 0.36, glow(RAINBOW[i % 10], 1.2), 0.2); n.position.set(Math.sin(a) * 6.32, st.position.y + 0.25, Math.cos(a) * 6.32); n.rotation.y = a + Math.PI; g.add(n);
  }
  plantFlowers(Array.from({ length: 220 }, (_, i) => { const a = rand() * TAU, r = rr(4.8, 9), x = L.x + Math.cos(a) * r, z = L.z + Math.sin(a) * r; return { x, z, s: rr(0.8, 1.3), c: [0xFF5D8F, 0xFF4D4D, 0xFF9ED2, 0xFFFFFF, 0xFFD23F][i % 5] }; }).filter(f => distPath(f.x, f.z) > 1.8));
  makeSparkles(300, () => { const a = rand() * TAU, r = rr(0, 5); return new THREE.Vector3(L.x + Math.cos(a) * r, y + rr(1, 9), L.z + Math.sin(a) * r); }, 0.26, 0xFFB3C8);
  ANIM.push((t) => { heart.rotation.y = t * 0.6; heart.position.y = 3.2 + Math.sin(t * 1.4) * 0.18; heart.material.emissiveIntensity = 0.4 + Math.sin(t * 2.4) * 0.2; pl.intensity = 9 + Math.sin(t * 2.4) * 3; beam.material.opacity = 0.1 + Math.sin(t * 1.2) * 0.04; });
  signBoard(L.x + 4, L.z + 9.5, 0.15, ['THE HEART OF', 'THE GARDEN'], 3.0, 1.3);
}

// ─── Math Dreams clouds & wayfinding ─────────────────────────────────────────
{
  const cloudMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 1, emissive: 0xFFF6EC, emissiveIntensity: 0.25 });
  const syms = ['+', '−', '×', '÷', '='];
  for (let i = 0; i < 6; i++) {
    const parts = []; for (let k = 0; k < 6; k++) { const s = new THREE.SphereGeometry(rr(1.4, 2.4), 16, 12); s.translate(k * 1.6 - 4, rr(-0.3, 0.6), rr(-0.8, 0.8)); parts.push(s); }
    const c = mk(mergeGeometries(parts), cloudMat, scene, false, false); const a = i / 6 * TAU;
    c.position.set(Math.cos(a) * 30, 24 + rr(-2, 3), Math.sin(a) * 30 - 8); c.scale.set(1, 0.6, 0.8); c.userData.dynamic = true;
    const sym = text3D(syms[i % 5] === '−' ? '-' : syms[i % 5], 1.4, glow(0xC77DFF, 1.4), 0.3); sym.position.set(0, 2.3, 0); c.add(sym);
    ANIM.push((t) => { c.position.x = Math.cos(a + t * 0.01) * 30; c.position.z = Math.sin(a + t * 0.01) * 30 - 8; sym.rotation.y = t * 0.5; });
  }
  fingerPost(4, 11.5, ['heart', 'fraction', 'timeflower', 'carlo']);
  fingerPost(-3.2, 26, ['market', 'bridge', 'oak']);
  fingerPost(-29, -15, ['pond', 'meadow', 'orchard']);
  fingerPost(20, -22, ['subby', 'greenhouse', 'carlo']);
}
