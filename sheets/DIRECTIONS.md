# Describing a direction

"Make it look better" is not a brief. Neither is "clean and modern", "sleek", or "like Linear but
warmer". None of them can be wrong, which is the problem: nothing in them can be built, checked, or
rejected, so every attempt is a guess and every review is a mood.

This file is the vocabulary that makes a direction **specifiable before anyone builds it**. Fill in
the brief at the bottom, and a person or an assistant can write the sheet without asking you what you
meant. Leave a line blank and you have found the part of the design you have not decided yet.

The axes below are not a design listicle. Each one is something the five real directions in this
repo **actually disagree about** — you can read the disagreement in `src/themes/*.css` and
`src/themes.js`. If an axis were not contested, it would not be worth a line in a brief.

Method and the sheet→theme loop: [README.md](README.md). Starting file: [`_template.html`](_template.html).

---

## 1 · The axes

### FIELD — the stock everything sits on

The base surface, whether it is *lit*, and whether anything is *painted* on it. Three separate
decisions that people collapse into one word.

Instrument gives you two atmosphere tokens (`--i-wash-signal`, `--i-wash-machine`) and a stage grid
(`--x-grid: none | columns | fine`). **Three of the five themes set both washes to `transparent` on
purpose** — Swiss ("a radial wash under it would turn structure into weather"), Terminal ("a terminal
is lit by nothing"), Blueprint ("a drawing sheet is evenly lit"). Bento does the opposite and floods
the top-right at `0.22` alpha. Turning atmosphere *off* is as much a direction as turning it up.

- **Answer with:** the stock in words a paint chip could match, plus lit/unlit, plus what is drawn on
  it. "Warm bone paper, flat, with twelve painted column lines running the full content width."
- **Not an answer:** "dark mode." Terminal (`#0d1117`) and Bento (`#04060d`) are both dark and share
  nothing else. "Light with a subtle gradient" — subtle in which direction, meaning what?

### SKELETON — where navigation lives, and whether anything draws a box

Two questions, one axis, because they are the pair a token swap can never reach.

Navigation is real DOM (`shell.jsx`): `sidebar · topnav · rail · statusbar · topbar · titleblock`.
Boxes are the surface mode (`contract.css`): `tile · outline · rule · none`. **No two of the five
share a shell.** Swiss puts destinations on a two-tier rule across the top; Terminal makes them
numbered function keys in a status bar; Editorial sets them lowercase down a narrow metadata rail;
Bento makes the nav bar itself a floating tile; Blueprint turns them into a sheet index inside a
drafting title block.

- **Answer with:** where nav lives and what an item looks like, then whether a card is a filled tile,
  a hard outline, a top rule, or nothing at all.
- **Not an answer:** "sidebar with a card grid." That is the house theme (`instrument`) — the thing
  every other direction exists to be an alternative to. Also not an answer: naming the nav and going
  quiet about boxes. Half a skeleton produces a sheet that reverts to tiles by default.

### SCALE SPREAD — the ratio between the loudest thing and the body text

The single biggest lever on how a screen *feels*, and the one most often described in adjectives.
Two knobs (`--x-figure` for display numerals, `--x-title` for the page title) against the body ramp.
Across the five, figures run **1.95rem (Terminal) to 5.4rem (Swiss)** and titles **1.5rem (Terminal)
to ~5.2rem (Editorial)** — a 2.8× and 3.4× spread over the same content.

There is a trap here, and both Bento and Blueprint fell into it: a figure is clamped by the column it
sits in (`min(--x-figure, 18cqi)`), so **raising the ceiling without raising `--x-stat-floor` changes
nothing**. Blueprint rendered six stats at 1.4rem in a 984px stage until the floor moved. Swiss picks
22rem specifically so auto-fit lands on 2, 3, 4 or 6 tracks — every one a divisor of twelve.

- **Answer with:** the ratio and the count. "The figure is ~5× the body and there are never more than
  three across." "Nothing is larger than 2× body; the title is a tracked caps banner, not a headline."
- **Not an answer:** "big bold numbers." Big against what, and how many fit on the row?

### DENSITY — how much space, and whether type moves with it

`--i-density` scales the whole spacing ramp; `--i-type-scale` scales the whole type ramp. They are
two knobs because Terminal proved they have to move together: it tightened space alone and got
house-sized text in cramped gaps, "which reads as broken rather than dense" — that failure is why
`--i-type-scale` exists at all (`CHANGELOG.md` 0.4.0). Real range: **0.74 (Terminal) → 1.35
(Editorial)**, nearly 2×.

- **Answer with:** a target you could measure off a screenshot. "13px text on a 20px line, ~40 rows
  visible." "Whitespace is the only thing dividing anything, so gaps run half again the default."
- **Not an answer:** "compact" or "spacious" on its own. Compact text in compact gaps is a terminal;
  default text in compact gaps is a bug.

### TYPE STRATEGY — how many voices, and what the split *means*

Instrument has four type slots: `--i-prose` (human), `--i-mono` (machine), `--i-display-face`
(figures/headlines), `--i-chrome-face` (card titles, buttons, tags, table heads). The direction is
not which fonts — it is **which distinction the type is carrying**, and the five each answer
differently:

- **Terminal** — one family, no exceptions; `--i-prose` is *set to* `--i-mono` deliberately, so
  hierarchy has to come from scale, tracking and density alone.
- **Editorial** — serif for everything human (display *and* chrome); mono only where the system
  literally emits characters — eyebrows, stat labels, kv keys, wells, ids, traces.
- **Swiss** — the inverse: the grotesque takes even the micro-labels, "a mono label reads as a
  caption from a different document"; mono survives only in paths, logs and timestamps.
- **Bento** — a condensed industrial grotesque occupies the `--i-mono` *role*, and a real monospace
  is clawed back for exactly one surface, the well, "which is right for a figure and wrong for a diff."
- **Blueprint** — mono does most of the talking (every annotation and figure), the grotesque is
  reserved for *names*; `font-variant-numeric: tabular-nums` on the theme root, because every numeral
  on a drawing has to line up under the one above it.

- **Answer with:** the number of voices, what each one is for, and the distinction that survives a
  system font stack. A sheet may load Fraunces; the theme it becomes ships with no web fonts, so
  Editorial's real split is *serif vs mono*, not *Fraunces vs Work Sans*.
- **Not an answer:** "modern sans with a mono for code." That is the default, and "for code" is not a
  meaning — it is a file type.

### COLOUR BUDGET — how many hues, and what each one is allowed to mean

Count them, then say what happens when you run out. This is the axis where the contract pushes back
hardest: **rule 1 is that a theme picks the hue but never changes what a role means.** `--i-crit` is
"this failed" in every theme, `--i-signal` is "this wants you or binds you", `--i-machine` is "the
system is speaking", `--i-ok` is "this succeeded". A direction cannot merge two of them because it
only budgeted for one colour — it has to find another channel.

Both one-hue directions do exactly that, and both say so out loud:

- **Swiss** spends **one** hue. Red is `--i-crit` and nothing else; `--i-signal`, `--i-ok` and every
  emphasis are near-black ink — "a theme that spends colour on attention has none left for alarm."
  Red appears twice on a busy screen and never on a calm one.
- **Blueprint** spends **one** — callout cyan for `--i-machine`. Red is reserved ("fault colour
  reserved — 0 on sheet"). `--i-signal` gets **line weight instead of hue**: the hard object line.
- **Terminal / Editorial / Bento** each spend **four**, one per role, and differ in register — GitHub
  status colours vs a muted two-colour press (ochre, crimson, plus a mixed slate and olive for the
  two roles a press never needed) vs cyan-loudest-on-screen with magenta held in reserve.

- **Answer with:** the count, the assignment role by role, and the substitute channel for the roles
  that got no hue.
- **Not an answer:** "a blue accent with neutral grays." Which role is blue? What is failure? What is
  emphasis when blue is already spent?

### CHROME WEIGHT — how much of the frame you can see when nothing is happening

Rule weights and inks, corner radius, label case and tracking. What the interface looks like at rest.

- **Blueprint** — two weights and *three inks inside the 1px weight*: fine ruling `#b0b8be`, object
  line `#8a949b`, hard line `#252c32`. Radius 0 everywhere, including tags.
- **Editorial** — three weights with three jobs: hairline separates, leader bounds, and a 2px ink
  masthead rule under every run of figures. Radius 0: "a magazine has no rounded corners, anywhere."
- **Bento** — hairlines only, `--x-radius: 16px`, and **depth made of light, never shadow**: a lit
  1px top edge, a diagonal lift painted into the plane's own background, a cyan corner wash on the
  hero. Three translucent layers over one dark field.
- **Terminal** — 1px, radius `0px`, labels tracked `0.2em`, and the section rule terminates in real
  box-drawing glyphs: `├─ LABEL ────────┤`.
- **Swiss** — one hairline and one ink rule, and the ink rule *is* the whole vocabulary for active,
  hovered, and column heading.

- **Answer with:** how many weights, how many inks, the radius, and whether labels are tracked caps.
- **Not an answer:** "minimal, subtle borders, soft shadows." Instrument has no drop shadows by
  design — a direction that needs them has to say why it is the exception and how it avoids mud.

### BEHAVIOUR UNDER THE HAND — what a control does when you touch it

Not decoration; it is the axis that tells you whether a thing is a control at all. Three modes ship
(`--x-hover: lift | mark | invert`) plus how primary emphasis is drawn (`--x-emphasis: wash | fill`)
and, for `invert`, the selection pair (`--x-select-bg` / `--x-select-fg`).

Bento lifts. Swiss, Editorial and Blueprint mark. Terminal inverts into a solid green htop bar with
the void punched back out of every child — "htop, not hyperlink." And the mode has to fit the rest of
the brief: Editorial had to write its own hover because `mark` darkens a border to ink, which is
"invisible against a rule that is already ink."

- **Answer with:** the resting state, the hover state, and what a *selected* row looks like when
  nothing draws a box.
- **Not an answer:** "smooth hover transitions with a subtle lift." Every template says that.

### THE SIGNATURE MOVE — the one thing you would point at

One mechanism, describable in a sentence, that costs something to build and that nothing else on the
screen does. The test: **delete it, and is this still the same direction?** If yes, you have named a
detail rather than the signature.

- **Answer with:** a mechanism. "Enormous figures that hang on painted column lines" is a mechanism —
  it forces gap-0 grids, floors that divide twelve, and a background phased onto the content box.
- **Not an answer:** an adjective ("bold", "refined"), a mood ("feels premium"), or a stock effect
  ("glassmorphism"). Also not an answer: something a token swap already gives you. If your signature
  is "a nice accent colour", you have written a palette.

### THE COST — what this direction gives up (a check, not an axis)

Every one of the five pays for its idea, and says so in its own file header. Swiss gives up colour for
attention so red can mean alarm. Terminal gives up a second typeface. Blueprint gives up a hue for
`--i-signal` and pays in line weight. Editorial gives up boxes entirely. Bento gives up uniformity —
nothing is the same size as anything else.

A brief with no cost is a mood board. If you cannot name what you sacrificed, you have not committed
to anything yet, and the sheet will drift back toward the default under the first bit of pressure.

---

## 2 · The five, in this vocabulary

### Swiss Signal — *paper, a visible twelve-column grid, enormous figures, one red*

- **Field** — warm bone paper `#fbfaf7`, flat, both washes off; twelve painted column lines phased
  onto the content box (`--x-grid: columns`, `--x-grid-size: 8.3333%`).
- **Skeleton** — `topnav` × `rule`. Identity over a hairline, destinations spread across the full
  measure below; no box anywhere, just a top rule and whitespace.
- **Scale** — figure `5.4rem`, title `3.85rem`; `--x-stat-floor: 22rem` so auto-fit lands on 2, 3, 4
  or 6 tracks. The page opens on a word set as large as a number.
- **Density** — `1.15`, type scale default. Roomy, but the grids run gap-0 so figures stay on the lines.
- **Type** — one grotesque for everything, micro-labels included; mono only where the machine emits
  characters. Tracked caps at `0.16em`.
- **Colour** — one hue. Red `#da291c` = `--i-crit`, and it carries no wash because it cannot clear
  4.5:1 on a tint of itself. Signal, ok and emphasis are all ink.
- **Chrome** — hairline `#d4d0c6` plus an ink rule; radius 0; `--x-emphasis: fill`.
- **Hand** — `mark`: the label's rule goes black on hover or when a metric is hot.
- **Signature** — figures standing *on* a rule with the label beneath, hanging on painted column lines.
- **Cost** — no colour left for attention, which is the point.

### Terminal — *no boxes, a character grid and a status bar, dense*

- **Field** — GitHub dark `#0d1117` inside a `#010409` void frame; both washes off — "a terminal is
  lit by nothing."
- **Skeleton** — `statusbar` × `none`. A command line pinned above, a fixed status bar below carrying
  destinations as numbered keys; nothing draws a container at all.
- **Scale** — figure `1.95rem`, title `1.5rem` set as tracked caps. The banner is the smallest title
  in the set: nothing on this screen shouts.
- **Density** — `0.74` on **both** levers. ~14px body, 12.1px rows, 9.9px labels.
- **Type** — one family. `--i-prose` resolves to `--i-mono` on purpose; scale, tracking and density
  carry every distinction.
- **Colour** — four hues, status only: amber signal, cyan machine, red crit, green ok. Green is
  "live/attached" and nothing decorative has a hue.
- **Chrome** — 1px, radius `0px`, labels tracked `0.2em`, section labels terminated in box-drawing.
- **Hand** — `invert`: a solid green selection bar with the void punched out of every child, 8.2:1.
- **Signature** — density itself, plus `├─ LABEL ────────┤` and the htop bar.
- **Cost** — no second typeface, and no hierarchy from anything but size and space.

### Editorial Ops — *cream, a display serif, rules instead of boxes*

- **Field** — warm cream stock `#f7f1e4`, washes held near nothing so the paper reads uneven rather
  than flat; laid-paper grain on the rail.
- **Skeleton** — `rail` × `rule`. A narrow metadata column, destinations lowercase and marked with a
  dash. Nothing is boxed; hierarchy is a rule, a change of face, and the space between.
- **Scale** — title ~`5.2rem` against a `1.06`-scaled body: the headline does not lead the page, it
  dwarfs it. Figure `3rem`, binding on the four-up ledger totals.
- **Density** — `1.35`, the loosest in the set — with no boxes left, whitespace is the only divider.
- **Type** — serif for display *and* chrome, mono for everything the system emits. Ordered toward
  faces with lining figures so a column of costs does not drop below the baseline.
- **Colour** — four, in a printed register: ochre signal, slate machine, dusty crimson crit, printer's
  olive ok. The sheet was a two-colour press; two inks were mixed to fill roles it never needed.
- **Chrome** — three weights: hairline, leader, and a 2px ink masthead rule. Radius 0 everywhere.
- **Hand** — `mark`, overridden to a recessed warm stock, because marking a border to ink is invisible
  against a rule that is already ink. `--x-leader: 1` — the dotted index run.
- **Signature** — the display headline breaking a fraction left of the text block, opened by a drop cap.
- **Cost** — boxes. Every container in the product.

### Bento Console — *unequal tiles on midnight navy; composition is the hierarchy*

- **Field** — midnight navy `#04060d`, genuinely lit: two off-canvas corner washes, the machine's at
  `0.22`. The field between tiles is a large part of what you look at.
- **Skeleton** — `topbar` × `tile`. The nav bar is itself a tile floating on the field — nothing is
  furniture. `--x-hero: 1` gives the first metric a 2×2 cell.
- **Scale** — three tiers, not one number: hero `7.4rem`, tile `3.2rem`, strip `~0.45×` the tile.
  `--x-stat-floor: 12.5rem` is what holds them apart — at the house 8rem, eight columns fit, the rows
  go neat, and the direction disappears.
- **Density** — `1.1` space against `0.95` type: text tightens as the figures grow, and that ratio is
  the whole direction.
- **Type** — a condensed industrial grotesque in the mono role, sans for prose, and a real monospace
  restored for the one surface whose content is a character grid.
- **Colour** — four. Cyan machine is the loudest thing on screen; magenta crit is held in reserve;
  amber signal outranks composition (a hot tile never recesses and never takes the hero's edge).
- **Chrome** — hairlines, `--x-radius: 16px` (hero 1.7×), and depth from three translucent light
  layers — never a drop shadow, "which is what turns dark UI to mud."
- **Hand** — `lift`, with the cyan hover edge as the tell that a tile is a control.
- **Signature** — the hero tile: 2×2, a lit cyan edge, a gradient plane, and a tick ruler under the number.
- **Cost** — uniformity. Rows go ragged and cells are left empty on purpose.

### Blueprint — *a drafting sheet: fine grid, hard outlines, everything numbered*

- **Field** — paper `#fbfaf6` under a fine cyan grid at `4rem` (`--x-grid: fine`), washes off — an
  evenly lit sheet casts no glow.
- **Skeleton** — `titleblock` × `outline`. Stage left, notes and a title block down the right carrying
  the sheet index; every object is an outline with the grid running straight through it, nothing filled.
- **Scale** — figure `3.4rem` (dimensioned quantities are the largest thing on the sheet), title
  `1.6rem` — a sheet caption, not a headline. Floor `11rem`: rather 3 across on two rows than 6 at
  annotation size.
- **Density** — `0.82` space, `0.94` type. A drafting sheet packs its information; it does not float it.
- **Type** — mono for every annotation, label, figure and identifier; the grotesque for names only.
  `tabular-nums` declared on the theme root so numerals stack.
- **Colour** — one. Callout cyan is `--i-machine` and it also paints the grid; red is reserved and
  means a fault; `--i-signal` has **no hue** and signals with line weight instead.
- **Chrome** — two weights, three inks inside the 1px: fine ruling, object line, hard line. Radius 0
  down to the tags. `--x-emphasis: fill`.
- **Hand** — `mark`, plus `--x-band: rows` so a dense parts list stays trackable without boxes.
- **Signature** — annotation, three ways: registration ticks at each object's corner, balloon-and-leader
  item numbers, and a dimension line closing every block of quantities.
- **Cost** — a hue for `--i-signal`, paid back in line weight.

---

## 3 · The blank brief

Copy this into the top of your sheet as an HTML comment, filled in, before writing any CSS. Every
line answered in a sentence a stranger could act on.

```
DIRECTION: <one sentence, committed. A thing, not an adjective.>

FIELD        stock · lit or unlit · what is painted on it
SKELETON     where nav lives + what an item looks like · box | outline | rule | nothing
SCALE        loudest thing ÷ body, and how many fit across a row
DENSITY      space and type together — a number you could measure off a screenshot
TYPE         how many voices · what each is for · the distinction that survives a system stack
COLOUR       how many hues · which role gets which · what carries the roles that get none
CHROME       weights · inks · radius · label case and tracking
HAND         resting → hover → selected, when nothing draws a box
SIGNATURE    the one mechanism you would point at
COST         what this gives up to get it
```

Two checks before you build:

1. **Delete the signature line.** If the sheet is still recognisably this direction, the signature is
   wrong — go find the real one.
2. **Read only the COLOUR line aloud.** If that is the only line that would change to describe a
   direction you have already got, stop. See below.

---

## 4 · Two directions, or two palettes?

The whole method fails if the options are variations. You approve one because it is the only one in
front of you — the exact failure sheets exist to prevent (README, "Why this exists").

The five in this repo are not variations, and it is checkable rather than a matter of taste:

| | Shell | Surface | Density / type | Figure | Title | Hues |
|---|---|---|---|---|---|---|
| Swiss | topnav | rule | 1.15 / 1.0 | 5.4rem | 3.85rem | 1 |
| Terminal | statusbar | none | 0.74 / 0.74 | 1.95rem | 1.5rem | 4 |
| Editorial | rail | rule | 1.35 / 1.06 | 3.0rem | ~5.2rem | 4 |
| Bento | topbar | tile | 1.1 / 0.95 | 3.2rem (hero 7.4) | 2.2rem | 4 |
| Blueprint | titleblock | outline | 0.82 / 0.94 | 3.4rem | 1.6rem | 1 |

No shell is used twice. Only one pair shares a surface — Swiss and Editorial both dissolve the box
into a top rule — and they disagree on every other line: shell, field, density (1.15 vs 1.35), figure
(5.4 vs 3.0), title (3.85 vs 5.2), and colour budget (1 vs 4). Terminal and Bento are both dark and
share nothing else: one turns atmosphere off entirely, the other floods it; `0.74` against `1.1`
density; radius `0px` against `16px`.

**Three tests, cheapest first.**

1. **Diff the briefs, line by line.** If FIELD, SKELETON, SCALE, DENSITY and TYPE all match and only
   COLOUR differs, you have one direction and a variant. Kill one and write a real second.

2. **Swap the palettes.** Put Terminal's GitHub-dark values into Bento's skeleton. It is still Bento —
   unequal tiles, a hero, a floating nav tile, 16px corners. That is what a direction being *load
   bearing* looks like. If two of your sheets become each other under a palette swap, only one of them
   was a direction.

3. **The retrospective tell.** A genuine direction pushes back on the system when you translate it.
   Every axis in `CHANGELOG.md` 0.4.0 exists because a theme hit a wall: `--i-type-scale` because
   Terminal's density alone read as broken, `--x-hero` because Bento's tiles could not be unequal,
   `--x-leader` because Editorial wanted a magazine index, `--x-title` because every theme was opening
   its page at the same size. If a translation lands with no contract pressure at all, it was probably
   a re-skin — worth noticing after the fact, even though it is not a test you can run in advance.

The failure this catches is not aesthetic. Five palettes over one skeleton produce five versions of
the same product, and the skeleton is usually what someone means when they say they do not like how it
looks (`contract.css`, opening paragraph). A brief that only varies colour cannot fix that, however
many options you put on the wall.
