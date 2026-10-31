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



"""hosting_sdk 1.6.0: live site shots on the studio page (Ray, 2026-10-31:
each client site's pictures come from that site's latest good build, served
by the site itself). The picked "How we design" option and the "Our work"
and hero proofs load /studio/shots/<site>/<file>, a route that reads the
client's live <origin>/site-shots/ (base_sdk >= 1.55.0), keeps the last good
picture, and before there is one serves the committed thumbnail.

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
HOME = os.path.join(STUDIO, "studio-home.tsx")
COPY = os.path.join(STUDIO, "studio-copy.ts")
SHOTS = os.path.join(STUDIO, "studio-shots.ts")
CSS = os.path.join(STUDIO, "studio.css")
ROUTE = os.path.join(TEMPLATES, "app", "studio", "shots", "[site]", "[file]", "route.ts")
MANIFEST = os.path.join(SDK_ROOT, "manifest.json")


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def base_sdk_root():
    return os.environ.get("ROKCT_BASE_SDK") or os.path.abspath(
        os.path.join(SDK_ROOT, os.pardir, os.pardir, os.pardir, "core", "base", "nextjs"))


class TestStudioShotsWiring(unittest.TestCase):
    def test_version_installs_and_requires(self):
        manifest = json.loads(read(MANIFEST))
        self.assertEqual(manifest["version"], "1.6.0")
        hosting = manifest["app_type"]["hosting"]
        installs = {e["from"]: e["to"] for e in hosting["installs"]}
        self.assertEqual(installs["templates/components/custom/studio/studio-shots.ts"],
                         "components/custom/studio/studio-shots.ts")
        self.assertEqual(installs["templates/app/studio/shots"], "app/studio/shots")
        # base_sdk >= 1.54.0 (site credit) and >= 1.55.0 (site-shots rules).
        for path in ("components/custom/site-credit.tsx",
                     "components/custom/landing/site-credit.ts",
                     "components/custom/landing/site-shots.ts"):
            self.assertIn(path, hosting["requires"], path)
            self.assertIn(path, manifest["_comment"], path)
        self.assertIn("base_sdk >= 1.55.0", manifest["_comment"]["components/custom/landing/site-shots.ts"])

    def test_changelog(self):
        head = read(os.path.join(SDK_ROOT, "CHANGELOG.md")).split("## 1.5.2")[0]
        self.assertIn("## 1.6.0", head)
        self.assertIn("/site-shots/", head)

    def test_route_is_static_and_keeps_the_last_good_picture(self):
        route = read(ROUTE)
        self.assertTrue(route.lstrip().startswith("/*"), "licence header first")
        for needle in (
            "export const revalidate = 3600;",
            "export const dynamicParams = false;",
            "export function generateStaticParams() {\n  return studioShotParams();\n}",
            "params: Promise<{ site: string; file: string }>",
            "const { site, file } = await params;",
            'from "@/components/custom/landing/site-shots";',
            "parseSiteShotsManifest(JSON.parse(new TextDecoder().decode(raw)), STUDIO_SHOT_SITES[site].repo)",
            "checkSiteShot(file, await readFrom(origin, file), parsed.value)",
            "next: { revalidate: SITE_SHOTS_REVALIDATE_SECONDS },",
            'if (process.env.NEXT_PHASE === "phase-production-build") {',
            "return committed(site, file);",
            "throw error;",
            "if (!origin) return committed(site, file);",
            'path.join(process.cwd(), "public", src)',
        ):
            self.assertIn(needle, route, needle)
        # The client's own site is asked, never GitHub.
        self.assertNotIn("raw.githubusercontent", route)
        self.assertIn("`${origin}/site-shots/${name}`", route)

    def test_only_the_picked_option_and_the_work_go_live(self):
        home = read(HOME)
        self.assertIn('import { isStudioShotSite, studioShotSrc, type StudioShotSiteId } from "./studio-shots";', home)
        self.assertIn("const live = on && isStudioShotSite(c.id) ? c.id : null;", home)
        self.assertIn('src={live ? studioShotSrc(live, "option-light.webp") : studioDesignImage(c.id, o, "light")}', home)
        self.assertIn('src={live ? studioShotSrc(live, "option-dark.webp") : studioDesignImage(c.id, o, "dark")}', home)
        self.assertIn('<DeskProof\n                site="polaris"', home)
        self.assertIn('<PhoneProof\n                site="supacharge"', home)
        self.assertIn("<DeskProof site={c.site}", home)
        self.assertIn("<PhoneProof site={c.site}", home)
        self.assertNotIn("STUDIO_IMAGES", home)
        css = read(CSS)
        for rule in (".st .shot .th-d{display:none}", ".dark .st .shot .th-l{display:none}",
                     ".dark .st .shot .th-d{display:inline}"):
            self.assertIn(rule, css)
        copy = read(COPY)
        self.assertEqual(copy.count('    site: "polaris",'), 1)
        self.assertEqual(copy.count('    site: "supacharge",'), 1)

    def test_footer_rule_untouched(self):
        home = read(HOME)
        self.assertIn('<SiteCredit as="span" siteName={STUDIO_FOOTER.siteName} /> · {STUDIO_FOOTER.prices}', home)

    def test_shots_rules_run(self):
        """Executes studio-shots.ts with base_sdk's site-shots rules (skips
        when no base_sdk >= 1.55.0 checkout is reachable; set ROKCT_BASE_SDK
        to its nextjs root)."""
        rules = os.path.join(base_sdk_root(), "templates", "components", "custom", "landing", "site-shots.ts")
        node = shutil.which("node")
        if not os.path.isfile(rules) or not node:
            raise unittest.SkipTest("base_sdk >= 1.55.0 site-shots.ts or node not reachable")
        with tempfile.TemporaryDirectory() as tmp:
            shutil.copy(rules, os.path.join(tmp, "site-shots.ts"))
            shutil.copy(COPY, os.path.join(tmp, "studio-copy.ts"))
            staged = read(SHOTS).replace('"@/components/custom/landing/site-shots"', '"./site-shots.ts"').replace(
                '"./studio-copy"', '"./studio-copy.ts"')
            with open(os.path.join(tmp, "studio-shots.ts"), "w", encoding="utf-8") as f:
                f.write(staged)
            probe = os.path.join(tmp, "probe.mts")
            with open(probe, "w", encoding="utf-8") as f:
                f.write(
                    "import * as s from './studio-shots.ts';\n"
                    "const params = s.studioShotParams();\n"
                    "const out = {\n"
                    "  params: params.map((p) => `${p.site}/${p.file}`),\n"
                    "  fallbacks: Object.fromEntries(params.map((p) => [`${p.site}/${p.file}`, s.studioShotFallback(p.site, p.file)])),\n"
                    "  originDefault: s.resolveStudioShotOrigin('supacharge', {}),\n"
                    "  originNone: s.resolveStudioShotOrigin('polaris', {}),\n"
                    "  originEnv: s.resolveStudioShotOrigin('polaris', { STUDIO_SHOTS_ORIGIN_POLARIS: 'https://polaris.example/x/' }),\n"
                    "  originOff: s.resolveStudioShotOrigin('supacharge', { STUDIO_SHOTS_ORIGIN_SUPACHARGE: 'off' }),\n"
                    "  originBad: s.resolveStudioShotOrigin('supacharge', { STUDIO_SHOTS_ORIGIN_SUPACHARGE: 'javascript:alert(1)' }),\n"
                    "  src: s.studioShotSrc('studio', 'option-dark.webp'),\n"
                    "  notUsed: s.studioShotFallback('southriver', 'desktop-light.webp'),\n"
                    "};\n"
                    "console.log(JSON.stringify(out));\n")
            run = subprocess.run([node, "--experimental-strip-types", "--no-warnings", probe],
                                 capture_output=True, text=True, timeout=60, cwd=tmp)
        self.assertEqual(run.returncode, 0, run.stderr)
        out = json.loads(run.stdout)
        self.assertEqual(len(out["params"]), 16)
        self.assertEqual(out["originDefault"], "https://supacharge.school")
        self.assertIsNone(out["originNone"])
        self.assertEqual(out["originEnv"], "https://polaris.example")
        self.assertIsNone(out["originOff"])
        self.assertIsNone(out["originBad"])
        self.assertEqual(out["src"], "/studio/shots/studio/option-dark.webp")
        self.assertIsNone(out["notUsed"])
        # Every fallback is the picked option's committed thumbnail or the
        # committed work proof, and the file is shipped.
        self.assertEqual(out["fallbacks"]["supacharge/option-light.webp"], "/studio/process/supacharge-c-light.webp")
        self.assertEqual(out["fallbacks"]["studio/option-dark.webp"], "/studio/process/studio-c-dark.webp")
        self.assertEqual(out["fallbacks"]["polaris/desktop-dark.webp"], "/studio/work/polaris-desktop.webp")
        self.assertEqual(out["fallbacks"]["supacharge/phone-light.webp"], "/studio/work/supacharge-phone.webp")
        for key, src in out["fallbacks"].items():
            self.assertIsNotNone(src, key)
            self.assertTrue(os.path.isfile(os.path.join(TEMPLATES, "public", src.lstrip("/"))), src)


if __name__ == "__main__":
    unittest.main()
