/* ==============================================================================================
   INSTRUMENT — the default theme selector.

   Every product was hand-rolling the same <select> over THEMES + applyTheme; this is that
   control, shipped once, with no framework required (React stays optional, per instrument.css).

       <script type="module"> import "…/instrument/theme-select.js"; </script>
       <instrument-theme-select></instrument-theme-select>

   Behaviour:
   - renders one <option> per registry entry, labelled with the theme's display name;
   - initial selection = the `value` attribute if set, else storedTheme() (last choice / default);
   - on user change it CALLS applyTheme (the one writer of the structural attributes) and emits a
     bubbling `theme-change` CustomEvent { id, theme } — hosts with their own persistence
     (a settings file, a server) listen to that; hosts without one need no wiring at all, since
     applyTheme already persists to localStorage;
   - it never applies a theme on mount: the HOST owns the boot theme (it may know better than
     localStorage — a synced settings file, a URL param). Set `value` and call applyTheme yourself.
   ============================================================================================== */

import { THEMES, applyTheme, storedTheme } from "./themes.js";

/**
 * WHY THE BASE CLASS IS A VARIABLE.
 *
 * `class X extends HTMLElement` EVALUATES HTMLElement at import time. In Node — server-side
 * rendering, a build step, a test runner — that global does not exist, so merely importing this
 * module threw `HTMLElement is not defined`, and because src/index.js re-exports this class, so did
 * importing the bare "instrument" specifier. Every consumer that renders on a server inherited the
 * throw from a component it may never use.
 *
 * The registration below was ALREADY guarded with `typeof customElements !== "undefined"`, which is
 * the tell: the DOM dependency was noticed and one of its two routes was closed. `define()` was
 * guarded; `extends` was not. A guard on one entry point is a speed bump next to an open door —
 * enumerate every route to the thing you are guarding, or the guard is decoration.
 *
 * Extending an empty class off-DOM keeps this module's public API byte-identical: same export, same
 * name, same shape, still registered on import in a browser. Off-DOM the class is inert, which is
 * correct — nothing can construct a custom element where custom elements do not exist.
 */
const ElementBase = typeof HTMLElement !== "undefined" ? HTMLElement : class {};

export class InstrumentThemeSelect extends ElementBase {
  connectedCallback() {
    if (this._select) return; // re-connects must not duplicate the control
    const select = document.createElement("select");
    select.className = this.getAttribute("select-class") || "i-input";
    for (const t of THEMES) {
      const option = document.createElement("option");
      option.value = t.id;
      option.textContent = t.name;
      select.appendChild(option);
    }
    select.value = this.getAttribute("value") || storedTheme();
    select.addEventListener("change", () => {
      const theme = applyTheme(select.value);
      this.dispatchEvent(
        new CustomEvent("theme-change", { detail: { id: select.value, theme }, bubbles: true }),
      );
    });
    this._select = select;
    this.appendChild(select);
  }

  get value() {
    return this._select ? this._select.value : this.getAttribute("value") || storedTheme();
  }

  set value(id) {
    if (this._select) this._select.value = id;
    else this.setAttribute("value", id);
  }
}

if (typeof customElements !== "undefined" && !customElements.get("instrument-theme-select")) {
  customElements.define("instrument-theme-select", InstrumentThemeSelect);
}
