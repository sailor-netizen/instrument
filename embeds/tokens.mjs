/* ==============================================================================================
   EMBEDS/TOKENS — resolve a theme's render inputs from the real CSS + registry sources.

   The renderer must never hardcode a colour: that is the one invariant scripts/check.mjs enforces
   on every other file under src/ (rule 1), and an embed generator that quietly re-typed a hex would
   be exempt from the rule while claiming to represent the theme it copied it from. So this module
   re-derives every colour and face by parsing src/tokens.css and src/themes/<id>.css exactly as the
   cascade would: read the :root block, overlay the theme's own block on top of it, then resolve
   var() and light-dark() by hand against the ONE color-scheme signal the theme registry declares.
   ============================================================================================== */

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { THEMES } from "../src/themes.js";

const TOKENS_PATH = fileURLToPath(new URL("../src/tokens.css", import.meta.url));

/** Read a CSS source with line endings normalised. On Windows, `core.autocrlf=true` checks the
 *  sources out as CRLF while the committed goldens are pinned `eol=lf` — if checkout EOL reached
 *  the renderer, the same commit would render different bytes on different machines. */
const readCss = (p) => readFileSync(p, "utf8").replace(/\r\n?/g, "\n");

/** The roles the renderer draws with — the subset of L1 colour roles every theme fills (see
 *  scripts/check.mjs rule 2's CORE list, plus the wash roles the poster needs for tag fills). */
export const COLOR_ROLES = [
  "page", "plane", "plane-2", "well", "line", "line-hi", "rail", "ink", "dim", "faint",
  "signal", "machine", "crit", "ok", "signal-wash", "machine-wash", "crit-wash",
];

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");

/** Split `text` on `sep` only where paren depth is 0, so a nested function call's own arguments
 *  (light-dark's two branches, or a colour function's channels) are never mistaken for a split point. */
function splitTopLevel(text, sep) {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    else if (ch === sep && depth === 0) {
      parts.push(text.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(text.slice(start));
  return parts;
}

/**
 * Strip /* *\/ comments, then return the declarations of the FIRST block whose selector is
 * EXACTLY `selector` (e.g. ":root" or '[data-theme="swiss"]'), as a Map name -> rawValue.
 * @param {string} cssText
 * @param {string} selector
 * @returns {Map<string,string>}
 */
export function parseVarBlock(cssText, selector) {
  const css = stripComments(cssText);
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const open = new RegExp(`${escaped}\\s*\\{`).exec(css);
  const map = new Map();
  if (!open) return map;

  let depth = 1;
  let i = open.index + open[0].length;
  const bodyStart = i;
  for (; i < css.length && depth > 0; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}") depth--;
  }
  const body = css.slice(bodyStart, i - 1);

  for (const decl of splitTopLevel(body, ";")) {
    const trimmed = decl.trim();
    if (!trimmed) continue;
    const colon = trimmed.indexOf(":");
    if (colon === -1) continue;
    const name = trimmed.slice(0, colon).trim();
    const value = trimmed.slice(colon + 1).trim();
    map.set(name, value);
  }
  return map;
}

/**
 * Recursively resolve a var()/light-dark() value to a literal.
 * @param {string} rawOrName
 * @param {Map<string,string>} vars
 * @param {"light"|"dark"} usedScheme
 * @returns {string}
 */
export function resolveValue(rawOrName, vars, usedScheme) {
  const input = rawOrName.trim();

  const varMatch = /^var\(\s*(--[\w-]+)\s*\)$/.exec(input);
  if (varMatch) {
    const name = varMatch[1];
    if (!vars.has(name)) {
      throw new Error(`Unresolved CSS variable: ${name}`);
    }
    return resolveValue(vars.get(name), vars, usedScheme);
  }

  const ldMatch = /^light-dark\(\s*([\s\S]*)\)$/.exec(input);
  if (ldMatch) {
    const [light, dark] = splitTopLevel(ldMatch[1], ",").map((s) => s.trim());
    return resolveValue(usedScheme === "light" ? light : dark, vars, usedScheme);
  }

  // A resolved literal is collapsed to single-spaced text: theme CSS declares its font stacks
  // across multiple indented lines, and copying that whitespace verbatim into attributes would
  // bloat every output and make its bytes depend on the source file's line endings.
  return input.replace(/\s+/g, " ");
}

/**
 * Resolve one theme's render inputs from the real CSS + registry sources.
 * @param {string} themeId — a THEMES id
 * @returns {{
 *   id: string,
 *   scheme: string,
 *   axes: import('../src/themes.js').Theme,
 *   colors: Record<string, string>,
 *   fonts: { mono: string, prose: string, display: string, chrome: string },
 *   atmosphere: { signal: string, machine: string }
 * }}
 * @throws {Error} if themeId is not in THEMES
 */
export function resolveTheme(themeId) {
  const axes = THEMES.find((t) => t.id === themeId);
  if (!axes) {
    const known = THEMES.map((t) => t.id).join(", ");
    throw new Error(`Unknown theme id: "${themeId}". Known: ${known}`);
  }

  const tokensCss = readCss(TOKENS_PATH);
  const root = parseVarBlock(tokensCss, ":root");

  const themeCssPath = fileURLToPath(new URL(`../src/themes/${themeId}.css`, import.meta.url));
  const theme = existsSync(themeCssPath)
    ? parseVarBlock(readCss(themeCssPath), `[data-theme="${themeId}"]`)
    : new Map();

  const vars = new Map(root);
  for (const [k, v] of theme) vars.set(k, v);

  const usedScheme = axes.scheme.split(/\s+/)[0];

  const colors = {};
  for (const role of COLOR_ROLES) {
    colors[role] = resolveValue(`var(--i-${role})`, vars, usedScheme);
  }

  const mono = resolveValue("var(--i-mono)", vars, usedScheme);
  const prose = resolveValue("var(--i-prose)", vars, usedScheme);
  const display = vars.has("--i-display-face")
    ? resolveValue("var(--i-display-face)", vars, usedScheme)
    : mono;
  const chrome = vars.has("--i-chrome-face")
    ? resolveValue("var(--i-chrome-face)", vars, usedScheme)
    : mono;

  // The atmosphere washes (page-level corner glows) are a separate pair of roles from the tag
  // washes above — every theme with an opaque or flat surface direction (Blueprint, Swiss,
  // Terminal, Beacon) turns them off, which the poster's background region must honour.
  const atmosphere = {
    signal: resolveValue("var(--i-wash-signal)", vars, usedScheme),
    machine: resolveValue("var(--i-wash-machine)", vars, usedScheme),
  };

  return {
    id: themeId, scheme: axes.scheme, axes, colors, fonts: { mono, prose, display, chrome }, atmosphere,
  };
}
