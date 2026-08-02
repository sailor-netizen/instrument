/* ==============================================================================================
   EMBEDS/SVG — dependency-free SVG primitives.

   No colour literal lives here: every fill/stroke arrives as an argument already resolved by
   tokens.mjs. Attribute emission order is FIXED per builder (not derived from call-site key order)
   so two renders of the same inputs are byte-identical — that determinism is what makes the golden
   snapshot test in render.test.mjs meaningful instead of flaky.
   ============================================================================================== */

/** XML-escape text content. @param {string} s @returns {string} */
export function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Stable number formatting: two fixed decimals, no locale grouping, no exponent notation.
 *  @param {number} x @returns {string} */
export function num(x) {
  const fixed = Number(x.toFixed(2));
  return Object.is(fixed, -0) ? "0" : fixed.toString();
}

/** A mulberry32 PRNG seeded deterministically — the only entropy source the renderer may use.
 *  @param {number} seed @returns {() => number} float in [0, 1) */
export function rng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const attr = (name, value) => (value === undefined || value === null ? "" : ` ${name}="${value}"`);

/**
 * @param {{x?:number,y?:number,w?:number,h?:number,rx?:number,fill?:string,stroke?:string,
 *          sw?:number,cls?:string,opacity?:number}} props
 * @returns {string}
 */
export function rect({ x, y, w, h, rx, fill, stroke, sw, cls, opacity } = {}) {
  return `<rect${attr("class", cls)}${attr("x", x !== undefined ? num(x) : undefined)}` +
    `${attr("y", y !== undefined ? num(y) : undefined)}${attr("width", w !== undefined ? num(w) : undefined)}` +
    `${attr("height", h !== undefined ? num(h) : undefined)}${attr("rx", rx !== undefined ? num(rx) : undefined)}` +
    `${attr("fill", fill)}${attr("stroke", stroke)}${attr("stroke-width", sw !== undefined ? num(sw) : undefined)}` +
    `${attr("opacity", opacity !== undefined ? num(opacity) : undefined)}/>`;
}

/**
 * @param {{x1?:number,y1?:number,x2?:number,y2?:number,stroke?:string,sw?:number,cls?:string,
 *          dash?:string}} props
 * @returns {string}
 */
export function line({ x1, y1, x2, y2, stroke, sw, cls, dash } = {}) {
  return `<line${attr("class", cls)}${attr("x1", x1 !== undefined ? num(x1) : undefined)}` +
    `${attr("y1", y1 !== undefined ? num(y1) : undefined)}${attr("x2", x2 !== undefined ? num(x2) : undefined)}` +
    `${attr("y2", y2 !== undefined ? num(y2) : undefined)}${attr("stroke", stroke)}` +
    `${attr("stroke-width", sw !== undefined ? num(sw) : undefined)}${attr("stroke-dasharray", dash)}/>`;
}

/**
 * @param {{cx?:number,cy?:number,r?:number,fill?:string,stroke?:string,sw?:number,cls?:string,
 *          opacity?:number}} props
 * @returns {string}
 */
export function circle({ cx, cy, r, fill, stroke, sw, cls, opacity } = {}) {
  return `<circle${attr("class", cls)}${attr("cx", cx !== undefined ? num(cx) : undefined)}` +
    `${attr("cy", cy !== undefined ? num(cy) : undefined)}${attr("r", r !== undefined ? num(r) : undefined)}` +
    `${attr("fill", fill)}${attr("stroke", stroke)}${attr("stroke-width", sw !== undefined ? num(sw) : undefined)}` +
    `${attr("opacity", opacity !== undefined ? num(opacity) : undefined)}/>`;
}

/**
 * @param {{x?:number,y?:number,cls?:string,fill?:string,children?:string,anchor?:string,
 *          size?:number,weight?:number|string,spacing?:string,family?:string}} props
 * @returns {string}
 */
export function text({ x, y, cls, fill, children, anchor, size, weight, spacing, family } = {}) {
  const open = `<text${attr("class", cls)}${attr("x", x !== undefined ? num(x) : undefined)}` +
    `${attr("y", y !== undefined ? num(y) : undefined)}${attr("text-anchor", anchor)}` +
    `${attr("font-family", family !== undefined ? esc(family) : undefined)}` +
    `${attr("font-size", size !== undefined ? num(size) : undefined)}` +
    `${attr("font-weight", weight)}${attr("letter-spacing", spacing)}${attr("fill", fill)}>`;
  return `${open}${children ?? ""}</text>`;
}

/**
 * @param {string} cls
 * @param {string} children
 * @param {string} [extraAttrs] — raw pre-built attribute string (e.g. a transform), rare
 * @returns {string}
 */
export function group(cls, children, extraAttrs = "") {
  return `<g class="${cls}"${extraAttrs}>${children}</g>`;
}

/** @param {string} css @returns {string} */
export function styleBlock(css) {
  return `<style>${css}</style>`;
}
