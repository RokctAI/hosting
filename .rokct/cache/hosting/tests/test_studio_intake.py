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


"""hosting_sdk 1.9.0: the studio intake form. The special is the website
and brand bundle; an online shop and a mobile app are optional add-ons
outside it, never priced, never blocking, and carried into the WhatsApp
message the form sends.

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
CLIENT = os.path.join(STUDIO, "studio-client.tsx")
COPY = os.path.join(STUDIO, "studio-copy.ts")


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


class TestStudioIntakeForm(unittest.TestCase):
    def test_version_and_changelog(self):
        manifest = json.loads(read(os.path.join(SDK_ROOT, "manifest.json")))
        self.assertEqual(manifest["version"], "1.21.0")
        head = read(os.path.join(SDK_ROOT, "CHANGELOG.md")).split("## 1.7.0")[0]
        self.assertIn("## 1.20.0", head)
        self.assertIn("Mobile app", head)
        latest = read(os.path.join(SDK_ROOT, "CHANGELOG.md")).split("## 1.20.1")[0]
        self.assertIn("## 1.20.4", latest)
        self.assertIn("Do you already have a domain name?", latest)

    def test_form_sits_under_the_ten_questions(self):
        home = read(HOME)
        intake = home.split('<div className="intake">', 1)[1].split("</section>", 1)[0]
        self.assertLess(
            intake.index('<ol className="chips">'), intake.index("<StudioIntakeForm />")
        )

    def test_add_ons_are_real_checkboxes_and_never_block(self):
        client = read(CLIENT)
        form = client.split("export function StudioIntakeForm()", 1)[1]
        self.assertIn('<fieldset className="ik-add">', form)
        self.assertIn("<legend>", form)
        self.assertIn('<label className="ik-opt"', form)
        self.assertIn('type="checkbox"', form)
        self.assertIn('role="status" aria-live="polite"', form)
        # 1.20.7 (Ray): the brief is emailed, never sent to WhatsApp.
        self.assertIn('fetch("/api/studio/brief"', form)
        self.assertNotIn("wa.me", form)
        for blocker in ("required", "disabled"):
            self.assertNotIn(blocker, form, blocker)

    def test_copy_has_no_price_for_add_ons_and_no_tools(self):
        copy = read(COPY)
        block = copy.split("export const STUDIO_INTAKE_FORM = {", 1)[1].split(
            "\n};", 1
        )[0]
        addons = block.split("addons:", 1)[1].split("note:", 1)[0]
        self.assertNotRegex(
            addons, r"R\s?\d|\$\s?\d|usd|price", "no price on an add-on"
        )
        self.assertIn('name: "Website and brand bundle"', block)
        self.assertIn("free lifetime hosting", block)
        for word in ("AI", "artificial", "Claude", "GPT", "automat"):
            self.assertNotRegex(block, r"\b" + word, word)

    def test_message_and_note(self):
        """Executes the copy's rules with node (skips when node is missing)."""
        node = shutil.which("node")
        if not node:
            raise unittest.SkipTest("node not reachable")
        with tempfile.TemporaryDirectory() as tmp:
            shutil.copy(COPY, os.path.join(tmp, "studio-copy.ts"))
            probe = os.path.join(tmp, "probe.mts")
            with open(probe, "w", encoding="utf-8") as f:
                f.write(
                    "import { studioIntakeMessage as m, studioIntakeNote as n } from './studio-copy.ts';\n"
                    "console.log(JSON.stringify({none: m([]), app: m(['app']), both: m(['app', 'shop']),\n"
                    "  n0: n([]), n1: n(['shop']), n2: n(['shop', 'app'])}));\n"
                )
            run = subprocess.run(
                [node, "--experimental-strip-types", "--no-warnings", probe],
                capture_output=True,
                text=True,
                timeout=60,
                cwd=tmp,
                check=False,
            )
        self.assertEqual(run.returncode, 0, run.stderr)
        out = json.loads(run.stdout)
        head = "Hi CORTEX, I'd like to start my brief for the Website and brand bundle (the special)."
        self.assertEqual(out["none"], head)
        self.assertEqual(
            out["app"],
            head
            + "\n\nAdd-ons, outside the special, for your team to quote separately:\n"
            "- Mobile app (Android and iOS)",
        )
        # Add-ons keep the form's order, whatever order they were ticked in.
        self.assertTrue(
            out["both"].endswith(
                "- Online shop / e-commerce\n- Mobile app (Android and iOS)"
            )
        )
        self.assertEqual(out["n0"], "")
        self.assertTrue(out["n1"].startswith("This isn't part of the special"))
        self.assertTrue(out["n2"].startswith("These aren't part of the special"))
        self.assertIsNone(re.search(r"\d", out["both"].split("\n\n", 1)[1]))


if __name__ == "__main__":
    unittest.main()
