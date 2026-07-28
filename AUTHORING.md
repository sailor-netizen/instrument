# Extending Instrument

Four things you can add, in rough order of how often you'll add them: a **component**, a **theme**, a
**shell variant**, and — least often, but the one that keeps the others honest — a **structure axis**.

Read [README.md](README.md) first for what the system is. This file is how you grow it without
breaking the property that makes it worth having: *nine screens render correctly in six themes with
no screen knowing which theme is running.*

---

## The four invariants

Everything below is in service of these. If a change would break one, the change is wrong — not the
invariant.

1. **A component never contains a literal.** Colours, sizes and spacing come from `--i-*` roles and
   `--x-*` axes. The lint rule is stateable because of this: *a hex outside a theme file or the L0
   block is a violation.*
2. **A theme picks a hue; it never repurposes a role.** `--i-crit` means "this failed" in every
   theme, forever. This is the single rule that lets themes swap without auditing every screen.
3. **A component never knows which theme is active.** No `if (theme === 'terminal')` in a component,
   ever. If a component needs to vary, that variation is a *structure axis* — add one.
4. **Structure branches in exactly one place.** `shell.jsx`. Everywhere else, structure is CSS keyed
   on a `data-*` attribute.

---

## Adding a component

### First: does it earn a place?

A pattern is admitted when it appears in **three** screens, or when getting it wrong carries a real
cost (a metric that's silently unclickable, a verdict that reads green when it failed). Two
occurrences stay a one-off in the consuming app until they prove themselves.

This ordering matters and it is not pedantry. Every compound in `compounds.jsx` was *extracted from
working screens*, not designed up front — a library designed in advance guesses at what screens need;
one extracted from them knows. `Card` exists because three screens had independently grown the same
shape at three different paddings.

### Where it goes

| File | For |
|---|---|
| `src/primitives.jsx` | Leaves. No composition, no state. `Btn`, `Tag`, `Field`. |
| `src/compounds.jsx` | Patterns built from primitives. `Stat`, `Row`, `Table`, `Finding`. |
| `src/components.css` | Its styles. Zero literals. |
| `src/index.js` | Its export. One barrel, no deep imports. |

### The shape

```jsx
/** One sentence on what it MEANS, and — if it exists because of a bug — which bug.
 *  Those comments are why the next person doesn't undo the fix. */
export function Thing({ tone, selected, onClick, className = "", children }) {
  const Tag_ = onClick ? "button" : "div";
  return (
    <Tag_ type={onClick ? "button" : undefined} onClick={onClick}
      className={`i-thing${selected ? " is-on" : ""}${onClick ? " is-link" : ""} ${className}`}>
      {children}
    </Tag_>
  );
}
```

Conventions the whole library follows, so the next component doesn't have to be looked up:

- **`tone` is a meaning**, never a colour: `signal` · `machine` · `crit` · `ok` · `mute`. A prop
  asking for "amber" is a prop that hasn't decided what it means.
- **State is `is-*`**: `is-on`, `is-link`, `is-hot`, `is-refuted`. Never `active`, never `selected`.
- **Always accept `className`** and append it last, so a host can position without forking.
- **An element that does something is a `<button>`.** A `div` with `onClick` is a keyboard trap.
- **Respect the surface modes.** If your component draws a box, use the `.i-panel`/`.i-card` class or
  add your class to the four `[data-surface]` blocks in `contract.css`. A component that draws its own
  hard-coded border will look wrong in Terminal and Blueprint, and nobody will know why.

### The checklist

- [ ] Zero literals in its CSS
- [ ] Renders correctly under all four surface modes (`tile` / `outline` / `rule` / `none`)
- [ ] Real `:focus-visible` ring, not a removed outline
- [ ] Added to `gallery/index.html` — **this is not optional**; the gallery is how the next person
      finds out they broke you
- [ ] Exported from `src/index.js`

---

## Adding a theme

Two files: `src/themes/<id>.css` and one object in `src/themes.js`.

### 1. The registry entry

```js
{
  id: "drafting",
  name: "Drafting",
  blurb: "One line a human reads in the picker.",
  surface: "outline",       // tile | outline | rule | none
  shell: "titleblock",      // sidebar | topnav | rail | statusbar | topbar | titleblock
  scheme: "light",          // drives the ONE color-scheme signal
  grid: "fine",             // none | columns | fine
  annotate: 1,              // 0 | 1
  hover: "mark",            // lift | mark | invert
}
```

Nothing in this object is a colour. Colours are the CSS file's job, always.

### 2. The CSS file

```css
[data-theme="drafting"] {
  --i-mono: …;  --i-prose: …;          /* full system fallbacks, always */
  --i-page: …; --i-plane: …; --i-plane-2: …; --i-well: …;
  --i-line: …; --i-line-hi: …; --i-rail: …;
  --i-ink: …; --i-dim: …; --i-faint: …;
  --i-signal: …; --i-machine: …; --i-crit: …; --i-ok: …;
  --i-signal-wash: …; --i-machine-wash: …; --i-crit-wash: …;
  --i-wash-signal: …; --i-wash-machine: …;
  --x-figure: …; --x-title: …; --x-radius: …; --i-density: …;
}
/* then only the few rules the axes cannot express */
[data-theme="drafting"] .i-… { … }
```

Then add the import to `src/instrument.css` and to the host's entry file.

### Rules

1. **Fill every role.** A theme that leaves `--i-crit` inherited will show a failure in the previous
   theme's red. Check: the eight core roles are `page ink dim line signal machine crit ok`.
2. **Contrast is not negotiable.** `--i-ink` on `--i-page` and `--i-dim` on `--i-plane` both clear
   4.5:1. Compute it; do not eyeball it.
3. **Never target an app class.** `[data-theme="x"] .fd-runs` is a bug — the theme is patching a
   screen instead of expressing itself through the system. Target `.i-*` only.
4. **Keep the rules section short.** More than ~30 lines of `[data-theme]` rules means the contract is
   missing an axis. Add the axis (below) rather than brute-forcing around it.
5. **No literals outside your `[data-theme]` blocks**, and never touch `:root`.

### Web fonts

Assume there are none. Themes ship into apps with no font loading, so lean on what system stacks
genuinely give you: monospace vs grotesque vs `Georgia`-class serif. That contrast is the biggest
type lever available and it costs nothing.

---

## Adding a shell variant

The shell is the **one** place structure branches, because a left sidebar, a bottom status bar and a
drafting title block are not the same DOM and clever CSS pretending otherwise is a compromise in all
three.

1. Add a `case` in `shell.jsx`. Compose `NavList` (it takes a `render` prop for bespoke items) and
   place `{stage}` wherever the layout wants it.
2. Add a `.i-shell.is-<name>` block in `shell.css`.
3. Add the collapse rule to the `@media (max-width: 60rem)` block at the bottom — every variant must
   degrade to a stacked page rather than a squeezed one.
4. Name it in the `shell` field of a theme.

Adding a variant touches **no view**.

---

## Adding a structure axis

This is the meta one, and it's how the system actually grows. If a theme needs something it can't
express, that is information — the contract is short a dimension.

Symptoms you have this problem:

- A theme file is accumulating `[data-theme]` rules that restate the same idea per selector.
- Two themes independently wrote the same override.
- A component would need to know the theme name.

Every axis currently in `contract.css` got there this way. Worked examples:

- **`--i-chrome-face`** — card titles, buttons, tags and table heads were hardwired to the mono voice,
  so a theme whose display voice isn't the machine voice had to restate it at six selectors.
- **`--x-select-bg` / `--x-select-fg`** — `hover: invert` was hardwired to a wash with no foreground
  token, which is not an inversion. A mode the contract *names* has to be a mode it *delivers*.
- **`--x-title`** — page titles were pinned to `--i-h1`, so every theme opened its page identically.

### How

1. Add it to the contract table in `contract.css`, with a default in `:root` and a comment saying
   **what problem it solves**. A default that changes nothing for existing themes is a good default.
2. Make the component layer consume it.
3. Use it in at least one theme. An axis with no consumer is speculation.
4. Note it in `CHANGELOG.md`.

### Scalar or mode?

- A **scalar** (a size, a weight, a colour) is a `--x-*` custom property. Cheap; prefer it.
- A **mode** (a discrete choice that changes rules) is a `data-*` attribute written by `applyTheme()`,
  with its rule blocks in `contract.css`. Modes cost more — a mode with two values probably wants to
  be a scalar instead.

**Watch for coupling.** `--x-figure` and the stats grid floor were two numbers that had to agree by
hand, and didn't — a theme raised the figure and `$2.9433` overflowed into the next stat. The fix
wasn't a third token to tune; it was making the figure size *against its own container*
(`min(var(--x-figure), 18cqi)`) so the coupling can't desync. Prefer deriving over adding a knob.

---

## Before you ship

```bash
npm --prefix ../flightdeck/frontend run gate   # build · SSR render · design-lint · impeccable
```

Then open `gallery/index.html` and step through **every theme**. The gate proves it compiles and has
no rogue hex; only your eyes prove it still looks like itself.

A specific warning, learned the expensive way: **the build passing is not evidence the UI is right.**
Adding `container-type` to `.i-stat` fixed an overflow and silently broke annotation numbering,
because `container-type` implies style containment which scopes CSS counters. Build: green. Screens:
every item numbered `01`. Look at the pixels.
