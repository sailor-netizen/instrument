/* ==============================================================================================
   INSTRUMENT — the theme registry.

   Each entry is the STRUCTURAL half of a theme; the token half lives in the matching CSS file in
   `themes/`. They are split because they are enforced by different machinery: tokens are cascade,
   structure is attributes. Keeping the structural half here — declarative, one object per theme —
   means adding a theme is one CSS file plus one object, and nothing else in the product changes.

   `surface`, `shell`, `grid`, `annotate` and `hover` are read by contract.css. `scheme` drives the
   single `color-scheme` signal. Nothing here is a colour: colours are the CSS file's job, always.
   ============================================================================================== */

export const THEMES = [
  {
    id: "blueprint",
    name: "Blueprint",
    blurb: "A drafting sheet: fine grid, hard outlines, everything numbered.",
    surface: "outline",
    shell: "titleblock",
    scheme: "light",
    grid: "fine",
    annotate: 1,
    hover: "mark",
    sectionRule: "none",
    band: "rows",
    leader: 0,
    emphasis: "fill",
    hero: 0,
  },
  {
    id: "instrument",
    name: "Instrument",
    blurb: "Hairline planes on a carbon field. The house voice.",
    surface: "tile",
    shell: "sidebar",
    scheme: "dark light",
    grid: "none",
    annotate: 0,
    hover: "lift",
    sectionRule: "none",
    band: "none",
    leader: 0,
    emphasis: "wash",
    hero: 0,
  },
  {
    id: "swiss",
    name: "Swiss Signal",
    blurb: "Paper, a visible column grid, enormous figures, one red.",
    surface: "rule",
    shell: "topnav",
    scheme: "light",
    grid: "columns",
    annotate: 0,
    hover: "mark",
    sectionRule: "trailing",
    band: "none",
    leader: 0,
    emphasis: "fill",
    hero: 0,
  },
  {
    id: "terminal",
    name: "Terminal",
    blurb: "No boxes. A character grid and a status bar. Dense.",
    surface: "none",
    shell: "statusbar",
    scheme: "dark",
    grid: "none",
    annotate: 0,
    hover: "invert",
    sectionRule: "trailing",
    band: "rows",
    leader: 0,
    emphasis: "wash",
    hero: 0,
  },
  {
    id: "editorial",
    name: "Editorial Ops",
    blurb: "Cream, a display serif, rules instead of boxes.",
    surface: "rule",
    shell: "rail",
    scheme: "light",
    grid: "none",
    annotate: 0,
    hover: "mark",
    sectionRule: "trailing",
    band: "none",
    leader: 1,
    emphasis: "wash",
    hero: 0,
  },
  {
    id: "bento",
    name: "Bento Console",
    blurb: "Unequal tiles on midnight navy. Composition is the hierarchy.",
    surface: "tile",
    shell: "topbar",
    scheme: "dark",
    grid: "none",
    annotate: 0,
    hover: "lift",
    sectionRule: "none",
    band: "none",
    leader: 0,
    emphasis: "wash",
    hero: 1,
  },
];

// Blueprint is the house UI: this is a workspace for driving agents over a real fleet, and a
// drafting sheet — dense, annotated, everything numbered and cross-referenced — is what that
// work actually looks like. The others stay one select away.
export const DEFAULT_THEME = "blueprint";
const KEY = "instrument.theme";

export const themeById = (id) => THEMES.find((t) => t.id === id) || THEMES[0];

/**
 * Apply a theme to the document. Writes every structural attribute in one place so a theme can
 * never half-apply — the failure mode where the palette switches but the layout doesn't is exactly
 * what makes theming feel broken.
 *
 * `color-scheme` is SET here rather than declared per theme, honouring the system's one-signal rule:
 * there is a single declaration in contract.css and a single writer, which is this function.
 */
export function applyTheme(id) {
  if (typeof document === "undefined") return;      // SSR-safe: the render gate has no document
  const t = themeById(id);
  const el = document.documentElement;
  el.setAttribute("data-theme", t.id);
  el.setAttribute("data-surface", t.surface);
  el.setAttribute("data-shell", t.shell);
  el.setAttribute("data-grid", t.grid);
  el.setAttribute("data-annotate", String(t.annotate));
  el.setAttribute("data-hover", t.hover);
  el.setAttribute("data-section-rule", t.sectionRule);
  el.setAttribute("data-band", t.band);
  el.setAttribute("data-leader", String(t.leader));
  el.setAttribute("data-emphasis", t.emphasis);
  el.setAttribute("data-hero", String(t.hero));
  el.style.colorScheme = t.scheme;
  try {
    localStorage.setItem(KEY, t.id);
  } catch {
    /* private mode / storage disabled — the theme still applies for this session, which is the
       part that matters. Silently losing persistence is acceptable; silently losing the theme
       is not. */
  }
  return t;
}

/** The theme to open with: whatever was last chosen, else the house default. */
export function storedTheme() {
  if (typeof localStorage === "undefined") return DEFAULT_THEME;
  try {
    const id = localStorage.getItem(KEY);
    return id && THEMES.some((t) => t.id === id) ? id : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}
