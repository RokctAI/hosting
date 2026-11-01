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

"""hosting_sdk 1.11.0: the portfolio row and /work from a ranked site list.

  * Ray approved the prototype "Phones at rest. Desktop on hover.": a row
    of phones drifting left, one card at a time growing into the desktop
    site at the phones' own height; hover, focus or tap grows a card; the
    ROKCT card turns to its logo back; a Remixicon external-link-line icon
    in the corner opens the live site and never grows or turns the card; a
    card whose picture fails leaves the row.
  * Ray: "sites come from a list, not hard-coded" - the hosting shell's
    showcase/<owner>__<repo>.json files, ranked 1-10 (10 best), ordered by
    rank then name; the home row shows the top N and a "See more" card to
    /work, the whole list as a grid. Invalid files are skipped; a built-in
    list stands in only when the folder gives no site.

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
TEMPLATES = os.path.join(SDK_ROOT, "templates")
STUDIO = os.path.join(TEMPLATES, "components", "custom", "studio")

RULES = os.path.join(STUDIO, "studio-showcase.ts")
LOADER = os.path.join(STUDIO, "studio-showcase-load.ts")
CLIENT = os.path.join(STUDIO, "studio-showcase-client.tsx")
WORK = os.path.join(STUDIO, "studio-work.tsx")
HOME = os.path.join(STUDIO, "studio-home.tsx")
CSS = os.path.join(STUDIO, "studio.css")
HOME_PAGE = os.path.join(TEMPLATES, "app", "page.tsx")
WORK_PAGE = os.path.join(TEMPLATES, "app", "work", "page.tsx")
NEW_FILES = (RULES, LOADER, CLIENT, WORK, WORK_PAGE)

AGPL_TS = "/*\n * Copyright (c) 2026 ROKCT INTELLIGENCE (PTY) LTD\n *\n * This program is free software: you can redistribute it and/or modify\n * it under the terms of the GNU Affero General Public License as published\n * by the Free Software Foundation, version 3."


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def entry(name, repo, rank, **over):
    e = {
        "name": name,
        "kind": "Lender",
        "tagline": "one line",
        "url": "https://example.com",
        "repo": repo,
        "rank": rank,
        "shots": {"branch": "site-shots", "desktop": "shots/abc/desktop-light.webp", "phone": "shots/abc/phone-light.webp"},
        "logo_back": None,
    }
    e.update(over)
    return e


def run_node(script, files):
    """Stages the rules and the loader beside `script` and runs it under
    node's type stripping; returns the parsed JSON it prints. Skips when no
    node with --experimental-strip-types is on PATH."""
    node = shutil.which("node")
    if not node:
        raise unittest.SkipTest("node not on PATH")
    with tempfile.TemporaryDirectory() as tmp:
        shutil.copy(RULES, os.path.join(tmp, "studio-showcase.ts"))
        with open(os.path.join(tmp, "studio-showcase-load.ts"), "w", encoding="utf-8") as f:
            f.write(read(LOADER).replace('from "./studio-showcase";', 'from "./studio-showcase.ts";'))
        for rel, body in files.items():
            path = os.path.join(tmp, rel)
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, "w", encoding="utf-8") as f:
                f.write(body)
        probe = os.path.join(tmp, "probe.mts")
        with open(probe, "w", encoding="utf-8") as f:
            f.write(script)
        run = subprocess.run([node, "--experimental-strip-types", "--no-warnings", probe],
                             capture_output=True, text=True, timeout=60, cwd=tmp)
    if run.returncode != 0 and "strip-types" in run.stderr:
        raise unittest.SkipTest("node has no type stripping")
    if run.returncode != 0:
        raise AssertionError(run.stderr)
    return json.loads(run.stdout.strip().splitlines()[-1])


LOAD_PROBE = """
import { loadShowcase } from './studio-showcase-load.ts';
const out = {};
for (const root of ['full', 'empty', 'missing', 'bad']) {
  const r = loadShowcase(root, {});
  out[root] = { fallback: r.fallback, sites: r.sites };
}
console.log(JSON.stringify(out));
"""


class TestListLoading(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        S = "full/showcase/"
        files = {
            # Valid: two at rank 9 (order by name), one at 8, one with the ROKCT back.
            S + "RokctAI__supacharge-web.json": json.dumps(entry("Supacharge", "RokctAI/supacharge-web", 9, url="https://supacharge.school")),
            S + "RokctAI__polaris-web.json": json.dumps(entry("Polaris", "RokctAI/polaris-web", 8, url="https://polaris-web-nu.vercel.app")),
            S + "RokctAI__hosting.json": json.dumps(entry("ROKCT", "RokctAI/hosting", 9, url="https://hosting-beta-one.vercel.app/", logo_back="rokct")),
            S + "RokctAI__alpha.json": json.dumps(entry("Alpha", "RokctAI/alpha", 1, logo_back="sparkles")),
            S + "RokctAI__nologo.json": json.dumps({k: v for k, v in entry("Zulu", "RokctAI/nologo", 10).items() if k != "logo_back"}),
            # Invalid: each must be skipped, none may throw.
            S + "RokctAI__rank11.json": json.dumps(entry("Rank11", "RokctAI/rank11", 11)),
            S + "RokctAI__rank0.json": json.dumps(entry("Rank0", "RokctAI/rank0", 0)),
            S + "RokctAI__rankstr.json": json.dumps(entry("RankStr", "RokctAI/rankstr", "8")),
            S + "RokctAI__rankfloat.json": json.dumps(entry("RankFloat", "RokctAI/rankfloat", 7.5)),
            S + "RokctAI__http.json": json.dumps(entry("Http", "RokctAI/http", 5, url="http://example.com")),
            S + "RokctAI__js.json": json.dumps(entry("Js", "RokctAI/js", 5, url="javascript:alert(1)")),
            S + "RokctAI__climb.json": json.dumps(entry("Climb", "RokctAI/climb", 5, shots={"branch": "site-shots", "desktop": "../main/secret.webp", "phone": "shots/a/phone-light.webp"})),
            S + "RokctAI__badbranch.json": json.dumps(entry("BadBranch", "RokctAI/badbranch", 5, shots={"branch": "a b", "desktop": "d.webp", "phone": "p.webp"})),
            S + "RokctAI__notimage.json": json.dumps(entry("NotImage", "RokctAI/notimage", 5, shots={"branch": "site-shots", "desktop": "d.html", "phone": "p.webp"})),
            S + "RokctAI__noshots.json": json.dumps({k: v for k, v in entry("NoShots", "RokctAI/noshots", 5).items() if k != "shots"}),
            S + "RokctAI__notagline.json": json.dumps(entry("NoTag", "RokctAI/notagline", 5, tagline="   ")),
            S + "RokctAI__mismatch.json": json.dumps(entry("Mismatch", "RokctAI/other", 5)),
            S + "RokctAI__badrepo.json": json.dumps(entry("BadRepo", "not a repo", 5)),
            S + "RokctAI__array.json": "[1, 2, 3]",
            S + "RokctAI__broken.json": "{\"name\": ",
            S + "wrong-name.json": json.dumps(entry("WrongName", "RokctAI/wrong-name", 5)),
            S + "README.md": "# not a site",
            # The same repo twice: the first file in name order is kept.
            S + "rokctai__polaris-web.json": json.dumps(entry("Polaris Copy", "RokctAI/polaris-web", 10)),
            "empty/showcase/.gitkeep": "",
            "bad/showcase/RokctAI__x.json": "not json",
        }
        cls.out = run_node(LOAD_PROBE, files)

    def test_valid_files_load_ranked_then_by_name(self):
        full = self.out["full"]
        self.assertFalse(full["fallback"])
        names = [s["name"] for s in full["sites"]]
        self.assertEqual(names, ["Zulu", "ROKCT", "Supacharge", "Polaris", "Alpha"])

    def test_every_invalid_file_is_skipped(self):
        names = {s["name"] for s in self.out["full"]["sites"]}
        for bad in ("Rank11", "Rank0", "RankStr", "RankFloat", "Http", "Js", "Climb", "BadBranch", "NotImage",
                    "NoShots", "NoTag", "Mismatch", "BadRepo", "WrongName", "Polaris Copy"):
            self.assertNotIn(bad, names, bad)

    def test_pictures_resolve_on_the_shots_branch(self):
        polaris = next(s for s in self.out["full"]["sites"] if s["name"] == "Polaris")
        self.assertEqual(polaris["phone"], "https://raw.githubusercontent.com/RokctAI/polaris-web/site-shots/shots/abc/phone-light.webp")
        self.assertEqual(polaris["desktop"], "https://raw.githubusercontent.com/RokctAI/polaris-web/site-shots/shots/abc/desktop-light.webp")
        self.assertEqual(polaris["url"], "https://polaris-web-nu.vercel.app")
        rokct = next(s for s in self.out["full"]["sites"] if s["name"] == "ROKCT")
        self.assertEqual(rokct["url"], "https://hosting-beta-one.vercel.app")

    def test_only_rokct_maps_to_a_logo_back(self):
        backs = {s["name"]: s["logoBack"] for s in self.out["full"]["sites"]}
        self.assertEqual(backs["ROKCT"], "rokct")
        self.assertIsNone(backs["Alpha"])  # unknown value: no flip
        self.assertIsNone(backs["Zulu"])  # missing: no flip
        self.assertIsNone(backs["Polaris"])  # null: no flip

    def test_fallback_only_when_the_folder_gives_no_site(self):
        for root in ("empty", "missing", "bad"):
            r = self.out[root]
            self.assertTrue(r["fallback"], root)
            self.assertEqual([s["name"] for s in r["sites"]], ["ROKCT", "Polaris", "Supacharge"], root)
            urls = {s["name"]: s["url"] for s in r["sites"]}
            self.assertEqual(urls, {
                "ROKCT": "https://hosting-beta-one.vercel.app",
                "Polaris": "https://polaris-web-nu.vercel.app",
                "Supacharge": "https://supacharge.school",
            })

    def test_fallback_pictures_are_studio_shot_routes(self):
        shots = read(os.path.join(STUDIO, "studio-shots.ts"))
        for s in self.out["empty"]["sites"]:
            for key in ("phone", "desktop"):
                m = re.fullmatch(r"/studio/shots/(studio|polaris|supacharge)/((?:phone|desktop)-light\.webp)", s[key])
                self.assertTrue(m, s[key])
                self.assertIn(f"{m.group(1)}: {{ repo:", shots)
        self.assertIn('const WORK: SiteShotFile[] = ["desktop-light.webp", "desktop-dark.webp", "phone-light.webp", "phone-dark.webp"];', shots)

    def test_loader_reads_the_shell_folder_and_never_throws(self):
        src = read(LOADER)
        self.assertIn("  root: string = process.cwd(),\n  env: Record<string, string | undefined> = process.env,", src)
        self.assertIn("join(root, SHOWCASE_DIR)", src)
        self.assertIn('export const SHOWCASE_DIR = "showcase";', read(RULES))
        self.assertNotIn("throw ", src)
        self.assertNotIn("throw ", read(RULES))


OWN_PROBE = """
import { loadShowcase } from './studio-showcase-load.ts';
import { showcaseOwnRepo, showcaseIsHost } from './studio-showcase.ts';
const own = (r) => r.sites.filter((s) => s.own).map((s) => s.repo);
console.log(JSON.stringify({
  explicit: own(loadShowcase('ranked', { STUDIO_SITE_REPO: 'RokctAI/hosting' })),
  shots: own(loadShowcase('ranked', { SITE_SHOTS_REPO: 'rokctai/HOSTING' })),
  vercel: own(loadShowcase('ranked', { VERCEL_GIT_REPO_OWNER: 'RokctAI', VERCEL_GIT_REPO_SLUG: 'hosting' })),
  renamed: own(loadShowcase('renamed', { VERCEL_GIT_REPO_OWNER: 'RokctAI', VERCEL_GIT_REPO_SLUG: 'studio-web' })),
  none: own(loadShowcase('ranked', {})),
  other: own(loadShowcase('ranked', { STUDIO_SITE_REPO: 'RokctAI/elsewhere' })),
  fallback: own(loadShowcase('missing', { SITE_SHOTS_REPO: 'RokctAI/hosting' })),
  order: loadShowcase('ranked', {}).sites.map((s) => s.repo),
  bad: showcaseOwnRepo({ STUDIO_SITE_REPO: 'not a repo' }),
  explicitWins: showcaseOwnRepo({ STUDIO_SITE_REPO: 'A/b', SITE_SHOTS_REPO: 'C/d' }),
  host: [showcaseIsHost('https://hosting-beta-one.vercel.app', 'hosting-beta-one.vercel.app'),
         showcaseIsHost('https://polaris-web-nu.vercel.app', 'hosting-beta-one.vercel.app'),
         showcaseIsHost('https://x.example', null)],
}));
"""


class TestOwnSiteHasNoOutLink(unittest.TestCase):
    """Ray: the card for the site the visitor is already on shows no
    out-link. Which one is config (STUDIO_SITE_REPO, else SITE_SHOTS_REPO,
    else the repo Vercel built from), never a hard-coded repo; hosting's
    rank is 5, so it is not first."""

    @classmethod
    def setUpClass(cls):
        cls.out = run_node(OWN_PROBE, {
            "ranked/showcase/RokctAI__hosting.json": json.dumps(entry("ROKCT", "RokctAI/hosting", 5, logo_back="rokct")),
            "ranked/showcase/RokctAI__polaris-web.json": json.dumps(entry("Polaris", "RokctAI/polaris-web", 8)),
            "ranked/showcase/RokctAI__supacharge-web.json": json.dumps(entry("Supacharge", "RokctAI/supacharge-web", 9)),
            "renamed/showcase/RokctAI__studio-web.json": json.dumps(entry("ROKCT", "RokctAI/studio-web", 5)),
            "renamed/showcase/RokctAI__polaris-web.json": json.dumps(entry("Polaris", "RokctAI/polaris-web", 8)),
        })

    def test_own_repo_from_config(self):
        o = self.out
        self.assertEqual(o["explicit"], ["RokctAI/hosting"])
        self.assertEqual(o["shots"], ["RokctAI/hosting"])
        self.assertEqual(o["vercel"], ["RokctAI/hosting"])
        self.assertEqual(o["renamed"], ["RokctAI/studio-web"])
        self.assertEqual(o["none"], [])
        self.assertEqual(o["other"], [])
        self.assertEqual(o["fallback"], ["RokctAI/hosting"])
        self.assertIsNone(o["bad"])
        self.assertEqual(o["explicitWins"], "A/b")
        self.assertEqual(o["host"], [True, False, False])

    def test_hosting_at_rank_five_is_not_first(self):
        self.assertEqual(self.out["order"], ["RokctAI/supacharge-web", "RokctAI/polaris-web", "RokctAI/hosting"])

    def test_link_is_not_drawn_for_the_own_site(self):
        client = read(CLIENT)
        link = client.split("export function ShowcaseExtLink", 1)[1].split("\n}\n", 1)[0]
        self.assertIn("if (site.own || showcaseIsHost(site.url, host)) return null;", link)
        self.assertIn("useEffect(() => setHost(window.location.host), []);", client)
        self.assertIn("const own = showcaseOwnRepo(env);", read(LOADER))
        self.assertIn("sites: markOwnSite(out.sites, own),", read(LOADER))
        # No hosting repo is hard-coded in the rule.
        rule = read(RULES).split("export function showcaseOwnRepo", 1)[1].split("\n}\n", 1)[0]
        self.assertNotIn("RokctAI", rule)
        self.assertNotIn("hosting", rule)


class TestPictureRule(unittest.TestCase):
    """A site is shown only once both pictures load; a failed one leaves."""

    def test_visible_rule_runs(self):
        out = run_node("""
import { visibleShowcase } from './studio-showcase.ts';
const s = [{ repo: 'a' }, { repo: 'b' }, { repo: 'c' }];
console.log(JSON.stringify({
  before: visibleShowcase(s, {}, false).map((x) => x.repo),
  beforeFail: visibleShowcase(s, { b: 'fail' }, false).map((x) => x.repo),
  after: visibleShowcase(s, { a: 'ok', b: 'fail', c: 'pending' }, true).map((x) => x.repo),
  allFail: visibleShowcase(s, { a: 'fail', b: 'fail', c: 'fail' }, true).map((x) => x.repo),
}));
""", {})
        self.assertEqual(out["before"], ["a", "b", "c"])
        self.assertEqual(out["beforeFail"], ["a", "c"])
        self.assertEqual(out["after"], ["a"])
        self.assertEqual(out["allFail"], [])

    def test_both_pictures_are_probed_and_errors_remove_the_site(self):
        client = read(CLIENT)
        self.assertIn("Promise.all([probe(s.phone), probe(s.desktop)])", client)
        self.assertIn('oks.every(Boolean) ? "ok" : "fail"', client)
        self.assertIn("im.onerror = () => resolve(false);", client)
        self.assertIn("resolve(im.naturalWidth > 0)", client)
        # An <img> that errors later also takes its site out, row and grid.
        self.assertGreaterEqual(client.count("onError={"), 4)
        self.assertEqual(client.count("const shown = visibleShowcase(list, status, ready);"), 1)
        self.assertEqual(client.count("useShowcaseList(sites, rescue)"), 2)



class TestSeeMoreCount(unittest.TestCase):
    """1.12.0: "All N sites" on the See more card counts only the cards
    that are actually shown; a site whose pictures 404 is not counted."""

    def test_count_drops_the_failed_cards(self):
        out = run_node("""
import { showcaseMoreCount } from './studio-showcase.ts';
console.log(JSON.stringify({
  allShown: showcaseMoreCount(6, 6, 6, false, 3),
  oneDropped: showcaseMoreCount(6, 6, 5, false, 3),
  longListOneDropped: showcaseMoreCount(9, 6, 5, false, 3),
  rescued: showcaseMoreCount(6, 3, 3, true, 3),
  rescuedOneDropped: showcaseMoreCount(6, 3, 2, true, 3),
  allDroppedNoRescue: showcaseMoreCount(6, 6, 0, false, 0),
}));
""", {})
        self.assertEqual(out["allShown"], 6)
        self.assertEqual(out["oneDropped"], 5)  # was "All 6" while 5 render
        self.assertEqual(out["longListOneDropped"], 8)
        self.assertEqual(out["rescued"], 3)
        self.assertEqual(out["rescuedOneDropped"], 3)
        self.assertEqual(out["allDroppedNoRescue"], 0)

    def test_row_uses_the_rule(self):
        client = read(CLIENT)
        self.assertIn("const total = showcaseMoreCount(givenTotal, list.length, shown.length, rescued, rescue.length);", client)
        self.assertNotIn("const total = rescued ? rescue.length : givenTotal;", client)

RESCUE_PROBE = """
import { loadShowcase } from './studio-showcase-load.ts';
import { showcasePhase, showcaseRescueList, showcaseIsLocal, STUDIO_SHOWCASE_FALLBACK } from './studio-showcase.ts';
const names = (l) => l.map((s) => s.name);
const remote = STUDIO_SHOWCASE_FALLBACK.map((s, i) => i === 1 ? { ...s, phone: 'https://raw.githubusercontent.com/RokctAI/polaris-web/site-shots/p.webp' } : s);
const proto = STUDIO_SHOWCASE_FALLBACK.map((s, i) => i === 2 ? { ...s, desktop: '//cdn.example/d.webp' } : s);
const reg = loadShowcase('reg', { SITE_SHOTS_REPO: 'RokctAI/hosting' });
const none = loadShowcase('missing', {});
console.log(JSON.stringify({
  phase: {
    checking: showcasePhase(0, false, false, 3),
    someLeft: showcasePhase(2, true, false, 3),
    allDropped: showcasePhase(0, true, false, 3),
    rescueShowing: showcasePhase(3, true, true, 3),
    rescueDropped: showcasePhase(0, true, true, 3),
    noRescue: showcasePhase(0, true, false, 0),
  },
  local: [showcaseIsLocal('/studio/shots/studio/phone-light.webp'), showcaseIsLocal('https://x/y.webp'),
          showcaseIsLocal('//x/y.webp'), showcaseIsLocal(''), showcaseIsLocal(null)],
  bundled: names(showcaseRescueList(false)),
  alreadyFallback: names(showcaseRescueList(true)),
  remotePicture: names(showcaseRescueList(false, remote)),
  protocolRelative: names(showcaseRescueList(false, proto)),
  empty: names(showcaseRescueList(false, [])),
  reg: { fallback: reg.fallback, sites: names(reg.sites), rescue: names(reg.rescue),
         own: reg.rescue.filter((s) => s.own).map((s) => s.repo) },
  none: { fallback: none.fallback, rescue: names(none.rescue) },
}));
"""


class TestAllDroppedAtRuntime(unittest.TestCase):
    """Gatekeeper, hardware#60: the folder gave sites, but every card's
    pictures fail in the browser (say a site's latest/ shots are not there
    yet). The row and /work must not end empty: the built-in list stands in
    when its pictures are bundled; otherwise the whole section hides, with
    no empty frame and no dangling See more."""

    @classmethod
    def setUpClass(cls):
        cls.out = run_node(RESCUE_PROBE, {
            "reg/showcase/RokctAI__alpha.json": json.dumps(entry("Alpha", "RokctAI/alpha", 7)),
            "reg/showcase/RokctAI__beta.json": json.dumps(entry("Beta", "RokctAI/beta", 6)),
        })

    def test_phase_rescues_once_then_hides(self):
        self.assertEqual(self.out["phase"], {
            "checking": "show",
            "someLeft": "show",
            "allDropped": "rescue",
            "rescueShowing": "show",
            "rescueDropped": "gone",
            "noRescue": "gone",
        })

    def test_stand_in_only_when_its_pictures_are_bundled(self):
        o = self.out
        self.assertEqual(o["local"], [True, False, False, False, False])
        self.assertEqual(o["bundled"], ["ROKCT", "Polaris", "Supacharge"])
        self.assertEqual(o["alreadyFallback"], [])
        self.assertEqual(o["remotePicture"], [])
        self.assertEqual(o["protocolRelative"], [])
        self.assertEqual(o["empty"], [])

    def test_loader_hands_the_stand_in_to_the_browser(self):
        o = self.out
        self.assertEqual(o["reg"]["fallback"], False)
        self.assertEqual(o["reg"]["sites"], ["Alpha", "Beta"])
        self.assertEqual(o["reg"]["rescue"], ["ROKCT", "Polaris", "Supacharge"])
        self.assertEqual(o["reg"]["own"], ["RokctAI/hosting"])
        # Already showing the built-in list: nothing further to fall back to.
        self.assertEqual(o["none"], {"fallback": True, "rescue": []})

    def test_row_and_grid_swap_then_hide_the_section(self):
        client = read(CLIENT)
        hook = client.split("function useShowcaseList(", 1)[1].split("\n}\n", 1)[0]
        self.assertIn("const list = rescued ? rescue : sites;", hook)
        self.assertIn('if (phase === "rescue") setRescued(true);', hook)
        self.assertIn("report?.(gone, ready ? shown.length : null);", hook)
        # A new list starts unchecked (the stand-in shares repos with the folder).
        self.assertIn("const cur: St = st.key === key ? st : { key, status: {}, ready: false };", client)
        section = client.split("export function StudioShowcaseSection(", 1)[1].split("\n}\n", 1)[0]
        self.assertIn('<section {...rest} data-showcase="" hidden={gone || undefined}>', section)
        # 1.12.0: the stand-in counts itself, through showcaseMoreCount.
        self.assertIn("showcaseMoreCount(givenTotal, list.length, shown.length, rescued, rescue.length)", client)
        self.assertIn('<ol className="wk-grid" data-ready={ready ? "true" : undefined} hidden={gone || undefined}>', client)
        css = read(CSS)
        self.assertIn(".st [data-showcase][hidden],.st .wk-grid[hidden]{display:none!important}", css)

    def test_pages_wrap_the_showcase_and_pass_the_stand_in(self):
        home = read(os.path.join(STUDIO, "studio-home.tsx"))
        work_section = home.split('<StudioShowcaseSection className="sec" id="work">', 1)[1].split("</StudioShowcaseSection>", 1)[0]
        # The row - and with it the See more card and the All our work chip - is inside the hiding section.
        self.assertIn("<StudioShowcaseRow", work_section)
        self.assertIn("rescue={rescue.slice(0, SHOWCASE_HOME_COUNT)}", work_section)
        self.assertIn("<SectionHead {...STUDIO_WORK_HEAD} />", work_section)
        self.assertIn("<StudioShowcaseScope>", home)
        self.assertNotIn('<section className="sec" id="work">', home)
        work = read(os.path.join(STUDIO, "studio-work.tsx"))
        self.assertIn("<StudioShowcaseGrid sites={sites} rescue={rescue} />", work)
        self.assertIn('<StudioShowcaseCount className="fine num" initial={sites.length} />', work)
        for page in ("page.tsx", os.path.join("work", "page.tsx")):
            src = read(os.path.join(TEMPLATES, "app", page))
            self.assertIn("const { sites, rescue } = loadShowcase();", src)
            self.assertIn("rescue={rescue}", src)


class TestRowAndPage(unittest.TestCase):
    def test_version_installs_and_changelog(self):
        manifest = json.loads(read(os.path.join(SDK_ROOT, "manifest.json")))
        # 1.12.0 (the floating logos) builds on the row: a floor, not a pin.
        self.assertGreaterEqual(tuple(int(p) for p in manifest["version"].split(".")), (1, 11, 0))
        self.assertIn("## 1.11.0", read(os.path.join(SDK_ROOT, "CHANGELOG.md")).split("## 1.10.0")[0])
        installs = {e["from"]: e["to"] for e in manifest["app_type"]["hosting"]["installs"]}
        for f in ("studio-showcase.ts", "studio-showcase-load.ts", "studio-showcase-client.tsx", "studio-work.tsx"):
            self.assertEqual(installs.get(f"templates/components/custom/studio/{f}"), f"components/custom/studio/{f}")
        self.assertEqual(installs.get("templates/app/work/page.tsx"), "app/work/page.tsx")
        self.assertIn("@remixicon/react", manifest["app_type"]["hosting"]["dependencies"])

    def test_new_files_carry_the_agpl_header(self):
        for path in NEW_FILES:
            self.assertTrue(read(path).startswith(AGPL_TS), path)

    def test_home_shows_the_top_six_then_see_more(self):
        rules = read(RULES)
        self.assertIn("export const SHOWCASE_HOME_COUNT = 6;", rules)
        self.assertIn('export const SHOWCASE_PAGE_HREF = "/work";', rules)
        home = read(HOME)
        self.assertIn("sites={showcase.slice(0, SHOWCASE_HOME_COUNT)}", home)
        self.assertIn("moreHref={SHOWCASE_PAGE_HREF}", home)
        self.assertNotIn("StudioWorkTabs", home)
        self.assertNotIn("StudioWorkTabs", read(os.path.join(STUDIO, "studio-client.tsx")))
        client = read(CLIENT)
        # The See more card closes every set of the row.
        self.assertIn("{ more: true as const }]", client)
        self.assertIn('<a className="sr-more-in" href={moreHref} tabIndex={interactive ? undefined : -1}>', client)
        page = read(HOME_PAGE)
        self.assertIn("const { sites, rescue } = loadShowcase();", page)
        self.assertIn("showcase={sites}", page)

    def test_work_page_is_the_whole_ranked_list(self):
        page = read(WORK_PAGE)
        self.assertIn("const { sites, rescue } = loadShowcase();", page)
        self.assertIn("<StudioWork fontClassName={studioFontClassName} sites={sites} rescue={rescue} />", page)
        work = read(WORK)
        self.assertIn("<StudioShowcaseGrid sites={sites} rescue={rescue} />", work)
        self.assertIn('<StudioHeader base="/" />', work)
        self.assertIn("<StudioFooter />", work)
        client = read(CLIENT).split("export function StudioShowcaseGrid", 1)[1]
        for needle in ("{site.name}", "{site.kind}", "{site.tagline}", "site.desktop", "site.phone", "<ShowcaseExtLink"):
            self.assertIn(needle, client, needle)
        self.assertIn('href={`${base}${n.href}`}', read(os.path.join(STUDIO, "studio-client.tsx")))

    def test_external_link_opens_a_new_tab_safely(self):
        client = read(CLIENT)
        link = client.split("export function ShowcaseExtLink", 1)[1].split("\n}\n", 1)[0]
        self.assertIn('target="_blank"', link)
        self.assertRegex(link, r'rel="noopener( noreferrer)?"')
        self.assertIn("href={site.url}", link)
        self.assertIn("aria-label={T.open(site.name)}", link)
        self.assertIn("<RiExternalLinkLine", link)
        # Every target=_blank in the new files carries noopener.
        for path in NEW_FILES:
            src = read(path)
            for m in re.finditer(r"<a\b[^>]*>", src, re.S):
                if 'target="_blank"' in m.group(0):
                    self.assertIn("noopener", m.group(0), path)

    def test_the_link_never_grows_or_turns_the_card(self):
        client = read(CLIENT)
        card = client.split("function Card(", 1)[1].split("\nconst sleep", 1)[0]
        # The link is the FlipCard's sibling, not inside it, so a click on it cannot turn the card.
        self.assertLess(card.index("</FlipCard>") if "</FlipCard>" in card else card.index("/>\n      ) : ("), card.index("<ShowcaseExtLink"))
        # Pointing, clicking and focusing on it are ignored by the row.
        self.assertIn('const onExt = (t: EventTarget | null) => t instanceof Element && !!t.closest(".sr-ext");', client)
        for handler in ("const onPointerOver", "const onRailClick", "const onRailFocus", "const onMClick"):
            body = client.split(handler, 1)[1].split("\n  };", 1)[0]
            self.assertIn("onExt(e.target)", body, handler)

    def test_remixicon_only(self):
        for path in (CLIENT, WORK, RULES, LOADER, WORK_PAGE):
            src = read(path)
            self.assertNotIn("lucide", src, path)
            self.assertNotIn("@radix-ui/react-icons", src, path)
            self.assertNotIn("<svg", src, path)
            for m in re.finditer(r'from "([^"]*icon[^"]*)"', src, re.I):
                self.assertEqual(m.group(1), "@remixicon/react", path)
        client = read(CLIENT)
        self.assertIn('import { RiArrowRightLine, RiExternalLinkLine, RiPauseLine, RiPlayLine, RiRepeat2Line } from "@remixicon/react";', client)

    def test_flip_is_base_flip_card_and_only_for_a_known_back(self):
        client = read(CLIENT)
        # 1.12.0 also reads the turn's length (base_sdk >= 1.58.0) to lift as it ends.
        self.assertIn('import { FLIP_DURATION_MS, FlipCard } from "@/components/custom/flip-card";', client)
        self.assertIn('layout="fill"', client)
        self.assertIn("flipped={flipped}", client)
        self.assertIn("const body = site.logoBack ? backs[site.logoBack] : undefined;", client)
        home = read(HOME)
        # 1.12.0: the back is the floating logos (test_studio_floating_logo.py).
        self.assertIn("return { rokct: <ShowcaseLiftBack m={STUDIO_MARKS_ROKCT} /> };", home)
        self.assertIn('export const SHOWCASE_LOGO_BACKS: readonly ShowcaseLogoBack[] = ["rokct"];', read(RULES))

    def test_grown_card_keeps_the_phone_height(self):
        css = read(CSS)
        self.assertIn("--ph:calc((var(--pw) - 8px) * 1149 / 560 + 8px);\n  --dh:var(--ph);", css)
        self.assertIn("--dw:calc((var(--ph) - 34px) * 1200 / 833 + 8px);", css)
        self.assertIn(".st .sr-card.big{width:var(--dw);height:var(--dh);z-index:2}", css)
        # Thin 4px phone frames.
        self.assertIn("border-radius:26px;padding:4px;", css.split(".st .sr-dev{", 1)[1].split("}", 1)[0])

    def test_motion_rules(self):
        client = read(CLIENT)
        self.assertIn('useMedia("(prefers-reduced-motion: reduce)")', client)
        self.assertIn("const motionOK = () => !r.current.reduce && !r.current.paused && !r.current.mobile;", client)
        self.assertIn("aria-pressed={paused}", client)
        self.assertIn("document.hidden", client)
        css = read(CSS)
        self.assertIn(".st .sr-card,.st .sr-dev,.st .sr-screen,.st .sr-rail", css)
        # Phones: a native swipe row.
        phones = css.split("@media (max-width:699.98px){\n.st .sr-stage", 1)[1].split("\n}\n", 1)[0]
        self.assertIn("overflow-x:auto", phones)
        self.assertIn("scroll-snap-type:x mandatory", phones)
        self.assertIn(".st .sr-m .sr-card{scroll-snap-align:start}", phones)

    def test_studio_css_braces_balance(self):
        css = re.sub(r"/\*.*?\*/", "", read(CSS), flags=re.S)
        depth = 0
        for ch in css:
            depth += (ch == "{") - (ch == "}")
            self.assertGreaterEqual(depth, 0)
        self.assertEqual(depth, 0)

    def test_pictures_are_plain_img(self):
        for path in (CLIENT, WORK):
            self.assertNotIn("next/image", read(path), path)


if __name__ == "__main__":
    unittest.main()
