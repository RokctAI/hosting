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

"""hosting_sdk 1.20.7 (Ray): the order form's brand colours step is
required and is a shade picker (studio-shades.ts rules, drawn by
studio-colour-picker.tsx). Words or hex -> base colour -> five HSL shades,
lightest to darkest, laid right-to-left; a pick collapses to a chip that
reopens; a new field follows each pick; 3 to 5 colours; hex in the email."""

import json
import os
import re
import shutil
import subprocess
import tempfile
import unittest

SDK_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))
STUDIO = os.path.join(SDK_ROOT, "templates", "components", "custom", "studio")
SHADES = os.path.join(STUDIO, "studio-shades.ts")
PICKER = os.path.join(STUDIO, "studio-colour-picker.tsx")
FORM = os.path.join(STUDIO, "studio-order-form.tsx")
CSS = os.path.join(STUDIO, "studio.css")
MANIFEST = os.path.join(SDK_ROOT, "manifest.json")
MODULES = ["studio-copy.ts", "studio-order.ts", "studio-order-config.ts", "studio-order-mail.ts", "studio-shades.ts", "studio-pay.ts"]


def read(p):
    with open(p, encoding="utf-8") as f:
        return f.read()


PROBE = r"""
import { studioColourBase as b, studioShades as sh, studioParseColours as p, STUDIO_COLOURS_ERROR } from './studio-shades.ts';
import { validateStudioOrder } from './studio-order.ts';
import { buildStudioOrderMails } from './studio-order-mail.ts';
const base = { service: 'Website and brand bundle', name: 'T', email: 't@example.com', business: 'B', sells: 'S', terms: 'yes' };
const ok = validateStudioOrder({ ...base, colour: '#1A73E8, #800000, #228b22' }, []);
const two = validateStudioOrder({ ...base, colour: '#1a73e8, #800000' }, []);
const none = validateStudioOrder({ ...base }, []);
const mail = buildStudioOrderMails(ok.order, [], { from: 'a@b.co', ordersEmail: 'o@b.co' }, 'R1');
const light = (h) => { const n = parseInt(h.slice(1), 16); return ((n >> 16) & 255) + ((n >> 8) & 255) + (n & 255); };
const blue = sh(b('blue'));
console.log(JSON.stringify({
  bases: [b('blue'), b('Maroon'), b('forest green'), b('#1A73E8'), b('1a73e8'), b('#abc'), b('burgundy'), b('rebecca purple'), b('nonsense'), b('')],
  blue, lightToDark: blue.every((h, i) => i === 0 || light(h) < light(blue[i - 1])),
  allHex: [b('red'), b('teal'), b('white')].every((x) => sh(x).length === 5 && sh(x).every((h) => /^#[0-9a-f]{6}$/.test(h))),
  parsed: [p('#AABBCC, #112233 bad #445566'), p('#1,#2,#3'), p('#111111 #222222 #333333 #444444 #555555 #666666').length],
  ok: ok.ok, colour: ok.ok ? ok.order.colour : null,
  two: two.ok ? null : two.errors.colour, none: none.ok ? null : none.errors.colour, err: STUDIO_COLOURS_ERROR,
  mailHas: mail.order.text.includes('#1a73e8, #800000, #228b22'),
}));
"""


class TestShadeRules(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        node = shutil.which("node")
        if not node:
            raise unittest.SkipTest("node not found")
        with tempfile.TemporaryDirectory() as tmp:
            for m in MODULES:
                body = re.sub(r'from "\./(studio-[a-z-]+)";', r'from "./\1.ts";', read(os.path.join(STUDIO, m)))
                with open(os.path.join(tmp, m), "w", encoding="utf-8") as f:
                    f.write(body)
            probe = os.path.join(tmp, "probe.mts")
            with open(probe, "w", encoding="utf-8") as f:
                f.write(PROBE)
            run = subprocess.run([node, "--experimental-strip-types", "--no-warnings", probe],
                                 capture_output=True, text=True, timeout=60, cwd=tmp)
        if run.returncode != 0:
            raise AssertionError(run.stderr)
        cls.o = json.loads(run.stdout)

    def test_words_and_hex_map_to_a_base(self):
        self.assertEqual(self.o["bases"], ["#0000ff", "#800000", "#228b22", "#1a73e8", "#1a73e8", "#aabbcc",
                                           "#800020", "#663399", None, None])

    def test_five_shades_lightest_to_darkest(self):
        self.assertEqual(len(self.o["blue"]), 5)
        self.assertTrue(self.o["lightToDark"])
        self.assertTrue(self.o["allHex"])

    def test_parse_keeps_valid_hex_up_to_five(self):
        self.assertEqual(self.o["parsed"][0], ["#aabbcc", "#112233", "#445566"])
        self.assertEqual(self.o["parsed"][1], [])
        self.assertEqual(self.o["parsed"][2], 5)

    def test_three_needed_and_hex_reaches_the_email(self):
        self.assertTrue(self.o["ok"])
        self.assertEqual(self.o["colour"], "#1a73e8, #800000, #228b22")
        self.assertEqual(self.o["two"], self.o["err"])
        self.assertEqual(self.o["none"], self.o["err"])
        self.assertIn("at least 3", self.o["err"])
        self.assertTrue(self.o["mailHas"])


class TestPickerWiring(unittest.TestCase):
    def test_picker_is_used_and_required(self):
        form = read(FORM)
        self.assertIn("<StudioColourPicker error={errors.colour} />", form)
        self.assertNotIn('<Field name="colour"', form)
        self.assertIn("studioParseColours(String(data.get(\"colour\")", form)
        self.assertIn("const colourErr = check(2).colour;", form)
        order = read(os.path.join(STUDIO, "studio-order.ts"))
        self.assertIn('{ name: "colour", label: "Your brand colours", kind: "text", required: true, max: 200 }', order)

    def test_picker_behaviour(self):
        p = read(PICKER)
        self.assertIn('<input type="hidden" name="colour" value={chosen.join(", ")} />', p)
        self.assertIn("next.length < STUDIO_COLOURS_MAX) next.push(empty())", p)  # a new field after each pick
        self.assertIn("onClick={() => set(i, { hex: h, open: false })}", p)  # a pick collapses to a chip
        self.assertIn("onClick={() => set(i, { open: true })}", p)  # the chip reopens the shades
        self.assertGreaterEqual(p.count('type="button"'), 3)  # real buttons: keyboard works
        self.assertIn("aria-pressed", p)
        self.assertIn("aria-label={`Shade ${k + 1} of 5", p)

    def test_right_to_left_and_phone_width(self):
        css = read(CSS)
        self.assertIn(".st .sp-shades{display:flex;flex-direction:row-reverse;", css)
        self.assertIn("flex:1 1 0;min-width:0;height:44px", css)

    def test_new_files_installed(self):
        pairs = {(i["from"], i["to"]) for i in json.loads(read(MANIFEST))["app_type"]["hosting"]["installs"]}
        for f in ("studio-shades.ts", "studio-colour-picker.tsx"):
            self.assertIn((f"templates/components/custom/studio/{f}", f"components/custom/studio/{f}"), pairs)


if __name__ == "__main__":
    unittest.main()
