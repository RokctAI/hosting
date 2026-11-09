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

"""hosting_sdk 1.20.7: the hero follows the currency picker, and every price
reads one live rate. Prices are set and charged in rand; the dollar figure is
the rand amount at a server-fetched rate (open.er-api.com, revalidated every
12 hours) with the fixed R18.50 as the fallback, in whole dollars."""

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
RATES = os.path.join(STUDIO, "studio-rates.ts")
HOME = os.path.join(STUDIO, "studio-home.tsx")
CLIENT = os.path.join(STUDIO, "studio-client.tsx")
FORM = os.path.join(STUDIO, "studio-order-form.tsx")
ROUTE = os.path.join(T, "app", "api", "studio", "currency", "route.ts")


def read(p):
    with open(p, encoding="utf-8") as f:
        return f.read()


PROBE = r"""
import { studioConvert, studioMoney, studioPrice, studioDeal, studioCurrencyForCountry, STUDIO_USD_PER_ZAR_FIXED } from './studio-copy.ts';
import { parseStudioRate, getStudioRate, STUDIO_RATE_FALLBACK } from './studio-rates.ts';
const ok = { result: 'success', base_code: 'ZAR', rates: { USD: 0.055 } };
globalThis.fetch = async () => { throw new Error('offline'); };
const offline = await getStudioRate();
globalThis.fetch = async () => ({ ok: false, json: async () => ok });
const bad = await getStudioRate();
globalThis.fetch = async () => ({ ok: true, json: async () => ok });
const live = await getStudioRate();
console.log(JSON.stringify({
  fixed: STUDIO_USD_PER_ZAR_FIXED,
  fallback: STUDIO_RATE_FALLBACK,
  parsedOk: parseStudioRate(ok),
  parsedBad: [parseStudioRate(null), parseStudioRate({ result: 'error' }), parseStudioRate({ result: 'success', base_code: 'USD', rates: { USD: 1 } }),
              parseStudioRate({ result: 'success', base_code: 'ZAR', rates: { USD: 'x' } }), parseStudioRate({ result: 'success', base_code: 'ZAR', rates: { USD: 5 } })],
  offline, bad, live,
  conv: [studioConvert(2500, 'ZAR', 0.055), studioConvert(2500, 'USD', 0.055), studioConvert(2500, 'USD'), studioConvert(2500, 'USD', NaN), studioConvert(1999.6, 'ZAR')],
  money: [studioMoney(12950, 'ZAR', 0.055), studioMoney(12950, 'USD', 0.055)],
  price: [studioPrice(100, 'main', 'USD', 0.055), studioPrice(100, 'main', 'ZAR', 0.055), studioPrice(100, 'alt', 'ZAR', 0.055)],
  deal: [studioDeal('offer', 'USD', 0.055), studioDeal('offer', 'ZAR', 0.055)],
  country: [studioCurrencyForCountry('ZA'), studioCurrencyForCountry(null), studioCurrencyForCountry('us'), studioCurrencyForCountry('GB')],
}));
"""


class TestRatesAndConversion(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        node = shutil.which("node")
        if not node:
            raise unittest.SkipTest("node not found")
        with tempfile.TemporaryDirectory() as tmp:
            shutil.copy(COPY, os.path.join(tmp, "studio-copy.ts"))
            rates = read(RATES).replace('from "./studio-copy";', 'from "./studio-copy.ts";')
            with open(os.path.join(tmp, "studio-rates.ts"), "w", encoding="utf-8") as f:
                f.write(rates)
            probe = os.path.join(tmp, "probe.mts")
            with open(probe, "w", encoding="utf-8") as f:
                f.write(PROBE)
            run = subprocess.run([node, "--experimental-strip-types", "--no-warnings", probe],
                                 capture_output=True, text=True, timeout=60, cwd=tmp)
        if run.returncode != 0:
            raise AssertionError(run.stderr)
        cls.o = json.loads(run.stdout)

    def test_fallback_is_the_fixed_rate(self):
        o = self.o
        self.assertAlmostEqual(o["fixed"], 1 / 18.5)
        self.assertEqual(o["fallback"], {"usdPerZar": o["fixed"], "live": False})
        for r in o["parsedBad"]:
            self.assertEqual(r, o["fallback"])
        self.assertEqual(o["offline"], o["fallback"])
        self.assertEqual(o["bad"], o["fallback"])

    def test_live_rate_is_used(self):
        self.assertEqual(self.o["parsedOk"], {"usdPerZar": 0.055, "live": True})
        self.assertEqual(self.o["live"], {"usdPerZar": 0.055, "live": True})

    def test_conversion_helper_rounds_to_whole_units(self):
        self.assertEqual(self.o["conv"], [2500, 138, 135, 135, 2000])
        self.assertEqual(self.o["money"], ["R12 950", "$712"])
        # A row set as $100 is R1 850; in dollars it shows at the live rate.
        self.assertEqual(self.o["price"], ["$102", "R1 850", "$102"])
        self.assertEqual(self.o["deal"], ["$138", "R2 500"])

    def test_ip_default(self):
        self.assertEqual(self.o["country"], ["ZAR", "ZAR", "USD", "USD"])


class TestWiring(unittest.TestCase):
    def test_rate_is_fetched_server_side_only_with_revalidate(self):
        rates = read(RATES)
        self.assertIn('"https://open.er-api.com/v6/latest/ZAR"', rates)
        self.assertIn("STUDIO_RATES_REVALIDATE = 43200", rates)
        self.assertIn("next: { revalidate: STUDIO_RATES_REVALIDATE }", rates)
        self.assertIn("getStudioRate", read(ROUTE))
        self.assertIn("x-vercel-ip-country", read(ROUTE))
        for root, _, files in os.walk(T):
            for name in files:
                p = os.path.join(root, name)
                if p in (RATES,) or not name.endswith((".ts", ".tsx")):
                    continue
                self.assertNotIn("er-api.com", read(p), p)
        client = read(CLIENT)
        self.assertIn('fetch("/api/studio/currency")', client)
        self.assertNotIn("studio-rates", client)

    def test_hero_reads_the_currency(self):
        home = read(HOME)
        hero = home.split('<section className="hero">', 1)[1].split("</section>", 1)[0]
        self.assertIn("<StudioHeroCurrency />", hero)
        self.assertNotRegex(hero, r"Rand prices|\bR\d")
        copy = read(COPY)
        hero_copy = copy.split("export const STUDIO_HERO = {", 1)[1].split("\n};", 1)[0]
        self.assertNotIn('"Rand prices"]', hero_copy)
        self.assertIn('prices: { ZAR: "Rand prices", USD: "Dollar prices" }', hero_copy)
        self.assertIn("STUDIO_HERO.prices[cur]", read(CLIENT))

    def test_one_context_carries_rate_to_every_price(self):
        client = read(CLIENT)
        self.assertIn("studioPrice(usd, fmt, cur, usdPerZar)", client)
        self.assertIn("studioDeal(k, cur, usdPerZar)", client)
        form = read(FORM)
        self.assertIn("const { cur, usdPerZar } = useStudioCurrency();", form)
        self.assertNotRegex(form, r"studioMoney\([^()]*, cur\)")
        # The charge is rand; dollars are marked approx.
        self.assertIn('`R${total}${cur === "USD" ? ` (approx. ${studioMoney(total, cur, usdPerZar)})` : ""}`', form)

    def test_footer_has_the_picker(self):
        home = read(HOME)
        footer = home.split('<footer className="ft">', 1)[1].split("</footer>", 1)[0]
        self.assertIn("<StudioCurrencyBar />", footer)


if __name__ == "__main__":
    unittest.main()
