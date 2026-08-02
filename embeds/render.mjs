/* ==============================================================================================
   EMBEDS/RENDER — the README-embed SVG poster renderer.

   Renders a miniature instrument dashboard — context bar, title row, three stats, a small table,
   a tag row, one primary button — for a given theme. Colour and type are resolved from the real
   theme sources by tokens.mjs; structure (which axis draws which way) comes from the registry entry
   in src/themes.js. This file only ever reads `theme.colors.*` / `theme.fonts.*` / `theme.axes.*` —
   never a literal — so a re-skin of a theme's CSS re-skins its poster with no change here.

   Determinism is the other hard requirement (these are committed goldens, byte-compared in
   render.test.mjs): the only source of variation is the seeded PRNG from svg.mjs, attribute order
   is fixed in every builder, and there is no Date/Math.random anywhere in this file.
   ============================================================================================== */

import { resolveTheme } from "./tokens.mjs";
import { esc, num, rng, rect, line, circle, text, group, styleBlock } from "./svg.mjs";

const POSTER = { w: 1200, h: 630 };
const TILE = { w: 600, h: 180 };

// Fixed, instrument-flavoured copy. The seed perturbs only decorative geometry (tick heights, fade
// delays) — never this text — so a golden snapshot stays a meaningful comparison across themes.
const COPY = {
  scope: "FLEETDECK",
  facts: [["runs", "128"], ["spend", "$41.20"]],
  title: "Cockpit",
  sub: "Watch the fleet work, approve what it did.",
  primary: "Start a run",
  stats: [
    { v: "07", l: "agent runs" },
    { v: "1.1M", l: "tokens" },
    { v: "00", l: "gates failed" },
  ],
  tableHead: ["agent", "started", "verdict"],
  tableRows: [
    ["review", "09:14", "ok"],
    ["builder", "08:02", "ok"],
    ["sysadmin", "22:07", "crit"],
  ],
  tags: [
    { label: "read only", tone: "machine" },
    { label: "changes things", tone: "signal" },
    { label: "approved", tone: "ok" },
    { label: "error", tone: "crit" },
  ],
};

/** How Panel/Card/Row/Stat draw themselves, per `axes.surface`. `none`/`rule` never emit a plate —
 *  that absence is exactly what the Terminal structure test keys on. */
function plate(axes, colors, x, y, w, h) {
  switch (axes.surface) {
    case "tile":
      return rect({ x, y, w, h, rx: 8, fill: colors.plane, stroke: colors.line, sw: 1, cls: "plate" });
    case "outline":
      return rect({ x, y, w, h, rx: 0, fill: "none", stroke: colors["line-hi"], sw: 1.5, cls: "plate" });
    case "rule":
      return line({ x1: x, y1: y, x2: x + w, y2: y, stroke: colors.line, sw: 1, cls: "rule" });
    default:
      return "";
  }
}

/** Blueprint's signature corner mark: a plate is held to the sheet by two hard ticks. */
function registrationTick(colors, x, y) {
  const len = 9;
  return line({ x1: x, y1: y, x2: x + len, y2: y, stroke: colors.signal, sw: 2, cls: "tick" }) +
    line({ x1: x, y1: y, x2: x, y2: y + len, stroke: colors.signal, sw: 2, cls: "tick" });
}

/** A ruled span with a tick turned down at each end — the sheet stating an extent. */
function dimensionLine(colors, x, y, w) {
  const tick = 6;
  return line({ x1: x, y1: y, x2: x + w, y2: y, stroke: colors.line, sw: 1, cls: "dim" }) +
    line({ x1: x, y1: y, x2: x, y2: y + tick, stroke: colors.line, sw: 1, cls: "dim" }) +
    line({ x1: x + w, y1: y, x2: x + w, y2: y + tick, stroke: colors.line, sw: 1, cls: "dim" });
}

/** A small outline pill. Crit is the one role every theme keeps as a genuine hue (contract.css:
 *  "never change what a role means"), so it is the only tone marked `accent` — the class an
 *  accent-hue count can key on without being wrong the moment a theme collapses signal/machine/ok
 *  into ink, the way Swiss deliberately does. */
function tagChip(colors, fonts, x, y, w, h, label, tone) {
  const toneColor = colors[tone] ?? colors.dim;
  const wash = colors[`${tone}-wash`];
  const fill = wash && wash !== "transparent" ? wash : "none";
  const cls = tone === "crit" ? "tag accent" : "tag";
  return rect({ x, y, w, h, rx: h / 2, fill, stroke: toneColor, sw: 1, cls }) +
    text({
      x: x + w / 2, y: y + h / 2 + h * 0.16, cls: "tag-label", fill: toneColor, family: fonts.chrome,
      anchor: "middle", size: h * 0.42, weight: 600, spacing: "0.04em", children: esc(label.toUpperCase()),
    });
}

function bgRegion(colors, atmosphere, width, height) {
  let out = rect({ x: 0, y: 0, w: width, h: height, fill: colors.page, cls: "page" });
  if (atmosphere.signal !== "transparent") {
    out += circle({ cx: 0, cy: 0, r: width * 0.55, fill: atmosphere.signal, cls: "atmosphere" });
  }
  if (atmosphere.machine !== "transparent") {
    out += circle({ cx: width, cy: height, r: width * 0.55, fill: atmosphere.machine, cls: "atmosphere" });
  }
  return out;
}

/** Painted on the stage per `axes.grid` — absent entirely when `none`, matching contract.css. */
function gridRegion(colors, axes, x, y, w, h, animate) {
  let out = "";
  const cols = 12;
  const colStep = w / cols;
  for (let i = 1; i < cols; i++) {
    const gx = x + i * colStep;
    out += line({ x1: gx, y1: y, x2: gx, y2: y + h, stroke: colors.line, sw: 1, cls: "gridline" });
  }
  if (axes.grid === "fine") {
    const rowStep = 40;
    for (let ry = y; ry <= y + h; ry += rowStep) {
      out += line({ x1: x, y1: ry, x2: x + w, y2: ry, stroke: colors.line, sw: 1, cls: "gridline" });
    }
  }
  // The sweep: a faint line translating across the painted field. Only where there is a field to
  // sweep across — a theme with no grid has no "across" for it to mean.
  if (animate) {
    out += line({ x1: x, y1: y, x2: x, y2: y + h, stroke: colors.faint, sw: 1, cls: "sweep" });
  }
  return out;
}

function ctxBarRegion(theme, x, y, w, h, animate) {
  const { colors, fonts } = theme;
  const dotR = h * 0.24;
  let out = circle({ cx: x + dotR, cy: y + h / 2, r: dotR, fill: colors.ok, cls: animate ? "dot-pulse" : "dot" });
  out += text({
    x: x + dotR * 2 + 10, y: y + h / 2 + h * 0.16, cls: "scope", fill: colors.ink, family: fonts.mono,
    size: h * 0.42, weight: 700, spacing: "0.08em", children: esc(COPY.scope),
  });
  let fx = x + w * 0.32;
  for (const [k, v] of COPY.facts) {
    out += text({
      x: fx, y: y + h / 2 + h * 0.16, cls: "fact", fill: colors.dim, family: fonts.mono, size: h * 0.36,
      children: esc(`${k} ${v}`),
    });
    fx += w * 0.16;
  }
  const tagW = w * 0.11, tagH = h * 0.76, tagY = y + (h - tagH) / 2;
  out += tagChip(colors, fonts, x + w - tagW * 2 - 8, tagY, tagW, tagH, "live", "machine");
  out += tagChip(colors, fonts, x + w - tagW, tagY, tagW, tagH, "urgent", "signal");
  return out;
}

function viewHeadRegion(theme, x, y, w, h) {
  const { axes, colors, fonts } = theme;
  const titleSize = h * 0.4;
  let out = text({
    x, y: y + titleSize, cls: "i-h1", fill: colors.ink, family: fonts.display, size: titleSize,
    weight: 700, children: esc(`${axes.name} ${COPY.title}`),
  });
  out += text({
    x, y: y + titleSize + h * 0.32, cls: "i-sub", fill: colors.dim, family: fonts.prose,
    size: h * 0.2, children: esc(COPY.sub),
  });
  const btnW = w * 0.2, btnH = h * 0.36;
  const bx = x + w - btnW, by = y + h - btnH;
  const filled = axes.emphasis === "fill";
  const fill = filled ? colors.signal : "none";
  const stroke = filled ? colors.signal : colors.line;
  const labelFill = filled ? colors.page : colors.signal;
  out += rect({ x: bx, y: by, w: btnW, h: btnH, rx: 6, fill, stroke, sw: 1, cls: "btn is-primary" });
  out += text({
    x: bx + btnW / 2, y: by + btnH / 2 + btnH * 0.16, cls: "btn-label", fill: labelFill,
    family: fonts.chrome, anchor: "middle", size: btnH * 0.34, weight: 600, spacing: "0.05em",
    children: esc(COPY.primary),
  });
  return out;
}

function statsRegion(theme, x, y, w, h, gap) {
  const { axes, colors, fonts } = theme;
  const n = COPY.stats.length;
  const hero = axes.hero === 1;
  const units = hero ? n + 1 : n;
  // `units` conceptual equal-width tracks with `units - 1` gaps between them; the hero item spans
  // two adjacent tracks plus the gap between them, exactly as a CSS grid `span 2` item would.
  const unit = (w - gap * (units - 1)) / units;
  const widths = hero ? [unit * 2 + gap, unit, unit] : [unit, unit, unit];
  let cx = x;
  let out = "";
  widths.forEach((cw, i) => {
    const s = COPY.stats[i];
    out += plate(axes, colors, cx, y, cw, h);
    if (axes.annotate === 1) {
      out += registrationTick(colors, cx + 3, y + 3);
      out += text({
        x: cx + cw - 8, y: y + 14, cls: "item-no", fill: colors.faint, family: fonts.mono,
        anchor: "end", size: 9, spacing: "0.06em", children: esc(`M-${String(i + 1).padStart(2, "0")}`),
      });
    }
    const vSize = hero && i === 0 ? h * 0.4 : h * 0.28;
    out += text({
      x: cx + 12, y: y + h * 0.62, cls: "i-stat-v", fill: colors.ink, family: fonts.display,
      size: vSize, weight: 700, children: esc(s.v),
    });
    out += text({
      x: cx + 12, y: y + h - 10, cls: "i-stat-l", fill: colors.dim, family: fonts.chrome,
      size: h * 0.13, spacing: "0.05em", children: esc(s.l),
    });
    cx += cw + gap;
  });
  if (axes.annotate === 1) out += dimensionLine(colors, x, y + h + 12, w);
  return out;
}

function tableRegion(theme, x, y, w, h) {
  const { axes, colors, fonts } = theme;
  const headH = h * 0.22;
  const rows = COPY.tableRows;
  const rowH = (h - headH) / rows.length;
  let out = plate(axes, colors, x, y, w, h);
  out += text({
    x: x + 12, y: y + headH * 0.66, cls: "i-tr-head", fill: colors.dim, family: fonts.chrome,
    size: headH * 0.42, weight: 600, spacing: "0.06em",
    children: esc(COPY.tableHead.join("     ").toUpperCase()),
  });
  out += line({ x1: x, y1: y + headH, x2: x + w, y2: y + headH, stroke: colors.line, sw: 1 });
  rows.forEach((row, i) => {
    const ry = y + headH + i * rowH;
    if (axes.band === "rows" && i % 2 === 1) {
      out += rect({ x, y: ry, w, h: rowH, fill: colors.plane, cls: "band" });
    }
    out += text({
      x: x + 12, y: ry + rowH * 0.62, cls: "i-tr-cell", fill: colors.ink, family: fonts.mono,
      size: rowH * 0.34, children: esc(row[0]),
    });
    out += text({
      x: x + w * 0.42, y: ry + rowH * 0.62, cls: "i-tr-cell", fill: colors.dim, family: fonts.mono,
      size: rowH * 0.34, children: esc(row[1]),
    });
    const tone = row[2] === "crit" ? "crit" : "ok";
    out += tagChip(colors, fonts, x + w * 0.74, ry + rowH * 0.28, w * 0.2, rowH * 0.44, row[2], tone);
  });
  if (axes.annotate === 1) out += dimensionLine(colors, x, y + h + 12, w);
  return out;
}

function tagsRegion(theme, x, y, w, h, animate, rand) {
  const { colors, fonts } = theme;
  const tags = COPY.tags;
  const gap = 10;
  const tagW = (w - gap * (tags.length - 1)) / tags.length;
  let cx = x;
  let out = "";
  tags.forEach((t, i) => {
    let chip = tagChip(colors, fonts, cx, y, tagW, h, t.label, t.tone);
    if (animate) {
      const delay = num(i * 0.18 + rand() * 0.12);
      chip = group("rise", chip, ` style="animation-delay:${delay}s"`);
    }
    out += chip;
    cx += tagW + gap;
  });
  return out;
}

function eyebrow(colors, fonts, x, y, label, trailing, rightEdge) {
  let out = text({
    x, y, cls: "eyebrow", fill: colors.signal, family: fonts.chrome, size: 11, weight: 600,
    spacing: "0.14em", children: esc(label.toUpperCase()),
  });
  if (trailing) {
    const labelW = label.length * 7.2 + 4;
    out += line({ x1: x + labelW, y1: y - 4, x2: rightEdge, y2: y - 4, stroke: colors.line, sw: 1, cls: "rule" });
  }
  return out;
}

/** All motion in one inline `<style>` — CSS keyframes only, no script, no SMIL. Every loop is
 *  >=3s and non-flashing; the reduced-motion query strips transforms/durations to opacity-only,
 *  mirroring tokens.css's own `prefers-reduced-motion` stance. */
function animationCss(width, margin) {
  const sweepDistance = width - 2 * margin;
  return `
@keyframes i-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
@keyframes i-sweep { from { transform: translateX(0); } to { transform: translateX(${num(sweepDistance)}px); } }
@keyframes i-rise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
.dot-pulse { animation: i-pulse 4s ease-in-out infinite; }
.sweep { animation: i-sweep 6s linear infinite; }
.rise { opacity: 0; animation: i-rise 0.5s ease-out forwards; }
@media (prefers-reduced-motion: reduce) {
  .dot-pulse, .sweep, .rise { animation: none; }
  .dot-pulse { opacity: 1; }
  .rise { opacity: 1; transform: none; }
  .sweep { opacity: 0; }
}`.trim();
}

function compose(form, themeId, options) {
  const theme = resolveTheme(themeId);
  const { axes, colors, fonts, atmosphere } = theme;
  const seed = options.seed ?? 0;
  const animate = options.animate !== false;
  const dims = form === "tile" ? TILE : POSTER;
  const width = options.width ?? dims.w;
  const height = options.height ?? dims.h;
  const rand = rng(seed);

  const margin = form === "tile" ? 14 : 40;
  const x0 = margin;
  const w = width - margin * 2;
  let y = margin;
  let body = "";

  body += group("bg", bgRegion(colors, atmosphere, width, height));

  if (axes.grid !== "none") {
    body += group("grid", gridRegion(colors, axes, x0, y, w, height - margin * 2, animate));
  }

  if (axes.shell === "rail") {
    body += line({ x1: 1.5, y1: 0, x2: 1.5, y2: height, stroke: colors.rail, sw: 3, cls: "shell-rail" });
  }

  const ctxH = form === "tile" ? 16 : 26;
  body += group("ctxbar", ctxBarRegion(theme, x0, y, w, ctxH, animate));
  y += ctxH + (form === "tile" ? 10 : 18);

  const headH = form === "tile" ? 26 : 64;
  body += group("viewhead", viewHeadRegion(theme, x0, y, w, headH));
  y += headH + (form === "tile" ? 10 : 20);

  if (axes.sectionRule === "trailing") {
    body += eyebrow(colors, fonts, x0, y, "Today", true, x0 + w);
    y += 16;
  }

  const statsH = form === "tile" ? 46 : 100;
  body += group("stats", statsRegion(theme, x0, y, w, statsH, form === "tile" ? 10 : 16));
  y += statsH + (axes.annotate === 1 ? 16 : 0) + (form === "tile" ? 10 : 20);

  if (form === "poster") {
    if (axes.sectionRule === "trailing") {
      body += eyebrow(colors, fonts, x0, y, "Run ledger", true, x0 + w);
      y += 20;
    }
    const tableH = 110;
    body += group("table", tableRegion(theme, x0, y, w, tableH));
    y += tableH + (axes.annotate === 1 ? 16 : 0) + 20;
  }

  const tagsH = form === "tile" ? 20 : 26;
  body += group("tags", tagsRegion(theme, x0, y, w, tagsH, animate, rand));

  if (axes.shell === "statusbar") {
    const barH = form === "tile" ? 10 : 18;
    body += rect({ x: 0, y: height - barH, w: width, h: barH, fill: colors.well, cls: "shell-statusbar" });
    body += line({ x1: 0, y1: height - barH, x2: width, y2: height - barH, stroke: colors.line, sw: 1 });
  }

  if (axes.shell === "titleblock") {
    const bw = form === "tile" ? 70 : 140;
    const bh = form === "tile" ? 22 : 34;
    const by = margin - (form === "tile" ? 10 : 16);
    body += rect({
      x: width - margin - bw, y: by, w: bw, h: bh, fill: "none", stroke: colors["line-hi"], sw: 1,
      cls: "shell-titleblock",
    });
    body += text({
      x: width - margin - bw + 8, y: by + bh / 2 + 4, fill: colors.faint, family: fonts.mono,
      size: form === "tile" ? 7 : 9, spacing: "0.08em", children: esc(axes.name.toUpperCase()),
    });
  }

  if (animate) {
    body = styleBlock(animationCss(width, margin)) + body;
  }

  const label = esc(`${axes.name} — instrument theme ${form}`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${num(width)} ${num(height)}" ` +
    `width="${num(width)}" height="${num(height)}" role="img" aria-label="${label}">${body}</svg>`;
}

/**
 * Render a fully self-contained, subtly animated SVG poster for a theme (README embed). Colours
 * and type are parsed from src/themes/<id>.css + src/tokens.css at call time; structure follows
 * the src/themes.js registry entry. Output is byte-deterministic for a given (themeId, options).
 * @param {string} themeId — a THEMES id; unknown ids throw.
 * @param {{ seed?: number, animate?: boolean, width?: number, height?: number }} [options]
 *   seed default 0 (drives only decorative variation). animate default true.
 * @returns {string} a standalone <svg>…</svg> document string.
 * @throws {Error} on unknown themeId.
 */
export function renderPoster(themeId, options = {}) {
  return compose("poster", themeId, options);
}

/**
 * As renderPoster, but the compact strip form: viewBox ~600x180, a cropped, denser subset of the
 * same regions.
 * @param {string} themeId
 * @param {{ seed?: number, animate?: boolean, width?: number, height?: number }} [options]
 * @returns {string}
 * @throws {Error} on unknown themeId.
 */
export function renderTile(themeId, options = {}) {
  return compose("tile", themeId, options);
}
