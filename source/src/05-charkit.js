// ═════════════════════════════════════════════════════════════════════════════
//  CHARACTER KIT — fur, eyes, painted faces, hands, rigging & idle animation
// ═════════════════════════════════════════════════════════════════════════════
const CHARS = [];

// ─── Shell fur: N stacked shells, strands cut out procedurally ──────────────
const FUR_MATS = {};
function furMaterial(color, { len = 0.03, density = [60, 30], gravity = 0.25, vertexColors = false, rough = 0.85, sheen = 0.6 } = {}) {
  const k = [color, len, density, gravity, vertexColors].join('|'); if (FUR_MATS[k]) return FUR_MATS[k];
  const m = new THREE.MeshStandardMaterial({ color, roughness: rough, vertexColors });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uShells = { value: Q.shells }; sh.uniforms.uLen = { value: len }; sh.uniforms.uDen = { value: new THREE.Vector2(density[0] * 2.2, density[1] * 2.2) }; sh.uniforms.uGrav = { value: len * gravity };
    sh.vertexShader = 'uniform float uShells,uLen,uGrav; uniform vec2 uDen; varying float vLayer; varying vec2 vFurUv;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      #ifdef USE_INSTANCING
        float layer = float(gl_InstanceID) / uShells;
      #else
        float layer = 0.0;
      #endif
      vLayer = layer; vFurUv = uv * uDen;
      transformed += normalize(objectNormal) * uLen * layer;
      transformed.y -= uGrav * layer * layer;`);
    sh.fragmentShader = 'varying float vLayer; varying vec2 vFurUv;\nfloat fh(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}\n' + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      if (vLayer > 0.001) {
        vec2 cell = floor(vFurUv);
        vec2 jit = vec2(fh(cell + 3.1), fh(cell + 7.7)) - 0.5;
        vec2 f = fract(vFurUv) - 0.5 - jit * 0.55;
        float rnd = fh(cell); float h = mix(0.4, 1.0, rnd);
        if (vLayer > h) discard;
        if (length(f) > 0.5 * (1.0 - vLayer / h) + 0.03) discard;
        diffuseColor.rgb *= 0.9 + 0.2 * fh(cell + 1.3);
      }
      diffuseColor.rgb *= mix(0.6, 1.1, vLayer);`);
  };
  m.customProgramCacheKey = () => 'fur' + (vertexColors ? 'vc' : '');
  return (FUR_MATS[k] = m);
}
function fur(geo, color, opts = {}, par) {
  const im = new THREE.InstancedMesh(geo, furMaterial(color, opts), Q.shells + 1);
  const I = new THREE.Matrix4(); for (let i = 0; i <= Q.shells; i++) im.setMatrixAt(i, I);
  im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false; im.userData.keep = true;
  if (par) par.add(im); return im;
}

// ─── Eyes with painted iris, catchlights and blinking lids ──────────────────
const IRIS = {};
function irisTex(col, pupil = 0.46) {
  const k = col + pupil; if (IRIS[k]) return IRIS[k];
  return (IRIS[k] = canvasTex(512, 256, (x, w, h) => {
    x.fillStyle = '#FBFBF8'; x.fillRect(0, 0, w, h);
    const cx = w * 0.25, cy = h * 0.5, R = 47;
    const shade = x.createRadialGradient(cx, cy, R * 0.9, cx, cy, 120); shade.addColorStop(0, 'rgba(0,0,0,0)'); shade.addColorStop(1, 'rgba(120,100,110,0.25)'); x.fillStyle = shade; x.fillRect(0, 0, w, h);
    const c = new THREE.Color(col), dark = '#' + c.clone().multiplyScalar(0.35).getHexString(), lite = '#' + c.clone().lerp(new THREE.Color(0xffffff), 0.35).getHexString();
    const g = x.createRadialGradient(cx, cy + 6, R * 0.2, cx, cy, R); g.addColorStop(0, lite); g.addColorStop(0.6, '#' + c.getHexString()); g.addColorStop(1, dark);
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, R, 0, TAU); x.fill();
    x.strokeStyle = 'rgba(255,255,255,0.18)'; x.lineWidth = 2; for (let i = 0; i < 40; i++) { const a = i / 40 * TAU; x.beginPath(); x.moveTo(cx + Math.cos(a) * R * 0.45, cy + Math.sin(a) * R * 0.45); x.lineTo(cx + Math.cos(a) * R * 0.9, cy + Math.sin(a) * R * 0.9); x.stroke(); }
    x.strokeStyle = dark; x.lineWidth = 6; x.beginPath(); x.arc(cx, cy, R - 3, 0, TAU); x.stroke();
    x.fillStyle = '#0B0605'; x.beginPath(); x.arc(cx, cy, R * pupil, 0, TAU); x.fill();
    x.fillStyle = '#fff'; x.beginPath(); x.ellipse(cx + 13, cy - 16, 12, 9, -0.5, 0, TAU); x.fill();
    x.beginPath(); x.arc(cx - 15, cy + 15, 5, 0, TAU); x.fill();
  }));
}
const EYE_MAT = {};
function makeEye(par, pos, r, irisCol, lidMat, { lash = 0, lashCol = 0x1a0d08, open = -0.75 } = {}) {
  const pivot = grp(par); pivot.position.copy(pos);
  const ball = grp(pivot);
  const em = EYE_MAT[irisCol] || (EYE_MAT[irisCol] = new THREE.MeshStandardMaterial({ map: irisTex(irisCol), emissiveMap: irisTex(irisCol), emissive: 0xffffff, emissiveIntensity: 0.28, roughness: 0.18, envMapIntensity: 0.08 }));
  const eye = mk(new THREE.SphereGeometry(r, 32, 24), em, ball, false); eye.rotation.y = 0;
  // lids (upper) — rotate to blink
  const lid = mk(new THREE.SphereGeometry(r * 1.07, 32, 12, 0, TAU, 0, Math.PI * 0.56), lidMat, pivot, false);
  lid.rotation.x = open;
  if (lash) {
    const lm = std(lashCol, 0.6);
    const th = Math.PI * 0.55, R2 = r * 1.07;
    for (let i = 0; i < 3; i++) {
      const a = lash * (0.55 + i * 0.32), p = new THREE.Vector3(Math.sin(a) * Math.sin(th) * R2, Math.cos(th) * R2, Math.cos(a) * Math.sin(th) * R2);
      const l = mk(new THREE.ConeGeometry(r * 0.08, r * 0.6, 5).translate(0, r * 0.3, 0), lm, lid, false); l.position.copy(p);
      l.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p.clone().normalize().add(new THREE.Vector3(lash * 0.5, 0.9, 0)).normalize());
    }
  }
  return { pivot, ball, lid, r, open };
}

// ─── Painted face decal that hugs a sphere-shaped head ──────────────────────
// yaw: + toward character's left (viewer's right); pitch: + up
function faceDecal(par, R, scale, { w = 1.9, t0 = 0.75, tl = 1.55, res = 512 } = {}, draw) {
  const phi0 = Math.PI / 2 - w / 2, W = res, Hh = Math.round(res * tl / w);
  const map = (yaw, pitch) => [(yaw + w / 2) / w * W, ((Math.PI / 2 - pitch) - t0) / tl * Hh];
  const px = (rad) => rad / w * W;
  const make = (fn) => canvasTex(W, Hh, (x) => { x.clearRect(0, 0, W, Hh); fn(x, map, px, W, Hh); });
  const tex = make(draw);
  const mat = new THREE.MeshPhysicalMaterial({ map: tex, transparent: true, roughness: 0.5, clearcoat: 0.15, polygonOffset: true, polygonOffsetFactor: -4, depthWrite: false });
  const m = mk(new THREE.SphereGeometry(R * 1.004, 64, 40, phi0, w, t0, tl), mat, par, false, false);
  m.scale.copy(scale); m.userData.keep = true; m.renderOrder = 1;
  return { mesh: m, mat, make };
}
// On-surface position helper for sphere heads
function onSphere(R, scale, yaw, pitch, out = 0) {
  return new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch) * (R + out) * scale.x, Math.sin(pitch) * (R + out) * scale.y, Math.cos(yaw) * Math.cos(pitch) * (R + out) * scale.z);
}
// Drawing helpers for faces
function paintBrow(x, map, px, yaw, pitch, len, thick, col, tilt = 0, arch = 0.25) {
  const [cx, cy] = map(yaw, pitch), L = px(len);
  x.save(); x.translate(cx, cy); x.rotate(tilt); x.strokeStyle = col; x.lineCap = 'round'; x.lineWidth = px(thick);
  x.beginPath(); x.moveTo(-L / 2, L * arch * 0.3); x.quadraticCurveTo(0, -L * arch, L / 2, L * arch * 0.1); x.stroke(); x.restore();
}
function paintBlush(x, map, px, yaw, pitch, r, col = 'rgba(255,110,120,0.35)') {
  for (const s of [-1, 1]) { const [cx, cy] = map(s * yaw, pitch), R = px(r); const g = x.createRadialGradient(cx, cy, 0, cx, cy, R); g.addColorStop(0, col); g.addColorStop(1, 'rgba(255,110,120,0)'); x.fillStyle = g; x.beginPath(); x.arc(cx, cy, R, 0, TAU); x.fill(); }
}
function paintMouth(x, map, px, pitch, w, open, { lip = '#8C3B2E', inner = '#5B1414', tongue = '#E06A78', teeth = true, smile = 1 } = {}) {
  const [cx, cy] = map(0, pitch), W2 = px(w) / 2, O = px(open), S = px(w) * 0.18 * smile;
  x.save(); x.translate(cx, cy);
  if (open > 0.001) {
    x.beginPath(); x.moveTo(-W2, -S * 0.2); x.quadraticCurveTo(0, S * 0.5, W2, -S * 0.2); x.quadraticCurveTo(W2 * 0.6, O + S, 0, O + S * 0.9); x.quadraticCurveTo(-W2 * 0.6, O + S, -W2, -S * 0.2); x.closePath();
    x.fillStyle = inner; x.fill();
    x.save(); x.clip();
    if (teeth) { x.fillStyle = '#FFFDF6'; x.beginPath(); x.ellipse(0, S * 0.1, W2 * 0.85, O * 0.32, 0, 0, TAU); x.fill(); }
    x.fillStyle = tongue; x.beginPath(); x.ellipse(0, O + S * 0.8, W2 * 0.55, O * 0.45, 0, 0, TAU); x.fill(); x.restore();
    x.strokeStyle = lip; x.lineWidth = px(w) * 0.06; x.lineJoin = 'round'; x.stroke();
  } else {
    x.strokeStyle = lip; x.lineWidth = px(w) * 0.09; x.lineCap = 'round';
    x.beginPath(); x.moveTo(-W2, -S * 0.3); x.quadraticCurveTo(0, S * 1.3, W2, -S * 0.3); x.stroke();
  }
  x.restore();
}

// ─── Hands (palm + fingers) ──────────────────────────────────────────────────
function makeHand(par, mat, s = 1, side = 1, fingers = 4, point = false) {
  const h = grp(par);
  const palm = mk(new THREE.SphereGeometry(0.045 * s, 16, 12), mat, h); palm.scale.set(1, 1.15, 0.6);
  for (let i = 0; i < fingers; i++) {
    const a = (i - (fingers - 1) / 2) * 0.32, len = (0.042 - Math.abs(i - 1.5) * 0.004) * s;
    const f = mk(new THREE.CapsuleGeometry(0.012 * s, len, 4, 8), mat, h);
    f.position.set(Math.sin(a) * 0.03 * s, -0.045 * s - len / 2, 0.004 * s); f.rotation.z = a * 0.45;
    if (point && i > 0) { f.scale.y = 0.55; f.position.y += len * 0.25; }
  }
  const th = mk(new THREE.CapsuleGeometry(0.013 * s, 0.03 * s, 4, 8), mat, h); th.position.set(side * 0.036 * s, -0.022 * s, 0.022 * s); th.rotation.set(-0.5, 0, side * 0.9);
  return h;
}
// Arm: pivot at shoulder, sleeve tube, cuff, hand
function makeArm(par, at, side, { len = 0.36, r0 = 0.06, r1 = 0.05, sleeve, skinMat, cuffMat, handScale = 1, fingers = 4, bare = false, spread = 0.2 } = {}) {
  const sh = grp(par); sh.position.copy(at); sh.rotation.z = side * spread;
  const elbowOut = side * 0.02;
  mk(taperTube([[0, 0, 0], [elbowOut, -len * 0.5, 0.01], [side * 0.005, -len, 0.04]], r0, r1, 14, 14), bare ? skinMat : sleeve, sh);
  if (cuffMat) { const cuff = mk(new THREE.CylinderGeometry(r1 * 1.12, r1 * 1.12, 0.04, 18), cuffMat, sh); cuff.position.set(side * 0.005, -len + 0.01, 0.04); }
  const hand = makeHand(sh, skinMat, handScale, side, fingers); hand.position.set(side * 0.005, -len - 0.03, 0.045); hand.rotation.y = side * 0.25;
  sh.userData.hand = hand; return sh;
}
// Shoes: leather upper, toe cap, sole, laces
function makeShoe(par, x, { upper, sole, toe, lace = 0xFFFFFF, s = 1, accent } = {}) {
  const g = grp(par); g.position.set(x, 0, 0.02 * s);
  const u = mk(new THREE.SphereGeometry(0.075 * s, 24, 16), upper, g); u.scale.set(0.9, 0.7, 1.55); u.position.set(0, 0.06 * s, 0.015 * s);
  if (toe) { const t = mk(new THREE.SphereGeometry(0.068 * s, 20, 12, 0, TAU, 0, Math.PI / 2), toe, g); t.scale.set(0.95, 0.6, 0.85); t.position.set(0, 0.03 * s, 0.07 * s); t.rotation.x = 0.4; }
  const so = mk(new RoundedBox(0.125 * s, 0.032 * s, 0.25 * s, 0.014 * s), sole, g); so.position.set(0, 0.016 * s, 0.02 * s);
  if (accent) { const a = mk(new THREE.TorusGeometry(0.08 * s, 0.009 * s, 6, 24, Math.PI), accent, g); a.scale.set(0.95, 0.6, 1.5); a.position.set(0, 0.06 * s, 0.01 * s); a.rotation.y = Math.PI / 2; }
  const lm = std(lace, 0.6);
  for (let i = 0; i < 3; i++) { const l = mk(new THREE.BoxGeometry(0.07 * s, 0.01 * s, 0.012 * s), lm, g); l.position.set(0, (0.105 - i * 0.008) * s, (0.02 + i * 0.03) * s); l.rotation.x = -0.4; }
  return g;
}

// ─── Merge static meshes per pivot for speed (keeps animation pivots) ───────
function bake(root) {
  root.updateMatrixWorld(true);
  const visit = (node) => {
    const groups = new Map();
    for (const ch of [...node.children]) {
      if (ch.isMesh && !ch.isInstancedMesh && !ch.userData.keep && !Array.isArray(ch.material) && ch.children.length === 0) {
        const k = ch.material.uuid + (ch.castShadow ? 1 : 0); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(ch);
      } else visit(ch);
    }
    for (const list of groups.values()) {
      if (list.length < 2) continue;
      const geos = list.map(m => {
        m.updateMatrix(); let g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
        for (const a of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(a)) g.deleteAttribute(a);
        if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
        if (!g.attributes.normal) g.computeVertexNormals();
        g.applyMatrix4(m.matrix); return g;
      });
      const merged = mergeGeometries(geos); if (!merged) continue;
      const nm = new THREE.Mesh(merged, list[0].material); nm.castShadow = list[0].castShadow; nm.receiveShadow = true;
      list.forEach(m => node.remove(m)); node.add(nm);
    }
  };
  visit(root);
}

// ─── Character registration & shared idle behaviour ─────────────────────────
const _v = new THREE.Vector3(), _w = new THREE.Vector3();
function registerChar(root, o) {
  const ud = root.userData;
  Object.assign(ud, { key: o.key, name: o.name, dialog: o.dialog, dialogIdx: 0, height: o.height, isChar: true, excite: 0, blinkT: rr(1, 4), blink: 0, lookYaw: 0, lookPitch: 0 });
  Object.assign(ud, o.rig || {});
  const hit = mk(new THREE.CylinderGeometry(o.hitR || 0.55, o.hitR || 0.55, o.height + 0.3, 10), new THREE.MeshBasicMaterial({ visible: false }), root, false, false);
  hit.position.y = (o.height + 0.3) / 2 + (o.hitY || 0); hit.userData.owner = root; ud.hit = hit;
  bake(root);
  ud.furs = []; root.traverse(o => { if (o.isInstancedMesh) ud.furs.push(o); });
  ud.update = (t, dt, focus) => {
    // blink
    ud.blinkT -= dt; if (ud.blinkT < 0) { ud.blink = 0.16; ud.blinkT = rr(2.2, 5.5); }
    if (ud.blink > 0) ud.blink -= dt;
    const closed = ud.blink > 0 ? Math.sin((0.16 - ud.blink) / 0.16 * Math.PI) : 0;
    (ud.eyes || []).forEach(e => { const o = e.open ?? -0.75; e.lid.rotation.x = o + closed * (0.5 - o); });
    // look at the visitor when close
    if (ud.head) {
      root.getWorldPosition(_v); _w.subVectors(focus, _v);
      const near = (ud.dist ?? 99) < 9;
      let tgtYaw = 0, tgtPitch = 0;
      if (near) { tgtYaw = Math.atan2(_w.x, _w.z) - root.rotation.y; tgtYaw = Math.atan2(Math.sin(tgtYaw), Math.cos(tgtYaw)); tgtYaw = Math.max(-1.0, Math.min(1.0, tgtYaw)); tgtPitch = Math.max(-0.3, Math.min(0.3, -Math.atan2(_w.y - (ud.height * 0.85), Math.hypot(_w.x, _w.z)) * 0.6)); }
      else { tgtYaw = Math.sin(t * 0.3 + ud.height * 7) * 0.35; }
      ud.lookYaw += (tgtYaw - ud.lookYaw) * Math.min(1, dt * 3); ud.lookPitch += (tgtPitch - ud.lookPitch) * Math.min(1, dt * 3);
      ud.head.rotation.y = ud.lookYaw * 0.75; ud.head.rotation.x = ud.lookPitch;
      (ud.eyes || []).forEach(e => { e.ball.rotation.y = ud.lookYaw * 0.3; e.ball.rotation.x = ud.lookPitch * 0.4; });
    }
    if (ud.body) { ud.body.scale.y = 1 + Math.sin(t * 2.1 + ud.height) * 0.012; ud.body.scale.x = ud.body.scale.z = 1 - Math.sin(t * 2.1 + ud.height) * 0.006; }
    ud.excite = Math.max(0, ud.excite - dt * 0.3);
    // talking mouth flaps while the speech bubble is up
    if (ud.mouth) { const talking = bubble.sp.visible && bubble.owner === root; const open = talking && (Math.sin(t * 16) > -0.2); ud.mouth.mat.map = open ? ud.mouth.open : ud.mouth.closed; }
    o.update && o.update(t, dt, focus, ud);
  };
  CHARS.push(root); return root;
}
function placeChar(g, x, z, ry = 0, yOff = 0) { g.position.set(x, groundAt(x, z) + yOff, z); g.rotation.y = ry; return g; }
const faceYawTo = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);
