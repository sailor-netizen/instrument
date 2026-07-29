#!/usr/bin/env node
/* ==============================================================================================
   Instrument's own gate.  `npm run check`
   ==============================================================================================

   The library used to be linted only by the app that consumed it, which is the wrong way round: a
   design system with many consumers has to be able to say for itself whether it is still coherent.
   Every rule below is one of the invariants README and AUTHORING claim — a claim a repo makes about
   itself and does not check is a claim that stops being true.

   Zero dependencies on purpose. This runs anywhere Node does, including a fresh CI container with no
   install step, which is what keeps it from being skipped.
   ============================================================================================== */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");
const THEMES_DIR = join(SRC, "themes");
const GALLERY = join(ROOT, "gallery");

const failures = [];
const fail = (rule, detail) => failures.push({ rule, detail });
const read = (p) => readFileSync(p, "utf8");

// A colour literal in any form. Deliberately broad — the point is that colour lives in ONE layer —
// but not so broad it flags an HTML numeric entity: `&#10005;` is the ✕ glyph, not a hex colour, and
// a linter that cries wolf on its own gallery is a linter someone switches off.
const LITERAL = /(?<![&\w])#[0-9a-fA-F]{3,8}\b|\brgba?\s*\(|\bhsla?\s*\(|\boklch\s*\(/g;

/* 1. Literals live only where they are legal: the L0 block of tokens.css, and theme files.
      This is what makes a re-skin a bounded edit instead of an audit, and it is the one rule the
      whole system rests on. */
{
  const legal = new Set(["tokens.css"]);
  for (const f of readdirSync(SRC).filter((f) => f.endsWith(".css"))) {
    if (legal.has(f)) continue;
    const hits = [...read(join(SRC, f)).matchAll(LITERAL)];
    if (hits.length) fail("no-literals-outside-tokens", `src/${f}: ${hits.length} (${hits[0][0]})`);
  }
}

/* 2. Every theme fills every core role. A theme that inherits one shows the PREVIOUS theme's colour
      for that meaning — a failure state rendering in the last theme's red is the worst version. */
const CORE = ["page", "plane", "well", "line", "line-hi", "ink", "dim", "faint",
              "signal", "machine", "crit", "ok"];
const themeFiles = readdirSync(THEMES_DIR).filter((f) => f.endsWith(".css"));
for (const f of themeFiles) {
  const css = read(join(THEMES_DIR, f));
  const missing = CORE.filter((role) => !new RegExp(`--i-${role}\\s*:`).test(css));
  if (missing.length) fail("theme-fills-every-role", `themes/${f}: missing ${missing.join(", ")}`);
}

/* 3. A theme never reaches into a consuming app. `[data-theme="x"] .fd-thing` means the theme is
      patching someone's screen instead of expressing itself through the system — and it would break
      the moment that app renamed a class it never agreed to keep. */
for (const f of themeFiles) {
  const bad = [...read(join(THEMES_DIR, f)).matchAll(/\.(?!i-)[a-z][a-z0-9-]*\s*[,{]/gi)]
    .map((m) => m[0].trim())
    .filter((sel) => !/^\.(is-|tone-)/.test(sel));
  if (bad.length) fail("themes-target-i-only", `themes/${f}: ${[...new Set(bad)].join(" ")}`);
}

/* 4. Every stylesheet the aggregate entry point imports actually exists. A broken @import fails
      SILENTLY in CSS — the page renders, just unstyled in one layer, which is the hardest kind of
      breakage to attribute. */
{
  const agg = read(join(SRC, "instrument.css"));
  for (const m of agg.matchAll(/@import\s+"([^"]+)"/g)) {
    if (!existsSync(join(SRC, m[1]))) fail("imports-resolve", `instrument.css -> ${m[1]}`);
  }
  for (const f of themeFiles) {
    if (!agg.includes(`themes/${f}`)) {
      fail("every-theme-is-imported", `themes/${f} exists but instrument.css never imports it`);
    }
  }
}

/* 5. Every theme in the registry has a file, and every file has a registry entry. The two halves of
      a theme are enforced by different machinery (cascade vs attributes), so nothing but this check
      notices when one is added without the other. */
{
  const reg = read(join(SRC, "themes.js"));
  const ids = [...reg.matchAll(/^\s*id:\s*"([^"]+)"/gm)].map((m) => m[1]);
  for (const id of ids) {
    if (id !== "instrument" && !themeFiles.includes(`${id}.css`)) {
      fail("registry-matches-files", `themes.js declares "${id}" with no themes/${id}.css`);
    }
  }
  for (const f of themeFiles) {
    if (!ids.includes(f.replace(/\.css$/, ""))) {
      fail("registry-matches-files", `themes/${f} has no entry in themes.js`);
    }
  }
}

/* 6. The gallery obeys the rules it documents. A gallery that hardcodes a colour while telling you
      not to is the least credible file in the repo. */
if (existsSync(GALLERY)) {
  for (const f of readdirSync(GALLERY).filter((f) => f.endsWith(".html"))) {
    const hits = [...read(join(GALLERY, f)).matchAll(LITERAL)];
    if (hits.length) fail("gallery-uses-tokens", `gallery/${f}: ${hits.length} (${hits[0][0]})`);
  }
}

/* 7. Every local asset a gallery page references resolves. The gallery once shipped with an npm
      script that served gallery/ as the web root, so every page's `../src/instrument.css` 404'd and
      the whole gallery rendered UNSTYLED — the loudest possible bug, invisible to every other check
      because the HTML itself was fine. */
if (existsSync(GALLERY)) {
  for (const f of readdirSync(GALLERY).filter((f) => f.endsWith(".html"))) {
    const html = read(join(GALLERY, f));
    const refs = [...html.matchAll(/(?:href|src|from)\s*=?\s*["']([^"'#?]+\.(?:css|js|mjs))["']/g)]
      .map((m) => m[1])
      .filter((u) => !/^(https?:)?\/\//.test(u));
    for (const ref of new Set(refs)) {
      if (!existsSync(join(GALLERY, ref))) fail("gallery-assets-resolve", `gallery/${f} -> ${ref}`);
    }
  }
}

/* 8. No box-shadow. Depth here is translucency + a hairline + the page wash showing through, which
      is why it stays crisp in dark mode instead of turning to mud. Stated in the README, so checked. */
for (const f of readdirSync(SRC).filter((f) => f.endsWith(".css"))) {
  if (/box-shadow\s*:\s*(?!none)/.test(read(join(SRC, f)))) {
    fail("no-box-shadow", `src/${f}`);
  }
}

/* ---------------------------------------------------------------------------------------------- */
const RULES = 8;
if (failures.length) {
  console.error(`\n✗ instrument check — ${failures.length} failure(s)\n`);
  for (const { rule, detail } of failures) console.error(`  [${rule}] ${detail}`);
  console.error("\nThese are the invariants README.md and AUTHORING.md promise. Fix the code, or if\n" +
                "the rule is genuinely wrong now, change the rule AND the docs together.\n");
  process.exit(1);
}
console.log(`✓ instrument check — ${RULES} invariants hold across ${themeFiles.length} themes`);
