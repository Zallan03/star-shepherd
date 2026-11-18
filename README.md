# Star Shepherd

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/Zallan03/star-shepherd/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/Zallan03/star-shepherd/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

An entry for the [make.fun best-game-01 bounty](https://make.fun/bounty/best-game-01).

You are a shepherd of the stars. Lost star-lings — small glowing golden
orbs — drift through deep space, and void wolves hunt them. Your shepherd
ship carries a lantern whose gentle light pulls nearby star-lings toward
you. Steer them into the glowing constellation pen, bark to scare the
wolves away, and keep the flock together.

## How to play

- **Move:** WASD or arrow keys, move the mouse to steer toward the
  pointer, or drag on touch screens.
- **Bark:** Space, mouse click, or tap. Scares wolves away within a
  radius, but has a short cooldown — use it wisely.
- **Pause:** P. **Mute:** M. **Start / restart:** Enter or click.

## Goal and rules

- Guide star-lings into the glowing constellation pen in the top-right.
  Each one penned scores **+100 points**.
- Pen star-lings quickly in a row to build a **combo multiplier**
  (up to x3).
- Pen the wave's quota to clear the wave and earn a **wave bonus**;
  the next wave brings more star-lings and faster, more numerous wolves.
- If a wolf touches a star-ling, that star-ling is lost. Lose **5**
  star-lings in total and the flock is broken — game over.
- Your best score is saved on your device and shown on the title screen.

## Run it locally

Serve the `game/` folder with any static server and open `index.html`.
For example, from the repository root:

```sh
python3 -m http.server --directory game 8000
```

Then open `http://localhost:8000` in a desktop browser. The game is
plain static files: no build step, no network requests, no external
fonts, images or libraries. All art is drawn in canvas code and all
sound is synthesized with WebAudio.

## Screenshots

The page supports deterministic screenshot scenes for testing:

- `index.html?shot=start` — title screen
- `index.html?shot=play` — mid-gameplay with HUD, star-lings and wolves
- `index.html?shot=end` — game-over screen

Add `&seed=123` to fix the random layout. Each scene sets
`window.__shotReady = true` once it has been drawn.

## Files

- `game/index.html` — the page that loads the game
- `game/src/main.js` — bootstrap and game loop
- `game/src/config.js` — tuning constants
- `game/src/input.js` — keyboard, mouse and touch
- `game/src/world.js` — ship, star-lings, wolves, pen, waves, scoring
- `game/src/render.js` — all drawing, HUD and screens
- `game/src/audio.js` — synthesized WebAudio sounds
- `game/src/shots.js` — deterministic screenshot scenes (`?shot=start|play|end`)
- `game/src/random.js` — seeded random number generator
- `main.ts` — hand-in entrypoint that builds the submission dossier

Made for the make.fun best-game bounty — play it here:
https://make.fun/r/tmbrnhrj
