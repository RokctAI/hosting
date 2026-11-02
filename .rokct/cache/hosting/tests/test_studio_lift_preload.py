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

"""hosting_sdk 1.17.1: the logo back's pictures load before the pen ring draws.

Ray: "logo card in showcase let it predownload. the pen highlight shows
before it loads and just circle empty".

Run:  python3 -m unittest discover -s hosting/nextjs/tests
"""

import json
import os
import re
import unittest

from test_studio_showcase import CLIENT, SDK_ROOT, read

LIFT = os.path.join(os.path.dirname(CLIENT), "studio-showcase-lift.tsx")


class TestLiftPreload(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = read(CLIENT)
        cls.lift = read(LIFT)

    def test_lift_lists_every_picture(self):
        self.assertIn("export function liftImageUrls(", self.lift)
        body = self.lift.split("export function liftImageUrls(")[1].split("\n}\n")[0]
        for part in ("logo-sheet", "logo-sketches", "LIFT_SHEET", "LIFT_SKETCHES", "true"):
            self.assertIn(part, body)

    def test_client_preloads_on_idle_once_ready(self):
        self.assertIn('import { liftImageUrls } from "./studio-showcase-lift";', self.client)
        self.assertIn("function preloadLift()", self.client)
        self.assertIn("requestIdleCallback", self.client)
        self.assertRegex(self.client, r"if \(!hasLift \|\| !ready\) return;")

    def test_turn_waits_for_pictures_with_a_cap(self):
        self.assertRegex(self.client, r"const LIFT_WAIT_MAX = \d+;")
        self.assertIn("Promise.race([preloadLift()", self.client)
        turn = self.client.split("function useTurn(")[1].split("\nfunction ")[0]
        self.assertIn("liftReady().then(", turn)
        # The card only lifts if it is still the turned one when the pictures arrive.
        self.assertIn("S.flipped !== g", turn)


class TestVersion(unittest.TestCase):
    def test_version_and_changelog(self):
        manifest = json.loads(read(os.path.join(SDK_ROOT, "manifest.json")))
        self.assertGreaterEqual(tuple(int(p) for p in manifest["version"].split(".")), (1, 17, 1))
        head = read(os.path.join(SDK_ROOT, "CHANGELOG.md")).split("## 1.17.0")[0]
        self.assertIn("## 1.17.1", head)
        self.assertIn("predownload", head)


if __name__ == "__main__":
    unittest.main()
