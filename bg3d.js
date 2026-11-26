// ============================================================================
// 3D Particle Spider Background (Three.js)
// - Spider built from glowing particles in real 3D space
// - Scroll drives a camera flight: front view -> orbit -> galaxy -> web
// - Mouse tilts the scene for depth / parallax
// ============================================================================
import * as THREE from 'three';

const canvas = document.getElementById('bg3d');
const isMobile = window.matchMedia('(max-width: 768px), (hover: none) and (pointer: coarse)').matches;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const SPIDER_COUNT = isMobile ? 7000 : 16000;
const DUST_COUNT = isMobile ? 700 : 2200;
const PANEL_COUNT = isMobile ? 3 : 6;
const BG_COLOR = 0x000000;

function signalReady() {
  window.dispatchEvent(new Event('bg3d-ready'));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(217);
const gauss = () => {
  const u = 1 - rand();
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};
const smooth = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

function randomUnit() {
  const z = rand() * 2 - 1;
  const a = rand() * Math.PI * 2;
  const r = Math.sqrt(1 - z * z);
  return [r * Math.cos(a), r * Math.sin(a), z];
}

// ---------------------------------------------------------------------------
// Shape generators: spider, galaxy, web (same particle count -> morphable)
// ---------------------------------------------------------------------------
function buildSpider(count) {
  const out = new Float32Array(count * 3);
  let i = 0;
  const push = (x, y, z) => {
    if (i >= count) return;
    out[i * 3] = x; out[i * 3 + 1] = y; out[i * 3 + 2] = z;
    i++;
  };

  const ellipsoid = (n, cx, cy, cz, rx, ry, rz) => {
    for (let k = 0; k < n; k++) {
      const [ux, uy, uz] = randomUnit();
      const shell = 0.78 + 0.22 * Math.pow(rand(), 0.5);
      push(cx + ux * rx * shell, cy + uy * ry * shell, cz + uz * rz * shell);
    }
  };

  // Body
  ellipsoid(Math.floor(count * 0.28), 0, -1.05, -0.1, 0.85, 1.15, 0.65); // abdomen
  ellipsoid(Math.floor(count * 0.12), 0, 0.35, 0.05, 0.55, 0.62, 0.42);  // cephalothorax
  ellipsoid(Math.floor(count * 0.03), 0, 1.02, 0.12, 0.26, 0.2, 0.2);    // head / fangs

  // Legs: 4 per side, Catmull-Rom curves through joints, tapering thickness
  const legAngles = [22, 58, 112, 148].map((d) => (d * Math.PI) / 180);
  const legScale = [1.3, 1.05, 1.0, 1.2];
  const legBend = [0.35, 0.15, -0.15, -0.35];
  const legPoints = Math.floor(count * 0.46);
  const perLeg = Math.floor(legPoints / 8);

  for (const side of [-1, 1]) {
    legAngles.forEach((ang, li) => {
      const s = legScale[li];
      const dx = side * Math.sin(ang);
      const dy = Math.cos(ang);
      const b = -side * legBend[li];
      const bx = dx * Math.cos(b) - dy * Math.sin(b);
      const by = dx * Math.sin(b) + dy * Math.cos(b);

      const hip = new THREE.Vector3(dx * 0.42, 0.35 + dy * 0.42, 0.05);
      const knee = hip.clone().add(new THREE.Vector3(dx * 1.1 * s, dy * 1.1 * s, 0.95));
      const mid = knee.clone().add(new THREE.Vector3(dx * 1.45 * s, dy * 1.45 * s, 0.15));
      const tip = mid.clone().add(new THREE.Vector3(bx * 1.7 * s, by * 1.7 * s, -1.15));
      const curve = new THREE.CatmullRomCurve3([hip, knee, mid, tip]);

      for (let k = 0; k < perLeg; k++) {
        const t = rand();
        const p = curve.getPoint(t);
        const thick = lerp(0.1, 0.018, t);
        const [ux, uy, uz] = randomUnit();
        push(p.x + ux * thick, p.y + uy * thick, p.z + uz * thick);
      }
    });
  }

  // HUD crosshair lines (like the original video)
  const crossN = Math.floor(count * 0.04);
  for (let k = 0; k < crossN; k++) {
    if (k % 2 === 0) push((rand() - 0.5) * 0.02, (rand() - 0.5) * 12, -0.6);
    else if (rand() > 0.35) push((rand() - 0.5) * 9, 0.0 + (rand() - 0.5) * 0.02, -0.6);
    else push((rand() - 0.5) * 0.02, (rand() - 0.5) * 12, -0.6);
  }

  // Data glitch dust around the body
  while (i < count) {
    push(gauss() * 2.4, gauss() * 2.6 - 0.2, gauss() * 1.2);
  }
  return out;
}

function buildGalaxy(count) {
  const out = new Float32Array(count * 3);
  const arms = 3;
  for (let i = 0; i < count; i++) {
    let x, y, z;
    if (rand() < 0.12) {
      x = gauss() * 0.7; y = gauss() * 0.35; z = gauss() * 0.7;
    } else {
      const r = 0.4 + Math.pow(rand(), 0.65) * 7.5;
      const arm = i % arms;
      const spread = gauss() * (0.25 + 0.6 / (r + 0.5));
      const theta = (arm * Math.PI * 2) / arms + r * 0.85 + spread;
      x = Math.cos(theta) * r;
      z = Math.sin(theta) * r;
      y = gauss() * 0.22 * (1 - r / 9);
    }
    out[i * 3] = x; out[i * 3 + 1] = y; out[i * 3 + 2] = z;
  }
  return out;
}

function buildWeb(count) {
  const out = new Float32Array(count * 3);
  const spokes = 14;
  const rings = 18;
  for (let i = 0; i < count; i++) {
    let x, y, r;
    if (rand() < 0.42) {
      const a = (Math.floor(rand() * spokes) / spokes) * Math.PI * 2 + gauss() * 0.004;
      r = 0.25 + rand() * 6.6;
      x = Math.cos(a) * r; y = Math.sin(a) * r;
    } else {
      const ring = Math.floor(rand() * rings);
      const a = rand() * Math.PI * 2;
      const seg = (a * spokes) / (Math.PI * 2);
      const sag = Math.sin((seg - Math.floor(seg)) * Math.PI) * 0.12;
      r = (0.6 + ring * 0.34) * (1 - sag * 0.6);
      x = Math.cos(a) * r; y = Math.sin(a) * r;
    }
    const z = 0.5 * Math.sin(r * 0.7) - 0.4 + gauss() * 0.015;
    out[i * 3] = x + gauss() * 0.012;
    out[i * 3 + 1] = y + gauss() * 0.012;
    out[i * 3 + 2] = z;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Holographic code panels (canvas textures)
// ---------------------------------------------------------------------------
const PANEL_DATA = [
  { title: 'AURAVOYAGE // BUILD', lines: ['import { Concierge } from "./aura"', 'const trip = await plan(route)', 'render(<Suite tier="ultra" />)', 'lighthouse.score  // 100', 'deploy --target=pages', 'status: LIVE'] },
  { title: 'VERDORA.SYS', lines: ['botanical.grid({ cols: 12 })', 'theme.set("maison-noir")', 'cart.sync(store)', 'motion.ease = cubic(.2,.8,.2,1)', 'fps.target = 60', 'ok // 0 errors'] },
  { title: 'HAVENIX // RENDER', lines: ['scene.add(structure)', 'camera.dolly(0.08)', 'light.rim = "#9fd8ff"', 'layout = asymmetric()', 'build: 214ms', 'ship()'] },
  { title: 'AI_ASSETS.PIPE', lines: ['prompt -> concept -> refine', 'upscale x4', 'composite(layers)', 'grade("cinematic")', 'export --webp', 'batch 05/05 done'] },
  { title: 'SS // PORTFOLIO v3', lines: ['const spider = new Rig({ legs: 8 })', 'ik.solve(leg, target)', 'cam.lerp(path, 0.06)', 'particles: 16000', 'mode = "3D"', '// hello, visitor'] },
  { title: 'THUMBNAIL.CTR', lines: ['contrast.boost(1.4)', 'face.focus = true', 'text.size = "XXL"', 'ab_test(variantA, variantB)', 'winner: B', 'ctr ↑'] },
];

function makePanelTexture({ title, lines }) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 320;
  const g = c.getContext('2d');
  g.clearRect(0, 0, c.width, c.height);

  g.fillStyle = 'rgba(255, 255, 255, 0.03)';
  g.fillRect(0, 0, c.width, c.height);

  g.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  g.lineWidth = 2;
  g.strokeRect(6, 6, c.width - 12, c.height - 12);

  // Corner brackets
  g.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  g.lineWidth = 3;
  const L = 22;
  [[6, 6, 1, 1], [c.width - 6, 6, -1, 1], [6, c.height - 6, 1, -1], [c.width - 6, c.height - 6, -1, -1]].forEach(([x, y, sx, sy]) => {
    g.beginPath(); g.moveTo(x + L * sx, y); g.lineTo(x, y); g.lineTo(x, y + L * sy); g.stroke();
  });

  // Header bar
  g.fillStyle = 'rgba(255, 255, 255, 0.08)';
  g.fillRect(6, 6, c.width - 12, 40);
  g.font = '600 18px "Space Grotesk", monospace';
  g.fillStyle = 'rgba(255, 255, 255, 0.95)';
  g.fillText(title, 22, 33);
  g.fillStyle = 'rgba(0, 255, 136, 0.85)';
  g.beginPath(); g.arc(c.width - 28, 26, 5, 0, Math.PI * 2); g.fill();

  // Code lines
  g.font = '15px "Consolas", "Courier New", monospace';
  lines.forEach((line, k) => {
    g.fillStyle = `rgba(0, 255, 136, ${0.55 + (k % 3) * 0.12})`;
    g.fillText(String(k + 1).padStart(2, '0'), 22, 80 + k * 30);
    g.fillStyle = `rgba(235, 235, 235, ${0.7 + (k % 2) * 0.2})`;
    g.fillText(line, 58, 80 + k * 30);
  });

  // Mini bar chart
  for (let k = 0; k < 18; k++) {
    const h = 6 + Math.abs(Math.sin(k * 1.7 + title.length)) * 22;
    g.fillStyle = 'rgba(255, 255, 255, 0.22)';
    g.fillRect(c.width - 170 + k * 8, c.height - 22 - h, 5, h);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makeDotTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.3, 'rgba(220,220,220,0.6)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------
function init() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, powerPreference: 'high-performance' });
  } catch (err) {
    console.warn('[bg3d] WebGL unavailable, falling back to plain background.', err);
    canvas.style.display = 'none';
    signalReady();
    return;
  }

  const maxDpr = isMobile ? 1.25 : 1.75;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
  renderer.setClearColor(BG_COLOR, 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(BG_COLOR, 0.032);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 140);

  // --- Particle spider / galaxy / web ---
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(buildSpider(SPIDER_COUNT), 3));
  geo.setAttribute('aGalaxy', new THREE.BufferAttribute(buildGalaxy(SPIDER_COUNT), 3));
  geo.setAttribute('aWeb', new THREE.BufferAttribute(buildWeb(SPIDER_COUNT), 3));
  const rnd = new Float32Array(SPIDER_COUNT);
  const sizes = new Float32Array(SPIDER_COUNT);
  for (let k = 0; k < SPIDER_COUNT; k++) {
    rnd[k] = rand();
    sizes[k] = 0.45 + Math.pow(rand(), 3) * 1.4;
  }
  geo.setAttribute('aRand', new THREE.BufferAttribute(rnd, 1));
  geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

  const uniforms = {
    uTime: { value: 0 },
    uMorphA: { value: 0 },
    uMorphB: { value: 0 },
    uOpacity: { value: 1 },
    uSize: { value: isMobile ? 26 : 30 },
    uPixelRatio: { value: renderer.getPixelRatio() },
    uColorA: { value: new THREE.Color(0x8a8f96) },
    uColorB: { value: new THREE.Color(0xffffff) },
    uAccent: { value: new THREE.Color(0x00ff88) },
  };

  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      uniform float uTime, uMorphA, uMorphB, uSize, uPixelRatio;
      attribute vec3 aGalaxy;
      attribute vec3 aWeb;
      attribute float aRand;
      attribute float aSize;
      varying float vAlpha;
      varying float vMix;
      varying float vAccent;
      void main() {
        vec3 p = mix(position, aGalaxy, uMorphA);
        p = mix(p, aWeb, uMorphB);
        float scatter = uMorphA * (1.0 - uMorphA) * 4.0 + uMorphB * (1.0 - uMorphB) * 4.0;
        p += vec3(
          sin(uTime * 0.7 + aRand * 40.0),
          cos(uTime * 0.6 + aRand * 31.0),
          sin(uTime * 0.5 + aRand * 23.0)
        ) * (0.025 + scatter * 0.9);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * aSize * uPixelRatio / -mv.z;
        float twinkle = 0.6 + 0.4 * sin(uTime * 2.2 + aRand * 120.0);
        float fog = smoothstep(34.0, 5.0, -mv.z);
        vAlpha = twinkle * fog;
        vMix = pow(aRand, 2.0);
        vAccent = step(0.975, fract(aRand * 7.31));
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColorA, uColorB, uAccent;
      uniform float uOpacity;
      varying float vAlpha;
      varying float vMix;
      varying float vAccent;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = pow(smoothstep(0.5, 0.0, d), 1.6);
        vec3 col = mix(mix(uColorA, uColorB, vMix), uAccent, vAccent);
        gl_FragColor = vec4(col, a * vAlpha * uOpacity);
      }
    `,
  });

  const spiderGroup = new THREE.Group();
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  spiderGroup.add(points);
  scene.add(spiderGroup);

  // --- Deep space dust (parallax depth) ---
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(DUST_COUNT * 3);
  for (let k = 0; k < DUST_COUNT; k++) {
    dustPos[k * 3] = (rand() - 0.5) * 60;
    dustPos[k * 3 + 1] = (rand() - 0.5) * 36;
    dustPos[k * 3 + 2] = (rand() - 0.5) * 60;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    size: 0.09,
    map: makeDotTexture(),
    color: 0xbfc4ca,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  }));
  scene.add(dust);

  // --- Perspective floor grid ---
  const grid = new THREE.GridHelper(90, 90, 0x3a3a3a, 0x1c1c1c);
  grid.material.transparent = true;
  grid.material.opacity = 0.16;
  grid.material.depthWrite = false;
  grid.position.y = -5.5;
  scene.add(grid);

  // --- Holographic panels: ring outside the camera path, facing the centre ---
  const PANEL_RING = 16;
  const panels = [];
  for (let k = 0; k < PANEL_COUNT; k++) {
    const a = Math.PI + (k / PANEL_COUNT) * Math.PI * 2 + 0.35;
    const y = [1.5, -1.2, 3.4, 0.2, -2.6, 2.4][k];
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(3.4, 2.125),
      new THREE.MeshBasicMaterial({
        map: makePanelTexture(PANEL_DATA[k]),
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      })
    );
    m.position.set(Math.sin(a) * PANEL_RING, y, Math.cos(a) * PANEL_RING);
    m.lookAt(0, y, 0);
    m.scale.setScalar(1.9);
    m.userData.baseY = y;
    m.userData.phase = k * 1.3;
    scene.add(m);
    panels.push(m);
  }

  // -------------------------------------------------------------------------
  // Scroll choreography, anchored to real section positions
  // -------------------------------------------------------------------------
  let keys = [];
  let maxScroll = 1;

  function sectionP(id, fallback) {
    const el = document.getElementById(id);
    if (!el) return fallback;
    const top = el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.35;
    return Math.min(1, Math.max(0, top / maxScroll));
  }

  function computeKeys() {
    maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const pWork = sectionP('work', 0.15);
    const pAbout = sectionP('about', 0.55);
    const pServices = sectionP('services', 0.7);
    const pContact = sectionP('contact', 0.92);
    const TAU = Math.PI * 2;

    keys = [
      { p: 0, angle: 0.0, radius: 7.4, y: 0.3, morphA: 0, morphB: 0, opacity: 1.0 },
      { p: pWork, angle: 0.55, radius: 9.0, y: 1.6, morphA: 0, morphB: 0, opacity: 0.55 },
      { p: lerp(pWork, pAbout, 0.6), angle: 1.2, radius: 10.5, y: 2.6, morphA: 0, morphB: 0, opacity: 0.5 },
      { p: pAbout, angle: 1.8, radius: 12.5, y: 5.2, morphA: 1, morphB: 0, opacity: 0.8 },
      { p: pServices, angle: 2.8, radius: 12.0, y: 3.4, morphA: 1, morphB: 0, opacity: 0.5 },
      { p: pContact, angle: TAU, radius: 9.6, y: 0.4, morphA: 1, morphB: 1, opacity: 0.9 },
      { p: 1, angle: TAU, radius: 9.2, y: 0.3, morphA: 1, morphB: 1, opacity: 0.95 },
    ].sort((a, b) => a.p - b.p);
  }

  function sample(p) {
    if (p <= keys[0].p) return keys[0];
    for (let k = 0; k < keys.length - 1; k++) {
      const a = keys[k];
      const b = keys[k + 1];
      if (p <= b.p) {
        const t = smooth((p - a.p) / Math.max(1e-5, b.p - a.p));
        return {
          angle: lerp(a.angle, b.angle, t),
          radius: lerp(a.radius, b.radius, t),
          y: lerp(a.y, b.y, t),
          morphA: lerp(a.morphA, b.morphA, t),
          morphB: lerp(a.morphB, b.morphB, t),
          opacity: lerp(a.opacity, b.opacity, t),
        };
      }
    }
    return keys[keys.length - 1];
  }

  // -------------------------------------------------------------------------
  // Input
  // -------------------------------------------------------------------------
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  if (!isMobile) {
    window.addEventListener('pointermove', (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
  }

  let scrollTarget = 0;
  let scrollSmooth = 0;
  // Debug: ?bgp=0.5 previews the scene at 50% scroll progress
  const forcedP = parseFloat(new URLSearchParams(location.search).get('bgp'));
  const readScroll = () => {
    scrollTarget = Number.isFinite(forcedP) ? forcedP : Math.min(1, Math.max(0, window.scrollY / maxScroll));
  };
  window.addEventListener('scroll', readScroll, { passive: true });

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    computeKeys();
    readScroll();
  }
  window.addEventListener('resize', resize);
  window.addEventListener('load', resize);
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => { computeKeys(); readScroll(); }).observe(document.body);
  }
  resize();
  scrollSmooth = scrollTarget;

  // -------------------------------------------------------------------------
  // Loop
  // -------------------------------------------------------------------------
  const clock = new THREE.Clock();
  let time = 0;
  let readySent = false;

  function frame() {
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!reduceMotion) time += dt;

    const ease = 1 - Math.exp(-dt * 4.5);
    scrollSmooth += (scrollTarget - scrollSmooth) * ease;
    mouse.sx += (mouse.x - mouse.sx) * (1 - Math.exp(-dt * 3));
    mouse.sy += (mouse.y - mouse.sy) * (1 - Math.exp(-dt * 3));

    const s = sample(scrollSmooth);
    const portrait = camera.aspect < 1 ? 1.45 : 1;
    const radius = s.radius * portrait;

    camera.position.set(
      Math.sin(s.angle) * radius + mouse.sx * 0.8,
      s.y - mouse.sy * 0.6,
      Math.cos(s.angle) * radius
    );
    camera.lookAt(0, -0.2, 0);

    uniforms.uTime.value = time;
    uniforms.uMorphA.value = s.morphA;
    uniforms.uMorphB.value = s.morphB;
    uniforms.uOpacity.value = s.opacity;

    // Mouse tilt + slow galaxy spin + subtle breathing
    const galaxySpin = s.morphA * (1 - s.morphB) * time * 0.06;
    spiderGroup.rotation.y = mouse.sx * 0.35 + galaxySpin;
    spiderGroup.rotation.x = mouse.sy * 0.18;
    const breathe = 1 + Math.sin(time * 1.3) * 0.012;
    spiderGroup.scale.setScalar(breathe);

    dust.rotation.y = time * 0.008;
    panels.forEach((m) => {
      m.position.y = m.userData.baseY + Math.sin(time * 0.45 + m.userData.phase) * 0.18;
      m.material.opacity = 0.5 * (0.6 + 0.4 * s.opacity);
    });

    renderer.render(scene, camera);

    if (!readySent) {
      readySent = true;
      signalReady();
    }
  }
  frame();
}

init();
