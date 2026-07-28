/* ============================================================================================
   INSTRUMENT — compounds.  The patterns that recur across real screens.

   These were EXTRACTED, not invented: each one replaces a cluster of one-off `fd-*` classes that
   had been copy-pasted across views. That order matters — a component library designed up front
   guesses at what screens need; one extracted from working screens knows.

   Rule of admission: a pattern earns a component when it appears in THREE places or when getting it
   wrong has a cost (a metric that is silently unclickable, a verdict that reads green when it failed).
   Anything appearing twice stays a one-off until it proves itself.
   ============================================================================================ */

import { H, P, Tag } from "./primitives.jsx";

/** The page shell: title, one line of orientation, then content. Every view had hand-rolled this same
 *  header + canvas pair (10 copies), which is exactly how headers drift apart. */
export function View({ title, sub, actions, children, className = "" }) {
  return (
    <div className={`i-view ${className}`}>
      <header className="i-view-head">
        <div className="i-view-titles">
          <H level={1}>{title}</H>
          {sub ? <div className="i-view-sub">{sub}</div> : null}
        </div>
        {/* actions sit ON the title row rather than under it. A dev tool that spends 150px of every
            screen on a heading and a sentence has spent it on the least useful thing there. */}
        {actions ? <div className="i-view-actions">{actions}</div> : null}
      </header>
      {children}
    </div>
  );
}

/** The context strip: what you are working on, its live state, and the action that state implies.
 *
 *  Every screen used to open with a title and no orientation — you could not tell which branch you
 *  were on or whether there was uncommitted work without leaving the app. This is the one row that
 *  answers that, and it sits above the page title rather than inside any screen, because the answer
 *  is the same on all of them.
 *
 *  `items` are {label, value, tone?} facts. `action` is the thing the state implies (review a dirty
 *  tree, deploy a clean one) — one primary, never a menu. */
export function ContextBar({ scope, items = [], action, children, className = "" }) {
  const facts = items.filter((i) => i && i.value !== undefined && i.value !== null && i.value !== "");
  return (
    <div className={`i-ctxbar ${className}`}>
      {scope ? <span className="i-ctx-scope">{scope}</span> : null}
      {facts.map((i) => (
        <span key={i.label} className={`i-ctx-fact${i.tone ? ` tone-${i.tone}` : ""}`}>
          <span className="i-ctx-k">{i.label}</span>
          <span className="i-ctx-v">{i.value}</span>
        </span>
      ))}
      {children}
      {action ? <span className="i-ctx-act">{action}</span> : null}
    </div>
  );
}

/** Two things pushed apart on one line — a title and its badge, a label and its actions. */
export function Split({ children, className = "" }) {
  return <div className={`i-split ${className}`}>{children}</div>;
}

/** A card in a responsive grid: a title, an optional badge, a line of blurb. Three screens reached for
 *  this shape independently (the Home launcher, the workflow catalog, the fleet host list) — which is
 *  exactly the threshold, and they had already drifted to three different paddings before this existed. */
export function Card({ title, badge, blurb, selected, onClick, className = "", children }) {
  const Tag_ = onClick ? "button" : "div";
  return (
    <Tag_ type={onClick ? "button" : undefined} onClick={onClick}
      className={`i-card${selected ? " is-on" : ""}${onClick ? " is-link" : ""} ${className}`}>
      <span className="i-card-top">
        <span className="i-card-title">{title}</span>
        {badge}
      </span>
      {blurb ? <span className="i-card-blurb">{blurb}</span> : null}
      {children}
    </Tag_>
  );
}

export function Cards({ children, className = "" }) {
  return <div className={`i-cards ${className}`}>{children}</div>;
}

/** A metric. `to` makes it a route into the view that owns the number — a stat you cannot click is a
 *  dead end, and every number in this product belongs to a screen. `hot` marks it as wanting attention. */
export function Stat({ value, label, hot, onClick, className = "" }) {
  const Tag_ = onClick ? "button" : "div";
  return (
    <Tag_ type={onClick ? "button" : undefined} onClick={onClick}
      className={`i-stat${hot ? " is-hot" : ""}${onClick ? " is-link" : ""} ${className}`}>
      {/* the inner wrapper is the query container, NOT .i-stat itself: `container-type` implies style
          containment, which scopes CSS counters locally — with it on the root every annotated stat
          numbered itself 01. Keeping the container one level in leaves counters on the outer element. */}
      <span className="i-stat-fit">
        <span className="i-stat-v">{value}</span>
        <span className="i-stat-l">{label}</span>
      </span>
    </Tag_>
  );
}

/** A row of metrics. Auto-fits so a wide screen gets one row and a narrow one wraps cleanly. */
export function Stats({ children, className = "" }) {
  return <div className={`i-stats ${className}`}>{children}</div>;
}

/** A list row: title on the left, meta on the right, a supporting line beneath. The workhorse of
 *  Approvals, Reviews and every history list. `selected` and `tone` are visual states, not colours. */
export function Row({ title, meta, sub, tone, selected, onClick, className = "", children }) {
  const Tag_ = onClick ? "button" : "div";
  return (
    <Tag_ type={onClick ? "button" : undefined} onClick={onClick}
      className={`i-row${selected ? " is-on" : ""}${tone ? ` i-striped tone-${tone}` : ""}${onClick ? " is-link" : ""} ${className}`}>
      <span className="i-row-top">
        <span className="i-row-title">{title}</span>
        {meta ? <span className="i-row-meta">{meta}</span> : null}
      </span>
      {sub ? <span className="i-row-sub">{sub}</span> : null}
      {children}
    </Tag_>
  );
}

export function Rows({ children, className = "" }) {
  return <div className={`i-rows ${className}`}>{children}</div>;
}

/** A titled section: mono eyebrow + content. Replaces the ad-hoc eyebrow+margin pairs. */
export function Section({ title, children, className = "" }) {
  return (
    <section className={`i-section ${className}`}>
      {title ? <div className="i-eyebrow">{title}</div> : null}
      {children}
    </section>
  );
}

/** An action bar: controls on the left, a live status line beside them. */
export function Toolbar({ status, children, className = "" }) {
  return (
    <div className={`i-toolbar ${className}`}>
      {children}
      {status ? <span className="i-toolbar-status">{status}</span> : null}
    </div>
  );
}

/** Key/value metadata — the mono-label + value grid used by proposals and credentials. */
export function KV({ items, className = "" }) {
  const rows = items.filter((i) => i && i.value !== undefined && i.value !== null && i.value !== "");
  if (!rows.length) return null;
  return (
    <dl className={`i-kv ${className}`}>
      {rows.map((i) => (
        <div className="i-kv-pair" key={i.label}>
          <dt>{i.label}</dt>
          <dd>{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A terminal verdict. `tone` carries the meaning — a failed run must never render in the ok tone
 *  (that bug shipped once: the renderer keyed off a field the driver did not send). */
export function Callout({ tone = "mute", children, className = "" }) {
  return <div className={`i-callout tone-${tone} ${className}`}>{children}</div>;
}

/** The agent trace: a 2px rail with one line per step. The rail is the system's "a machine did this". */
export function Trace({ children, className = "" }) {
  return <div className={`i-trace ${className}`}>{children}</div>;
}

export function TraceLine({ label, detail, muted, className = "" }) {
  return (
    <div className={`i-traceline${muted ? " is-muted" : ""} ${className}`}>
      {label ? <b>{label}</b> : null} {detail}
    </div>
  );
}

/** A dense ledger. `cols` are template widths; header cells come from the same array so a column can
 *  never drift from its heading. */
export function Table({ cols, head, children, className = "" }) {
  const style = { "--i-cols": cols };
  return (
    <div className={`i-table ${className}`} style={style} role="table">
      {head ? (
        <div className="i-tr is-head" role="row">
          {head.map((h) => <span key={h} role="columnheader">{h}</span>)}
        </div>
      ) : null}
      {children}
    </div>
  );
}

export function TRow({ children, className = "", ...rest }) {
  return <div className={`i-tr ${className}`} role="row" {...rest}>{children}</div>;
}

/** A finding: severity + location + claim, with an optional verdict from a verification pass. */
export function Finding({ severity, where, children, verdict, why, refuted, className = "" }) {
  const TONE = { critical: "crit", high: "crit", medium: "signal", low: "mute" };
  const VTONE = { confirmed: "crit", refuted: "mute", unverified: "signal" };
  return (
    <div className={`i-finding${refuted ? " is-refuted" : ""} ${className}`}>
      <Tag tone={TONE[severity] || "mute"} label={severity} />
      <span className="i-finding-where">{where}</span>
      <span className="i-finding-body">
        {children}
        {verdict ? <> <Tag tone={VTONE[verdict] || "mute"} label={verdict} /></> : null}
        {why ? <span className="i-finding-why"> {why}</span> : null}
      </span>
    </div>
  );
}

/** Loading / failed-to-load, so no screen invents its own. A failed fetch must never look like "none". */
export function Loading({ what = "" }) {
  return <P dim>Loading{what ? ` ${what}` : ""}…</P>;
}

export function LoadError({ what, onRetry }) {
  return (
    <div className="i-loaderror">
      <H level={2}>Couldn&apos;t reach {what}</H>
      <P dim small>It may be starting, or unavailable. This is not the same as it being empty.</P>
      {onRetry ? <button type="button" className="i-btn is-quiet" onClick={onRetry}>Retry</button> : null}
    </div>
  );
}
