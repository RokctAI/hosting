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


"""hosting_sdk 1.13.0: "What you get with ROKCT hosting" on the studio home
(website-service/year-of-hosting.md; Ray's three yeses, 2026-11-01 11:01Z;
the single condition, 11:03Z). Only lines true today or starting November
2026; nothing not yet running is claimed; no tool or brand is named; icons
are Remixicon.

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
COPY = os.path.join(STUDIO, "studio-copy.ts")
CSS = os.path.join(STUDIO, "studio.css")


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def code_of(path):
    src = re.sub(r"/\*.*?\*/", "", read(path), flags=re.S)
    return re.sub(r"^\s*//.*$", "", src, flags=re.M)


def block(code, start):
    return code.split(start, 1)[1].split("\n};\n", 1)[0] if start.endswith("{") else code.split(start, 1)[1].split("\n];\n", 1)[0]


def hosting_copy():
    code = code_of(COPY)
    return (
        block(code, "export const STUDIO_HOSTING_HEAD = {"),
        block(code, "export const STUDIO_HOSTING_COST = {"),
        block(code, "export const STUDIO_HOSTING_GROUPS: StudioHostingGroup[] = ["),
    )


class TestStudioHostingCopy(unittest.TestCase):
    def test_groups_in_order(self):
        groups = hosting_copy()[2]
        names = re.findall(r'name: "([^"]+)"', groups)
        self.assertEqual(names, ["Kept current", "Kept safe", "Kept online", "Kept looking right", "Looked after"])

    def test_rays_three_yeses(self):
        groups = hosting_copy()[2]
        care = groups.split('name: "Looked after"', 1)[1]
        self.assertIn('"We reply within 1 working day on WhatsApp."', care)
        self.assertIn("Two small text or photo edits a month are included. More edits than that are paid.", care)
        self.assertIn("what we did for your site that year", care)

    def test_single_condition_and_costs(self):
        cost = hosting_copy()[1]
        self.assertIn("free for the life of your site, for the first 1,000 small business owners", cost)
        self.assertIn("No monthly hosting fee.", cost)
        self.assertIn("The first year of your domain name is included (.co.za, .com, .net or .org).", cost)
        self.assertNotIn("never hold", cost)
        self.assertIn(
            "All of this lasts for as long as your site is hosted with us. If you ever move it elsewhere, it’s yours to take, and the weekly care stops.",
            cost,
        )

    def test_weekly_lines_are_marked_from_november_2026(self):
        groups = hosting_copy()[2]
        self.assertIn('const NOV_2026 = "November 2026";', code_of(COPY))
        lines = re.findall(r"\{\s*when: \"([^\"]+)\",\s*text: \"([^\"]+)\",?\s*(from: NOV_2026,?)?\s*\}", groups)
        self.assertEqual(len(lines), 12)
        for when, text, frm in lines:
            self.assertEqual(when == "Every week", bool(frm), text)

    def test_tags_are_the_known_frequencies(self):
        groups = hosting_copy()[2]
        allowed = {"Every week", "Every change", "Always", "Every month", "Every year", "1 working day"}
        self.assertTrue(set(re.findall(r'when: "([^"]+)"', groups)) <= allowed)

    def test_claims_nothing_not_running(self):
        text = " ".join(hosting_copy()).lower()
        for banned in (
            "monthly security", "security updates", "leak", "password", "secret", "uptime",
            "alert you", "backup", "back up", "form data", "minutes",
        ):
            self.assertNotIn(banned, text, banned)

    def test_names_no_tool_provider_or_ai(self):
        text = " ".join(hosting_copy())
        for brand in (
            "Vercel", "Cloudflare", "GitHub", "Dependabot", "Gitleaks", "npm", "Playwright", "Chromium",
            "Next.js", "Claude", "OpenAI", "Let's Encrypt", "robot",
        ):
            self.assertNotIn(brand.lower(), text.lower(), brand)
        self.assertIsNone(re.search(r"\bAI\b", text))


class TestStudioHostingSection(unittest.TestCase):
    def test_section_sits_after_prices_before_process(self):
        home = read(HOME)
        i_prices = home.index('<section className="sec" id="prices">')
        i_hosting = home.index('<section className="sec" id="hosting">')
        i_process = home.index('<section className="sec" id="process">')
        self.assertLess(i_prices, i_hosting)
        self.assertLess(i_hosting, i_process)
        sec = home[i_hosting:i_process]
        self.assertIn("<SectionHead {...STUDIO_HOSTING_HEAD} />", sec)
        self.assertIn("<HostingBenefits />", sec)

    def test_nav_links_to_the_section(self):
        nav = code_of(COPY).split("export const STUDIO_NAV = [", 1)[1].split("]", 1)[0]
        hrefs = re.findall(r'href: "([^"]+)"', nav)
        self.assertEqual(hrefs.index("#hosting"), hrefs.index("#prices") + 1)

    def test_icons_are_remixicon_only(self):
        home = read(HOME)
        imp = home.split("import {\n  RiChat3Line,", 1)[1].split(";", 1)[0]
        self.assertIn('} from "@remixicon/react"', imp)
        for name in ("RiEyeLine", "RiGlobalLine", "RiRefreshLine", "RiShieldCheckLine", "type RemixiconComponentType"):
            self.assertIn(name, imp)
        self.assertNotIn("lucide-react", home)
        icons = home.split("const HOSTING_ICONS", 1)[1].split("};", 1)[0]
        self.assertEqual(sorted(re.findall(r"(\w+): Ri\w+", icons)), ["care", "current", "online", "right", "safe"])

    def test_styles_use_studio_tokens(self):
        css = read(CSS)
        hb = "\n".join(line for line in css.splitlines() if ".hb" in line)
        self.assertIn(".st .hb-cost{background:var(--acc);color:var(--acc-ink)", hb)
        self.assertIn('.st .hb-when[data-when="Every week"]', hb)
        self.assertIsNone(re.search(r"#[0-9A-Fa-f]{3,6}\b", hb), "no literal colours in .hb rules")

    def test_version_and_changelog(self):
        manifest = json.loads(read(os.path.join(SDK_ROOT, "manifest.json")))
        self.assertGreaterEqual(tuple(int(p) for p in manifest["version"].split(".")), (1, 13, 0))
        self.assertIn("@remixicon/react", manifest["app_type"]["hosting"]["dependencies"])
        head = read(os.path.join(SDK_ROOT, "CHANGELOG.md")).split("## 1.11.0")[0]
        self.assertIn("## 1.13.0", head)
        self.assertIn("What you get with ROKCT hosting", head)


if __name__ == "__main__":
    unittest.main()
