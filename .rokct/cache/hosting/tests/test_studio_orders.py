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

"""hosting_sdk 1.18.0: the studio order flow.

  * Ray, 2026-11-01: briefs, logos, photos and orders go to the orders
    address, by email through our own mail VPS (mail.rokct.ai, Exim), never
    a third-party mail API. The address is orders@<the host the site is
    served on, without www.>, worked out per request; a *.vercel.app or
    localhost host falls back to orders@rokct.ai; STUDIO_ORDERS_EMAIL is an
    optional override that wins.
  * The client gets an acknowledgement: thanks, what they ordered, the first
    render within 24 hours of the brief or a full refund, the Terms from
    website-service/offer-and-intake.md, and that replies and extra files go
    to the orders address. No step value is printed until all five are set.
  * Without SMTP_USER and SMTP_PASS the form fails gracefully, offers
    WhatsApp, and never crashes. No secret value is ever logged.

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

COPY = os.path.join(STUDIO, "studio-copy.ts")
ORDER = os.path.join(STUDIO, "studio-order.ts")
CONFIG = os.path.join(STUDIO, "studio-order-config.ts")
MAIL = os.path.join(STUDIO, "studio-order-mail.ts")
SEND = os.path.join(STUDIO, "studio-order-send.ts")
FORM = os.path.join(STUDIO, "studio-order-form.tsx")
PAGE_BODY = os.path.join(STUDIO, "studio-order-page.tsx")
HOME = os.path.join(STUDIO, "studio-home.tsx")
PAGE = os.path.join(TEMPLATES, "app", "order", "page.tsx")
ROUTE = os.path.join(TEMPLATES, "app", "api", "studio", "order", "route.ts")
MANIFEST = os.path.join(SDK_ROOT, "manifest.json")
CHANGELOG = os.path.join(SDK_ROOT, "CHANGELOG.md")
NEW_FILES = (ORDER, CONFIG, MAIL, SEND, FORM, PAGE_BODY, PAGE, ROUTE)

ENV_VARS = ("STUDIO_ORDERS_EMAIL", "STUDIO_MAIL_FROM", "SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS")

AGPL_TS = "/*\n * Copyright (c) 2026 ROKCT INTELLIGENCE (PTY) LTD\n *\n * This program is free software: you can redistribute it and/or modify\n * it under the terms of the GNU Affero General Public License as published\n * by the Free Software Foundation, version 3."


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def code_only(src):
    """The source without comments, so a test reads what runs."""
    src = re.sub(r"/\*.*?\*/", "", src, flags=re.DOTALL)
    src = re.sub(r"\{/\*.*?\*/\}", "", src, flags=re.DOTALL)
    return "\n".join(re.sub(r"(^|\s)//.*$", "", line) for line in src.splitlines())


def all_template_sources():
    for root, _dirs, files in os.walk(TEMPLATES):
        for name in files:
            if name.endswith((".ts", ".tsx", ".css", ".json")):
                yield os.path.join(root, name)


def run_node(script):
    """Stages the pure order modules beside `script` and runs it under
    node's type stripping; returns the parsed JSON it prints last. Skips
    when no node with --experimental-strip-types is on PATH."""
    node = shutil.which("node")
    if not node:
        raise unittest.SkipTest("node not on PATH")
    with tempfile.TemporaryDirectory() as tmp:
        for src in (COPY, ORDER, CONFIG, MAIL):
            body = re.sub(r'from "\./(studio-[a-z-]+)";', r'from "./\1.ts";', read(src))
            with open(os.path.join(tmp, os.path.basename(src)), "w", encoding="utf-8") as f:
                f.write(body)
        probe = os.path.join(tmp, "probe.mts")
        with open(probe, "w", encoding="utf-8") as f:
            f.write(script)
        run = subprocess.run([node, "--experimental-strip-types", "--no-warnings", probe],
                             capture_output=True, text=True, timeout=60, cwd=tmp, check=False)
    if run.returncode != 0 and "strip-types" in run.stderr:
        raise unittest.SkipTest("node has no type stripping")
    if run.returncode != 0:
        raise AssertionError(run.stderr)
    return json.loads(run.stdout.strip().splitlines()[-1])


CONFIG_PROBE = """
import { studioOrdersEmail, studioMailDomain, studioMailConfig, studioMailStatus, STUDIO_ORDER_ENV_VARS } from './studio-order-config.ts';
const out = {
  none: studioOrdersEmail({}, null),
  custom: studioOrdersEmail({}, 'mystudio.co.za'),
  www: studioOrdersEmail({}, 'www.mystudio.co.za'),
  wwwPortCase: studioOrdersEmail({}, 'WWW.MyStudio.com:443'),
  sub: studioOrdersEmail({}, 'studio.example.org'),
  vercel: studioOrdersEmail({}, 'hosting-beta-one.vercel.app'),
  vercelWww: studioOrdersEmail({}, 'www.hosting-beta-one.vercel.app'),
  localhost: studioOrdersEmail({}, 'localhost:3000'),
  subLocalhost: studioOrdersEmail({}, 'shop.localhost'),
  ip: studioOrdersEmail({}, '127.0.0.1:3000'),
  ipv6: studioOrdersEmail({}, '[::1]:3000'),
  junk: studioOrdersEmail({}, 'evil.com/<script>'),
  override: studioOrdersEmail({ STUDIO_ORDERS_EMAIL: 'briefs@studio.example' }, 'mystudio.co.za'),
  overrideOnVercel: studioOrdersEmail({ STUDIO_ORDERS_EMAIL: ' briefs@studio.example ' }, 'x.vercel.app'),
  badOverride: studioOrdersEmail({ STUDIO_ORDERS_EMAIL: 'not an address' }, 'mystudio.co.za'),
  emptyOverride: studioOrdersEmail({ STUDIO_ORDERS_EMAIL: '' }, 'mystudio.co.za'),
  domain: studioMailDomain('www.mystudio.co.za'),
  defaults: studioMailConfig({}, 'mystudio.co.za'),
  overrides: studioMailConfig({ SMTP_HOST: 'smtp.example.net', SMTP_PORT: '465', SMTP_USER: 'u1', SMTP_PASS: 'p1', STUDIO_MAIL_FROM: 'Studio <hi@studio.example>' }, 'mystudio.co.za'),
  badPort: studioMailConfig({ SMTP_PORT: 'abc', SMTP_USER: 'u1' }, null),
  status: studioMailStatus({ SMTP_USER: 'secret-user-xyz', SMTP_PASS: 'secret-pass-xyz' }),
  vars: STUDIO_ORDER_ENV_VARS,
};
console.log(JSON.stringify(out));
"""


class TestOrdersAddress(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.out = run_node(CONFIG_PROBE)

    def test_default_is_rokct_ai_without_a_host(self):
        self.assertEqual(self.out["none"], "orders@rokct.ai")

    def test_custom_domain_gives_orders_at_that_domain(self):
        self.assertEqual(self.out["custom"], "orders@mystudio.co.za")
        self.assertEqual(self.out["sub"], "orders@studio.example.org")

    def test_www_is_stripped(self):
        self.assertEqual(self.out["www"], "orders@mystudio.co.za")
        self.assertEqual(self.out["wwwPortCase"], "orders@mystudio.com")
        self.assertEqual(self.out["domain"], "mystudio.co.za")

    def test_vercel_app_falls_back_to_rokct_ai(self):
        self.assertEqual(self.out["vercel"], "orders@rokct.ai")
        self.assertEqual(self.out["vercelWww"], "orders@rokct.ai")

    def test_localhost_and_ip_fall_back_to_rokct_ai(self):
        for k in ("localhost", "subLocalhost", "ip", "ipv6", "junk"):
            self.assertEqual(self.out[k], "orders@rokct.ai", k)

    def test_env_override_wins(self):
        self.assertEqual(self.out["override"], "briefs@studio.example")
        self.assertEqual(self.out["overrideOnVercel"], "briefs@studio.example")

    def test_bad_or_empty_override_is_ignored(self):
        self.assertEqual(self.out["badOverride"], "orders@mystudio.co.za")
        self.assertEqual(self.out["emptyOverride"], "orders@mystudio.co.za")


class TestMailConfig(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.out = run_node(CONFIG_PROBE)

    def test_smtp_defaults(self):
        d = self.out["defaults"]
        self.assertEqual(d["host"], "mail.rokct.ai")
        self.assertEqual(d["port"], 587)
        self.assertFalse(d["secure"])
        self.assertEqual(d["from"], "ROKCT Studio <orders@mystudio.co.za>")
        self.assertEqual(d["ordersEmail"], "orders@mystudio.co.za")

    def test_smtp_env_overrides(self):
        o = self.out["overrides"]
        self.assertEqual(o["host"], "smtp.example.net")
        self.assertEqual(o["port"], 465)
        self.assertTrue(o["secure"])
        self.assertEqual(o["from"], "Studio <hi@studio.example>")
        self.assertTrue(o["configured"])
        self.assertEqual(o["missing"], [])

    def test_unconfigured_names_what_is_missing(self):
        d = self.out["defaults"]
        self.assertFalse(d["configured"])
        self.assertEqual(d["missing"], ["SMTP_USER", "SMTP_PASS"])
        b = self.out["badPort"]
        self.assertEqual(b["port"], 587)
        self.assertEqual(b["missing"], ["SMTP_PASS"])

    def test_status_carries_no_secret(self):
        s = json.dumps(self.out["status"])
        self.assertNotIn("secret-user-xyz", s)
        self.assertNotIn("secret-pass-xyz", s)
        self.assertTrue(self.out["status"]["configured"])

    def test_env_var_names(self):
        self.assertEqual(tuple(self.out["vars"]), ENV_VARS)


class TestNothingHardcoded(unittest.TestCase):
    def test_addresses_written_only_as_config_defaults(self):
        for path in all_template_sources():
            if path == CONFIG:
                continue
            body = code_only(read(path))
            for needle in ("@rokct.ai", "mail.rokct.ai", "orders@"):
                self.assertNotIn(needle, body, f"{needle} hardcoded in {os.path.relpath(path, SDK_ROOT)}")

    def test_config_writes_each_default_once(self):
        body = code_only(read(CONFIG))
        self.assertEqual(body.count('"orders@rokct.ai"'), 1)
        self.assertEqual(body.count('"mail.rokct.ai"'), 1)
        self.assertEqual(body.count("orders@"), 2)  # the default and the host template

    def test_every_reader_asks_config(self):
        self.assertIn("studioMailConfig(undefined, studioRequestHost(request.headers))", read(ROUTE))
        self.assertIn("studioOrdersEmail(undefined, studioRequestHost(await headers()))", read(PAGE))

    def test_config_reads_env_only_through_process_env(self):
        body = code_only(read(CONFIG))
        for name in ENV_VARS:
            self.assertIn(f"e.{name}" if name != "STUDIO_ORDERS_EMAIL" else "envOf(env).STUDIO_ORDERS_EMAIL", body)


MAIL_PROBE = """
import { validateStudioOrder, createStudioRateLimiter, STUDIO_ORDER_MAX_BYTES, studioOrderTerms } from './studio-order.ts';
import { buildStudioOrderMails } from './studio-order-mail.ts';
const base = {
  service: 'Website and brand bundle', name: 'Thandi M', email: 'thandi@example.com', phone: '+27 82 000 0000',
  business: 'Thandi Bakes', sells: 'Cakes for weddings', area: 'Polokwane', colour: 'orange', likes: 'a.com - clean',
  pages: ['Home', 'Contact', 'Bogus'], pagesOther: 'Menu', siteContact: '082 000 0000', asks: 'Do you deliver?', notes: '',
  noLogo: 'yes', terms: 'yes',
};
const files = [{ field: 'logo', name: '../../etc/My Logo!.png', type: 'image/png', size: 1000 }];
const ok = validateStudioOrder(base, files);
const att = [{ filename: 'My Logo.png', contentType: 'image/png', content: new Uint8Array([1,2,3]) }];
const cfg = { from: 'ROKCT Studio <orders@mystudio.co.za>', ordersEmail: 'orders@mystudio.co.za' };
const mails = buildStudioOrderMails(ok.order, att, cfg, 'RK-20261101-ABC123');
const valued = buildStudioOrderMails(ok.order, att, cfg, 'RK-1', [850, 2125, 2125, 2125, 1275]);
const partial = buildStudioOrderMails(ok.order, att, cfg, 'RK-2', [850, null, 2125, 2125, 1275]);
const lim = createStudioRateLimiter(2, 1000);
const out = {
  ok: ok.ok, order: ok.order, mails, valuedText: valued.ack.text, valuedHtml: valued.ack.html, partialText: partial.ack.text,
  terms: studioOrderTerms('orders@mystudio.co.za'),
  missing: validateStudioOrder({ terms: 'yes' }, []),
  badEmail: validateStudioOrder({ ...base, email: 'nope' }, []),
  badService: validateStudioOrder({ ...base, service: 'Free stuff' }, []),
  noTerms: validateStudioOrder({ ...base, terms: '' }, []),
  trap: validateStudioOrder({ ...base, company_url: 'http://spam' }, []),
  badType: validateStudioOrder(base, [{ field: 'logo', name: 'x.exe', type: 'application/x-msdownload', size: 10 }]),
  tooBig: validateStudioOrder(base, [{ field: 'photos', name: 'a.jpg', type: 'image/jpeg', size: STUDIO_ORDER_MAX_BYTES + 1 }]),
  tooMany: validateStudioOrder(base, Array.from({ length: 9 }, (_, i) => ({ field: 'photos', name: i + '.jpg', type: 'image/jpeg', size: 10 }))),
  injected: validateStudioOrder({ ...base, business: 'Evil\\r\\nBcc: x@y.z' }, []),
  limiter: [lim.allow('a', 0), lim.allow('a', 1), lim.allow('a', 2), lim.allow('b', 2), lim.allow('a', 1500)],
};
console.log(JSON.stringify(out));
"""


class TestEmails(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.out = run_node(MAIL_PROBE)
        cls.ack = cls.out["mails"]["ack"]
        cls.order = cls.out["mails"]["order"]

    def test_order_goes_to_orders_address_with_every_field_and_file(self):
        o = self.order
        self.assertEqual(o["to"], "orders@mystudio.co.za")
        self.assertEqual(o["replyTo"], "thandi@example.com")
        for label in ("What you are ordering", "Your name", "Your email", "Your WhatsApp number", "Business name",
                      "What you sell or do, in one sentence", "Town or area you serve", "Your brand colour",
                      "Three websites you like", "Pages you want", "Phone, WhatsApp and email to show on your site",
                      "Anything customers always ask you", "Anything else we should know", "I don't have a logo",
                      "I'd like an online shop too", "I'd like an app too", "Files"):
            self.assertIn(label, o["text"], label)
        for value in ("Thandi Bakes", "Cakes for weddings", "Polokwane", "orange", "Do you deliver?", "Home, Contact, Other: Menu"):
            self.assertIn(value, o["text"])
        self.assertEqual(len(o["attachments"]), 1)
        self.assertEqual(o["attachments"][0]["filename"], "My Logo.png")

    def test_file_names_are_made_safe(self):
        self.assertEqual(self.out["order"]["files"][0]["name"], "My Logo.png")
        self.assertEqual(self.out["order"]["pages"], ["Home", "Contact"])

    def test_ack_goes_to_client_with_reply_to_orders(self):
        self.assertEqual(self.ack["to"], "thandi@example.com")
        self.assertEqual(self.ack["replyTo"], "orders@mystudio.co.za")
        self.assertEqual(self.ack["attachments"], [])

    def test_ack_thanks_and_restates_the_order(self):
        for part in ("text", "html"):
            self.assertIn("Thank you", self.ack[part])
            self.assertIn("Website and brand bundle", self.ack[part])
            self.assertIn("Thandi Bakes", self.ack[part])
            self.assertIn("RK-20261101-ABC123", self.ack[part])

    def test_ack_has_the_24_hour_promise(self):
        for part in ("text", "html"):
            self.assertIn("within 24 hours of your confirmed brief", self.ack[part])
            self.assertIn("full refund", self.ack[part])

    def test_ack_shows_every_term(self):
        self.assertEqual(len(self.out["terms"]), 10)
        for t in self.out["terms"]:
            self.assertIn(f"{t['b']}: {t['t']}", self.ack["text"])
            self.assertIn(t["b"], self.ack["html"])
        joined = " ".join(t["b"] for t in self.out["terms"])
        for b in ("Payment", "Phases", "First render in 24 hours", "Step values", "Cancel anytime", "Domain", "Hosting", "Contact"):
            self.assertIn(b, joined)
        self.assertIn("orders@mystudio.co.za", self.out["terms"][-1]["t"])

    def test_ack_says_replies_and_files_go_to_orders_address(self):
        for part in ("text", "html"):
            self.assertIn("extra files (logos, photos) to orders@mystudio.co.za", self.ack[part])

    def test_no_step_values_while_unset(self):
        for part in ("text", "html"):
            self.assertNotIn("WHAT EACH PHASE IS WORTH", self.ack[part])
            self.assertNotRegex(self.ack[part], r"R\s?\d")
            self.assertNotIn("%", re.sub(r"<[^>]+>", "", self.ack[part]))
            self.assertNotIn("What each phase is worth", self.ack[part])
        self.assertNotIn("WHAT EACH PHASE IS WORTH", self.out["partialText"])
        self.assertNotRegex(self.out["partialText"], r"R\d")

    def test_step_values_show_once_all_are_set(self):
        self.assertIn("WHAT EACH PHASE IS WORTH", self.out["valuedText"])
        self.assertIn("1. Brief confirmed: R850", self.out["valuedText"])
        self.assertIn("5. Launch: R1,275", self.out["valuedText"])
        self.assertIn("What each phase is worth", self.out["valuedHtml"])

    def test_config_slot_is_empty(self):
        body = code_only(read(CONFIG))
        self.assertIn("STUDIO_STEP_VALUES_ZAR: readonly (number | null)[] = [null, null, null, null, null];", body)
        self.assertIn("@studio-step-values-slot", read(CONFIG))
        self.assertIn("@studio-step-values-slot", read(MAIL))

    def test_html_is_escaped(self):
        self.assertNotIn("<script", self.ack["html"].lower())

    def test_no_header_injection(self):
        inj = self.out["injected"]
        self.assertTrue(inj["ok"])
        self.assertNotIn("\n", inj["order"]["business"])
        self.assertNotIn("\r", inj["order"]["business"])


class TestValidation(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.out = run_node(MAIL_PROBE)

    def test_required(self):
        m = self.out["missing"]
        self.assertFalse(m["ok"])
        for k in ("name", "email", "business", "sells", "service"):
            self.assertIn(k, m["errors"])

    def test_rejections(self):
        self.assertIn("email", self.out["badEmail"]["errors"])
        self.assertIn("service", self.out["badService"]["errors"])
        self.assertIn("terms", self.out["noTerms"]["errors"])
        self.assertTrue(self.out["trap"]["bot"])
        self.assertIn("files", self.out["badType"]["errors"])
        self.assertTrue(self.out["tooBig"]["tooLarge"])
        self.assertIn("files", self.out["tooMany"]["errors"])

    def test_rate_limit(self):
        self.assertEqual(self.out["limiter"], [True, True, False, True, True])


class TestGracefulWithoutSmtp(unittest.TestCase):
    def test_route_answers_503_with_whatsapp_when_unconfigured(self):
        src = code_only(read(ROUTE))
        self.assertIn("if (!cfg.configured)", src)
        self.assertIn('fail(503, "not_configured", STUDIO_ORDER_MESSAGES.notConfigured', src)
        self.assertIn("whatsapp: studioWhatsApp(", src)
        # the check comes before anything touches the transport
        self.assertLess(src.index("if (!cfg.configured)"), src.index("sendStudioOrderMails(cfg"))

    def test_route_never_throws(self):
        src = code_only(read(ROUTE))
        body = src[src.index("export async function POST"):]
        self.assertTrue(body.lstrip().split("{", 1)[1].lstrip().startswith("try {"))
        self.assertIn('fail(500, "error"', body)

    def test_sender_refuses_unconfigured(self):
        src = code_only(read(SEND))
        self.assertIn('if (!cfg.configured) return { ok: false, code: "NOT_CONFIGURED" };', src)

    def test_message_offers_whatsapp(self):
        src = read(ORDER)
        msg = re.search(r"notConfigured:\s*\"([^\"]+)\"", src).group(1)
        self.assertIn("WhatsApp", msg)
        form = read(FORM)
        self.assertIn("failWhatsApp", form)
        self.assertIn("href={state.whatsapp}", form)
        self.assertIn("catch {", form)  # network errors and non-JSON replies land in the fail state


class TestNoSecretsLogged(unittest.TestCase):
    def test_logs_carry_codes_and_names_only(self):
        for path in (ROUTE, SEND):
            for line in code_only(read(path)).splitlines():
                if "console." in line:
                    for bad in ("pass", "cfg.user", "auth", "env.", ", err)", "err.message", "JSON.stringify(cfg"):
                        self.assertNotIn(bad, line, f"{os.path.basename(path)}: {line.strip()}")

    def test_transport_debug_off(self):
        src = read(SEND)
        self.assertIn("logger: false", src)
        self.assertIn("debug: false", src)


class TestNoThirdPartyMailApi(unittest.TestCase):
    BANNED = ("resend", "sendgrid", "mailgun", "postmark", "mailchimp", "mandrill", "sparkpost", "brevo",
              "sendinblue", "mailjet", "@aws-sdk/client-ses", "api.resend.com", "elasticemail", "smtp2go")

    def test_no_mail_api_in_sources_or_manifest(self):
        for path in list(all_template_sources()) + [MANIFEST]:
            body = read(path).lower()
            for b in self.BANNED:
                self.assertNotIn(b, body, f"{b} in {os.path.relpath(path, SDK_ROOT)}")

    def test_mail_dependency_is_nodemailer_only(self):
        h = json.loads(read(MANIFEST))["app_type"]["hosting"]
        self.assertEqual(h["dependencies"].get("nodemailer"), "^10.3.1")
        self.assertEqual(h["devDependencies"].get("@types/nodemailer"), "^8.0.2")
        self.assertIn('import nodemailer from "nodemailer";', read(SEND))
        self.assertNotIn("fetch(", code_only(read(SEND)))


class TestWiring(unittest.TestCase):
    def test_new_files_carry_the_licence(self):
        for path in NEW_FILES:
            self.assertTrue(read(path).startswith(AGPL_TS), path)

    def test_manifest_installs_every_new_file(self):
        m = json.loads(read(MANIFEST))
        self.assertEqual(m["version"], "1.20.0")
        pairs = {(i["from"], i["to"]) for i in m["app_type"]["hosting"]["installs"]}
        for path in NEW_FILES:
            rel = os.path.relpath(path, SDK_ROOT).replace(os.sep, "/")
            self.assertIn((rel, rel[len("templates/"):]), pairs, rel)
            self.assertTrue(os.path.exists(path))

    def test_home_links_the_form(self):
        home = read(HOME)
        self.assertEqual(home.count("href={STUDIO_ORDER_HREF}"), 2)

    def test_order_page_shows_terms_and_promise(self):
        body = read(PAGE_BODY)
        self.assertIn("studioOrderTerms(ordersEmail)", body)
        self.assertIn("STUDIO_ORDER_PROMISE", body)
        self.assertIn("<StudioOrderForm terms={terms} promise={STUDIO_ORDER_PROMISE} />", body)

    def test_changelog_lists_env_vars_by_name(self):
        log = read(CHANGELOG)
        self.assertTrue(log.startswith("# Changelog\n\n## 1.20.0\n"))
        entry = log.split("## 1.18.0", 1)[1].split("\n## ", 1)[0]
        for name in ENV_VARS:
            self.assertIn(name, entry)
        self.assertIn("Vercel", entry)
        self.assertIn("www.", entry)
        self.assertIn("vercel.app", entry)


class TestStepperAndPay(unittest.TestCase):
    """1.19.0: the stepper, the live price from one data file, PayFast in one module."""

    def test_prices_come_from_studio_copy_only(self):
        form = read(os.path.join(STUDIO, "studio-order-form.tsx"))
        self.assertIn("studioOrderZar(", form)
        self.assertNotRegex(form, r"\bR\d|usd:\s*\d")
        copy = read(os.path.join(STUDIO, "studio-copy.ts"))
        self.assertIn("export const STUDIO_ADDONS", copy)

    def test_five_steps_with_back_and_next(self):
        form = read(os.path.join(STUDIO, "studio-order-form.tsx"))
        self.assertEqual(form.count("hidden={step !== "), 5)
        self.assertIn("Back", form)
        self.assertIn("Next: ", form)

    def test_payfast_is_isolated_and_unsigned(self):
        pay = read(os.path.join(STUDIO, "studio-pay.ts"))
        for k in ("merchant_id", "merchant_key", "amount", "item_name", "return_url", "cancel_url"):
            self.assertIn(f'"{k}"', pay)
        self.assertNotIn("passphrase\"", pay)
        self.assertNotIn("signature\"", pay)
        for v in ("NEXT_PUBLIC_PAYFAST_MERCHANT_ID", "NEXT_PUBLIC_PAYFAST_MERCHANT_KEY", "NEXT_PUBLIC_PAYFAST_SANDBOX"):
            self.assertIn(f"process.env.{v}", pay)
        for name in os.listdir(STUDIO):
            if name != "studio-pay.ts" and name.endswith((".ts", ".tsx", ".css")):
                self.assertNotIn("payfast.co.za", read(os.path.join(STUDIO, name)), name)


if __name__ == "__main__":
    unittest.main()
