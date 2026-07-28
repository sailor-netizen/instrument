# Changelog

Structure axes are the interesting entries. Each one exists because a theme couldn't express
something and was brute-forcing around it — that is the only good reason to add one, and recording
*which* theme asked is what stops the list growing on speculation.

## 0.4.0

Eight axes, all requested by theme authors who hit the wall rather than invented up front.

| Axis | Kind | Asked for by | Solves |
|---|---|---|---|
| `--x-stat-floor` · `--x-card-floor` | scalar | Swiss, Bento | grid floors were fixed while `--x-figure` was themeable, so raising the figure overflowed the column. Two numbers that had to agree by hand. |
| `--i-type-scale` | scalar | Terminal | `--i-density` scaled *space* only, so a dense theme got tight gaps around house-sized text — cramped rather than dense. |
| `--x-section-rule` | mode | Terminal, Swiss, Editorial | under `surface: rule`/`none` every boundary disappears and a bare micro-label separates sections weakly. Three themes wanted the same hairline independently. |
| `--x-band` | mode | Terminal, Blueprint | zebra banding is how a dense ledger stays trackable once nothing draws a box. |
| `--x-leader` | mode | Editorial | the magazine-index device — a dotted run from a row's title to its figure. |
| `--x-emphasis` | mode | Swiss, Blueprint | primary emphasis was outline-plus-wash only; a solid ink block with the page punched out had to be written as a per-theme rule. |
| `--x-hero` | mode | Bento | "nothing is the same size as anything else" — the first metric takes a 2×2 tile. Composition as hierarchy, expressed once. |

## 0.3.0

Extracted from `flightdeck/frontend/src/instrument` into its own package. React demoted to an
**optional** peer dependency; `gallery/index.html` added, framework-free, as the standing proof that
the identity lives in CSS and a class vocabulary.

Earlier in this version, the theme contract itself: L2 structure (`--x-*` scalars plus `data-*`
modes) joined L0 palette and L1 roles, so a theme owns surface mode, shell layout, density, grid and
annotation — not just colour. Six shells; six themes.

Axes added during 0.3 development, same rule, same reason:

| Axis | Asked for by | Solves |
|---|---|---|
| `--i-chrome-face` | Swiss | card titles, buttons, tags and table heads were hardwired to the mono voice, so a theme whose display voice wasn't the machine voice restated it at six selectors. |
| `--x-select-bg` · `--x-select-fg` | Terminal | `hover: invert` was hardwired to a wash with no foreground token, which is not an inversion. A mode the contract *names* must be a mode it *delivers*. |
| `--x-title` | Swiss | page titles were pinned to `--i-h1`, so every theme opened its page identically. |

### Fixed

- **Stat figures collided with their neighbour.** `--x-figure` and the grid floor were coupled but
  only one was themeable. Fixed by deriving rather than adding a knob: each `Stat` is its own query
  container and the figure is `min(var(--x-figure), 18cqi)`, so the column imposes the real limit.
- **Annotation numbered every item `01`.** Caused by the fix above — `container-type` implies *style*
  containment, which scopes CSS counters. The query container moved to an inner wrapper so counters
  stay on the outer element. Both this and the bug it fixed compiled cleanly; only the screenshots
  showed it.
- **`box-sizing` was assumed of the host page.** Any component with an explicit width and padding
  overflowed its parent by exactly its padding.
- **The tone→stripe mapping was scoped to `.i-panel`**, so a striped `Row` drew its identity edge with
  no colour at all.
- **`Empty` pinned left** inside a full-width `Panel` while its own text stayed centred, reading as a
  layout mistake rather than an empty state.
