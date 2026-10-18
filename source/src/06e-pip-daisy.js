// ═════════════════════════════════════════════════════════════════════════════
//  GWENDA'S FRIENDS — Pip the Robin & Daisy the Deer (Whisperwood Glade)
// ═════════════════════════════════════════════════════════════════════════════
function buildPip() {
  const root = grp(), body = grp(root);
  const BROWN = 0x8A5A34, RED = 0xE8622C, CREAM = 0xF6E6CC;
  const torso = fur(new THREE.SphereGeometry(0.22, 32, 24), BROWN, { len: 0.02, density: [40, 25] }, body); torso.position.y = 0.32; torso.scale.set(0.95, 1, 1.15);
  const breast = fur(new THREE.SphereGeometry(0.17, 28, 20), RED, { len: 0.02, density: [30, 20] }, body); breast.position.set(0, 0.3, 0.09); breast.scale.set(1, 1.05, 0.8);
  const belly = fur(new THREE.SphereGeometry(0.12, 24, 16), CREAM, { len: 0.015, density: [25, 15] }, body); belly.position.set(0, 0.19, 0.08);
  const head = grp(body); head.position.set(0, 0.56, 0.05);
  const R = 0.13, S = new THREE.Vector3(1, 1, 1);
  fur(new THREE.SphereGeometry(R, 32, 24), BROWN, { len: 0.012, density: [40, 20] }, head);
  const face = fur(new THREE.SphereGeometry(0.1, 24, 16), RED, { len: 0.01, density: [20, 12] }, head); face.position.set(0, -0.03, 0.05); face.scale.set(1, 0.9, 0.9);
  const beak = mk(new THREE.ConeGeometry(0.03, 0.09, 12).rotateX(Math.PI / 2), gloss(0xF2A93B, 0.3), head); beak.position.set(0, -0.01, 0.15);
  const eyes = [-1, 1].map(s => makeEye(head, onSphere(R, S, s * 0.55, 0.15, -0.02), 0.035, 0x20140C, felt(BROWN)));
  const wings = [-1, 1].map(s => { const w = grp(body); w.position.set(s * 0.19, 0.38, -0.02); const m = fur(new THREE.SphereGeometry(0.15, 20, 14), 0x6E4426, { len: 0.012, density: [25, 15] }, w); m.scale.set(0.3, 0.8, 1.2); m.position.set(0, -0.05, -0.05); return w; });
  const tail = mk(new THREE.ConeGeometry(0.1, 0.28, 12).rotateX(-Math.PI / 2 - 0.5), felt(0x5A3A20), body); tail.position.set(0, 0.32, -0.3); tail.scale.x = 1.4;
  for (const s of [-1, 1]) mk(new THREE.CylinderGeometry(0.012, 0.012, 0.12).translate(0, 0.06, 0), std(0xD08A3A, 0.5), root).position.set(s * 0.06, 0, 0.02);
  return registerChar(root, {
    key: 'pip', name: 'Pip the Robin', height: 0.75, hitR: 0.5,
    rig: { body, head, eyes },
    dialog: ['Tweet tweet! I\'m Pip, Gwenda\'s best bird friend.', 'The fireflies of Whisperwood love to count. Want to help me count them?', 'Numbers that add up to 10 are called number bonds: 7 and 3, 6 and 4!', 'Daisy the deer lives here too. Say hello!'],
    update: (t, dt, focus, ud) => {
      ud.hop = (ud.hop ?? 0) + dt;
      const ph = ud.hop % 3; root.position.y = ud.baseY + (ph < 0.3 ? Math.sin(ph / 0.3 * Math.PI) * 0.15 : 0);
      wings.forEach((w, i) => w.rotation.z = (i ? -1 : 1) * (ph < 0.3 ? 0.6 + Math.sin(t * 30) * 0.4 : 0.05));
      tail.rotation.x = Math.sin(t * 3) * 0.1;
      if ((ud.dist ?? 99) < 7) root.rotation.y += (Math.atan2(focus.x - root.position.x, focus.z - root.position.z) - root.rotation.y) * 0.06;
    }
  });
}
function buildDaisy() {
  const root = grp(), body = grp(root);
  const TAN = 0xC8874E, CREAM = 0xF7E6CC;
  const torso = fur(new THREE.CapsuleGeometry(0.28, 0.75, 8, 20).rotateX(Math.PI / 2), TAN, { len: 0.015, density: [40, 30] }, body); torso.position.y = 1.0;
  const bellyM = fur(new THREE.CapsuleGeometry(0.2, 0.55, 8, 16).rotateX(Math.PI / 2), CREAM, { len: 0.015, density: [30, 20] }, body); bellyM.position.set(0, 0.86, 0);
  // white fawn spots
  for (let i = 0; i < 12; i++) { const s = mk(new THREE.SphereGeometry(0.035, 10, 8), felt(0xFFFFFF), body); const a = (i % 2 ? 1 : -1) * rr(0.6, 1.2), zz = rr(-0.45, 0.45); s.position.set(Math.sin(a) * 0.285, 1.0 + Math.cos(a) * 0.285, zz); s.scale.set(1, 1, 0.5); s.lookAt(0, 1.0, zz); }
  const legs = [];
  for (const [x, z] of [[-0.15, 0.4], [0.15, 0.4], [-0.15, -0.4], [0.15, -0.4]]) { const l = grp(body); l.position.set(x, 0.92, z); mk(taperTube([[0, 0, 0], [0, -0.45, 0.02], [0, -0.85, 0]], 0.07, 0.04, 10, 10), felt(TAN), l); mk(new THREE.CylinderGeometry(0.045, 0.05, 0.08, 12).translate(0, -0.88, 0), gloss(0x2B1A10, 0.3), l); legs.push(l); }
  const neck = mk(taperTube([[0, 1.05, 0.4], [0, 1.4, 0.55], [0, 1.6, 0.6]], 0.15, 0.1, 12, 14), felt(TAN), body);
  const head = grp(body); head.position.set(0, 1.68, 0.65);
  const R = 0.17, S = new THREE.Vector3(0.95, 0.95, 1.15);
  fur(new THREE.SphereGeometry(R, 32, 24), TAN, { len: 0.012, density: [40, 20] }, head).scale.copy(S);
  const snout = fur(new THREE.SphereGeometry(0.1, 24, 16), CREAM, { len: 0.008, density: [20, 12] }, head); snout.position.set(0, -0.05, 0.16); snout.scale.set(0.9, 0.8, 1.2);
  mk(new THREE.SphereGeometry(0.035, 14, 10), gloss(0x1A0E08, 0.2), head).position.set(0, -0.02, 0.28);
  const eyes = [-1, 1].map(s => makeEye(head, onSphere(R, S, s * 0.55, 0.15, -0.02), 0.05, 0x3A2010, felt(TAN), { lash: s }));
  const ears = [-1, 1].map(s => { const e = grp(head); e.position.set(s * 0.13, 0.12, -0.03); e.rotation.z = -s * 1.0; const m = mk(new THREE.SphereGeometry(0.09, 16, 12), felt(TAN), e); m.scale.set(0.55, 1.3, 0.3); m.position.y = 0.09; const inn = mk(new THREE.SphereGeometry(0.06, 14, 10), felt(0xF7C9B5), e); inn.scale.set(0.45, 1.1, 0.2); inn.position.set(0, 0.09, 0.02); return e; });
  const tail = fur(new THREE.SphereGeometry(0.07, 16, 12), CREAM, { len: 0.02, density: [15, 10] }, body); tail.position.set(0, 1.1, -0.66);
  return registerChar(root, {
    key: 'daisy', name: 'Daisy the Deer', height: 1.9, hitR: 0.6,
    rig: { body, head, eyes },
    dialog: ['Hello, friend. I\'m Daisy. My spots are fun to count — I have 12!', 'Gwenda takes care of every creature in Whisperwood.', 'If you sit very still, the fireflies come out to play.', 'Pip loves number games. Have you tried counting fireflies with Pip?'],
    update: (t, dt, focus, ud) => {
      ears.forEach((e, i) => e.rotation.z = (i ? -1 : 1) * (1.0 + Math.sin(t * 1.3 + i) * 0.12));
      tail.position.y = 1.1 + Math.abs(Math.sin(t * 6)) * 0.02;
      head.position.y = 1.68 + Math.sin(t * 0.7) * 0.02;
    }
  });
}
const PIP = placeChar(buildPip(), LM.glade.x + 1.2, LM.glade.z + 2.2, Math.PI / 2); PIP.userData.baseY = PIP.position.y;
const DAISY = placeChar(buildDaisy(), LM.glade.x - 2.5, LM.glade.z - 3, Math.PI / 2 + 0.4);
