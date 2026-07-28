/* ============================================================================================
   INSTRUMENT — the component layer.  Our own primitives, on our own tokens.

   WHY THESE EXIST.  Flightdeck used @astryxdesign/core, which is competent but carries its own
   structure and spacing opinions — and those opinions are most of why the product read as a generic
   dashboard. A design system you cannot change is a design system that owns you. These are ~10 small
   components with no dependencies beyond React, styled entirely from Instrument's semantic tokens.

   THE RULES THEY FOLLOW (same as the token layer):
     - A component never contains a literal colour. It reads --i-* roles, so a re-skin at L0 moves it.
     - `tone` is a MEANING, not a colour: signal / machine / crit / ok / mute. A component asking for
       "amber" is a component that hasn't decided what it means yet.
     - Every interactive element gets a real :focus-visible ring, not a removed outline.
     - Emphasis rides on weight, fill and rails — never on a new hue.
   ============================================================================================ */

/** Section/page heading. Mono, because structure is the machine's voice. */
export function H({ level = 2, children, className = "", ...rest }) {
  const Tag = `h${level}`;
  return <Tag className={`i-h i-h${level} ${className}`} {...rest}>{children}</Tag>;
}

/** Prose. `dim` for secondary, `small` for supporting detail. */
export function P({ dim, small, children, className = "", ...rest }) {
  return (
    <p className={`i-p${dim ? " is-dim" : ""}${small ? " is-small" : ""} ${className}`} {...rest}>
      {children}
    </p>
  );
}

/** An eyebrow: the mono micro-label that opens a section. */
export function Eyebrow({ children, className = "", ...rest }) {
  return <div className={`i-eyebrow ${className}`} {...rest}>{children}</div>;
}

/** A raised surface. `stripe` paints the 3px identity edge in a semantic tone. */
export function Panel({ tone, tier = 1, children, className = "", ...rest }) {
  return (
    <div
      className={`i-panel${tier === 2 ? " tier-2" : ""}${tone ? ` i-striped tone-${tone}` : ""} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

/** Button. `variant`: primary | quiet | ghost. Never carries a hue of its own. */
export function Btn({ label, variant = "quiet", disabled, children, className = "", ...rest }) {
  return (
    <button type="button" className={`i-btn is-${variant} ${className}`} disabled={disabled} {...rest}>
      {label ?? children}
    </button>
  );
}

/** A status tag. `tone` is the meaning; the palette is derived from it. */
export function Tag({ tone = "mute", label, children, className = "", ...rest }) {
  return <span className={`i-tag tone-${tone} ${className}`} {...rest}>{label ?? children}</span>;
}

/** Text input / textarea with an optional label. */
export function Field({ label, as = "input", value, onChange, className = "", ...rest }) {
  const Tag = as;
  return (
    <label className={`i-field ${className}`}>
      {label ? <span className="i-field-label">{label}</span> : null}
      <Tag className="i-input" value={value} onChange={(e) => onChange?.(e.target.value)} {...rest} />
    </label>
  );
}

/** Pill navigation (the agent picker, and anything else that switches a mode). */
export function Pills({ items, value, onChange, className = "" }) {
  return (
    <div className={`i-pills ${className}`} role="tablist">
      {items.map((it) => (
        <button key={it.id} type="button" role="tab" aria-selected={value === it.id}
          className={`i-pill${value === it.id ? " is-on" : ""}`} onClick={() => onChange(it.id)}>
          {it.label}
        </button>
      ))}
    </div>
  );
}

/** The empty state: a compact prompt, never a big bordered box around two lines. */
export function Empty({ title, description, level = 2, children }) {
  return (
    <div className="i-empty">
      <H level={level}>{title}</H>
      {description ? <P dim small>{description}</P> : null}
      {children}
    </div>
  );
}

/** A recessed well for verbatim machine output — diffs, logs, dry-runs. */
export function Well({ children, className = "", ...rest }) {
  return <pre className={`i-well ${className}`} {...rest}>{children}</pre>;
}
