# Contributing

The rules that keep this coherent are in **[AUTHORING.md](AUTHORING.md)** — how to add a component, a
theme, a shell variant, or a structure axis, and the four invariants that make each safe. Read that
first; this file is only the mechanics.

## Before you open a PR

```bash
npm run check      # the invariants — zero dependencies, runs anywhere
npm run gallery    # then LOOK at it, in more than one theme
```

`check` verifies what the README claims: no colour literal outside the token layer, every theme fills
every core role, no theme reaches into a consuming app's classes, every theme is both registered and
imported, no `box-shadow` anywhere. CI runs the same script — there is no second, looser gate.

**The check passing is not evidence the UI is right.** Two bugs in this repo's history compiled and
linted cleanly and were wrong on screen: a `container-type` that silently scoped CSS counters so every
annotated item numbered `01`, and a `display: flex` that overrode the browser's own
`dialog:not([open]) { display: none }` so every drawer rendered permanently. Open the gallery.

## The bar for a new component

Three screens, or a real cost when it's wrong. Two occurrences stay a one-off in the consuming app
until they prove themselves. Everything in `compounds.jsx` was *extracted from working screens*, not
designed up front — a library designed in advance guesses at what screens need; one extracted from
them knows.

New components go in the gallery in the same change. That is how the next person finds out they broke
you.

## Adding to the axis list

If a theme can't express something and is accumulating overrides, the contract is short a dimension —
add the axis rather than brute-forcing around it, and record **which theme asked** in
[CHANGELOG.md](CHANGELOG.md). Every one of the fifteen axes got there that way. That provenance is
the only thing stopping the list growing on speculation.
