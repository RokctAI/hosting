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

"""hosting_sdk 1.17.0: the award badge on showcase cards.

Ray wants Supacharge's "Top 200 · GSE 2026 Digital Startup Accelerator"
shown on its card. The studio names no site's data: the site declares
`award` in its own .rokct/showcase.json and the robot copies it into the
shell's showcase/ folder.

  * `award` is optional: a string (the label alone) or {label, detail?}.
    A bad award is dropped; the card itself still shows.
  * The home row draws a small pill under the caption (label at rest, the
    detail joined on a grown card); /work draws the whole line under the
    card's own line. Remixicon award-line, the studio's light and dark
    tokens, and nothing that moves the card's buttons.

Run:  python3 -m unittest discover -s hosting/nextjs/tests
"""

import json
import os
import re
import unittest

from test_studio_showcase import CLIENT, CSS, RULES, SDK_ROOT, entry, read, run_node

LABEL = "Top 200"
DETAIL = "GSE 2026 Digital Startup Accelerator"
FULL = "Top 200 · GSE 2026 Digital Startup Accelerator"

PROBE = """
import { parseShowcaseEntry, buildShowcase, showcaseAward, showcaseAwardText, STUDIO_SHOWCASE_FALLBACK } from './studio-showcase.ts';
const C = globalThis.CASES;
const out = { parsed: {}, award: {}, text: {} };
for (const [k, raw] of Object.entries(C.entries)) {
  const e = parseShowcaseEntry(raw);
  out.parsed[k] = e && { name: e.name, award: e.award, hasKey: 'award' in e };
}
for (const [k, v] of Object.entries(C.awards)) out.award[k] = showcaseAward(v);
out.text.full = showcaseAwardText({ label: 'Top 200', detail: 'GSE 2026 Digital Startup Accelerator' });
out.text.label = showcaseAwardText({ label: 'Top 200', detail: null });
out.built = buildShowcase(C.files).map((e) => [e.name, e.award]);
out.fallback = STUDIO_SHOWCASE_FALLBACK.map((s) => [s.name, s.award]);
console.log(JSON.stringify(out));
"""


def probe(cases):
    return run_node(PROBE.replace("const C = globalThis.CASES;", "const C = " + json.dumps(cases) + ";"), {})


class TestAwardSchema(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        supa = entry("Supacharge", "RokctAI/supacharge-web", 9, award={"label": LABEL, "detail": DETAIL})
        cls.out = probe({
            "entries": {
                "none": entry("Polaris", "RokctAI/polaris-web", 8),
                "object": supa,
                "string": entry("Str", "RokctAI/str", 7, award=FULL),
                "bad": entry("Bad", "RokctAI/bad", 7, award={"detail": DETAIL}),
                "logoOnly": {"name": "Bakery", "kind": "Bakery", "tagline": "one line", "repo": "RokctAI/bakery", "rank": 6,
                             "services": ["logo"], "logo": {"branch": "brand", "light": "l.webp"}, "award": LABEL},
            },
            "awards": {
                "absent": None,
                "string": "  Top   200  ",
                "stringFull": FULL,
                "stringLongDetail": "Top 200 · " + "y" * 91,
                "stringNoLabel": " · " + DETAIL,
                "object": {"label": LABEL, "detail": DETAIL},
                "nullDetail": {"label": LABEL, "detail": None},
                "noDetail": {"label": LABEL},
                "emptyString": "   ",
                "longLabel": "x" * 41,
                "maxLabel": "x" * 40,
                "longDetail": {"label": LABEL, "detail": "y" * 91},
                "emptyDetail": {"label": LABEL, "detail": " "},
                "numberDetail": {"label": LABEL, "detail": 2026},
                "noLabel": {"detail": DETAIL},
                "number": 200,
                "list": [LABEL],
                "bool": True,
            },
            "files": [
                {"name": "RokctAI__supacharge-web.json", "text": json.dumps(supa)},
                {"name": "RokctAI__polaris-web.json", "text": json.dumps(entry("Polaris", "RokctAI/polaris-web", 8))},
            ],
        })

    def test_award_object_and_string(self):
        a = self.out["award"]
        self.assertEqual(a["object"], {"label": LABEL, "detail": DETAIL})
        self.assertEqual(a["string"], {"label": LABEL, "detail": None})  # whitespace collapsed
        # a string splits at its first " · ", so both forms read the same
        self.assertEqual(a["stringFull"], a["object"])
        self.assertEqual(a["nullDetail"], {"label": LABEL, "detail": None})
        self.assertEqual(a["noDetail"], {"label": LABEL, "detail": None})
        self.assertEqual(a["maxLabel"], {"label": "x" * 40, "detail": None})

    def test_bad_awards_are_dropped(self):
        a = self.out["award"]
        for k in ("absent", "emptyString", "stringLongDetail", "stringNoLabel", "longLabel", "longDetail", "emptyDetail", "numberDetail", "noLabel", "number", "list", "bool"):
            self.assertIsNone(a[k], k)

    def test_award_text_joins_label_and_detail(self):
        self.assertEqual(self.out["text"]["full"], FULL)
        self.assertEqual(self.out["text"]["label"], LABEL)

    def test_cards_carry_their_award_and_a_bad_one_never_skips_the_card(self):
        p = self.out["parsed"]
        self.assertEqual(p["object"]["award"], {"label": LABEL, "detail": DETAIL})
        self.assertEqual(p["string"]["award"], {"label": LABEL, "detail": DETAIL})
        self.assertEqual(p["logoOnly"]["award"], {"label": LABEL, "detail": None})
        # a file without the field reads as before, award null
        self.assertTrue(p["none"]["hasKey"])
        self.assertIsNone(p["none"]["award"])
        self.assertIsNotNone(p["bad"])
        self.assertIsNone(p["bad"]["award"])

    def test_award_survives_the_folder_loader(self):
        self.assertEqual(self.out["built"], [["Supacharge", {"label": LABEL, "detail": DETAIL}], ["Polaris", None]])

    def test_built_in_list_hard_codes_no_award(self):
        # Ray's rule: the studio never writes another site's data; the award
        # comes from the site's own showcase file.
        self.assertEqual(self.out["fallback"], [["ROKCT", None], ["Polaris", None], ["Supacharge", None]])
        code = re.sub(r"/\*.*?\*/|//[^\n]*", "", read(RULES), flags=re.DOTALL)
        self.assertNotIn("GSE", code)
        self.assertNotIn("Top 200", code)


class TestAwardBadge(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = read(CLIENT)
        cls.css = read(CSS)

    def test_remixicon_award_line(self):
        self.assertIn("RiAwardLine", self.client)
        self.assertRegex(self.client, r'import \{[^}]*RiAwardLine[^}]*\} from "@remixicon/react";')
        self.assertEqual(self.client.count("<RiAwardLine"), 2)
        for m in re.finditer(r"<RiAwardLine[^>]*>", self.client):
            self.assertIn('aria-hidden="true"', m.group(0))

    def test_badge_only_when_the_card_has_an_award(self):
        self.assertIn('{site.award && (\n        <p className="sr-award" data-award="">', self.client)
        self.assertIn('{site.award && (\n          <p className="wk-award" data-award="">', self.client)
        self.assertIn('{site.award.detail && <span className="sr-award-d"> · {site.award.detail}</span>}', self.client)
        self.assertIn("<span>{showcaseAwardText(site.award)}</span>", self.client)

    def test_row_badge_sits_after_the_caption_and_outside_the_card_face(self):
        cap = self.client.index('<p className="sr-cap">')
        badge = self.client.index('<p className="sr-award"')
        ext = self.client.index("<ShowcaseExtLink site={site} interactive={interactive} />")
        self.assertLess(ext, cap)
        self.assertLess(cap, badge)

    def test_work_badge_is_in_the_meta_below_the_card(self):
        card_end = self.client.index('<ShowcaseExtLink site={site} className="sr-ext wk-ext" interactive={!leaving} />')
        tag = self.client.index('<p className="wk-tag">{site.tagline}</p>')
        badge = self.client.index('<p className="wk-award"')
        svc = self.client.index('<ul className="wk-svc"')
        self.assertLess(card_end, tag)
        self.assertLess(tag, badge)
        self.assertLess(badge, svc)

    def test_row_badge_is_absolute_so_no_button_moves(self):
        rule = re.search(r"\.st \.sr-award\{([^}]*)\}", self.css).group(1)
        self.assertIn("position:absolute", rule)
        self.assertIn("top:calc(100% + 38px)", rule)
        self.assertIn("white-space:nowrap", rule)
        # the card buttons keep their rules
        self.assertIn(".st .sr-ext{position:absolute;top:-10px;right:-10px;", self.css)
        self.assertIn(".st .wk-ext{top:14px;right:14px;", self.css)
        self.assertIn(".st .sr-turn{position:absolute;right:14px;bottom:14px;", self.css)

    def test_light_and_dark_come_from_the_studio_tokens(self):
        for sel in (".st .sr-award{", ".st .wk-award{"):
            i = self.css.index(sel)
            rule = self.css[i:self.css.index("}", i)]
            self.assertIn("background:var(--acc-soft)", rule)
            self.assertIn("color:var(--acc-text)", rule)
            self.assertNotRegex(rule, r"#[0-9A-Fa-f]{3,8}\b")
        # both schemes define the tokens the badge uses
        light = self.css[self.css.index(".st{"):self.css.index(".dark .st{")]
        dark = self.css[self.css.index(".dark .st{"):]
        for tok in ("--acc-soft:", "--acc-text:"):
            self.assertIn(tok, light)
            self.assertIn(tok, dark)

    def test_detail_shows_on_a_grown_card_and_hides_on_a_phone(self):
        self.assertIn(".st .sr-card.big .sr-award-d{max-width:420px;opacity:1;", self.css)
        self.assertIn(".st .sr-m .sr-award-d{display:none}", self.css)
        self.assertIn(".st .sr-card.lift .sr-award{opacity:0;", self.css)

    def test_reduced_motion_covers_the_badge(self):
        m = re.search(r"@media \(prefers-reduced-motion:reduce\)\{\n\.st \.sr-card,([^{]*)\{transition-duration", self.css)
        self.assertIsNotNone(m)
        self.assertIn(".st .sr-award", m.group(1))
        self.assertIn(".st .sr-award-d", m.group(1))

    def test_css_braces_balance(self):
        css = re.sub(r"/\*.*?\*/", "", self.css, flags=re.DOTALL)
        self.assertEqual(css.count("{"), css.count("}"))


class TestVersion(unittest.TestCase):
    def test_version_floor_and_changelog(self):
        manifest = json.loads(read(os.path.join(SDK_ROOT, "manifest.json")))
        self.assertGreaterEqual(tuple(int(p) for p in manifest["version"].split(".")), (1, 17, 0))
        log = read(os.path.join(SDK_ROOT, "CHANGELOG.md"))
        head = log.split("## 1.14.1")[0]
        self.assertIn("## 1.17.0", head)
        self.assertIn("award", head)


if __name__ == "__main__":
    unittest.main()
