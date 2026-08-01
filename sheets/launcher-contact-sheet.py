"""Contact sheet: all 24 launcher icons at the sizes they are actually seen, over three backgrounds.

The judges were unanimous that this is the step that catches what argument cannot — one of them only
found a collision in its own set by rasterising it. Adjacency is the point: a glyph can be perfectly
legible alone and still be the fourth horizontal rectangle in a row.

Three grounds because the launcher's own background cannot be inspected (that page is behind auth):
paper #eeece7, carbon #0c0f13, and a mid-grey worst case where neither the plate nor the bezel gets
any help from contrast.
"""
from __future__ import annotations

import pathlib
import sys

GROUNDS = [("paper", "#eeece7"), ("carbon", "#0c0f13"), ("mid-grey", "#7c8598")]
SIZES = [28, 32, 40, 48]

ORDER = [
    ("fleet", ["fleet-home", "flightdeck", "broker", "grafana", "omada"]),
    ("agents", ["agentdesk", "soundboard"]),
    ("trading", ["tradedesk", "quant"]),
    ("research", ["warren"]),
    ("media · serves you", ["jellyfin", "jellyseerr", "navidrome", "kavita"]),
    ("media · acquires", ["radarr", "sonarr", "lidarr", "mylar", "shelfarr", "bazarr", "prowlarr"]),
    ("media · moves & stores", ["qbittorrent", "soulseek", "decypharr"]),
]


def main() -> int:
    src = pathlib.Path(sys.argv[1])
    out = pathlib.Path(sys.argv[2])
    svgs = {p.stem: p.read_text(encoding="utf-8") for p in src.glob("*.svg")}

    rows = []
    for ground, bg in GROUNDS:
        dark = ground == "carbon"
        label_col = "#e8ebf2" if dark else "#12151b"
        rows.append(f'<section style="background:{bg};color:{label_col}">'
                    f'<h2>{ground} <span>{bg}</span></h2>')
        for size in SIZES:
            rows.append(f'<div class="band"><div class="sz">{size}px</div><div class="grid">')
            for group, names in ORDER:
                rows.append(f'<div class="grp"><div class="gl">{group}</div><div class="ic">')
                for n in names:
                    svg = svgs[n].replace('width="64" height="64"',
                                          f'width="{size}" height="{size}"')
                    rows.append(f'<figure>{svg}<figcaption>{n}</figcaption></figure>')
                rows.append("</div></div>")
            rows.append("</div></div>")
        rows.append("</section>")

    html = f"""<!doctype html><meta charset="utf-8"><title>LEGEND — launcher icons</title>
<style>
  body {{ margin:0; font:13px ui-sans-serif,system-ui,sans-serif; }}
  section {{ padding:22px 26px 30px; }}
  h2 {{ margin:0 0 14px; font-size:15px; font-weight:600; letter-spacing:.04em;
        text-transform:uppercase; opacity:.75 }}
  h2 span {{ font-family:ui-monospace,monospace; font-weight:400; opacity:.6; font-size:12px }}
  .band {{ display:flex; gap:16px; align-items:flex-start; margin-bottom:18px }}
  .sz {{ width:44px; flex:none; font-family:ui-monospace,monospace; font-size:11px; opacity:.6;
         padding-top:16px }}
  .grid {{ display:flex; flex-wrap:wrap; gap:18px }}
  .grp {{ display:flex; flex-direction:column; gap:5px }}
  .gl {{ font-size:9.5px; text-transform:uppercase; letter-spacing:.08em; opacity:.45 }}
  .ic {{ display:flex; gap:7px; align-items:flex-end }}
  figure {{ margin:0; display:flex; flex-direction:column; align-items:center; gap:3px }}
  figcaption {{ font-size:8px; opacity:.4; font-family:ui-monospace,monospace }}
</style>
{"".join(rows)}"""
    out.write_text(html, encoding="utf-8")
    print(f"{len(svgs)} icons, {len(GROUNDS)} grounds x {len(SIZES)} sizes -> {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
