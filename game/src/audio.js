// Star Shepherd — all sound, synthesized with WebAudio. No audio files.
// A soft ambient pad hums underneath; every effect is a small oscillator
// or noise envelope built in code.

export function createAudio() {
  let ctx = null;
  let master = null;
  let padNodes = null;
  let muted = false;

  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return true;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
      startPad();
      return true;
    } catch (err) {
      return false;
    }
  }

  function startPad() {
    // Two detuned triangle waves, very quiet, through a lowpass filter.
    const gain = ctx.createGain();
    gain.gain.value = 0.035; // lowered from 0.045: pad was crowding the chimes
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    const o1 = ctx.createOscillator();
    o1.type = 'triangle';
    o1.frequency.value = 110;
    const o2 = ctx.createOscillator();
    o2.type = 'sine';
    o2.frequency.value = 164.81;
    const o3 = ctx.createOscillator();
    o3.type = 'sine';
    o3.frequency.value = 220.5;
    const g3 = ctx.createGain();
    g3.gain.value = 0.4;
    o1.connect(filter);
    o2.connect(filter);
    o3.connect(g3);
    g3.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    o1.start();
    o2.start();
    o3.start();
    // Slow breathing on the pad volume.
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.015;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    lfo.start();
    padNodes = { gain };
  }

  function tone(freq, dur, type, vol, when, slideTo) {
    if (!ctx || muted) return;
    const t0 = ctx.currentTime + (when || 0);
    const osc = ctx.createOscillator();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.2, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noiseBurst(dur, vol, filterFreq, when) {
    if (!ctx || muted) return;
    const t0 = ctx.currentTime + (when || 0);
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq || 900;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol || 0.25, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(master);
    src.start(t0);
  }

  return {
    unlock() { ensure(); },
    get muted() { return muted; },
    toggleMute() {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 0.5;
      return muted;
    },
    chime(combo) {
      if (!ensure()) return;
      const base = 660 * (1 + Math.min(combo || 1, 3) * 0.06);
      tone(base, 0.35, 'sine', 0.22, 0);
      tone(base * 1.5, 0.4, 'sine', 0.16, 0.07);
      tone(base * 2, 0.5, 'sine', 0.10, 0.14);
    },
    bark() {
      if (!ensure()) return;
      tone(180, 0.22, 'square', 0.16, 0, 90);
      tone(320, 0.14, 'sawtooth', 0.10, 0.02, 140);
      noiseBurst(0.18, 0.12, 1400, 0);
    },
    // Startled wolf yelp, played when a bark actually scares one off.
    yelp() {
      if (!ensure()) return;
      tone(520, 0.16, 'sine', 0.13, 0, 880);
      tone(760, 0.12, 'sine', 0.08, 0.08, 980);
    },
    growl() {
      if (!ensure()) return;
      tone(70, 0.5, 'sawtooth', 0.16, 0, 45);
      tone(98, 0.4, 'square', 0.07, 0.05, 60);
    },
    poof() {
      if (!ensure()) return;
      noiseBurst(0.35, 0.22, 500, 0);
      tone(220, 0.4, 'sine', 0.14, 0, 55);
    },
    fanfare() {
      if (!ensure()) return;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((f, i) => tone(f, 0.45, 'triangle', 0.18, i * 0.11));
      tone(1318.5, 0.6, 'sine', 0.12, 0.48);
    },
    gameOver() {
      if (!ensure()) return;
      const notes = [392, 329.63, 261.63, 196];
      notes.forEach((f, i) => tone(f, 0.55, 'triangle', 0.18, i * 0.22));
    },
    click() {
      if (!ensure()) return;
      tone(880, 0.08, 'sine', 0.12, 0);
    },
  };
}
