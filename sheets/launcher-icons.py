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

    python launcher-icons.py <outdir>
"""
from __future__ import annotations

import pathlib
import sys

# ---- L0 palette. The only literals in the file, copied from src/tokens.css ----------------------
CARBON = "#0c0f13"
INK = "#e8ebf2"      # --_ink-dk    primary glyph
DIM = "#98a2b3"      # --_dim-dk    secondary glyph, bezel, stripe, rail
AMBER = "#eaa640"    # --_amber-dk  the one hue, on the two credential surfaces

# ---- the plate, identical on every tile ---------------------------------------------------------
STRIPE_W = 5      # 3px at 40px — --i-stripe-w, an identity stripe
BEZEL_W = 1.6     # 1px at 40px — --i-line, a boundary
RAIL_W = 3.2      # 2px at 40px — --i-rail, a spine marking a group

PLATE = (
    f'<rect width="64" height="64" fill="{CARBON}"/>'
    f'<rect x="{BEZEL_W / 2}" y="{BEZEL_W / 2}" width="{64 - BEZEL_W}" height="{64 - BEZEL_W}" '
    f'fill="none" stroke="{DIM}" stroke-opacity=".32" stroke-width="{BEZEL_W}"/>'
)

# The rail groups the seven acquirers so the eye stops trying to tell them apart one by one, and it
# doubles as the discriminator for the three pairs that would otherwise collide:
# Radarr/Jellyfin, Lidarr/Navidrome, Shelfarr/Kavita. Acquirers are OUTLINE glyphs with a rail;
# the things that serve you are SOLID with none. Outline+rail vs solid+no-rail is two bits, and two
# bits survive 32px where a subtler distinction does not.
RAIL = f'<path d="M20 51h28" stroke="{DIM}" stroke-width="{RAIL_W}" stroke-linecap="square"/>'


def stripe(amber: bool) -> str:
    fill, op = (AMBER, ".95") if amber else (DIM, ".55")
    return f'<rect width="{STRIPE_W}" height="64" fill="{fill}" fill-opacity="{op}"/>'


# ---- the glyphs ---------------------------------------------------------------------------------
# One hand throughout: a 64-unit grid, primary stroke 4, secondary 3.2, square terminals, no
# perspective, no rounded-cartoon forms. Every mark is rects, circles, arcs and straight paths.
# Silhouettes were allocated so that no two tiles share an outline class — the test was not "is this
# a good metaphor" but "at 40px, squinting, is this confusable with anything else in the set".
G = 'fill="none" stroke-width="4" stroke-linecap="square" stroke-linejoin="miter"'
G2 = f'fill="none" stroke="{DIM}" stroke-width="3.2" stroke-linecap="square"'

ICONS: dict[str, dict] = {
    # --- fleet ----------------------------------------------------------------------------------
    "fleet-home": {  # radiating rose — the launcher itself, everything points out from here
        "glyph": f'<g stroke="{INK}" {G}><path d="M34 14v40M14 34h40"/></g>'
                 f'<g {G2}><path d="M22 22l24 24M46 22L22 46"/></g>'},
    "grafana": {  # step-line — a chart that only ever steps
        "glyph": f'<g stroke="{INK}" {G}><path d="M14 46l8-10 8 6 8-16 8 8"/></g>'
                 f'<g {G2}><path d="M14 52h40"/></g>'},
    "broker": {  # keyhole — it holds the keys, so it gets the amber stripe
        "amber": True,
        "glyph": f'<g stroke="{INK}" {G}><circle cx="34" cy="26" r="9"/>'
                 f'<path d="M30 36l-2 16h12l-2-16"/></g>'},
    "omada": {  # access point: a dome under two broadcast arcs
        "glyph": f'<g stroke="{INK}" {G}><path d="M22 46a12 12 0 0 1 24 0"/></g>'
                 f'<g {G2}><path d="M16 32a20 20 0 0 1 36 0"/><path d="M24 22a26 26 0 0 1 20 0"/></g>'},
    "flightdeck": {  # reticle — the cockpit, and the other credential surface
        "amber": True,
        "glyph": f'<g stroke="{INK}" {G}><path d="M16 24V16h8M48 16h8v8M56 40v8h-8M24 48h-8v-8"/>'
                 f'</g><circle cx="34" cy="32" r="5" fill="{INK}"/>'},
    # --- agents ---------------------------------------------------------------------------------
    "agentdesk": {  # a prompt: chevron and cursor
        "glyph": f'<g stroke="{INK}" {G}><path d="M18 22l12 10-12 10"/></g>'
                 f'<g {G2}><path d="M34 44h16"/></g>'},
    "soundboard": {  # four pads, one lit — the lit one is the only ink in the mark
        "glyph": f'<g {G2}><rect x="16" y="16" width="16" height="16"/>'
                 f'<rect x="36" y="16" width="16" height="16"/>'
                 f'<rect x="36" y="36" width="16" height="16"/></g>'
                 f'<rect x="16" y="36" width="16" height="16" fill="{INK}"/>'},
    # --- trading --------------------------------------------------------------------------------
    "tradedesk": {  # candlesticks — offset bodies with wicks, unmistakable at any size
        "glyph": f'<g stroke="{INK}" {G}><path d="M22 18v28M34 22v24M46 14v32"/></g>'
                 f'<g fill="{INK}"><rect x="18" y="26" width="8" height="12"/>'
                 f'<rect x="30" y="30" width="8" height="10"/>'
                 f'<rect x="42" y="22" width="8" height="16"/></g>'},
    "quant": {  # a disc with a sector taken out — allocation
        "glyph": f'<circle cx="34" cy="32" r="17" fill="none" stroke="{INK}" stroke-width="4"/>'
                 f'<path d="M34 32V15a17 17 0 0 1 14.7 25.5z" fill="{INK}"/>'},
    # --- research -------------------------------------------------------------------------------
    "warren": {  # [[ ]] — the wikilink. It is a wiki, not a search box.
        "glyph": f'<g stroke="{INK}" {G}><path d="M28 16h-8v32h8M40 16h8v32h-8"/></g>'
                 f'<g {G2}><path d="M34 26v12"/></g>'},
    # --- media: the things that SERVE you (solid, no rail) --------------------------------------
    "jellyfin": {"glyph": f'<path d="M22 16l26 16-26 16z" fill="{INK}"/>'},
    "jellyseerr": {  # a bare plus — nothing else in the set is a cross, so it cannot be confused
        "glyph": f'<g fill="{INK}"><rect x="29" y="14" width="10" height="36"/>'
                 f'<rect x="16" y="27" width="36" height="10"/></g>'},
    "navidrome": {  # a level meter — solid bars, no outline anywhere
        "glyph": f'<g fill="{INK}"><rect x="16" y="30" width="6" height="12"/>'
                 f'<rect x="26" y="20" width="6" height="22"/>'
                 f'<rect x="36" y="14" width="6" height="28"/>'
                 f'<rect x="46" y="26" width="6" height="16"/></g>'
                 f'<g {G2}><path d="M14 50h40"/></g>'},
    "kavita": {  # a closed book, solid, with a spine gap so it is not a blob
        "glyph": f'<path d="M18 14h30v36H18z" fill="{INK}"/>'
                 f'<path d="M24 14v36" stroke="{CARBON}" stroke-width="3.2"/>'},
    # --- media: the ACQUIRERS (outline + rail) ---------------------------------------------------
    "radarr": {  # film strip, VERTICAL on purpose — the horizontal frame slot was crowded
        "rail": True,
        "glyph": f'<g stroke="{INK}" {G}><rect x="24" y="12" width="20" height="32"/></g>'
                 f'<g fill="{DIM}"><rect x="27" y="16" width="4" height="4"/>'
                 f'<rect x="27" y="26" width="4" height="4"/><rect x="27" y="36" width="4" height="4"/>'
                 f'<rect x="37" y="16" width="4" height="4"/><rect x="37" y="26" width="4" height="4"/>'
                 f'<rect x="37" y="36" width="4" height="4"/></g>'},
    "sonarr": {  # a screen with RABBIT EARS — the V is what stops this being a fourth rectangle
        # First cut had short dim stubs; at 40px they read as a picture-hanging wire and the mark
        # became "framed picture", one glance from Bazarr. The ears are now primary-weight ink and
        # reach the top of the field, so the silhouette is a screen-with-a-V, not a rectangle.
        "rail": True,
        "glyph": f'<g stroke="{INK}" {G}><path d="M24 24L34 12l10 12"/>'
                 f'<rect x="16" y="24" width="36" height="20"/></g>'},
    "lidarr": {  # a note — outline, so it cannot be Navidrome's solid meter
        "rail": True,
        "glyph": f'<g stroke="{INK}" {G}><path d="M28 42V14l16 5v28"/></g>'
                 f'<g {G2}><circle cx="24" cy="42" r="5"/><circle cx="40" cy="46" r="5"/></g>'},
    "mylar": {  # a balloon with a tail — the tail is what keeps it out of the rectangle cluster
        "rail": True,
        "glyph": f'<g stroke="{INK}" {G}><path d="M16 16h36v22H32l-10 8v-8h-6z"/></g>'},
    "shelfarr": {  # an OPEN book — outline, so it cannot be Kavita's solid closed one
        "rail": True,
        "glyph": f'<g stroke="{INK}" {G}><path d="M34 20v24M34 20c-4-4-10-6-16-6v24c6 0 12 2 16 6'
                 f'M34 20c4-4 10-6 16-6v24c-6 0-12 2-16 6"/></g>'},
    "bazarr": {  # captions INSIDE the screen, where subtitles actually live
        # First cut hung the caption bars below the frame, which stacked three horizontal bands with
        # the rail underneath and read as busy. Inside the frame it is unambiguously "subtitles on a
        # screen" and the tile has one horizontal band plus its rail, like every other acquirer.
        "rail": True,
        "glyph": f'<g stroke="{INK}" {G}><rect x="14" y="16" width="40" height="26"/></g>'
                 f'<g fill="{INK}"><rect x="20" y="32" width="20" height="4"/>'
                 f'<rect x="44" y="32" width="4" height="4"/></g>'},
    "prowlarr": {  # a funnel — indexers narrowing to one result
        "rail": True,
        "glyph": f'<g stroke="{INK}" {G}><path d="M14 14h40L38 34v12l-8-6V34z"/></g>'},
    # --- media: transport and storage (outline, no rail) ----------------------------------------
    "qbittorrent": {  # arrow into a tray
        "glyph": f'<g stroke="{INK}" {G}><path d="M34 12v22M24 28l10 10 10-10"/></g>'
                 f'<g {G2}><path d="M16 44v6h36v-6"/></g>'},
    "soulseek": {  # two peers on a diagonal — the only two-node mark in the set
        "glyph": f'<g {G2}><path d="M25 25l18 18"/></g>'
                 f'<circle cx="22" cy="22" r="7" fill="{INK}"/>'
                 f'<circle cx="46" cy="46" r="7" fill="none" stroke="{INK}" stroke-width="4"/>'},
    "decypharr": {  # a cylinder — the only storage form here
        "glyph": f'<g stroke="{INK}" {G}><ellipse cx="34" cy="20" rx="17" ry="7"/>'
                 f'<path d="M17 20v24c0 4 8 7 17 7s17-3 17-7V20"/></g>'
                 f'<g {G2}><path d="M17 32c0 4 8 7 17 7s17-3 17-7"/></g>'},
}


def render(name: str, spec: dict, label: str) -> str:
    parts = [PLATE, stripe(spec.get("amber", False)), spec["glyph"]]
    if spec.get("rail"):
        parts.append(RAIL)
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


def main() -> int:
    out = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "icons")
    out.mkdir(parents=True, exist_ok=True)
    for name, spec in ICONS.items():
        svg = render(name, spec, LABELS[name])
        (out / f"{name}.svg").write_text(svg, encoding="utf-8")
    sizes = {n: len((out / f"{n}.svg").read_text(encoding="utf-8")) for n in ICONS}
    print(f"{len(ICONS)} icons -> {out}")
    print(f"largest {max(sizes, key=sizes.get)} at {max(sizes.values())} bytes, "
          f"total {sum(sizes.values()):,}")
    missing = set(LABELS) ^ set(ICONS)
    if missing:
        print(f"LABEL/ICON MISMATCH: {missing}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
