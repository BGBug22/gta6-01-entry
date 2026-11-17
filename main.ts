// VELAMAR — entry gta6-01 (Node 22, stdlib saja). Program ini menyerahkan game:
// menyalin game/ dan screenshots/ dari samping file ini ke direktori output,
// lalu menulis /output/dossier.json dengan library make.fun yang divendor.
// Dijalankan dua kali oleh grader — kedua run harus menulis byte yang sama.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Di luar container grader, MAKEFUN_OUTPUT_DIR menggantikan /output.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// Direktori repo — JANGAN process.cwd(): grader bisa jalan dari cwd mana saja.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outDir, 'game'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// Batas gate (reference/gate.json): text_max_bytes membentuk byte dossier;
// batas lain menolak entry yang scorer akan tolak (lebih dari 4 screenshot,
// satu screenshot di atas 256 KiB, game/ di atas 993 file / 48 MiB, atau
// path game/ di atas 1000 byte). game/ dihitung bersama cap /output sendiri
// (1000 entri, 64 MiB) bersama screenshots/ dan dossier.json.
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
