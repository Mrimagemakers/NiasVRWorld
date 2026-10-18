import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Font } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

// ─── Quality tiers ───────────────────────────────────────────────────────────
const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
// Standalone VR headsets (Quest, Pico, Wolvic…) render every frame twice, so they get a lighter tier
const isHeadset = /OculusBrowser|Quest|Pico|Wolvic|MetaQuest|VR\b/i.test(navigator.userAgent);
const Q = isHeadset
  ? { pr: 1, shadow: 1024, grass: 14000, flowers: 1100, shells: 4, bloom: false, bloomScale: 0.5, lowLights: true, headset: true }
  : isMobile
  ? { pr: Math.min(devicePixelRatio, 1.5), shadow: 1024, grass: 22000, flowers: 1300, shells: 6, bloom: true, bloomScale: 0.5 }
  : { pr: Math.min(devicePixelRatio, 2),   shadow: 2048, grass: 70000, flowers: 3400, shells: 12, bloom: true, bloomScale: 1 };

// ─── Renderer / scene / camera ───────────────────────────────────────────────
const container = document.getElementById('canvas-container');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Q.pr);
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.xr.enabled = true;
renderer.xr.setFramebufferScaleFactor(isHeadset ? 0.85 : 1);
try { renderer.xr.setFoveation(1); } catch (e) {}
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const FOG_COL = new THREE.Color(0xBFDDEB);
scene.fog = new THREE.Fog(FOG_COL, 70, 230);

const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.08, Q.headset ? 170 : 400);
if (Q.headset) { scene.fog.near = 45; scene.fog.far = 150; }
camera.position.set(2.5, 4.6, isMobile ? 72 : 68);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 3.2, 54);
controls.enableDamping = true; controls.dampingFactor = 0.08;
controls.minDistance = 2.5; controls.maxDistance = 22;
controls.maxPolarAngle = Math.PI * 0.49;
controls.enablePan = false;
controls.update();

// ─── Sky dome (gradient + sun glow) ──────────────────────────────────────────
const SUN_DIR = new THREE.Vector3(-0.45, 0.62, -0.64).normalize();
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: {
    top: { value: new THREE.Color(0x3E8FE0) }, mid: { value: new THREE.Color(0x9FD0F2) },
    hor: { value: new THREE.Color(0xFFF1C4) }, sunDir: { value: SUN_DIR }, time: { value: 0 }
  },
  vertexShader: `varying vec3 vDir; void main(){ vDir=normalize(position); vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.0); gl_Position=p.xyww; }`,
  fragmentShader: `uniform vec3 top,mid,hor,sunDir; uniform float time; varying vec3 vDir;
    float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
    float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p*=2.03;a*=.5;}return v;}
    void main(){ vec3 d=normalize(vDir); float y=d.y;
      vec3 c = y>0.0 ? mix(mix(hor,mid,smoothstep(0.0,0.25,y)),top,smoothstep(0.2,0.9,y)) : hor*0.92;
      float s=max(dot(d,sunDir),0.0);
      c += vec3(1.0,0.86,0.55)*pow(s,8.0)*0.45 + vec3(1.0,0.95,0.8)*pow(s,350.0)*2.5;
      if(y>0.02){ vec2 uv=d.xz/(y+0.12)*1.4 + vec2(time*0.006,0.0);
        float cl=smoothstep(0.52,0.8,fbm(uv)); c=mix(c,vec3(1.0,0.99,0.96),cl*0.85*smoothstep(0.02,0.2,y)); }
      gl_FragColor=vec4(c,1.0);
      #include <colorspace_fragment>
    }`
});
const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 48, 24), skyMat);
sky.frustumCulled = false; sky.renderOrder = -1;
scene.add(sky);

// Environment lighting for realistic reflections (baked from the sky)
{
  const pm = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), skyMat.clone()));
  const g = new THREE.Mesh(new THREE.CircleGeometry(9.5, 32), new THREE.MeshBasicMaterial({ color: 0x5E8F3A }));
  g.rotation.x = -Math.PI / 2; g.position.y = -1; envScene.add(g);
  scene.environment = pm.fromScene(envScene, 0.02).texture;
  scene.environmentIntensity = 0.55;
}

// ─── Lights ──────────────────────────────────────────────────────────────────
const hemi = new THREE.HemisphereLight(0xD6ECFF, 0x5B7A33, 0.85);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xFFE9C2, 2.6);
sun.castShadow = true;
sun.shadow.mapSize.set(Q.shadow, Q.shadow);
const SC = sun.shadow.camera; SC.left = -34; SC.right = 34; SC.top = 34; SC.bottom = -34; SC.near = 1; SC.far = 160;
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; sun.shadow.radius = 3;
scene.add(sun, sun.target);
function updateSun(focus) {
  sun.position.copy(focus).addScaledVector(SUN_DIR, 70);
  sun.target.position.copy(focus);
}

// ─── Post-processing (bloom for magic glow) ──────────────────────────────────
let composer = null, bloom = null;
if (Q.bloom) {
  composer = new EffectComposer(renderer);
  composer.setPixelRatio(Q.pr);
  composer.addPass(new RenderPass(scene, camera));
  bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth * Q.bloomScale, innerHeight * Q.bloomScale), 0.5, 0.45, 0.92);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
}
const fitFov = () => { camera.fov = innerWidth / innerHeight < 0.8 ? 72 : 55; };
fitFov(); camera.updateProjectionMatrix();
addEventListener('resize', () => {
  fitFov(); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  if (composer) composer.setSize(innerWidth, innerHeight);
});

// ─── Small math / noise helpers ──────────────────────────────────────────────
const TAU = Math.PI * 2;
const rand = (() => { let s = 1337; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
const rr = (a, b) => a + rand() * (b - a);
function hash2(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy), b = hash2(ix + 1, iy), c = hash2(ix, iy + 1), d = hash2(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}
function fbm(x, y, o = 4) { let v = 0, a = 0.5; for (let i = 0; i < o; i++) { v += a * vnoise(x, y); x *= 2.02; y *= 2.02; a *= 0.5; } return v; }
const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

// ─── Scene helpers ───────────────────────────────────────────────────────────
function mk(geo, mat, par = scene, cast = true, recv = true) {
  const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = recv; par.add(m); return m;
}
function grp(par = scene) { const g = new THREE.Group(); par.add(g); return g; }
function canvasTex(w, h, fn, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  fn(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
function dataTex(w, h, fn, repeat, srgb = false) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  fn(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; if (repeat) t.repeat.set(repeat[0], repeat[1]); t.anisotropy = 4;
  return t;
}
// Smooth lathe from a list of [radius, y] control points
function lathe(pts, segs = 32, div = 48, phiStart = 0, phiLength = TAU) {
  const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], 0)), false, 'centripetal');
  const out = curve.getPoints(div).map(v => new THREE.Vector2(Math.max(0.0001, v.x), v.y));
  const g = new THREE.LatheGeometry(out, segs, phiStart, phiLength); g.computeVertexNormals(); return g;
}
// Tube that tapers between radii along a curve
function taperTube(points, r0, r1, seg = 24, rad = 14) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  const g = new THREE.TubeGeometry(curve, seg, 1, rad, false);
  const pos = g.attributes.position, n = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i <= seg; i++) {
    const t = i / seg, r = r0 + (r1 - r0) * t; c.copy(curve.getPointAt(t));
    for (let j = 0; j <= rad; j++) {
      const k = i * (rad + 1) + j; n.fromBufferAttribute(pos, k).sub(c).multiplyScalar(r).add(c); pos.setXYZ(k, n.x, n.y, n.z);
    }
  }
  g.computeVertexNormals();
  // cap ends
  const cap0 = new THREE.SphereGeometry(r0, rad, 8); cap0.translate(...points[0]);
  const cap1 = new THREE.SphereGeometry(r1, rad, 8); cap1.translate(...points[points.length - 1]);
  return mergeGeometries([g.toNonIndexed(), cap0.toNonIndexed(), cap1.toNonIndexed()]);
}
function tube(points, r, seg = 24, rad = 8, closed = false) {
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), closed), seg, r, rad, closed);
}
// Displace a geometry along normals with noise (organic shapes)
function lumpy(geo, amt = 0.08, freq = 2, seed = 0) {
  geo = geo.index ? geo : geo; const p = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i); const l = v.length() || 1;
    const n = fbm(v.x * freq + seed, v.y * freq + v.z * freq * 0.7 + seed * 1.7, 3) - 0.5;
    v.multiplyScalar(1 + n * amt * 2); p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals(); return geo;
}

// ─── Procedural textures ─────────────────────────────────────────────────────
// Fine fibrous noise used as a bump map for felt / fabric / fur
const feltBump = dataTex(256, 256, (x, w, h) => {
  const id = x.createImageData(w, h);
  for (let i = 0; i < w * h; i++) { const v = 110 + Math.random() * 120; id.data.set([v, v, v, 255], i * 4); }
  x.putImageData(id, 0, 0);
  x.globalAlpha = 0.25; x.strokeStyle = '#fff';
  for (let i = 0; i < 1400; i++) { const a = Math.random() * TAU, px = Math.random() * w, py = Math.random() * h; x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * 6, py + Math.sin(a) * 6); x.stroke(); }
}, [4, 4]);
const denimMap = dataTex(256, 256, (x, w, h) => {
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h);
  for (let i = -h; i < w; i += 3) { x.strokeStyle = `rgba(0,0,30,${0.10 + Math.random() * 0.08})`; x.lineWidth = 1.4; x.beginPath(); x.moveTo(i, 0); x.lineTo(i + h, h); x.stroke(); }
  for (let i = 0; i < 2500; i++) { x.fillStyle = `rgba(255,255,255,${Math.random() * 0.25})`; x.fillRect(Math.random() * w, Math.random() * h, 1, 2); }
}, [3, 3], true);
const curlBump = dataTex(256, 256, (x, w, h) => {
  x.fillStyle = '#777'; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) {
    const px = Math.random() * w, py = Math.random() * h, r = 2 + Math.random() * 4;
    x.strokeStyle = Math.random() < 0.5 ? '#fff' : '#222'; x.lineWidth = 1.2;
    x.beginPath(); x.arc(px, py, r, Math.random() * TAU, Math.random() * TAU + 4); x.stroke();
  }
}, [3, 3]);

// ─── Materials ───────────────────────────────────────────────────────────────
const MATS = {};
function felt(color, sheenCol, side = THREE.FrontSide) {
  const k = 'f' + color + (sheenCol || '') + side; if (MATS[k]) return MATS[k];
  return (MATS[k] = new THREE.MeshPhysicalMaterial({
    color, roughness: 0.88, sheen: 1, sheenRoughness: 0.55,
    sheenColor: new THREE.Color(sheenCol ?? color).lerp(new THREE.Color(0xffffff), 0.35),
    normalMap: TEX.felt.normal, normalScale: new THREE.Vector2(0.55, 0.55), side
  }));
}
function skin(color) {
  const k = 's' + color; if (MATS[k]) return MATS[k];
  return (MATS[k] = new THREE.MeshPhysicalMaterial({
    color, roughness: 0.52, sheen: 0.35, sheenRoughness: 0.4, sheenColor: new THREE.Color(0xFFB08A),
    clearcoat: 0.08, clearcoatRoughness: 0.5
  }));
}
function gloss(color, rough = 0.25, metal = 0) {
  const k = 'g' + color + rough + metal; if (MATS[k]) return MATS[k];
  return (MATS[k] = new THREE.MeshPhysicalMaterial({ color, roughness: rough, metalness: metal, clearcoat: 0.6, clearcoatRoughness: 0.2 }));
}
function std(color, rough = 0.7, metal = 0) {
  const k = 'm' + color + rough + metal; if (MATS[k]) return MATS[k];
  return (MATS[k] = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal }));
}
function glow(color, intensity = 2) {
  const k = 'e' + color + intensity; if (MATS[k]) return MATS[k];
  return (MATS[k] = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: 0.4 }));
}
function denim(color = 0x3D5FA0) {
  const k = 'd' + color; if (MATS[k]) return MATS[k];
  return (MATS[k] = new THREE.MeshPhysicalMaterial({ color, map: denimMap, roughness: 0.92, sheen: 0.5, sheenColor: new THREE.Color(0x9DB4E0), normalMap: TEX.twill.normal, normalScale: new THREE.Vector2(0.7, 0.7) }));
}
const GOLD = new THREE.MeshStandardMaterial({ color: 0xF2C14E, metalness: 1, roughness: 0.25 });

// ─── 3D text from embedded book font ─────────────────────────────────────────
const FONT = new Font(FONT_DATA);
function text3D(str, size, mat, depth = 0.25, center = true) {
  const g = new TextGeometry(str, { font: FONT, size, depth: size * depth, curveSegments: 6, bevelEnabled: true, bevelThickness: size * 0.05, bevelSize: size * 0.035, bevelSegments: 3 });
  g.computeBoundingBox();
  if (center) { const b = g.boundingBox; g.translate(-(b.max.x + b.min.x) / 2, -(b.max.y + b.min.y) / 2, -(b.max.z + b.min.z) / 2); }
  return new THREE.Mesh(g, mat);
}
const RAINBOW = [0xFF4D4D, 0xFF8A1F, 0xFFD23F, 0x8BD346, 0x2EC4B6, 0x3A86FF, 0x8B5CF6, 0xFF5DA2, 0xF2A900, 0x00B4D8];

// Wooden sign with painted text (uses the book's Fredoka One font once loaded)
function signTex(lines, opts = {}) {
  const { w = 512, h = 256, bg = '#8B5A2B', fg = '#FFE27A', border = '#5A3412', font = 'Fredoka One' } = opts;
  return canvasTex(w, h, (x) => {
    const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, bg); gr.addColorStop(1, border);
    x.fillStyle = gr; x.fillRect(0, 0, w, h);
    x.globalAlpha = 0.18; x.strokeStyle = '#2b1606';
    for (let i = 0; i < 26; i++) { x.lineWidth = 1 + Math.random() * 2; x.beginPath(); const y = Math.random() * h; x.moveTo(0, y); x.bezierCurveTo(w * 0.3, y + rr(-8, 8), w * 0.6, y + rr(-8, 8), w, y + rr(-6, 6)); x.stroke(); }
    x.globalAlpha = 1; x.lineWidth = 10; x.strokeStyle = border; x.strokeRect(5, 5, w - 10, h - 10);
    x.textAlign = 'center'; x.textBaseline = 'middle';
    const n = lines.length, fs = Math.min(h / (n + 0.6), opts.fs || 999);
    lines.forEach((ln, i) => {
      x.font = `${fs * 0.82}px "${font}", "Arial Rounded MT Bold", Arial, sans-serif`;
      let s = 1; const mw = x.measureText(ln).width; if (mw > w * 0.9) s = (w * 0.9) / mw;
      x.save(); x.translate(w / 2, h / 2 + (i - (n - 1) / 2) * fs); x.scale(s, 1);
      x.lineWidth = 7; x.strokeStyle = 'rgba(40,20,5,0.75)'; x.strokeText(ln, 0, 3);
      x.fillStyle = fg; x.fillText(ln, 0, 0); x.restore();
    });
  });
}
