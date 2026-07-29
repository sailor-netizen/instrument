# Direction sheets

Where a look starts life, before it is a theme.

A **direction sheet** is a standalone HTML page that renders a *real* screen in one specific visual
direction. It is hand-written and free to ignore this entire library. That freedom is the point.

## Why this exists

Every theme in `src/themes/` began as one of these, and the method is the reason they don't all look
like the same product in different colours.

The alternative — one person iterating on one design until someone says stop — has two failure modes
that are hard to see from inside it. You approve a design because it is the only one in front of you.
And an assistant asked to "make it better" guesses at what you meant, ships a variation, and you say
*"a bit better"*, which is the sound of nobody knowing what to do next.

Sheets replace guessing with picking. Five directions, side by side, same content in every one, and
you point at one.

## The loop

```
   1. SHEET          hand-written HTML, one screen, one direction. No library, no rules.
        ↓            free to change composition — which is what a token swap can never do
   2. COMPARE        several sheets side by side, same content, and a human picks
        ↓
   3. TRANSLATE      the winner becomes src/themes/<id>.css + a registry entry
        ↓            this is where you find out what the contract can and cannot express
   4. GAPS           what it couldn't express becomes a new structure axis — recorded in
                     CHANGELOG.md against the theme that asked for it
```

Step 3 is the interesting one. A sheet can do anything; a theme can only do what the contract allows.
Translating one into the other is a measurement, and the parts that don't survive are not failures —
they are the contract telling you which dimension it is missing. Every one of the twenty-two axes in
`contract.css` was found this way. None was designed up front.

## Writing one

Copy `_template.html`. Then:

1. **Commit hard to one idea.** A timid version of a strong direction is worse than useless here —
   the whole value is that the options look nothing like each other. If your instinct is to soften an
   edge toward something safer, do the opposite; the safe version is what got rejected.
2. **Use the same content as every other sheet.** Content is the control variable. Change it and you
   are no longer comparing designs, you are comparing screens.
3. **Change the SKELETON, not just the palette.** Where navigation lives, whether there are boxes at
   all, how dense it is, what the type is doing. If two sheets differ only in colour, one of them is
   not a direction.
4. **Say what it is in one sentence** at the top of the file, as a comment. "A drafting sheet: fine
   grid, hard outlines, everything numbered" is a direction. "Clean and modern" is not.

If step 4 is the one you find hard, that is the useful signal — see
**[DIRECTIONS.md](DIRECTIONS.md)**, which breaks a direction into ten axes each of the five existing
sheets genuinely disagrees about, with a blank brief to fill in. A line you cannot fill is a part of
the design nobody has decided yet.

### One trap, inherited from the originals

All five sheets here load their fonts from Google Fonts. They still render offline through their
fallback stacks — but *not as the artefact that was judged*, which matters if you are comparing them
on a plane, behind a strict CSP, or screenshotting them for an assistant to look at. The links were
left in deliberately: stripping them would change what was chosen. Just know that an offline
screenshot of these five is evidence about their **skeletons**, not their type.

The themes they became have no such dependency — a theme ships into apps that load no fonts at all,
so `editorial.css` is really *serif vs mono*, not *Fraunces vs Work Sans*.

## Comparing them

```bash
npm run gallery
```

Two walls, because there are two things worth comparing:

| Page | Shows | Use it when |
|---|---|---|
| [`gallery/sheets.html`](../gallery/sheets.html) | every **sheet** in this directory, side by side, each with its direction sentence and the theme it became | picking a direction — step 2 |
| [`gallery/compare.html`](../gallery/compare.html) | one **screen** across every installed theme at once | checking a translation survived — step 3 |

Both scale a full-width render down rather than reflowing it, because a responsive reflow destroys
the composition, and composition is the whole of what a sheet has to show. Both offer 1440 / 1100 /
720 so you can see a direction fail at a narrow width, which is where directions usually fail.

A new sheet appears on the wall once you add it to the list in `gallery/sheets.html`; `npm run check`
fails if the list and this directory disagree, so a sheet cannot go quietly missing from the
comparison it was written for.

## Working with an assistant

This is the part worth saying plainly, because it is why the directory exists.

An LLM cannot see your product. Ask one to "improve the UI" and it will make a change, describe the
change confidently, and have no idea whether it looks right — and neither will you, from the
description. Sheets fix that from both ends: it can *write* five genuinely different directions
cheaply, and you can *look* at all five before anything is built.

Give it the content and the constraint, one direction per agent, then compare. That is how the five
in this repo were made — five agents, one sheet each, the same content, and a human picked. (Each
agent drew two screens; the cockpit is the one kept here, because comparison needs one control
variable and five files, not ten.)

The screens under `gallery/screens/` serve the same purpose in reverse: they render the real component
vocabulary in whatever theme the URL asks for, so an assistant can screenshot its own work in six
themes and see what it actually did.
