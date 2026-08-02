#!/usr/bin/env node
/* ==============================================================================================
   node embeds/cli.mjs [--out DIR] [--seed N]

   Regenerates the committed poster + tile SVGs for every registry theme. This is the one command
   the golden snapshot test in render.test.mjs points people at when it fails.
   ============================================================================================== */

import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { THEMES } from "../src/themes.js";
import { renderPoster, renderTile } from "./render.mjs";

function parseArgs(argv) {
  const args = { out: null, seed: 0 };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--out") args.out = argv[++i];
    else if (argv[i] === "--seed") args.seed = Number(argv[++i]);
  }
  return args;
}

const { out, seed } = parseArgs(process.argv.slice(2));

// Generated SVGs necessarily contain colour literals resolved from theme CSS. They live in
// embeds/ (not src/, gallery/, or sheets/), which is outside every path scripts/check.mjs scans
// for literals — so committing them here weakens no invariant and needs no exemption.
const OUT_DIR = out ?? fileURLToPath(new URL("posters/", import.meta.url));

mkdirSync(OUT_DIR, { recursive: true });

let written = 0;
for (const t of THEMES) {
  writeFileSync(join(OUT_DIR, `${t.id}.poster.svg`), renderPoster(t.id, { seed }), "utf8");
  writeFileSync(join(OUT_DIR, `${t.id}.tile.svg`), renderTile(t.id, { seed }), "utf8");
  written += 2;
}

console.log(`wrote ${written} files to ${OUT_DIR}`);
