// Star Shepherd — bootstrap and game loop. Wires input, world, render
// and audio together and owns the screen state machine.

import { CONFIG } from './config.js';
import { createInput } from './input.js';
import { createWorld } from './world.js';
import { drawWorld, drawTitle, drawGameOver } from './render.js';
import { createAudio } from './audio.js';
import { isShotMode, shotName, shotSeed, renderShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = CONFIG.width;
canvas.height = CONFIG.height;

const audio = createAudio();
const input = createInput(canvas);

function loadBest() {
  try {
    const raw = window.localStorage.getItem(CONFIG.storageKey);
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch (err) {
    return 0;
  }
}

function saveBest(score) {
  try {
    window.localStorage.setItem(CONFIG.storageKey, String(score));
  } catch (err) {
    // Storage unavailable (private mode etc.) — best score just won't persist.
  }
}

// ---- Screenshot mode: draw one fixed scene and stop. ----
if (isShotMode()) {
  renderShot(ctx, shotName(), shotSeed());
} else {
  startGame();
}

function startGame() {
  const world = createWorld(Math.random);
  world.best = loadBest();

  // Title screen gets a few drifting star-lings for decoration.
  function seedTitleStarlings() {
    world.starlings = [];
    const spots = [[300, 180], [980, 220], [210, 520], [1080, 520], [640, 120]];
    for (const p of spots) {
      world.starlings.push({
        x: p[0], y: p[1], vx: 0, vy: 0,
        angle: Math.random() * Math.PI * 2,
        wanderTimer: 1, pulse: Math.random() * 6, radius: 11, home: false,
      });
    }
  }
  seedTitleStarlings();

  function startPlaying() {
    audio.unlock();
    audio.click();
    world.reset(world.best);
    world.state = 'playing';
  }

  function togglePause() {
    if (world.state === 'playing') {
      world.state = 'paused';
    } else if (world.state === 'paused') {
      world.state = 'playing';
    }
  }

  // Switching tabs mid-game pauses automatically — the flock waits.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && world.state === 'playing') {
      world.state = 'paused';
    }
  });

  function playEvents() {
    for (const ev of world.events) {
      if (ev === 'pen') audio.chime(world.combo);
      if (ev === 'bark') audio.bark();
      if (ev === 'scared') audio.yelp();
      if (ev === 'growl') audio.growl();
      if (ev === 'lost') audio.poof();
      if (ev === 'waveclear') audio.fanfare();
      if (ev === 'gameover') {
        audio.gameOver();
        if (world.score > world.best) {
          world.best = world.score;
          saveBest(world.best);
        }
      }
    }
  }

  let last = performance.now();

  function frame(now) {
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
    last = now;

    // Global keys.
    if (input.mutePressed) audio.toggleMute();
    if (input.pausePressed) togglePause();

    if (world.state === 'title') {
      world.time += dt;
      for (const s of world.starlings) {
        s.pulse += dt * 3;
        s.y += Math.sin(world.time + s.pulse) * 6 * dt;
      }
      if (input.enterPressed || input.barkPressed) startPlaying();
    } else if (world.state === 'gameover') {
      world.time += dt;
      if (input.enterPressed || input.barkPressed) startPlaying();
    } else if (world.state === 'paused') {
      if (input.enterPressed) togglePause();
    } else {
      if (input.barkPressed) world.bark();
      world.update(dt, input);
      playEvents();
      if (world.state === 'gameover' && world.score > world.best) {
        world.best = world.score;
        saveBest(world.best);
      }
    }

    // Draw.
    ctx.clearRect(0, 0, CONFIG.width, CONFIG.height);
    if (world.state === 'title') {
      drawTitle(ctx, world);
    } else if (world.state === 'gameover') {
      drawWorld(ctx, world);
      drawGameOver(ctx, world);
    } else {
      drawWorld(ctx, world);
    }

    input.consumeEdges();
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
