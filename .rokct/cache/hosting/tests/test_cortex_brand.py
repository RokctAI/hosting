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

"""hosting_sdk 1.20.4: the brand is "Cortex" (Ray, 2026-11-02). No
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

    def test_titles_say_cortex(self):
        self.assertIn('absolute: "Cortex"', (ROOT / "app/page.tsx").read_text())
        self.assertIn('"Order · Cortex"', (ROOT / "app/order/page.tsx").read_text())


if __name__ == "__main__":
    unittest.main()
