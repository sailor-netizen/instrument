import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { THEMES } from "../src/themes.js";
import { renderPoster, renderTile } from "./render.mjs";
import { validate } from "./validate.mjs";
import { parseVarBlock, resolveTheme, resolveValue } from "./tokens.mjs";

const POSTERS_DIR = fileURLToPath(new URL("posters/", import.meta.url));

test("every registry theme renders a poster and a tile", () => {
  for (const t of THEMES) {
    const poster = renderPoster(t.id);
    assert.ok(poster.startsWith("<svg"), `${t.id} poster should start with <svg`);
    assert.match(poster, /viewBox/);

    const tile = renderTile(t.id);
    assert.ok(tile.startsWith("<svg"), `${t.id} tile should start with <svg`);
    assert.match(tile, /viewBox/);
  }
});

test("unknown theme id throws a clear error", () => {
  assert.throws(() => renderPoster("nope"), /Unknown theme id: "nope"/);
  assert.throws(() => renderTile("nope"), /Unknown theme id: "nope"/);
});

test("rendering is deterministic for a given seed, and seed-sensitive across seeds", () => {
  // Seed variation lives in the tag-row animation delays; comparing the extracted delay lists
  // across several seed pairs makes a coincidental full collision (the flake risk of comparing
  // whole documents on one pair, since each delay rounds to 2 decimals) practically impossible.
  const delays = (svg) => [...svg.matchAll(/animation-delay:([\d.]+)s/g)].map((m) => m[1]).join(",");
  const pairs = [[3, 9], [1, 2], [7, 13]];

  for (const t of THEMES) {
    const a = renderPoster(t.id, { seed: 3 });
    const b = renderPoster(t.id, { seed: 3 });
    assert.strictEqual(a, b, `${t.id} poster should be byte-identical across identical calls`);

    const sensitive = pairs.some(([s1, s2]) =>
      delays(renderPoster(t.id, { seed: s1 })) !== delays(renderPoster(t.id, { seed: s2 })));
    assert.ok(sensitive, `${t.id} poster should vary with the seed`);
  }
});

test("resolved values and rendered output are line-ending independent", () => {
  // Regression guard for the Windows checkout trap: `core.autocrlf=true` delivers the CSS sources
  // as CRLF while the goldens are pinned `eol=lf`. Values must resolve to the same bytes either
  // way, and no CR may ever reach a rendered document.
  const crlfCss = ':root {\r\n  --i-mono: ui-monospace,\r\n      "Test Mono",\r\n      monospace;\r\n}\r\n';
  const vars = parseVarBlock(crlfCss, ":root");
  assert.strictEqual(resolveValue("var(--i-mono)", vars, "dark"), 'ui-monospace, "Test Mono", monospace');

  for (const t of THEMES) {
    assert.ok(!renderPoster(t.id).includes("\r"), `${t.id} poster must not contain CR bytes`);
    assert.ok(!renderTile(t.id).includes("\r"), `${t.id} tile must not contain CR bytes`);
  }
});

test("every rendered poster and tile is self-contained", () => {
  for (const t of THEMES) {
    const posterResult = validate(renderPoster(t.id));
    assert.strictEqual(posterResult.ok, true, `${t.id} poster: ${JSON.stringify(posterResult.violations)}`);

    const tileResult = validate(renderTile(t.id));
    assert.strictEqual(tileResult.ok, true, `${t.id} tile: ${JSON.stringify(tileResult.violations)}`);
  }
});

test("surface:none themes (Terminal) draw no plates", () => {
  const noSurface = THEMES.filter((t) => t.surface === "none");
  assert.ok(noSurface.length > 0, "expected at least one surface:none theme in the registry");
  for (const t of noSurface) {
    assert.doesNotMatch(renderPoster(t.id), /class="plate"/, `${t.id} should draw no class="plate"`);
  }
});

test("grid:fine themes (Blueprint) paint a grid, and annotate:1 themes number their stats", () => {
  const fineGrid = THEMES.filter((t) => t.grid === "fine");
  assert.ok(fineGrid.length > 0, "expected at least one grid:fine theme in the registry");
  for (const t of fineGrid) {
    assert.match(renderPoster(t.id), /class="grid"/, `${t.id} should paint a grid group`);
  }

  const annotated = THEMES.filter((t) => t.annotate === 1);
  assert.ok(annotated.length > 0, "expected at least one annotate:1 theme in the registry");
  for (const t of annotated) {
    assert.match(renderPoster(t.id), /M-0\d/, `${t.id} should carry item numbers like M-01`);
  }
});

test("swiss's sole accent hue is its own resolved crit colour", () => {
  const svg = renderPoster("swiss");
  const crit = resolveTheme("swiss").colors.crit;

  const fills = [...svg.matchAll(/<[a-z]+ class="[^"]*\baccent\b[^"]*"[^>]*\sfill="([^"]+)"/g)].map((m) => m[1]);
  const strokes = [...svg.matchAll(/<[a-z]+ class="[^"]*\baccent\b[^"]*"[^>]*\sstroke="([^"]+)"/g)].map((m) => m[1]);
  const distinct = new Set([...fills, ...strokes].filter((c) => c && c !== "none"));

  assert.strictEqual(distinct.size, 1, `expected exactly one accent hue, got ${[...distinct]}`);
  assert.ok(distinct.has(crit), `the one accent hue should be swiss's resolved --i-crit (${crit})`);
});

test("golden snapshots byte-compare against embeds/posters/<id>.<form>.svg", () => {
  mkdirSync(POSTERS_DIR, { recursive: true });
  const forms = [["poster", renderPoster], ["tile", renderTile]];

  for (const t of THEMES) {
    for (const [form, render] of forms) {
      const file = join(POSTERS_DIR, `${t.id}.${form}.svg`);
      const fresh = render(t.id);

      if (!existsSync(file)) {
        // Bootstraps the golden on first run so this suite (and `npm run check`, which spawns it)
        // can pass without a separate manual step. `node embeds/cli.mjs` is the real regeneration
        // command — run it and commit the result whenever a change to render.mjs is intentional;
        // this branch only covers a golden that has never been committed at all.
        writeFileSync(file, fresh, "utf8");
        continue;
      }

      const golden = readFileSync(file, "utf8");
      assert.strictEqual(fresh, golden,
        `${t.id}.${form}.svg drifted from its committed golden — regenerate with \`node embeds/cli.mjs\` ` +
        `and commit the result if the change is intentional.`);
    }
  }
});
