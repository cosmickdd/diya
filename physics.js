// =============================================
// PHYSICS.JS — Spring-Damper Physics Engine
// =============================================

'use strict';

// ---- Spring ----
class Spring {
  constructor(stiffness, damping, initial = 0) {
    this.stiffness = stiffness;
    this.damping   = damping;
    this.current   = initial;
    this.target    = initial;
    this.velocity  = 0;
  }

  update(dt) {
    const force = (this.target - this.current) * this.stiffness;
    this.velocity += force * dt;
    this.velocity *= Math.pow(this.damping, dt * 60);
    this.current  += this.velocity * dt;
    return this.current;
  }

  setTarget(t) { this.target = t; }
  impulse(v)   { this.velocity += v; }
  snap(v)      { this.current = v; this.velocity = 0; this.target = v; }
}

// ---- Noise ----
// Lightweight smooth noise using sine harmonics
class SmoothNoise {
  constructor(seed = 0) {
    this.seed = seed;
    this.phases = Array.from({length: 6}, (_, i) => (seed * 7.3 + i * 1.618) % (Math.PI * 2));
  }
  get(t) {
    const p = this.phases;
    return (
      Math.sin(t * 1.0 + p[0]) * 0.40 +
      Math.sin(t * 2.3 + p[1]) * 0.25 +
      Math.sin(t * 4.7 + p[2]) * 0.15 +
      Math.sin(t * 7.1 + p[3]) * 0.10 +
      Math.sin(t * 13.3 + p[4]) * 0.06 +
      Math.sin(t * 21.7 + p[5]) * 0.04
    ); // Returns roughly -1..1
  }
}

// ---- Fluid Particle (oil wave) ----
class WavePoint {
  constructor(x, restY) {
    this.x = x;
    this.y = restY;
    this.restY = restY;
    this.vy = 0;
    this.stiffness = 12;
    this.damping = 0.94;
  }
  update(dt) {
    const force = (this.restY - this.y) * this.stiffness;
    this.vy += force * dt;
    this.vy *= Math.pow(this.damping, dt * 60);
    this.y  += this.vy * dt;
  }
  splash(force) { this.vy += force; }
}

// ---- Smoke Particle ----
class SmokeParticle {
  constructor(x, y, cfg) {
    this.x    = x;
    this.y    = y;
    this.vx   = (Math.random() - 0.5) * cfg.drift * 60;
    this.vy   = -(cfg.riseSpeed * 60 * (0.7 + Math.random() * 0.6));
    this.life = 1.0;
    this.decay = 1 / (cfg.lifetime * 0.001 * 60);
    this.r    = 2 + Math.random() * 5;
    this.maxR = this.r + Math.random() * 12;
    this.ox   = x;
    this.noiseOffset = Math.random() * 100;
    this.dead = false;
  }
  update(dt, t, windX) {
    this.vx += (Math.sin(t * 1.5 + this.noiseOffset) * 0.8 + windX * 0.3) * dt * 60 * dt;
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.vy *= Math.pow(0.97, dt * 60);
    this.vx *= Math.pow(0.96, dt * 60);
    this.life -= this.decay;
    this.r = Math.min(this.r + dt * 8, this.maxR);
    if (this.life <= 0) this.dead = true;
  }
}

// ---- Ember Particle ----
class EmberParticle {
  constructor(x, y, cfg, leanAngle) {
    const spread = (Math.random() - 0.5) * 20;
    const angle = -Math.PI / 2 + (leanAngle * Math.PI / 180) + spread * 0.03;
    const speed = 20 + Math.random() * 50;
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * speed + (Math.random() - 0.5) * 15;
    this.vy = Math.sin(angle) * speed - 10 - Math.random() * 20;
    this.ax = 0;
    this.ay = 60; // gravity
    this.life = 1.0;
    this.decay = 1 / (cfg.lifetime * 0.001 * 60);
    this.r = 0.8 + Math.random() * 1.8;
    this.dead = false;
    this.hue = 25 + Math.random() * 25; // orange-yellow
    this.sat = 90 + Math.random() * 10;
  }
  update(dt) {
    this.vx += this.ax * dt;
    this.vy += this.ay * dt;
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.vx *= Math.pow(0.92, dt * 60);
    this.life -= this.decay;
    if (this.life <= 0) this.dead = true;
  }
}

// Export to global
window.Spring = Spring;
window.SmoothNoise = SmoothNoise;
window.WavePoint = WavePoint;
window.SmokeParticle = SmokeParticle;
window.EmberParticle = EmberParticle;
