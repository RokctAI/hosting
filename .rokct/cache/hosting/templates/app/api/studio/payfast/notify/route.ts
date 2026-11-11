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

// POST /api/studio/payfast/notify (hosting_sdk 1.20.7): PayFast's ITN. The
// signature is checked against the posted fields in their posted order and
// our passphrase; then the data is confirmed with PayFast's own validate
// endpoint. Only the reference, status and outcome are logged, never the
// merchant settings. There is no order database yet, so a valid COMPLETE
// payment is logged for our team to match by reference.

// 1.20.8 (gatekeeper notes on #83): the signature covers the values exactly
// as posted (no trimming); the caller must be one of PayFast's documented
// hosts (resolved now; x-forwarded-for on Vercel); amount_gross must equal
// the amount recomputed from the package and add-ons carried in custom_str1
// and custom_str2; and anything PayFast's validate endpoint does not call
// VALID gets a non-200 answer and a warning.

import {
  studioDnsResolve,
  studioItnAmountOk,
  studioItnSourceIp,
  studioPayfastConfig,
  studioPayfastIpAllowed,
  studioPayfastItnValid,
} from "@/components/custom/studio/studio-payfast";
import { studioPayfastParamString } from "@/components/custom/studio/studio-pay";
import { studioMailConfig, studioRequestHost } from "@/components/custom/studio/studio-order-config";
import { buildStudioPaidMails } from "@/components/custom/studio/studio-order-mail";
import { sendStudioPaidMails } from "@/components/custom/studio/studio-order-send";

// 1.21.10 (Ray): a VALID, COMPLETE ITN sends two emails: "Card payment
// received" to the orders inbox and "Payment received, work has started" to
// the payer (Reply-To the orders inbox). A failed send never changes the 200
// to PayFast; only the ref is logged. Repeat ITNs for the same pf_payment_id
// are skipped in this process only (no database yet), so a restart or a
// second server instance can still send twice.
const studioPaidSent = new Set<string>();

async function studioSendPaid(request: Request, get: (k: string) => string, ref: string): Promise<void> {
  const pfId = get("pf_payment_id").replace(/[^A-Za-z0-9-]/g, "").slice(0, 40);
  const key = pfId || ref;
  if (studioPaidSent.has(key)) return;
  studioPaidSent.add(key);
  if (studioPaidSent.size > 5000) studioPaidSent.delete(studioPaidSent.values().next().value as string);
  try {
    const cfg = studioMailConfig(undefined, studioRequestHost(request.headers));
    const mails = buildStudioPaidMails(
      { ref, amount: get("amount_gross"), nameFirst: get("name_first"), nameLast: get("name_last"), email: get("email_address"), pfPaymentId: pfId },
      { from: cfg.from, ordersEmail: cfg.ordersEmail },
    );
    const sent = await sendStudioPaidMails(cfg, mails);
    if (!sent.order || !sent.ack) console.warn("[studio-payfast] payment email not sent", { ref, order: sent.order, ack: sent.ack });
  } catch {
    console.warn("[studio-payfast] payment email not sent", { ref });
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const cfg = studioPayfastConfig();
  if (!cfg.enabled) return new Response("card payments off", { status: 503 });
  let raw = "";
  try {
    raw = await request.text();
  } catch {
    return new Response("bad request", { status: 400 });
  }
  const fields = [...new URLSearchParams(raw).entries()] as [string, string][];
  if (!studioPayfastItnValid(fields, cfg.passphrase)) {
    console.warn("[studio-payfast] ITN signature mismatch");
    return new Response("invalid signature", { status: 400 });
  }
  const get = (k: string) => fields.find(([f]) => f === k)?.[1] ?? "";
  const ref = get("m_payment_id").replace(/[^A-Za-z0-9-]/g, "").slice(0, 40);
  if (get("merchant_id") !== cfg.merchantId) {
    console.warn("[studio-payfast] ITN for another merchant");
    return new Response("invalid merchant", { status: 400 });
  }
  if (!(await studioPayfastIpAllowed(studioItnSourceIp(request.headers), studioDnsResolve))) {
    console.warn("[studio-payfast] ITN from an address that is not PayFast's", { ref });
    return new Response("invalid source", { status: 403 });
  }
  if (!studioItnAmountOk(fields)) {
    console.warn("[studio-payfast] ITN amount does not match the order", { ref, amount: get("amount_gross") });
    return new Response("amount mismatch", { status: 400 });
  }
  let confirmed = false;
  try {
    const res = await fetch(cfg.validateUrl, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: studioPayfastParamString(fields, "", true),
      signal: AbortSignal.timeout(8000),
    });
    confirmed = res.ok && (await res.text()).trim() === "VALID";
  } catch {
    confirmed = false;
  }
  const status = get("payment_status").replace(/[^A-Z_]/g, "").slice(0, 20);
  if (!confirmed) {
    console.warn("[studio-payfast] ITN not confirmed VALID by PayFast", { ref, status });
    return new Response("not validated", { status: 400 });
  }
  console.info("[studio-payfast] ITN", { ref, status, amount: get("amount_gross"), confirmed });
  if (status === "COMPLETE") await studioSendPaid(request, get, ref);
  return new Response("ok", { status: 200 });
}
