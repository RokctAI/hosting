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

"""hosting_sdk 1.20.7 (Ray): both forms submit by email, and the logo is a
discounted add-on, not part of the special.

  * /order posts to the SMTP order route; a failure (SMTP not configured
    included) shows a clear message and never falls back to WhatsApp.
  * The home page brief form posts to /api/studio/brief, which sends through
    the same SMTP config and sender; not configured is a clear 503.
  * Logo design: R350, normally R650 (struck through), on every package,
    through the currency conversion; the emails state the rand charge.
"""

import json
import os
import re
import shutil
import subprocess
import tempfile
import unittest

SDK_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))
T = os.path.join(SDK_ROOT, "templates")
STUDIO = os.path.join(T, "components", "custom", "studio")
COPY = os.path.join(STUDIO, "studio-copy.ts")
CLIENT = os.path.join(STUDIO, "studio-client.tsx")
FORM = os.path.join(STUDIO, "studio-order-form.tsx")
ORDER_ROUTE = os.path.join(T, "app", "api", "studio", "order", "route.ts")
BRIEF_ROUTE = os.path.join(T, "app", "api", "studio", "brief", "route.ts")
MANIFEST = os.path.join(SDK_ROOT, "manifest.json")


def read(p):
    with open(p, encoding="utf-8") as f:
        return f.read()


def code(p):
    s = re.sub(r"/\*.*?\*/", "", read(p), flags=re.S)
    return re.sub(r"^\s*//.*$", "", s, flags=re.M)


class TestEmailOnly(unittest.TestCase):
    def test_order_form_and_route_have_no_whatsapp(self):
        for p in (FORM, ORDER_ROUTE):
            src = code(p)
            self.assertNotIn("studioWhatsApp", src, p)
            self.assertNotIn("wa.me", src, p)
        self.assertIn("fetch(STUDIO_ORDER_API", read(FORM))

    def test_home_form_posts_to_the_brief_route(self):
        form = read(CLIENT).split("export function StudioIntakeForm()", 1)[1].split("\nexport function", 1)[0]
        self.assertIn('fetch("/api/studio/brief"', form)
        self.assertNotIn("wa.me", form)
        self.assertNotIn("WhatsApp", form)

    def test_brief_route_uses_smtp_and_fails_clearly(self):
        src = code(BRIEF_ROUTE)
        self.assertIn("studioMailConfig(", src)
        self.assertIn("sendStudioOrderMails(cfg", src)
        self.assertIn('reply(503, { ok: false, code: "not_configured", message: E.notConfigured })', src)
        self.assertLess(src.index("if (!cfg.configured)"), src.index("sendStudioOrderMails(cfg"))
        self.assertNotIn("whatsapp", src.lower())
        # Never logs credentials.
        self.assertNotRegex(src, r"console\.[a-z]+\([^)]*(SMTP_PASS|SMTP_USER|cfg\.pass|cfg\.user)")

    def test_brief_route_is_installed(self):
        pairs = {(i["from"], i["to"]) for i in json.loads(read(MANIFEST))["app_type"]["hosting"]["installs"]}
        self.assertIn(("templates/app/api/studio/brief/route.ts", "app/api/studio/brief/route.ts"), pairs)

    def test_copy_says_email(self):
        block = read(COPY).split("export const STUDIO_INTAKE_FORM = {", 1)[1].split("\n};", 1)[0]
        for k in ("submit", "submitNote"):
            v = re.search(k + r': "([^"]+)"', block).group(1)
            self.assertNotIn("WhatsApp", v)
        self.assertIn("nothing was sent", block)


PROBE = r"""
import { STUDIO_ADDONS, studioOrderZar, studioAddonZar, studioMoney, studioIntakeMessage, STUDIO_PRICE_ROWS } from './studio-copy.ts';
const logo = STUDIO_ADDONS.find((a) => a.name === 'designLogo');
const deal = STUDIO_PRICE_ROWS.find((r) => r.price.kind === 'deal');
console.log(JSON.stringify({
  logo: { zar: logo.zar, was: logo.wasZar },
  withDeal: studioAddonZar(logo, deal),
  dealOnly: studioOrderZar(deal.name, []),
  dealLogo: studioOrderZar(deal.name, ['designLogo']),
  usd: [studioMoney(350, 'USD', 0.055), studioMoney(650, 'USD', 0.055)],
  brief: studioIntakeMessage([], true),
}));
"""


class TestLogoAddon(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        node = shutil.which("node")
        if not node:
            raise unittest.SkipTest("node not found")
        with tempfile.TemporaryDirectory() as tmp:
            shutil.copy(COPY, os.path.join(tmp, "studio-copy.ts"))
            probe = os.path.join(tmp, "probe.mts")
            with open(probe, "w", encoding="utf-8") as f:
                f.write(PROBE)
            run = subprocess.run([node, "--experimental-strip-types", "--no-warnings", probe],
                                 capture_output=True, text=True, timeout=60, cwd=tmp)
        if run.returncode != 0:
            raise AssertionError(run.stderr)
        cls.o = json.loads(run.stdout)

    def test_logo_is_a_paid_add_on_even_with_the_special(self):
        self.assertEqual(self.o["logo"], {"zar": 350, "was": 650})
        self.assertEqual(self.o["withDeal"], 350)
        self.assertEqual(self.o["dealLogo"] - self.o["dealOnly"], 350)

    def test_logo_goes_through_the_conversion(self):
        self.assertEqual(self.o["usd"], ["$19", "$36"])

    def test_brief_names_the_logo_price(self):
        self.assertIn("Logo design add-on: R350 (normally R650)", self.o["brief"])

    def test_deal_normal_price_is_10500(self):
        copy = read(COPY)
        self.assertIn("export const STUDIO_DEAL_ZAR = { normal: 10500, offer: 2500 } as const;", copy)
        code = re.sub(r"//[^\n]*", "", copy)
        self.assertNotRegex(code, r"8[,\s\u202f]?500")

    def test_special_no_longer_includes_a_logo(self):
        copy = read(COPY)
        self.assertNotIn("inBundle", copy)
        self.assertNotIn('"Logo, colours and type"', copy)
        self.assertNotIn("Logo and brand,", copy)
        self.assertNotIn("the logo and brand to go with it", copy)

    def test_struck_normal_price_in_the_order_form(self):
        form = read(FORM)
        self.assertGreaterEqual(form.count("a.wasZar ? <s"), 2)
        client = read(CLIENT)
        self.assertIn("<s>{studioMoney(logoAddon.wasZar, cur, usdPerZar)}</s>", client)

    def test_emails_state_the_rand_charge(self):
        mail = read(os.path.join(STUDIO, "studio-order-mail.ts"))
        self.assertIn('"Total charged (ZAR)"', mail)
        self.assertIn("(normally ${groupZar(a.wasZar)})", mail)
        self.assertIn("studioOrderZar(order.service", mail)


if __name__ == "__main__":
    unittest.main()
