// Star Shepherd — the world: ship, star-lings, wolves, pen, waves,
// particles, floating text, score and combo. Pure game logic, no drawing.

import { CONFIG } from './config.js';
import { rngRange, shuffle } from './random.js';

export function createWorld(rng) {
  const W = CONFIG.width;
  const H = CONFIG.height;

  const world = {
    state: 'title', // title | playing | paused | waveclear | gameover
    score: 0,
    best: 0,
    wave: 1,
    pennedThisWave: 0,
    quota: 4,
    lost: 0,
    combo: 1,
    comboTimer: 0,
    comboChain: 0,
    barkCooldown: 0,
    barkFlash: 0,
    shake: 0,
    banner: '',
    bannerTimer: 0,
    time: 0,
    wavesCleared: 0,
    totalPenned: 0,
    ship: null,
    starlings: [],
    wolves: [],
    particles: [],
    floats: [],
    stars: [],
    wolfSpawnTimer: 0,
    wolvesToSpawn: 0,
    events: [], // one-frame event flags read by main.js for sounds
  };

  // Background starfield, fixed at world creation (seeded in shot mode).
  for (let i = 0; i < 170; i++) {
    world.stars.push({
      x: rng() * W,
      y: rng() * H,
      r: 0.5 + rng() * 1.7,
      tw: rng() * Math.PI * 2,
      speed: 0.4 + rng() * 1.6,
    });
  }

  function waveDef(n) {
    const list = CONFIG.waves;
    if (n <= list.length) return list[n - 1];
    const last = list[list.length - 1];
    const extra = n - list.length;
    return {
      starlings: Math.min(18, last.starlings + extra),
      quota: Math.min(12, last.quota + extra),
      wolves: Math.min(8, last.wolves + extra),
    };
  }

  function spawnStarling() {
    // Spawn away from the pen and away from the ship.
    let x = 0;
    let y = 0;
    for (let tries = 0; tries < 12; tries++) {
      x = rngRange(rng, 60, W - 60);
      y = rngRange(rng, 80, H - 60);
      const dPen = Math.hypot(x - CONFIG.pen.x, y - CONFIG.pen.y);
      const dShip = world.ship ? Math.hypot(x - world.ship.x, y - world.ship.y) : 999;
      if (dPen > 170 && dShip > 120) break;
    }
    world.starlings.push({
      x, y,
      vx: 0, vy: 0,
      angle: rng() * Math.PI * 2,
      wanderTimer: rngRange(rng, 0.5, 1.5),
      pulse: rng() * Math.PI * 2,
      radius: CONFIG.starling.radius,
      home: false,
    });
  }

  function spawnWolf() {
    // Wolves enter from a random screen edge. The side order is shuffled
    // per wave so entries do not cluster on one edge.
    const sides = shuffle(rng, [0, 1, 2, 3]);
    const side = sides[world.wolves.length % sides.length];
    let x = 0;
    let y = 0;
    if (side === 0) { x = -30; y = rngRange(rng, 40, H - 40); }
    if (side === 1) { x = W + 30; y = rngRange(rng, 40, H - 40); }
    if (side === 2) { x = rngRange(rng, 40, W - 40); y = -30; }
    if (side === 3) { x = rngRange(rng, 40, W - 40); y = H + 30; }
    const speed = Math.min(
      CONFIG.wolf.maxSpeed,
      CONFIG.wolf.baseSpeed + (world.wave - 1) * CONFIG.wolf.speedPerWave
    );
    world.wolves.push({
      x, y, vx: 0, vy: 0,
      speed: speed * rngRange(rng, 0.9, 1.15),
      radius: CONFIG.wolf.radius,
      fleeTimer: 0,
      growlTimer: rngRange(rng, 1, 4),
      phase: rng() * Math.PI * 2,
    });
  }

  function burst(x, y, color, count, speed) {
    for (let i = 0; i < count; i++) {
      const a = rng() * Math.PI * 2;
      const s = rngRange(rng, 20, speed);
      world.particles.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: rngRange(rng, 0.4, 0.9),
        maxLife: 0.9,
        radius: rngRange(rng, 1.5, 4),
        color,
      });
    }
  }

  function addFloat(x, y, text, color) {
    world.floats.push({ x, y, text, color: color || '#ffd76a', life: 1.1, maxLife: 1.1 });
  }

  function startWave(n) {
    const def = waveDef(n);
    world.wave = n;
    world.quota = def.quota;
    world.pennedThisWave = 0;
    world.starlings = [];
    world.wolves = [];
    world.wolvesToSpawn = def.wolves;
    world.wolfSpawnTimer = 1.2;
    for (let i = 0; i < def.starlings; i++) spawnStarling();
  }

  world.reset = function reset(best) {
    world.score = 0;
    world.best = best || 0;
    world.wave = 1;
    world.lost = 0;
    world.combo = 1;
    world.comboTimer = 0;
    world.comboChain = 0;
    world.barkCooldown = 0;
    world.barkFlash = 0;
    world.shake = 0;
    world.wavesCleared = 0;
    world.totalPenned = 0;
    world.particles = [];
    world.floats = [];
    world.ship = {
      x: W / 2, y: H / 2 + 80,
      vx: 0, vy: 0,
      angle: -Math.PI / 2,
      radius: CONFIG.ship.radius,
    };
    startWave(1);
    world.state = 'playing';
  };

  world.bark = function bark() {
    if (world.state !== 'playing' || world.barkCooldown > 0) return false;
    world.barkCooldown = CONFIG.bark.cooldown;
    world.barkFlash = 0.35;
    world.events.push('bark');
    // Visible ring of light bursting outward from the ship.
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      world.particles.push({
        x: world.ship.x + Math.cos(a) * 24,
        y: world.ship.y + Math.sin(a) * 24,
        vx: Math.cos(a) * 320,
        vy: Math.sin(a) * 320,
        life: 0.45,
        maxLife: 0.45,
        radius: 3.5,
        color: '#ffe9a8',
      });
    }
    let scared = 0;
    for (const wolf of world.wolves) {
      const d = Math.hypot(wolf.x - world.ship.x, wolf.y - world.ship.y);
      if (d < CONFIG.bark.radius + wolf.radius) {
        wolf.fleeTimer = CONFIG.bark.fleeTime;
        scared++;
      }
    }
    if (scared > 0) world.events.push('scared');
    return true;
  };

  world.update = function update(dt, input) {
    world.events.length = 0;
    world.time += dt;
    if (world.shake > 0) world.shake = Math.max(0, world.shake - dt * 2.2);
    if (world.barkFlash > 0) world.barkFlash -= dt;
    if (world.barkCooldown > 0) world.barkCooldown -= dt;
    if (world.bannerTimer > 0) {
      world.bannerTimer -= dt;
      if (world.bannerTimer <= 0 && world.state === 'waveclear') {
        startWave(world.wave + 1);
        world.state = 'playing';
      }
    }
    if (world.comboTimer > 0) {
      world.comboTimer -= dt;
      if (world.comboTimer <= 0) {
        world.combo = 1;
        world.comboChain = 0;
      }
    }

    // Particles and floating text always animate.
    for (let i = world.particles.length - 1; i >= 0; i--) {
      const p = world.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life -= dt;
      if (p.life <= 0) world.particles.splice(i, 1);
    }
    for (let i = world.floats.length - 1; i >= 0; i--) {
      const f = world.floats[i];
      f.y -= 42 * dt;
      f.life -= dt;
      if (f.life <= 0) world.floats.splice(i, 1);
    }
    for (const s of world.stars) {
      s.tw += dt * s.speed;
    }

    if (world.state !== 'playing') return;

    const ship = world.ship;
    // --- Ship movement: keys accelerate; pointer steers toward it. ---
    const ax = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const ay = (input.down ? 1 : 0) - (input.up ? 1 : 0);
    if (ax !== 0 || ay !== 0) {
      const len = Math.hypot(ax, ay) || 1;
      ship.vx += (ax / len) * CONFIG.ship.accel * dt;
      ship.vy += (ay / len) * CONFIG.ship.accel * dt;
    } else if (input.pointerActive) {
      const dx = input.pointerX - ship.x;
      const dy = input.pointerY - ship.y;
      const d = Math.hypot(dx, dy);
      if (d > 8) {
        const pull = Math.min(1, d / 140);
        ship.vx += (dx / d) * CONFIG.ship.accel * 0.85 * pull * dt;
        ship.vy += (dy / d) * CONFIG.ship.accel * 0.85 * pull * dt;
      }
    }
    // Touch drag moves the ship toward the finger directly.
    if (input.touchMode && input.pointerDown) {
      const dx = input.pointerX - ship.x;
      const dy = input.pointerY - ship.y;
      const d = Math.hypot(dx, dy);
      if (d > 4) {
        ship.vx += (dx / d) * CONFIG.ship.accel * 1.1 * dt;
        ship.vy += (dy / d) * CONFIG.ship.accel * 1.1 * dt;
      }
    }
    ship.vx *= Math.pow(CONFIG.ship.friction, dt * 60);
    ship.vy *= Math.pow(CONFIG.ship.friction, dt * 60);
    const sp = Math.hypot(ship.vx, ship.vy);
    if (sp > CONFIG.ship.maxSpeed) {
      ship.vx = (ship.vx / sp) * CONFIG.ship.maxSpeed;
      ship.vy = (ship.vy / sp) * CONFIG.ship.maxSpeed;
    }
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    ship.x = Math.max(20, Math.min(W - 20, ship.x));
    ship.y = Math.max(20, Math.min(H - 20, ship.y));
    if (sp > 20) ship.angle = Math.atan2(ship.vy, ship.vx);

    // --- Star-lings: wander, drift to the lantern, get penned. ---
    const lanternR = CONFIG.ship.lanternRadius;
    for (let i = world.starlings.length - 1; i >= 0; i--) {
      const s = world.starlings[i];
      s.pulse += dt * 3;
      s.wanderTimer -= dt;
      if (s.wanderTimer <= 0) {
        s.wanderTimer = rngRange(rng, 0.8, CONFIG.starling.wanderChange + 0.8);
        s.angle = rng() * Math.PI * 2;
      }
      s.vx += Math.cos(s.angle) * CONFIG.starling.wanderSpeed * dt;
      s.vy += Math.sin(s.angle) * CONFIG.starling.wanderSpeed * dt;
      const dx = ship.x - s.x;
      const dy = ship.y - s.y;
      const d = Math.hypot(dx, dy);
      if (d < lanternR && d > 1) {
        const strength = (1 - d / lanternR) * CONFIG.ship.lanternPull;
        s.vx += (dx / d) * strength * dt;
        s.vy += (dy / d) * strength * dt;
      }
      const ss = Math.hypot(s.vx, s.vy);
      if (ss > CONFIG.starling.maxSpeed) {
        s.vx = (s.vx / ss) * CONFIG.starling.maxSpeed;
        s.vy = (s.vy / ss) * CONFIG.starling.maxSpeed;
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.x = Math.max(14, Math.min(W - 14, s.x));
      s.y = Math.max(14, Math.min(H - 14, s.y));

      // Reached the pen?
      const dp = Math.hypot(s.x - CONFIG.pen.x, s.y - CONFIG.pen.y);
      if (dp < CONFIG.pen.innerRadius) {
        world.starlings.splice(i, 1);
        world.pennedThisWave++;
        world.totalPenned++;
        world.comboChain++;
        world.comboTimer = CONFIG.rules.comboWindow;
        world.combo = Math.min(
          CONFIG.rules.comboMax,
          1 + (world.comboChain - 1) * CONFIG.rules.comboStep
        );
        const gained = Math.round(CONFIG.rules.pointsPerPen * world.combo);
        world.score += gained;
        burst(s.x, s.y, '#ffd76a', 22, 190);
        burst(s.x, s.y, '#7fe7ff', 10, 130);
        addFloat(s.x, s.y - 18, '+' + gained, '#ffd76a');
        world.events.push('pen');
        if (world.pennedThisWave >= world.quota) {
          const bonus = CONFIG.rules.waveBonusBase + world.wave * CONFIG.rules.waveBonusPerWave;
          world.score += bonus;
          world.wavesCleared++;
          world.banner = 'Wave ' + world.wave + ' Clear!  +' + bonus;
          world.bannerTimer = 2.4;
          world.state = 'waveclear';
          world.events.push('waveclear');
          break; // stop herding this frame: the wave is over
        }
      }
    }

    // The wave just ended: wolves freeze for the banner, they do not
    // get a free catch during the celebration.
    if (world.state !== 'playing') return;

    // --- Wolves: spawn over time, chase the nearest star-ling, flee barks. ---
    if (world.wolvesToSpawn > 0) {
      world.wolfSpawnTimer -= dt;
      if (world.wolfSpawnTimer <= 0 && world.wolves.length < CONFIG.wolf.maxActive) {
        spawnWolf();
        world.wolvesToSpawn--;
        world.wolfSpawnTimer = CONFIG.wolf.spawnDelay;
      }
    }
    for (let i = world.wolves.length - 1; i >= 0; i--) {
      const w = world.wolves[i];
      w.phase += dt * 4;
      w.growlTimer -= dt;
      if (w.growlTimer <= 0) {
        w.growlTimer = rngRange(rng, 4, 9);
        world.events.push('growl');
      }
      if (w.fleeTimer > 0) {
        w.fleeTimer -= dt;
        const dx = w.x - ship.x;
        const dy = w.y - ship.y;
        const d = Math.hypot(dx, dy) || 1;
        w.vx = (dx / d) * CONFIG.bark.fleeSpeed;
        w.vy = (dy / d) * CONFIG.bark.fleeSpeed;
        if (w.fleeTimer <= 0 || w.x < -60 || w.x > W + 60 || w.y < -60 || w.y > H + 60) {
          world.wolves.splice(i, 1);
          continue;
        }
      } else {
        // Chase the nearest star-ling.
        let target = null;
        let bestD = Infinity;
        for (const s of world.starlings) {
          const d = Math.hypot(s.x - w.x, s.y - w.y);
          if (d < bestD) { bestD = d; target = s; }
        }
        if (target) {
          const dx = target.x - w.x;
          const dy = target.y - w.y;
          const d = Math.hypot(dx, dy) || 1;
          w.vx = (dx / d) * w.speed;
          w.vy = (dy / d) * w.speed;
        } else {
          // No star-lings left on the field: drift toward the ship's area.
          const dx = ship.x - w.x;
          const dy = ship.y - w.y;
          const d = Math.hypot(dx, dy) || 1;
          w.vx = (dx / d) * w.speed * 0.4;
          w.vy = (dy / d) * w.speed * 0.4;
        }
      }
      w.x += w.vx * dt;
      w.y += w.vy * dt;

      // Wolf catches a star-ling.
      for (let j = world.starlings.length - 1; j >= 0; j--) {
        const s = world.starlings[j];
        const d = Math.hypot(s.x - w.x, s.y - w.y);
        if (d < w.radius + s.radius - 2) {
          world.starlings.splice(j, 1);
          world.lost++;
          world.shake = 0.55;
          world.combo = 1;
          world.comboChain = 0;
          world.comboTimer = 0;
          burst(s.x, s.y, '#8a7fd6', 18, 160);
          burst(s.x, s.y, '#5a4a8a', 10, 110);
          addFloat(s.x, s.y - 18, 'lost!', '#ff8ba0');
          world.events.push('lost');
          if (world.lost >= CONFIG.rules.maxLost) {
            world.state = 'gameover';
            world.events.push('gameover');
          }
          break;
        }
      }
    }

    // If the field is empty but the wave is not cleared, top it up.
    if (world.state === 'playing' && world.starlings.length === 0
        && world.pennedThisWave < world.quota) {
      spawnStarling();
      spawnStarling();
    }
  };

  return world;
}
