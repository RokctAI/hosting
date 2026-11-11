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

"""hosting_sdk 1.20.8: Cortex batch 2 (cortex-requirements-audit.md) and the
gatekeeper notes on 1.20.7's PayFast code. One class per item; the pure
rules run under node's type stripping, the wiring is checked in source."""

import hashlib
import json
import os
import re
import shutil
import subprocess
import tempfile
import unittest
from urllib.parse import quote

SDK_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))
T = os.path.join(SDK_ROOT, "templates")
STUDIO = os.path.join(T, "components", "custom", "studio")
MODULES = ["studio-pay.ts", "studio-payfast.ts", "studio-copy.ts", "studio-order.ts", "studio-shades.ts",
           "studio-order-mail.ts", "studio-order-config.ts", "studio-showcase.ts"]
FORM = os.path.join(STUDIO, "studio-order-form.tsx")
PICKER = os.path.join(STUDIO, "studio-colour-picker.tsx")
COPY = os.path.join(STUDIO, "studio-copy.ts")
CSS = os.path.join(STUDIO, "studio.css")
HOME = os.path.join(STUDIO, "studio-home.tsx")
ORDER_PAGE_C = os.path.join(STUDIO, "studio-order-page.tsx")
WORK = os.path.join(STUDIO, "studio-work.tsx")
STATUS_C = os.path.join(STUDIO, "studio-status.tsx")
PAY_ROUTE = os.path.join(T, "app", "api", "studio", "pay", "route.ts")
ITN_ROUTE = os.path.join(T, "app", "api", "studio", "payfast", "notify", "route.ts")
ORDER_ROUTE = os.path.join(T, "app", "api", "studio", "order", "route.ts")
ORDER_PAGE = os.path.join(T, "app", "order", "page.tsx")
TERMS_PAGE = os.path.join(T, "app", "terms", "page.tsx")
STATUS_PAGE = os.path.join(T, "app", "status", "page.tsx")
MANIFEST = os.path.join(SDK_ROOT, "manifest.json")


def read(p):
    with open(p, encoding="utf-8") as f:
        return f.read()


def code(p):
    s = re.sub(r"/\*.*?\*/", "", read(p), flags=re.S)
    return re.sub(r"^\s*//.*$", "", s, flags=re.M)


PROBE = r"""
import { validateStudioOrder, studioPhotoWarning, studioPlanQuestions, studioOrderTerms, STUDIO_PLAN_QUESTIONS, STUDIO_ORDER_FLAGS } from './studio-order.ts';
import { studioOrderRows } from './studio-order-mail.ts';
import { studioColourSystem, studioContrast } from './studio-shades.ts';
import { studioOrderRef, studioIsOrderRef, studioCleanRef, studioPayRef, STUDIO_REF_ALPHABET, studioPayHref, studioPayFields, studioPayfastParamString } from './studio-pay.ts';
import { studioPayfastSignature, studioPayfastItnValid, studioItnAmountOk, studioItnExpectedZar, studioItnSourceIp, studioPayfastIpAllowed, STUDIO_PAYFAST_ITN_HOSTS } from './studio-payfast.ts';
import { STUDIO_ADDONS, STUDIO_SOURCE_LINE, studioOrderZar } from './studio-copy.ts';
import { showcaseShelves } from './studio-showcase.ts';

const base = { service: 'Website and brand bundle', name: 'T', email: 't@example.com', business: 'B', sells: 'S', colour: '#112233, #445566, #778899', terms: 'yes' };
const logo = { field: 'logo', name: 'old.png', type: 'image/png', size: 200000 };
const v = (extra, up = []) => validateStudioOrder({ ...base, ...extra }, up);

const refs = Array.from({ length: 300 }, () => studioOrderRef());
const r0 = refs[0];
const typo = r0.slice(0, 3) + (r0[3] === 'A' ? 'C' : 'A') + r0.slice(4);

const P = 'pass phrase';
const itn = [['m_payment_id', r0], ['payment_status', 'COMPLETE'], ['item_name', ' Cortex x '], ['amount_gross', '2500.00'], ['custom_str1', 'Website and brand bundle'], ['custom_str2', ''], ['merchant_id', '1']];
const itnSig = studioPayfastSignature(itn, P, true);
const hdr = (h) => ({ get: (k) => h[k] ?? null });
const resolve = async (host) => host === 'www.payfast.co.za' ? ['197.97.145.144'] : host === 'w1w.payfast.co.za' ? ['144.126.193.139'] : [];

const planStd = v({ service: 'Business plan · Standard', colour: '', planType: 'Food', planFor: 'An investor', planSales: 'R40k' });

console.log(JSON.stringify({
  logo: {
    noKind: v({ designLogo: 'yes' }).errors,
    redesignNoUpload: v({ designLogo: 'yes', logoKind: 'redesign' }).errors,
    redesignOk: v({ designLogo: 'yes', logoKind: 'redesign' }, [logo]).order?.logoKind,
    newOk: v({ designLogo: 'yes', logoKind: 'new' }).order?.logoKind,
    offIgnored: v({ logoKind: 'redesign' }).order?.logoKind,
    rows: studioOrderRows(v({ designLogo: 'yes', logoKind: 'redesign' }, [logo]).order),
  },
  stock: { addons: STUDIO_ADDONS.map((a) => a.name), flags: STUDIO_ORDER_FLAGS.map((f) => f.name), zar: studioOrderZar('Website and brand bundle', ['stockPhotos']) },
  photo: {
    small: studioPhotoWarning({ name: 'a.jpg', type: 'image/jpeg', size: 20000 }),
    lowres: studioPhotoWarning({ name: 'b.jpg', type: 'image/jpeg', size: 900000, width: 640, height: 480 }),
    good: studioPhotoWarning({ name: 'c.jpg', type: 'image/jpeg', size: 900000, width: 3000, height: 2000 }),
    pdf: studioPhotoWarning({ name: 'd.pdf', type: 'application/pdf', size: 100 }),
    rows: studioOrderRows(v({}, [{ field: 'photos', name: 'tiny.jpg', type: 'image/jpeg', size: 9000 }]).order),
  },
  colours: { none: studioColourSystem('Secondary #112233'), two: studioColourSystem('Primary #112233, Accent #445566'), three: studioColourSystem('#8c1a2d, #f5a623, #1e90ff'),
    contrastOk: (studioColourSystem('#8c1a2d, #f5a623, #ffff00') ?? []).every((r) => studioContrast(r.hex, r.ink) >= 4.5) },
  plan: {
    std: studioPlanQuestions('Business plan · Standard').map((q) => q.n),
    starter: studioPlanQuestions('Business plan · Starter').map((q) => q.n),
    site: studioPlanQuestions('Website and brand bundle').length,
    labels: STUDIO_PLAN_QUESTIONS.map((q) => q.label),
    ok: planStd.ok, plan: planStd.order?.plan,
    badType: v({ service: 'Business plan · Premium', colour: '', planType: 'Mining' }).errors,
    siteStillNeedsColour: v({ colour: '' }).errors,
    rows: planStd.order ? studioOrderRows(planStd.order) : [],
  },
  ref: {
    shape: refs.every((r) => /^CX-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(r)),
    valid: refs.every(studioIsOrderRef), unique: new Set(refs).size,
    alphabetOnly: refs.every((r) => [...r.slice(3).replace('-', '')].every((c) => STUDIO_REF_ALPHABET.includes(c))),
    typo: studioIsOrderRef(typo), old: studioIsOrderRef('RK-20261109-ABC123'),
    clean: studioCleanRef(' ' + r0.toLowerCase().replace(/-/g, ' ') + ' '), r0,
    alphabet: STUDIO_REF_ALPHABET,
    // 1.21.1: every single substitution and every adjacent swap, on 200 refs.
    missedSubs: (() => { const miss = []; for (const r of refs.slice(0, 200)) { const c = r.slice(3, 7) + r.slice(8);
      for (let i = 0; i < 8; i++) for (const x of STUDIO_REF_ALPHABET) { if (x === c[i]) continue;
        const t = c.slice(0, i) + x + c.slice(i + 1); if (studioIsOrderRef(`CX-${t.slice(0, 4)}-${t.slice(4)}`)) miss.push(t); } } return miss; })(),
    missedSwaps: (() => { const miss = []; let tried = 0; for (const r of refs.slice(0, 200)) { const c = r.slice(3, 7) + r.slice(8);
      for (let i = 0; i < 7; i++) { if (c[i] === c[i + 1]) continue; tried++;
        const t = c.slice(0, i) + c[i + 1] + c[i] + c.slice(i + 2); if (studioIsOrderRef(`CX-${t.slice(0, 4)}-${t.slice(4)}`)) miss.push(t); } } return { miss, tried }; })(),
    payRefClean: studioPayRef(' ' + r0.toLowerCase().replace(/-/g, ' ') + ' '),
    payRefBad: studioPayRef(typo),
  },
  source: { line: STUDIO_SOURCE_LINE, terms: studioOrderTerms('o@x.co.za').map((t) => t.b + ': ' + t.t) },
  shelves: {
    none: showcaseShelves([{ services: ['website'] }]),
    some: showcaseShelves([{ services: ['website', 'pitch-deck'] }, { services: ['print'] }]),
  },
  itn: {
    ok: studioPayfastItnValid([...itn, ['signature', itnSig]], P),
    trimmedSigFails: studioPayfastItnValid([...itn, ['signature', studioPayfastSignature(itn.map(([k, x]) => [k, x.trim()]), P, true)]], P),
    reqTrims: studioPayfastParamString([['a', ' x ']], ''),
    itnKeeps: studioPayfastParamString([['a', ' x ']], '', true),
    amountOk: studioItnAmountOk(itn),
    amountBad: studioItnAmountOk(itn.map(([k, x]) => [k, k === 'amount_gross' ? '1.00' : x])),
    amountNoOrder: studioItnAmountOk(itn.filter(([k]) => !k.startsWith('custom_str'))),
    expectedLogo: studioItnExpectedZar([['custom_str1', 'Website and brand bundle'], ['custom_str2', 'designLogo']]),
    ipFwd: studioItnSourceIp(hdr({ 'x-forwarded-for': '197.97.145.144, 10.0.0.1', 'x-real-ip': '9.9.9.9' })),
    ipReal: studioItnSourceIp(hdr({ 'x-real-ip': '::ffff:144.126.193.139' })),
    allowed: await studioPayfastIpAllowed('197.97.145.144', resolve),
    allowed2: await studioPayfastIpAllowed('144.126.193.139', resolve),
    denied: await studioPayfastIpAllowed('8.8.8.8', resolve),
    empty: await studioPayfastIpAllowed('', resolve),
    hosts: STUDIO_PAYFAST_ITN_HOSTS,
    fields: studioPayFields('m', 'k', { amountZar: 2500, itemName: 'x', ref: r0, returnUrl: 'r', cancelUrl: 'c', notifyUrl: 'n', service: 'Website and brand bundle', addons: ['designLogo'] }),
  },
  href: studioPayHref(r0, 'Website and brand bundle', ['designLogo']),
}));
"""


def run_probe():
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
        run = subprocess.run([node, "--experimental-strip-types", "--no-warnings", probe], capture_output=True, text=True, timeout=60, cwd=tmp)
    if run.returncode != 0:
        raise AssertionError(run.stderr)
    return json.loads(run.stdout)


O = None


def out():
    global O
    if O is None:
        O = run_probe()
    return O


class TestLogoNewOrRedesign(unittest.TestCase):
    def test_server_rules(self):
        o = out()["logo"]
        self.assertIn("logoKind", o["noKind"])
        self.assertIn("logo", o["redesignNoUpload"])
        self.assertEqual(o["redesignOk"], "redesign")
        self.assertEqual(o["newOk"], "new")
        self.assertEqual(o["offIgnored"], "")
        self.assertIn(["Logo design", "A redesign of the current logo (attached)"], o["rows"])

    def test_form_asks_and_uploads(self):
        f = read(FORM)
        self.assertIn("STUDIO_ORDER_LOGO.question", f)
        self.assertIn('logoKind === "redesign"', f)
        self.assertIn("STUDIO_ORDER_LOGO.upload", f)
        self.assertIn("out.logo = STUDIO_ORDER_LOGO.missing", f)


class TestNoStockPhotos(unittest.TestCase):
    def test_addon_and_copy_gone(self):
        o = out()["stock"]
        self.assertNotIn("stockPhotos", o["addons"])
        self.assertNotIn("stockPhotos", o["flags"])
        self.assertEqual(o["zar"], 2500)  # an old "stockPhotos" adds nothing
        for p in (COPY, FORM, os.path.join(STUDIO, "studio-order.ts"), os.path.join(STUDIO, "studio-client.tsx")):
            self.assertNotRegex(code(p).lower(), r"stock photo|stockphotos", p)
        self.assertIn("royalty-free", read(COPY))
        self.assertIn("C.photosNone", read(FORM))


class TestPhotoQuality(unittest.TestCase):
    def test_warnings(self):
        o = out()["photo"]
        self.assertIn("small file (20 KB)", o["small"])
        self.assertIn("640 × 480", o["lowres"])
        self.assertIsNone(o["good"])
        self.assertIsNone(o["pdf"])
        self.assertTrue(any(k == "Photo quality" and "tiny.jpg" in v for k, v in o["rows"]))

    def test_form_measures_at_upload(self):
        f = read(FORM)
        self.assertIn("createImageBitmap(f)", f)
        self.assertIn('onFiles("photos"', f)
        self.assertIn('className="of-warn"', f)


class TestColourPreview(unittest.TestCase):
    def test_system(self):
        o = out()["colours"]
        # 1.21.4: by role; only the Primary is needed.
        self.assertIsNone(o["none"])
        self.assertEqual([r["role"] for r in o["two"]], ["Primary", "Accent", "Background", "Text"])
        roles = [r["role"] for r in o["three"]]
        self.assertEqual(roles, ["Primary", "Secondary", "Accent", "Background", "Text"])
        self.assertEqual(o["three"][0]["hex"], "#8c1a2d")
        self.assertTrue(o["contrastOk"])

    def test_preview_after_picks(self):
        p = read(PICKER)
        self.assertIn("<StudioColourPreview colours={chosen} />", p)
        self.assertIn("studioColourSystem(colours)", p)


class TestBusinessPlanIntake(unittest.TestCase):
    def test_questions(self):
        o = out()["plan"]
        self.assertEqual(o["std"], list(range(1, 11)))
        self.assertEqual(o["starter"], [1, 2, 3, 5, 6, 7])
        self.assertEqual(o["site"], 0)
        self.assertEqual(len(o["labels"]), 10)
        self.assertIn("What you need the plan for", o["labels"])

    def test_validation_and_email(self):
        o = out()["plan"]
        self.assertTrue(o["ok"])  # no colours asked for a plan
        self.assertEqual(o["plan"]["planType"], "Food")
        self.assertIn("planType", o["badType"])
        self.assertIn("colour", o["siteStillNeedsColour"])
        labels = [k for k, _ in o["rows"]]
        self.assertIn("Plan Q2: Business type", labels)
        self.assertNotIn("Your brand colours", labels)
        self.assertTrue(any(k.startswith("Plan Q8") and "assumption" in v for k, v in o["rows"]))

    def test_form_swaps_questions(self):
        f = read(FORM)
        self.assertIn("{isPlan ? null : <StudioColourPicker", f)
        self.assertIn("planQs.flatMap", f)


class TestNoShopOrAppUpsell(unittest.TestCase):
    """1.21.2 (Ray): no "online shop too" / "app too" boxes, note, payload or email rows."""

    def test_gone_everywhere(self):
        for p in (FORM, os.path.join(STUDIO, "studio-order.ts"), os.path.join(STUDIO, "studio-order-mail.ts")):
            src = read(p)
            for k in ("wantShop", "wantApp", "STUDIO_ORDER_APP", "appDoes", "appPlatform", "appSameBrand",
                      "outsideSpecial", "online shop too", "app too"):
                self.assertNotIn(k, src, f"{k} in {p}")


class TestOrderReferenceCheck(unittest.TestCase):
    def test_every_single_substitution_is_caught(self):
        self.assertEqual(out()["ref"]["missedSubs"], [])

    def test_every_adjacent_swap_is_caught(self):
        sw = out()["ref"]["missedSwaps"]
        self.assertGreater(sw["tried"], 1000)
        self.assertEqual(sw["miss"], [])

    def test_cleaned_ref_goes_downstream(self):
        o = out()["ref"]
        self.assertEqual(o["payRefClean"], o["r0"])
        self.assertIsNone(o["payRefBad"])
        pay = code(PAY_ROUTE)
        self.assertIn('const ref = studioPayRef(q("ref", 40));', pay)
        self.assertIn("if (ref === null ||", pay)
        self.assertIn("ref,\n", pay)  # the cleaned value is what studioPayfastSigned gets
        self.assertIn("/order?paid=${encodeURIComponent(ref)}", pay)


class TestOrderReference(unittest.TestCase):
    def test_reference(self):
        o = out()["ref"]
        self.assertTrue(o["shape"])
        self.assertTrue(o["valid"])
        self.assertEqual(o["unique"], 300)
        self.assertTrue(o["alphabetOnly"])
        for c in "0O1IL8B5S2ZDQG9UV":
            self.assertNotIn(c, o["alphabet"])
        self.assertEqual(len(o["alphabet"]), 19)  # prime: the check catches every single error
        self.assertFalse(o["typo"])
        self.assertFalse(o["old"])
        self.assertEqual(o["clean"], o["r0"])

    def test_tied_to_payment(self):
        self.assertIn("const ref = studioOrderRef();", read(ORDER_ROUTE))
        self.assertIn("studioPayRef(", read(PAY_ROUTE))
        self.assertIn("studioIsOrderRef(rawPaid)", read(ORDER_PAGE))
        fields = dict(out()["itn"]["fields"])
        self.assertEqual(fields["m_payment_id"], out()["ref"]["r0"])


class TestSourceLine(unittest.TestCase):
    def test_line(self):
        o = out()["source"]
        self.assertIn("app shell repo we clone for you", o["line"])
        self.assertTrue(any(t.startswith("Your code: ") and "app shell repo" in t for t in o["terms"]))
        self.assertIn("You get the app shell repo we clone for you", read(COPY))


class TestStatusPage(unittest.TestCase):
    def test_honest_page(self):
        s = read(STATUS_C)
        self.assertIn("studioIsOrderRef(ref)", s)
        self.assertIn("S.honestTitle", s)
        o = read(os.path.join(STUDIO, "studio-order.ts"))
        self.assertIn("Live status pages are not switched on yet.", o)
        self.assertNotRegex(code(STATUS_C), r"Phase \d|due date:")
        self.assertIn("searchParams", read(STATUS_PAGE))
        self.assertIn("STUDIO_STATUS_HREF}?ref=", read(FORM))


class TestTermsPage(unittest.TestCase):
    def test_page(self):
        p = read(TERMS_PAGE)
        self.assertIn('title: { absolute: "Terms · CORTEX" }', p)
        self.assertIn("<StudioTerms", p)
        self.assertIn("studioOrderTerms(ordersEmail)", read(os.path.join(STUDIO, "studio-terms.tsx")))

    def test_installed(self):
        m = json.loads(read(MANIFEST))
        self.assertEqual(m["version"], "1.21.11")
        pairs = {(i["from"], i["to"]) for i in m["app_type"]["hosting"]["installs"]}
        for f in ("app/terms/page.tsx", "app/status/page.tsx", "components/custom/studio/studio-terms.tsx", "components/custom/studio/studio-status.tsx"):
            self.assertIn(("templates/" + f, f), pairs)


class TestMoneyBackHighlight(unittest.TestCase):
    def test_yellow_orange(self):
        css = read(CSS)
        self.assertIn("--gold:#F5A623", css)
        self.assertRegex(css, r"\.st \.refund\{background:var\(--gold\)")
        self.assertRegex(css, r"\.st \.od-money\{[^}]*background:var\(--gold\)")

    def test_first_1000_emphasised(self):
        self.assertIn("<strong>{P.refund.limit}</strong>", read(HOME))
        self.assertIn("<mark>{C.foreverLimit}</mark>", read(ORDER_PAGE_C))
        self.assertIn('foreverLimit: "first 1,000 businesses"', read(os.path.join(STUDIO, "studio-order.ts")))


class TestPortfolioShelves(unittest.TestCase):
    def test_real_items_only(self):
        o = out()["shelves"]
        keys = [s["key"] for s in o["none"]]
        for k in ("pitch-deck", "print", "business-plan", "social-posts", "app-case-study"):
            self.assertIn(k, keys)
        self.assertTrue(all(s["count"] == 0 for s in o["none"]))
        some = {s["key"]: s["count"] for s in o["some"]}
        self.assertEqual(some["pitch-deck"], 1)
        self.assertEqual(some["print"], 1)
        self.assertEqual(some["app-case-study"], 0)

    def test_empty_state(self):
        w = read(WORK)
        self.assertIn("showcaseShelves(sites)", w)
        self.assertIn("SHOWCASE_SHELF_COPY.soon", w)


# ---- Gatekeeper notes on #83 ------------------------------------------------

class TestItnSignatureNoTrim(unittest.TestCase):
    def test_itn_values_as_posted(self):
        o = out()["itn"]
        self.assertTrue(o["ok"])
        self.assertFalse(o["trimmedSigFails"])
        self.assertEqual(o["reqTrims"], "a=x")
        self.assertEqual(o["itnKeeps"], "a=+x+")


class TestItnRoute(unittest.TestCase):
    def test_amount_from_order_fields(self):
        o = out()["itn"]
        self.assertTrue(o["amountOk"])
        self.assertFalse(o["amountBad"])
        self.assertFalse(o["amountNoOrder"])
        self.assertEqual(o["expectedLogo"], 2850)
        f = dict(o["fields"])
        self.assertEqual(f["custom_str1"], "Website and brand bundle")
        self.assertEqual(f["custom_str2"], "designLogo")

    def test_source_ip(self):
        o = out()["itn"]
        self.assertEqual(o["ipFwd"], "197.97.145.144")
        self.assertEqual(o["ipReal"], "144.126.193.139")
        self.assertTrue(o["allowed"])
        self.assertTrue(o["allowed2"])
        self.assertFalse(o["denied"])
        self.assertFalse(o["empty"])
        self.assertEqual(o["hosts"], ["www.payfast.co.za", "sandbox.payfast.co.za", "w1w.payfast.co.za", "w2w.payfast.co.za"])

    def test_route_order_and_non_200(self):
        src = code(ITN_ROUTE)
        i_sig = src.index("studioPayfastItnValid(")
        i_ip = src.index("studioPayfastIpAllowed(studioItnSourceIp(request.headers), studioDnsResolve)")
        i_amt = src.index("studioItnAmountOk(fields)")
        i_val = src.index("cfg.validateUrl")
        self.assertLess(i_sig, i_ip)
        self.assertLess(i_ip, i_amt)
        self.assertLess(i_amt, i_val)
        tail = src[i_val:]
        self.assertIn("if (!confirmed)", tail)
        self.assertIn("console.warn", tail.split("if (!confirmed)")[1].split("}")[0])
        self.assertRegex(tail.split("if (!confirmed)")[1], r'status: 400')
        self.assertLess(tail.index("if (!confirmed)"), tail.index('new Response("ok", { status: 200 })'))


class TestPaidReturnText(unittest.TestCase):
    def test_never_payment_received(self):
        o = read(os.path.join(STUDIO, "studio-order.ts"))
        self.assertIn('paidTitle: "Thanks, your payment went through."', o)
        self.assertIn('paidText: "We\'ve started on your order."', o)
        self.assertNotIn("clears", code(os.path.join(STUDIO, "studio-order.ts")))
        self.assertIn("` Your reference is ${back.ref}.`", read(os.path.join(STUDIO, "studio-order-page.tsx")))
        self.assertNotIn("Payment received", code(os.path.join(STUDIO, "studio-order.ts")))


class TestCardPost(unittest.TestCase):
    def test_name_email_not_in_url(self):
        href = out()["href"]
        self.assertNotIn("name=", href)
        self.assertNotIn("email=", href)
        f = read(FORM)
        self.assertIn('<form method="post" action={STUDIO_PAY_API}>', f)
        self.assertNotIn("studioPayHref", f)
        pay = code(PAY_ROUTE)
        self.assertIn("export async function POST", pay)
        self.assertIn("name: withContact ?", pay)
        self.assertIn('payPage(url.origin, (k) => url.searchParams.get(k) ?? "", false)', pay)

    def test_stale_whatsapp_comment_gone(self):
        head = read(FORM).split('"use client"', 1)[0]
        self.assertNotIn("WhatsApp", head)



class TestFavicon(unittest.TestCase):
    """1.21.3 (Ray): "cortex is rebranded but it is still using R favicon"."""

    def test_icon_registered_and_shipped(self):
        meta = read(os.path.join(T, "components", "custom", "landing", "hosting-site-metadata.ts"))
        self.assertIn('icon: "/studio/brand/c-mark.png",', meta)
        for name in ("c-mark.png", "c-mark.svg"):
            self.assertTrue(os.path.isfile(os.path.join(T, "public", "studio", "brand", name)), name)
        m = json.loads(read(os.path.join(SDK_ROOT, "manifest.json")))
        pairs = {(i["from"], i["to"]) for i in m["app_type"]["hosting"]["installs"]}
        self.assertIn(("templates/public/studio/brand", "public/studio/brand"), pairs)
        with open(os.path.join(T, "public", "studio", "brand", "c-mark.png"), "rb") as f:
            head = f.read(24)
        self.assertEqual(head[:8], b"\x89PNG\r\n\x1a\n")
        self.assertGreaterEqual(int.from_bytes(head[16:20], "big"), 180)


if __name__ == "__main__":
    unittest.main()


class TestWhatsAppContactOnly(unittest.TestCase):
    """Ray, 9 Nov: every form (home brief and /order) submits by email only;
    WhatsApp appears only as a plain "Chat on WhatsApp" link in the contact
    section, carrying no form data, and never in the order flow."""

    def test_order_flow_has_no_whatsapp(self):
        for p in (FORM, ORDER_PAGE_C, ORDER_PAGE, ORDER_ROUTE, PAY_ROUTE):
            self.assertNotIn("whatsapp", code(p).lower(), p)
        o = code(os.path.join(STUDIO, "studio-order.ts"))
        order_copy = o.split("export const STUDIO_ORDER_COPY", 1)[1].split("} as const;", 1)[0]
        self.assertNotIn("WhatsApp", order_copy)
        terms = out()["source"]["terms"]
        self.assertFalse(any("WhatsApp" in t for t in terms))
        fields = o.split("export const STUDIO_ORDER_FIELDS", 1)[1].split("];", 1)[0]
        self.assertNotIn("WhatsApp", fields)

    def test_home_form_emails_and_contact_link(self):
        client = read(os.path.join(STUDIO, "studio-client.tsx"))
        form = client.split("export function StudioIntakeForm()", 1)[1].split("\nexport function", 1)[0]
        self.assertIn('fetch("/api/studio/brief"', form)
        self.assertNotIn("whatsapp", form.lower())
        self.assertIn('primary: "Chat on WhatsApp"', read(COPY))
        home = read(HOME)
        contact = home.split('id="contact"', 1)[1]
        self.assertIn('<a className="btn btn-acc" href={STUDIO_WHATSAPP_URL}>\n                  {C.primary}', contact)


class TestPayStartNoteInEmail(unittest.TestCase):
    """1.21.8 (Ray): the payment note is in the customer's order email, not on the Pay step."""

    NOTE = ("Your 24-hour turnaround starts once we receive your payment. Paying from a bank other than "
            "Capitec? Reply to this email with your proof of payment and your reference so we can start right away.")

    def test_not_on_page(self):
        form = read(os.path.join(SDK_ROOT, "templates/components/custom/studio/studio-order-form.tsx"))
        self.assertNotIn("pay-start", form)
        self.assertNotIn("startNote", form)
        self.assertNotIn("pay.email", form)
        css = read(os.path.join(SDK_ROOT, "templates/components/custom/studio/studio.css"))
        self.assertNotIn("pay-start", css)
        page = read(os.path.join(SDK_ROOT, "templates/app/order/page.tsx"))
        self.assertIn("const pay = { card: studioPayfastConfig().enabled };", page)

    def test_in_customer_email(self):
        pay = read(os.path.join(SDK_ROOT, "templates/components/custom/studio/studio-pay.ts"))
        a, b = self.NOTE.split(" Paying", 1)
        self.assertIn('startNote: "%s"' % a, pay)
        self.assertIn('popNote: "Paying%s"' % b, pay)
        self.assertNotIn("popNoteEnd", pay)
        mail = read(os.path.join(SDK_ROOT, "templates/components/custom/studio/studio-order-mail.ts"))
        ack = mail.split("The acknowledgement, to the client", 1)[1].split("return {", 1)[0]
        self.assertIn("`${P.startNote} ${P.popNote}`", ack)
        self.assertIn("${esc(P.startNote)}</b> ${esc(P.popNote)}", ack)
        order = mail.split("The order, to the studio", 1)[1].split("The acknowledgement", 1)[0]
        self.assertNotIn("startNote", order)
