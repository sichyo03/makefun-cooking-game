// Sizzle Rush — the entry program (Node 22, standard library only).
// It hands the game in: it copies game/ and screenshots/ from beside this
// file to /output and writes /output/dossier.json, the summary the judge
// reads, with the vendored make.fun library (buildDossier). The game itself
// is plain static files a desktop browser loads offline: game/index.html and
// its ES modules, no library and no network request.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's caps for this bounty (game/ 993 files / 48 MiB, screenshots
// 4 files / 256 KiB each, dossier 1.5 MiB): refuse early, with a clear
// message, instead of handing in an entry the gate would refuse.
const GAME_MAX_FILES = 993;
const GAME_MAX_BYTES = 48 * 1024 * 1024;
const SHOTS_MAX = 4;
const SHOT_MAX_BYTES = 256 * 1024;

function countFiles(dir: string): { files: number; bytes: number } {
  // Count regular files only — directories are not files, so they do not
  // count towards the 993-file cap (an earlier draft counted them).
  let files = 0;
  let bytes = 0;
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, name.name);
    if (name.isDirectory()) {
      const sub = countFiles(path);
      files += sub.files;
      bytes += sub.bytes;
    } else if (name.isFile()) {
      files += 1;
      bytes += statSync(path).size;
    }
  }
  return { files, bytes };
}

function checkLimits(): void {
  const game = countFiles(join(here, 'game'));
  if (game.files > GAME_MAX_FILES) {
    throw new Error(`game/ has ${game.files} files, over the ${GAME_MAX_FILES} cap`);
  }
  if (game.bytes > GAME_MAX_BYTES) {
    throw new Error(`game/ is ${game.bytes} bytes, over the ${GAME_MAX_BYTES} cap`);
  }
  const shotsDir = join(here, 'screenshots');
  if (existsSync(shotsDir)) {
    const shots = readdirSync(shotsDir).filter((n) => !n.startsWith('.'));
    if (shots.length > SHOTS_MAX) {
      throw new Error(`screenshots/ has ${shots.length} files, over the ${SHOTS_MAX} cap`);
    }
    for (const name of shots) {
      const size = statSync(join(shotsDir, name)).size;
      if (size > SHOT_MAX_BYTES) {
        throw new Error(`screenshots/${name} is ${size} bytes, over the ${SHOT_MAX_BYTES} cap`);
      }
    }
  }
}

checkLimits();

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: SHOTS_MAX, max_bytes: SHOT_MAX_BYTES },
    game_max_files: GAME_MAX_FILES,
    game_max_bytes: GAME_MAX_BYTES,
    game_path_max_bytes: 1000,
  }),
);
