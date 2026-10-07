// =============================================
// DIYA.JS — Sacred Interactive Diya Experience
// =============================================
'use strict';

(function() {

// =============================================
// CONFIG & DOM REFS
// =============================================
const app            = document.getElementById('app');
const bgCanvas       = document.getElementById('bgCanvas');
const diyaScene      = document.getElementById('diyaScene');
const diyaImg        = document.getElementById('diyaImg');
const flameSvg       = document.getElementById('flameSvg');
const lightSpill     = document.getElementById('lightSpill');
const instruction    = document.getElementById('instruction');
const instructionTxt = document.getElementById('instructionText');
const toggleFlameBtn = document.getElementById('toggleFlameBtn');
const btnIcon        = document.getElementById('btnIcon');
const btnLabel       = document.getElementById('btnLabel');
const motionOverlay  = document.getElementById('motionPermissionOverlay');
const enableMotionBtn= document.getElementById('enableMotionBtn');

// SVG Elements inside #flameSvg
const flameAmbientAura = document.getElementById('flameAmbientAura');
const rimIllumination  = document.getElementById('rimIllumination');
const oilReflection    = document.getElementById('oilReflection');
const oilRipplesGroup  = document.getElementById('oilRipples');
const wickEmber        = document.getElementById('wickEmber');
const flameGroup       = document.getElementById('flameGroup');
const flameAura        = document.getElementById('flameAura');
const flameBody        = document.getElementById('flameBody');
const flameWingLeft    = document.getElementById('flameWingLeft');
const flameWingRight   = document.getElementById('flameWingRight');
const centralBeam      = document.getElementById('centralBeam');
const innerPetal       = document.getElementById('innerPetal');
const innerPetalSheen  = document.getElementById('innerPetalSheen');
const hotCore          = document.getElementById('hotCore');
const emberGroup       = document.getElementById('emberGroup');
const smokeGroup       = document.getElementById('smokeGroup');

// Canvas Context
let bgCtx = null;

// =============================================
// GEOMETRY CONSTANTS (In SVG 1536x1024 coordinate space)
// =============================================
const CX = 768;            // Center X of diya
const WICK_TIP_Y = 415;    // Tip of wick stalk in diya.png
const FLAME_BASE_Y = 488;  // Base of flame (envelops the wick stem)
const FLAME_NATURAL_H = 615; // Natural height of outer flame
const FLAME_BELLY_W = 144; // Half-width of outer flame belly

// =============================================
// STATE & SPRINGS
// =============================================
const state = {
  lit: false,
  igniting: false,
  ignitionProgress: 0,
  extinguishing: false,
  extinguishProgress: 0,
  t: 0,
  lastFrameTime: null,
  hasDeviceOrientation: false,
  motionPermissionGranted: false,
  pointerDown: false,
  pointerStartX: 0,
  pointerStartY: 0,
  pointerPrevX: 0,
  pointerPrevY: 0,
  swipeHistory: [],
};

// Physics springs (from physics.js)
const flameLeanX  = new Spring(16, 0.76, 0);
const flameLeanY  = new Spring(12, 0.72, 0);
const flameScale  = new Spring(9, 0.78, 0);
const flameBright = new Spring(10, 0.82, 0);
const windX       = new Spring(14, 0.75, 0);
const smokeIntens = new Spring(6, 0.88, 0);

// Smooth noise generators
const noiseSway    = new SmoothNoise(12);
const noiseFlicker = new SmoothNoise(48);
const noiseBreathe = new SmoothNoise(99);

// Particles
let embers = [];
let emberTimer = 0;
let smokes = [];
let smokeTimer = 0;
let ripples = [];

// =============================================
// INITIALIZATION
// =============================================
function init() {
  if (bgCanvas) {
    bgCtx = bgCanvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
  }

  setupEvents();
  checkDeviceOrientation();

  // Draw initial unlit background
  drawBackground(0);

  // Auto-ignite on load after gentle 500ms delay so user immediately sees the glorious flame
  setTimeout(() => {
    if (!state.lit && !state.igniting) {
      ignite();
    }
  }, 500);

  requestAnimationFrame(loop);
}

function resizeCanvas() {
  if (!bgCanvas) return;
  bgCanvas.width  = window.innerWidth;
  bgCanvas.height = window.innerHeight;
}

// =============================================
// BACKGROUND AMBIENT ILLUMINATION
// =============================================
function drawBackground(intensity) {
  if (!bgCtx || !bgCanvas) return;
  const w = bgCanvas.width;
  const h = bgCanvas.height;

  bgCtx.clearRect(0, 0, w, h);

  // Ambient room center sits directly behind the diya
  const cx = w * 0.5;
  const cy = h * 0.50;

  if (intensity > 0.005) {
    // 1. Broad spiritual warm aura filling the room
    const r1 = Math.max(w, h) * (0.42 + intensity * 0.28);
    const g1 = bgCtx.createRadialGradient(cx, cy, 0, cx, cy, r1);
    g1.addColorStop(0.0, `rgba(225, 95, 12, ${0.32 * intensity})`);
    g1.addColorStop(0.35, `rgba(165, 55, 6, ${0.16 * intensity})`);
    g1.addColorStop(0.70, `rgba(90, 22, 3, ${0.06 * intensity})`);
    g1.addColorStop(1.0, 'transparent');
    bgCtx.fillStyle = g1;
    bgCtx.fillRect(0, 0, w, h);

    // 2. Focused radiant candlelight halo behind the flame
    const r2 = Math.min(w, h) * (0.28 + intensity * 0.15);
    const flameCenterY = cy - Math.min(w, h) * 0.08;
    const g2 = bgCtx.createRadialGradient(cx, flameCenterY, 0, cx, flameCenterY, r2);
    g2.addColorStop(0.0, `rgba(255, 160, 25, ${0.35 * intensity})`);
    g2.addColorStop(0.45, `rgba(220, 90, 10, ${0.14 * intensity})`);
    g2.addColorStop(1.0, 'transparent');
    bgCtx.fillStyle = g2;
    bgCtx.fillRect(0, 0, w, h);
  }
}

// =============================================
// MAIN ANIMATION LOOP
// =============================================
function loop(timestamp) {
  if (!state.lastFrameTime) state.lastFrameTime = timestamp;
  const dt = Math.min((timestamp - state.lastFrameTime) / 1000, 0.05);
  state.lastFrameTime = timestamp;
  state.t += dt;

  const t = state.t;

  // Natural wind damping
  windX.setTarget(windX.target * 0.94);

  // Organic flame flicker & sway
  const swayVal    = noiseSway.get(t * 1.6) * 7.0;
  const flickerVal = noiseFlicker.get(t * 3.8) * 4.5;
  const breatheVal = 1.0 + noiseBreathe.get(t * 1.4) * 0.035;

  // Lean target derived from physics wind + device tilt
  const targetLean = Math.max(-42, Math.min(42, windX.current));
  flameLeanX.setTarget(targetLean);

  // Update springs
  flameLeanX.update(dt);
  flameScale.update(dt);
  flameBright.update(dt);
  windX.update(dt);
  smokeIntens.update(dt);

  // Handle Ignition Sequence
  if (state.igniting) {
    state.ignitionProgress += dt * 1.6; // ~600ms total
    if (state.ignitionProgress >= 1.0) {
      state.igniting = false;
      state.ignitionProgress = 1.0;
      flameScale.snap(1.0);
      flameBright.snap(1.0);
      showInstruction('Tilt or swipe to interact with the flame', 3500);
    } else {
      const p = state.ignitionProgress;
      // Smooth bloom curve
      const bloom = Math.sin(p * Math.PI * 0.5);
      flameScale.snap(bloom);
      flameBright.snap(Math.min(1.0, p * 1.4));
    }
  }

  // Handle Extinguish Sequence
  if (state.extinguishing) {
    state.extinguishProgress += dt * 2.2; // ~450ms
    if (state.extinguishProgress >= 1.0) {
      state.extinguishing = false;
      state.lit = false;
      state.extinguishProgress = 0;
      flameScale.snap(0);
      flameBright.snap(0);
      smokeIntens.snap(1.0);
      setTimeout(() => smokeIntens.setTarget(0), 3000);
      showInstruction('Tap the diya to relight the flame');
      updateButtonUI();
    } else {
      const p = state.extinguishProgress;
      flameScale.snap(Math.max(0, (1 - p) * 0.9));
      flameBright.snap(Math.max(0, 1 - p * 1.2));
    }
  }

  const scale = flameScale.current;
  const bright = flameBright.current;
  const totalLean = flameLeanX.current + swayVal + flickerVal;

  if (scale > 0.005) {
    renderFlame(t, scale * breatheVal, totalLean, bright);
    renderAuraAndSpill(scale, bright);
    renderOilEffects(t, dt, scale, bright, totalLean);
    if (scale > 0.35) updateEmbers(dt, totalLean, scale);
    drawBackground(bright * (0.85 + flickerVal * 0.02) * scale);
  } else {
    flameGroup.setAttribute('opacity', '0');
    flameAmbientAura.setAttribute('opacity', '0');
    rimIllumination.setAttribute('opacity', '0');
    oilReflection.setAttribute('opacity', '0');
    wickEmber.setAttribute('opacity', '0');
    lightSpill.style.opacity = '0';
    drawBackground(0);
  }

  // Always update smoke (especially during extinguish)
  updateSmoke(t, dt, totalLean);

  requestAnimationFrame(loop);
}

// =============================================
// RENDER: SACRED FLAME (Matches Reference Image)
// =============================================
function renderFlame(t, scale, lean, bright) {
  flameGroup.setAttribute('opacity', Math.min(1.0, scale * 1.2).toString());

  const bx = CX;
  const by = FLAME_BASE_Y;

  // Scaled dimensions
  const h = FLAME_NATURAL_H * scale;
  const bw = FLAME_BELLY_W * scale;
  const baseW = 42 * scale;

  // Lean math (quadratic curve: base stays firmly anchored, tip bends maximum)
  const leanRad = (lean * Math.PI) / 180;
  const leanSin = Math.sin(leanRad);

  const leanBelly = h * 0.22 * leanSin;
  const leanMid   = h * 0.52 * leanSin;
  const leanTip   = h * 0.95 * leanSin;

  // Organic tip tongue curl (like a living flame)
  const tipCurlX = Math.sin(t * 3.2) * 8 * scale;
  const tipCurlY = Math.cos(t * 2.8) * 6 * scale;

  // Key Y coordinates along flame spine
  const tipX = bx + leanTip + tipCurlX;
  const tipY = by - h + tipCurlY;

  const bellyY = by - h * 0.38;
  const bellyLeftX  = bx - bw + leanBelly;
  const bellyRightX = bx + bw + leanBelly;

  // 1. MAIN TEARDROP PATH BUILDER
  // Creates the iconic smooth teardrop with concave neck tapering to a sharp point
  function buildTeardropPath(widthMultiplier, yOffset, tipExtra) {
    const wBelly = bw * widthMultiplier;
    const wBase  = baseW * widthMultiplier;
    const bLX = bx - wBelly + leanBelly;
    const bRX = bx + wBelly + leanBelly;
    const yo  = yOffset || 0;
    const tY  = tipY + yo - (tipExtra || 0);

    return [
      `M ${bx} ${by + yo}`,
      // Left side: base -> belly -> concave neck -> sharp tip
      `C ${bx - wBase * 1.25} ${by + yo - 8},`,
      `  ${bLX - 18} ${bellyY + yo + 45},`,
      `  ${bLX} ${bellyY + yo}`,
      `C ${bLX + 12} ${bellyY + yo - 85},`,
      `  ${tipX - 18} ${tY + 130},`,
      `  ${tipX} ${tY}`,
      // Right side: tip -> concave neck -> belly -> base
      `C ${tipX + 18} ${tY + 130},`,
      `  ${bRX - 12} ${bellyY + yo - 85},`,
      `  ${bRX} ${bellyY + yo}`,
      `C ${bRX + 18} ${bellyY + yo + 45},`,
      `  ${bx + wBase * 1.25} ${by + yo - 8},`,
      `  ${bx} ${by + yo}`,
      `Z`
    ].join(' ');
  }

  // --- Layer 1: Translucent Outer Flame Sheath (Soft Glowing Edge) ---
  flameAura.setAttribute('d', buildTeardropPath(1.18, 4, 12));
  flameAura.setAttribute('opacity', (0.85 * bright).toString());

  // --- Layer 2: Main Vibrant Flame Body ---
  flameBody.setAttribute('d', buildTeardropPath(1.0, 0, 0));
  flameBody.setAttribute('opacity', (0.96 * bright).toString());

  // --- Layer 3: Left & Right Translucent Wings (From Reference) ---
  // Left wing crescent
  const wingLeftPath = [
    `M ${bx - baseW * 0.6} ${by - 15}`,
    `C ${bellyLeftX - 10} ${bellyY + 30}, ${bellyLeftX} ${bellyY - 40}, ${bx - bw * 0.35 + leanMid} ${by - h * 0.68}`,
    `C ${bellyLeftX + 25} ${bellyY - 30}, ${bellyLeftX + 20} ${bellyY + 40}, ${bx - baseW * 0.4} ${by - 10}`,
    `Z`
  ].join(' ');
  flameWingLeft.setAttribute('d', wingLeftPath);

  // Right wing crescent
  const wingRightPath = [
    `M ${bx + baseW * 0.6} ${by - 15}`,
    `C ${bellyRightX + 10} ${bellyY + 30}, ${bellyRightX} ${bellyY - 40}, ${bx + bw * 0.35 + leanMid} ${by - h * 0.68}`,
    `C ${bellyRightX - 25} ${bellyY - 30}, ${bellyRightX - 20} ${bellyY + 40}, ${bx + baseW * 0.4} ${by - 10}`,
    `Z`
  ].join(' ');
  flameWingRight.setAttribute('d', wingRightPath);

  // --- Layer 4: Central Radiant Light Beam (Rises through flame) ---
  const beamTopY = by - h * 0.82;
  const beamTopX = bx + leanMid * 0.9;
  const beamBaseY = by - h * 0.16;
  const beamPath = [
    `M ${bx - bw * 0.24} ${beamBaseY}`,
    `C ${bx - bw * 0.20} ${by - h * 0.38}, ${beamTopX - 14} ${by - h * 0.60}, ${beamTopX} ${beamTopY}`,
    `C ${beamTopX + 14} ${by - h * 0.60}, ${bx + bw * 0.20} ${by - h * 0.38}, ${bx + bw * 0.24} ${beamBaseY}`,
    `Z`
  ].join(' ');
  centralBeam.setAttribute('d', beamPath);
  centralBeam.setAttribute('opacity', (0.88 * bright).toString());

  // --- Layer 5: Inner Golden Leaf/Petal (Reference Highlight Feature) ---
  // Distinct sharp teardrop petal sitting over the wick
  const petalBaseY = by - 32 * scale;
  const petalH = 245 * scale;
  const petalTipY = petalBaseY - petalH;
  const petalTipX = bx + leanBelly * 0.65;
  const petalBellyY = petalBaseY - petalH * 0.40;
  const petalBW = 60 * scale;

  const petalPath = [
    `M ${bx} ${petalBaseY}`,
    // Left petal curve
    `C ${bx - petalBW * 0.8} ${petalBaseY - 10},`,
    `  ${bx - petalBW + leanBelly * 0.4} ${petalBellyY + 20},`,
    `  ${bx - petalBW + leanBelly * 0.4} ${petalBellyY}`,
    `C ${bx - petalBW + leanBelly * 0.4} ${petalBellyY - 35},`,
    `  ${petalTipX - 8} ${petalTipY + 45},`,
    `  ${petalTipX} ${petalTipY}`,
    // Right petal curve
    `C ${petalTipX + 8} ${petalTipY + 45},`,
    `  ${bx + petalBW + leanBelly * 0.4} ${petalBellyY - 35},`,
    `  ${bx + petalBW + leanBelly * 0.4} ${petalBellyY}`,
    `C ${bx + petalBW + leanBelly * 0.4} ${petalBellyY + 20},`,
    `  ${bx + petalBW * 0.8} ${petalBaseY - 10},`,
    `  ${bx} ${petalBaseY}`,
    `Z`
  ].join(' ');
  innerPetal.setAttribute('d', petalPath);
  innerPetal.setAttribute('opacity', (0.98 * bright).toString());

  // Inner petal subtle white-gold sheen
  const sheenPath = [
    `M ${bx} ${petalBaseY - 10}`,
    `C ${bx - petalBW * 0.45} ${petalBellyY + 15}, ${petalTipX - 4} ${petalTipY + 50}, ${petalTipX} ${petalTipY + 15}`,
    `C ${petalTipX + 4} ${petalTipY + 50}, ${bx + petalBW * 0.45} ${petalBellyY + 15}, ${bx} ${petalBaseY - 10}`,
    `Z`
  ].join(' ');
  innerPetalSheen.setAttribute('d', sheenPath);

  // --- Layer 6: White-Hot Core Flamelet (Right at wick tip) ---
  const coreBaseY = WICK_TIP_Y + 15 * scale;
  const coreH = 120 * scale;
  const coreTipY = coreBaseY - coreH;
  const coreTipX = bx + leanBelly * 0.35;
  const coreBW = 25 * scale;

  const corePath = [
    `M ${bx} ${coreBaseY}`,
    `C ${bx - coreBW * 0.9} ${coreBaseY - 5}, ${bx - coreBW + leanBelly * 0.2} ${coreBaseY - coreH * 0.4}, ${coreTipX} ${coreTipY}`,
    `C ${bx + coreBW + leanBelly * 0.2} ${coreBaseY - coreH * 0.4}, ${bx + coreBW * 0.9} ${coreBaseY - 5}, ${bx} ${coreBaseY}`,
    `Z`
  ].join(' ');
  hotCore.setAttribute('d', corePath);
  hotCore.setAttribute('opacity', (0.95 * bright).toString());

  // --- Layer 7: Wick Glowing Ember ---
  wickEmber.setAttribute('cx', CX);
  wickEmber.setAttribute('cy', WICK_TIP_Y);
  const emberRadius = Math.max(0, 11 * scale * (0.85 + Math.sin(t * 8) * 0.15));
  wickEmber.setAttribute('r', emberRadius.toString());
  wickEmber.setAttribute('opacity', (0.95 * bright).toString());
}

// =============================================
// RENDER: AMBIENT AURA & LIGHT SPILL
// =============================================
function renderAuraAndSpill(scale, bright) {
  // Ambient radial glow behind the flame in SVG
  const auraOpacity = Math.min(0.85, 0.65 * scale * bright);
  flameAmbientAura.setAttribute('opacity', auraOpacity.toString());

  // Diya rim illumination
  const rimOpacity = Math.min(0.9, 0.72 * scale * bright);
  rimIllumination.setAttribute('opacity', rimOpacity.toString());

  // Ground spill beneath diya
  lightSpill.style.opacity = (Math.min(1.0, 0.85 * scale * bright)).toString();
}

// =============================================
// RENDER: OIL REFLECTION & RIPPLES
// =============================================
function renderOilEffects(t, dt, scale, bright, lean) {
  // Oil reflection shifting slightly with lean
  const oilShiftX = lean * 1.8;
  oilReflection.setAttribute('cx', (CX + oilShiftX).toString());
  oilReflection.setAttribute('opacity', (Math.min(0.85, 0.68 * scale * bright)).toString());

  // Process Liquid Ripples
  for (let i = ripples.length - 1; i >= 0; i--) {
    const r = ripples[i];
    r.age += dt;
    if (r.age > r.maxAge) {
      if (r.el && r.el.parentNode) r.el.parentNode.removeChild(r.el);
      ripples.splice(i, 1);
    } else {
      const prog = r.age / r.maxAge;
      const rx = r.startRx + prog * 110;
      const ry = r.startRy + prog * 35;
      const alpha = (1 - prog) * 0.45 * bright;
      r.el.setAttribute('rx', rx.toString());
      r.el.setAttribute('ry', ry.toString());
      r.el.setAttribute('stroke', `rgba(255, 205, 75, ${alpha})`);
    }
  }
}

function spawnRipple(x, y) {
  if (ripples.length > 6) return;
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
  el.setAttribute('cx', (x || CX).toString());
  el.setAttribute('cy', (y || 465).toString());
  el.setAttribute('rx', '15');
  el.setAttribute('ry', '5');
  el.setAttribute('fill', 'none');
  el.setAttribute('stroke', 'rgba(255, 210, 80, 0.5)');
  el.setAttribute('stroke-width', '1.8');
  oilRipplesGroup.appendChild(el);

  ripples.push({
    el,
    age: 0,
    maxAge: 1.4,
    startRx: 15,
    startRy: 5,
  });
}

// =============================================
// PARTICLES: SACRED FLOATING EMBERS
// =============================================
function updateEmbers(dt, lean, scale) {
  emberTimer += dt;
  // Spawn ember occasionally
  if (emberTimer > 0.45 && embers.length < 12) {
    emberTimer = 0;
    spawnEmber(lean, scale);
  }

  for (let i = embers.length - 1; i >= 0; i--) {
    const p = embers[i];
    p.age += dt;
    if (p.age > p.lifetime) {
      if (p.el && p.el.parentNode) p.el.parentNode.removeChild(p.el);
      embers.splice(i, 1);
    } else {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx += (Math.random() - 0.5) * 40 * dt;
      const prog = p.age / p.lifetime;
      const alpha = (1 - prog) * 0.95;
      p.el.setAttribute('cx', p.x.toString());
      p.el.setAttribute('cy', p.y.toString());
      p.el.setAttribute('opacity', alpha.toString());
    }
  }
}

function spawnEmber(lean, scale) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  el.setAttribute('filter', 'url(#emberGlow)');
  el.setAttribute('fill', '#ffd840');
  const r = 2.0 + Math.random() * 2.2;
  el.setAttribute('r', r.toString());

  // Spawn near flame tip
  const spawnX = CX + (lean * 4.5) + (Math.random() - 0.5) * 35;
  const spawnY = FLAME_BASE_Y - FLAME_NATURAL_H * scale * 0.85 + (Math.random() - 0.5) * 40;

  emberGroup.appendChild(el);
  embers.push({
    el,
    x: spawnX,
    y: spawnY,
    vx: (lean * 1.8) + (Math.random() - 0.5) * 35,
    vy: -(90 + Math.random() * 110),
    age: 0,
    lifetime: 1.0 + Math.random() * 0.9,
  });
}

// =============================================
// PARTICLES: REALISTIC SMOKE (ON EXTINGUISH)
// =============================================
function updateSmoke(t, dt, lean) {
  const intensity = smokeIntens.current;
  if (intensity > 0.05) {
    smokeTimer += dt;
    if (smokeTimer > 0.08 && smokes.length < 24) {
      smokeTimer = 0;
      spawnSmokeParticle(lean, intensity);
    }
  }

  for (let i = smokes.length - 1; i >= 0; i--) {
    const s = smokes[i];
    s.age += dt;
    if (s.age > s.lifetime) {
      if (s.el && s.el.parentNode) s.el.parentNode.removeChild(s.el);
      smokes.splice(i, 1);
    } else {
      const prog = s.age / s.lifetime;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.radius += dt * 14;
      s.vx += Math.sin(t * 2 + s.seed) * 20 * dt;
      const alpha = (1 - prog) * 0.35 * s.intensity;
      s.el.setAttribute('cx', s.x.toString());
      s.el.setAttribute('cy', s.y.toString());
      s.el.setAttribute('r', s.radius.toString());
      s.el.setAttribute('opacity', alpha.toString());
    }
  }
}

function spawnSmokeParticle(lean, intensity) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  el.setAttribute('fill', 'rgba(75, 45, 25, 0.6)');
  el.setAttribute('filter', 'url(#oilBlur)');
  const r = 4.0 + Math.random() * 4.0;
  el.setAttribute('r', r.toString());

  smokeGroup.appendChild(el);
  smokes.push({
    el,
    x: CX + (Math.random() - 0.5) * 12,
    y: WICK_TIP_Y + (Math.random() - 0.5) * 8,
    vx: (lean * 1.2) + (Math.random() - 0.5) * 25,
    vy: -(55 + Math.random() * 70),
    radius: r,
    age: 0,
    lifetime: 2.2 + Math.random() * 1.2,
    intensity,
    seed: Math.random() * 10,
  });
}

// =============================================
// IGNITION / EXTINGUISH CONTROLS
// =============================================
function ignite() {
  if (state.lit || state.igniting) return;
  state.lit = true;
  state.igniting = true;
  state.ignitionProgress = 0;
  state.extinguishing = false;

  spawnRipple(CX, 465);
  fadeInstruction();
  updateButtonUI();
}

function extinguish() {
  if (!state.lit || state.extinguishing) return;
  state.extinguishing = true;
  state.extinguishProgress = 0;
  state.igniting = false;

  updateButtonUI();
}

function toggleFlame() {
  if (state.lit) {
    extinguish();
  } else {
    ignite();
  }
}

function updateButtonUI() {
  if (!btnLabel || !btnIcon) return;
  if (state.lit) {
    btnLabel.textContent = 'Extinguish';
    btnIcon.textContent = '✦';
  } else {
    btnLabel.textContent = 'Light Diya';
    btnIcon.textContent = '✧';
  }
}

// =============================================
// INSTRUCTION TOOLTIPS
// =============================================
let instructionTimeout = null;

function showInstruction(text, autoFadeMs) {
  if (!instruction || !instructionTxt) return;
  clearTimeout(instructionTimeout);
  instructionTxt.textContent = text;
  instruction.classList.remove('fade');

  if (autoFadeMs) {
    instructionTimeout = setTimeout(fadeInstruction, autoFadeMs);
  }
}

function fadeInstruction() {
  if (instruction) instruction.classList.add('fade');
}

// =============================================
// EVENT LISTENERS & INTERACTION
// =============================================
function setupEvents() {
  // Tap anywhere on scene or app to light or create ripples
  diyaScene.addEventListener('click', (e) => {
    tryAutoEnableSensors();
    if (!state.lit) {
      ignite();
    } else {
      spawnRipple(CX, 465);
      flameLeanX.impulse((Math.random() - 0.5) * 16);
    }
  });

  // Toggle button
  if (toggleFlameBtn) {
    toggleFlameBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      tryAutoEnableSensors();
      toggleFlame();
    });
  }

  // Keyboard Shortcuts: Space / L toggles
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'KeyL') {
      e.preventDefault();
      toggleFlame();
    }
  });

  // Desktop Mouse Movement (Air Draft)
  window.addEventListener('mousemove', (e) => {
    if (state.hasDeviceOrientation) return;
    const normX = (e.clientX - window.innerWidth * 0.5) / (window.innerWidth * 0.5);
    windX.setTarget(normX * 28);
  });

  // Swipe / Drag to lean or blow out flame
  window.addEventListener('pointerdown', (e) => {
    state.pointerDown = true;
    state.pointerStartX = e.clientX;
    state.pointerStartY = e.clientY;
    state.pointerPrevX = e.clientX;
    state.pointerPrevY = e.clientY;
    state.swipeHistory = [{ x: e.clientX, t: Date.now() }];
  });

  window.addEventListener('pointermove', (e) => {
    if (!state.pointerDown) return;
    const dx = e.clientX - state.pointerPrevX;
    state.pointerPrevX = e.clientX;
    state.pointerPrevY = e.clientY;

    state.swipeHistory.push({ x: e.clientX, t: Date.now() });
    if (state.swipeHistory.length > 8) state.swipeHistory.shift();

    if (state.lit) {
      flameLeanX.impulse(dx * 0.45);
      windX.impulse(dx * 0.6);
    }
  });

  window.addEventListener('pointerup', () => {
    if (!state.pointerDown) return;
    state.pointerDown = false;

    // Detect fast horizontal swipe across screen -> Blow out flame!
    if (state.swipeHistory.length >= 3 && state.lit) {
      const first = state.swipeHistory[0];
      const last = state.swipeHistory[state.swipeHistory.length - 1];
      const dt = (last.t - first.t) / 1000;
      const dist = Math.abs(last.x - first.x);
      const speed = dt > 0 ? dist / dt : 0;

      // Fast swipe (> 900 px/sec) blows out flame
      if (speed > 950 && dist > 120) {
        extinguish();
      }
    }
  });

  if (enableMotionBtn) {
    enableMotionBtn.addEventListener('click', requestMotionPermission);
  }
}

// =============================================
// DEVICE MOTION & GYROSCOPE (MOBILE & DESKTOP)
// =============================================
let lastGamma = 0;
let lastBeta = 45;
let lastAccel = { x: 0, y: 0, z: 0 };

function checkDeviceOrientation() {
  if (typeof DeviceOrientationEvent === 'undefined') return;

  // On modern Android and standard browsers, listeners work directly
  if (typeof DeviceOrientationEvent.requestPermission !== 'function') {
    bindOrientationListener();
    bindMotionListener();
  }
}

function requestMotionPermission() {
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission()
      .then(res => {
        if (res === 'granted') {
          state.motionPermissionGranted = true;
          bindOrientationListener();
          bindMotionListener();
        }
        if (motionOverlay) motionOverlay.classList.add('hidden');
      })
      .catch(() => {
        if (motionOverlay) motionOverlay.classList.add('hidden');
      });
  } else {
    bindOrientationListener();
    bindMotionListener();
    if (motionOverlay) motionOverlay.classList.add('hidden');
  }
}

// Seamlessly attempt sensor permission on first user tap
function tryAutoEnableSensors() {
  if (!state.hasDeviceOrientation) {
    requestMotionPermission();
  }
}

function bindOrientationListener() {
  state.hasDeviceOrientation = true;

  window.addEventListener('deviceorientation', (e) => {
    // 1. GAMMA: Left-Right phone tilt (-90 to +90 degrees)
    // In physics, buoyant flame rises AGAINST gravity.
    // When phone tilts right (gamma > 0), flame leans left (-gamma) to stay pointing up at sky!
    const gamma = (e.gamma !== null && e.gamma !== undefined) ? e.gamma : 0;
    
    // Normal holding range is -45 to +45 deg
    const clampedGamma = Math.max(-65, Math.min(65, gamma));
    // Flame leans counter to tilt (buoyant updraft)
    const leanDegrees = -clampedGamma * 0.75;
    windX.setTarget(leanDegrees);

    // Liquid oil sloshes WITH gravity (opposite to flame!)
    const oilSlosh = (clampedGamma / 45) * 22;
    oilReflection.setAttribute('cx', (CX + oilSlosh).toString());

    // 2. BETA: Front-Back phone tilt (-180 to +180 degrees)
    // Normal hand position is ~45-55 degrees
    const beta = (e.beta !== null && e.beta !== undefined) ? e.beta : 50;
    const deltaBeta = beta - 50; // deviation from standard handheld angle
    
    // Holding phone flat (looking down): flame spreads wider and slightly shorter
    // Holding phone upright: flame stretches taller
    const heightMod = 1.0 + Math.max(-0.25, Math.min(0.25, deltaBeta * 0.005));
    flameScale.setTarget(state.lit ? heightMod : 0);

    // Delta tracking for sudden tilt jerks
    const dGamma = Math.abs(gamma - lastGamma);
    lastGamma = gamma;
    lastBeta = beta;

    if (dGamma > 12 && state.lit && flameScale.current > 0.35) {
      flameLeanX.impulse((gamma > lastGamma ? -1 : 1) * 18);
      spawnEmber(flameLeanX.current, flameScale.current);
    }
  }, { passive: true });
}

function bindMotionListener() {
  if (typeof DeviceMotionEvent === 'undefined') return;

  window.addEventListener('devicemotion', (e) => {
    // Accelerometer reading (linear acceleration or acceleration including gravity)
    const accel = e.acceleration || e.accelerationIncludingGravity;
    if (!accel) return;

    const ax = accel.x || 0;
    const ay = accel.y || 0;
    const az = accel.z || 0;

    // Movement delta (jerk)
    const dx = ax - lastAccel.x;
    const dy = ay - lastAccel.y;
    const dz = az - lastAccel.z;
    const mag = Math.sqrt(dx * dx + dy * dy + dz * dz);

    lastAccel = { x: ax, y: ay, z: az };

    // Sudden phone move / gesture deflects flame with inertia
    if (Math.abs(ax) > 2.0 && state.lit) {
      // Flame lags behind movement direction
      flameLeanX.impulse(-ax * 2.2);
    }

    // Moderate shake: throws floating embers!
    if (mag > 14 && state.lit && flameScale.current > 0.3) {
      flameLeanX.impulse((Math.random() - 0.5) * 25);
      for (let i = 0; i < 2; i++) {
        spawnEmber(flameLeanX.current, flameScale.current);
      }
    }

    // Violent shake / rapid swing: blows out the flame with smoke!
    if (mag > 32 && state.lit) {
      extinguish();
    }
  }, { passive: true });
}

// Desktop Tilt Testing via Arrow Keys (Left / Right tilts flame)
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') {
    windX.impulse(-14);
  } else if (e.key === 'ArrowRight') {
    windX.impulse(14);
  } else if (e.key === 'ArrowUp') {
    flameScale.impulse(0.15);
  } else if (e.key === 'ArrowDown') {
    flameScale.impulse(-0.15);
  }
});

// Start
window.addEventListener('DOMContentLoaded', init);

})();
