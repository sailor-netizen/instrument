# Instrument Design Prompt — Precision Workspace / Flightline Depth

Use this as the implementation prompt for applications in `sailor-netizen/instrument`.

## Role and outcome

Act as a senior product designer and frontend engineer. Build a finished, verified interface using the **Precision Workspace / Flightline Depth** system. The result must feel like a calm operational workspace—not a generic dashboard, marketing page, or uniform card grid.

Deliver working implementation, architecture notes, changed-file list, exact verification evidence, and a named unverified remainder.

## Product principles

- **Workspace before dashboard:** prioritise active work, recent context, favourites, tools, and fast switching.
- **Operational before decorative:** atmosphere supports clarity; it never competes with content.
- **Drop-in by contract:** tools integrate through manifests and a versioned host protocol, not feature-specific shell branches.
- **One shared language:** tokens, hierarchy, navigation, status, focus, spacing, and motion remain consistent.
- **Local-first:** user data stays on-device by default, with validated export/import and schema migrations.
- **Progressive depth:** keep the default view calm; reveal detail when requested.
- **Evidence over appearance:** do not call the work done until real tasks and states are observed.

## Visual signature

Create a **floating glass cockpit** with this layer hierarchy:

1. Ambient canvas: quiet tonal background with no more than two huge, heavily blurred colour fields.
2. Navigation anchor: stable translucent left rail; compact bottom navigation on mobile.
3. Workspace surface: the largest, quietest plane and the view's focal point.
4. Panels: grouped information with generous radii and restrained borders; not one card per fact.
5. Floating controls: search, command palette, contextual actions, tabs, and tool controls.
6. Transient layer: dialogs, sheets, menus, and toasts use the strongest depth.

Use a subtle morphing blob brand mark with a mint-to-violet gradient. Make the gradient scarce. Use machine teal for information/active state, signal amber for attention/ageing, and red only for failure, unsafe state, or destructive action. Never communicate status by colour alone.

## Canonical tokens

Adapt these to the repository's existing token architecture without changing their semantic relationships:

```css
:root {
  --accent: #8cf0cc;
  --accent-2: #a99cff;
  --info: #58c8d8;
  --warn: #ffc568;
  --danger: #ff6f79;
  --success: #62d9a6;
  --radius-sm: .65rem;
  --radius-md: 1rem;
  --radius-lg: 1.4rem;
  --radius-xl: 2rem;
  --speed-fast: 160ms;
  --speed: 240ms;
  --ease-out: cubic-bezier(.16, 1, .3, 1);
}

[data-theme="dark"] {
  --canvas: #0c1117; --canvas-2: #121925;
  --surface: rgba(23,31,43,.82); --surface-2: rgba(34,44,59,.78);
  --surface-3: #283546; --line: rgba(255,255,255,.095);
  --text: #f3f7f8; --muted: #9caab8;
}

[data-theme="light"] {
  --canvas: #eef2f4; --canvas-2: #f9fbfc;
  --surface: rgba(255,255,255,.82); --surface-2: rgba(252,253,254,.94);
  --surface-3: #e4ebee; --line: rgba(20,35,44,.11);
  --text: #142129; --muted: #60717b;
}

[data-theme="midnight"] {
  --canvas: #08091b; --canvas-2: #10122b;
  --surface: rgba(22,24,55,.84); --surface-2: rgba(30,34,72,.82);
  --surface-3: #30366d; --line: rgba(180,185,255,.14);
  --text: #f5f4ff; --muted: #a8abd0;
}
```

## Typography and hierarchy

- Use at most two type families: a restrained display face and a highly legible UI face.
- Use tabular numerals for time, attendance, output, efficiency, overtime, and ageing.
- Create one unmistakable focal heading per view; subordinate all secondary content.
- Use tight display tracking near `-0.03em`, balanced headings, and controlled line length.
- Do not use an unconsidered default font stack.

## Layout

- Desktop: floating left rail, grouped destinations, workspace command bar, optional tabs, dominant tool surface.
- Tablet: reduced icon-forward rail while preserving tool context.
- Mobile: no more than five bottom-nav destinations; place the rest in a More sheet.
- Keep tool actions in the command bar, not mobile navigation.
- Use asymmetric composition and varied panel spans; avoid uniform grids.
- Use independent panel scrolling only when it improves the task and remains obvious.

## Interaction patterns

Implement when relevant:

- `Ctrl+K` / `Cmd+K` command palette
- Search across tools and commands
- Persistent workspace tabs with lazy loading
- Favourites and recents
- Contextual active-tool actions
- Local export/import with validation and preview
- Loading, empty, error, offline, corrupt-data, timeout, and recovery states
- Toasts for lightweight confirmation; dialogs for consequential decisions

Each component needs deliberate default, hover, focus-visible, active, disabled, loading, empty, and error states where applicable.

## Motion and accessibility

- Use 150–280 ms motion with `cubic-bezier(.16,1,.3,1)`.
- Routine motion uses `transform` and `opacity`; do not animate layout properties.
- Motion explains transition or relationship; it is never continuous decoration except for the subtle brand mark.
- Honour `prefers-reduced-motion` and stop the logo morph.
- Use semantic HTML first. Icon-only controls need accessible names.
- Touch targets are at least 44×44 CSS pixels.
- Escape closes overlays and restores focus to the initiating control.
- Status is never encoded only through colour.

## Tool-hosting contract

When hosting modular tools, validate a registry manifest:

```js
{
  id: "example-tool",
  name: "Example Tool",
  description: "A concise task-oriented description.",
  category: "work",
  entry: "tools/ExampleTool.html",
  icon: "tool",
  version: 1,
  capabilities: ["theme", "commands", "export"],
  keywords: ["example", "task"],
  status: "stable"
}
```

Reject duplicate IDs, unsafe paths, missing fields, unknown capabilities, and unsupported versions. Invalid tools appear in diagnostics rather than disappearing.

Use a versioned message envelope:

```js
{
  protocol: "instrument/1",
  type: "tool.ready",
  toolId: "example-tool",
  requestId: "uuid",
  payload: {},
  timestamp: "ISO-8601 UTC"
}
```

Validate origin, source window, protocol, message type, tool identity, and payload shape at the boundary.

## Local-first data

- Put storage behind a versioned repository layer.
- Include schema version, update timestamp, application version, and explicit migrations.
- Validate the complete import before writing any record.
- Never destructively rewrite existing user data during a visual redesign.
- Provide export before migration and recoverable handling for corrupt data.

## Anti-patterns

Do not produce:

- Generic centred hero, gradient blob, and call-to-action
- Uniform statistic-card grids
- “Sidebar + four metrics + chart” as the entire design
- Excessive blur, gradient borders everywhere, or decorative animation
- Equal visual weight for all panels
- Unmodified component-library defaults
- Happy-path-only mock-ups
- Claimed accessibility/responsiveness without observation
- New tokens that silently bypass the repository's existing design system
- Tool-specific conditionals in the shared shell

## Required build procedure

1. Inspect existing tokens, layout primitives, navigation, registration, local storage, and runtime.
2. State the binding user task and current behaviour before editing.
3. Reuse repository conventions where they satisfy this system.
4. Add/adapt semantic tokens before styling individual screens.
5. Build a vertical slice: shell, navigation, command palette, one simple tool, one shared-data tool, and one form/output tool.
6. Cover all states and verify 320, 768, 1024, and 1440 px.
7. Run available tests, lint, type checks, and build commands.
8. Exercise the real browser flow: load, navigate, search, switch tools, change theme, use keyboard controls, trigger error/empty states, and inspect console/network failures.
9. Report observed results, exact failures, skipped checks, and unverified surfaces.

## Definition of done

The work is done only when:

- Every view has one clear focal point.
- The six-level Flightline layer hierarchy is visible.
- Dark, light, and midnight themes are intentional.
- Desktop, tablet, and mobile navigation work.
- Keyboard path, focus restoration, contrast, and reduced motion are observed.
- Loading, empty, error, overflow, and recovery states exist.
- Existing local data remains safe.
- Tests/build pass, or exact failures are reported.
- Real flows are observed at 320, 768, 1024, and 1440 px.
- The report separates verified behaviour from assumptions.

## Repository placement

Preferred:

```text
patterns/precision-workspace-flightline/PROMPT.md
patterns/precision-workspace-flightline/tokens.css
```

Alternative:

```text
prompts/precision-workspace-flightline.md
```
