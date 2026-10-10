// Nilara 3D carton: a gable-top carton built in Three.js with label art
// painted on canvas, so every variety and size comes from one model.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export const INK = '#07087E';
const BLUE = '#1B86DC';

// All varieties stay in the blue family: the water band changes shade.
export const VARIANTS = {
  pure:     { name: 'Pure',     tag: 'PACKAGED DRINKING WATER', water: ['#A4E4FB', '#22A7E2', '#0A5AA3'] },
  alkaline: { name: 'Alkaline', tag: 'ALKALINE WATER · pH 8.5+', water: ['#B4CCFA', '#3B6FE3', '#13227F'] },
  mineral:  { name: 'Mineral+', tag: 'MINERAL ENRICHED WATER',   water: ['#B9F1F8', '#1DB2D2', '#0A6290'] },
  active:   { name: 'Active',   tag: 'ELECTROLYTE WATER',        water: ['#D6F4FF', '#4FC8F4', '#1580CF'] },
};

// Sizes in world units (500 ml carton = 1 unit wide).
export const SIZES = {
  200:  { w: 0.80, h: 1.72, label: '200 ml' },
  330:  { w: 0.90, h: 2.12, label: '330 ml' },
  500:  { w: 1.00, h: 2.60, label: '500 ml' },
  1000: { w: 1.22, h: 3.20, label: '1 L' },
};

let A = null;
const cache = new Map();
const FONT = '"Bricolage Grotesque", system-ui, sans-serif';

export async function loadAssets() {
  const load = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  const [word, drop] = await Promise.all([load('assets/img/nilara-wordmark.png'), load('assets/img/nilara-drop.png')]);
  try {
    await Promise.all(['500', '600', '700', '800'].map((w) => document.fonts.load(`${w} 40px "Bricolage Grotesque"`)));
  } catch (e) { /* fall back to system font */ }
  A = { word, drop };
}

/* ---------- label painting ---------- */

const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const seeded = (seed) => { let s = seed % 2147483647 || 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; };

function paper(x, W, H) {
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, '#EDF3F8');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
}

function wave(x, W, y, amp, freq, phase, closeTo) {
  x.beginPath();
  for (let i = 0; i <= W; i += 4) {
    const t = (i / W) * Math.PI * 2;
    const yy = y + Math.sin(t * freq + phase) * amp + Math.sin(t * freq * 2.3 + phase * 1.7) * amp * 0.35;
    i === 0 ? x.moveTo(i, yy) : x.lineTo(i, yy);
  }
  if (closeTo) { x.lineTo(W, closeTo); x.lineTo(0, closeTo); x.closePath(); }
}

function paintWater(x, W, H, y0, v, phase, fizz) {
  const [c0, c1, c2] = v.water;
  const amp = W * 0.035;
  const g = x.createLinearGradient(0, y0 - amp * 2, 0, H);
  g.addColorStop(0, c0); g.addColorStop(0.22, c1); g.addColorStop(1, c2);
  x.save();
  x.fillStyle = g;
  x.globalAlpha = 0.35; wave(x, W, y0 - amp * 1.8, amp * 1.2, 1.2, phase + 2, H); x.fill();
  x.globalAlpha = 1; wave(x, W, y0, amp, 1, phase, H); x.fill();
  // light streaks inside the water
  x.strokeStyle = '#fff'; x.lineWidth = W * 0.006; x.globalAlpha = 0.16;
  for (let i = 1; i < 5; i++) { wave(x, W, y0 + amp * i * 1.7, amp * 0.7, 1 + i * 0.15, phase + i); x.stroke(); }
  // crest
  x.globalAlpha = 0.9; x.lineWidth = W * 0.012; wave(x, W, y0, amp, 1, phase); x.stroke();
  // spray above the crest, or bubbles inside for Active
  const r = seeded(11 + Math.round(phase * 97));
  x.globalAlpha = 1;
  for (let i = 0; i < (fizz ? 60 : 24); i++) {
    const px = r() * W;
    let py, rad;
    if (fizz) { py = y0 + amp * 2 + r() * (H - y0 - amp * 4); rad = W * (0.004 + r() * 0.011); }
    else { if (px > W * 0.72) continue; py = y0 - amp * (1.2 + r() * 4); rad = W * (0.003 + r() * 0.009); }
    x.beginPath(); x.arc(px, py, rad, 0, Math.PI * 2);
    x.fillStyle = 'rgba(255,255,255,.55)'; x.fill();
    x.lineWidth = Math.max(1, rad * 0.35); x.strokeStyle = fizz ? 'rgba(255,255,255,.9)' : c1; x.stroke();
  }
  const v2 = x.createLinearGradient(0, H * 0.75, 0, H);
  v2.addColorStop(0, 'rgba(0,10,40,0)'); v2.addColorStop(1, 'rgba(0,10,40,.22)');
  x.fillStyle = v2; x.fillRect(0, H * 0.75, W, H * 0.25);
  x.restore();
}

function text(x, str, px, py, { size, weight = 600, color = INK, align = 'center', spacing = 0, alpha = 1 }) {
  x.save();
  x.font = `${weight} ${size}px ${FONT}`;
  x.fillStyle = color; x.textAlign = align; x.textBaseline = 'alphabetic'; x.globalAlpha = alpha;
  if ('letterSpacing' in x) x.letterSpacing = `${spacing}px`;
  x.fillText(str, px, py);
  x.restore();
}

// Where the water line sits on a face of this size.
const waterLine = (W, H) => Math.max(H * 0.5, W * 1.12);

function frontArt(vk, sk) {
  const v = VARIANTS[vk], s = SIZES[sk];
  const W = 512, H = Math.round(W * s.h / s.w);
  const c = canvas(W, H), x = c.getContext('2d');
  paper(x, W, H);
  const dw = W * 0.12, dh = dw * A.drop.height / A.drop.width;
  let y = W * 0.2;
  x.drawImage(A.drop, (W - dw) / 2, y, dw, dh);
  y += dh + W * 0.05;
  const ww = W * 0.68, wh = ww * A.word.height / A.word.width;
  x.drawImage(A.word, (W - ww) / 2, y, ww, wh);
  y += wh;
  if (vk !== 'pure') {
    const label = v.name.toUpperCase();
    x.font = `700 ${W * 0.048}px ${FONT}`;
    const tw = x.measureText(label).width + W * 0.1;
    x.fillStyle = v.water[1];
    x.beginPath(); x.roundRect((W - tw) / 2, y + W * 0.05, tw, W * 0.09, W * 0.045); x.fill();
    text(x, label, W / 2, y + W * 0.112, { size: W * 0.048, weight: 700, color: '#fff', spacing: W * 0.004 });
  }
  paintWater(x, W, H, waterLine(W, H), v, 0.6, vk === 'active');
  text(x, v.tag, W / 2, H - W * 0.13, { size: W * 0.046, weight: 600, color: '#fff', spacing: W * 0.006 });
  text(x, s.label, W / 2, H - W * 0.07, { size: W * 0.036, weight: 500, color: '#fff', alpha: 0.85, spacing: W * 0.004 });
  return c;
}

function sideArt(vk, sk, phase) {
  const v = VARIANTS[vk], s = SIZES[sk];
  const W = 512, H = Math.round(W * s.h / s.w);
  const c = canvas(W, H), x = c.getContext('2d');
  paper(x, W, H);
  text(x, 'JUST ECO', W / 2, W * 0.5, { size: W * 0.1, weight: 600, color: INK, spacing: W * 0.012 });
  text(x, 'H2O', W / 2, W * 0.76, { size: W * 0.24, weight: 800, color: BLUE, spacing: W * 0.01 });
  paintWater(x, W, H, waterLine(W, H), v, phase, vk === 'active');
  text(x, `${v.name} · ${s.label}`, W / 2, H - W * 0.1, { size: W * 0.05, weight: 600, color: '#fff', spacing: W * 0.004 });
  return c;
}

function backArt(vk, sk) {
  const v = VARIANTS[vk], s = SIZES[sk];
  const W = 512, H = Math.round(W * s.h / s.w);
  const c = canvas(W, H), x = c.getContext('2d');
  paper(x, W, H);
  const ww = W * 0.42, wh = ww * A.word.height / A.word.width;
  x.drawImage(A.word, W * 0.1, W * 0.16, ww, wh);
  const lines = ['Ingredients: purified water.', 'Store in a cool, dry place,', 'away from direct sunlight.', 'Recycle me: flatten and drop', 'in dry waste.'];
  lines.forEach((l, i) => text(x, l, W * 0.1, W * 0.42 + i * W * 0.066, { size: W * 0.042, weight: 500, align: 'left', alpha: 0.75 }));
  paintWater(x, W, H, waterLine(W, H), v, 3.4, vk === 'active');
  // barcode
  const bw = W * 0.4, bh = W * 0.22, bx = W * 0.5, by = H - W * 0.38;
  x.fillStyle = '#fff'; x.beginPath(); x.roundRect(bx, by, bw, bh, W * 0.02); x.fill();
  const r = seeded(sk + vk.length * 31);
  let px = bx + W * 0.03;
  x.fillStyle = '#0B1240';
  while (px < bx + bw - W * 0.04) { const lw = 1 + Math.floor(r() * 4); x.fillRect(px, by + W * 0.03, lw, bh - W * 0.08); px += lw + 1 + Math.floor(r() * 4); }
  text(x, 'nilara.in', W * 0.1, H - W * 0.2, { size: W * 0.05, weight: 600, color: '#fff', align: 'left' });
  return c;
}

function roofArt(sk, L) {
  const s = SIZES[sk];
  const W = 512, H = Math.round(W * L / s.w);
  const c = canvas(W, H), x = c.getContext('2d');
  paper(x, W, H);
  text(x, s.label.replace(' ', ''), W * 0.9, H * 0.8, { size: W * 0.07, weight: 600, align: 'right' });
  // "JUST ECO H2O" curved around the cap, like the real carton
  const cx = W * 0.5, cy = H * 0.5, rad = W * 0.25;
  x.save();
  x.font = `600 ${W * 0.055}px ${FONT}`;
  const str = 'JUST ECO H2O';
  let a = Math.PI * 0.62;
  [...str].forEach((ch, i) => {
    x.save();
    x.translate(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
    x.rotate(a - Math.PI / 2 + Math.PI);
    x.fillStyle = i >= str.indexOf('H2O') ? BLUE : INK;
    x.fillText(ch, 0, 0);
    x.restore();
    a += (x.measureText(ch).width + W * 0.006) / rad;
  });
  x.restore();
  return c;
}

function finArt(w, fh) {
  const W = 1024, H = Math.round(W * fh / w);
  const c = canvas(W, H), x = c.getContext('2d');
  paper(x, W, H);
  x.font = `600 ${H * 0.5}px ${FONT}`;
  if ('letterSpacing' in x) x.letterSpacing = `${H * 0.05}px`;
  const a = 'STAY ', b = 'HYDRATED';
  const wa = x.measureText(a).width, wb = x.measureText(b).width;
  const sx = (W - wa - wb) / 2, y = H * 0.68;
  x.fillStyle = '#1A1F2E'; x.fillText(a, sx, y);
  x.font = `700 ${H * 0.5}px ${FONT}`; x.fillStyle = BLUE; x.fillText(b, sx + wa, y);
  return c;
}

function tex(key, make) {
  if (cache.has(key)) return cache.get(key);
  const t = new THREE.CanvasTexture(make());
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  cache.set(key, t);
  return t;
}

const paperMat = (map) => new THREE.MeshPhysicalMaterial({
  map, color: map ? 0xffffff : 0xf3f7fb, roughness: 0.5, clearcoat: 0.35, clearcoatRoughness: 0.4,
});
let plasticMat;

/* ---------- the model ---------- */

export function buildCarton(vk = 'pure', sk = 500) {
  const s = SIZES[sk];
  const w = s.w, d = s.w, h = s.h;
  const r = w * 0.42;               // roof rise
  const fh = w * 0.17;              // top fin
  const L = Math.hypot(d / 2, r);   // roof panel length
  const th = Math.atan2(d / 2, r);

  const white = paperMat(null);
  const front = paperMat(tex(`f-${vk}-${sk}`, () => frontArt(vk, sk)));
  const sideR = paperMat(tex(`sr-${vk}-${sk}`, () => sideArt(vk, sk, 1.9)));
  const sideL = paperMat(tex(`sl-${vk}-${sk}`, () => sideArt(vk, sk, 4.1)));
  const back = paperMat(tex(`b-${vk}-${sk}`, () => backArt(vk, sk)));
  const roof = paperMat(tex(`r-${sk}`, () => roofArt(sk, L)));
  const fin = paperMat(tex(`fin-${sk}`, () => finArt(w, fh)));
  plasticMat ||= new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.2 });

  const outer = new THREE.Group();
  const g = new THREE.Group();
  outer.add(g);

  g.add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [sideR, sideL, white, white, front, back]));

  const roofF = new THREE.Mesh(new THREE.PlaneGeometry(w, L), roof);
  roofF.position.set(0, h / 2 + r / 2, d / 4); roofF.rotation.x = -th; g.add(roofF);
  const roofB = new THREE.Mesh(new THREE.PlaneGeometry(w, L), white);
  roofB.position.set(0, h / 2 + r / 2, -d / 4); roofB.rotation.set(th, Math.PI, 0); g.add(roofB);

  const tri = new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(-d / 2, 0), new THREE.Vector2(d / 2, 0), new THREE.Vector2(0, r)]));
  const gR = new THREE.Mesh(tri, white); gR.position.set(w / 2, h / 2, 0); gR.rotation.y = Math.PI / 2; g.add(gR);
  const gL = new THREE.Mesh(tri, white); gL.position.set(-w / 2, h / 2, 0); gL.rotation.y = -Math.PI / 2; g.add(gL);

  const finM = new THREE.Mesh(new THREE.BoxGeometry(w, fh, w * 0.04), [white, white, white, white, fin, white]);
  finM.position.set(0, h / 2 + r + fh / 2 - w * 0.012, 0); g.add(finM);

  // screw cap, standing out of the front roof panel
  const n = new THREE.Vector3(0, Math.sin(th), Math.cos(th));
  const cap = new THREE.Group();
  const capR = w * 0.17, capH = w * 0.12;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(capR, capR * 1.03, capH, 56, 1), plasticMat);
  body.position.y = capH / 2 + w * 0.02;
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(capR * 1.12, capR * 1.15, w * 0.025, 56), plasticMat);
  ring.position.y = w * 0.0125;
  const ribs = new THREE.Mesh(new THREE.TorusGeometry(capR * 0.82, w * 0.008, 8, 48), plasticMat);
  ribs.rotation.x = Math.PI / 2; ribs.position.y = capH + w * 0.021;
  cap.add(body, ring, ribs);
  cap.position.set(0, h / 2 + r / 2, d / 4).addScaledVector(n, 0.002);
  cap.rotation.x = Math.PI / 2 - th;
  g.add(cap);

  const total = h + r + fh;
  g.position.y = -(r + fh) / 2;
  outer.userData = { height: total, width: w, vk, sk };
  return outer;
}

/* ---------- stages ---------- */

function light(scene, renderer) {
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  const key = new THREE.DirectionalLight(0xffffff, 1.2); key.position.set(-4, 6, 8); scene.add(key);
  const rim = new THREE.DirectionalLight(0xcfeaff, 0.7); rim.position.set(6, 2, -4); scene.add(rim);
}

export function makeStage(canvasEl, { fov = 28, z = 16 } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  light(scene, renderer);
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 100);
  camera.position.set(0, 0, z);
  const stage = { renderer, scene, camera, visible: true, viewH: 1, viewW: 1, onFrame: null, onResize: null };
  const resize = () => {
    const rect = canvasEl.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
    stage.viewH = 2 * z * Math.tan((fov * Math.PI) / 360);
    stage.viewW = stage.viewH * camera.aspect;
    stage.onResize && stage.onResize(stage);
  };
  new ResizeObserver(resize).observe(canvasEl);
  new IntersectionObserver(([e]) => { stage.visible = e.isIntersecting; }, { rootMargin: '120px' }).observe(canvasEl);
  resize();
  stage.resize = resize;
  return stage;
}

/* ---------- still renders for cards ---------- */

let snap;
export function snapshot({ cartons, w = 520, h = 680, rx = 0.1, ry = -0.5, rz = -0.06, fill = 0.86 }) {
  if (!snap) {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.05;
    const scene = new THREE.Scene();
    light(scene, renderer);
    snap = { renderer, scene, camera: new THREE.PerspectiveCamera(22, 1, 0.1, 200) };
  }
  const { renderer, scene, camera } = snap;
  const grp = new THREE.Group();
  cartons.forEach((c) => {
    const m = buildCarton(c.v, c.s);
    m.position.set(c.x || 0, m.userData.height / 2 + (c.y || 0), c.z || 0);
    m.rotation.set(c.rx || 0, c.ry || 0, c.rz || 0);
    grp.add(m);
  });
  grp.rotation.set(rx, ry, rz);
  scene.add(grp);
  const box = new THREE.Box3().setFromObject(grp);
  const size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  const t = Math.tan((camera.fov * Math.PI) / 360);
  const dist = Math.max(size.y / (2 * t), size.x / (2 * t * camera.aspect)) / fill + size.z / 2;
  camera.position.set(center.x, center.y, center.z + dist);
  camera.lookAt(center);
  renderer.setSize(w, h, false);
  renderer.render(scene, camera);
  let url = renderer.domElement.toDataURL('image/webp', 0.9);
  if (!url.startsWith('data:image/webp')) url = renderer.domElement.toDataURL('image/png');
  scene.remove(grp);
  grp.traverse((o) => o.geometry && o.geometry.dispose());
  return url;
}

export function disposeSnapshots() {
  if (!snap) return;
  snap.renderer.dispose();
  snap.renderer.forceContextLoss();
  snap = null;
}
