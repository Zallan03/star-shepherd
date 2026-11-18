// Star Shepherd — seeded random number generator (mulberry32).
// Deterministic: same seed always gives the same sequence. Used for
// screenshot mode so a shot always renders identically.

export function makeRng(seed) {
  let a = (seed >>> 0) || 1;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rngRange(rng, min, max) {
  return min + rng() * (max - min);
}

export function rngInt(rng, min, max) {
  return Math.floor(rngRange(rng, min, max + 1));
}

export function rngPick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

// Hash a short string into a 32-bit seed.
export function seedFromString(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// True with probability p (0..1).
export function rngBool(rng, p) {
  return rng() < p;
}

// In-place Fisher-Yates shuffle driven by the seeded generator.
export function shuffle(rng, arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}
