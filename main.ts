// Star Shepherd — hand-in entrypoint.
// Copies game/ and screenshots/ into the output directory, then builds
// the submission dossier with the kit's buildDossier helper.
// Node 22, standard library only.

import { cp, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = path.dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

const gameSource = path.join(repoRoot, 'game');
const screenshotsSource = path.join(repoRoot, 'screenshots');

if (!existsSync(gameSource)) {
  console.error('game/ folder not found at ' + gameSource);
  process.exit(1);
}

await mkdir(outputDir, { recursive: true });

await cp(gameSource, path.join(outputDir, 'game'), { recursive: true });

if (existsSync(screenshotsSource)) {
  await cp(screenshotsSource, path.join(outputDir, 'screenshots'), {
    recursive: true,
  });
}

const dossier = await buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});

await writeFile(path.join(outputDir, 'dossier.json'), dossier);

console.log('Dossier written to ' + path.join(outputDir, 'dossier.json'));
console.log('Game copied from ' + gameSource + ' to ' + path.join(outputDir, 'game'));
