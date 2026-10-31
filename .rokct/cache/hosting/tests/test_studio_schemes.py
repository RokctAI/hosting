# Copyright (c) 2026 ROKCT INTELLIGENCE (PTY) LTD
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published
# by the Free Software Foundation, version 3.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program. If not, see <https://www.gnu.org/licenses/>.


"""hosting_sdk 1.8.0: every studio case in its own colours, the portfolio
as one row of tabs over a flip card, and the card's back the logo process
from real material only.

  * Ray: the "how we design" tabs show each case's own colour scheme.
    STUDIO_SCHEMES holds each brand's colours (light and dark); every text
    pair a panel draws is WCAG AA (4.5:1) in both modes.
  * Ray: the portfolio gets tabs that auto-advance (paused on hover, focus,
    off screen; never under reduced motion; stopped for good by a tap, a
    swipe or a flip) over a scroll-snap row.
  * Ray: the portfolio card flips (base_sdk's FlipCard, the Supacharge
    tutor card's) to the logo process; only stages with a real file.

Run:  python3 -m unittest discover -s hosting/nextjs/tests
"""

import json
import os
import re
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
SDK_ROOT = os.path.abspath(os.path.join(HERE, os.pardir))
TEMPLATES = os.path.join(SDK_ROOT, "templates")
STUDIO = os.path.join(TEMPLATES, "components", "custom", "studio")
COPY = os.path.join(STUDIO, "studio-copy.ts")
HOME = os.path.join(STUDIO, "studio-home.tsx")
CLIENT = os.path.join(STUDIO, "studio-client.tsx")
CSS = os.path.join(STUDIO, "studio.css")
MANIFEST = os.path.join(SDK_ROOT, "manifest.json")

TOKENS = ("bg", "card", "ink", "ink2", "ink3", "rule", "rule2", "acc", "accDeep", "accInk", "accText", "frame")
CSS_NAMES = ("bg", "card", "ink", "ink-2", "ink-3", "rule", "rule-2", "acc", "acc-deep", "acc-ink", "acc-text", "frame")


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def luminance(hex_):
    h = hex_.lstrip("#")
    out = []
    for i in (0, 2, 4):
        c = int(h[i : i + 2], 16) / 255
        out.append(c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4)
    return 0.2126 * out[0] + 0.7152 * out[1] + 0.0722 * out[2]


def contrast(a, b):
    la, lb = luminance(a), luminance(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


def schemes():
    """{id: {"light": {...}, "dark": {...}, "swatches": [hex...]}} parsed from studio-copy.ts."""
    src = read(COPY)
    body = src.split("export const STUDIO_SCHEMES", 1)[1].split("\n};", 1)[0]
    out = {}
    for m in re.finditer(r"\n  (\w+): \{\n(.*?)\n  \},", body, re.S):
        block = m.group(2)
        entry = {"swatches": re.findall(r'hex: "(#[0-9a-f]{6})"', block)}
        for mode in ("light", "dark"):
            line = re.search(rf"    {mode}: \{{(.*?)\}},", block).group(1)
            entry[mode] = dict(re.findall(r'(\w+): "(#[0-9a-f]{6})"', line))
        out[m.group(1)] = entry
    return out


class TestCaseSchemes(unittest.TestCase):
    def test_every_case_has_a_full_scheme(self):
        s = schemes()
        self.assertEqual(set(s), {"polaris", "southriver", "supacharge", "studio"})
        for cid, entry in s.items():
            self.assertGreaterEqual(len(entry["swatches"]), 3, cid)
            for mode in ("light", "dark"):
                self.assertEqual(set(entry[mode]), set(TOKENS), f"{cid} {mode}")

    def test_brand_colours_come_from_the_brands(self):
        s = schemes()
        self.assertIn("#b8e05a", s["polaris"]["swatches"])  # polaris_sdk --px-lime
        self.assertEqual(s["polaris"]["dark"]["bg"], "#07130f")  # --px-bg
        self.assertIn("#ff6600", s["supacharge"]["swatches"])  # lms_sdk --sc-primary
        self.assertEqual(s["supacharge"]["dark"]["bg"], "#101010")  # --sc-surface
        self.assertIn("#e4333b", s["southriver"]["swatches"])  # southriver-web data/theme.json
        self.assertIn("#8c1a2d", s["studio"]["swatches"])  # studio.css --acc

    def test_every_text_pair_is_aa_in_both_modes(self):
        for cid, entry in schemes().items():
            for mode in ("light", "dark"):
                t = entry[mode]
                for fg in ("ink", "ink2", "ink3", "accText"):
                    for bg in ("bg", "card"):
                        r = contrast(t[fg], t[bg])
                        self.assertGreaterEqual(r, 4.5, f"{cid} {mode} {fg} on {bg}: {r:.2f}")
                for bg in ("acc", "accDeep"):
                    r = contrast(t["accInk"], t[bg])
                    self.assertGreaterEqual(r, 4.5, f"{cid} {mode} accInk on {bg}: {r:.2f}")

    def test_tab_markers_read_on_the_studio_paper(self):
        # The tab rows stay on the studio's own paper; the marker (and the
        # tab number, small text) take the active case's accent text.
        for cid, entry in schemes().items():
            self.assertGreaterEqual(contrast(entry["light"]["accText"], "#f2f1ed"), 4.5, cid)
            self.assertGreaterEqual(contrast(entry["dark"]["accText"], "#131216"), 4.5, cid)

    def test_css_maps_every_token_in_both_modes(self):
        css = read(CSS)
        light = re.search(r"\n\.st \.cs\{([^}]*)\}", css).group(1)
        dark = re.search(r"\n\.dark \.st \.cs\{([^}]*)\}", css).group(1)
        for name in CSS_NAMES:
            self.assertIn(f"--{name}:var(--cl-{name})", light, name)
            self.assertIn(f"--{name}:var(--cd-{name})", dark, name)

    def test_panels_carry_their_scheme(self):
        copy = read(COPY)
        for k, name in zip(TOKENS, CSS_NAMES):
            self.assertIn(f'["{k}", "{name}"]', copy)
        self.assertIn("export function studioSchemeVars(id: StudioSchemeId)", copy)
        home = read(HOME)
        self.assertIn("schemes={STUDIO_DESIGN_CASES.map((c) => studioSchemeVars(c.id))}", home)
        self.assertIn("schemes={STUDIO_CASES.map((c) => studioSchemeVars(c.site))}", home)
        self.assertIn("<Swatches id={c.id} />", home)
        self.assertIn('className="btn btn-acc btn-sm"', home.split("function DesignCase", 1)[1])
        client = read(CLIENT)
        self.assertIn('className="dz-panel cs"', client)
        self.assertIn('className="pf-slide cs"', client)


class TestWorkRow(unittest.TestCase):
    def test_tablist_pattern(self):
        client = read(CLIENT)
        body = client.split("export function StudioWorkTabs", 1)[1]
        for needle in (
            'role="tablist" aria-label={labels.label}',
            'role="tab"',
            "aria-controls={`pf-panel-${t.id}`}",
            "aria-selected={i === active}",
            "tabIndex={i === active ? 0 : -1}",
            'role="tabpanel"',
            "aria-labelledby={`pf-tab-${tabs[i].id}`}",
            "inert={i !== active}",
            'aria-live={running ? "off" : "polite"}',
            'e.key === "ArrowRight"',
            'e.key === "Home"',
        ):
            self.assertIn(needle, body, needle)

    def test_auto_advance_rules(self):
        body = read(CLIENT).split("export function StudioWorkTabs", 1)[1]
        # Never under reduced motion: it only starts when the query does not match.
        self.assertIn('window.matchMedia?.("(prefers-reduced-motion: reduce)")', body)
        self.assertIn("if (!rm?.matches) setRunning(true);", body)
        # Paused on hover, focus, off screen and a hidden page.
        self.assertIn("const paused = hovered || focused || !visible || pageHidden;", body)
        self.assertIn("IntersectionObserver", body)
        self.assertIn("visibilitychange", body)
        # The bar is the timer.
        self.assertIn("onAnimationEnd={advance}", body)
        css = read(CSS)
        self.assertIn('.st .pf[data-paused="true"] .pf-prog{animation-play-state:paused}', css)
        # Stops for good on a tab, an arrow, a swipe and a flip.
        self.assertGreaterEqual(body.count("stop();"), 4)
        self.assertIn("if (gesture.current) stop();", body)
        self.assertIn("onFlip={stop}", body)
        # A pause control (WCAG 2.2.2).
        self.assertIn("aria-label={running ? labels.pause : labels.play}", body)

    def test_scroll_snap_row(self):
        css = read(CSS)
        for needle in (
            "scroll-snap-type:x mandatory",
            "scroll-snap-align:start;scroll-snap-stop:always",
            ".st .pf-track::-webkit-scrollbar{display:none}",
        ):
            self.assertIn(needle, css, needle)
        self.assertRegex(css, r"@media \(prefers-reduced-motion:reduce\)\{\n\.st \*,\.st \*::before,\.st \*::after\{animation:none!important")

    def test_card_is_base_flip_card(self):
        client = read(CLIENT)
        self.assertIn('import { FlipCard } from "@/components/custom/flip-card";', client)
        self.assertIn('layout="stack"', client)
        self.assertIn("hoverDelayMs={450}", client)
        manifest = json.loads(read(MANIFEST))
        self.assertEqual(manifest["version"], "1.8.0")
        self.assertIn("components/custom/flip-card.tsx", manifest["app_type"]["hosting"]["requires"])
        installs = {e.get("from"): e.get("to") for e in manifest["app_type"]["hosting"]["installs"]}
        self.assertEqual(installs.get("templates/public/studio/logo"), "public/studio/logo")


class TestLogoProcess(unittest.TestCase):
    def test_only_real_files_and_known_stages(self):
        copy = read(COPY)
        cases = copy.split("export const STUDIO_CASES", 1)[1].split("\n];", 1)[0]
        srcs = re.findall(r'src: "(/studio/logo/[^"]+)"', cases)
        self.assertTrue(srcs)
        for src in srcs:
            path = os.path.join(TEMPLATES, "public", src.lstrip("/"))
            self.assertTrue(os.path.isfile(path), src)
        kinds = re.findall(r'kind: "(\w+)"', cases)
        self.assertTrue(set(kinds) <= {"versions", "chosen", "sketch", "use"})
        # No sketch is in any repo for these cases: none may be shown.
        self.assertNotIn("sketch", kinds)
        # Every file in public/studio/logo is used (nothing parked as a stand-in).
        on_disk = {f"/studio/logo/{f}" for f in os.listdir(os.path.join(TEMPLATES, "public", "studio", "logo"))}
        self.assertEqual(on_disk, set(srcs))

    def test_back_shows_only_present_stages_and_no_back_means_no_flip(self):
        home = read(HOME)
        self.assertIn("(x) => x.stage && x.stage.pictures.length > 0", home)
        self.assertIn("back: c.logo.length > 0 ? <WorkBack c={c} /> : null,", home)
        client = read(CLIENT)
        self.assertIn('<div className="pf-card">{c.front}</div>', client)

    def test_the_polaris_star_is_the_real_one(self):
        star = read(os.path.join(TEMPLATES, "public", "studio", "logo", "polaris-star.svg"))
        # The path of corporate polaris_sdk 1.7.0 landing/polaris-star.tsx, verbatim.
        self.assertIn('d="M12 0c.6 7.2 4.8 11.4 12 12-7.2.6-11.4 4.8-12 12-.6-7.2-4.8-11.4-12-12 7.2-.6 11.4-4.8 12-12Z"', star)


if __name__ == "__main__":
    unittest.main()
