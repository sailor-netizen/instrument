/* ==============================================================================================
   INSTRUMENT — the shell.

   Surface, colour and type are all reachable from CSS, so themes handle them by cascade alone and
   no component knows which theme is running. Navigation is the exception: a left sidebar, a top
   rule, a bottom status bar and a drafting title block are not the same DOM, and pretending they
   are with clever CSS produces something that is a compromise in every theme.

   So this is the one place structure branches, and it branches ONCE — every screen renders inside
   whichever variant is active, and none of them know. Adding a shell variant is a case here plus a
   block in shell.css; it does not touch a single view.
   ============================================================================================== */

import { THEMES } from "./themes.js";

function NavList({ nav, active, onNavigate, className = "", render }) {
  return (
    <nav className={className} aria-label="Main">
      {nav.map(([id, label], i) =>
        render ? render(id, label, i, active === id, () => onNavigate(id)) : (
          <button key={id} type="button" onClick={() => onNavigate(id)}
            className={`i-navitem${active === id ? " is-on" : ""}`}
            aria-current={active === id ? "page" : undefined}>
            {label}
          </button>
        ),
      )}
    </nav>
  );
}

function ThemePicker({ theme, onTheme }) {
  return (
    <label className="i-themepick">
      <span className="i-field-label">Theme</span>
      <select className="i-input" value={theme} onChange={(e) => onTheme(e.target.value)}
        aria-label="Visual theme">
        {THEMES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
    </label>
  );
}

export function Shell({
  variant = "sidebar", brand = "Instrument", nav = [], active, onNavigate,
  workspace = null, theme, onTheme, children,
}) {
  const controls = (
    <>
      {workspace}
      {onTheme ? <ThemePicker theme={theme} onTheme={onTheme} /> : null}
    </>
  );
  const stage = <main className="i-stage">{children}</main>;

  switch (variant) {
    /* TOPNAV — no side column at all. A two-tier rule: identity above, destinations spread across
       the full measure below, so the page starts at the very top of the field. */
    case "topnav":
      return (
        <div className="i-shell is-topnav">
          <header className="i-masthead">
            <div className="i-masthead-top">
              <div className="i-brand">{brand}</div>
              <div className="i-shell-controls">{controls}</div>
            </div>
            <NavList className="i-nav-spread" nav={nav} active={active} onNavigate={onNavigate} />
          </header>
          {stage}
        </div>
      );

    /* RAIL — a narrow metadata column set in the human voice, lowercase, with the active item
       marked by a short dash rather than a filled block. Editorial's register. */
    case "rail":
      return (
        <div className="i-shell is-rail">
          <aside className="i-rail-col">
            <div className="i-brand">{brand}</div>
            {controls}
            <NavList className="i-nav-stack" nav={nav} active={active} onNavigate={onNavigate}
              render={(id, label, i, on, go) => (
                <button key={id} type="button" onClick={go}
                  className={`i-navitem is-lower${on ? " is-on" : ""}`}
                  aria-current={on ? "page" : undefined}>
                  <span className="i-navitem-mark" aria-hidden="true">—</span>{label.toLowerCase()}
                </button>
              )} />
          </aside>
          {stage}
        </div>
      );

    /* STATUSBAR — the TUI. A command line pinned above, a fixed status bar below carrying the
       destinations as numbered keys. The stage between them is uninterrupted field. */
    case "statusbar":
      return (
        <div className="i-shell is-statusbar">
          <div className="i-cmdline">
            <span className="i-cmd-prompt" aria-hidden="true">&rsaquo;</span>
            <b>{brand.toLowerCase()}</b>
            <span className="i-cmd-arg">{active}</span>
            <span className="i-cmd-flag">--watch</span>
            <span className="i-cmd-right">{controls}</span>
          </div>
          {stage}
          <footer className="i-statusbar">
            <NavList className="i-nav-keys" nav={nav} active={active} onNavigate={onNavigate}
              render={(id, label, i, on, go) => (
                <button key={id} type="button" onClick={go}
                  className={`i-navkey${on ? " is-on" : ""}`}
                  aria-current={on ? "page" : undefined}>
                  <span className="i-navkey-n" aria-hidden="true">{i + 1}</span>
                  {label.toLowerCase()}
                </button>
              )} />
          </footer>
        </div>
      );

    /* TOPBAR — the bar is itself a tile, floating on the field with everything else. Bento's rule
       that nothing is furniture: navigation is one more object in the composition. */
    case "topbar":
      return (
        <div className="i-shell is-topbar">
          <header className="i-topbar">
            <div className="i-topbar-tile">{controls}</div>
            <NavList className="i-nav-pills i-topbar-tile" nav={nav} active={active}
              onNavigate={onNavigate}
              render={(id, label, i, on, go) => (
                <button key={id} type="button" onClick={go}
                  className={`i-pill${on ? " is-on" : ""}`}
                  aria-current={on ? "page" : undefined}>{label}</button>
              )} />
          </header>
          {stage}
        </div>
      );

    /* TITLEBLOCK — the drafting sheet. Notes and key at the top of the right column, the title
       block anchored at its foot carrying the sheet index. Destinations are sheet numbers. */
    case "titleblock":
      return (
        <div className="i-shell is-titleblock">
          {stage}
          <aside className="i-sheet-col">
            <section className="i-sheet-notes">
              <div className="i-eyebrow">Notes</div>
              <p className="i-p is-small is-dim">
                Every quantity on a sheet is a link; its target sheet is given in the item foot.
              </p>
            </section>
            <div className="i-titleblock">
              <div className="i-titleblock-head">
                <b>{brand}</b>
                <span className="i-tb-rev">rev 04</span>
              </div>
              <div className="i-titleblock-ws">{controls}</div>
              <div className="i-eyebrow">Sheet index</div>
              <NavList className="i-nav-index" nav={nav} active={active} onNavigate={onNavigate}
                render={(id, label, i, on, go) => (
                  <button key={id} type="button" onClick={go}
                    className={`i-sheetitem${on ? " is-on" : ""}`}
                    aria-current={on ? "page" : undefined}>
                    <span className="i-sheetitem-n" aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {label}
                  </button>
                )} />
            </div>
          </aside>
        </div>
      );

    /* SIDEBAR — the house default. A 2px rail marks the active route, the same rail the agent
       trace uses, so "you are here" and "a machine did this" share one visual idea. */
    default:
      return (
        <div className="i-shell is-sidebar">
          <aside className="i-side">
            <div className="i-brand">{brand}</div>
            {controls}
            <div className="i-eyebrow i-side-head">Cockpit</div>
            <NavList className="i-nav-stack" nav={nav} active={active} onNavigate={onNavigate} />
          </aside>
          {stage}
        </div>
      );
  }
}
