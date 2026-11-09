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

import { studioPayfastConfig, studioPayfastItnValid } from "@/components/custom/studio/studio-payfast";
import { studioPayfastParamString } from "@/components/custom/studio/studio-pay";

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
  if (get("merchant_id") !== cfg.merchantId) {
    console.warn("[studio-payfast] ITN for another merchant");
    return new Response("invalid merchant", { status: 400 });
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
  const ref = get("m_payment_id").replace(/[^A-Za-z0-9-]/g, "").slice(0, 40);
  const status = get("payment_status").replace(/[^A-Z_]/g, "").slice(0, 20);
  console.info("[studio-payfast] ITN", { ref, status, amount: get("amount_gross"), confirmed });
  return new Response("ok", { status: 200 });
}
