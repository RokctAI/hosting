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

"""hosting_sdk 1.10.0: the ROKCT card flips to a sketch sheet and the final.

  * Ray: "studio showcase can flip as it has logo and im seeing polaris
    and still its not how i wanted" / "you know that thing we do with logo
    where you get 4 logos and you choose one, we can even mock a brief".
  * Ray, on the first render: "4 logos all drawn by hand on a plane divided
    by 4 like a cross. Then on the side a selected logo no longer hand
    drawn". The ROKCT card leads the row and flips to one sketch sheet (a
    hand-ruled cross, four pencil sketches, all SVG) and beside it the
    picked mark as the clean final file.
  * Phone frames are thinner everywhere (Ray).
  * Polaris no longer flips and its logo files are gone.
  * The picked mark is the real ROKCT file, verbatim.

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
LOGO = os.path.join(TEMPLATES, "public", "studio", "logo")


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


COPY = read(os.path.join(STUDIO, "studio-copy.ts"))
HOME = read(os.path.join(STUDIO, "studio-home.tsx"))
CSS = read(os.path.join(STUDIO, "studio.css"))
SHOTS = read(os.path.join(STUDIO, "studio-shots.ts"))
SKETCH = read(os.path.join(STUDIO, "studio-sketch.tsx"))


def case_block(site):
    cases = COPY.split("export const STUDIO_CASES", 1)[1].split("\n];", 1)[0]
    m = re.search(r'\n  \{\n    site: "' + site + r'",(.*?)\n  \},', cases, re.S)
    return m.group(1) if m else None


class TestRokctCard(unittest.TestCase):
    def test_version(self):
        manifest = json.loads(read(os.path.join(SDK_ROOT, "manifest.json")))
        self.assertEqual(manifest["version"], "1.10.0")
        head = read(os.path.join(SDK_ROOT, "CHANGELOG.md")).split("## 1.8.0")[0]
        self.assertIn("## 1.10.0", head)

    def test_rokct_leads_the_row_and_carries_the_marks(self):
        cases = COPY.split("export const STUDIO_CASES", 1)[1]
        self.assertLess(cases.index('site: "studio"'), cases.index('site: "polaris"'))
        self.assertIn("marks: STUDIO_MARKS_ROKCT,", case_block("studio"))

    def test_polaris_does_not_flip(self):
        block = case_block("polaris")
        self.assertIn("logo: [],", block)
        self.assertNotIn("marks:", block)
        self.assertFalse([f for f in os.listdir(LOGO) if f.startswith("polaris")])

    def test_four_options_one_picked_and_the_final_is_real(self):
        marks = COPY.split("export const STUDIO_MARKS_ROKCT", 1)[1].split("\n};", 1)[0]
        self.assertEqual(re.findall(r'key: "([a-d])"', marks), ["a", "b", "c", "d"])
        self.assertIn('chosen: "c"', marks)
        self.assertIn('final: { src: "/studio/logo/rokct-r.svg"', marks)
        r = read(os.path.join(LOGO, "rokct-r.svg"))
        self.assertIn('viewBox="-185 -218 2224 2622"', r)
        # The sketch of C traces the real file's own outline.
        path = re.search(r'ROKCT_R_PATH =\s*"([^"]+)"', SKETCH).group(1)
        self.assertIn(f'd="{path}"', r)
        self.assertIn("d={ROKCT_R_PATH}", SKETCH)
        self.assertIn("A, B and D were sketched for this page", COPY)
        self.assertIn("Example brief", COPY)

    def test_sheet_is_hand_drawn_vector_in_four_quarters(self):
        # Ray: "let the drawings be rough like a scratchpad" - overshooting,
        # multi-pass pen strokes, scribbled hatching clipped to the shapes,
        # crossed-out tries and handwritten notes; no neat dashed guides.
        for needle in ("<feTurbulence", "<feDisplacementMap", 'className="sk-scrib" clipPath=', "too literal", "no, round", "sk-hand"):
            self.assertIn(needle, SKETCH, needle)
        self.assertNotIn("stroke-dasharray", SKETCH)
        self.assertNotIn("sk-cn", SKETCH)
        for q in ('translate(0 0)', 'translate(500 0)', 'translate(0 500)', 'translate(500 500)'):
            self.assertIn(f'<g transform="{q}">', SKETCH)
        self.assertNotRegex(SKETCH, r"<image|\.png|\.webp|\.jpe?g")
        # Ink is currentColor and the paper a token per theme.
        self.assertIn(".dark .st .sk{--sk-paper:", CSS)
        self.assertIn('className="sk-acc"', SKETCH)
        manifest = json.loads(read(os.path.join(SDK_ROOT, "manifest.json")))
        installs = {e.get("from"): e.get("to") for e in manifest["app_type"]["hosting"]["installs"]}
        self.assertEqual(installs.get("templates/components/custom/studio/studio-sketch.tsx"), "components/custom/studio/studio-sketch.tsx")

    def test_back_markup(self):
        self.assertIn("<StudioSketchSheet title={STUDIO_MARK_COPY.sheetLabel(notes)} />", HOME)
        self.assertIn('role="img" aria-label={m.final.alt}', HOME)
        self.assertIn("{STUDIO_MARK_COPY.why(letter)}", HOME)

    def test_final_follows_the_theme(self):
        self.assertIn("mask:var(--mk) center/contain no-repeat", CSS)
        self.assertIn("background:currentColor", CSS)
        self.assertIn(".st .pf-tabs{flex:1;grid-template-columns:repeat(3,minmax(0,1fr));border-bottom:0}", CSS)

    def test_hand_font_is_shipped_and_licensed(self):
        fonts = read(os.path.join(STUDIO, "studio-fonts.ts"))
        self.assertIn('path: "./fonts/caveat-500.woff2"', fonts)
        self.assertIn("studioHand.variable", fonts)
        self.assertTrue(os.path.isfile(os.path.join(STUDIO, "fonts", "caveat-500.woff2")))
        self.assertIn("SIL Open Font License", read(os.path.join(STUDIO, "fonts", "OFL-caveat.txt")))
        self.assertIn("--sk-hand:var(--font-st-hand)", CSS)

    def test_phone_frame_is_thin_everywhere(self):
        self.assertIn(".st .phone .shot{background:var(--frame);border-radius:26px;padding:4px;", CSS)
        self.assertIn("border-radius:22px}", CSS)

    def test_studio_has_work_proofs(self):
        self.assertIn('studio: { repo: "RokctAI/hosting", origin: null, files: [...OPTION, ...WORK] },', SHOTS)
        for f in ("studio-desktop.webp", "studio-phone.webp"):
            self.assertTrue(os.path.isfile(os.path.join(TEMPLATES, "public", "studio", "work", f)), f)


if __name__ == "__main__":
    unittest.main()
