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

"""hosting_sdk 1.20.5: apps inside showcase cards.

Run:  python3 -m unittest discover -s hosting/nextjs/tests
"""

import json
import unittest

from test_studio_showcase import CLIENT, CSS, RULES, entry, read, run_node

PROBE = """
import { parseShowcaseEntry, SHOWCASE_SERVICES, STUDIO_SHOWCASE_FALLBACK } from './studio-showcase.ts';
const C = globalThis.CASES;
const out = {};
for (const [k, raw] of Object.entries(C)) {
  const e = parseShowcaseEntry(raw);
  out[k] = e && { apps: e.apps, services: e.services };
}
out.chips = SHOWCASE_SERVICES.map((s) => s.key);
out.fallback = STUDIO_SHOWCASE_FALLBACK.map((s) => [s.name, s.kind, s.apps.length]);
console.log(JSON.stringify(out));
"""

APP = {"name": "Supacharge", "repo": "RokctAI/supacharge", "phone": "marketing/tour/store/01-welcome.png"}


class TestApps(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cases = {
            "none": entry("Polaris", "RokctAI/polaris-web", 8),
            "one": entry("Supa", "RokctAI/supacharge-web", 9, apps=[APP]),
            "store": entry("S", "RokctAI/s", 7, apps=[dict(APP, store="https://play.google.com/store/apps/details?id=x")]),
            "badStore": entry("S", "RokctAI/s", 7, apps=[dict(APP, store="http://x.com")]),
            "climb": entry("S", "RokctAI/s", 7, apps=[dict(APP, phone="../x.png")]),
            "noName": entry("S", "RokctAI/s", 7, apps=[{"phone": "a.png"}]),
            "many": entry("S", "RokctAI/s", 7, apps=[dict(APP, name=f"A{i}") for i in range(6)]),
            "claim": entry("S", "RokctAI/s", 7, services=["website", "app"]),
            "ownRepo": entry("S", "RokctAI/s", 7, apps=[{"name": "S", "phone": "p.png", "branch": "shots"}]),
        }
        cls.out = run_node(PROBE.replace("const C = globalThis.CASES;", "const C = " + json.dumps(cases) + ";"), {})

    def test_absent_is_empty(self):
        self.assertEqual(self.out["none"]["apps"], [])
        self.assertNotIn("app", self.out["none"]["services"])

    def test_app_resolves_and_implies_service(self):
        a = self.out["one"]["apps"]
        self.assertEqual(a, [{"name": "Supacharge", "store": None,
                              "phone": "https://raw.githubusercontent.com/RokctAI/supacharge/main/marketing/tour/store/01-welcome.png"}])
        self.assertEqual(self.out["one"]["services"], ["website", "app"])

    def test_store_https_only(self):
        self.assertTrue(self.out["store"]["apps"][0]["store"].startswith("https://play.google.com/"))
        self.assertEqual(self.out["badStore"]["apps"], [])

    def test_bad_apps_dropped_card_kept(self):
        for k in ("climb", "noName", "badStore"):
            self.assertIsNotNone(self.out[k])
            self.assertEqual(self.out[k]["apps"], [])

    def test_cap_and_claim(self):
        self.assertEqual(len(self.out["many"]["apps"]), 4)
        self.assertNotIn("app", self.out["claim"]["services"])

    def test_defaults_to_card_repo(self):
        self.assertEqual(self.out["ownRepo"]["apps"][0]["phone"], "https://raw.githubusercontent.com/RokctAI/s/shots/p.png")

    def test_chip_and_fallback(self):
        self.assertEqual(self.out["chips"][:2], ["website", "app"])
        self.assertTrue(all(n == 0 for _, _, n in self.out["fallback"]))

    def test_work_draws_apps(self):
        self.assertIn('className="wk-apps"', read(CLIENT))
        self.assertIn(".st .wk-apps{", read(CSS))


if __name__ == "__main__":
    unittest.main()
