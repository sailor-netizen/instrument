/* ============================================================================================
   INSTRUMENT — the library entry point.

   One import for every consumer:  import { Panel, Btn, Stat } from "./instrument";
   The CSS ships alongside and is imported once, in main.jsx:
       import "./instrument/tokens.css";      // L0 palette + L1 semantic roles
       import "./instrument/components.css";  // the component layer

   PORTABILITY.  This folder is self-contained — React plus two stylesheets, no other dependency.
   Copying it into another fleet app is the whole install; the app then styles itself by overriding
   the L0 block in tokens.css, which is the only place literals live.
   ============================================================================================ */

export { Shell } from "./shell.jsx";
export { THEMES, DEFAULT_THEME, applyTheme, storedTheme, themeById } from "./themes.js";
export { Btn, Empty, Eyebrow, Field, H, P, Panel, Pills, Tag, Well } from "./primitives.jsx";
export {
  Callout,
  Card,
  Cards,
  Finding,
  KV,
  LoadError,
  Loading,
  Row,
  Rows,
  Section,
  Split,
  Stat,
  Stats,
  TRow,
  Table,
  Toolbar,
  Trace,
  TraceLine,
  View,
} from "./compounds.jsx";
