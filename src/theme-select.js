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

export class InstrumentThemeSelect extends HTMLElement {
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
