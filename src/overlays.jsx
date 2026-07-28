/* ==============================================================================================
   INSTRUMENT — overlays and motion.

   Floating UI with NO dependency. Not austerity for its own sake: Floating UI, Radix and Framer are
   each larger than this entire library, and the platform now does the hard parts — top layer, focus
   trapping, light-dismiss, backdrop, exit animation. What was worth a dependency in 2022 is a
   `popover` attribute in 2026.

   WHAT EACH IS FOR, because picking the wrong one is the usual mistake:
     Tooltip     names a control. Never interactive, never essential — if losing it loses meaning,
                 it was a label. CSS only; it cannot trap focus because it never takes it.
     Popover     a small transient surface anchored to its trigger — a picker, a detail peek, a
                 confirm. Light-dismissable. NOT modal: the page behind stays live.
     Drawer      a side card. Modal, focus-trapped, for the detail of a thing in a list — the point
                 is you keep your place in the list underneath.
     Disclosure  in-place expansion. No overlay at all; use it when the detail belongs in the flow.

   DEGRADATION IS DELIBERATE. Anchor positioning and @starting-style are progressive enhancements:
   where they are missing the surface still opens, still closes, still traps focus — it just appears
   instead of animating, or centres instead of anchoring. Nothing here is load-bearing on an
   animation, which is the rule that keeps a dense tool usable on an old browser.
   ============================================================================================== */

import { useCallback, useEffect, useId, useRef, useState } from "react";

/** A control's name, on hover and on focus. Content only — never a control, never the only source of
 *  a meaning. Wired with aria-describedby so it is announced rather than merely drawn. */
export function Tooltip({ label, children, placement = "top", className = "" }) {
  const id = useId();
  return (
    <span className={`i-tipwrap ${className}`}>
      {/* cloneElement is avoided on purpose: the caller keeps full control of its own element, and a
          wrapper span cannot break a button's semantics the way a cloned prop can. */}
      <span aria-describedby={id}>{children}</span>
      <span role="tooltip" id={id} className={`i-tip is-${placement}`}>{label}</span>
    </span>
  );
}

/** A transient anchored surface. Uses the native Popover API, so the browser gives us the top layer,
 *  light-dismiss and Escape for free — and `popovertarget` means the trigger needs no handler. */
export function Popover({ trigger, children, placement = "bottom", className = "" }) {
  const id = useId().replace(/:/g, "");   // ids from useId contain ':' which is invalid in a selector
  return (
    <>
      <span className="i-pop-anchor" style={{ anchorName: `--${id}` }}>
        {/* popovertarget wires trigger to surface declaratively — no state, nothing to leak */}
        {typeof trigger === "function"
          ? trigger({ popovertarget: id })
          : <button type="button" className="i-btn is-quiet" popovertarget={id}>{trigger}</button>}
      </span>
      <div id={id} popover="auto" style={{ positionAnchor: `--${id}` }}
        className={`i-pop is-${placement} ${className}`}>
        {children}
      </div>
    </>
  );
}

/** The side card. A real <dialog>, so focus trapping, inert-ing the page behind, Escape and the
 *  backdrop are the platform's job rather than ours — every one of which is a thing hand-rolled
 *  drawers get wrong. `side` is which edge it comes from. */
export function Drawer({ open, onClose, title, side = "right", children, footer, className = "" }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    // close() rather than removing [open]: it is what fires the exit transition AND restores focus
    // to whatever opened the drawer, which a bare attribute removal silently skips.
    else if (!open && el.open) el.close();
  }, [open]);

  // A dialog can be dismissed by the platform (Escape, backdrop) without React knowing. Listening to
  // `close` is what keeps our state honest — without it the drawer reopens on the next render.
  const handleClose = useCallback(() => { onClose?.(); }, [onClose]);

  return (
    <dialog ref={ref} onClose={handleClose} className={`i-drawer is-${side} ${className}`}
      onClick={(e) => { if (e.target === ref.current) ref.current.close(); }}>
      <div className="i-drawer-head">
        <span className="i-drawer-title">{title}</span>
        <button type="button" className="i-btn is-ghost i-drawer-x" onClick={() => ref.current?.close()}
          aria-label="Close">✕</button>
      </div>
      <div className="i-drawer-body">{children}</div>
      {footer ? <div className="i-drawer-foot">{footer}</div> : null}
    </dialog>
  );
}

/** In-place expansion, animated by the one technique that works on content of unknown height:
 *  grid-template-rows 0fr → 1fr. max-height guesses a number and either clips or eases to nothing. */
export function Disclosure({ label, meta, open: controlled, onToggle, children, className = "" }) {
  const [local, setLocal] = useState(false);
  const isOpen = controlled ?? local;
  const toggle = () => (onToggle ? onToggle(!isOpen) : setLocal((o) => !o));
  return (
    <div className={`i-disc${isOpen ? " is-open" : ""} ${className}`}>
      <button type="button" className="i-disc-head" onClick={toggle} aria-expanded={isOpen}>
        <span className="i-disc-caret" aria-hidden="true">▸</span>
        <span className="i-disc-label">{label}</span>
        {meta ? <span className="i-disc-meta">{meta}</span> : null}
      </button>
      <div className="i-disc-wrap">
        <div className="i-disc-body">{children}</div>
      </div>
    </div>
  );
}
