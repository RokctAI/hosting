/*
 * Copyright (c) 2026 ROKCT INTELLIGENCE (PTY) LTD
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

// GET /api/studio/pay (hosting_sdk 1.20.7): the card option of the payment
// step. Works the ZAR total out HERE from the service and add-ons (never
// from the browser), signs the PayFast fields with the server-only
// passphrase, and answers a page that posts them to PayFast at once, with
// return, cancel and notify URLs on this host. Card payments off (no
// PAYFAST_MERCHANT_ID / PAYFAST_MERCHANT_KEY): a 503 that says so.

import { studioOrderZar } from "@/components/custom/studio/studio-copy";
import { STUDIO_PAY_COPY } from "@/components/custom/studio/studio-pay";
import { studioPayfastConfig, studioPayfastSigned } from "@/components/custom/studio/studio-payfast";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function GET(request: Request): Promise<Response> {
  const cfg = studioPayfastConfig();
  if (!cfg.enabled) {
    return Response.json({ ok: false, code: "card_unavailable", message: STUDIO_PAY_COPY.cardSoon }, { status: 503 });
  }
  const url = new URL(request.url);
  const q = (k: string, max: number) => (url.searchParams.get(k) ?? "").trim().slice(0, max);
  const ref = q("ref", 40).replace(/[^A-Za-z0-9-]/g, "");
  const service = q("service", 80);
  const addons = q("addons", 200).split(",").filter(Boolean);
  const total = studioOrderZar(service, addons);
  if (!ref || total === null || total <= 0) {
    return Response.json({ ok: false, code: "invalid", message: "This order can't be paid by card here. Please pay by bank transfer." }, { status: 400 });
  }
  const origin = url.origin;
  const fields = studioPayfastSigned(cfg, {
    amountZar: total,
    itemName: `CORTEX ${service}`,
    ref,
    name: q("name", 120),
    email: q("email", 200),
    returnUrl: `${origin}/order?paid=${encodeURIComponent(ref)}`,
    cancelUrl: `${origin}/order?cancelled=1`,
    notifyUrl: `${origin}/api/studio/payfast/notify`,
  });
  if (!fields) return Response.json({ ok: false, code: "card_unavailable", message: STUDIO_PAY_COPY.cardSoon }, { status: 503 });
  const inputs = fields.map(([k, v]) => `<input type="hidden" name="${esc(k)}" value="${esc(v)}">`).join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>To PayFast · CORTEX</title></head><body style="font:16px/1.5 system-ui,sans-serif;padding:24px"><form id="pf" method="post" action="${esc(cfg.action)}">${inputs}<p>Taking you to PayFast to pay R${total}…</p><button type="submit">Continue to PayFast</button></form><script>document.getElementById("pf").submit()</script></body></html>`;
  return new Response(html, { status: 200, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}
