// Star Shepherd — deterministic screenshot scenes for ?shot= mode.
// Same seed + same scene name always renders the same picture.
// No wall clock, no unseeded randomness: every position comes from the
// seeded generator, and the world clock is fixed per scene.

import { CONFIG } from './config.js';
import { makeRng, seedFromString } from './random.js';
import { createWorld } from './world.js';
import { drawWorld, drawTitle, drawGameOver } from './render.js';

export function isShotMode() {
  const params = new URLSearchParams(window.location.search);
  return params.has('shot');
}

export function shotName() {
  const params = new URLSearchParams(window.location.search);
  return params.get('shot') || 'play';
}

export function shotSeed() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('seed') || 'star-shepherd';
  const n = Number(raw);
  return Number.isFinite(n) && raw.trim() !== '' ? Math.floor(n) : seedFromString(raw);
}

// Build a world posed for one screenshot scene, draw it once, and
// signal readiness. Returns the world (handy for debugging).
export function renderShot(ctx, name, seed) {
  const rng = makeRng(seed);
  const world = createWorld(rng);
  world.best = 1250;

  if (name === 'start') {
    // time 0.39 freezes the "Press Enter" blink at full opacity:
    // blink = 0.55 + 0.45*sin(time*4) = 1.0 (at 1.25 it was ~0.12, invisible).
    world.time = 0.39;
    world.state = 'title';
    // Decorative star-lings drifting near the title panel.
    world.starlings = [
      { x: 300, y: 180, vx: 0, vy: 0, angle: 0, wanderTimer: 1, pulse: 0.4, radius: 11, home: false },
      { x: 980, y: 220, vx: 0, vy: 0, angle: 0, wanderTimer: 1, pulse: 2.1, radius: 11, home: false },
      { x: 210, y: 520, vx: 0, vy: 0, angle: 0, wanderTimer: 1, pulse: 1.2, radius: 11, home: false },
      { x: 1080, y: 520, vx: 0, vy: 0, angle: 0, wanderTimer: 1, pulse: 2.8, radius: 11, home: false },
    ];
    drawTitle(ctx, world);
  } else if (name === 'end') {
    // Same view as a live game-over: the world behind the dimmed panel.
    // time 0.39 freezes the "play again" blink at full opacity.
    world.time = 0.39;
    world.reset(1450);
    world.state = 'gameover';
    world.score = 1450;
    world.best = 1450;
    world.totalPenned = 14;
    world.wavesCleared = 2;
    world.lost = 5;
    drawWorld(ctx, world);
    drawGameOver(ctx, world);
  } else {
    // play: a busy mid-game moment.
    world.time = 6.5;
    world.reset(1250);
    world.score = 650;
    world.wave = 2;
    world.pennedThisWave = 3;
    world.combo = 2;
    world.comboTimer = 2.0;
    world.comboChain = 3;
    world.barkCooldown = 0.6; // show the HUD bark bar mid-recharge
    // Pose the ship mid-field with its lantern glowing.
    world.ship.x = 560;
    world.ship.y = 380;
    world.ship.vx = 120;
    world.ship.vy = -40;
    world.ship.angle = -0.3;
    // Hand-place star-lings: some near the ship, some near the pen.
    const spots = [
      [470, 330], [640, 420], [700, 300], [880, 240],
      [980, 180], [420, 520], [760, 520], [1020, 320],
    ];
    world.starlings = spots.map((p, i) => ({
      x: p[0], y: p[1], vx: 0, vy: 0,
      angle: i, wanderTimer: 1, pulse: i * 0.9, radius: 11, home: false,
    }));
    // Wolves closing in from the edges.
    world.wolves = [
      { x: 300, y: 260, vx: 60, vy: 30, speed: 95, radius: 19, fleeTimer: 0, growlTimer: 3, phase: 0.5 },
      { x: 900, y: 480, vx: -50, vy: -30, speed: 95, radius: 19, fleeTimer: 0, growlTimer: 2, phase: 2.0 },
      { x: 1150, y: 420, vx: -70, vy: -10, speed: 100, radius: 19, fleeTimer: 1.2, growlTimer: 4, phase: 1.1 },
    ];
    // A little sparkle near the pen, as if one just went home.
    world.particles = [];
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      world.particles.push({
        x: CONFIG.pen.x + Math.cos(a) * 30,
        y: CONFIG.pen.y + Math.sin(a) * 30,
        vx: Math.cos(a) * 40, vy: Math.sin(a) * 40,
        life: 0.6, maxLife: 0.9, radius: 3, color: '#ffd76a',
      });
    }
    world.floats = [
      { x: CONFIG.pen.x, y: CONFIG.pen.y - 60, text: '+200', color: '#ffd76a', life: 0.8, maxLife: 1.1 },
    ];
    world.banner = '';
    world.bannerTimer = 0;
    drawWorld(ctx, world);
  }

  window.__shotReady = true;
  return world;
}
