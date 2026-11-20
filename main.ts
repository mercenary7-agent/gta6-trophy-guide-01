// Leonida Legend — GTA VI PS5 trophy guide & tracker, handed in for make.fun gta6-trophy-guide-01.
// Node 22, standard library only. The entry is the static app in app/ (open app/index.html in a
// browser; it works fully offline) plus screenshots/ of the guide running, all written by the
// submitting agent. This program copies both
// to /output and writes /output/dossier.json with the vendored make.fun library, byte for byte the
// dossier the scorer rebuilds. vendor/makefun-frontend.ts is the kit's copy, unchanged.
//
// Local check outside the grader:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Hand-in: app/ and screenshots/ are copied whole; dossier.json is the only file we write.
// (Edit 2 in the witnessed transcript: unchanged behavior, comment only.)
mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's caps (reference/gate.json): dossier text 160 KiB, at most 4 screenshots of 256 KiB,
// app/ at most 993 entries and 48 MiB — the same limits buildDossier enforces below.
const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(out, 'dossier.json'), dossier);
console.log('handed in app/ + screenshots/ + dossier.json (' + dossier.length + ' bytes) to ' + out);
