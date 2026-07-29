# Instrument

[![check](https://github.com/sailor-netizen/instrument/actions/workflows/check.yml/badge.svg)](https://github.com/sailor-netizen/instrument/actions/workflows/check.yml)

A design system where a **theme owns structure, not just colour**.

Most theming stops at a palette. That fails the moment someone dislikes the *shape* of a product,
because a token swap cannot reach composition — swap tokens on a sidebar-and-cards dashboard and you
get the same dashboard in a different colour. Here a theme also chooses its surface mode, its
navigation layout, its density, its background grid and whether items are annotated. Terminal deletes
every box in the product; Blueprint numbers every item and moves the nav into a drafting title block.
Same nine screens, and no screen aware that any of it happened.

```bash
npm i instrument@file:../instrument      # or copy the folder; both work
```

## Two ways in

**No framework.** One stylesheet is the whole system. This is the primary path, not a fallback:

```html
<link rel="stylesheet" href="instrument/src/instrument.css">
<html data-theme="terminal" data-surface="none" data-shell="statusbar">
  <button class="i-btn is-primary">Run review</button>
  <span class="i-tag tone-crit">failed</span>
</html>
```

**React**, a convenience layer over exactly that vocabulary — an *optional* peer dependency:

```jsx
import { Shell, View, Stats, Stat, applyTheme } from "instrument";
import "instrument/css";               // or the parts individually, for tree-shaking

applyTheme("blueprint");

<Shell variant="titleblock" nav={NAV} active={tab} onNavigate={go}>
  <View title="Cockpit" sub="Working in flightdeck.">
    <Stats><Stat value={7} label="agent runs" onClick={() => go("runs")} /></Stats>
  </View>
</Shell>
```

## The gallery

```bash
npm run gallery      # → http://127.0.0.1:4322/gallery/
```

Four pages, every one framework-free — the standing proof that the identity lives in CSS and a class
vocabulary rather than in React:

| Page | |
|---|---|
| `index.html` | every component, in every theme, with a **surface override** so you can view any component under all four surface modes — including the ones its own theme never uses. That is how you find out a new component only works in one of them. |
| `foundations.html` | the primitives: the three token layers, every colour role with what it *means*, the type ramp at real size, spacing and what density does to it, the three border weights, the motion budget, and why there is no `box-shadow`. |
| `themes.html` | all six side by side — a registry-generated table of every structure axis, and a live colour-role matrix so a role that changed meaning between themes would be visible instantly. |
| `patterns.html` | composed examples: a whole screen under each surface mode, forms, an agent run, empty/error/loading, and a density comparison. |

Every page reads the *real* `themes.js` registry rather than restating it, so the documentation cannot
drift from the code.

## The three layers

| | | |
|---|---|---|
| **L0** | palette | private literals (`--_`). The only place a hex is legal. |
| **L1** | roles | semantic tokens (`--i-`). What components actually consume. |
| **L2** | structure | how components draw and where the shell puts things. `--x-` scalars, plus modes as `data-*` attributes. |

Everything hangs off **one attribute**, `data-theme`, written by `applyTheme()` together with the
structural attributes it implies. There is no second switch to forget, so the palette can never change
while the layout doesn't.

## Themes

| | Surface | Shell | Field |
|---|---|---|---|
| **Instrument** | tile | sidebar | carbon, dual-scheme. The house voice. |
| **Swiss Signal** | rule | topnav | paper, a visible column grid, enormous figures, one red |
| **Terminal** | none | statusbar | near-black, monospace only, numbered jump keys, dense |
| **Editorial Ops** | rule | rail | cream, a display serif against mono machine text |
| **Bento Console** | tile | topbar | midnight navy, unequal tiles, composition as hierarchy |
| **Blueprint** | outline | titleblock | paper, fine grid, hard outlines, everything numbered |

## The rules that keep it coherent

1. **Components consume `--i-*` roles only.** A hex outside a theme file or the L0 block is a
   violation — which is what makes the lint rule one line.
2. **`tone` is a meaning, not a colour**: `signal` (this wants you, or binds you) · `machine` (the
   system is speaking) · `crit` · `ok` · `mute`.
3. **A theme picks a hue; it never repurposes a role.** `--i-crit` is "this failed" in every theme.
   This single rule is why themes swap without auditing every screen.
4. **A component never knows which theme is active.** If it needs to vary, that is a structure axis.
5. **Two type voices.** Mono is the machine; prose is the human. That split carries most of the
   identity, and it survives having no web fonts.
6. **Emphasis rides on weight, fill, rails and rings — never a new hue.** Hues are scarce.
7. **No `box-shadow` anywhere.** Depth is translucency plus a hairline plus the page wash showing
   through, which is why it stays crisp in dark mode instead of turning to mud.
8. **Three border weights, three meanings:** 1px boundary · 2px rail or spine · 3px identity stripe.
9. **Everything is `border-box`**, stated rather than assumed of the host page.
10. **Grid floors come from content, not item count.** Tuning a floor so *this* screen's six items fit
    one row breaks the next screen's four.

## Checking it

```bash
npm run check
```

Zero dependencies, runs anywhere Node does, and verifies the promises this README makes rather than
leaving them as prose: no colour literal outside the token layer, every theme fills every core role,
no theme reaches into a consuming app's classes, every theme is both registered *and* imported, every
`@import` resolves, no `box-shadow` anywhere. CI runs the same script — there is no looser second gate.

A design system's claims rot exactly as fast as nobody checks them, which is why these are executable.

**But a green check is not evidence the UI is right.** Two bugs here compiled and linted cleanly and
were plainly wrong on screen: a `container-type` that silently scoped CSS counters so every annotated
item numbered `01`, and a `display: flex` that overrode the browser's own
`dialog:not([open]) { display: none }` so every drawer rendered permanently. Open the gallery.

## Extending it

See **[AUTHORING.md](AUTHORING.md)** — how to add a component, a theme, a shell variant, or a
structure axis, and the four invariants that make all of it safe.

The short version: a pattern earns a component when it appears in **three** screens, or when getting
it wrong carries a real cost. These compounds were *extracted from working screens*, not designed up
front — a library designed in advance guesses at what screens need; one extracted from them knows.

## Layout

| Path | |
|---|---|
| `src/tokens.css` | L0 palette + L1 roles; the house theme lives in `:root` |
| `src/contract.css` | L2 axes + the surface / hover / grid / annotate modes |
| `src/themes/*.css` | one file per theme |
| `src/themes.js` | the registry + `applyTheme()` — imported by React and the gallery alike |
| `src/shell.jsx` · `shell.css` | the six navigation layouts; the one place structure branches |
| `src/primitives.jsx` | leaves — type, panel, button, tag, field, pills, well |
| `src/compounds.jsx` | patterns from real screens — stats, cards, rows, tables, traces, findings |
| `src/instrument.css` | one import for the whole system, no bundler required |
| `gallery/*.html` | four framework-free pages: components · foundations · themes · patterns |
| `scripts/check.mjs` | the library's own gate — 8 invariants, zero dependencies |

## Consumers

- **flightdeck** — an agentic developer cockpit. Six themes across nine screens, via `file:`.

Adding one: depend on the package, import the CSS, set `data-theme`. If you find yourself editing the
library to make your app work, that is a missing axis — see [AUTHORING.md](AUTHORING.md).

## Where it came from

Not designed up front. The five non-default themes started as **direction sheets** — standalone HTML
pages rendering the *same* two real screens in five genuinely different visual directions, built so a
human could put them side by side and pick one rather than have someone iterate blind. Every compound
in `compounds.jsx` was extracted from a screen that had already grown it, usually at three different
paddings. Every structure axis exists because a theme hit a wall and said so; `CHANGELOG.md` records
which theme asked for each.

That order is the whole method. A library designed in advance guesses at what screens need; one
extracted from them knows.

## Licence

MIT — see [LICENSE](LICENSE).
