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

"""hosting_sdk 1.21.0: the CORTEX auth pages. The home SDK installs its own
components/custom/site-shell.tsx (auth_sdk >= 1.12.0's SiteShell seam) with
the SiteShell / SiteShellLogo contract, client-safe, framed by the studio's
header, faces and tokens; no visible copy says "studio"."""

import json
import re
import unittest
from pathlib import Path

SDK = Path(__file__).resolve().parents[1]
T = SDK / "templates"
SHELL = T / "components/custom/site-shell.tsx"


class CortexAuthTest(unittest.TestCase):
    def test_manifest_installs_the_shell(self):
        m = json.loads((SDK / "manifest.json").read_text())
        pairs = {(i["from"], i["to"]) for i in m["app_type"]["hosting"]["installs"]}
        self.assertIn(("templates/components/custom/site-shell.tsx", "components/custom/site-shell.tsx"), pairs)
        self.assertIn(("templates/components/custom/cortex-auth", "components/custom/cortex-auth"), pairs)

    def test_contract(self):
        src = SHELL.read_text()
        self.assertIn('"use client";', src)
        self.assertIn("export interface SiteShellProps", src)
        self.assertIn("export function SiteShell(", src)
        self.assertIn("export function SiteShellLogo(", src)
        self.assertIn("StudioHeader", src)
        self.assertIn("studioFontClassName", src)
        self.assertNotRegex(src, r"server-only|next/headers")

    def test_css_scoped(self):
        css = (T / "components/custom/cortex-auth/cortex-auth.css").read_text()
        body = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
        for sel in re.findall(r"([^{}]+)\{", body):
            if sel.strip().startswith("@media"):
                continue
            for part in sel.split(","):
                self.assertRegex(part.strip(), r"^(\.dark )?\.st \.ca", part)

    def test_no_studio_in_copy(self):
        src = (T / "components/custom/cortex-auth/cortex-auth-copy.ts").read_text()
        strings = re.findall(r'"([^"\n]*)"', src)
        self.assertFalse([s for s in strings if re.search(r"\bstudio\b", s, re.I)])

    def test_ledes_promise_no_account_area(self):
        src = (T / "components/custom/cortex-auth/cortex-auth-copy.ts").read_text()
        self.assertIn('"Sign in to your CORTEX account to carry on."', src)
        self.assertIn('"Create a CORTEX account to get started."', src)
        for phrase in ("your orders", "renders to approve", "as it comes in"):
            self.assertNotIn(phrase, src)


if __name__ == "__main__":
    unittest.main()
