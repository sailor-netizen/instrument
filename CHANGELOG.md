# Changelog

Structure axes are the interesting entries. Each one exists because a theme couldn't express
something and was brute-forcing around it — that is the only good reason to add one, and recording
*which* theme asked is what stops the list growing on speculation.

## 0.5.0

Two axes, both found by **measuring** rather than by a theme author hitting a wall.

| Axis | Kind | Asked for by | Solves |
|---|---|---|---|
| `--x-figure-fit` | scalar | Bento (twice), measurement | how much of its own column a figure may fill. It was a bare `18cqi` inside `components.css`, so the only way to change it was to fork the whole `font-size` rule — which Bento had already done twice, at 24cqi for its hero tile and 12cqi for its recessed strips. |
| `--x-aside` | scalar | Flightdeck's Runs / Reviews / Approvals | width of `View`'s new aside column. Same family as `--x-stat-floor` and `--x-card-floor`: the themes disagree about it for a reason they already disagree about elsewhere, since Editorial runs `--i-density` 1.35 and Terminal 0.74. |

**`View` takes an `aside`.** A secondary column for the material that explains the primary thing
without competing with it. Three Flightdeck screens had the same leftover — an API returning a
breakdown the screen had nowhere to put, beside a stage two-thirds empty below the fold — which is
the threshold `AUTHORING.md` sets for admitting a pattern. Passing no `aside` renders exactly what it
rendered before.

**`Shell` takes `notes`; the titleblock no longer writes your copy.** That shell shipped with a
hardcoded sentence — *"Every quantity on a sheet is a link; its target sheet is given in the item
foot"* — true of the drafting sheet it was translated from and of nothing since. It sat at the top of
the right-hand column of a real product as permanent placeholder text. It is a slot now, empty by
default: a shell composes, it does not author.

**Two layout bugs, both of which made columns silently wrong rather than visibly broken:**

- `.i-tr` had no `min-width: 0`. `.i-table` is a column flex container, so every row was a flex item
  with `min-width: auto` and refused to be narrower than its own min-content — inflating past the
  table and taking the `fr` tracks with it. A six-track row measured 725px inside a 675px table and
  pushed its last column behind a horizontal scrollbar. `minmax(0,1fr)` on the tracks does *not* fix
  this; the tracks were never the constraint.
- `TRow` with `onClick` was a `div` with a click handler — a control that exists only for mouse
  users, which this repo's own AUTHORING calls a keyboard trap. It is focusable now, with Enter and
  Space bound, keeping `role="row"` (a `<button>` may not contain the row's cells).

Why it was worth finding: the component sizes a figure as `min(--x-figure, --x-figure-fit)`, and at a
1280px stage the **fit wins in five of the six themes** — Swiss renders 74.6px against an 86.4px
ceiling, Blueprint 31.1 against 54.4, Editorial 37.1 against 48, Bento 36.2 against 51.2. Only
Terminal, which deliberately lowered its figure, has its ceiling bind. So `--x-figure` looked inert
for most themes and three separate theme files answered by writing a paragraph about the coupling
instead of turning a knob, because the knob did not exist.

Bento's two forks are now value declarations rather than restated rules — the component keeps the
formula, the theme says which ceiling and which allowance. Verified behaviour-preserving: computed
figure sizes across all six themes and all six cockpit stats are byte-identical before and after,
including Bento's three distinct sizes (131 / 45.9 / 25.9px).

Also in this release, none of them axes:

- **`sheets/`** — the five original direction sheets, the method that produced them, and
  `DIRECTIONS.md`: ten things a direction has to answer, each one something the five real themes
  genuinely disagree about, with a blank brief to fill in.
- **`gallery/sheets.html`** — step 2 of the loop as a page instead of an instruction to open browser
  tabs. Every sheet side by side, each captioned with its direction sentence and the theme it became.
- **The gallery is navigable.** It had drifted to four different navs and a landing page with none,
  leaving `compare.html` reachable only by typing its URL. Checked now.
- **`npm run gallery` is a Node server that sends `no-store`.** `python -m http.server` sends no
  `Cache-Control`, so a browser may reuse a stylesheet without revalidating; editing `contract.css`
  produced a page built from the new `components.css` and the old contract, every figure collapsed to
  18px, and it looked exactly like a bug in the change. A gallery you cannot trust to show you the
  current code is worse than no gallery.
- **Three new check rules** — modes cannot be set in theme CSS (they do nothing there), every gallery
  page links to every other, and a count of axes stated in prose has to be the real count. The last
  one was written after finding two docs claiming "fifteen" when the contract declared twenty-one.

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
