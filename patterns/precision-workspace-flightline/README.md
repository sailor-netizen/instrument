# Precision Workspace / Flightline Depth

A **pattern**, not a theme: a way of composing a whole application — the six-level layer
hierarchy, the workspace-before-dashboard priority, the tool-hosting contract — that sits above
what a theme decides. [`PROMPT.md`](PROMPT.md) is the implementation brief; it came back from a
real build (a rotation print designer) that used this system end to end.

## Read this before pasting `tokens.css`

[`tokens.css`](tokens.css) is the pattern **as it was authored**, in its own vocabulary
(`--accent`, `--canvas`, `--surface`, …). It is kept verbatim so the source of the pattern is not
lost in translation — but dropping it into a product alongside `tokens.css` from `src/` gives you
two parallel token systems, which is the anti-pattern PROMPT.md itself names ("new tokens that
silently bypass the repository's existing design system").

The brief's own instruction is the right one: *adapt these to the repository's existing token
architecture without changing their semantic relationships.* Here is that mapping.

| Pattern token | Instrument role | Note |
|---|---|---|
| `--canvas`, `--canvas-2` | `--i-page` | The ambient plane behind everything. |
| `--surface`, `--surface-2`, `--surface-3` | `--i-plane`, `--i-plane-2` | Instrument has two, not three: the third is a border/elevation change, not a third fill. |
| `--line` | `--i-line`, `--i-line-hi` | `-hi` is the hover/active hairline. |
| `--text`, `--muted` | `--i-ink`, `--i-dim` | `--i-faint` is a third step the pattern lacks. |
| `--accent` (mint) | `--i-machine` (+ `--i-machine-wash`) | Information / active state. |
| `--warn` (amber) | `--i-signal` (+ `--i-signal-wash`) | Attention / ageing. |
| `--danger` | `--i-crit` (+ `--i-crit-wash`) | Failure, unsafe state, destructive action only. |
| `--success` | `--i-ok` | |
| `--radius-sm … --radius-xl` | `--i-radius-sm`, `--i-radius`, `--i-radius-pill` | Radius is a **theme** decision here; a pattern asking for one fixed scale would flatten the six themes into one look. |
| `--speed`, `--speed-fast`, `--ease-out` | `--i-fast`, `--i-med`, `--i-ease` | Same durations and the same `cubic-bezier(.16, 1, .3, 1)` intent. |
| `--space-1 … --space-7` | `--i-1 … --i-8` | Instrument's scale is density-aware (`--i-density`), so themes can run tighter or looser. |
| `--accent-2` (violet), `--info` | *(no role)* | Only used for the brand mark's gradient in the source. Add a role if a second accent ever earns one — not before. |

`--glass` and `--shadow` have no instrument equivalent on purpose: depth is what
`--x-surface` (`tile` / `outline` / `rule` / `none`) decides per theme, so a blur baked into a
token would override the axis that exists to control it.

## What this pattern contributed back

- **`[data-hero="1"]` now spans the first card**, not just the first stat — the "varied panel
  spans, avoid uniform grids" rule needed it, and a launcher's two equal game tiles proved it.

## What it deliberately did not

The three `data-theme` blocks in `tokens.css` (dark / light / midnight) are **not** new instrument
themes. Instrument's `dark`/`light` are a `color-scheme` signal that every theme already sets, and
`midnight` is close enough to `bento` (dark, tiled, hero) that adding it would be a second name for
one idea. If midnight later wants a structure `bento` cannot express, that is when it becomes a
theme — the same bar every other axis had to clear.
