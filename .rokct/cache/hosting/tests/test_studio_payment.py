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

"""hosting_sdk 1.20.7 (Ray): pay before leaving. After the order is sent the
form shows a payment step: bank transfer (ROKCT INTELLIGENCE (PTY) LTD,
Capitec Business, branch 470010, account from STUDIO_BANK_ACCOUNT, the order
reference as the payment reference, with a copy button) and card through a
server-signed PayFast payment (/api/studio/pay) with an ITN route that checks
the signature. No PAYFAST_MERCHANT_ID / KEY: card is "coming soon".

The signature test follows PayFast's documented algorithm (developers docs,
"Step 2: Create security signature"): the non-empty fields in the documented
order as key=urlencode(trim(value)) (PHP urlencode: spaces as +, uppercase
hex), joined with &, then &passphrase=..., MD5 in lower-case hex. It uses
the docs' sandbox example merchant (10000100 / 46f0cd694581a) and example
passphrase, and checks our TypeScript against an independent Python
implementation of that recipe."""

import hashlib
import json
import os
import re
import shutil
import subprocess
import tempfile
import unittest
from urllib.parse import quote_plus

SDK_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))
T = os.path.join(SDK_ROOT, "templates")
STUDIO = os.path.join(T, "components", "custom", "studio")
MODULES = ["studio-pay.ts", "studio-payfast.ts", "studio-copy.ts"]
FORM = os.path.join(STUDIO, "studio-order-form.tsx")
PAY_ROUTE = os.path.join(T, "app", "api", "studio", "pay", "route.ts")
ITN_ROUTE = os.path.join(T, "app", "api", "studio", "payfast", "notify", "route.ts")
MAIL = os.path.join(STUDIO, "studio-order-mail.ts")
ORDER_PAGE = os.path.join(T, "app", "order", "page.tsx")
MANIFEST = os.path.join(SDK_ROOT, "manifest.json")

DOC_FIELDS = [
    ("merchant_id", "10000100"),
    ("merchant_key", "46f0cd694581a"),
    ("return_url", "https://www.example.com/return"),
    ("cancel_url", "https://www.example.com/cancel"),
    ("notify_url", "https://www.example.com/notify"),
    ("name_first", "First Name"),
    ("name_last", "Last Name"),
    ("email_address", "test@test.com"),
    ("m_payment_id", "1234"),
    ("amount", "10.00"),
    ("item_name", "Order#123"),
]
DOC_PASSPHRASE = "jt7NOE43FZPn"


def php_urlencode(v):
    return quote_plus(v, safe="").replace("~", "%7E")


def reference_signature(fields, passphrase):
    s = "&".join(f"{k}={php_urlencode(v.strip())}" for k, v in fields if v.strip() != "")
    if passphrase:
        s += "&passphrase=" + php_urlencode(passphrase.strip())
    return hashlib.md5(s.encode()).hexdigest()


def read(p):
    with open(p, encoding="utf-8") as f:
        return f.read()


PROBE = r"""
import { studioPayfastSignature, studioPayfastConfig, studioPayfastSigned, studioPayfastItnValid, studioBankAccount, studioBankSwift } from './studio-payfast.ts';
import { studioPayfastParamString, studioPhpUrlencode } from './studio-pay.ts';
const F = JSON.parse(process.argv[2]);
const P = process.argv[3];
const pay = { amountZar: 2850, itemName: 'CORTEX Website and brand bundle', ref: 'RK-20261109-ABC123', name: 'Thandi M', email: 't@example.com',
  returnUrl: 'https://x.co.za/order?paid=RK-20261109-ABC123', cancelUrl: 'https://x.co.za/order?cancelled=1', notifyUrl: 'https://x.co.za/api/studio/payfast/notify' };
const on = studioPayfastConfig({ PAYFAST_MERCHANT_ID: '10000100', PAYFAST_MERCHANT_KEY: '46f0cd694581a', PAYFAST_PASSPHRASE: P, PAYFAST_SANDBOX: 'true' });
const itn = [['m_payment_id', 'RK-1'], ['pf_payment_id', '1089250'], ['payment_status', 'COMPLETE'], ['item_name', 'CORTEX x'], ['item_description', ''], ['amount_gross', '2850.00'], ['merchant_id', '10000100']];
const itnSig = studioPayfastSignature(itn, P, true);
console.log(JSON.stringify({
  docSig: studioPayfastSignature(F, P),
  docNoPass: studioPayfastSignature(F, ''),
  docString: studioPayfastParamString(F, P),
  enc: studioPhpUrlencode("a b~!*'()"),
  off: [studioPayfastConfig({}).enabled, studioPayfastConfig({ PAYFAST_MERCHANT_ID: '1' }).enabled, studioPayfastSigned(studioPayfastConfig({}), pay)],
  on: { enabled: on.enabled, action: on.action, live: studioPayfastConfig({ PAYFAST_MERCHANT_ID: '1', PAYFAST_MERCHANT_KEY: 'k' }).action },
  signed: studioPayfastSigned(on, pay),
  itnOk: studioPayfastItnValid([...itn, ['signature', itnSig]], P),
  itnTampered: studioPayfastItnValid([...itn.map(([k, v]) => [k, k === 'amount_gross' ? '1.00' : v]), ['signature', itnSig]], P),
  itnWrongPass: studioPayfastItnValid([...itn, ['signature', itnSig]], 'nope'),
  itnNoSig: studioPayfastItnValid(itn, P),
  bank: [studioBankAccount({}), studioBankAccount({ STUDIO_BANK_ACCOUNT: '12 3456 7890' }), studioBankAccount({ STUDIO_BANK_ACCOUNT: 'abc' })],
  swift: [studioBankSwift({}), studioBankSwift({ STUDIO_BANK_SWIFT: 'abcdzajj xyz' }), studioBankSwift({ STUDIO_BANK_SWIFT: 'bad' })],
}));
"""


class TestPayfastSigning(unittest.TestCase):
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
            run = subprocess.run([node, "--experimental-strip-types", "--no-warnings", probe, json.dumps(DOC_FIELDS), DOC_PASSPHRASE],
                                 capture_output=True, text=True, timeout=60, cwd=tmp)
        if run.returncode != 0:
            raise AssertionError(run.stderr)
        cls.o = json.loads(run.stdout)

    def test_documented_example_signature(self):
        self.assertEqual(self.o["docSig"], reference_signature(DOC_FIELDS, DOC_PASSPHRASE))
        self.assertEqual(self.o["docNoPass"], reference_signature(DOC_FIELDS, ""))
        self.assertTrue(self.o["docString"].startswith(
            "merchant_id=10000100&merchant_key=46f0cd694581a&return_url=https%3A%2F%2Fwww.example.com%2Freturn&"))
        self.assertIn("&name_first=First+Name&", self.o["docString"])
        self.assertIn("&item_name=Order%23123&passphrase=jt7NOE43FZPn", self.o["docString"])
        self.assertRegex(self.o["docSig"], r"^[0-9a-f]{32}$")

    def test_php_urlencode(self):
        self.assertEqual(self.o["enc"], "a+b%7E%21%2A%27%28%29")

    def test_env_missing_means_card_off(self):
        self.assertEqual(self.o["off"], [False, False, None])

    def test_env_set_signs_and_picks_the_host(self):
        self.assertTrue(self.o["on"]["enabled"])
        self.assertEqual(self.o["on"]["action"], "https://sandbox.payfast.co.za/eng/process")
        self.assertEqual(self.o["on"]["live"], "https://www.payfast.co.za/eng/process")
        signed = self.o["signed"]
        keys = [k for k, _ in signed]
        self.assertEqual(keys[-1], "signature")
        for k in ("return_url", "cancel_url", "notify_url", "m_payment_id", "amount"):
            self.assertIn(k, keys)
        self.assertIn(["amount", "2850.00"], signed)
        self.assertEqual(signed[-1][1], reference_signature([tuple(x) for x in signed[:-1]], DOC_PASSPHRASE))

    def test_itn_signature_is_checked(self):
        self.assertTrue(self.o["itnOk"])
        self.assertFalse(self.o["itnTampered"])
        self.assertFalse(self.o["itnWrongPass"])
        self.assertFalse(self.o["itnNoSig"])

    def test_bank_account_from_env_only(self):
        self.assertEqual(self.o["bank"][0], None)
        self.assertEqual(self.o["bank"][2], None)
        self.assertRegex(self.o["bank"][1] or "", r"^\d+$")

    def test_swift_default_and_override(self):
        self.assertEqual(self.o["swift"], ["CABLZAJJ", "ABCDZAJJXYZ", "CABLZAJJ"])

    def test_swift_row_and_qr(self):
        pay = read(os.path.join(STUDIO, "studio-pay.ts"))
        self.assertIn('swift: "CABLZAJJ"', pay)
        self.assertIn("`SWIFT code: ${swift}`", pay)
        form = read(os.path.join(STUDIO, "studio-order-form.tsx"))
        self.assertIn("[P.swift, info.swift ?? STUDIO_BANK.swift, true]", form)


class TestPaymentWiring(unittest.TestCase):
    def test_bank_details_and_no_account_number_in_code(self):
        pay = read(os.path.join(STUDIO, "studio-pay.ts"))
        self.assertIn('holder: "ROKCT INTELLIGENCE (PTY) LTD"', pay)
        self.assertIn('bank: "Capitec Business"', pay)
        self.assertIn('branch: "470010"', pay)
        for root, _, files in os.walk(T):
            for n in files:
                if n.endswith((".ts", ".tsx")):
                    self.assertNotRegex(read(os.path.join(root, n)), r"account(Number)?:\s*\"\d{6,}", n)

    def test_payment_step_after_send(self):
        form = read(FORM)
        self.assertIn("<StudioPayStep refCode={state.ref} total={state.total} card={state.card} pay={pay} info={state.info} />", form)
        self.assertIn('<Copy value={refCode} what="payment reference" />', form)
        self.assertIn("navigator.clipboard?.writeText(value)", form)
        self.assertIn("{P.cardSoon}", form)
        self.assertNotIn("studioPay(", form)
        page = read(ORDER_PAGE)
        self.assertIn("const pay = { card: studioPayfastConfig().enabled };", page)  # 1.21.4: no account number on the page

    def test_routes(self):
        pay = read(PAY_ROUTE)
        self.assertIn("studioOrderZar(service, addons)", pay)  # the amount is worked out on the server, in rand
        self.assertIn("/api/studio/payfast/notify", pay)
        self.assertIn("status: 503", pay)
        itn = read(ITN_ROUTE)
        self.assertIn("studioPayfastItnValid(fields, cfg.passphrase)", itn)
        self.assertIn("cfg.validateUrl", itn)
        for src in (pay, itn):
            self.assertNotRegex(src, r"console\.[a-z]+\([^)]*(passphrase|merchantKey|PAYFAST_)")

    def test_email_has_both_options(self):
        mail = read(MAIL)
        self.assertIn('"HOW TO PAY"', mail)
        self.assertIn("STUDIO_BANK.holder", mail)
        self.assertIn("Reference: ${ref}", mail)
        self.assertIn("pay.cardUrl", mail)

    def test_installed(self):
        pairs = {(i["from"], i["to"]) for i in json.loads(read(MANIFEST))["app_type"]["hosting"]["installs"]}
        for f in ("components/custom/studio/studio-payfast.ts", "app/api/studio/pay/route.ts", "app/api/studio/payfast/notify/route.ts"):
            self.assertIn(("templates/" + f, f), pairs)


if __name__ == "__main__":
    unittest.main()
