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

"""hosting_sdk 1.20.4: the brand is "CORTEX" (Ray, 2026-11-02). No
customer-visible string literal in the copy, page or mail files says
"studio" (people read it as a photo studio). Heuristic: every quoted string
on a non-comment line, minus ids/paths/identifiers (studio-x, /studio/,
studioX, a bare "studio" id), must not contain the word."""

import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "templates"
FILES = [
    "components/custom/studio/studio-copy.ts",
    "components/custom/studio/studio-showcase.ts",
    "components/custom/studio/studio-order.ts",
    "components/custom/studio/studio-order-mail.ts",
    "components/custom/studio/studio-order-config.ts",
    "components/custom/studio/studio-order-form.tsx",
    "components/custom/studio/studio-order-page.tsx",
    "components/custom/studio/studio-home.tsx",
    "app/page.tsx",
    "app/order/page.tsx",
    "app/work/page.tsx",
    "app/api/studio/order/route.ts",
    "components/custom/studio/studio-client.tsx",
    "components/custom/landing/hosting-site-metadata.ts",
]
STRING = re.compile(r'"([^"\n]*)"|`([^`]*)`|\'([^\'\n]*)\'')
WORD = re.compile(r"(?<![A-Za-z_/.\-\[])studio(?![A-Za-z_/.\-\]])", re.I)


class CortexBrandTest(unittest.TestCase):
    def test_no_studio_in_visible_copy(self):
        hits = []
        for rel in FILES:
            for n, line in enumerate((ROOT / rel).read_text().splitlines(), 1):
                s = line.strip()
                if s.startswith(("//", "*", "/*", "{/*", "import ")) or "console." in s:
                    continue
                for m in STRING.finditer(line):
                    text = next(g for g in m.groups() if g is not None)
                    if text.strip().lower() == "studio":
                        continue  # an id, not copy
                    if WORD.search(text):
                        hits.append(f"{rel}:{n}: {text[:80]}")
        self.assertEqual(hits, [])

    def test_no_rokct_hosting_or_greeting_in_visible_copy(self):
        """1.20.7: the site's own name is CORTEX. Customer-facing strings never
        say "Rokct Hosting", greet "Hi ROKCT", or sign off as ROKCT. The legal
        name (ROKCT INTELLIGENCE (PTY) LTD), repo slugs and the ROKCT logo
        artwork's own descriptions are out of scope."""
        bad = re.compile(r"rokct hosting|hi rokct|·\s*rokct\b|\brokct\s*·|^rokct, home$", re.I)
        hits = []
        for rel in FILES:
            for n, line in enumerate((ROOT / rel).read_text().splitlines(), 1):
                s = line.strip()
                if s.startswith(("//", "*", "/*", "{/*", "import ")):
                    continue
                for m in STRING.finditer(line):
                    text = next(g for g in m.groups() if g is not None)
                    # A bare "ROKCT" is the old name as copy; "rokct" is the logo-back id.
                    if bad.search(text.strip()) or text.strip() == "ROKCT":
                        hits.append(f"{rel}:{n}: {text[:80]}")
        self.assertEqual(hits, [])

    def test_site_name_and_marks_say_cortex(self):
        meta = (ROOT / "components/custom/landing/hosting-site-metadata.ts").read_text()
        self.assertIn('siteName: "CORTEX",', meta)
        self.assertNotIn("Rokct", meta.split("const HOSTING_SITE_METADATA", 1)[1])
        client = (ROOT / "components/custom/studio/studio-client.tsx").read_text()
        self.assertIn('aria-label="CORTEX, home"', client)
        home = (ROOT / "components/custom/studio/studio-home.tsx").read_text()
        footer = home.split('<footer className="ft">', 1)[1].split("</footer>", 1)[0]
        self.assertIn("CORTEX", footer)
        self.assertNotIn("ROKCT", re.sub(r"\{/\*.*?\*/\}", "", footer, flags=re.S))
        self.assertNotIn("SiteCredit", footer)

    def test_titles_say_cortex(self):
        self.assertIn('absolute: "CORTEX"', (ROOT / "app/page.tsx").read_text())
        self.assertIn('"Order · CORTEX"', (ROOT / "app/order/page.tsx").read_text())

    def test_brand_is_capitals(self):
        """1.21.0 (Ray, 2026-11-09: "CORTEX NOT Cortex"): every visible
        brand string is CORTEX; any other casing in a string literal fails."""
        files = FILES + [
            "components/custom/studio/studio-client.tsx",
            "components/custom/studio/studio-order-config.ts",
            "components/custom/landing/hosting-site-metadata.ts",
            "app/api/studio/pay/route.ts",
            "components/custom/site-shell.tsx",
            "components/custom/cortex-auth/cortex-auth-copy.ts",
        ]
        bad = re.compile(r"\b(?!CORTEX\b)[Cc][Oo][Rr][Tt][Ee][Xx]\b")
        hits = []
        for rel in files:
            for n, line in enumerate((ROOT / rel).read_text().splitlines(), 1):
                s = line.strip()
                if s.startswith(("//", "*", "/*", "{/*", "import ")):
                    continue
                for m in STRING.finditer(line):
                    text = next(g for g in m.groups() if g is not None)
                    if bad.search(text):
                        hits.append(f"{rel}:{n}: {text[:80]}")
        self.assertEqual(hits, [])
        self.assertIn('siteName: "CORTEX"', (ROOT / "components/custom/studio/studio-copy.ts").read_text())
        shell = (ROOT / "components/custom/site-shell.tsx").read_text()
        self.assertNotRegex(shell, r">\s*Cortex\s*<")
        # JSX text too: no non-comment line anywhere says "Cortex".
        title = []
        for rel in files:
            for n, line in enumerate((ROOT / rel).read_text().splitlines(), 1):
                if not line.strip().startswith(("//", "*", "/*", "{/*")) and re.search(r"\bCortex\b", line):
                    title.append(f"{rel}:{n}")
        self.assertEqual(title, [])


if __name__ == "__main__":
    unittest.main()
