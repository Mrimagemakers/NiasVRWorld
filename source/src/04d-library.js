// ═════════════════════════════════════════════════════════════════════════════
//  STORY LIBRARY & BOOKSHOP — readings, events and Nia's books
//  (by the entrance avenue; the roof lifts away while you're inside)
// ═════════════════════════════════════════════════════════════════════════════
const LIBRARY = {};
{
  const X0 = -33, X1 = -15, Z0 = 48.5, Z1 = 71.5, CX = (X0 + X1) / 2, CZ = (Z0 + Z1) / 2, WH = 6, T = 0.4;
  const gy = H(CX, CZ) + 0.05, FY = gy + 0.42;                 // floor top
  LIBRARY.bounds = { X0, X1, Z0, Z1 }; LIBRARY.floorY = FY;
  LIBRARY.inside = (x, z) => x > X0 + 0.2 && x < X1 - 0.2 && z > Z0 + 0.2 && z < Z1 - 0.2;
  const g = grp(); LIBRARY.group = g;
  const coverTex = (() => { const t = new THREE.TextureLoader().load(COVER_URI); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; })();
  LIBRARY.coverTex = coverTex;
  // foundation & plank floor
  mk(new THREE.BoxGeometry(X1 - X0 + 0.8, 0.62, Z1 - Z0 + 0.8).translate(CX, gy + 0.05, CZ), stoneMat, g);   // top sits 0.1 below the planks (no z-fighting)
  mk(new THREE.BoxGeometry(X1 - X0, 0.12, Z1 - Z0).translate(CX, FY - 0.06, CZ), texMat(texClone(TEX.wood, 5, 7), 0xD9A777, 0.7, 1.2), g, false, true);
  // walls: plaster above a brick base, timber frame, a door in the east wall
  const plasterM = texMat(texClone(TEX.plaster, 4, 2), 0xFFF3DC, 0.9, 1), brickM = texMat(texClone(TEX.brick, 4, 1), 0xffffff, 0.9, 1.3), beamM = texMat(TEX.wood, 0x6B4426, 0.8, 1.2);
  const wall = (x, z, w, d) => { mk(new THREE.BoxGeometry(w, WH - 1.4, d).translate(x, FY + 1.4 + (WH - 1.4) / 2, z), plasterM, g); mk(new THREE.BoxGeometry(w + 0.02, 1.4, d + 0.02).translate(x, FY + 0.7, z), brickM, g); addCollider(x, z, Math.max(w, 0.6), Math.max(d, 0.6)); };
  wall(CX, Z0, X1 - X0, T); wall(CX, Z1, X1 - X0, T); wall(X0, CZ, T, Z1 - Z0);
  const DW = 3.4, dz0 = CZ - DW / 2, dz1 = CZ + DW / 2;
  wall(X1, (Z0 + dz0) / 2, T, dz0 - Z0); wall(X1, (dz1 + Z1) / 2, T, Z1 - dz1);
  mk(new THREE.BoxGeometry(T, WH - 3.4, DW).translate(X1, FY + 3.4 + (WH - 3.4) / 2, CZ), plasterM, g);
  // timber beams & corner posts (storybook cottage look)
  for (const [x, z] of [[X0, Z0], [X0, Z1], [X1, Z0], [X1, Z1]]) mk(new THREE.BoxGeometry(0.5, WH, 0.5).translate(x, FY + WH / 2, z), beamM, g);
  for (const z of [Z0, Z1]) mk(new THREE.BoxGeometry(X1 - X0, 0.35, 0.55).translate(CX, FY + WH - 0.2, z), beamM, g);
  for (const x of [X0, X1]) mk(new THREE.BoxGeometry(0.55, 0.35, Z1 - Z0).translate(x, FY + WH - 0.2, CZ), beamM, g);
  // glowing windows (both faces) on the long walls
  const winM = new THREE.MeshPhysicalMaterial({ color: 0xFFF0C8, emissive: 0xFFC56B, emissiveIntensity: 0.6, roughness: 0.1, clearcoat: 1 });
  for (const z of [Z0, Z1]) for (let i = 0; i < 4; i++) { const x = X0 + 2.5 + i * 4.3; for (const s of [-1, 1]) { const w = mk(new THREE.BoxGeometry(2.0, 2.4, 0.05), winM, g, false); w.position.set(x, FY + 3.2, z + s * (T / 2 + 0.03)); const fr = mk(new THREE.BoxGeometry(2.3, 2.7, 0.04), beamM, g); fr.position.set(x, FY + 3.2, z + s * (T / 2 + 0.01)); } }
  // roof (hidden while inside)
  const roof = grp(g); LIBRARY.roof = roof; roof.userData.dynamic = true;
  const roofM = texMat(texClone(TEX.roof, 6, 3), 0x8FA8D8, 0.75, 1.3), span = (Z1 - Z0) / 2 + 0.8, rise = 3.2, sl = Math.hypot(span, rise), ang = Math.atan2(rise, span);
  for (const s of [-1, 1]) { const r = mk(new THREE.BoxGeometry(X1 - X0 + 1.6, 0.22, sl), roofM, roof); r.position.set(CX, FY + WH + rise / 2, CZ + s * span / 2); r.rotation.x = s * ang; }
  const tri = new THREE.Shape(); tri.moveTo(-span, 0); tri.lineTo(span, 0); tri.lineTo(0, rise); tri.closePath();
  for (const x of [X0, X1]) { const gb = mk(new THREE.ShapeGeometry(tri), texMat(texClone(TEX.plaster, 3, 1), 0xFFF3DC, 0.9, 1, { side: THREE.DoubleSide }), roof); gb.position.set(x, FY + WH, CZ); gb.rotation.y = Math.PI / 2; }
  const chim = mk(new THREE.BoxGeometry(1, 2.6, 1).translate(X0 + 3, FY + WH + 2.6, Z0 + 4), brickM, roof);
  // ── exterior: sign, awning, lanterns, book-stack sculpture
  const sign = mk(new THREE.BoxGeometry(0.15, 1.5, 7.5), [new THREE.MeshStandardMaterial({ map: signTex(['STORY LIBRARY', '& BOOKSHOP'], { w: 1024, h: 210, bg: '#5A189A', border: '#2B0A4E', fg: '#FFE27A' }), roughness: 0.6 }), darkWood, darkWood, darkWood, darkWood, darkWood], g);
  sign.position.set(X1 + 0.32, FY + 4.4, CZ);
  const aw = canvasTex(256, 64, (c) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#FFF4DC' : '#7B2CBF'; c.fillRect(i * 32, 0, 32, 64); } });
  aw.wrapS = aw.wrapT = THREE.RepeatWrapping; aw.rotation = Math.PI / 2; aw.center.set(0.5, 0.5);
  const awning = mk(new THREE.BoxGeometry(1.6, 0.06, 4.6), new THREE.MeshPhysicalMaterial({ map: aw, roughness: 0.8, sheen: 0.5, sheenColor: new THREE.Color(0xffffff) }), g);
  awning.rotation.z = -0.42; awning.position.set(X1 + 0.85, FY + 3.55, CZ);
  for (const s of [-1, 1]) { const w = mk(new THREE.BoxGeometry(0.05, 2.2, 1.8), winM, g, false); w.position.set(X1 + T / 2 + 0.03, FY + 2.6, CZ + s * 6.5); const fr = mk(new THREE.BoxGeometry(0.04, 2.5, 2.1), beamM, g); fr.position.set(X1 + T / 2 + 0.01, FY + 2.6, CZ + s * 6.5); const fb = mk(new THREE.BoxGeometry(0.3, 0.2, 1.9), darkWood, g); fb.position.set(X1 + 0.35, FY + 1.4, CZ + s * 6.5); plantFlowers(Array.from({ length: 6 }, (_, k) => ({ x: X1 + 0.35, z: CZ + s * 6.5 - 0.75 + k * 0.3, y: FY + 1.48, s: 0.55, c: FLOWER_COLS[k % 8] }))); }
  for (const s of [-1, 1]) { const l = mk(new THREE.SphereGeometry(0.22, 16, 12), new THREE.MeshStandardMaterial({ color: 0xFFF2C8, emissive: 0xFFC56B, emissiveIntensity: 1.8 }), g, false); l.position.set(X1 + 0.5, FY + 2.6, CZ + s * 2.4); }
  const stack = grp(g); stack.position.set(X1 + 4.5, gy, Z0 + 3.5);
  const bookCols = [0x7B2CBF, 0x2E9E3E, 0xF4C21C, 0x3A86FF, 0xE63946];
  for (let i = 0; i < 5; i++) { const b = mk(new RoundedBox(2.2 - i * 0.15, 0.55, 1.6 - i * 0.1, 0.06), [gloss(bookCols[i], 0.4)][0], stack); b.position.y = 0.3 + i * 0.56; b.rotation.y = i * 0.25; }
  const topBook = mk(new THREE.BoxGeometry(1.4, 0.06, 1.4), new THREE.MeshStandardMaterial({ map: coverTex, roughness: 0.5 }), stack); topBook.position.y = 3.15; topBook.rotation.y = 1.25;
  addCollider(X1 + 4.5, Z0 + 3.5, 2.4, 2.4);
  // ── interior: bookshelves full of books
  const shelfM = texMat(TEX.wood, 0x8A5A34, 0.8, 1.2);
  const books = []; const shelfRun = (x0, z0, x1, z1, depthDir) => {
    const len = Math.hypot(x1 - x0, z1 - z0), ang2 = Math.atan2(x1 - x0, z1 - z0);
    const sh = mk(new THREE.BoxGeometry(0.5, 4.2, len).translate(0, FY + 2.1, 0), shelfM, g); sh.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2); sh.rotation.y = ang2;
    for (let row = 0; row < 5; row++) { let t = 0.1; while (t < len - 0.15) { const w = rr(0.07, 0.14), h = rr(0.45, 0.68); books.push({ x: x0 + (x1 - x0) * (t / len) + depthDir[0] * 0.3, z: z0 + (z1 - z0) * (t / len) + depthDir[1] * 0.3, y: FY + 0.2 + row * 0.82 + h / 2, w, h, ry: ang2, lean: rand() < 0.08 ? rr(-0.3, 0.3) : 0 }); t += w + 0.012; } }
  };
  shelfRun(X0 + 0.6, Z0 + 1.5, X0 + 0.6, CZ - 3.6, [1, 0]); shelfRun(X0 + 0.6, CZ + 3.6, X0 + 0.6, Z1 - 1.5, [1, 0]);
  shelfRun(X0 + 1.5, Z0 + 0.6, X1 - 6, Z0 + 0.6, [0, 1]); shelfRun(X0 + 1.5, Z1 - 0.6, X1 - 6, Z1 - 0.6, [0, -1]);
  const bm = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshPhysicalMaterial({ roughness: 0.55, sheen: 0.4, sheenColor: new THREE.Color(0xffffff) }), books.length); bm.castShadow = false; bm.receiveShadow = true;
  const bcols = [0xE63946, 0x2A9D8F, 0xF4A261, 0x3A86FF, 0x8B5CF6, 0xFFB703, 0x2E7D32, 0xD62828, 0x6D597A, 0x1D3557, 0xF28DB8];
  books.forEach((b, i) => { setInst(bm, i, b.x, b.y, b.z, b.ry, 0.35, b.h, b.w, 0, b.lean); bm.setColorAt(i, _c.setHex(pick2(bcols, i))); });
  g.add(bm);
  for (const z of [Z0 + 0.6, Z1 - 0.6]) addCollider((X0 + 1.5 + X1 - 6) / 2, z, X1 - 6 - X0 - 1.5, 0.8);
  addCollider(X0 + 0.6, (Z0 + 1.5 + CZ - 3.6) / 2, 0.8, CZ - 3.6 - Z0 - 1.5); addCollider(X0 + 0.6, (CZ + 3.6 + Z1 - 1.5) / 2, 0.8, Z1 - 1.5 - CZ - 3.6);
  // ── reading stage with a giant open storybook screen
  const SX = X0 + 3.2;
  mk(new RoundedBox(4.4, 0.45, 7.6, 0.08).translate(SX, FY + 0.22, CZ), texMat(texClone(TEX.wood, 2, 3), 0xB9824F, 0.7, 1.2), g);
  const rug = mk(new THREE.CircleGeometry(4.5, 48), new THREE.MeshStandardMaterial({ color: 0x7B2CBF, roughness: 0.95, normalMap: TEX.felt.normal, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), g, false, true); rug.rotation.x = -Math.PI / 2; rug.position.set(SX + 6.5, FY + 0.03, CZ); rug.scale.set(1, 1.35, 1);
  const screenC = document.createElement('canvas'); screenC.width = 1280; screenC.height = 720;
  const screenTex = new THREE.CanvasTexture(screenC); screenTex.colorSpace = THREE.SRGBColorSpace; screenTex.anisotropy = 4;
  LIBRARY.screen = { canvas: screenC, tex: screenTex };
  const book = grp(g); book.position.set(X0 + 0.9, FY + 3.4, CZ); book.rotation.y = Math.PI / 2;
  const pageG = new THREE.PlaneGeometry(3.6, 4.2, 20, 1); { const p = pageG.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, Math.sin((x / 3.6 + 0.5) * Math.PI) * 0.25); } pageG.computeVertexNormals(); }
  for (const s of [-1, 1]) {
    const pgM = new THREE.MeshStandardMaterial({ map: screenTex, roughness: 0.75, emissive: 0xffffff, emissiveMap: screenTex, emissiveIntensity: 0.35 });
    const pgc = pageG.clone(); const uv = pgc.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, s < 0 ? uv.getX(i) * 0.5 : 0.5 + uv.getX(i) * 0.5);
    const pm = mk(pgc, pgM, book, false); pm.position.x = s * 1.8; pm.rotation.y = -s * 0.12;
  }
  const coverB = mk(new RoundedBox(7.8, 4.6, 0.12, 0.05), gloss(0x5A189A, 0.4), book); coverB.position.z = -0.12;
  mk(new THREE.CylinderGeometry(0.12, 0.12, 4.6, 12), GOLD, book).position.z = -0.02;
  // host's storytelling armchair
  const chair = grp(g); chair.position.set(SX + 0.6, FY + 0.45, CZ + 2.2); chair.rotation.y = Math.PI / 2;
  const velvet = new THREE.MeshPhysicalMaterial({ color: 0xC0262D, roughness: 0.7, sheen: 1, sheenColor: new THREE.Color(0xFF9DB5) });
  mk(new RoundedBox(1.2, 0.4, 1.1, 0.15).translate(0, 0.4, 0), velvet, chair); mk(new RoundedBox(1.2, 1.2, 0.3, 0.15).translate(0, 1.0, -0.45), velvet, chair);
  for (const s of [-1, 1]) mk(new RoundedBox(0.25, 0.55, 1.1, 0.1).translate(s * 0.6, 0.65, 0), velvet, chair);
  LIBRARY.hostSpot = new THREE.Vector3(SX + 0.9, FY + 0.45, CZ + 2.2);
  // audience cushions
  LIBRARY.seats = [];
  const cushionM = [0xF4C21C, 0x2EC4B6, 0xFF7EB6, 0x8B5CF6, 0x8BD346].map(c => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.8, sheen: 1, sheenColor: new THREE.Color(0xffffff), normalMap: TEX.felt.normal }));
  for (let r = 0; r < 4; r++) for (let k = 0; k < 5; k++) {
    const x = SX + 4.5 + r * 2, z = CZ + (k - 2) * 1.6 + (r % 2) * 0.4;
    const c = mk(new THREE.SphereGeometry(0.55, 24, 14), cushionM[(r + k) % 5], g); c.scale.set(1, 0.42, 1); c.position.set(x, FY + 0.22, z);
    LIBRARY.seats.push(new THREE.Vector3(x, FY + 0.45, z));
  }
  // bookshop counter with Nia's books on display
  const ctr = grp(g); ctr.position.set(X1 - 3.4, FY, Z1 - 3.4);
  mk(new RoundedBox(4.2, 1.1, 1.2, 0.08).translate(0, 0.55, 0), texMat(TEX.wood, 0x9A6A3C, 0.7, 1.2), ctr);
  mk(new RoundedBox(4.4, 0.08, 1.4, 0.03).translate(0, 1.14, 0), gloss(0x2E7D32, 0.35), ctr);
  const coverM = new THREE.MeshStandardMaterial({ map: coverTex, roughness: 0.45 }), pagesM = std(0xFFF8E7, 0.8);
  for (let i = 0; i < 6; i++) { const b = mk(new THREE.BoxGeometry(0.62, 0.62, 0.06), [pagesM, pagesM, pagesM, pagesM, coverM, pagesM], ctr); b.position.set(-1.6 + i * 0.62, 1.52, -0.25); b.rotation.x = -0.2; }
  for (let i = 0; i < 4; i++) { const b = mk(new THREE.BoxGeometry(0.62, 0.06, 0.62), [pagesM, pagesM, coverM, pagesM, pagesM, pagesM], ctr); b.position.set(1.5, 1.21 + i * 0.065, 0.2); b.rotation.y = i * 0.08; }
  const tag = labelSprite('🛒 Get the Book!', { bg: 'rgba(46,125,50,0.92)' }); tag.position.set(0, 2.5, 0); ctr.add(tag);
  addCollider(X1 - 3.4, Z1 - 3.4, 4.4, 1.4);
  // events bulletin board (south wall by the door)
  const boardC = document.createElement('canvas'); boardC.width = 1024; boardC.height = 640;
  const boardTex = new THREE.CanvasTexture(boardC); boardTex.colorSpace = THREE.SRGBColorSpace; LIBRARY.board = { canvas: boardC, tex: boardTex };
  const board = mk(new THREE.PlaneGeometry(4, 2.5), new THREE.MeshStandardMaterial({ map: boardTex, roughness: 0.85 }), g); board.position.set(X1 - 3.4, FY + 2.6, Z0 + 0.25);
  mk(new THREE.BoxGeometry(4.3, 2.8, 0.1), beamM, g).position.set(X1 - 3.4, FY + 2.6, Z0 + 0.18);
  const tag2 = labelSprite('📅 Events & Readings'); tag2.position.set(X1 - 3.4, FY + 4.3, Z0 + 0.6); g.add(tag2);
  // warm lights, lanterns, plants
  for (const [x, z] of [[CX - 3, CZ - 5], [CX - 3, CZ + 5], [CX + 4, CZ]]) { const pl = new THREE.PointLight(0xFFD9A0, 7, 13, 1.4); pl.position.set(x, FY + 4.6, z); g.add(pl); const lan = mk(new THREE.SphereGeometry(0.3, 16, 12), new THREE.MeshStandardMaterial({ color: 0xFFF2C8, emissive: 0xFFC56B, emissiveIntensity: 2 }), g, false); lan.position.set(x, FY + 4.9, z); mk(new THREE.CylinderGeometry(0.01, 0.01, 0.9), std(0x333333), g).position.set(x, FY + 5.5, z); }
  for (const [x, z] of [[X1 - 1, Z0 + 1.2], [X1 - 1, Z1 - 1.2], [X0 + 1.4, Z0 + 1.4]]) { const pot = mk(new THREE.CylinderGeometry(0.35, 0.28, 0.6, 16).translate(x, FY + 0.3, z), gloss(0xD9734E, 0.6), g); const leaves = mk(lumpy(new THREE.SphereGeometry(0.6, 16, 12), 0.25, 3, x), new THREE.MeshStandardMaterial({ color: 0x3E9B3A, roughness: 0.8, normalMap: TEX.leaf.normal }), g); leaves.position.set(x, FY + 1.1, z); leaves.scale.y = 1.3; }
  // interaction points
  LIBRARY.spots = [
    { pos: new THREE.Vector3(X1 - 3.4, FY, Z0 + 1.6), action: 'events', label: 'see Events & Readings' },
    { pos: new THREE.Vector3(X1 - 3.4, FY, Z1 - 5), action: 'shop', label: 'shop for the book' },
    { pos: new THREE.Vector3(SX + 3.2, FY, CZ), action: 'stage', label: 'watch the story screen' },
  ];
}
function pick2(a, i) { return a[(i * 7 + 3) % a.length]; }
