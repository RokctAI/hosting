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

// Paying for a studio order (hosting_sdk 1.19.0; rebuilt 1.20.7, Ray,
// 2026-11-09: "the client must pay before leaving"). After the order is
// sent, the form shows a payment step with two options:
//   (a) bank transfer to the details below, with the order reference as
//       the payment reference;
//   (b) card through PayFast, signed ON THE SERVER (studio-payfast.ts,
//       /api/studio/pay) so the passphrase never reaches a browser. With no
//       PayFast settings the card option shows as "coming soon".
// This file is pure and browser-safe: no environment reads, no node APIs.

export const STUDIO_PAYFAST_URL = {
  live: "https://www.payfast.co.za/eng/process",
  sandbox: "https://sandbox.payfast.co.za/eng/process",
} as const;

export const STUDIO_PAYFAST_VALIDATE_URL = {
  live: "https://www.payfast.co.za/eng/query/validate",
  sandbox: "https://sandbox.payfast.co.za/eng/query/validate",
} as const;

/** The bank account clients pay into. The account number is an env var (STUDIO_BANK_ACCOUNT), read on the server. */
export const STUDIO_BANK = {
  holder: "ROKCT INTELLIGENCE (PTY) LTD",
  bank: "Capitec Business",
  branch: "470010",
} as const;

export const STUDIO_PAY_COPY = {
  title: "Pay for your order",
  lede: "Your order is in. Pay now to start: by bank transfer or by card.",
  bankTitle: "Bank transfer (EFT)",
  holder: "Account holder",
  bank: "Bank",
  branch: "Branch code",
  account: "Account number",
  accountMissing: "Our team emails you the account number",
  reference: "Payment reference",
  copy: "Copy",
  copied: "Copied",
  bankNote: "Use the reference exactly, so we can match your payment. Work starts once it clears.",
  cardTitle: "Card",
  cardButton: "Pay by card with PayFast",
  cardSoon: "Card payments are coming soon. Please pay by bank transfer for now.",
  amount: "Amount (ZAR)",
} as const;

/** PHP urlencode, which PayFast's signature uses: spaces as +, uppercase hex, only A-Z a-z 0-9 - _ . kept. */
export function studioPhpUrlencode(v: string): string {
  return encodeURIComponent(v)
    .replace(/[!'()*~]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase())
    .replace(/%20/g, "+");
}

/**
 * PayFast's signature string: `key=urlencode(trim(value))` joined with &,
 * then `&passphrase=...` when one is set. For a payment request empty values
 * are left out; for an ITN every posted field but `signature` is kept.
 */
export function studioPayfastParamString(fields: [string, string][], passphrase: string, keepEmpty = false): string {
  const parts = fields
    .filter(([k, v]) => k !== "signature" && (keepEmpty || v.trim() !== ""))
    .map(([k, v]) => `${k}=${studioPhpUrlencode(v.trim())}`);
  const pass = passphrase.trim();
  if (pass) parts.push(`passphrase=${studioPhpUrlencode(pass)}`);
  return parts.join("&");
}

export interface StudioPayment {
  /** Whole rand. */
  amountZar: number;
  itemName: string;
  /** Our order reference: m_payment_id and the return URL. */
  ref: string;
  email?: string;
  name?: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
}

/** The fields PayFast's process URL takes, in its documented order (unsigned). */
export function studioPayFields(merchantId: string, merchantKey: string, p: StudioPayment): [string, string][] {
  const [first, ...rest] = (p.name ?? "").trim().split(/\s+/);
  const f: [string, string][] = [
    ["merchant_id", merchantId],
    ["merchant_key", merchantKey],
    ["return_url", p.returnUrl],
    ["cancel_url", p.cancelUrl],
    ["notify_url", p.notifyUrl],
  ];
  if (first) f.push(["name_first", first.slice(0, 100)]);
  if (rest.length) f.push(["name_last", rest.join(" ").slice(0, 100)]);
  if (p.email) f.push(["email_address", p.email.slice(0, 100)]);
  if (p.ref) f.push(["m_payment_id", p.ref.slice(0, 100)]);
  f.push(["amount", p.amountZar.toFixed(2)], ["item_name", p.itemName.slice(0, 100)]);
  return f;
}

/** The card link for an order: our server route, which signs and forwards to PayFast. */
export function studioPayHref(ref: string, service: string, addons: readonly string[], name = "", email = "", origin = ""): string {
  const q = new URLSearchParams({ ref, service, addons: addons.join(","), name, email });
  return `${origin}/api/studio/pay?${q.toString()}`;
}
