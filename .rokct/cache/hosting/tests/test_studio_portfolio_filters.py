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

"""hosting_sdk 1.14.0: "Portfolio" in the header and the /work filters.

Ray, 2026-11-01 11:14Z: "/work should be in top menu as portfolio with
filters. all sites get there. filters are for services like website, logo,
etc. the one that has website and logo if filtered to logo it just flip
while others that were not there just show up".

  * The header's "Our work" became "Portfolio", a page link to /work.
  * Each showcase card names its services (default ["website"]) and may
    carry its own logo side (`logo`); logo art implies the "logo" service.
    A card without "website" is logo-only (no url or shots needed).
  * /work: chips for All and each service a card names. "Logo" turns a
    site with a logo side over, brings logo-only cards in and drops the
    rest; "Website" shows website sides only.

Run:  python3 -m unittest discover -s hosting/nextjs/tests
"""

import json
import os
import re
import unittest

from test_studio_showcase import CLIENT, CSS, LOADER, RULES, SDK_ROOT, STUDIO, WORK, entry, read, run_node

HEADER = os.path.join(STUDIO, "studio-client.tsx")
COPY = os.path.join(STUDIO, "studio-copy.ts")
HOME = os.path.join(STUDIO, "studio-home.tsx")


def logo_only(name, repo, rank, **over):
    e = {"name": name, "kind": "Bakery", "tagline": "one line", "repo": repo, "rank": rank, "services": ["logo"]}
    e.update(over)
    return e


PARSE_PROBE = """
import { parseShowcaseEntry, showcaseServices, showcasePictures, showcaseHasLogo, STUDIO_SHOWCASE_FALLBACK } from './studio-showcase.ts';
const cases = JSON.parse(process.argv[2] ?? '{}');
""" + """
const out = { services: {}, parsed: {} };
for (const [k, v] of Object.entries({
  absent: undefined, empty: [], notList: 'logo', junk: ['bogus', 3, null],
  mixed: [' Logo ', 'website', 'website', 'print', 'bogus'], order: ['print', 'pitch-deck', 'social-posts', 'business-plan', 'logo', 'website'],
})) out.services[k] = showcaseServices(v);
for (const [k, raw] of Object.entries(globalThis.CASES)) {
  const e = parseShowcaseEntry(raw);
  out.parsed[k] = e && { ...e, pictures: showcasePictures(e), hasLogo: showcaseHasLogo(e) };
}
out.fallback = STUDIO_SHOWCASE_FALLBACK.map((s) => [s.name, s.services, s.website, s.logo]);
console.log(JSON.stringify(out));
"""


def parse_cases(cases):
    script = PARSE_PROBE.replace("const cases = JSON.parse(process.argv[2] ?? '{}');", "globalThis.CASES = " + json.dumps(cases) + ";")
    return run_node(script, {})


SHOTS = {"branch": "site-shots", "desktop": "latest/desktop-light.webp", "phone": "latest/phone-light.webp"}


class TestServicesAndLogo(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.out = parse_cases({
            # 1.11.0 files, read as before plus the new fields.
            "old": entry("Polaris", "RokctAI/polaris-web", 8),
            "oldNoBack": {k: v for k, v in entry("Zulu", "RokctAI/zulu", 7).items() if k != "logo_back"},
            "rokct": entry("ROKCT", "RokctAI/hosting", 5, logo_back="rokct"),
            # services
            "declared": entry("Both", "RokctAI/both", 6, services=["website", "logo", "print"],
                              logo={"light": "logo/mark-light.webp", "dark": "logo/mark-dark.webp"}),
            "claimNoArt": entry("Claim", "RokctAI/claim", 6, services=["website", "logo"]),
            "ownBranch": entry("Own", "RokctAI/own", 6, logo={"branch": "brand", "light": "mark.png"}),
            "svgLogo": entry("Svg", "RokctAI/svg", 6, logo={"light": "logo.svg"}),
            "climbLogo": entry("Climb", "RokctAI/climb", 6, logo={"light": "../main/x.webp"}),
            "badDark": entry("BadDark", "RokctAI/baddark", 6, logo={"light": "a.webp", "dark": "b.gif"}),
            "emptyServices": entry("Empty", "RokctAI/empty", 6, services=[]),
            # logo-only cards
            "mark": logo_only("Bakery", "RokctAI/bakery", 6, logo={"branch": "brand", "light": "logo/light.webp", "dark": "logo/dark.webp"}),
            "markUrl": logo_only("Shop", "RokctAI/shop", 6, url="https://shop.example/", logo={"branch": "brand", "light": "l.webp"}),
            "markShotsBranch": logo_only("Shots", "RokctAI/shots", 6, shots={"branch": "site-shots"}, logo={"light": "l.webp"}),
            "markNoArt": logo_only("NoArt", "RokctAI/noart", 6),
            "markNoBranch": logo_only("NoBranch", "RokctAI/nobranch", 6, logo={"light": "l.webp"}),
            "markBadUrl": logo_only("BadUrl", "RokctAI/badurl", 6, url="http://x.example", logo={"branch": "brand", "light": "l.webp"}),
            "markRokct": logo_only("Mark", "RokctAI/mark", 6, logo_back="rokct"),
            # a site still needs url and shots
            "siteNoUrl": {k: v for k, v in entry("NoUrl", "RokctAI/nourl", 6).items() if k != "url"},
            "siteNoShots": {k: v for k, v in entry("NoShots", "RokctAI/noshots", 6, services=["website", "logo"], logo={"branch": "b", "light": "l.webp"}).items() if k != "shots"},
        })

    def test_services_default_and_canonical_order(self):
        s = self.out["services"]
        for k in ("absent", "empty", "notList", "junk"):
            self.assertEqual(s[k], ["website"], k)
        self.assertEqual(s["mixed"], ["website", "logo", "print"])
        self.assertEqual(s["order"], ["website", "logo", "social-posts", "business-plan", "pitch-deck", "print"])

    def test_old_files_read_as_before(self):
        p = self.out["parsed"]
        for k in ("old", "oldNoBack"):
            e = p[k]
            self.assertTrue(e["website"], k)
            self.assertEqual(e["services"], ["website"], k)
            self.assertIsNone(e["logo"], k)
            self.assertFalse(e["hasLogo"], k)
            self.assertEqual(e["pictures"], [e["phone"], e["desktop"]], k)
        # logo_back "rokct" is logo art, so the ROKCT card counts as website + logo.
        self.assertEqual(p["rokct"]["services"], ["website", "logo"])
        self.assertTrue(p["rokct"]["hasLogo"])
        self.assertEqual(p["rokct"]["pictures"], [p["rokct"]["phone"], p["rokct"]["desktop"]])  # the bundled back is not probed

    def test_logo_object_resolves_on_the_branch(self):
        p = self.out["parsed"]
        both = p["declared"]
        self.assertEqual(both["services"], ["website", "logo", "print"])
        self.assertEqual(both["logo"], {
            "light": "https://raw.githubusercontent.com/RokctAI/both/site-shots/logo/mark-light.webp",
            "dark": "https://raw.githubusercontent.com/RokctAI/both/site-shots/logo/mark-dark.webp",
        })
        self.assertEqual(both["pictures"][2:], [both["logo"]["light"], both["logo"]["dark"]])
        self.assertEqual(p["ownBranch"]["logo"], {"light": "https://raw.githubusercontent.com/RokctAI/own/brand/mark.png", "dark": None})
        self.assertEqual(p["ownBranch"]["services"], ["website", "logo"])  # art implies the service
        for k in ("svgLogo", "climbLogo", "badDark"):
            self.assertIsNotNone(p[k], k)  # the site stays...
            self.assertIsNone(p[k]["logo"], k)  # ...without the bad logo
            self.assertEqual(p[k]["services"], ["website"], k)

    def test_a_logo_claim_with_nothing_to_show_is_dropped(self):
        self.assertEqual(self.out["parsed"]["claimNoArt"]["services"], ["website"])
        self.assertEqual(self.out["parsed"]["emptyServices"]["services"], ["website"])

    def test_logo_only_cards(self):
        p = self.out["parsed"]
        m = p["mark"]
        self.assertFalse(m["website"])
        self.assertIsNone(m["url"])
        self.assertEqual(m["services"], ["logo"])
        self.assertNotIn("phone", m)
        self.assertEqual(m["pictures"], ["https://raw.githubusercontent.com/RokctAI/bakery/brand/logo/light.webp",
                                         "https://raw.githubusercontent.com/RokctAI/bakery/brand/logo/dark.webp"])
        self.assertEqual(p["markUrl"]["url"], "https://shop.example")
        self.assertEqual(p["markShotsBranch"]["logo"]["light"], "https://raw.githubusercontent.com/RokctAI/shots/site-shots/l.webp")
        self.assertEqual(p["markRokct"]["services"], ["logo"])
        self.assertEqual(p["markRokct"]["pictures"], [])
        for k in ("markNoArt", "markNoBranch", "markBadUrl"):
            self.assertIsNone(p[k], k)

    def test_a_site_still_needs_url_and_shots(self):
        self.assertIsNone(self.out["parsed"]["siteNoUrl"])
        self.assertIsNone(self.out["parsed"]["siteNoShots"])

    def test_built_in_list_declares_its_services(self):
        self.assertEqual(self.out["fallback"], [
            ["ROKCT", ["website", "logo"], True, None],
            ["Polaris", ["website"], True, None],
            ["Supacharge", ["website"], True, None],
        ])


FILTER_PROBE = """
import { showcaseFilters, showcaseInFilter, showcaseFace, showcaseFiltered, showcaseFilterParam, showcaseSitesOnly, buildShowcase } from './studio-showcase.ts';
const files = JSON.parse(%s);
const list = buildShowcase(files);
const names = (l) => l.map((e) => e.name);
const view = (f) => showcaseFiltered(list, f).map((e) => `${e.name}:${showcaseFace(e, f)}`);
const chips = showcaseFilters(list);
const sitesOnlyChips = showcaseFilters(list.filter((e) => e.name !== 'Bakery' && e.name !== 'ROKCT'));
console.log(JSON.stringify({
  order: names(list),
  chips: chips.map((c) => [c.key, c.label, c.count]),
  sitesOnlyChips: sitesOnlyChips.map((c) => c.key),
  all: view('all'), website: view('website'), logo: view('logo'), print: view('print'),
  param: ['logo', 'LOGO', ' website ', 'pitch-deck', 'bogus', '', null].map((v) => showcaseFilterParam(v, chips)),
  inFilter: showcaseInFilter(list[0], 'all'),
  sitesOnly: names(showcaseSitesOnly(list)),
}));
"""


class TestFilterLogic(unittest.TestCase):
    """Ray: under "Logo" a site with a logo flips, logo-only cards show up, the rest leave."""

    @classmethod
    def setUpClass(cls):
        files = [
            {"name": "RokctAI__hosting.json", "text": json.dumps(entry("ROKCT", "RokctAI/hosting", 5, logo_back="rokct"))},
            {"name": "RokctAI__polaris-web.json", "text": json.dumps(entry("Polaris", "RokctAI/polaris-web", 8))},
            {"name": "RokctAI__southriver-web.json", "text": json.dumps(entry("South River", "RokctAI/southriver-web", 7))},
            {"name": "RokctAI__printshop.json", "text": json.dumps(entry("Printshop", "RokctAI/printshop", 6, services=["website", "print"]))},
            {"name": "RokctAI__bakery.json", "text": json.dumps(logo_only("Bakery", "RokctAI/bakery", 9, logo={"branch": "brand", "light": "l.webp"}))},
        ]
        cls.out = run_node(FILTER_PROBE % json.dumps(json.dumps(files)), {})

    def test_chips_only_for_services_a_card_has(self):
        self.assertEqual(self.out["chips"], [["all", "All", 5], ["website", "Website", 4], ["logo", "Logo", 2], ["print", "Print", 1]])
        # No social posts, business plan or pitch deck card: no chip. No logo art: no Logo chip.
        self.assertEqual(self.out["sitesOnlyChips"], ["all", "website", "print"])

    def test_all_shows_everything_website_side_first(self):
        self.assertEqual(self.out["order"], ["Bakery", "Polaris", "South River", "Printshop", "ROKCT"])
        self.assertEqual(self.out["all"], ["Bakery:logo", "Polaris:site", "South River:site", "Printshop:site", "ROKCT:site"])
        self.assertTrue(self.out["inFilter"])

    def test_website_hides_logo_only_cards(self):
        self.assertEqual(self.out["website"], ["Polaris:site", "South River:site", "Printshop:site", "ROKCT:site"])

    def test_logo_flips_the_site_with_a_logo_and_brings_in_logo_only(self):
        self.assertEqual(self.out["logo"], ["Bakery:logo", "ROKCT:logo"])

    def test_other_service_keeps_the_usual_side(self):
        self.assertEqual(self.out["print"], ["Printshop:site"])

    def test_query_parameter_maps_to_a_chip_or_all(self):
        self.assertEqual(self.out["param"], ["logo", "logo", "website", "all", "all", "all", "all"])

    def test_home_row_draws_sites_only(self):
        self.assertEqual(self.out["sitesOnly"], ["Polaris", "South River", "Printshop", "ROKCT"])
        home = read(HOME)
        self.assertIn("const showcase = showcaseSitesOnly(entries);", home)
        self.assertIn("const rescue = showcaseSitesOnly(rescueEntries);", home)


LOAD_PROBE = """
import { loadShowcase } from './studio-showcase-load.ts';
const r = loadShowcase('reg', {});
console.log(JSON.stringify(r.sites.map((s) => [s.name, s.website, s.services])));
"""


class TestLoaderKeepsLogoOnlyCards(unittest.TestCase):
    def test_loader(self):
        out = run_node(LOAD_PROBE, {
            "reg/showcase/RokctAI__hosting.json": json.dumps(entry("ROKCT", "RokctAI/hosting", 5, logo_back="rokct")),
            "reg/showcase/RokctAI__bakery.json": json.dumps(logo_only("Bakery", "RokctAI/bakery", 6, logo={"branch": "brand", "light": "l.webp"})),
            "reg/showcase/RokctAI__noart.json": json.dumps(logo_only("NoArt", "RokctAI/noart", 9)),
        })
        self.assertEqual(out, [["Bakery", False, ["logo"]], ["ROKCT", True, ["website", "logo"]]])
        self.assertIn("): { sites: ShowcaseEntry[]; fallback: boolean; rescue: ShowcaseEntry[] } {", read(LOADER))


class TestMenu(unittest.TestCase):
    def test_portfolio_replaces_our_work(self):
        copy = read(COPY)
        nav = copy.split("export const STUDIO_NAV = [", 1)[1].split("] as const;", 1)[0]
        self.assertIn('{ href: "/work", label: "Portfolio" },', nav)
        self.assertNotIn('"Our work"', nav)
        self.assertNotIn('"#work"', nav)
        # The home row's way to /work stays.
        self.assertIn('allWork: "All our work",', read(RULES))
        self.assertIn('export const SHOWCASE_PAGE_HREF = "/work";', read(RULES))

    def test_header_marks_the_current_page(self):
        header = read(HEADER)
        self.assertIn('export function StudioHeader({ base = "", current }: { base?: string; current?: string }) {', header)
        self.assertEqual(header.count('aria-current={n.href === current ? "page" : undefined}'), 2)
        self.assertIn('<StudioHeader base="/" current={SHOWCASE_PAGE_HREF} />', read(WORK))
        css = read(CSS)
        self.assertIn('.st .nav a[aria-current="page"]{', css)
        self.assertIn('.st .mnav a[aria-current="page"]{', css)

    def test_page_is_called_portfolio(self):
        self.assertIn('title: "Portfolio",', read(RULES))


class TestGrid(unittest.TestCase):
    def setUp(self):
        self.client = read(CLIENT)
        self.grid = self.client.split("function LogoFace(", 1)[1]

    def test_flip_is_base_flip_card_driven_by_the_filter(self):
        g = self.grid
        self.assertIn('layout="stack"', g)
        self.assertIn("flipped={flipped}", g)
        self.assertIn("flipped={faceOf(site, filter)}", g)
        self.assertIn('(showcaseFace(site, f) === "logo") !== !!manual[site.repo]', g)
        # A card turned by hand goes back to the filter's side on the next filter.
        choose = g.split("const choose = (next: ShowcaseFilter) => {", 1)[1].split("\n  };", 1)[0]
        self.assertIn("setManual({});", choose)

    def test_chips_are_pressed_buttons_in_a_named_group(self):
        g = self.grid
        self.assertIn('role="group" aria-label={T.filters.label}', g)
        self.assertIn("aria-pressed={c.key === filter}", g)
        self.assertIn('role="status" aria-live="polite"', g)
        self.assertIn("{chips.length > 1 && (", g)

    def test_filter_lives_in_the_address(self):
        g = self.grid
        self.assertIn('export const SHOWCASE_FILTER_PARAM = "service";', read(RULES))
        self.assertIn("new URLSearchParams(window.location.search).get(SHOWCASE_FILTER_PARAM)", g)
        self.assertIn('window.history.replaceState(window.history.state, "", url.toString());', g)

    def test_motion_glides_fades_and_respects_reduced_motion(self):
        g = self.grid
        self.assertIn('const reduce = useMedia("(prefers-reduced-motion: reduce)");', g)
        self.assertIn("el.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: \"none\" }]", g)
        self.assertIn("if (reduce) return; // no glide: it is simply there", g)
        self.assertIn("reduce\n            ? [{ opacity: 1 }, { opacity: 0 }]", g)
        self.assertIn("useIsoLayoutEffect(() => {", g)
        # Leavers stay put, out of the flow, unreachable, while they fade.
        self.assertIn('position: "absolute" as const', g)
        self.assertIn("inert={leaving ? true : undefined}", g)
        css = read(CSS)
        self.assertIn(".st .wk-grid{position:relative}", css)
        self.assertIn(".st .wk-desk,.st .wk-phone,.st button.wk-chip{transition:none}", css)

    def test_lead_card_is_a_class(self):
        css = read(CSS)
        self.assertNotIn(".wk-item:first-child", css)
        self.assertIn(".st .wk-item.wk-lead{grid-column:1/-1;", css)
        self.assertIn('className={`wk-item${lead ? " wk-lead" : ""}', self.grid)

    def test_logo_side_and_no_out_link_without_a_site(self):
        g = self.grid
        self.assertIn("const built = site.logoBack ? backs[site.logoBack] : undefined;", g)
        self.assertIn('className={site.logo.dark ? "th-l" : undefined}', g)
        link = self.client.split("export function ShowcaseExtLink", 1)[1].split("\n}\n", 1)[0]
        self.assertIn("if (!site.url) return null;", link)
        # The link sits beside the FlipCard, never inside it.
        item = g.split("function WorkItem(", 1)[1]
        self.assertLess(item.index("<FlipCard"), item.index("<ShowcaseExtLink"))
        self.assertIn("backs={studioShowcaseBacks()}", read(WORK))

    def test_services_listed_under_each_card(self):
        self.assertIn('<ul className="wk-svc" aria-label={`${site.name}: what we made`}>', self.grid)

    def test_remixicon_only_and_no_inline_svg(self):
        self.assertNotIn("<svg", self.grid)
        self.assertNotIn("lucide", self.client)

    def test_css_braces_balance(self):
        css = re.sub(r"/\*.*?\*/", "", read(CSS), flags=re.S)
        self.assertEqual(css.count("{"), css.count("}"))


class TestVersion(unittest.TestCase):
    def test_version_floor_and_changelog(self):
        manifest = json.loads(read(os.path.join(SDK_ROOT, "manifest.json")))
        self.assertGreaterEqual(tuple(int(p) for p in manifest["version"].split(".")), (1, 14, 0))
        head = read(os.path.join(SDK_ROOT, "CHANGELOG.md")).split("## 1.13.0")[0]
        self.assertIn("## 1.14.0", head)
        self.assertIn("Portfolio", head)


if __name__ == "__main__":
    unittest.main()
