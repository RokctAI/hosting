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


"""hosting_sdk 1.5.1: the studio footer's credit line (Ray, 2026-10-31:
"all site will be copyright sitename then built with love (as heart) by
ROKCT"). The footer draws base_sdk 1.54.0's SiteCredit - `© <year> <site
name> · Built with ♥ by ROKCT` - then the prices note, and names no legal
entity.

Run:  python3 -m unittest discover -s hosting/nextjs/tests
"""

import json
import os
import re
import shutil
import subprocess
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
SDK_ROOT = os.path.abspath(os.path.join(HERE, os.pardir))
STUDIO = os.path.join(SDK_ROOT, "templates", "components", "custom", "studio")
HOME = os.path.join(STUDIO, "studio-home.tsx")
COPY = os.path.join(STUDIO, "studio-copy.ts")


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def code_of(path):
    src = re.sub(r"/\*.*?\*/", "", read(path), flags=re.S)
    return re.sub(r"^\s*//.*$", "", src, flags=re.M)


class TestStudioFooterCredit(unittest.TestCase):
    def test_footer_draws_the_site_credit_then_the_prices_note(self):
        home = read(HOME)
        self.assertIn('import { SiteCredit } from "@/components/custom/site-credit";', home)
        footer = home.split('<footer className="ft">', 1)[1].split("</footer>", 1)[0]
        self.assertIn('<span className="fine">', footer)
        self.assertIn('<SiteCredit as="span" siteName={STUDIO_FOOTER.siteName} /> · {STUDIO_FOOTER.prices}', footer)
        self.assertNotIn("STUDIO_FOOTER.legal", home)

    def test_copy_names_no_legal_entity(self):
        code = code_of(COPY)
        block = code.split("export const STUDIO_FOOTER = {", 1)[1].split("};", 1)[0]
        self.assertIn('prices: "Prices in US dollars, shown in rand at R18.50",', block)
        self.assertIn('siteName: "ROKCT",', block)
        for word in ("©", "PTY", "LTD", "Copyright", "legal:"):
            self.assertNotIn(word, block, word)

    def test_version_and_changelog(self):
        manifest = json.loads(read(os.path.join(SDK_ROOT, "manifest.json")))
        self.assertEqual(manifest["version"], "1.5.2")
        head = read(os.path.join(SDK_ROOT, "CHANGELOG.md")).split("## 1.5.0")[0]
        self.assertIn("## 1.5.1", head)
        self.assertIn("Built with", head)

    def test_credit_line_text(self):
        """Executes base_sdk's site-credit rules (skips when no base_sdk >=
        1.54.0 checkout is reachable; set ROKCT_BASE_SDK to its nextjs root)."""
        base = os.environ.get("ROKCT_BASE_SDK") or os.path.abspath(
            os.path.join(SDK_ROOT, os.pardir, os.pardir, os.pardir, "core", "base", "nextjs"))
        rules = os.path.join(base, "templates", "components", "custom", "landing", "site-credit.ts")
        node = shutil.which("node")
        if not os.path.isfile(rules) or not node:
            raise unittest.SkipTest("base_sdk >= 1.54.0 site-credit.ts or node not reachable")
        with tempfile.TemporaryDirectory() as tmp:
            shutil.copy(rules, os.path.join(tmp, "site-credit.ts"))
            probe = os.path.join(tmp, "probe.mts")
            with open(probe, "w", encoding="utf-8") as f:
                f.write("import { siteCreditLine } from './site-credit.ts';\n"
                        "console.log(siteCreditLine('ROKCT', { year: 2026 }));\n")
            run = subprocess.run([node, "--experimental-strip-types", "--no-warnings", probe],
                                 capture_output=True, text=True, timeout=60, cwd=tmp)
        self.assertEqual(run.returncode, 0, run.stderr)
        self.assertEqual(run.stdout.strip(), "© 2026 ROKCT · Built with ♥ by ROKCT")


if __name__ == "__main__":
    unittest.main()
