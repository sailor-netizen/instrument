# instrument — handoff

**For a design session working in this repo.** Written 2026-08-16, read from the running code and its
own docs; where this summarises, the authoritative file is named.

The short version: **this repo has a method, and the method is the product.** Read §2 before
designing anything.

---

## 1. What instrument is

A design system where **a theme owns structure, not just colour.**

Most theming stops at a palette, which fails the moment someone dislikes the *shape* of a product — a
token swap cannot reach composition. Here a theme also chooses its surface mode, its navigation
layout, its density, its background grid and whether items are annotated. Terminal deletes every box
in the product; Blueprint numbers every item and moves the nav into a drafting title block. Same
screens, and **no screen aware that any of it happened.**

Framework-free. One stylesheet is the whole system; React is a convenience layer over the same class
vocabulary, never a requirement.

```
src/
  tokens.css      L0 palette + L1 semantic roles; the house theme lives in :root
  contract.css    L2 structure axes + the surface / hover / grid / annotate modes
  themes/*.css    per-theme overrides keyed on [data-theme] — MUST come after contract
  shell.css       the six navigation layouts
  components.css  the component layer, which consumes roles only
  overlays.css    modals, drawers, popovers
  themes.js       the registry: the STRUCTURAL half of each theme
```

Import order is the layering and it is not arbitrary. `src/instrument.css` is the single entry point.

## 2. ⚠ Start with a direction sheet, not a theme

This is the repo's own instruction and the reason its themes don't all look like one product in
several palettes. From `sheets/README.md`:

```
1. SHEET      hand-written HTML, one screen, one direction. No library, no rules.
                 free to change composition — which a token swap can never do
2. COMPARE    several sheets side by side, same content, and a human picks
3. TRANSLATE  the winner becomes src/themes/<id>.css + a registry entry
                 this is where you find out what the contract can and cannot express
4. GAPS       what it couldn't express becomes a new structure axis, recorded in
              CHANGELOG.md against the theme that asked for it
```

Why it matters, in the repo's own words: the alternative is one person iterating on one design until
someone says stop, which has two failure modes that are hard to see from inside — *you approve a
design because it is the only one in front of you*, and an assistant asked to "make it better"
guesses, ships a variation, and hears *"a bit better"*, which is the sound of nobody knowing what to
do next. **Sheets replace guessing with picking.**

- `sheets/_template.html` — the starting point for a new sheet.
- `sheets/*.html` — the five that became themes.
- **`sheets/DIRECTIONS.md` is the vocabulary for describing a direction:** ten axes, each with a
  blank brief — FIELD, SKELETON, SCALE SPREAD, DENSITY, TYPE STRATEGY, COLOUR BUDGET, CHROME WEIGHT,
  BEHAVIOUR UNDER THE HAND, THE SIGNATURE MOVE, and THE COST. Its §4, *"two directions, or two
  palettes?"*, is the test for whether a proposed theme earns its place.

⚠ Those ten are a vocabulary for *describing* directions. They are **not** the contract's structure
axes (§4), which are a different countable thing that happens to share the noun.

## 3. The four invariants

From `AUTHORING.md`. If a change would break one, the change is wrong — not the invariant.

1. **A component never contains a literal.** Colours, sizes and spacing come from `--i-*` roles and
   `--x-*` axes. The lint rule is stateable because of this: *a hex outside a theme file or the L0
   block is a violation.*
2. **A theme picks a hue; it never repurposes a role.** `--i-crit` means "this failed" in every
   theme, forever. This is the single rule that lets themes swap without auditing every screen.
3. **A component never knows which theme is active.** No `if (theme === 'terminal')`, ever. If a
   component must vary, that variation is a structure axis — add one.
4. **Structure branches in exactly one place** (`shell.jsx`). Everywhere else, structure is CSS keyed
   on a `data-*` attribute.

## 4. The contract

**Roles a theme must fill** — the check enforces twelve:

```
page · plane · well · line · line-hi · ink · dim · faint · signal · machine · crit · ok
```

plus, by convention: `plane-2`, `rail`, the washes (`signal-wash`, `machine-wash`, `crit-wash`), the
atmospheres (`wash-signal`, `wash-machine`), and `mono` / `prose`.

**Meanings are fixed across every theme:** `signal` = this wants you or binds you · `machine` = the
machine speaking · `crit` = failed · `ok` = succeeded.

**Contrast is not negotiable.** `--i-ink` on `--i-page` and `--i-dim` on `--i-plane` both clear
4.5:1. Compute it; do not eyeball it.

**Structure axes** — twenty-three `--x-*` scalars, consumed through `[data-*]` selectors in
`contract.css`:

```
annotate  aside  band  card-floor  emphasis  figure  figure-fit  grid  grid-line  grid-size
hero  hover  label-case  label-track  leader  radius  rule-w  section-rule  select-bg
select-fg  stat-floor  surface  title
```

Every one got there because a theme couldn't express something and was brute-forcing around it.
`CHANGELOG.md` records which theme asked for each — that is what stops the list growing on
speculation. **Do not add one speculatively;** `every-axis-is-consumed` will fail it, and should.

**Modes live in the registry, not in CSS.** `applyTheme()` writes eleven `data-*` attributes in one
pass, which is what makes a half-applied theme impossible. Setting a mode in a theme's CSS looks
exactly like setting a scalar and does nothing; the check catches it.

```js
{ id, name, blurb,
  surface: "tile | outline | rule | none",
  shell:   "sidebar | topnav | rail | statusbar | topbar | titleblock",
  scheme:  "light | dark",
  grid:    "none | columns | fine",
  annotate: 0 | 1,
  hover:   "lift | mark | invert",
  sectionRule: "none | trailing",
  band:    "none | rows",
  leader:  0 | 1,
  emphasis: "wash | fill",
  hero:    0 | 1 }
```

**Nothing in that object is a colour.** Colours are the CSS file's job, always.

Adding a theme is **one CSS file + one registry object + one import** in `src/instrument.css`. Keep
the `[data-theme]` rules section short — more than ~30 lines means the contract is missing an axis,
and adding the axis beats brute-forcing around it.

## 5. The class vocabulary

Components consume roles only. Compose these rather than reinventing them:

- **Shell** — `.i-shell`(`.is-sidebar`/`is-topnav`/`is-rail`/`is-statusbar`/`is-topbar`/`is-titleblock`)
  `.i-side` `.i-side-head` `.i-stage` `.i-nav-stack` `.i-nav-spread` `.i-nav-pills` `.i-navitem`
  `.i-brand` `.i-masthead` `.i-statusbar` `.i-titleblock` `.i-rail-col`
- **View** — `.i-view` `.i-view-head` `.i-view-titles` `.i-view-sub` `.i-view-actions` `.i-view-body`
  `.i-view-main` `.i-view-aside` `.i-section` `.i-eyebrow` `.i-split`
- **Content** — `.i-card`(`-top`/`-title`/`-blurb`) `.i-cards` `.i-panel` `.i-well` `.i-empty`
  `.i-callout` `.i-kv` `.i-rows` `.i-row`(`-title`/`-sub`/`-meta`/`-top`) `.i-table` `.i-tr`
  `.i-stats` `.i-stat`(`-v`/`-l`) `.i-finding` `.i-trace` `.i-disc`
- **Controls** — `.i-btn`(`.is-primary`/`.is-ghost`/`.is-small`) `.i-field` `.i-input` `.i-tag`
  `.i-pill` `.i-pills`
- **Tone, never colour** — `tone-signal` `tone-machine` `tone-crit` `tone-ok` `tone-mute`
- **State is `is-*`** — `is-on` `is-link` `is-hot` `is-dim` `is-head`; never `active`, never `selected`

Two shapes worth knowing before you design against them:

- **`.i-table` is a flex column of `.i-tr` grids, not a `<table>`.** Its columns come from an
  `--i-cols` custom property that the host sets per table. A host that cannot set a custom property
  per element — anything server-rendered under a CSP that forbids inline styles — cannot use it as
  shipped. Worth deciding whether that is a gap the system should close.
- **A component that draws a box** must use `.i-panel`/`.i-card` or be added to the four
  `[data-surface]` blocks in `contract.css`. One that hard-codes its own border looks wrong in
  Terminal and Blueprint and nobody knows why.

## 6. The gate

`npm run check` — **15 invariants, currently green across 8 themes.** Not a linter you can argue
with; it is the definition of "the system still holds". Highlights:

`no-literals-outside-tokens` · `theme-fills-every-role` · `themes-target-i-only` (a theme may never
name a consuming app's class) · `every-theme-is-imported` · `registry-matches-files` ·
`modes-live-in-the-registry` · `theme-sets-a-real-axis` · `every-axis-is-consumed` ·
`screens-compose-not-restyle` · `gallery-is-navigable` · `wall-shows-every-sheet` ·
`docs-count-the-real-axes`.

Other commands:

- `npm run gallery` → `127.0.0.1:4322/gallery/`
- `node embeds/cli.mjs` regenerates one animated poster + tile per theme from the live registry. They
  must come back **byte-identical** unless a theme actually changed — that is the determinism claim.

**Look at your work here:** `gallery/compare.html` renders the same screen in **every theme at
once**, which is the point — switching a picker one theme at a time tells you what each looks like,
never which is better. `gallery/screens/*.html` take `?theme=` so any screen can be screenshotted
under any theme.

## 7. Where it stands

**Eight themes.** Their structural combinations, which is the fastest way to judge whether a proposed
theme is genuinely distinct or a palette:

| id | surface | shell | scheme | hover | sectionRule | band | leader | emphasis | hero |
|---|---|---|---|---|---|---|---|---|---|
| instrument | tile | sidebar | dark/light | lift | none | none | 0 | wash | 0 |
| swiss | rule | topnav | light | mark | trailing | none | 0 | fill | 0 |
| terminal | none | statusbar | dark | invert | trailing | rows | 0 | wash | 0 |
| editorial | rule | rail | light | mark | trailing | none | 1 | wash | 0 |
| bento | tile | topbar | dark | lift | none | none | 0 | wash | 1 |
| blueprint | outline | titleblock | light | mark | none | rows | 0 | fill | 0 |
| beacon | tile | rail | dark | mark | none | rows | 0 | fill | 0 |
| arcade | tile | topbar | dark | lift | none | none | 0 | wash | 1 |
| **vault** *(unmerged, PR #1)* | rule | sidebar | dark | mark | trailing | rows | 1 | fill | 0 |

**Beacon** is the one to read for how a theme argues its own existence: instrument's surface technique
is translucency over the page, which has a precondition — you must own the page underneath. Beacon is
for where that fails, so every surface is a literal and every boundary a real weight. The theme file
states the measurement that produced it.

**`vault` is unmerged, is the newest and least-tested member, and was written straight into the
contract with no direction sheet** — the exact thing §2 says not to do. It passes the check and its
argument holds (a register rather than a dashboard: rules instead of boxes, a dotted leader from an
entry out to its state, banded rows). Treat it as **one candidate, not a starting point to defend.**
Replacing it, or dropping it entirely, is a perfectly good outcome — PR #1 is the only place it
exists.

**Class names and token names are the contract.** Apps consume this system by those names, so a
rename breaks them on their next deploy. That is what `themes-target-i-only` exists to prevent, and
it is the reason a theme may never reach into a consuming app's classes.

## 8. Open questions worth a decision

1. **Does the system draw relations?** `A → B, with direction` — one thing may use another — is a
   relation, and no component here expresses one. The admission rule from `AUTHORING.md` is that a
   pattern earns a place when it appears in three screens, or when getting it wrong carries a real
   cost. A permission that renders correctly and means the wrong thing is the second kind.
2. **Should `.i-table` work without a per-element custom property?** See §5.
3. **How many themes is the right number?** Eight is a lot to keep green, and every one is a place a
   new component must be checked. Retiring one is a legitimate move.

## 9. If you do one thing

Run the loop in §2 properly: `sheets/_template.html` plus the blank brief in `DIRECTIONS.md` §3,
three to five directions, then `gallery/compare.html` and pick. Translate the winner, and treat what
the contract *couldn't* express as the real output — those gaps become axes, recorded in
`CHANGELOG.md` against the theme that asked for them.
