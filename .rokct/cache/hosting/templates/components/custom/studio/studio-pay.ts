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

// Paying for a studio order (hosting_sdk 1.19.0). Ray, 2026-11-02: no
// backend yet, so this is a plain browser form POST to PayFast's process
// URL. It is the ONLY file that knows about a gateway: when the backend and
// the gateway SDK arrive, replace studioPayConfig() and studioPay() here and
// the stepper does not change.
//
// Settings are public build-time variables (NEXT_PUBLIC_*), written out in
// full so Next inlines them. With no merchant id or key the pay button is
// hidden and the order goes by email only. No passphrase signature: that
// needs a server to keep the passphrase secret, so it waits for the backend.

export const STUDIO_PAYFAST_URL = {
  live: "https://www.payfast.co.za/eng/process",
  sandbox: "https://sandbox.payfast.co.za/eng/process",
} as const;

export interface StudioPayConfig {
  enabled: boolean;
  action: string;
  merchantId: string;
  merchantKey: string;
}

export function studioPayConfig(): StudioPayConfig {
  const merchantId = (process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID ?? "").trim();
  const merchantKey = (process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_KEY ?? "").trim();
  const sandbox = /^(1|true|yes)$/i.test((process.env.NEXT_PUBLIC_PAYFAST_SANDBOX ?? "").trim());
  return {
    enabled: Boolean(merchantId && merchantKey),
    action: sandbox ? STUDIO_PAYFAST_URL.sandbox : STUDIO_PAYFAST_URL.live,
    merchantId,
    merchantKey,
  };
}

export interface StudioPayment {
  /** Whole rand. */
  amountZar: number;
  itemName: string;
  /** Our order reference, sent back on the return URL. */
  ref: string;
  email?: string;
  name?: string;
  /** Where the order page lives, e.g. https://example.co.za/order. */
  pageUrl: string;
}

/** The fields PayFast's process URL takes, in its documented order. */
export function studioPayFields(c: StudioPayConfig, p: StudioPayment): [string, string][] {
  const back = (q: string) => `${p.pageUrl}${p.pageUrl.includes("?") ? "&" : "?"}${q}`;
  const [first, ...rest] = (p.name ?? "").trim().split(/\s+/);
  const f: [string, string][] = [
    ["merchant_id", c.merchantId],
    ["merchant_key", c.merchantKey],
    ["return_url", back(`paid=${encodeURIComponent(p.ref)}`)],
    ["cancel_url", back("cancelled=1")],
  ];
  if (first) f.push(["name_first", first.slice(0, 100)]);
  if (rest.length) f.push(["name_last", rest.join(" ").slice(0, 100)]);
  if (p.email) f.push(["email_address", p.email.slice(0, 100)]);
  if (p.ref) f.push(["m_payment_id", p.ref.slice(0, 100)]);
  f.push(["amount", p.amountZar.toFixed(2)], ["item_name", p.itemName.slice(0, 100)]);
  return f;
}

/** Sends the browser to PayFast with a plain form POST. Browser only. */
export function studioPay(p: StudioPayment, c: StudioPayConfig = studioPayConfig()): void {
  if (!c.enabled) return;
  const form = document.createElement("form");
  form.method = "POST";
  form.action = c.action;
  form.style.display = "none";
  for (const [k, v] of studioPayFields(c, p)) {
    const i = document.createElement("input");
    i.type = "hidden";
    i.name = k;
    i.value = v;
    form.appendChild(i);
  }
  document.body.appendChild(form);
  form.submit();
}
