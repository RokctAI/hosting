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


"""hosting_sdk 1.12.0: the ROKCT card's logo back floats.

  * Ray approved the prototype "Floating Logo Concept" and said "build".
    When the ROKCT card turns to its back the card keeps its size; the four
    sketches and the final R lift and grow a little in place, the red pen
    circle is drawn around C (then the tick) while they are big, then all
    shrink back; the faded sheet's own red ring returns after ~0.5s.
  * Reduced motion: nothing lifts, the sheet shows complete.
  * The caption (and the live-site icon) hide while lifted.

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
LIFT_DIR = os.path.join(TEMPLATES, "public", "studio", "lift")


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


LIFT = read(os.path.join(STUDIO, "studio-showcase-lift.tsx"))
CLIENT = read(os.path.join(STUDIO, "studio-showcase-client.tsx"))
HOME = read(os.path.join(STUDIO, "studio-home.tsx"))
CSS = read(os.path.join(STUDIO, "studio.css"))
MANIFEST = json.loads(read(os.path.join(SDK_ROOT, "manifest.json")))


def layers(name):
    block = LIFT.split(f"export const {name}: readonly LiftLayer[] = [", 1)[1].split("\n];", 1)[0]
    return [
        dict(key=m.group(1), x=float(m.group(2)), y=float(m.group(3)), w=float(m.group(4)), h=float(m.group(5)), k=float(m.group(6)))
        for m in re.finditer(r'\{ key: "(\w)", x: ([\d.]+), y: ([\d.]+), w: ([\d.]+), h: ([\d.]+), k: ([\d.]+) \}', block)
    ]


class TestVersion(unittest.TestCase):
    def test_version_installs_and_changelog(self):
        # 1.13.0 (the hosting section) builds on this: a floor, not a pin.
        self.assertGreaterEqual(tuple(int(p) for p in MANIFEST["version"].split(".")), (1, 12, 0))
        self.assertIn("## 1.12.0", read(os.path.join(SDK_ROOT, "CHANGELOG.md")).split("## 1.11.0")[0])
        installs = {e["from"]: e["to"] for e in MANIFEST["app_type"]["hosting"]["installs"]}
        self.assertEqual(installs.get("templates/components/custom/studio/studio-showcase-lift.tsx"), "components/custom/studio/studio-showcase-lift.tsx")
        self.assertEqual(installs.get("templates/public/studio/lift"), "public/studio/lift")
        self.assertTrue(LIFT.startswith("/*\n * Copyright (c) 2026 ROKCT INTELLIGENCE (PTY) LTD"))


class TestPictures(unittest.TestCase):
    def test_every_picture_is_shipped_and_nothing_else(self):
        want = set()
        for theme in ("light", "dark"):
            for sheet in ("sheet", "sketches"):
                want |= {f"rokct-logo-{sheet}-{theme}.webp", f"rokct-logo-{sheet}-{theme}-nored.webp"}
            want |= {f"rokct-lift-sheet-{l['key']}-{theme}.webp" for l in layers("LIFT_SHEET")}
            want |= {f"rokct-lift-sketches-{l['key']}-{theme}.webp" for l in layers("LIFT_SKETCHES")}
        self.assertEqual(set(os.listdir(LIFT_DIR)), want)
        for f in want:
            with open(os.path.join(LIFT_DIR, f), "rb") as fh:
                head = fh.read(12)
            self.assertEqual((head[:4], head[8:12]), (b"RIFF", b"WEBP"), f)
        self.assertIn('export const LIFT_DIR = "/studio/lift";', LIFT)

    def test_layers_sit_inside_their_sheet(self):
        self.assertEqual([l["key"] for l in layers("LIFT_SHEET")], ["a", "b", "c", "d", "r"])
        self.assertEqual([l["key"] for l in layers("LIFT_SKETCHES")], ["a", "b", "c", "d"])
        for l in layers("LIFT_SHEET") + layers("LIFT_SKETCHES"):
            self.assertTrue(0 <= l["x"] and l["x"] + l["w"] <= 100 and 0 <= l["y"] and l["y"] + l["h"] <= 100, l)
            # "grow a bit": never more than 1.8x.
            self.assertTrue(1 < l["k"] <= 1.8, l)

    def test_sheet_pictures_follow_the_theme_and_have_alt_text(self):
        self.assertIn(".dark .st .sr-lb .th-l{display:none}", CSS)
        self.assertIn(".dark .st .sr-lb .th-d{display:block}", CSS)
        self.assertIn("alt={STUDIO_MARK_COPY.liftSheetAlt(notes)}", LIFT)
        self.assertIn("alt={STUDIO_MARK_COPY.liftSketchesAlt(notes)}", LIFT)
        self.assertIn('<div className="sr-lifts" aria-hidden="true">', LIFT)


class TestMotion(unittest.TestCase):
    def test_card_keeps_its_size_and_lifts_after_the_turn(self):
        self.assertIn("const LIFT_AFTER = FLIP_DURATION_MS + 60;", CLIENT)
        self.assertIn("const LIFT_BACK = 700;", CLIENT)
        self.assertIn('${lifted ? " lift" : ""}', CLIENT)
        # Lifting never touches the card's own box.
        for rule in re.findall(r"\.st \.sr-card\.lift\{([^}]*)\}", CSS):
            self.assertNotRegex(rule, r"width|height|scale|transform")
        self.assertIn(".st .sr-card.lift .sr-lg{opacity:1;scale:var(--k);translate:var(--dx,0px) var(--dy,0px);", CSS)

    def test_pen_draws_around_c_while_big_then_the_tick(self):
        self.assertIn(".st .sr-card.lift .sr-pen-ring{animation:sr-pen .8s", CSS)
        self.assertIn(".st .sr-card.lift .sr-pen-tick{animation:sr-pen .28s cubic-bezier(.5,0,.3,1) 1.55s both}", CSS)
        self.assertIn('{l.key === "c" && <PenMarks pen={set === "sheet" ? PEN_SHEET : PEN_SKETCHES} />}', LIFT)
        self.assertEqual(LIFT.count("pathLength={1}"), 2)

    def test_sheet_ring_returns_after_half_a_second(self):
        self.assertIn(".st .sr-lb-sheet img,.st .sr-sk>img{transition:opacity .4s cubic-bezier(.22,.8,.24,1) .5s}", CSS)
        self.assertIn(".st .sr-card.lift .sr-lb-sheet img.sr-nr,.st .sr-card.lift .sr-sk>img.sr-nr{opacity:1}", CSS)
        # Only the sheets swap; the cut-outs (.sr-lg img) are never hidden by it.
        self.assertNotIn(".sr-lb img", CSS)

    def test_caption_and_link_hide_while_lifted(self):
        self.assertIn(".st .sr-card.lift .sr-cap{opacity:0;", CSS)
        self.assertIn(".st .sr-card.lift .sr-ext{opacity:0;pointer-events:none}", CSS)

    def test_reduced_motion_never_lifts(self):
        self.assertIn("if (reduce()) return;", CLIENT)
        blocks = [b.split("\n}", 1)[0] for b in CSS.split("@media (prefers-reduced-motion:reduce){")[1:]]
        rm = next(b for b in blocks if ".sr-card,.st .sr-dev" in b)
        for rule in (".st .sr-card.lift .sr-lg{scale:none;translate:none}", ".st .sr-card.lift .sr-lb-sheet{opacity:1}", ".st .sr-pen path{animation:none!important}"):
            self.assertIn(rule, rm)

    def test_turning_back_settles_first(self):
        self.assertIn("await sleep(R.reduce ? 1100 : 1100 + LIFT_BACK);", CLIENT)
        self.assertIn("} else if (S.lifted === g) {", CLIENT)

    def test_stage_has_room_for_the_lifted_logos(self):
        self.assertIn("--lp:120px;margin:calc(-1 * var(--lp)) 0;pointer-events:none;", CSS)
        self.assertIn("height:calc(var(--dh) + 96px + 2 * var(--lp))", CSS)
        self.assertIn(".st .sr-track{position:absolute;inset:var(--lp) auto var(--lp) 0;pointer-events:auto;", CSS)


class TestIcons(unittest.TestCase):
    def test_no_icon_library_but_remixicon(self):
        for src in (LIFT, CLIENT):
            self.assertNotIn("lucide", src)
            for m in re.finditer(r'from "([^"]*icon[^"]*)"', src, re.I):
                self.assertEqual(m.group(1), "@remixicon/react")


if __name__ == "__main__":
    unittest.main()
