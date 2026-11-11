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
  /** 1.21.6: Capitec's public SWIFT code; STUDIO_BANK_SWIFT overrides it on the server. */
  swift: "CABLZAJJ",
} as const;

export const STUDIO_PAY_COPY = {
  title: "Pay for your order",
  lede: "Your order is in. Pay now to start: by bank transfer or by card.",
  bankTitle: "Bank transfer (EFT)",
  holder: "Account holder",
  bank: "Bank",
  branch: "Branch code",
  swift: "SWIFT code",
  account: "Account number",
  accountMissing: "Our team emails you the account number",
  reference: "Payment reference",
  copy: "Copy",
  copied: "Copied",
  bankNote: "Use the reference exactly, so we can match your payment. Work starts once it clears.",
  // 1.21.8 (Ray): in the customer's order email, not on the page (1.21.7 had it on the Pay step).
  startNote: "Your 24-hour turnaround starts once we receive your payment.",
  popNote: "Paying from a bank other than Capitec? Reply to this email with your proof of payment and your reference so we can start right away.",
  cardTitle: "Pay by card",
  cardBrands: "Visa · Mastercard",
  cardButton: (amount: string) => `Pay ${amount} now`,
  cardNote: "Secure checkout with PayFast. Work starts as soon as it clears.",
  cardSoon: "Card payments are coming soon. Please pay by bank transfer for now.",
  amount: "Amount due",
  bankQr: "Scan to copy bank details",
  capitecQr: "Capitec customers: scan with the Capitec app",
  capitecQrAlt: "Capitec Pay Me QR code",
  payshapTitle: "Pay instantly with PayShap from any bank app",
  payshapRef: (ref: string) => `Use reference ${ref}`,
  bankQrLabel: "QR code: scan to copy the bank details and your reference",
  cardQr: "Scan to pay by card on your phone",
  cardQrLabel: "QR code that opens card payment for this order",
} as const;

/** PHP urlencode, which PayFast's signature uses: spaces as +, uppercase hex, only A-Z a-z 0-9 - _ . kept. */
export function studioPhpUrlencode(v: string): string {
  return encodeURIComponent(v)
    .replace(/[!'()*~]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase())
    .replace(/%20/g, "+");
}

/**
 * PayFast's signature string: `key=urlencode(value)` joined with &, then
 * `&passphrase=...` when one is set. For a payment request (keepEmpty
 * false) values are trimmed and empty ones left out, as PayFast's request
 * docs say. For an ITN (keepEmpty true) every posted field but `signature`
 * is kept exactly as posted: NOT trimmed (1.20.8, gatekeeper note on #83),
 * so a value PayFast sent with a space still signs the way PayFast signed it.
 */
export function studioPayfastParamString(fields: [string, string][], passphrase: string, keepEmpty = false): string {
  const parts = fields
    .filter(([k, v]) => k !== "signature" && (keepEmpty || v.trim() !== ""))
    .map(([k, v]) => `${k}=${studioPhpUrlencode(keepEmpty ? v : v.trim())}`);
  const pass = passphrase.trim();
  if (pass) parts.push(`passphrase=${studioPhpUrlencode(pass)}`);
  return parts.join("&");
}

// ---- Order reference (1.20.8, check scheme 1.21.1) ------------------------
// Ray, 2 Nov: "reference can be random but easy to read so they dont put a
// wrong one and it is unique per client". One reference ties the order to
// its payment: it is the bank-transfer reference, PayFast's m_payment_id,
// the ?paid= return and the /status lookup. Shape CX-XXXX-XXXX: seven random
// characters and one check character, from a 19-character alphabet with
// no look-alikes (no 0/O/D/Q, 1/I/L, 2/Z, 5/S, 8/B, 6/G, 9/g, U/V).
//
// The check: with a_i the alphabet index of character i (i = 1..8), the
// check character is chosen so that sum(i * a_i) = 0 (mod 19). 19 is prime
// and the weights 1..8 are distinct and non-zero mod 19, so EVERY single
// substitution and EVERY swap of two adjacent different characters changes
// the sum and fails the check. The check only proves the reference is
// well formed; with no order store yet, it cannot prove we issued it.
export const STUDIO_REF_ALPHABET = "3467ACEFHJKMNPRTWXY";
export const STUDIO_REF_PREFIX = "CX";
const REF_SHAPE = new RegExp(`^${STUDIO_REF_PREFIX}-[${STUDIO_REF_ALPHABET}]{4}-[${STUDIO_REF_ALPHABET}]{4}$`);

function refCheckChar(body: string): string {
  const A = STUDIO_REF_ALPHABET;
  const n = A.length; // 19, prime
  let sum = 0;
  for (let i = 0; i < body.length; i++) sum += (i + 1) * A.indexOf(body[i]);
  // Solve 8 * c = -sum (mod n): 8 is invertible mod 19 (8 * 12 = 96 = 1 mod 19).
  const inv8 = 12;
  return A[(((-sum % n) + n) % n * inv8) % n];
}

/** A new reference. `random` returns n random bytes (crypto.getRandomValues by default). */
export function studioOrderRef(random: (n: number) => Uint8Array = (n) => crypto.getRandomValues(new Uint8Array(n))): string {
  const A = STUDIO_REF_ALPHABET;
  const limit = 256 - (256 % A.length); // rejection sampling: no bias
  let body = "";
  while (body.length < 7) {
    for (const b of random(16)) {
      if (b < limit && body.length < 7) body += A[b % A.length];
    }
  }
  const all = body + refCheckChar(body);
  return `${STUDIO_REF_PREFIX}-${all.slice(0, 4)}-${all.slice(4)}`;
}

/** A typed reference, tidied: upper case, spaces dropped, dashes put back. */
export function studioCleanRef(raw: string): string {
  const s = (raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (s.length !== 10 || !s.startsWith(STUDIO_REF_PREFIX)) return (raw || "").trim().toUpperCase().slice(0, 40);
  return `${s.slice(0, 2)}-${s.slice(2, 6)}-${s.slice(6)}`;
}

/** True for a well-formed reference: right shape, right alphabet, check character matches. Not proof we issued it (no order store yet). */
export function studioIsOrderRef(raw: string): boolean {
  const r = studioCleanRef(raw);
  if (!REF_SHAPE.test(r)) return false;
  const all = r.slice(3, 7) + r.slice(8);
  return refCheckChar(all.slice(0, 7)) === all[7];
}

/** The cleaned, upper-case reference when it is well formed, else null. Use this value downstream (m_payment_id, return URL). */
export function studioPayRef(raw: string): string | null {
  const r = studioCleanRef(raw);
  return studioIsOrderRef(r) ? r : null;
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
  /** 1.20.8: the package and add-ons, carried (signed) so the ITN recomputes the amount. */
  service?: string;
  addons?: readonly string[];
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
  if (p.service) f.push(["custom_str1", p.service.slice(0, 255)]);
  if (p.service) f.push(["custom_str2", (p.addons ?? []).join(",").slice(0, 255)]);
  return f;
}

/**
 * The card route for an order. 1.20.8: the link carries only the reference,
 * package and add-ons; the client's name and email go by POST from the
 * payment step's form (StudioPayStep), never in a URL.
 */
export const STUDIO_PAY_API = "/api/studio/pay";
export function studioPayHref(ref: string, service: string, addons: readonly string[], origin = ""): string {
  const q = new URLSearchParams({ ref, service, addons: addons.join(",") });
  return `${origin}${STUDIO_PAY_API}?${q.toString()}`;
}

// ---- Pay step QR codes (hosting_sdk 1.21.4; Ray, 2026-11-09) ---------------
// The bank transfer card shows a "Scan to copy bank details" QR that holds
// the details as plain text (a phone camera shows them ready to copy; it is
// not scan-to-pay); the card option a QR that
// opens this order's card link (studioPayHref). Both are drawn on the server
// (studio-pay-qr.ts) only after an order is sent. No QR without an account
// number. No bank QR every SA bank app reads exists yet, so PayShap
// (STUDIO_PAYSHAP_ID) and Capitec's own Pay Me QR (STUDIO_CAPITEC_QR_URL)
// show as optional extras instead.

export interface StudioBankQrInput {
  account: string;
  /** 1.21.6: the SWIFT code (STUDIO_BANK.swift unless overridden). */
  swift?: string;
  amountZar: number | null;
  ref: string;
}

/** The bank QR's plain text: account name, bank, branch, account, amount, reference. */
export function studioBankQrText({ account, swift = STUDIO_BANK.swift, amountZar, ref }: StudioBankQrInput): string {
  return [
    "CORTEX bank transfer (EFT)",
    `Account name: ${STUDIO_BANK.holder}`,
    `Bank: ${STUDIO_BANK.bank}`,
    `Branch code: ${STUDIO_BANK.branch}`,
    `SWIFT code: ${swift}`,
    `Account number: ${account}`,
    amountZar !== null ? `Amount: R${amountZar}` : null,
    `Reference: ${ref}`,
  ]
    .filter(Boolean)
    .join("\n");
}
