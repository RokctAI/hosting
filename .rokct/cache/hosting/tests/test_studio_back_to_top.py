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


"""hosting_sdk 1.7.0: the studio home's "Back to top" button (Ray,
2026-10-31: "every app shell need the button to go up"). The studio home
mounts base_sdk 1.56.0's framed BackToTop inside its .st root; the studio's
own style (hosting-back-to-top.ts) is registered at base's style registry
and names the studio tokens; studio.css's button reset skips the button.

Run:  python3 -m unittest discover -s hosting/nextjs/tests
"""

import json
import os
import re
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
SDK_ROOT = os.path.abspath(os.path.join(HERE, os.pardir))
STUDIO = os.path.join(SDK_ROOT, "templates", "components", "custom", "studio")
HOME = os.path.join(STUDIO, "studio-home.tsx")
CSS = os.path.join(STUDIO, "studio.css")
STYLE = os.path.join(SDK_ROOT, "templates", "components", "custom", "landing", "hosting-back-to-top.ts")


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def code_of(path):
    src = re.sub(r"/\*.*?\*/", "", read(path), flags=re.S)
    src = re.sub(r"\{/\*.*?\*/\}", "", src, flags=re.S)
    return re.sub(r"^\s*//.*$", "", src, flags=re.M)


class TestStudioBackToTop(unittest.TestCase):
    def test_home_mounts_the_framed_button_inside_the_studio_root(self):
        home = read(HOME)
        self.assertIn('import { BackToTop } from "@/components/custom/back-to-top";', home)
        code = code_of(HOME)
        self.assertEqual(code.count("<BackToTop />"), 1, "framed (default scope), mounted once")
        self.assertNotIn('scope="root"', code)
        root = code.split('<div id="top" className={`st ${fontClassName}`}>', 1)[1]
        inside = root.split("</StudioCurrencyProvider>", 1)[0]
        # 1.11.0: the footer is StudioFooter, shared with /work.
        self.assertLess(inside.index("<StudioFooter />"), inside.index("<BackToTop />"))
        self.assertLess(inside.index("<BackToTop />"), inside.rindex("</div>"))

    def test_studio_reset_skips_the_button(self):
        """The `.st button` reset (0,1,1) outranks the button's utility
        classes (0,1,0); it must skip the button, at the same weight for
        every other button (`:where`), and no stylesheet rule may restyle
        the button's colours behind the registered style's back."""
        css = read(CSS)
        self.assertIn(
            ".st button:where(:not([data-back-to-top])){font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}",
            css,
        )
        self.assertNotRegex(css, r"\.st button\{", "an unscoped .st button reset would hit the button again")
        self.assertNotIn("--back-to-top-bg:", css, "the look comes from the registered style")

    def test_studio_style_is_registered(self):
        manifest = json.loads(read(os.path.join(SDK_ROOT, "manifest.json")))
        block = manifest["app_type"]["hosting"]
        installs = {e["from"]: e["to"] for e in block["installs"]}
        self.assertEqual(
            installs.get("templates/components/custom/landing/hosting-back-to-top.ts"),
            "components/custom/landing/hosting-back-to-top.ts",
        )
        hits = [i for i in block["integrations"]
                if i.get("target") == "components/custom/landing/back-to-top-style.ts"]
        self.assertEqual(len(hits), 1)
        self.assertEqual(hits[0]["placeholder"], "// @rokct-sdk-back-to-top-style-start")
        self.assertIn('import("@/components/custom/landing/hosting-back-to-top")', hits[0]["replacement"])
        for path in ("components/custom/landing/back-to-top-style.ts", "components/custom/landing/back-to-top.ts"):
            self.assertIn(path, block["requires"])

    def test_studio_style_names_the_studio_tokens(self):
        code = read(STYLE)
        self.assertTrue(code.lstrip().startswith("/*"), "licence header first")
        self.assertIn('import type { BackToTopConfig } from "@/components/custom/landing/back-to-top";', code)
        self.assertIn("export default HOSTING_BACK_TO_TOP;", code)

        def field(name):
            m = re.search(r"^\s+" + name + r': "([^"]*)",$', code, re.M)
            return m.group(1) if m else None

        self.assertEqual(field("shape"), "rounded-square")
        self.assertEqual(field("icon"), "arrow-up")
        self.assertEqual(field("radius"), "3px")
        self.assertEqual(field("borderWidth"), "1.5px")
        css = read(CSS)
        for name, token in (("background", "--bg"), ("foreground", "--ink"), ("border", "--ink"),
                            ("hoverBackground", "--acc"), ("hoverForeground", "--acc-ink"),
                            ("ring", "--acc-text"), ("shadow", "--shadow")):
            value = field(name)
            self.assertTrue(value and value.startswith("var(%s, " % token), "%s: %s" % (name, value))
            self.assertRegex(css, re.escape(token) + r":", token)
        self.assertNotRegex(re.sub(r"//.*", "", code), r"#[0-9a-fA-F]{3,8}\b", "no colour value copied")
        # shadcn's own token names are HSL triplets outside .st, not colours.
        for shadcn in ("--card,", "--border,", "--background,", "--primary,"):
            self.assertNotIn('"var(%s' % shadcn, code, shadcn)

    def test_manifest_requires_base_back_to_top(self):
        manifest = json.loads(read(os.path.join(SDK_ROOT, "manifest.json")))
        self.assertGreaterEqual(tuple(int(p) for p in manifest["version"].split(".")), (1, 7, 0))
        self.assertIn("components/custom/back-to-top.tsx", manifest["app_type"]["hosting"]["requires"])
        self.assertIn("1.56.0", manifest["_comment"]["components/custom/back-to-top.tsx"])
        head = read(os.path.join(SDK_ROOT, "CHANGELOG.md")).split("## 1.6.0")[0]
        self.assertIn("## 1.7.0", head)
        self.assertIn("every\n  app shell need the button to go up", head)


if __name__ == "__main__":
    unittest.main()
