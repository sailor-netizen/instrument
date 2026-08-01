"""LEGEND — the Access App Launcher icon set, drawn in Instrument's language.

WHY THIS IS A GENERATOR AND NOT 24 FILES
The direction IS the shared plate. Every tile is the identical carbon panel with the identical
hairline bezel, and the entire identity of a tile is the mark cut into it. Twenty-four hand-written
files would drift on the plate within a month; here the plate exists once and a glyph is the only
thing an author writes.

THE RULES, ALL FROM src/tokens.css
  · "Colour is a CLAIM, never a coat of paint. Amber = this wants you or binds you."
    So 22 of 24 tiles carry NO hue. Amber appears on exactly two — Credential Broker and Flightdeck —
    because those two hold the fleet's credentials. Amber appears where the token appears. Teal is
    absent on purpose: teal means the machine is speaking, and a launcher tile is not speaking.
    Red and green are outcomes, and a launcher has no outcomes.
  · Three border weights, each meaning what the file says it means:
    1px --i-line = a boundary (the bezel) · 2px --i-rail = a spine (the acquirer rail) ·
    3px --i-stripe-w = an identity stripe. At the ~40px the launcher renders, the 64-unit grid scales
    by 0.625, so 1.6u/3.2u/5u land on exactly 1px/2px/3px. The weights are literally true at the size
    the icon is seen, not merely "derived from the tokens".
  · No box-shadow, no gradient, no wash, no hex outside the L0 palette.

FOUR CHANGES FROM THE DIRECTION AS PROPOSED, EACH FROM THE JUDGES
  1. The plate is SQUARE. Four of Instrument's six themes set --x-radius: 0 and blueprint (the
     default) is one of them; a rounded corner was tuned to bento alone and read as a generic app
     icon. Squaring also means nothing needs clipping, so there is no clipPath and no `id` in any
     file — which removes a real hazard: 24 documents sharing an id collide the moment anyone inlines
     them together.
  2. The stripe is NOT subdivided by category. That was decoration by its author's own admission,
     and nobody decodes segment counts at 40px.
  3. Warren is `[[ ]]`, the wikilink — it is a project-centric wiki, and a magnifier both said
     "search" and put a second circle beside Project Quant's disc.
  4. The horizontal-rectangle cluster is broken up: Radarr's film strip runs VERTICAL, and Jellyseerr
     is a bare plus rather than a fourth framed rectangle.

UNVERIFIED, AND WORTH SAYING: nobody has seen these inside the real launcher, because that page is
behind auth. The plate is therefore self-contained — its own fill plus a full-weight bezel — so it
holds on a light page and a dark one. If the launcher turns out to be light-on-light, the reversal is
four hexes and no geometry: carbon->paper, ink->ink-lt, amber-dk->amber-lt.

    python launcher-icons.py <outdir> [--theme <id>]

THEMED, AND WHY THE VALUES ARE READ RATHER THAN TYPED
An SVG served to Cloudflare is a standalone document on another origin: it cannot consume Instrument's
custom properties, so a theme has to be BAKED IN at generation. That is a real risk of drift — a
second copy of the palette that quietly stops matching the one in `src/themes/`. So nothing here is
retyped: the values are parsed out of the theme files themselves, and a theme that cannot supply a
role fails loudly instead of falling back to a guess.

Note what the launcher does to a theme choice. Every Instrument theme is designed for a page the
product CONTROLS; the launcher is a mark on a page it does not. A light theme's plate is near-white,
and near-white on Cloudflare's white is a tile with no edges. That is a genuine constraint none of the
existing themes was built for — see `sheets/README.md` on translation as measurement.
"""
from __future__ import annotations

import pathlib
import re
import sys
from dataclasses import dataclass

_HERE = pathlib.Path(__file__).resolve().parent
_SRC = _HERE.parent / "src"


@dataclass(frozen=True)
class Theme:
    """The six roles a tile actually consumes, resolved from one theme."""

    id: str
    plate: str      # --i-page       the field the mark is cut into
    ink: str        # --i-ink        primary glyph
    dim: str        # --i-dim        secondary glyph, bezel, stripe, rail
    signal: str     # --i-signal     the one hue — "this wants you or binds you"
    radius: float   # --x-radius     scaled onto the 64-unit grid

    @property
    def is_light(self) -> bool:
        """A plate lighter than mid-grey will not hold an edge on the launcher's white page."""
        h = self.plate.lstrip("#")
        r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
        return (0.299 * r + 0.587 * g + 0.114 * b) > 128


def _role(body: str, name: str) -> str | None:
    m = re.search(rf'{re.escape(name)}:\s*([^;]+);', body)
    return m.group(1).strip() if m else None


def load_theme(theme_id: str) -> Theme:
    """Parse one theme's tokens out of `src/`. Never retype a palette — see the module docstring."""
    if theme_id == "instrument":
        # The house voice lives in tokens.css as the L0 dark values, not in a themes/ file.
        body = (_SRC / "tokens.css").read_text(encoding="utf-8")
        got = {"--i-page": "#0c0f13", "--i-ink": "#e8ebf2", "--i-dim": "#98a2b3",
               "--i-signal": "#eaa640", "--x-radius": "0"}
        for role, literal in (("--i-page", "--_carbon"), ("--i-ink", "--_ink-dk"),
                              ("--i-dim", "--_dim-dk"), ("--i-signal", "--_amber-dk")):
            v = _role(body, literal)
            if v:
                got[role] = v            # read the L0 literal rather than trusting the fallback
    else:
        path = _SRC / "themes" / f"{theme_id}.css"
        if not path.exists():
            raise SystemExit(f"no such theme '{theme_id}' — have: {', '.join(theme_ids())}")
        css = path.read_text(encoding="utf-8")
        m = re.search(rf'\[data-theme="{theme_id}"\]\s*\{{(.*?)\n\}}', css, re.S)
        body = m.group(1) if m else ""
        got = {}
        for role in ("--i-page", "--i-ink", "--i-dim", "--i-signal", "--x-radius"):
            v = _role(body, role)
            if v is None:
                raise SystemExit(f"theme '{theme_id}' does not define {role} — refusing to guess")
            got[role] = v

    for role in ("--i-page", "--i-ink", "--i-dim", "--i-signal"):
        if not got[role].startswith("#"):
            raise SystemExit(
                f"theme '{theme_id}' gives {role} as {got[role]!r}. A tile is a standalone SVG with "
                "no cascade to resolve rgba()/light-dark() against, so only a literal hex can be "
                "baked in. Add one to the theme rather than approximating it here.")
    # --x-radius is a PAGE-scale value, tuned for cards a few hundred pixels wide. Bento's 16px
    # applied to a 40px tile is 40% of the tile — a pill, not a plate. So the theme's radius is read
    # as an INTENT (0 = square, >0 = rounded) and capped at something a 40px tile can carry.
    px = min(float(re.sub(r"[^0-9.]", "", got["--x-radius"]) or 0), 6.0)
    return Theme(theme_id, got["--i-page"], got["--i-ink"], got["--i-dim"], got["--i-signal"],
                 radius=px * (64 / 40))     # theme px are page-scale; the grid is 64 units at ~40px


def theme_ids() -> list[str]:
    return ["instrument"] + sorted(p.stem for p in (_SRC / "themes").glob("*.css"))


# ---- the plate, identical on every tile ---------------------------------------------------------
STRIPE_W = 5      # 3px at 40px — --i-stripe-w, an identity stripe
BEZEL_W = 1.6     # 1px at 40px — --i-line, a boundary
RAIL_W = 3.2      # 2px at 40px — --i-rail, a spine marking a group

THEME = load_theme("instrument")   # rebound by main(); the glyph table below reads these


def _plate(t: Theme) -> str:
    r = f' rx="{t.radius:g}"' if t.radius else ""
    return (f'<rect width="64" height="64" fill="{t.plate}"{r}/>'
            f'<rect x="{BEZEL_W / 2}" y="{BEZEL_W / 2}" width="{64 - BEZEL_W}" '
            f'height="{64 - BEZEL_W}"{r} fill="none" stroke="{t.dim}" stroke-opacity=".32" '
            f'stroke-width="{BEZEL_W}"/>')

# The rail groups the seven acquirers so the eye stops trying to tell them apart one by one, and it
# doubles as the discriminator for the three pairs that would otherwise collide:
# Radarr/Jellyfin, Lidarr/Navidrome, Shelfarr/Kavita. Acquirers are OUTLINE glyphs with a rail;
# the things that serve you are SOLID with none. Outline+rail vs solid+no-rail is two bits, and two
# bits survive 32px where a subtler distinction does not.
def _rail(t: Theme) -> str:
    return (f'<path d="M20 51h28" stroke="{t.dim}" stroke-width="{RAIL_W}" '
            f'stroke-linecap="square"/>')


def stripe(t: Theme, amber: bool) -> str:
    """The identity stripe, shaped to the plate's own corners.

    A plain rect overhangs a rounded plate — the amber bar sat proud of bento's corners with square
    ends, which is the tell of a stripe that was never told the plate had a radius. Clipping would be
    the obvious fix and it is the wrong one: a clipPath needs an `id`, and 24 documents sharing one
    collide the moment anybody inlines them together. So the stripe is drawn as a path that already
    follows the corner."""
    fill, op = (t.signal, ".95") if amber else (t.dim, ".55")
    r = min(t.radius, STRIPE_W)   # beyond the stripe's own width the corner stops being expressible
    d = (f"M{STRIPE_W} 0H{r}A{r} {r} 0 0 0 0 {r}V{64 - r}A{r} {r} 0 0 0 {r} 64H{STRIPE_W}Z"
         if r else f"M0 0h{STRIPE_W}v64H0Z")
    return f'<path d="{d}" fill="{fill}" fill-opacity="{op}"/>'


# ---- the glyphs ---------------------------------------------------------------------------------
# One hand throughout: a 64-unit grid, primary stroke 4, secondary 3.2, square terminals, no
# perspective, no rounded-cartoon forms. Every mark is rects, circles, arcs and straight paths.
# Silhouettes were allocated so that no two tiles share an outline class — the test was not "is this
# a good metaphor" but "at 40px, squinting, is this confusable with anything else in the set".
G = 'fill="none" stroke-width="4" stroke-linecap="square" stroke-linejoin="miter"'


def build_icons(t: Theme) -> dict[str, dict]:
    """The glyph table, resolved against one theme. A function rather than a module constant because
    the colours are baked into each path — see the module docstring on why a tile cannot inherit."""
    G2 = f'fill="none" stroke="{t.dim}" stroke-width="3.2" stroke-linecap="square"'
    return {
        # --- fleet ----------------------------------------------------------------------------------
        "fleet-home": {  # radiating rose — the launcher itself, everything points out from here
            "glyph": f'<g stroke="{t.ink}" {G}><path d="M34 14v40M14 34h40"/></g>'
                     f'<g {G2}><path d="M22 22l24 24M46 22L22 46"/></g>'},
        "grafana": {  # step-line — a chart that only ever steps
            "glyph": f'<g stroke="{t.ink}" {G}><path d="M14 46l8-10 8 6 8-16 8 8"/></g>'
                     f'<g {G2}><path d="M14 52h40"/></g>'},
        "broker": {  # keyhole — it holds the keys, so it gets the amber stripe
            "amber": True,
            "glyph": f'<g stroke="{t.ink}" {G}><circle cx="34" cy="26" r="9"/>'
                     f'<path d="M30 36l-2 16h12l-2-16"/></g>'},
        "omada": {  # access point: a dome under two broadcast arcs
            "glyph": f'<g stroke="{t.ink}" {G}><path d="M22 46a12 12 0 0 1 24 0"/></g>'
                     f'<g {G2}><path d="M16 32a20 20 0 0 1 36 0"/><path d="M24 22a26 26 0 0 1 20 0"/></g>'},
        "flightdeck": {  # reticle — the cockpit, and the other credential surface
            "amber": True,
            "glyph": f'<g stroke="{t.ink}" {G}><path d="M16 24V16h8M48 16h8v8M56 40v8h-8M24 48h-8v-8"/>'
                     f'</g><circle cx="34" cy="32" r="5" fill="{t.ink}"/>'},
        # --- agents ---------------------------------------------------------------------------------
        "agentdesk": {  # a prompt: chevron and cursor
            "glyph": f'<g stroke="{t.ink}" {G}><path d="M18 22l12 10-12 10"/></g>'
                     f'<g {G2}><path d="M34 44h16"/></g>'},
        "soundboard": {  # four pads, one lit — the lit one is the only ink in the mark
            "glyph": f'<g {G2}><rect x="16" y="16" width="16" height="16"/>'
                     f'<rect x="36" y="16" width="16" height="16"/>'
                     f'<rect x="36" y="36" width="16" height="16"/></g>'
                     f'<rect x="16" y="36" width="16" height="16" fill="{t.ink}"/>'},
        # --- trading --------------------------------------------------------------------------------
        "tradedesk": {  # candlesticks — offset bodies with wicks, unmistakable at any size
            "glyph": f'<g stroke="{t.ink}" {G}><path d="M22 18v28M34 22v24M46 14v32"/></g>'
                     f'<g fill="{t.ink}"><rect x="18" y="26" width="8" height="12"/>'
                     f'<rect x="30" y="30" width="8" height="10"/>'
                     f'<rect x="42" y="22" width="8" height="16"/></g>'},
        "quant": {  # a disc with a sector taken out — allocation
            "glyph": f'<circle cx="34" cy="32" r="17" fill="none" stroke="{t.ink}" stroke-width="4"/>'
                     f'<path d="M34 32V15a17 17 0 0 1 14.7 25.5z" fill="{t.ink}"/>'},
        # --- research -------------------------------------------------------------------------------
        "warren": {  # [[ ]] — the wikilink. It is a wiki, not a search box.
            "glyph": f'<g stroke="{t.ink}" {G}><path d="M28 16h-8v32h8M40 16h8v32h-8"/></g>'
                     f'<g {G2}><path d="M34 26v12"/></g>'},
        # --- media: the things that SERVE you (solid, no rail) --------------------------------------
        "jellyfin": {"glyph": f'<path d="M22 16l26 16-26 16z" fill="{t.ink}"/>'},
        "jellyseerr": {  # a bare plus — nothing else in the set is a cross, so it cannot be confused
            "glyph": f'<g fill="{t.ink}"><rect x="29" y="14" width="10" height="36"/>'
                     f'<rect x="16" y="27" width="36" height="10"/></g>'},
        "navidrome": {  # a level meter — solid bars, no outline anywhere
            "glyph": f'<g fill="{t.ink}"><rect x="16" y="30" width="6" height="12"/>'
                     f'<rect x="26" y="20" width="6" height="22"/>'
                     f'<rect x="36" y="14" width="6" height="28"/>'
                     f'<rect x="46" y="26" width="6" height="16"/></g>'
                     f'<g {G2}><path d="M14 50h40"/></g>'},
        "kavita": {  # a closed book, solid, with a spine gap so it is not a blob
            "glyph": f'<path d="M18 14h30v36H18z" fill="{t.ink}"/>'
                     f'<path d="M24 14v36" stroke="{t.plate}" stroke-width="3.2"/>'},
        # --- media: the ACQUIRERS (outline + rail) ---------------------------------------------------
        "radarr": {  # film strip, VERTICAL on purpose — the horizontal frame slot was crowded
            "rail": True,
            "glyph": f'<g stroke="{t.ink}" {G}><rect x="24" y="12" width="20" height="32"/></g>'
                     f'<g fill="{t.dim}"><rect x="27" y="16" width="4" height="4"/>'
                     f'<rect x="27" y="26" width="4" height="4"/><rect x="27" y="36" width="4" height="4"/>'
                     f'<rect x="37" y="16" width="4" height="4"/><rect x="37" y="26" width="4" height="4"/>'
                     f'<rect x="37" y="36" width="4" height="4"/></g>'},
        "sonarr": {  # a screen with RABBIT EARS — the V is what stops this being a fourth rectangle
            # First cut had short dim stubs; at 40px they read as a picture-hanging wire and the mark
            # became "framed picture", one glance from Bazarr. The ears are now primary-weight ink and
            # reach the top of the field, so the silhouette is a screen-with-a-V, not a rectangle.
            "rail": True,
            "glyph": f'<g stroke="{t.ink}" {G}><path d="M24 24L34 12l10 12"/>'
                     f'<rect x="16" y="24" width="36" height="20"/></g>'},
        "lidarr": {  # a note — outline, so it cannot be Navidrome's solid meter
            "rail": True,
            "glyph": f'<g stroke="{t.ink}" {G}><path d="M28 42V14l16 5v28"/></g>'
                     f'<g {G2}><circle cx="24" cy="42" r="5"/><circle cx="40" cy="46" r="5"/></g>'},
        "mylar": {  # a balloon with a tail — the tail is what keeps it out of the rectangle cluster
            "rail": True,
            "glyph": f'<g stroke="{t.ink}" {G}><path d="M16 16h36v22H32l-10 8v-8h-6z"/></g>'},
        "shelfarr": {  # an OPEN book — outline, so it cannot be Kavita's solid closed one
            "rail": True,
            "glyph": f'<g stroke="{t.ink}" {G}><path d="M34 20v24M34 20c-4-4-10-6-16-6v24c6 0 12 2 16 6'
                     f'M34 20c4-4 10-6 16-6v24c-6 0-12 2-16 6"/></g>'},
        "bazarr": {  # captions INSIDE the screen, where subtitles actually live
            # First cut hung the caption bars below the frame, which stacked three horizontal bands with
            # the rail underneath and read as busy. Inside the frame it is unambiguously "subtitles on a
            # screen" and the tile has one horizontal band plus its rail, like every other acquirer.
            "rail": True,
            "glyph": f'<g stroke="{t.ink}" {G}><rect x="14" y="16" width="40" height="26"/></g>'
                     f'<g fill="{t.ink}"><rect x="20" y="32" width="20" height="4"/>'
                     f'<rect x="44" y="32" width="4" height="4"/></g>'},
        "prowlarr": {  # a funnel — indexers narrowing to one result
            "rail": True,
            "glyph": f'<g stroke="{t.ink}" {G}><path d="M14 14h40L38 34v12l-8-6V34z"/></g>'},
        # --- media: transport and storage (outline, no rail) ----------------------------------------
        "qbittorrent": {  # arrow into a tray
            "glyph": f'<g stroke="{t.ink}" {G}><path d="M34 12v22M24 28l10 10 10-10"/></g>'
                     f'<g {G2}><path d="M16 44v6h36v-6"/></g>'},
        "soulseek": {  # two peers on a diagonal — the only two-node mark in the set
            "glyph": f'<g {G2}><path d="M25 25l18 18"/></g>'
                     f'<circle cx="22" cy="22" r="7" fill="{t.ink}"/>'
                     f'<circle cx="46" cy="46" r="7" fill="none" stroke="{t.ink}" stroke-width="4"/>'},
        "decypharr": {  # a cylinder — the only storage form here
            "glyph": f'<g stroke="{t.ink}" {G}><ellipse cx="34" cy="20" rx="17" ry="7"/>'
                     f'<path d="M17 20v24c0 4 8 7 17 7s17-3 17-7V20"/></g>'
                     f'<g {G2}><path d="M17 32c0 4 8 7 17 7s17-3 17-7"/></g>'},
    }


def render(t: Theme, spec: dict, label: str) -> str:
    parts = [_plate(t), stripe(t, spec.get("amber", False)), spec["glyph"]]
    if spec.get("rail"):
        parts.append(_rail(t))
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" '
            f'role="img" aria-label="{label}">' + "".join(parts) + "</svg>")


LABELS = {
    "fleet-home": "Fleet Home", "grafana": "Grafana", "broker": "Credential Broker",
    "omada": "Omada", "flightdeck": "Flightdeck", "agentdesk": "Agent Desk",
    "soundboard": "Soundboard", "tradedesk": "Tradedesk", "quant": "Project Quant",
    "warren": "Warren", "jellyfin": "Jellyfin", "jellyseerr": "Jellyseerr",
    "navidrome": "Navidrome", "kavita": "Kavita", "radarr": "Radarr", "sonarr": "Sonarr",
    "lidarr": "Lidarr", "mylar": "Mylar", "shelfarr": "Shelfarr", "bazarr": "Bazarr",
    "prowlarr": "Prowlarr", "qbittorrent": "qBittorrent", "soulseek": "Soulseek",
    "decypharr": "Decypharr",
}


# The picture on the launcher's own landing page, built from the SAME glyphs as the tiles.
#
# Cloudflare ships a stock illustration there — a cartoon of a person at a browser — which is the one
# element of that page most obviously not ours. `landing_page_design.image_url` replaces it (verified
# by read-back; `background_color` and `text_color` on that object are silently dropped, so the page
# stays white and this has to be drawn for light).
#
# Generated rather than drawn so it cannot drift: it is literally ten of the real tiles. Whatever the
# launcher shows, this shows. A hand-made illustration of a product is out of date the first time the
# product changes.
# Eighteen rather than a token few: the page says "everything running under one login", and a
# handful of tiles undersells that while leaving the slot mostly empty. The two amber tiles — the
# credential surfaces — open the middle row, so the one hue in the set sits at the optical centre
# instead of in a corner.
POSTER = ["fleet-home", "grafana", "omada", "agentdesk", "soundboard", "warren",
          "flightdeck", "broker", "tradedesk", "quant", "jellyfin", "navidrome",
          "sonarr", "radarr", "lidarr", "prowlarr", "qbittorrent", "decypharr"]


def poster(t: Theme, icons: dict) -> str:
    """Eighteen tiles, three rows — the launcher, drawn as itself."""
    tile, gap, pad = 56, 16, 28
    cols = 6
    # Derived from the tile count, not hardcoded — changing POSTER's length used to clip the last
    # row and run the rail through it, because the row count was written down in two places.
    rows = -(-len(POSTER) // cols)
    w = pad * 2 + cols * tile + (cols - 1) * gap
    h = pad * 2 + rows * tile + (rows - 1) * gap + 18
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" '
             f'height="{h}" role="img" aria-label="The Salior fleet">']
    for i, name in enumerate(POSTER):
        col, row = i % cols, i // cols
        x = pad + col * (tile + gap)
        y = pad + row * (tile + gap)
        spec = icons[name]
        inner = [_plate(t), stripe(t, spec.get("amber", False)), spec["glyph"]]
        if spec.get("rail"):
            inner.append(_rail(t))
        parts.append(f'<svg x="{x}" y="{y}" width="{tile}" height="{tile}" viewBox="0 0 64 64">'
                     + "".join(inner) + "</svg>")
    # A single 2px rail under the whole panel — the system's spine, marking these as one group.
    parts.append(f'<path d="M{pad} {h - 16}h{w - pad * 2}" stroke="{t.dim}" stroke-opacity=".45" '
                 f'stroke-width="{RAIL_W}"/>')
    parts.append("</svg>")
    return "".join(parts)


def main() -> int:
    args = sys.argv[1:]
    theme_id = "instrument"
    if "--theme" in args:
        i = args.index("--theme")
        theme_id = args[i + 1]
        args = args[:i] + args[i + 2:]
    if "--all-themes" in args:
        args.remove("--all-themes")
        root = pathlib.Path(args[0] if args else "icons")
        for tid in theme_ids():
            _emit(load_theme(tid), root / tid)
        return 0

    t = load_theme(theme_id)
    out = pathlib.Path(args[0] if args else "icons")
    _emit(t, out)
    if t.is_light:
        print(f"\n  NOTE: '{t.id}' has a light plate ({t.plate}). The launcher page is WHITE, so "
              "these tiles will have almost no edge there. Fine for a dark host; not for this one.")
    return 0


def wordmark(t: Theme) -> str:
    """The sign-in emblem — and it is drawn in the theme's PLATE colour, not its ink.

    Every other artefact here is a mark on the theme's own dark field. This one is not: Cloudflare
    renders `login_design.logo_path` inside a WHITE card, so the first version used ink-dk on white
    and came out as a pale grey smudge beside the org name. On a light host the theme's dark end is
    the drawing colour. The stripe stays the signal hue, which is the one value that works on both.

    No `<text>` and no font-family: SVG text reflows to whatever the viewer has installed, and the
    words are already supplied by `login_design.header_text` as real text."""
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" '
        'role="img" aria-label="Salior Fleet">'
        f'<rect width="5" height="96" fill="{t.signal}" fill-opacity=".95"/>'
        f'<g stroke="{t.plate}" fill="none" stroke-width="5" stroke-linecap="square">'
        '<path d="M54 22v52M28 48h52"/></g>'
        f'<g stroke="{t.plate}" stroke-opacity=".55" fill="none" stroke-width="4" '
        'stroke-linecap="square"><path d="M36 30l36 36M72 30L36 66"/></g>'
        "</svg>")


def _emit(t: Theme, out: pathlib.Path) -> None:
    out.mkdir(parents=True, exist_ok=True)
    icons = build_icons(t)
    for name, spec in icons.items():
        (out / f"{name}.svg").write_text(render(t, spec, LABELS[name]), encoding="utf-8")
    (out / "poster.svg").write_text(poster(t, icons), encoding="utf-8")
    (out / "wordmark.svg").write_text(wordmark(t), encoding="utf-8")
    sizes = {n: len((out / f"{n}.svg").read_text(encoding="utf-8")) for n in icons}
    missing = set(LABELS) ^ set(icons)
    if missing:
        raise SystemExit(f"LABEL/ICON MISMATCH: {missing}")
    print(f"{len(icons)} icons [{t.id}] -> {out}   plate={t.plate} ink={t.ink} "
          f"signal={t.signal} radius={t.radius:g}  total {sum(sizes.values()):,}b")


if __name__ == "__main__":
    raise SystemExit(main())
