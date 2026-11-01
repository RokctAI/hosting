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

"""hosting_sdk 1.15.0: Ray's studio notes of 2026-11-01.

  1. The header logo goes to "/", never "/#top".
  2. One "Our work": the hero's Polaris/Supacharge collage left; the
     showcase row (#work) stays.
  3. A card's "See the logo" and "Back to the site" sit in the same corner.
  4. The Polaris and ROKCT cards are their dark first screens.
  5. The portfolio filter knows every product the studio sells; a chip with
     no card stays hidden.
  6. No giant brand name at the bottom of the page; the footer keeps its
     normal credit line.
  7. The scrollbar thumb is the site's primary colour.
  8. Juvo is https://platform.juvo.app/ (repo RokctAI/Juvo-platforms).

Run:  python3 -m unittest discover -s hosting/nextjs/tests
"""

import glob
import json
import os
import re
import struct
import unittest

from test_studio_showcase import (
    CLIENT,
    CSS,
    HOME,
    RULES,
    SDK_ROOT,
    STUDIO,
    TEMPLATES,
    WORK,
    entry,
    read,
    run_node,
)

HEADER = os.path.join(STUDIO, "studio-client.tsx")
COPY = os.path.join(STUDIO, "studio-copy.ts")
SHOTS = os.path.join(STUDIO, "studio-shots.ts")
WORK_DIR = os.path.join(TEMPLATES, "public", "studio", "work")


def css_rule(css, selector):
    """The declarations of the first rule whose selector is exactly `selector`."""
    m = re.search(
        r"(?:^|\})\s*" + re.escape(selector) + r"\{([^}]*)\}", css, flags=re.MULTILINE
    )
    return m.group(1) if m else None


def webp_size(path):
    """(width, height) of a lossy VP8 WebP, read from its frame header."""
    with open(path, "rb") as f:
        data = f.read(64)
    assert data[:4] == b"RIFF" and data[8:12] == b"WEBP", path
    chunk = data[12:16]
    if chunk == b"VP8 ":
        w, h = struct.unpack("<HH", data[26:30])
        return w & 0x3FFF, h & 0x3FFF
    if chunk == b"VP8L":
        b = data[21:25]
        w = 1 + (((b[1] & 0x3F) << 8) | b[0])
        h = 1 + (((b[3] & 0xF) << 10) | (b[2] << 2) | ((b[1] & 0xC0) >> 6))
        return w, h
    if chunk == b"VP8X":
        w = 1 + int.from_bytes(data[24:27], "little")
        h = 1 + int.from_bytes(data[27:30], "little")
        return w, h
    raise AssertionError(f"{path}: unknown WebP chunk {chunk!r}")


class TestLogoGoesHome(unittest.TestCase):
    def test_logo_links_to_the_root(self):
        header = read(HEADER)
        self.assertIn('<a className="mark" href="/" aria-label="ROKCT, home">', header)
        self.assertNotIn('"#top"', header)
        self.assertNotIn("/#top", header)

    def test_section_links_still_follow_base(self):
        header = read(HEADER)
        self.assertEqual(header.count("href={navHref(n.href, base)}"), 2)


class TestOneOurWork(unittest.TestCase):
    def setUp(self):
        self.home = read(HOME)

    def test_hero_collage_is_gone(self):
        hero = self.home.split('<section className="hero">', 1)[1].split(
            "</section>", 1
        )[0]
        hero = re.sub(
            r"\{/\*.*?\*/\}", "", hero, flags=re.DOTALL
        )  # the note on why it left
        for gone in (
            "collage",
            "DeskProof",
            "PhoneProof",
            "Our work",
            "H.note",
            "cnote",
            "<img",
        ):
            self.assertNotIn(gone, hero, gone)
        for gone in (
            "function DeskProof",
            "function PhoneProof",
            "function ShotImages",
        ):
            self.assertNotIn(gone, self.home)
        self.assertNotIn(
            "note: {",
            read(COPY).split("export const STUDIO_HERO", 1)[1].split("\n};", 1)[0],
        )
        self.assertNotIn(".st .collage", read(CSS))
        self.assertNotIn(".st .cnote", read(CSS))

    def test_the_showcase_row_is_the_one_our_work(self):
        self.assertEqual(self.home.count('id="work"'), 1)
        self.assertEqual(self.home.count("<SectionHead {...STUDIO_WORK_HEAD} />"), 1)
        self.assertEqual(self.home.count("<StudioShowcaseRow"), 1)
        # Still after the services, where the header's order puts it.
        self.assertLess(self.home.index('id="services"'), self.home.index('id="work"'))
        self.assertLess(self.home.index('id="work"'), self.home.index('id="design"'))


class TestFlipButtonOneCorner(unittest.TestCase):
    def setUp(self):
        self.client = read(CLIENT)
        self.css = read(CSS)

    def test_row_back_puts_the_chip_where_the_front_has_it(self):
        back = self.client.split("function Back(", 1)[1].split("\n}\n", 1)[0]
        head = back.split('<div className="sr-back-h">', 1)[1].split("</div>", 1)[0]
        self.assertNotIn("sr-turn", head)
        # The chip is the back's own last child, positioned like the front's.
        self.assertLess(
            back.index('<div className="sr-back-b">'),
            back.index('<span className="sr-turn" aria-hidden="true">'),
        )
        front = self.client.split("function Front(", 1)[1].split("\n}\n", 1)[0]
        self.assertIn('<span className="sr-turn" aria-hidden="true">', front)
        self.assertIn(
            ".st .sr-back>.sr-turn{opacity:1;transform:none;z-index:2}", self.css
        )
        self.assertNotIn(".st .sr-back-h .sr-turn", self.css)
        turn = css_rule(self.css, ".st .sr-turn")
        self.assertIn("position:absolute;right:14px;bottom:14px", turn)

    def test_work_logo_side_puts_the_chip_where_the_site_side_has_it(self):
        logo = self.client.split("function LogoFace(", 1)[1].split("\n}\n", 1)[0]
        head = logo.split('<div className="sr-back-h">', 1)[1].split("</div>", 1)[0]
        self.assertNotIn("sr-turn", head)
        self.assertIn(
            '{!solo && (\n        <span className="sr-turn wk-turn" aria-hidden="true">',
            logo,
        )
        site = self.client.split("function SiteFace(", 1)[1].split("\n}\n", 1)[0]
        self.assertIn('<span className="sr-turn wk-turn" aria-hidden="true">', site)
        # Both chips are children of .wk-shots, placed by the one .wk-turn rule.
        self.assertIn(
            ".st .wk-turn{left:clamp(14px,2vw,22px);right:auto;bottom:clamp(14px,2vw,22px);",
            self.css,
        )
        self.assertNotIn("wk-turn-t", self.client + self.css)


class TestDarkCards(unittest.TestCase):
    def test_polaris_and_rokct_fallbacks_are_dark(self):
        rules = read(RULES)
        fallback = rules.split("export const STUDIO_SHOWCASE_FALLBACK", 1)[1].split(
            "\n];", 1
        )[0]
        for site in ("studio", "polaris"):
            for k in ("phone", "desktop"):
                self.assertIn(f'{k}: "/studio/shots/{site}/{k}-dark.webp",', fallback)
        self.assertIn('phone: "/studio/shots/supacharge/phone-light.webp",', fallback)
        # The route can serve the dark files for both sites.
        shots = read(SHOTS)
        self.assertIn(
            'polaris: { repo: "RokctAI/polaris-web", origin: null, files: [...OPTION, ...WORK] },',
            shots,
        )
        self.assertIn(
            'studio: { repo: "RokctAI/hosting", origin: null, files: [...OPTION, ...WORK] },',
            shots,
        )

    def test_committed_shots_keep_their_sizes(self):
        for name, size in (
            ("polaris-desktop", (1200, 833)),
            ("polaris-phone", (560, 1149)),
            ("studio-desktop", (1200, 833)),
            ("studio-phone", (560, 1149)),
        ):
            path = os.path.join(WORK_DIR, f"{name}.webp")
            self.assertEqual(webp_size(path), size, name)
            self.assertLess(os.path.getsize(path), 200 * 1024, name)

    def test_committed_shots_are_dark(self):
        try:
            from PIL import Image, ImageStat
        except ImportError:
            raise unittest.SkipTest("Pillow not installed")
        for name in (
            "polaris-desktop",
            "polaris-phone",
            "studio-desktop",
            "studio-phone",
        ):
            with Image.open(os.path.join(WORK_DIR, f"{name}.webp")) as im:
                lum = ImageStat.Stat(im.convert("L")).mean[0]
            self.assertLess(lum, 90, f"{name} mean luminance {lum:.0f}")
        with Image.open(os.path.join(WORK_DIR, "supacharge-desktop.webp")) as im:
            self.assertIsNotNone(im.size)  # untouched


ALL_SERVICES_PROBE = """
import { SHOWCASE_SERVICES, showcaseFilters, buildShowcase } from './studio-showcase.ts';
const files = JSON.parse(%s);
const list = buildShowcase(files);
console.log(JSON.stringify({
  keys: SHOWCASE_SERVICES.map((s) => s.key),
  chips: showcaseFilters(list).map((c) => [c.key, c.count]),
  none: showcaseFilters([]).map((c) => c.key),
}));
"""

# Every product on the studio's services list, and the portfolio services
# that stand for it.
STUDIO_PRODUCTS = {
    "Website and brand": ["website", "logo"],
    "Business plans": ["business-plan"],
    "Business starter kit": ["starter-kit"],
    "Pitch decks": ["pitch-deck"],
    "Design and print": ["print"],
    "Social post packs": ["social-posts"],
}


class TestEveryProductAFilter(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        files = [
            {
                "name": "RokctAI__hosting.json",
                "text": json.dumps(
                    entry("ROKCT", "RokctAI/hosting", 5, logo_back="rokct")
                ),
            },
            {
                "name": "RokctAI__polaris-web.json",
                "text": json.dumps(entry("Polaris", "RokctAI/polaris-web", 8)),
            },
            {
                "name": "RokctAI__kit.json",
                "text": json.dumps(
                    entry("Kit", "RokctAI/kit", 6, services=["website", "starter-kit"])
                ),
            },
        ]
        cls.out = run_node(ALL_SERVICES_PROBE % json.dumps(json.dumps(files)), {})

    def test_every_studio_product_has_a_service(self):
        copy = read(COPY)
        services = copy.split("export const STUDIO_SERVICES: StudioService[] = [", 1)[
            1
        ].split("\n];", 1)[0]
        names = re.findall(r'^    name: "([^"]+)",$', services, flags=re.MULTILINE)
        self.assertEqual(
            sorted(names),
            sorted(STUDIO_PRODUCTS),
            "a product was added or renamed: map it to a portfolio service",
        )
        wanted = {k for keys in STUDIO_PRODUCTS.values() for k in keys}
        self.assertEqual(set(self.out["keys"]), wanted)
        self.assertEqual(len(self.out["keys"]), len(wanted))
        self.assertIn('{ key: "starter-kit", label: "Starter kit" },', read(RULES))

    def test_a_chip_with_no_card_is_hidden(self):
        # Only the services some card names get a chip, with its count.
        self.assertEqual(
            self.out["chips"],
            [["all", 3], ["website", 3], ["logo", 1], ["starter-kit", 1]],
        )
        self.assertEqual(self.out["none"], ["all"])
        for c in self.out["chips"]:
            self.assertGreater(c[1], 0)

    def test_the_grid_draws_chips_from_the_cards_left_and_hides_a_lone_all(self):
        grid = read(CLIENT).split("export function StudioShowcaseGrid(", 1)[1]
        self.assertIn("const chips = showcaseFilters(shown);", grid)
        self.assertIn("{chips.length > 1 && (", grid)


class TestNoGiantNameAtTheBottom(unittest.TestCase):
    def test_footer_mark_is_a_small_mark_and_the_credit_stays(self):
        css = read(CSS)
        self.assertEqual(css_rule(css, ".st .ft .mark"), "font-size:24px")
        footer = (
            read(HOME).split('<footer className="ft">', 1)[1].split("</footer>", 1)[0]
        )
        self.assertIn(
            '<SiteCredit as="span" siteName={STUDIO_FOOTER.siteName} /> · {STUDIO_FOOTER.prices}',
            footer,
        )
        # Nothing after the footer but the back-to-top button.
        tail = read(HOME).split("<StudioFooter />", 1)[1]
        self.assertNotIn("ROKCT", re.sub(r"\{/\*.*?\*/\}", "", tail, flags=re.DOTALL))

    def test_no_footer_rule_sets_display_sized_type(self):
        css = re.sub(r"/\*.*?\*/", "", read(CSS), flags=re.DOTALL)
        for sel, body in re.findall(r"([^{}]*\.ft[^{}]*)\{([^}]*)\}", css):
            for px in re.findall(r"(?:font-size:|font:[^;]*?)(\d+(?:\.\d+)?)px", body):
                self.assertLessEqual(float(px), 32, f"{sel.strip()} sets {px}px")
            self.assertNotRegex(body, r"font[^;]*(?:vw|clamp)", sel.strip())


class TestScrollbarIsPrimary(unittest.TestCase):
    def test_thumb_is_the_accent_and_reads_in_dark(self):
        css = read(CSS)
        self.assertIn("html:has(.st){scrollbar-color:#8C1A2D #F2F1ED}", css)
        self.assertIn("html.dark:has(.st){scrollbar-color:#F2818F #131216}", css)
        # The values are the studio's own tokens: --acc / --bg light, --acc-text / --bg dark.
        light = css_rule(css, ".st")
        dark = css_rule(css, ".dark .st")
        self.assertIn("--acc:#8C1A2D;", light)
        self.assertIn("--bg:#F2F1ED;", light)
        self.assertIn("--acc-text:#F2818F;", dark)
        self.assertIn("--bg:#131216;", dark)
        self.assertIn("html:has(.st)::-webkit-scrollbar-thumb{background:#8C1A2D;", css)
        self.assertIn(
            "html.dark:has(.st)::-webkit-scrollbar-thumb{background:#F2818F;", css
        )

    def test_thumb_contrast_on_the_track(self):
        def lum(hexv):
            c = [int(hexv[i : i + 2], 16) / 255 for i in (1, 3, 5)]
            c = [x / 12.92 if x <= 0.03928 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
            return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]

        def ratio(a, b):
            la, lb = sorted((lum(a), lum(b)), reverse=True)
            return (la + 0.05) / (lb + 0.05)

        self.assertGreaterEqual(ratio("#8C1A2D", "#F2F1ED"), 3)
        self.assertGreaterEqual(ratio("#F2818F", "#131216"), 3)
        # Why dark mode does not use --acc: it does not show on the dark track.
        self.assertLess(ratio("#7C1526", "#131216"), 3)


class TestJuvoAddress(unittest.TestCase):
    def test_any_juvo_link_uses_the_new_site_and_repo(self):
        texts = []
        for path in glob.glob(os.path.join(TEMPLATES, "**", "*"), recursive=True):
            if os.path.isfile(path) and path.endswith(
                (".ts", ".tsx", ".json", ".md", ".css")
            ):
                texts.append((path, read(path)))
        for path, text in texts:
            for url in re.findall(
                r"https?://[^\s\"'`)]*juvo[^\s\"'`)]*", text, flags=re.IGNORECASE
            ):
                self.assertTrue(
                    url.startswith("https://platform.juvo.app"), f"{path}: {url}"
                )
            for repo in re.findall(
                r"RokctAI/[A-Za-z0-9._-]*juvo[A-Za-z0-9._-]*", text, flags=re.IGNORECASE
            ):
                self.assertEqual(repo, "RokctAI/Juvo-platforms", f"{path}: {repo}")


class TestVersion(unittest.TestCase):
    def test_version_and_changelog(self):
        manifest = json.loads(read(os.path.join(SDK_ROOT, "manifest.json")))
        self.assertGreaterEqual(
            tuple(int(p) for p in manifest["version"].split(".")), (1, 15, 0)
        )
        head = read(os.path.join(SDK_ROOT, "CHANGELOG.md")).split("## 1.14.1")[0]
        self.assertIn("## 1.15.0", head)
        for word in (
            '"/"',
            "Our work",
            "Back to the site",
            "dark",
            "Starter kit",
            "scrollbar",
            "Juvo",
        ):
            self.assertIn(word, head, word)
        self.assertIn(
            '<StudioHeader base="/" current={SHOWCASE_PAGE_HREF} />', read(WORK)
        )


if __name__ == "__main__":
    unittest.main()
