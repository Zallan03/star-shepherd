// Star Shepherd — all drawing: background, pen, entities, particles,
// HUD and every screen. Reads the world, never changes it.

import { CONFIG } from './config.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawStar(ctx, x, y, r, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawBackground(ctx, world) {
  const W = CONFIG.width;
  const H = CONFIG.height;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, CONFIG.colors.bgTop);
  g.addColorStop(1, CONFIG.colors.bgBottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Soft nebula blobs.
  const blobs = [
    { x: 220, y: 150, r: 260, c: CONFIG.colors.nebulaA },
    { x: 1050, y: 560, r: 300, c: CONFIG.colors.nebulaB },
    { x: 620, y: 640, r: 220, c: CONFIG.colors.nebulaC },
    { x: 900, y: 90, r: 180, c: CONFIG.colors.nebulaB },
  ];
  for (const b of blobs) {
    const rg = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
    rg.addColorStop(0, b.c + '55');
    rg.addColorStop(1, b.c + '00');
    ctx.fillStyle = rg;
    ctx.fillRect(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
  }

  // Twinkling stars.
  for (const s of world.stars) {
    const a = 0.35 + 0.65 * Math.abs(Math.sin(s.tw));
    drawStar(ctx, s.x, s.y, s.r, '#ffffff', a);
  }

  // Soft vignette so the playfield edges feel deep.
  const vg = ctx.createRadialGradient(
    W / 2, H / 2, H * 0.42, W / 2, H / 2, H * 0.95
  );
  vg.addColorStop(0, 'rgba(4,2,16,0)');
  vg.addColorStop(1, 'rgba(4,2,16,0.42)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
}

function drawPen(ctx, world) {
  const pen = CONFIG.pen;
  const pulse = 1 + 0.06 * Math.sin(world.time * 2.4);
  const R = pen.radius * pulse;

  // Outer glow.
  const rg = ctx.createRadialGradient(pen.x, pen.y, 10, pen.x, pen.y, R + 46);
  rg.addColorStop(0, 'rgba(63,201,255,0.28)');
  rg.addColorStop(1, 'rgba(63,201,255,0)');
  ctx.fillStyle = rg;
  ctx.beginPath();
  ctx.arc(pen.x, pen.y, R + 46, 0, Math.PI * 2);
  ctx.fill();

  // Constellation ring: dashed circle with bright star points.
  ctx.save();
  ctx.strokeStyle = CONFIG.colors.penRing;
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 10]);
  ctx.lineDashOffset = -world.time * 22;
  ctx.beginPath();
  ctx.arc(pen.x, pen.y, R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(127,231,255,0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(pen.x, pen.y, pen.innerRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Ring stars.
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + world.time * 0.12;
    const sx = pen.x + Math.cos(a) * R;
    const sy = pen.y + Math.sin(a) * R;
    drawStar(ctx, sx, sy, 4.5, '#ffffff', 0.95);
    drawStar(ctx, sx, sy, 9, CONFIG.colors.penRing, 0.3);
  }

  ctx.fillStyle = CONFIG.colors.text;
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CONSTELLATION PEN', pen.x, pen.y + R + 30);
  ctx.font = '13px sans-serif';
  ctx.fillStyle = CONFIG.colors.muted;
  ctx.fillText('guide star-lings inside the ring', pen.x, pen.y + R + 50);

  // Quota progress: a gold arc that fills as star-lings are penned.
  if (world.quota > 0) {
    const frac = Math.min(1, world.pennedThisWave / world.quota);
    ctx.save();
    ctx.strokeStyle = CONFIG.colors.gold;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(pen.x, pen.y, R + 12, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawShip(ctx, world) {
  const ship = world.ship;
  if (!ship) return;

  // Lantern glow.
  const lr = CONFIG.ship.lanternRadius;
  const lg = ctx.createRadialGradient(ship.x, ship.y, 10, ship.x, ship.y, lr);
  lg.addColorStop(0, 'rgba(255,233,168,0.20)');
  lg.addColorStop(0.7, 'rgba(255,233,168,0.06)');
  lg.addColorStop(1, 'rgba(255,233,168,0)');
  ctx.fillStyle = lg;
  ctx.beginPath();
  ctx.arc(ship.x, ship.y, lr, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.strokeStyle = 'rgba(255,233,168,0.35)';
  ctx.setLineDash([6, 12]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(ship.x, ship.y, lr, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Bark ring flash.
  if (world.barkFlash > 0) {
    const a = world.barkFlash / 0.35;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,214,106,' + (a * 0.9) + ')';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, CONFIG.bark.radius * (1.15 - a * 0.15), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Ship body: a little boat / arrow pointing along its heading.
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);
  ctx.fillStyle = '#2c4a7a';
  ctx.beginPath();
  ctx.moveTo(22, 0);
  ctx.lineTo(-14, -13);
  ctx.lineTo(-8, 0);
  ctx.lineTo(-14, 13);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = CONFIG.colors.ship;
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.lineTo(-10, -9);
  ctx.lineTo(-5, 0);
  ctx.lineTo(-10, 9);
  ctx.closePath();
  ctx.fill();
  // Lantern hanging at the stern.
  ctx.fillStyle = '#3a2b12';
  ctx.fillRect(-18, -4, 5, 8);
  ctx.restore();

  // Lantern light orb.
  const flicker = 1 + 0.12 * Math.sin(world.time * 7);
  const lg2 = ctx.createRadialGradient(ship.x, ship.y, 1, ship.x, ship.y, 16 * flicker);
  lg2.addColorStop(0, '#fff6cf');
  lg2.addColorStop(0.5, 'rgba(255,214,106,0.75)');
  lg2.addColorStop(1, 'rgba(255,214,106,0)');
  ctx.fillStyle = lg2;
  ctx.beginPath();
  ctx.arc(ship.x, ship.y, 16 * flicker, 0, Math.PI * 2);
  ctx.fill();
  drawStar(ctx, ship.x, ship.y, 5, '#fff3c4', 1);
}

function drawStarling(ctx, s) {
  const glow = 1 + 0.18 * Math.sin(s.pulse);
  const g = ctx.createRadialGradient(s.x, s.y, 1, s.x, s.y, 26 * glow);
  g.addColorStop(0, 'rgba(255,243,196,0.95)');
  g.addColorStop(0.35, 'rgba(255,215,106,0.55)');
  g.addColorStop(1, 'rgba(255,215,106,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(s.x, s.y, 26 * glow, 0, Math.PI * 2);
  ctx.fill();
  drawStar(ctx, s.x, s.y, s.radius, CONFIG.colors.goldCore, 1);
  drawStar(ctx, s.x, s.y, s.radius * 0.55, '#ffffff', 1);
  // Tiny face: two eyes, a hopeful look.
  ctx.fillStyle = '#4a3200';
  ctx.beginPath();
  ctx.arc(s.x - 3.5, s.y - 1, 1.4, 0, Math.PI * 2);
  ctx.arc(s.x + 3.5, s.y - 1, 1.4, 0, Math.PI * 2);
  ctx.fill();
}

function drawWolf(ctx, w, world) {
  const wobble = Math.sin(w.phase) * 2;
  const fleeing = w.fleeTimer > 0;
  ctx.save();
  ctx.translate(w.x, w.y + wobble);
  const angle = Math.atan2(w.vy, w.vx);
  ctx.rotate(angle);
  // Shadow body.
  ctx.fillStyle = fleeing ? '#3a2a55' : CONFIG.colors.wolf;
  ctx.beginPath();
  ctx.ellipse(0, 0, 24, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  // Snout.
  ctx.beginPath();
  ctx.moveTo(20, -6);
  ctx.lineTo(32, 0);
  ctx.lineTo(20, 6);
  ctx.closePath();
  ctx.fill();
  // Ears.
  ctx.beginPath();
  ctx.moveTo(-6, -12);
  ctx.lineTo(-12, -24);
  ctx.lineTo(2, -14);
  ctx.closePath();
  ctx.moveTo(6, -13);
  ctx.lineTo(4, -25);
  ctx.lineTo(13, -14);
  ctx.closePath();
  ctx.fill();
  // Tail.
  ctx.strokeStyle = CONFIG.colors.wolf;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-22, 0);
  ctx.quadraticCurveTo(-32, -8 + Math.sin(world.time * 5 + w.phase) * 6, -34, 4);
  ctx.stroke();
  ctx.restore();

  // Glowing eyes (not rotated, so they read clearly).
  const ex = Math.cos(angle) * 10;
  const ey = Math.sin(angle) * 10;
  const eyeColor = fleeing ? '#c9b8ff' : CONFIG.colors.wolfEye;
  drawStar(ctx, w.x + ex - 4, w.y - 5 + wobble, 2.6, eyeColor, 1);
  drawStar(ctx, w.x + ex + 4, w.y - 5 + wobble, 2.6, eyeColor, 1);
  if (fleeing) {
    ctx.fillStyle = '#e8ddff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', w.x, w.y - 30);
  }
}

function drawParticles(ctx, world) {
  for (const p of world.particles) {
    const a = Math.max(0, p.life / p.maxLife);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius * a + 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  for (const f of world.floats) {
    const a = Math.max(0, f.life / f.maxLife);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = f.color;
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(f.text, f.x, f.y);
    ctx.restore();
  }
}

export function drawHUD(ctx, world) {
  const W = CONFIG.width;
  ctx.save();
  ctx.fillStyle = 'rgba(8,4,28,0.55)';
  roundRect(ctx, 0, 0, W, 46, 0);
  ctx.fill();
  ctx.fillStyle = CONFIG.colors.text;
  ctx.font = 'bold 17px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Score  ' + world.score, 16, 29);
  ctx.fillStyle = CONFIG.colors.muted;
  ctx.font = '15px sans-serif';
  ctx.fillText('Best  ' + Math.max(world.best, world.score), 170, 29);
  ctx.fillStyle = CONFIG.colors.text;
  ctx.font = 'bold 17px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Wave ' + world.wave, W / 2 - 60, 29);
  ctx.fillStyle = CONFIG.colors.gold;
  ctx.fillText('Penned ' + world.pennedThisWave + ' / ' + world.quota, W / 2 + 90, 29);
  if (world.combo > 1) {
    // Left of the Wave readout: the old spot (W/2 + 250, centered) ran
    // into the right-aligned "Lost" hearts on a 1280-wide HUD.
    ctx.fillStyle = '#ffb347';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('x' + world.combo.toFixed(1) + ' combo!', 320, 29);
    ctx.textAlign = 'center';
  }
  // Lost hearts.
  ctx.textAlign = 'right';
  ctx.font = '17px sans-serif';
  let hearts = '';
  for (let i = 0; i < CONFIG.rules.maxLost; i++) {
    hearts += i < world.lost ? '✕ ' : '★ ';
  }
  ctx.fillStyle = world.lost >= 3 ? CONFIG.colors.danger : CONFIG.colors.gold;
  ctx.fillText('Lost ' + hearts, W - 210, 29);
  // Bark cooldown bar.
  const cd = Math.max(0, world.barkCooldown);
  const frac = 1 - cd / CONFIG.bark.cooldown;
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  roundRect(ctx, W - 190, 16, 150, 14, 7);
  ctx.fill();
  ctx.fillStyle = frac >= 1 ? '#7fe7a8' : '#ffd76a';
  if (frac > 0.01) {
    roundRect(ctx, W - 190, 16, 150 * frac, 14, 7);
    ctx.fill();
  }
  ctx.fillStyle = CONFIG.colors.text;
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(frac >= 1 ? 'BARK ready' : 'bark…', W - 190, 42);
  ctx.restore();
}

function drawBanner(ctx, world) {
  if (!world.banner || world.bannerTimer <= 0) return;
  const W = CONFIG.width;
  const a = Math.min(1, world.bannerTimer);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(8,4,28,0.6)';
  roundRect(ctx, W / 2 - 300, 220, 600, 76, 16);
  ctx.fill();
  ctx.strokeStyle = CONFIG.colors.gold;
  ctx.lineWidth = 2;
  roundRect(ctx, W / 2 - 300, 220, 600, 76, 16);
  ctx.stroke();
  ctx.fillStyle = CONFIG.colors.gold;
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(world.banner, W / 2, 270);
  ctx.restore();
}

function dimScreen(ctx) {
  ctx.fillStyle = 'rgba(6,3,22,0.62)';
  ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(10,6,34,0.88)';
  roundRect(ctx, x, y, w, h, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(127,231,255,0.45)';
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 18);
  ctx.stroke();
}

export function drawTitle(ctx, world) {
  drawBackground(ctx, world);
  drawPen(ctx, world);
  // A few decorative star-lings drifting on the title.
  for (const s of world.starlings) drawStarling(ctx, s);
  dimScreen(ctx);
  const W = CONFIG.width;
  panel(ctx, W / 2 - 330, 120, 660, 430);
  ctx.textAlign = 'center';
  ctx.fillStyle = CONFIG.colors.gold;
  ctx.font = 'bold 64px sans-serif';
  ctx.fillText('STAR SHEPHERD', W / 2, 205);
  ctx.fillStyle = CONFIG.colors.text;
  ctx.font = '20px sans-serif';
  ctx.fillText('Guide the lost star-lings home. Keep the void wolves away.', W / 2, 250);
  ctx.fillStyle = CONFIG.colors.muted;
  ctx.font = '16px sans-serif';
  ctx.fillText('Move: WASD / arrows / mouse  •  Bark: Space or click  •  P pause  •  M mute', W / 2, 300);
  ctx.fillText('Your lantern pulls star-lings close. Steer them into the glowing pen.', W / 2, 328);
  ctx.fillText('Pen the quota to clear the wave. Lose 5 star-lings and the flock is broken.', W / 2, 356);
  ctx.fillStyle = CONFIG.colors.gold;
  ctx.font = 'bold 19px sans-serif';
  ctx.fillText('Best score: ' + world.best, W / 2, 408);
  const blink = 0.55 + 0.45 * Math.sin(world.time * 4);
  ctx.save();
  ctx.globalAlpha = blink;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('Press Enter or Click to start', W / 2, 470);
  ctx.restore();
  ctx.fillStyle = CONFIG.colors.muted;
  ctx.font = '14px sans-serif';
  ctx.fillText('A tiny original game — no downloads, no accounts, just shepherding.', W / 2, 516);
}

export function drawPause(ctx, world) {
  dimScreen(ctx);
  const W = CONFIG.width;
  panel(ctx, W / 2 - 220, 250, 440, 180);
  ctx.textAlign = 'center';
  ctx.fillStyle = CONFIG.colors.text;
  ctx.font = 'bold 40px sans-serif';
  ctx.fillText('Paused', W / 2, 320);
  ctx.fillStyle = CONFIG.colors.muted;
  ctx.font = '18px sans-serif';
  ctx.fillText('Press P or Enter to keep shepherding', W / 2, 362);
  ctx.fillText('M toggles sound', W / 2, 392);
}

export function drawGameOver(ctx, world) {
  dimScreen(ctx);
  const W = CONFIG.width;
  panel(ctx, W / 2 - 300, 130, 600, 440);
  ctx.textAlign = 'center';
  ctx.fillStyle = CONFIG.colors.danger;
  ctx.font = 'bold 48px sans-serif';
  ctx.fillText('The flock is broken', W / 2, 205);
  ctx.fillStyle = CONFIG.colors.text;
  ctx.font = '20px sans-serif';
  ctx.fillText('The void wolves scattered the star-lings.', W / 2, 248);
  ctx.fillStyle = CONFIG.colors.gold;
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText('Final score: ' + world.score, W / 2, 305);
  ctx.fillStyle = CONFIG.colors.text;
  ctx.font = '19px sans-serif';
  ctx.fillText('Best score: ' + Math.max(world.best, world.score), W / 2, 345);
  ctx.fillText('Star-lings penned: ' + world.totalPenned + '   •   Waves cleared: ' + world.wavesCleared, W / 2, 380);
  ctx.fillText('Star-lings lost: ' + world.lost, W / 2, 412);
  const blink = 0.55 + 0.45 * Math.sin(world.time * 4);
  ctx.save();
  ctx.globalAlpha = blink;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('Press Enter or Click to play again', W / 2, 480);
  ctx.restore();
}

export function drawWorld(ctx, world) {
  ctx.save();
  if (world.shake > 0) {
    const mag = world.shake * 9;
    ctx.translate((Math.random() - 0.5) * mag * 2, (Math.random() - 0.5) * mag * 2);
  }
  drawBackground(ctx, world);
  drawPen(ctx, world);
  for (const s of world.starlings) drawStarling(ctx, s);
  for (const w of world.wolves) drawWolf(ctx, w, world);
  drawShip(ctx, world);
  drawParticles(ctx, world);
  ctx.restore();
  drawHUD(ctx, world);
  drawBanner(ctx, world);
  if (world.state === 'paused') drawPause(ctx, world);
}
