// =============================================
// CONFIG.JS — Diya Geometry & Physics Config
// =============================================

// All coordinates are NORMALIZED (0..1) relative to the diya PNG bounding box.
// The PNG is 1280x1017 (approx). The diya visual occupies roughly:
//   horizontal: 5%..95% of PNG width
//   vertical:   8%..92% of PNG height
//
// Key visual landmarks in the PNG:
//   Outer rim top:    ~y=0.08
//   Outer rim center: ~x=0.50
//   Bowl inner top:   ~y=0.22  (where oil surface would be)
//   Bowl inner left:  ~x=0.14
//   Bowl inner right: ~x=0.86
//   Wick base center: ~x=0.50, y=0.455
//   Wick tip:         ~x=0.50, y=0.39
//   Front spout tip:  ~x=0.50, y=0.60  (the pointed front)

window.DIYA_CONFIG = {

  // ---- GEOMETRY (normalized 0..1 within the scene element) ----
  geometry: {
    // Oil cavity ellipse (where liquid oil sits)
    oilEllipse: {
      cx: 0.50,   // center x
      cy: 0.415,  // center y — slightly above true center
      rx: 0.335,  // horizontal radius
      ry: 0.105,  // vertical radius (shallow bowl perspective)
    },

    // Wick
    wick: {
      tipX:  0.500,   // normalized x of wick tip (flame ignites here)
      tipY:  0.385,   // normalized y of wick tip
      baseX: 0.500,
      baseY: 0.450,
      width: 0.012,
      length: 0.068,
    },

    // Flame spawn point
    flame: {
      baseX: 0.500,
      baseY: 0.378,   // just above wick tip
    },

    // Inner bowl radius for oil clipping
    bowlLeft:   0.155,
    bowlRight:  0.845,
    bowlTop:    0.280,
    bowlBottom: 0.490,
  },

  // ---- PHYSICS ----
  physics: {
    flame: {
      stiffness:  18.0,
      damping:    0.72,
      windScale:  0.55,    // how much wind affects lean
      mouseScale: 0.40,
      tiltScale:  1.8,     // device tilt scale
      maxLean:    38,      // degrees max lean
      flickerSpeed: 1.0,
      flickerAmp:   0.08,
    },
    oil: {
      stiffness:  3.0,
      damping:    0.88,
      tiltScale:  0.45,
      maxTilt:    14,      // degrees max oil tilt
      waveSpeed:  0.4,
      waveDamp:   0.97,
    },
    glow: {
      stiffness: 8.0,
      damping:   0.80,
    },
    smoke: {
      riseSpeed:  0.6,
      drift:      0.15,
      lifetime:   2800,   // ms
      count:      6,
    },
    ember: {
      count:      8,
      lifetime:   1200,
      riseSpeed:  0.8,
    },
    wind: {
      // desktop mouse
      mouseDecay: 0.90,   // per frame decay
      touchDecay: 0.88,
      swipeExtinguishThreshold: 3.2,  // normalized px/frame
    },
  },

  // ---- VISUAL ----
  visual: {
    // Oil colors
    oil: {
      baseColor:       'rgba(140, 70, 15, 0.55)',
      highlight1Color: 'rgba(220, 150, 40, 0.25)',
      highlight2Color: 'rgba(255, 200, 80, 0.12)',
      reflectionColor: 'rgba(255, 160, 40, 0.22)',
    },
    // Flame colors
    flame: {
      outer:  { r:210, g:75,  b:10,  a:0.50 },
      middle: { r:235, g:135, b:25,  a:0.70 },
      inner:  { r:250, g:210, b:50,  a:0.88 },
      tip:    { r:255, g:248, b:195, a:0.95 },
      core:   { r:255, g:255, b:240, a:1.00 },
    },
    // Glow
    glow: {
      color1: 'rgba(220, 110, 20, 0.55)',
      color2: 'rgba(180, 70, 10, 0.25)',
      color3: 'rgba(140, 50, 5, 0.08)',
      radius: 1.8,   // multiplier of flame height
    },
  },

  // ---- FLAGS ----
  flags: {
    enableHeatDistortion: true,
    enableSmoke: true,
    enableEmbers: true,
    enableOilRipples: true,
    reduceParticlesOnSlowDevice: true,
    performanceFPSThreshold: 40,
  },
};
