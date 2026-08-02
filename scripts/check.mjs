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
      not to is the least credible file in the repo.

      Scoped to pages that actually LOAD the system, which is principled rather than an exemption
      list: a page claiming to follow the rules is one that imports them. `compare.html` deliberately
      does not — it is the wall the exhibits hang on, holding six panes at six themes, and chrome that
      restyled itself as you switched would be competing with the thing being judged. A page that
      opts out of the stylesheet has opted out of the vocabulary, and gets no tokens to use. */
if (existsSync(GALLERY)) {
  for (const f of readdirSync(GALLERY).filter((f) => f.endsWith(".html"))) {
    const html = read(join(GALLERY, f));
    // a real <link>, not the substring: compare.html's own comment EXPLAINS that it does not load
    // instrument.css, and a naive includes() read that explanation as the thing it denies
    if (!/<link[^>]+instrument\.css/.test(html)) continue;
    const hits = [...html.matchAll(LITERAL)];
    if (hits.length) fail("gallery-uses-tokens", `gallery/${f}: ${hits.length} (${hits[0][0]})`);
  }
}

/* 7. Every local asset a gallery page references resolves. The gallery once shipped with an npm
      script that served gallery/ as the web root, so every page's `../src/instrument.css` 404'd and
      the whole gallery rendered UNSTYLED — the loudest possible bug, invisible to every other check
      because the HTML itself was fine. */
if (existsSync(GALLERY)) {
  const pages = readdirSync(GALLERY, { recursive: true })
    .map(String).filter((f) => f.endsWith(".html"));
  for (const f of pages) {
    const html = read(join(GALLERY, f));
    const base = join(GALLERY, dirname(f));
    const refs = [...html.matchAll(/(?:href|src|from)\s*=?\s*["']([^"'#?]+\.(?:css|js|mjs))["']/g)]
      .map((m) => m[1])
      .filter((u) => !/^(https?:)?\/\//.test(u));
    for (const ref of new Set(refs)) {
      if (!existsSync(join(base, ref))) fail("gallery-assets-resolve", `gallery/${f} -> ${ref}`);
    }
  }
}

/* 8. Screens compose the library rather than restyling it. A screen page exists to prove the
      vocabulary builds real UI; a <style> block full of rules in one is that proof failing quietly.
      A handful of layout lines is fine — a stylesheet is not. */
{
  const dir = join(GALLERY, "screens");
  if (existsSync(dir)) {
    for (const f of readdirSync(dir).filter((f) => f.endsWith(".html"))) {
      const html = read(join(dir, f));
      const css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join("\n");
      const decls = (css.match(/[a-z-]+\s*:[^;{}]+;/g) || []).length;
      if (decls > 20) fail("screens-compose-not-restyle", `gallery/screens/${f}: ${decls} declarations`);
      if ([...css.matchAll(LITERAL)].length) fail("gallery-uses-tokens", `gallery/screens/${f}`);
      if (!html.includes("themes.js")) {
        fail("screens-are-theme-parameterised",
             `gallery/screens/${f} never imports themes.js — it cannot honour ?theme=`);
      }
    }
  }
}

/* 9. The axis vocabulary is closed at both ends.

      a) A theme may only set --x-* axes the contract DECLARES. Setting one it does not is a typo that
         does nothing, silently, forever — CSS has no such thing as an unknown-property error, so the
         theme author sees their line in the file and assumes it works.
      b) Every axis the contract declares is CONSUMED somewhere. An axis nothing reads is a knob
         wired to nothing: it survives review because it looks used, and the first person to turn it
         is the one who finds out.

      Together these are what stop the contract drifting from the themes in either direction. */
{
  const contract = read(join(SRC, "contract.css"));
  const declared = new Set(
    [...contract.matchAll(/^\s{2}(--x-[a-z0-9-]+)\s*:/gm)].map((m) => m[1]));

  // A MODE is one whose consumption is an attribute selector. Setting it in a theme's CSS is a trap:
  // it looks exactly like setting a scalar, and it does nothing, because applyTheme() writes the
  // attribute from themes.js. Catching it here is the only place anyone finds out.
  const isMode = (axis) => contract.includes(`[data-${axis.replace("--x-", "")}`);

  for (const f of themeFiles) {
    for (const m of read(join(THEMES_DIR, f)).matchAll(/(--x-[a-z0-9-]+)\s*:/g)) {
      if (!declared.has(m[1])) {
        fail("theme-sets-a-real-axis",
             `themes/${f} sets ${m[1]}, which contract.css never declares — it does nothing`);
      } else if (isMode(m[1])) {
        fail("modes-live-in-the-registry",
             `themes/${f} sets ${m[1]} in CSS, but that is a MODE — it does nothing here. `
             + `Set it in src/themes.js instead.`);
      }
    }
  }

  // consumers: anything that READS an axis, anywhere in the system
  const consumers = readdirSync(SRC).filter((f) => f.endsWith(".css"))
    .map((f) => read(join(SRC, f)))
    .concat(themeFiles.map((f) => read(join(THEMES_DIR, f))))
    .join("\n");
  const normalised = consumers.replace(/var\(\s+/g, "var(");
  for (const axis of declared) {
    // a declaration is not a use; look for var(--x-thing) or an attribute selector driving it
    // Two kinds of axis, two kinds of consumption. A SCALAR is read with var(); a MODE is read by an
    // attribute selector, because a discrete choice needs rule blocks rather than a value. Checking
    // only for var() reported all seven modes as dead, which is how this distinction got noticed.
    // Plain string search on a whitespace-normalised copy rather than a regex per axis: an axis name
    // is user data in a pattern, and escaping it correctly is a bug waiting to happen.
    const attr = `[data-${axis.replace("--x-", "")}`;
    if (!normalised.includes(`var(${axis}`) && !normalised.includes(attr)) {
      fail("every-axis-is-consumed", `contract declares ${axis} but nothing reads it`);
    }
  }
}

/* 11. The gallery is navigable — every top-level page links to every other one. Not pedantry: the
       gallery had drifted to four different navs and a landing page with none at all, which left
       `compare.html` — the page the entire comparison method rests on — reachable only by typing its
       URL. A page nobody can get to is a page nobody looks at, and the whole argument for the wall is
       that you have to look. Screens are exempt; they are specimens rendered inside a frame, and
       chrome on one would show up in every pane of the wall. */
if (existsSync(GALLERY)) {
  const pages = readdirSync(GALLERY).filter((f) => f.endsWith(".html"));
  for (const f of pages) {
    const html = read(join(GALLERY, f));
    const missing = pages.filter((o) => o !== f && !html.includes(`href="${o}"`));
    if (missing.length) {
      fail("gallery-is-navigable", `gallery/${f} has no link to ${missing.join(", ")}`);
    }
  }
}

/* 12. The sheet wall shows every sheet. sheets.html hand-lists them because sheets are static files
       with no registry to import — so the list can silently fall behind the directory, and a wall
       that quietly omits your sixth direction looks entirely correct while hiding the option you
       wrote it to consider. Same reasoning as rule 5, different pair of halves. */
{
  const wall = join(GALLERY, "sheets.html");
  const dir = join(ROOT, "sheets");
  if (existsSync(wall) && existsSync(dir)) {
    const html = read(wall);
    const files = readdirSync(dir).filter((f) => f.endsWith(".html") && !f.startsWith("_"));
    for (const f of files) {
      if (!html.includes(f)) fail("wall-shows-every-sheet", `sheets/${f} is missing from sheets.html`);
    }
    for (const m of html.matchAll(/\.\.\/sheets\/([a-z0-9-]+\.html)/g)) {
      if (!files.includes(m[1])) {
        fail("wall-shows-every-sheet", `sheets.html lists sheets/${m[1]}, which does not exist`);
      }
    }
  }
}

/* 13. The docs' axis count is the real axis count. Two files said "fifteen axes" when the contract
       declared twenty-one — written true, drifted silently over six additions, and quoted back with
       total confidence by anyone reading them. A number in prose is a claim like any other, and this
       repo's whole position is that an unchecked claim stops being true. Cheap to verify, so it is. */
{
  const WORDS = { ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
                  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
                  "twenty-one": 21, "twenty-two": 22, "twenty-three": 23, "twenty-four": 24,
                  "twenty-five": 25, "twenty-six": 26, "twenty-seven": 27, "twenty-eight": 28 };
  const actual = [...read(join(SRC, "contract.css")).matchAll(/^ {2}--x-[a-z0-9-]+\s*:/gm)].length;
  const docs = ["AUTHORING.md", "README.md", join("sheets", "README.md")]
    .filter((f) => existsSync(join(ROOT, f)));

  // Only claims about the CONTRACT's axes. The first version of this rule counted the word "axes"
  // anywhere and immediately flagged sheets/README.md's "ten axes" — which is true, and is about
  // DIRECTIONS.md's ten ways to DESCRIBE a direction, a different vocabulary that happens to share
  // the noun. The rule was wrong, not the sentence. Requiring `contract.css` in the same sentence is
  // what makes the two countable things distinguishable.
  for (const f of docs) {
    for (const sentence of read(join(ROOT, f)).split(/(?<=\.)\s+|\n\n/)) {
      if (!sentence.includes("contract.css")) continue;
      for (const m of sentence.matchAll(/\b([a-z]+(?:-[a-z]+)?)\s+(?:of\s+them\s+now|axes)\b/gi)) {
        const word = m[1].toLowerCase();
        const claimed = WORDS[word];
        if (claimed !== undefined && claimed !== actual) {
          fail("docs-count-the-real-axes",
               `${f} says "${word}" axes in contract.css; it declares ${actual}`);
        }
      }
    }
  }
}

/* 10. No box-shadow. Depth here is translucency + a hairline + the page wash showing through, which
      is why it stays crisp in dark mode instead of turning to mud. Stated in the README, so checked. */
for (const f of readdirSync(SRC).filter((f) => f.endsWith(".css"))) {
  if (/box-shadow\s*:\s*(?!none)/.test(read(join(SRC, f)))) {
    fail("no-box-shadow", `src/${f}`);
  }
}

/* 14. The embed renderer's own suite passes. These SVGs ship in READMEs through GitHub's camo
       proxy, whose CSP is unforgiving; the node:test suites under embeds/ are what verify each
       output stays self-contained and inside budget. Run as a child so a test failure fails the
       gate rather than a silent pass. */
{
  const embeds = join(ROOT, "embeds");
  if (existsSync(embeds)) {
    // Explicit file list rather than a directory: `node --test <dir>` delegates to Node's own
    // glob-based discovery, which does not reliably match an absolute Windows path (backslashes),
    // and failed with an opaque MODULE_NOT_FOUND rather than actually discovering the suites.
    const testFiles = readdirSync(embeds).filter((f) => f.endsWith(".test.mjs")).map((f) => join(embeds, f));
    const { spawnSync } = await import("node:child_process");
    const r = spawnSync(process.execPath, ["--test", ...testFiles], { encoding: "utf8" });
    if (r.status !== 0) {
      fail("embed-tests", `node --test embeds/*.test.mjs exited ${r.status}\n${(r.stderr || r.stdout || "").trim().slice(-800)}`);
    }
  }
}

/* ---------------------------------------------------------------------------------------------- */
const RULES = 14;
if (failures.length) {
  console.error(`\n✗ instrument check — ${failures.length} failure(s)\n`);
  for (const { rule, detail } of failures) console.error(`  [${rule}] ${detail}`);
  console.error("\nThese are the invariants README.md and AUTHORING.md promise. Fix the code, or if\n" +
                "the rule is genuinely wrong now, change the rule AND the docs together.\n");
  process.exit(1);
}
console.log(`✓ instrument check — ${RULES} invariants hold across ${themeFiles.length} themes`);
