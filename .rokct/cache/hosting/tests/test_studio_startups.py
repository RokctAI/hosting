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


"""/startups, the website and brand deal for startups and
SMMEs. It renders the same order form as /order (one implementation and one
price source). The page changes the hero and the place PayFast returns to.
The order carries a `source` ("order" or "startups") into the studio email,
and the card return goes back to the page the order was placed on. Only
/order and /startups are allowed as return paths.

Run:  python3 -m unittest discover -s hosting/nextjs/tests
"""

import json
import os
import re
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
SDK_ROOT = os.path.abspath(os.path.join(HERE, os.pardir))
TEMPLATES = os.path.join(SDK_ROOT, "templates")
STUDIO = os.path.join(TEMPLATES, "components", "custom", "studio")
STARTUPS_PAGE = os.path.join(TEMPLATES, "app", "startups", "page.tsx")
ORDER_PAGE = os.path.join(TEMPLATES, "app", "order", "page.tsx")
PAY_ROUTE = os.path.join(TEMPLATES, "app", "api", "studio", "pay", "route.ts")
ORDER_ROUTE = os.path.join(TEMPLATES, "app", "api", "studio", "order", "route.ts")
PAGE_BODY = os.path.join(STUDIO, "studio-order-page.tsx")
FORM = os.path.join(STUDIO, "studio-order-form.tsx")
MAIL = os.path.join(STUDIO, "studio-order-mail.ts")
PAY = os.path.join(STUDIO, "studio-pay.ts")
ORDER = os.path.join(STUDIO, "studio-order.ts")
HOME = os.path.join(STUDIO, "studio-home.tsx")
COPY = os.path.join(STUDIO, "studio-copy.ts")


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def code_of(path):
    src = re.sub(r"/\*.*?\*/", "", read(path), flags=re.S)
    return re.sub(r"^\s*//.*$", "", src, flags=re.M)


class TestStartupsPage(unittest.TestCase):
    def test_route_exists_and_renders_the_shared_order(self):
        self.assertTrue(os.path.isfile(STARTUPS_PAGE))
        page = read(STARTUPS_PAGE)
        self.assertIn('import { StudioOrder } from "@/components/custom/studio/studio-order-page";', page)
        self.assertIn('path="/startups"', page)
        self.assertNotIn("<StudioOrderForm", page, "the form is not duplicated")

    def test_route_checks_payment_return_state_like_order(self):
        page = read(STARTUPS_PAGE)
        self.assertIn("studioCleanRef(q.paid)", page)
        self.assertIn("studioIsOrderRef(rawPaid)", page)
        self.assertIn("q.cancelled", page)

    def test_has_its_own_metadata(self):
        page = read(STARTUPS_PAGE)
        self.assertIn('title: { absolute: "Startups and SMMEs · CORTEX MEDIA" }', page)

    def test_order_page_is_unchanged_and_still_default(self):
        self.assertIn('"Order · CORTEX MEDIA"', read(ORDER_PAGE))
        self.assertNotIn("path=", read(ORDER_PAGE))

    def test_startup_hero_has_no_hard_coded_price(self):
        copy = read(ORDER)
        block = copy.split("export const STUDIO_STARTUPS_COPY", 1)[1].split("};", 1)[0]
        self.assertIn("startups", block.lower())
        self.assertNotRegex(block, r"R\s?\d")


class TestMenus(unittest.TestCase):
    def test_header_links_startups_after_portfolio(self):
        nav = code_of(COPY).split("export const STUDIO_NAV = [", 1)[1].split("] as const;", 1)[0]
        self.assertIn('{ href: "/startups", label: "Startups" },', nav)
        self.assertLess(nav.index('"/work"'), nav.index('"/startups"'))

    def test_footer_links_startups_from_copy(self):
        footer = code_of(HOME).split('<footer className="ft">', 1)[1].split("</footer>", 1)[0]
        self.assertIn('<nav className="ft-nav" aria-label="Footer">', footer)
        self.assertIn("STUDIO_FOOTER.pages.map", footer)
        block = code_of(COPY).split("export const STUDIO_FOOTER = {", 1)[1].split("] as const,", 1)[0]
        self.assertIn('{ href: "/startups", label: "Startups" },', block)

    def test_footer_has_no_currency_toggle(self):
        footer = code_of(HOME).split('<footer className="ft">', 1)[1].split("</footer>", 1)[0]
        self.assertNotIn("<select", footer)
        self.assertNotIn("setCur", footer)
        self.assertNotIn("StudioCurrencyToggle", footer)

    def test_startups_is_in_the_manifest(self):
        manifest = json.loads(read(os.path.join(SDK_ROOT, "manifest.json")))
        pairs = {(i["from"], i["to"]) for i in manifest["app_type"]["hosting"]["installs"]}
        self.assertIn(("templates/app/startups/page.tsx", "app/startups/page.tsx"), pairs)
        self.assertEqual(manifest["version"], "1.25.1")


class TestSharedPageHero(unittest.TestCase):
    def test_order_component_takes_a_path_and_switches_hero(self):
        body = code_of(PAGE_BODY)
        self.assertIn('path = "/order"', body)
        self.assertIn('path === STUDIO_STARTUPS_HREF ? STUDIO_STARTUPS_COPY : null', body)
        self.assertIn("current={path}", body)
        self.assertIn("path={path}", body)

    def test_form_takes_path_and_sends_source(self):
        form = code_of(FORM)
        self.assertIn('path = "/order"', form)
        self.assertIn('form.set("source", path === "/startups" ? "startups" : "order");', form)
        self.assertIn('from: path }', form)


class TestReturnPaths(unittest.TestCase):
    def test_return_paths_are_an_allowlist(self):
        pay = code_of(PAY)
        self.assertIn('STUDIO_PAY_RETURN_PATHS = ["/order", "/startups"]', pay)
        self.assertIn("(STUDIO_PAY_RETURN_PATHS as readonly string[]).includes(raw)", pay)
        self.assertIn(': "/order";', pay, "anything else falls back to /order")

    def test_pay_route_uses_the_allowlisted_path(self):
        route = code_of(PAY_ROUTE)
        self.assertIn('const from = studioPayReturnPath(q("from", 20));', route)
        self.assertIn("returnUrl: `${origin}${from}?paid=", route)
        self.assertIn("cancelUrl: `${origin}${from}?cancelled=1`", route)
        self.assertNotIn("${origin}/order?", route)

    def test_card_link_omits_default_page(self):
        pay = code_of(PAY)
        self.assertIn('if (from !== "/order") q.set("from", from);', pay)

    def test_card_post_carries_from(self):
        form = code_of(FORM)
        self.assertIn("from: StudioPayReturnPath", form)
        self.assertIn("StudioPayStep", form)


class TestOrderSource(unittest.TestCase):
    def test_route_reads_source_and_defaults_to_order(self):
        route = code_of(ORDER_ROUTE)
        self.assertIn('const source = fields.source === "startups" ? "startups" : "order";', route)
        self.assertIn('source === "startups" ? "/startups" : "/order"', route)
        self.assertIn("{ account: studioBankAccount(), cardUrl }, source);", route)

    def test_email_states_the_page(self):
        mail = code_of(MAIL)
        self.assertIn('source: "order" | "startups" = "order"', mail)
        self.assertIn('Placed on: /startups (startups and SMMEs page)', mail)
        self.assertIn("Placed on: /order", mail)
        self.assertIn("sourceLine,", mail)


if __name__ == "__main__":
    unittest.main()
