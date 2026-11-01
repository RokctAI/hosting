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

"""hosting_sdk 1.16.0: Log in / Sign up in the studio header, injected.

Ray, 2026-11-01: "we just moving login and signup buttons to injection".
StudioHeader renders base_sdk 1.60.0's HeaderAuthSlot on the bar and in the
phone menu, with the studio's own classes; the SDK that owns sign-in fills
it, and with none composed the header shows no pair. The studio never
draws a sign-in link of its own and never names that SDK.

Run:  python3 -m unittest discover -s hosting/nextjs/tests
"""

import json
import os
import re
import unittest

from test_studio_showcase import CSS, SDK_ROOT, STUDIO, read

HEADER = os.path.join(STUDIO, "studio-client.tsx")


def studio_header(src):
    start = src.index("export function StudioHeader(")
    return src[start : src.index("\nexport function ", start + 1)]


class TestStudioHeaderAuth(unittest.TestCase):
    def setUp(self):
        self.src = read(HEADER)
        self.header = studio_header(self.src)

    def test_slot_is_imported_from_base(self):
        self.assertIn(
            'import { HeaderAuthSlot } from "@/components/custom/header-auth-slot";',
            self.src,
        )

    def test_bar_slot_sits_before_whatsapp(self):
        bar = self.header[
            self.header.index('<div className="hd-r">') : self.header.index(
                'className={open ? "mnav'
            )
        ]
        self.assertIn('<HeaderAuthSlot variant="bar" classes={STUDIO_AUTH_BAR} />', bar)
        self.assertLess(bar.index("<HeaderAuthSlot"), bar.index("STUDIO_WHATSAPP_URL"))
        self.assertIn(
            'const STUDIO_AUTH_BAR = { login: "hd-login", signup: "btn btn-line btn-sm hd-signup" };',
            self.src,
        )

    def test_menu_slot_closes_the_menu(self):
        menu = self.header[self.header.index('className={open ? "mnav') :]
        self.assertIn(
            '<HeaderAuthSlot variant="panel" classes={STUDIO_AUTH_MENU} onNavigate={() => setOpen(false)} />',
            menu,
        )
        self.assertIn(
            'const STUDIO_AUTH_MENU = { login: "mnav-auth", signup: "mnav-auth" };',
            self.src,
        )

    def test_no_sign_in_link_of_its_own(self):
        for gone in ('href="/login"', 'href="/register"', "auth_sdk", "@/app/(auth)"):
            self.assertNotIn(gone, self.header)

    def test_bar_login_hides_with_the_bar_buttons(self):
        css = read(CSS)
        self.assertIn(".st .hd-login{", css)
        mobile = css[css.index("@media (max-width:980px){") :]
        self.assertIn(".st .nav,.st .hd .btn,.st .hd .hd-login{display:none}", mobile)
        # 981-1099px: the section links keep one line, so the pill steps aside.
        self.assertIn(
            "@media (min-width:981px) and (max-width:1099px){.st .hd .hd-signup{display:none}}",
            css,
        )

    def test_requires_and_version(self):
        manifest = json.loads(read(os.path.join(SDK_ROOT, "manifest.json")))
        self.assertIn(
            "components/custom/header-auth-slot.tsx",
            manifest["app_type"]["hosting"]["requires"],
        )
        self.assertIn(
            "base_sdk >= 1.60.0",
            manifest["_comment"]["components/custom/header-auth-slot.tsx"],
        )
        self.assertGreaterEqual(
            tuple(int(p) for p in manifest["version"].split(".")), (1, 16, 0)
        )
        changelog = read(os.path.join(SDK_ROOT, "CHANGELOG.md"))
        self.assertEqual(
            re.findall(r"^## (\d+\.\d+\.\d+)$", changelog, re.MULTILINE)[0],
            manifest["version"],
        )
        self.assertIn("HeaderAuthSlot", changelog.split("## 1.14.1")[0])


if __name__ == "__main__":
    unittest.main()
