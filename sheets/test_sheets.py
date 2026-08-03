"""Tests for sheets/ — the launcher-icon set and Fleet Home, the only generators in this repo that
`npm run check` does not gate. Both ship straight to production: 27 SVGs served publicly from a
Cloudflare Worker, and the HTML for home.salior.ai.

WHY unittest AND NOT PYTEST. scripts/check.mjs gates the rest of the repo and says exactly why it
has zero dependencies: "This runs anywhere Node does, including a fresh CI container with no install
step, which is what keeps it from being skipped." embeds/*.test.mjs makes the same call for the JS
side, on node:test rather than a third-party runner. unittest is that same call for Python — stdlib,
no requirements.txt, no pip install, runs on whatever `python3` the machine already has. If this
suite outgrows what unittest expresses cleanly, that is the point at which pytest earns its install.

RUN IT
    python sheets/test_sheets.py
    npm run check          (wired into scripts/check.mjs, same as the embeds suite)

WHAT'S COVERED, AND WHY EACH ONE
  · Every emitted SVG, in every theme and both flavours, is well-formed XML — a malformed SVG is
    the loudest possible failure (renders as nothing) and the easiest to miss across 27 files.
  · `_vars_to_style()` never leaves a `var()` inside a `fill=`/`stroke=` attribute (Bug 1), including
    the self-closing-tag case a previous fix got wrong and turned into `<rect ... / style=…>`.
  · A baked theme's tiles use only that theme's four literals — no stray hex from a hand-edit.
  · `fleet_home._tokens()` round-trips every REAL theme file in src/themes/ (Bug 2), not a fixture —
    the bugs came from actual multi-line values and wrapped comments, and a fixture would have been
    written without the exact wrap that caused them.
  · No generated SVG declares an `id` — the whole set gets inlined into one HTML document, and a
    collision between two tiles' ids would only show up once someone actually did that.
  · The poster's viewBox contains every tile and the rail it draws, checked against the rendered
    output rather than by re-deriving the row/column arithmetic a second time in the test.
  · Regenerating with the current code reproduces the committed, deployed files byte-for-byte — a
    test suite that quietly reformats the shipped icons is worse than no test suite.
"""
from __future__ import annotations

import importlib.util
import pathlib
import re
import subprocess
import sys
import tempfile
import types
import unittest
import xml.etree.ElementTree as ET

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
THEMES_DIR = ROOT / "src" / "themes"


def _load(name: str, filename: str) -> types.ModuleType:
    """Import a hyphenated sheets/ script as a module, the way `import` cannot.

    Registers the module in sys.modules BEFORE executing it. launcher-icons.py declares `Theme` as
    a `@dataclass(frozen=True)` under `from __future__ import annotations`, so its field types are
    strings at class-creation time; dataclasses resolves them via `sys.modules[cls.__module__]`, and
    a module that isn't registered yet resolves to None and crashes with an AttributeError deep in
    the stdlib rather than anywhere near this file."""
    spec = importlib.util.spec_from_file_location(name, HERE / filename)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


launcher_icons = _load("launcher_icons", "launcher-icons.py")
fleet_home = _load("fleet_home", "fleet-home.py")

# "instrument" is a theme id the generators understand (read out of src/tokens.css) but has no
# themes/*.css file of its own — see load_theme()'s special case.
REAL_THEME_IDS = ["instrument"] + sorted(p.stem for p in THEMES_DIR.glob("*.css"))

# The core roles every theme must fill — same list scripts/check.mjs enforces (rule 2), reused here
# because a round-trip that drops one of these is exactly what Bug 2 did.
CORE_ROLES = ["page", "plane", "well", "line", "line-hi", "ink", "dim", "faint",
              "signal", "machine", "crit", "ok"]

HEX_RE = re.compile(r"#[0-9a-fA-F]{3,8}\b")
NESTED_TILE_RE = re.compile(r'<svg x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"')


def _run_generator(*args: str) -> None:
    """Invoke launcher-icons.py exactly as it ships — a subprocess through the real CLI, not a
    function call — so the byte-identical check exercises the same path that produced the committed
    artefacts, not a hand-picked shortcut through the module."""
    subprocess.run([sys.executable, str(HERE / "launcher-icons.py"), *args],
                    cwd=HERE, capture_output=True, text=True, check=True)


class _Generated:
    """Both flavours, generated once and shared read-only across the suite. Regenerating per test
    would make an already-subprocess-heavy suite quadratic in the number of assertions."""

    _tmp: tempfile.TemporaryDirectory | None = None
    all_themes_dir: pathlib.Path
    css_vars_dir: pathlib.Path

    @classmethod
    def ensure(cls) -> None:
        if cls._tmp is not None:
            return
        cls._tmp = tempfile.TemporaryDirectory(prefix="sheets-test-")
        root = pathlib.Path(cls._tmp.name)
        cls.all_themes_dir = root / "all-themes"
        cls.css_vars_dir = root / "css-vars"
        _run_generator("--all-themes", str(cls.all_themes_dir))
        _run_generator(str(cls.css_vars_dir), "--css-vars")

    @classmethod
    def all_svgs(cls) -> list[pathlib.Path]:
        cls.ensure()
        return sorted(cls.all_themes_dir.rglob("*.svg")) + sorted(cls.css_vars_dir.glob("*.svg"))


def setUpModule() -> None:
    _Generated.ensure()


def tearDownModule() -> None:
    if _Generated._tmp is not None:
        _Generated._tmp.cleanup()


class TestGeneratedSvgIsWellFormedXml(unittest.TestCase):
    def test_every_svg_across_every_theme_and_flavour_parses(self) -> None:
        files = _Generated.all_svgs()
        self.assertTrue(files, "no SVGs were generated — fixture setup is broken")
        for f in files:
            with self.subTest(file=f.name):
                try:
                    ET.fromstring(f.read_text(encoding="utf-8"))
                except ET.ParseError as exc:
                    self.fail(f"{f}: malformed SVG renders as NOTHING — {exc}")


class TestCssVarsNeverLeaksIntoAPresentationAttribute(unittest.TestCase):
    """Bug 1: `fill="var(--i-page)"` is not a paint — custom properties resolve in CSS declarations,
    not SVG presentation attributes — so the browser falls back to the initial value, black."""

    def test_var_in_a_presentation_attribute_is_moved_into_style(self) -> None:
        fixed = launcher_icons._vars_to_style('<rect width="64" height="64" fill="var(--i-page)"/>')
        self.assertNotIn('fill="var(', fixed)
        self.assertIn('style="fill:var(--i-page)"', fixed)

    def test_self_closing_tag_stays_valid_markup(self) -> None:
        # A previous fix appended the style attribute after the trailing slash and produced
        # `<rect ... / style="...">`, which is not markup at all.
        fixed = launcher_icons._vars_to_style(
            '<rect x="0.8" y="0.8" width="62.4" fill="none" stroke="var(--i-dim)"/>')
        self.assertNotIn("/ style=", fixed)
        self.assertTrue(fixed.rstrip().endswith('"/>'), fixed)
        ET.fromstring(f'<svg xmlns="http://www.w3.org/2000/svg">{fixed}</svg>')

    def test_non_self_closing_group_keeps_its_own_close_tag(self) -> None:
        fixed = launcher_icons._vars_to_style(
            '<g fill="none" stroke="var(--i-ink)" stroke-width="4">x</g>')
        self.assertNotIn('stroke="var(', fixed)
        self.assertTrue(fixed.startswith("<g "))
        ET.fromstring(fixed)  # the untouched "x</g>" tail must still close the rewritten opener

    def test_both_fill_and_stroke_move_together(self) -> None:
        fixed = launcher_icons._vars_to_style(
            '<path d="M0 0" fill="var(--i-page)" stroke="var(--i-dim)"/>')
        self.assertIn("fill:var(--i-page)", fixed)
        self.assertIn("stroke:var(--i-dim)", fixed)
        self.assertNotIn('fill="var(', fixed)
        self.assertNotIn('stroke="var(', fixed)

    def test_generated_css_vars_output_has_no_stray_var_in_an_attribute(self) -> None:
        _Generated.ensure()
        for f in _Generated.css_vars_dir.glob("*.svg"):
            text = f.read_text(encoding="utf-8")
            with self.subTest(file=f.name):
                self.assertNotRegex(text, r'\b(?:fill|stroke)="var\(')
                self.assertNotIn("/ style=", text)


class TestBakedThemeUsesOnlyItsOwnFourLiterals(unittest.TestCase):
    def test_every_hex_in_a_theme_output_is_one_of_its_four_roles(self) -> None:
        _Generated.ensure()
        for theme_id in REAL_THEME_IDS:
            theme = launcher_icons.load_theme(theme_id)
            allowed = {theme.plate.lower(), theme.ink.lower(), theme.dim.lower(), theme.signal.lower()}
            for f in (_Generated.all_themes_dir / theme_id).glob("*.svg"):
                found = {m.group(0).lower() for m in HEX_RE.finditer(f.read_text(encoding="utf-8"))}
                with self.subTest(theme=theme_id, file=f.name):
                    self.assertFalse(found - allowed,
                                      f"colours outside the theme's palette: {found - allowed}")


class TestTokensRoundTripsRealThemeFiles(unittest.TestCase):
    """Bug 2: line-based extraction silently swallowed declarations. Assert against the ACTUAL files
    in src/themes/, per sheets/README's own rule — a fixture would never have been written with the
    exact multi-line value or wrapped comment that caused the bug."""

    def test_every_core_role_survives_extraction_exactly_once(self) -> None:
        for theme_id in REAL_THEME_IDS:
            with self.subTest(theme=theme_id):
                out = fleet_home._tokens(theme_id)
                self.assertNotIn("/*", out, "a comment marker survived extraction")
                self.assertNotIn("*/", out, "a comment marker survived extraction")
                for role in CORE_ROLES:
                    needle = f"--i-{role}:"
                    count = out.count(needle)
                    self.assertEqual(count, 1, f"{theme_id}: expected one {needle}, found {count}")

    def test_beacon_multiline_mono_declaration_is_emitted_complete(self) -> None:
        # --i-mono in beacon.css wraps across two lines. Keeping only the first used to leave a
        # declaration with no terminating `;`, which then swallowed --i-prose and --i-page whole.
        out = fleet_home._tokens("beacon")
        mono = re.search(r"--i-mono:\s*([^\n]*;)", out)
        self.assertIsNotNone(mono, "--i-mono did not survive extraction at all")
        self.assertIn("monospace", mono.group(1))
        for role in ("--i-prose:", "--i-page:", "--i-ink:"):
            self.assertEqual(out.count(role), 1, f"beacon: {role} did not survive intact")

    def test_swiss_wrapped_comment_does_not_eat_the_declarations_after_it(self) -> None:
        # swiss.css opens a comment on the --i-faint line and closes it on the next one.
        out = fleet_home._tokens("swiss")
        for role in ("--i-faint:", "--i-signal:", "--i-machine:", "--i-crit:", "--i-crit-wash:"):
            self.assertEqual(out.count(role), 1, f"swiss: {role} did not survive intact")


class TestTileSetHasNoIdAttribute(unittest.TestCase):
    def test_no_generated_svg_declares_an_id(self) -> None:
        for f in _Generated.all_svgs():
            with self.subTest(file=f.name):
                self.assertNotRegex(f.read_text(encoding="utf-8"), r"\bid\s*=",
                                     "27 tiles get inlined into one document — a duplicate id collides")


class TestPosterViewboxContainsEveryTile(unittest.TestCase):
    def test_every_tile_and_the_rail_fit_inside_the_declared_viewbox(self) -> None:
        _Generated.ensure()
        for theme_id in REAL_THEME_IDS:
            poster = (_Generated.all_themes_dir / theme_id / "poster.svg").read_text(encoding="utf-8")
            with self.subTest(theme=theme_id):
                vb = re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', poster)
                self.assertIsNotNone(vb, "poster has no viewBox")
                w, h = float(vb.group(1)), float(vb.group(2))
                tiles = [tuple(map(float, t)) for t in NESTED_TILE_RE.findall(poster)]
                self.assertTrue(tiles, "poster has no nested tiles to check")
                for x, y, tw, th in tiles:
                    self.assertLessEqual(x + tw, w + 1e-6, "a tile overhangs the right edge")
                    self.assertLessEqual(y + th, h + 1e-6, "a tile overhangs the bottom edge")
                # `stroke-opacity=".45"` is what distinguishes the ONE outer rail from a per-tile
                # `_rail()` glyph (sonarr, radarr, lidarr, prowlarr all draw one inside their own
                # 64-unit coordinate space) — those match `<path d="M... h...` too and sit earlier
                # in the document, so searching for that shape alone would find the wrong path.
                rail = re.search(r'<path d="M[\d.]+ ([\d.]+)h[\d.]+" stroke="[^"]*" '
                                  r'stroke-opacity="\.45"', poster)
                self.assertIsNotNone(rail, "poster's outer rail path is missing")
                self.assertLessEqual(float(rail.group(1)), h + 1e-6, "the rail runs below the viewBox")


class TestGeneratorOutputIsByteIdentical(unittest.TestCase):
    """Adding this suite must not change what the generators emit. A test suite that quietly
    reformats the deployed icons is worse than no test suite."""

    def test_beacon_theme_matches_committed_launcher_icons(self) -> None:
        # sheets/launcher-icons/ is the committed, deployed set. Its plate is #08090c, which is
        # beacon's --i-page (not "instrument"'s --_carbon, #0c0f13) — beacon.css's own docstring
        # says it was purpose-built for these tiles ("24 tiles inside Cloudflare's App Launcher").
        self._assert_dirs_match(_Generated.all_themes_dir / "beacon", HERE / "launcher-icons")

    def test_css_vars_flavour_matches_committed_launcher_icons_css(self) -> None:
        self._assert_dirs_match(_Generated.css_vars_dir, HERE / "launcher-icons-css")

    def _assert_dirs_match(self, generated: pathlib.Path, committed: pathlib.Path) -> None:
        _Generated.ensure()
        gen_names = {p.name for p in generated.glob("*.svg")}
        committed_names = {p.name for p in committed.glob("*.svg")}
        self.assertEqual(gen_names, committed_names, "the generated and committed file sets differ")
        for name in gen_names:
            with self.subTest(file=name):
                self.assertEqual((generated / name).read_bytes(), (committed / name).read_bytes(),
                                  f"{name} is no longer byte-identical to the committed artefact")


if __name__ == "__main__":
    unittest.main()
