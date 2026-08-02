/* ==============================================================================================
   EMBEDS/VALIDATE — enforce README-embed self-containment against GitHub's camo CSP.

   Camo (the proxy GitHub serves README images through) verified live at:
     default-src none; img-src data:; style-src unsafe-inline
   which means an embedded SVG gets exactly one network-free budget: inline styles are fine,
   everything else that could reach outside the document is not. This module is the gate that
   proves a rendered poster/tile actually stays inside that budget, so a regression in render.mjs
   fails loud in embeds/render.test.mjs instead of silently breaking on GitHub.
   ============================================================================================== */

const BUDGETS = { tile: 30 * 1024, poster: 80 * 1024 };

function stripBom(s) {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

/** Any href/src/xlink:href or url(...) reference that leaves the document. `#frag` and `data:`
 *  are the only references camo's `img-src data:` allows through — everything else is a network
 *  fetch the proxy has no directive for. */
function findExternalUrl(svg) {
  const isExempt = (val) => /^#/.test(val) || /^data:/i.test(val);
  const isExternal = (val) => /^https?:\/\//i.test(val) || /^\/\//.test(val);

  for (const m of svg.matchAll(/\b(?:href|src|xlink:href)\s*=\s*"([^"]*)"/gi)) {
    if (!isExempt(m[1]) && isExternal(m[1])) return m[0];
  }
  for (const m of svg.matchAll(/url\(\s*(['"]?)([^'")]*)\1\s*\)/gi)) {
    if (!isExempt(m[2]) && isExternal(m[2])) return m[0];
  }
  return null;
}

function inferKind(svg) {
  const m = /viewBox\s*=\s*"([^"]*)"/.exec(svg);
  if (!m) return "poster";
  const parts = m[1].trim().split(/\s+/).map(Number);
  const width = parts[2];
  return Number.isFinite(width) && width <= 600 ? "tile" : "poster";
}

/**
 * Enforce README-embed self-containment + size budgets on a rendered SVG.
 * @param {string} svg
 * @param {{ maxBytes?: number, kind?: "poster"|"tile" }} [options]
 * @returns {{ ok: boolean, violations: Array<{ rule: string, detail: string }> }}
 */
export function validate(svg, options = {}) {
  const violations = [];
  const add = (rule, detail) => violations.push({ rule, detail });

  const body = stripBom(svg).trimStart();
  if (!body.startsWith("<svg")) {
    add("not-svg", "document does not start with <svg");
    return { ok: false, violations };
  }

  const external = findExternalUrl(svg);
  if (external) add("external-url", external);

  if (/@import\b/i.test(svg)) add("import", "@import present");
  if (/@font-face\b/i.test(svg)) add("font-face", "@font-face present");
  if (/<script\b/i.test(svg)) add("script-element", "<script> present");

  const handler = /\son[a-z]+\s*=/i.exec(svg);
  if (handler) add("event-handler", handler[0].trim());

  const kind = options.kind ?? inferKind(svg);
  const budget = options.maxBytes ?? BUDGETS[kind];
  const size = Buffer.byteLength(svg, "utf8");
  if (size > budget) add("oversize", `${size} B > ${budget} B (${kind})`);

  return { ok: violations.length === 0, violations };
}

async function runCli() {
  const { readdirSync, readFileSync } = await import("node:fs");
  const { join } = await import("node:path");

  const dir = process.argv[2] ?? "embeds/posters";
  const files = readdirSync(dir).filter((f) => f.endsWith(".svg"));
  let anyInvalid = false;

  for (const f of files) {
    const svg = readFileSync(join(dir, f), "utf8");
    const kind = f.endsWith(".tile.svg") ? "tile" : "poster";
    const { ok, violations } = validate(svg, { kind });
    if (ok) {
      console.log(`✓ ${f}`);
    } else {
      anyInvalid = true;
      console.log(`✗ ${f}`);
      for (const v of violations) console.log(`  [${v.rule}] ${v.detail}`);
    }
  }

  if (anyInvalid) process.exit(1);
}

const { fileURLToPath } = await import("node:url");
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) await runCli();
