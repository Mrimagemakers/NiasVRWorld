// ═════════════════════════════════════════════════════════════════════════════
//  STATIC BATCHING — merge every non-moving mesh into a few draws per map tile
//  (a big win for phones and VR headsets, which draw each frame twice)
// ═════════════════════════════════════════════════════════════════════════════
function staticBatch(root, tile = 48) {
  root.updateMatrixWorld(true);
  const isDynamic = (o) => { for (let p = o; p; p = p.parent) { if (p.userData && (p.userData.dynamic || p.userData.isChar)) return true; if (p === root) break; } return false; };
  const buckets = new Map(), victims = [], c = new THREE.Vector3();
  root.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || !o.visible || o.renderOrder || isDynamic(o) || o.children.length) return;
    const g = o.geometry; if (!g.attributes.position || !g.attributes.normal) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    if (mats.some(m => m.type === 'ShaderMaterial' || m.isPointsMaterial)) return;
    if (!g.boundingSphere) g.computeBoundingSphere(); c.copy(g.boundingSphere.center).applyMatrix4(o.matrixWorld);
    if (g.boundingSphere.radius * o.matrixWorld.getMaxScaleOnAxis() > 60) return;     // huge things (terrain, sky) stay as they are
    const tk = Math.floor(c.x / tile) + ',' + Math.floor(c.z / tile);
    const parts = Array.isArray(o.material) ? (g.groups.length ? g.groups.map(gr => [gr, o.material[gr.materialIndex]]) : []) : [[null, o.material]];
    for (const [gr, m] of parts) {
      if (!m) continue; const k = tk + '|' + m.uuid + '|' + (o.castShadow ? 1 : 0) + (o.receiveShadow ? 1 : 0);
      if (!buckets.has(k)) buckets.set(k, { m, cast: o.castShadow, recv: o.receiveShadow, list: [] });
      buckets.get(k).list.push([o, gr]);
    }
    victims.push(o);
  });
  let made = 0;
  for (const b of buckets.values()) {
    const wantColor = !!b.m.vertexColors;
    const geos = [];
    for (const [o, gr] of b.list) {
      let g = o.geometry;
      if (gr) { const src = g.index ? g.toNonIndexed() : g; const n = new THREE.BufferGeometry(); for (const a of ['position', 'normal', 'uv', 'color']) if (src.attributes[a]) { const at = src.attributes[a]; n.setAttribute(a, new THREE.BufferAttribute(at.array.slice(gr.start * at.itemSize, (gr.start + gr.count) * at.itemSize), at.itemSize)); } g = n; }
      else g = g.index ? g.toNonIndexed() : g.clone();
      for (const a of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', wantColor ? 'color' : '_'].includes(a)) g.deleteAttribute(a);
      if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      if (wantColor && !g.attributes.color) { const cc = new Float32Array(g.attributes.position.count * 3).fill(1); g.setAttribute('color', new THREE.BufferAttribute(cc, 3)); }
      g.applyMatrix4(o.matrixWorld); geos.push(g);
    }
    const merged = geos.length > 1 ? mergeGeometries(geos) : geos[0]; if (!merged) continue;
    const mesh = new THREE.Mesh(merged, b.m); mesh.castShadow = b.cast; mesh.receiveShadow = b.recv; mesh.matrixAutoUpdate = false; mesh.updateMatrix();
    root.add(mesh); made++; merged.computeBoundingSphere(); cullAdd(mesh, 120 + merged.boundingSphere.radius, merged.boundingSphere.center.clone());
  }
  for (const o of victims) o.parent && o.parent.remove(o);
  // moving decorations: merge the pieces inside each one, and cull them by distance
  const dyn = []; root.traverse(o => { if (o.userData?.dynamic && !o.userData.isChar) { let p = o.parent, nested = false; while (p) { if (p.userData?.dynamic || p.userData?.isChar) nested = true; p = p.parent; } if (!nested) dyn.push(o); } });
  for (const o of dyn) { bake(o); if (o === LIBRARY.roof) continue; if (!FLOATERS.includes(o) && !GAME_STONES.some(s => s.obj === o)) cullAdd(o, 90); }
  return { merged: victims.length, into: made, dynamic: dyn.length };
}
