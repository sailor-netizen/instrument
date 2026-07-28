# Instrument

Flightdeck's design system. Self-contained: React plus two stylesheets, no other dependency.

## Install

Copy this folder. Then, once, in your entry file:

```js
import "./instrument/tokens.css";      // L0 palette + L1 semantic roles
import "./instrument/components.css";  // the component layer
```

Set one root font-size — Instrument's whole scale is `rem`, so this is the single fluid axis and
everything (type, spacing, layout measures) tracks it:

```css
html { font-size: clamp(16px, 0.7vw + 9px, 34px); }
```

## Use

```jsx
import { View, Stats, Stat, Cards, Card } from "./instrument";

<View title="Cockpit" sub="Working in flightdeck — everything below runs against it.">
  <Stats>
    <Stat value={7} label="agent runs" onClick={() => go("runs")} />
    <Stat value={2} label="awaiting you" hot />
  </Stats>
  <Cards>
    <Card title="Review changes" blurb="A gated agent reads your diff." onClick={run} />
  </Cards>
</View>
```

## What's in it

**Primitives** — `H` `P` `Eyebrow` `Panel` `Btn` `Tag` `Field` `Pills` `Empty` `Well`

**Compounds** — the patterns that recurred across real screens:

| | For |
|---|---|
| `View` | The page shell: title, one line of orientation, content. Every screen. |
| `Split` | Two things pushed apart on a line — a title and its badge. |
| `Stats` `Stat` | A metric row. A `Stat` with `onClick` is a route into the view that owns the number. |
| `Cards` `Card` | A responsive grid of title + badge + blurb. Launchers, catalogs, host lists. |
| `Rows` `Row` | A list row: title, meta, supporting line. Queues and histories. |
| `Table` `TRow` | A dense ledger. Header cells come from the same `cols` array, so a column can't drift from its heading. |
| `Trace` `TraceLine` | The agent trace on its 2px rail — the system saying "a machine did this". |
| `Finding` | Severity + location + claim, with an optional verification verdict. |
| `Callout` | A terminal verdict, toned by meaning. |
| `Section` `Toolbar` `KV` | A titled block · an action bar with a live status · key/value metadata. |
| `Loading` `LoadError` | So no screen invents its own — and a failed fetch never looks like "none". |

## The rules that keep it coherent

1. **Components consume `--i-*` roles only.** Literals live in the L0 block of `tokens.css` and
   nowhere else. That is what makes a re-skin a ten-line edit, and it makes the lint rule statable:
   *a hex outside L0 is a violation.*
2. **`tone` is a meaning, not a colour** — `signal` (this wants you, or binds you), `machine` (the
   system is speaking), `crit`, `ok`, `mute`. If you want to pass "amber", you have not yet decided
   what it means.
3. **Two type voices.** Mono is the machine: headings, labels, IDs, numbers, verdicts. Prose is the
   human: descriptions, help, chat. That split carries most of the identity.
4. **Emphasis rides on weight, fill, rails and rings — never a new hue.** Hues are the scarce resource.
5. **No `box-shadow` anywhere.** Depth is translucency plus a hairline plus the page wash showing
   through, which is why it stays crisp in dark mode instead of turning to mud.
6. **Three border weights, three meanings:** 1px boundary, 2px rail or spine, 3px identity stripe.
7. **Everything is `border-box`**, stated by the library rather than assumed of the host page. A
   component that sets a width and carries padding otherwise overflows its parent by exactly its
   padding — which is a bug that looks like a layout mistake and gets "fixed" in the wrong place.
8. **Grid floors come from content, not item count.** `minmax(min(100%, 8rem), 1fr)` for stats,
   `13rem` for cards. Tuning a floor so that *this* screen's six items land on one row makes the
   next screen's four wrap badly.

## Adding to it

State the need as a sentence about **meaning** ("a run the verifier could not judge"), not appearance
("a yellowish tag"). If your sentence is about appearance, an existing role already covers it. Prefer a
second *channel* — fill weight, outline, ring, rail, stripe, glyph — over a new hue.

A pattern earns a place in `compounds.jsx` when it appears in **three** screens, or when getting it
wrong carries a real cost. Two occurrences stay a one-off until they prove themselves. These compounds
were extracted from working screens rather than designed up front — a library designed in advance
guesses at what screens need; one extracted from them knows.

## Layout

| File | What it is |
|---|---|
| `tokens.css` | L0 private palette + L1 semantic roles. The only place literals are legal. |
| `components.css` | The component layer. Zero literals. |
| `primitives.jsx` | Leaf components — type, panel, button, tag, field, pills, well. |
| `compounds.jsx` | Patterns extracted from real screens — stats, rows, tables, traces, findings. |
| `index.js` | The single import surface. |
