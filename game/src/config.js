// Star Shepherd — tuning constants. One job: all numbers in one place.
export const CONFIG = {
  width: 1280,
  height: 720,

  ship: {
    radius: 16,
    accel: 1500,
    maxSpeed: 340,
    friction: 0.90,
    lanternRadius: 185, // widened after playtest: herding felt too fiddly at 170
    lanternPull: 280,
  },

  bark: {
    radius: 230,
    cooldown: 1.4, // trimmed from 1.6: barking felt punishing on wave 3+
    fleeSpeed: 420,
    fleeTime: 2.2,
  },

  pen: {
    x: 1060,
    y: 150,
    radius: 92,
    innerRadius: 58,
  },

  starling: {
    radius: 11,
    wanderSpeed: 42,
    wanderChange: 1.4,
    maxSpeed: 95,
    pullFalloff: 0.55,
  },

  wolf: {
    radius: 19,
    baseSpeed: 70, // lowered from 78: wave 1 wolves caught star-lings too fast
    speedPerWave: 13,
    maxSpeed: 205,
    spawnDelay: 2.4,
    maxActive: 9,
  },

  waves: [
    { starlings: 6, quota: 4, wolves: 2 },
    { starlings: 8, quota: 5, wolves: 3 },
    { starlings: 10, quota: 6, wolves: 4 },
    { starlings: 12, quota: 7, wolves: 5 },
    { starlings: 14, quota: 8, wolves: 6 },
  ],

  rules: {
    maxLost: 5,
    pointsPerPen: 100,
    comboWindow: 3.5, // widened from 3.0: crossing the map takes a moment
    comboStep: 0.5,
    comboMax: 3.0,
    waveBonusBase: 150,
    waveBonusPerWave: 50,
  },

  colors: {
    bgTop: '#0b0626',
    bgBottom: '#1a0f3d',
    nebulaA: '#5b2a86',
    nebulaB: '#1e4d8c',
    nebulaC: '#8c2f6b',
    gold: '#ffd76a',
    goldCore: '#fff3c4',
    penRing: '#7fe7ff',
    penGlow: '#3fc9ff',
    wolf: '#241a33',
    wolfEye: '#ff4d6d',
    ship: '#e8f4ff',
    lantern: '#ffe9a8',
    text: '#f4efff',
    muted: '#b9a8e8',
    danger: '#ff5d73',
  },

  storageKey: 'star-shepherd-best',
};
