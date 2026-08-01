"""Fleet Home — the launcher we own, built in Beacon.

WHY THIS EXISTS ALONGSIDE CLOUDFLARE'S LAUNCHER, rather than instead of it. The two do different
jobs. Cloudflare's is the identity gate: it knows which applications your policy actually admits, it
needs no maintenance, and it still works when this box does not. Its page, though, is Cloudflare's —
`bg_color` is accepted by the API and ignored by the renderer (measured: 93% white after setting it),
so it cannot be themed, and it cannot tell you that a tile leads to a dead origin.

This page can. It is the daily driver; theirs is the gate and the fallback.

THREE THINGS IT DOES THAT THE OTHER CANNOT
  1. It is Beacon end to end — the tokens below are read out of `src/themes/beacon.css`, not retyped,
     so the page and the tiles cannot drift from the theme.
  2. It shows LIVENESS. Every app is behind Access, so "reachable" looks like a 302 to a login page,
     while a Cloudflare 52x/530 means the edge answered and the ORIGIN did not. Nine hosts are in
     that state right now (vessl-02 and the GPU box are powered off) and the official launcher shows
     them as ordinary tiles.
  3. It is keyboard-first: type to filter, Enter to open the first match, Escape to clear.

The tiles are the LEGEND SVGs, INLINED rather than linked — which is only safe because that set was
built with no `id` and no `<style>` in any file. Inlining twenty-four documents that shared an id
would collide; that decision was made for a different reason and pays off here.

    python fleet-home.py <out.html> [--theme beacon]
"""
from __future__ import annotations

import pathlib
import re
import sys

_HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(_HERE))

from importlib import import_module   # noqa: E402

_icons = import_module("launcher-icons".replace("-", "_")) if False else None

STATUS_URL = "https://fleet-status.sailornetworking.workers.dev/"

# (group, [(icon slug, label, host, note)]). Hosts match the status worker's compiled-in list.
GROUPS: list[tuple[str, list[tuple[str, str, str, str]]]] = [
    ("fleet", [
        ("flightdeck", "Flightdeck", "flightdeck.salior.ai", "cockpit + vault"),
        ("broker", "Credential Broker", "broker.salior.ai", "the keys"),
        ("grafana", "Grafana", "grafana.salior.ai", "fleet metrics"),
        ("omada", "Omada", "omada.salior.ai", "network"),
    ]),
    ("agents", [
        ("agentdesk", "Agent Desk", "agentdesk.salior.ai", "fleet agents"),
        ("soundboard", "Soundboard", "soundboard.salior.ai", "discord bot"),
    ]),
    ("trading", [
        ("tradedesk", "Tradedesk", "tradedesk.salior.ai", "the agent"),
        ("quant", "Project Quant", "app.salior.ai", "the fund"),
    ]),
    ("research", [
        ("warren", "Warren", "warren.salior.ai", "research wiki"),
    ]),
    ("media · watch & read", [
        ("jellyfin", "Jellyfin", "jellyfin.salior.ai", "watch"),
        ("jellyseerr", "Jellyseerr", "jellyseerr.salior.ai", "request"),
        ("navidrome", "Navidrome", "navidrome.salior.ai", "listen"),
        ("kavita", "Kavita", "kavita.salior.ai", "read"),
    ]),
    ("media · acquire", [
        ("radarr", "Radarr", "radarr.salior.ai", "film"),
        ("sonarr", "Sonarr", "sonarr.salior.ai", "TV"),
        ("lidarr", "Lidarr", "lidarr.salior.ai", "music"),
        ("mylar", "Mylar", "mylar.salior.ai", "comics"),
        ("shelfarr", "Shelfarr", "shelfarr.salior.ai", "books"),
        ("bazarr", "Bazarr", "bazarr.salior.ai", "subtitles"),
        ("prowlarr", "Prowlarr", "prowlarr.salior.ai", "indexers"),
    ]),
    ("media · move & store", [
        ("qbittorrent", "qBittorrent", "qbit.salior.ai", ""),
        ("soulseek", "Soulseek", "slskd.salior.ai", ""),
        ("decypharr", "Decypharr", "decypharr.salior.ai", ""),
    ]),
    # Kept from the old dashboard: these three are on the GPU box and are NOT in Cloudflare's
    # launcher, so dropping them here would quietly lose the only link anyone had to them.
    ("gpu box", [
        ("llm", "LLM", "llm.salior.ai", "vLLM"),
        ("searxng", "SearXNG", "searxng.salior.ai", "search"),
        ("voicebox", "VoiceBox", "voicebox.salior.ai", "TTS"),
    ]),
]


def theme_block(theme_id: str) -> str:
    """Beacon's tokens, lifted verbatim from the theme file. Read, never retyped."""
    css = (_HERE.parent / "src" / "themes" / f"{theme_id}.css").read_text(encoding="utf-8")
    body = re.search(rf'\[data-theme="{theme_id}"\]\s*\{{(.*?)\n\}}', css, re.S).group(1)
    keep = [ln.rstrip() for ln in body.splitlines()
            if re.match(r"\s*--(i|x)-[a-z0-9-]+:", ln) or re.match(r"\s*color-scheme:", ln)]
    return "\n".join(keep)


def build(theme_id: str, icons_dir: pathlib.Path) -> str:
    svgs = {p.stem: p.read_text(encoding="utf-8") for p in icons_dir.glob("*.svg")}
    missing = {s for _, items in GROUPS for s, *_ in items} - set(svgs)
    if missing:
        raise SystemExit(f"no icon for: {sorted(missing)} — run launcher-icons.py first")

    # The header mark is INLINED like the tiles. It was an <img> pointing at the icon worker, which
    # made a page whose whole point is being ours depend on a third host — and this is a PWA, so an
    # offline load showed a broken-image glyph where the logo should be. Nothing here is fetched.
    mark = re.sub(r'\s(width|height)="\d+"', "", svgs["logo-on-dark"], count=2)
    mark = f'<span class="mark">{mark}</span>'

    sections = []
    for group, items in GROUPS:
        tiles = []
        for slug, label, host, note in items:
            # strip the fixed size so CSS controls it; the viewBox does the scaling
            svg = re.sub(r'\s(width|height)="\d+"', "", svgs[slug], count=2)
            tiles.append(
                f'<a class="tile" href="https://{host}" data-host="{host}" '
                f'data-find="{label.lower()} {host} {note}">'
                f'<span class="ic">{svg}</span>'
                f'<span class="lab"><span class="nm">{label}</span>'
                f'<span class="nt">{note or host}</span></span>'
                f'<span class="dot" data-state="?" title="checking"></span></a>')
        sections.append(f'<section><h2>{group}</h2><div class="grid">{"".join(tiles)}</div></section>')

    return f"""<!doctype html>
<html lang="en" data-theme="{theme_id}">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>salior — fleet home</title>
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#08090c">
<link rel="icon" href="/icon-192.png">
<style>
:root {{
{theme_block(theme_id)}
}}
* {{ box-sizing: border-box }}
body {{
  margin: 0; background: var(--i-page); color: var(--i-ink);
  font-family: var(--i-prose); font-size: 15px; line-height: 1.45;
  padding: clamp(18px, 4vw, 40px);
  -webkit-font-smoothing: antialiased;
}}
header {{ display: flex; align-items: center; gap: 16px; margin-bottom: 6px }}
.mark {{ line-height: 0; flex: none }}
.mark svg {{ width: 46px; height: 46px; display: block }}
h1 {{
  font-size: 1.35rem; margin: 0; font-family: var(--i-mono); font-weight: 600;
  text-transform: var(--x-label-case); letter-spacing: var(--x-label-track);
}}
.sum {{ margin: 0 0 26px 62px; color: var(--i-dim); font-family: var(--i-mono); font-size: 12px }}
.sum b {{ color: var(--i-ink); font-weight: 600 }}
.sum .bad {{ color: var(--i-signal) }}
#q {{
  width: 100%; max-width: 420px; margin: 0 0 26px; padding: 9px 12px;
  background: var(--i-plane); color: var(--i-ink);
  border: 1px solid var(--i-line); border-radius: var(--x-radius);
  font-family: var(--i-mono); font-size: 13px;
}}
#q:focus {{ outline: 2px solid var(--i-signal); outline-offset: 1px }}
#q::placeholder {{ color: var(--i-faint) }}
section {{ margin-bottom: 26px }}
h2 {{
  font-size: 10px; font-family: var(--i-mono); font-weight: 500; margin: 0 0 10px;
  color: var(--i-dim); text-transform: uppercase; letter-spacing: .16em;
}}
.grid {{ display: grid; gap: 10px; grid-template-columns: repeat(auto-fill, minmax(216px, 1fr)) }}
.tile {{
  display: flex; align-items: center; gap: 12px; padding: 10px 12px;
  background: var(--i-plane); border: 1px solid var(--i-line);
  border-radius: var(--x-radius); text-decoration: none; color: inherit; position: relative;
}}
.tile:hover, .tile:focus-visible {{ border-color: var(--i-line-hi); background: var(--i-plane-2); outline: none }}
.tile.on {{ border-color: var(--i-signal) }}
.ic {{ flex: none; line-height: 0 }}
.ic svg {{ width: 38px; height: 38px; display: block }}
.lab {{ min-width: 0; display: flex; flex-direction: column }}
.nm {{ font-size: 13.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis }}
.nt {{ font-size: 10.5px; color: var(--i-dim); font-family: var(--i-mono);
       white-space: nowrap; overflow: hidden; text-overflow: ellipsis }}
.dot {{ position: absolute; top: 8px; right: 8px; width: 6px; height: 6px; border-radius: 50%;
        background: var(--i-faint) }}
.dot[data-state="up"] {{ background: var(--i-ok) }}
.dot[data-state="origin-down"], .dot[data-state="error"] {{ background: var(--i-crit) }}
.dot[data-state="unreachable"] {{ background: var(--i-signal) }}
.tile.hide {{ display: none }}
section.hide {{ display: none }}
footer {{ margin-top: 30px; color: var(--i-faint); font-family: var(--i-mono); font-size: 10.5px }}
</style>

<header>
  {mark}
  <h1>Salior Fleet</h1>
</header>
<p class="sum" id="sum">checking&nbsp;…</p>
<input id="q" placeholder="type to filter · enter opens · esc clears" autofocus autocomplete="off">
{"".join(sections)}
<footer>one login, a month at a time · green = reachable · red = origin down</footer>

<script>
const tiles = [...document.querySelectorAll('.tile')];
const q = document.getElementById('q');

/* Filter. Sections empty themselves out so the page does not leave orphan headings behind. */
function apply() {{
  const v = q.value.trim().toLowerCase();
  for (const t of tiles) t.classList.toggle('hide', !!v && !t.dataset.find.includes(v));
  for (const s of document.querySelectorAll('section'))
    s.classList.toggle('hide', ![...s.querySelectorAll('.tile')].some(t => !t.classList.contains('hide')));
  const first = tiles.find(t => !t.classList.contains('hide'));
  for (const t of tiles) t.classList.toggle('on', t === first && !!v);
}}
q.addEventListener('input', apply);
q.addEventListener('keydown', (e) => {{
  if (e.key === 'Escape') {{ q.value = ''; apply(); }}
  if (e.key === 'Enter') {{
    const first = tiles.find(t => !t.classList.contains('hide'));
    if (first) location.href = first.href;
  }}
}});
/* Any keystroke anywhere returns to the filter — the box is the whole interface. */
addEventListener('keydown', (e) => {{
  if (e.target !== q && e.key.length === 1 && !e.metaKey && !e.ctrlKey) {{ q.focus(); }}
}});

/* Liveness. Every app is behind Access, so a 302 IS the healthy answer; a 52x/530 means the edge
   answered and the origin did not. Failing to reach the status worker leaves every dot neutral
   rather than painting the fleet green, because an unknown state must not look like a good one. */
fetch({STATUS_URL!r}, {{ cache: 'no-store' }})
  .then(r => r.ok ? r.json() : Promise.reject(r.status))
  .then(d => {{
    const by = Object.fromEntries(d.hosts.map(h => [h.host, h]));
    let up = 0, bad = 0;
    for (const t of tiles) {{
      const h = by[t.dataset.host];
      if (!h) continue;
      const dot = t.querySelector('.dot');
      dot.dataset.state = h.state;
      dot.title = h.state + ' · HTTP ' + h.status + ' · ' + h.ms + 'ms';
      h.state === 'up' ? up++ : bad++;
    }}
    document.getElementById('sum').innerHTML =
      '<b>' + up + '</b> reachable' + (bad ? ' · <span class="bad">' + bad + ' origin down</span>' : '');
  }})
  .catch(() => {{ document.getElementById('sum').textContent = 'status unavailable'; }});

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {{}});
</script>
</html>
"""


def main() -> int:
    args = [a for a in sys.argv[1:]]
    theme = "beacon"
    if "--theme" in args:
        i = args.index("--theme"); theme = args[i + 1]; args = args[:i] + args[i + 2:]
    out = pathlib.Path(args[0] if args else "fleet-home.html")
    html = build(theme, _HERE / "launcher-icons")
    out.write_text(html, encoding="utf-8")
    n = sum(len(items) for _, items in GROUPS)
    print(f"fleet-home [{theme}] -> {out}  {n} tiles, {len(html):,} bytes")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
