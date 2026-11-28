"""hosting_sdk 1.21.10: a VALID, COMPLETE PayFast ITN emails the orders inbox
("Card payment received: <ref>") and the payer ("Payment received, work has
started", Reply-To the orders inbox). The builders run under node's type
stripping; the route's wiring is checked in source."""

import glob
import json
import os
import re
import shutil
import subprocess
import tempfile
import unittest

SDK_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
T = os.path.join(SDK_ROOT, "templates")
STUDIO = os.path.join(T, "components", "custom", "studio")
ROUTE = os.path.join(T, "app", "api", "studio", "payfast", "notify", "route.ts")
SEND = os.path.join(STUDIO, "studio-order-send.ts")


def read(p):
    with open(p, encoding="utf-8") as f:
        return f.read()


def code(p):
    s = re.sub(r"/\*.*?\*/", "", read(p), flags=re.S)
    return re.sub(r"^\s*//.*$", "", s, flags=re.M)


PROBE = r"""
import { buildStudioPaidMails } from './studio-order-mail.ts';
const cfg = { from: 'CORTEX <orders@x.co.za>', ordersEmail: 'orders@x.co.za' };
const m = buildStudioPaidMails({ ref: 'CX-AB12-CD34', amount: '10500.00', nameFirst: 'Thandi', nameLast: '<b>M</b>', email: 'thandi@example.com', pfPaymentId: '1234567' }, cfg);
const blank = buildStudioPaidMails({ ref: 'CX-AB12-CD34', amount: '2500', nameFirst: '', nameLast: '', email: '', pfPaymentId: '' }, cfg);
console.log(JSON.stringify({ m, blank }));
"""


def run_probe():
    node = shutil.which("node")
    if not node:
        raise unittest.SkipTest("node not found")
    with tempfile.TemporaryDirectory() as tmp:
        for src in glob.glob(os.path.join(STUDIO, "studio-*.ts")):
            body = re.sub(r'from "\./(studio-[a-z-]+)";', r'from "./\1.ts";', read(src))
            with open(os.path.join(tmp, os.path.basename(src)), "w", encoding="utf-8") as f:
                f.write(body)
        probe = os.path.join(tmp, "probe.mts")
        with open(probe, "w", encoding="utf-8") as f:
            f.write(PROBE)
        run = subprocess.run([node, "--experimental-strip-types", "--no-warnings", probe], capture_output=True, text=True, timeout=60, cwd=tmp)
    if run.returncode != 0:
        raise AssertionError(run.stderr)
    return json.loads(run.stdout)


class TestPaidMails(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.o = run_probe()

    def test_orders_inbox(self):
        o = self.o["m"]["order"]
        self.assertEqual(o["to"], "orders@x.co.za")
        self.assertEqual(o["subject"], "Card payment received: CX-AB12-CD34")
        for s in ("CX-AB12-CD34", "R10,500.00 (ZAR)", "Thandi <b>M</b>", "thandi@example.com", "1234567"):
            self.assertIn(s, o["text"])
        self.assertIn("1234567", o["html"])
        self.assertNotIn("<b>M</b>", o["html"])
        self.assertIn("&lt;b&gt;M&lt;/b&gt;", o["html"])

    def test_customer(self):
        a = self.o["m"]["ack"]
        self.assertEqual(a["to"], "thandi@example.com")
        self.assertEqual(a["replyTo"], "orders@x.co.za")
        self.assertEqual(a["subject"], "Payment received, work has started")
        for body in (a["text"], a["html"]):
            self.assertIn("Thank you", body)
            self.assertIn("R10,500.00 (ZAR)", body)
            self.assertIn("CX-AB12-CD34", body)
            self.assertIn("24-hour turnaround starts now", body)
            self.assertIn("orders@x.co.za", body)
        self.assertIn("Your brand, taken seriously.", a["html"])
        self.assertIn("Georgia", a["html"])

    def test_blank_payer(self):
        b = self.o["blank"]
        self.assertEqual(b["ack"]["to"], "")
        self.assertIn("Not given", b["order"]["text"])
        self.assertIn("R2,500.00 (ZAR)", b["order"]["text"])


class TestNotifyWiring(unittest.TestCase):
    def test_only_after_valid_complete(self):
        r = code(ROUTE)
        call = r.index('if (status === "COMPLETE") await studioSendPaid(')
        self.assertEqual(r.count("studioSendPaid("), 2)  # definition and the one call
        self.assertGreater(call, r.index("if (!confirmed)"))
        self.assertGreater(call, r.index("studioItnAmountOk(fields)"))
        self.assertGreater(call, r.index("studioPayfastIpAllowed("))
        self.assertLess(call, r.index('return new Response("ok", { status: 200 })'))
        self.assertEqual(r.count("buildStudioPaidMails("), 1)
        self.assertEqual(r.count("sendStudioPaidMails("), 1)

    def test_failure_keeps_200_and_logs_ref_only(self):
        r = code(ROUTE)
        fn = r[r.index("async function studioSendPaid"):r.index("export const runtime")]
        self.assertIn("try {", fn)
        self.assertIn("} catch {", fn)
        for w in re.findall(r"console\.\w+\(([^;]*)\);", fn):
            self.assertNotRegex(re.sub(r"\"[^\"]*\"", "", w), r"cfg|pass|user|html|text|mails|email")

    def test_duplicates_skipped_in_process(self):
        r = code(ROUTE)
        self.assertIn("studioPaidSent.has(key)", r)
        self.assertIn('get("pf_payment_id")', r)

    def test_send_never_logs_bodies(self):
        s = code(SEND)
        fn = s[s.index("export async function sendStudioPaidMails"):]
        self.assertNotIn("console.", fn)


if __name__ == "__main__":
    unittest.main()
