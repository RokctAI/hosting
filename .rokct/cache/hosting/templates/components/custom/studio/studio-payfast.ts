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

// PayFast on the server (hosting_sdk 1.20.7): settings, the MD5 signature
// and ITN checks. Server only (node:crypto, env). Settings, all on Vercel:
//   PAYFAST_MERCHANT_ID, PAYFAST_MERCHANT_KEY  required for card payments
//   PAYFAST_PASSPHRASE                         the passphrase set on PayFast
//   PAYFAST_SANDBOX                            "true" for sandbox.payfast.co.za
// Missing id or key: card is "coming soon"; nothing breaks. Values are never
// logged.

import { createHash } from "node:crypto";

import {
  STUDIO_PAYFAST_URL,
  STUDIO_PAYFAST_VALIDATE_URL,
  studioPayFields,
  studioPayfastParamString,
  type StudioPayment,
} from "./studio-pay";

export type StudioEnvLike = Record<string, string | undefined>;

export interface StudioPayfastConfig {
  enabled: boolean;
  merchantId: string;
  merchantKey: string;
  passphrase: string;
  sandbox: boolean;
  action: string;
  validateUrl: string;
}

export const STUDIO_PAYFAST_ENV_VARS = ["PAYFAST_MERCHANT_ID", "PAYFAST_MERCHANT_KEY", "PAYFAST_PASSPHRASE", "PAYFAST_SANDBOX"] as const;

export function studioPayfastConfig(env: StudioEnvLike = process.env): StudioPayfastConfig {
  const merchantId = (env.PAYFAST_MERCHANT_ID ?? "").trim();
  const merchantKey = (env.PAYFAST_MERCHANT_KEY ?? "").trim();
  const sandbox = /^(1|true|yes)$/i.test((env.PAYFAST_SANDBOX ?? "").trim());
  return {
    enabled: Boolean(merchantId && merchantKey),
    merchantId,
    merchantKey,
    passphrase: env.PAYFAST_PASSPHRASE ?? "",
    sandbox,
    action: sandbox ? STUDIO_PAYFAST_URL.sandbox : STUDIO_PAYFAST_URL.live,
    validateUrl: sandbox ? STUDIO_PAYFAST_VALIDATE_URL.sandbox : STUDIO_PAYFAST_VALIDATE_URL.live,
  };
}

/** The bank account number, from STUDIO_BANK_ACCOUNT, or null when unset. */
export function studioBankAccount(env: StudioEnvLike = process.env): string | null {
  const v = (env.STUDIO_BANK_ACCOUNT ?? "").replace(/\s+/g, "");
  return /^\d{6,16}$/.test(v) ? v : null;
}

export function studioPayfastSignature(fields: [string, string][], passphrase: string, keepEmpty = false): string {
  return createHash("md5").update(studioPayfastParamString(fields, passphrase, keepEmpty)).digest("hex");
}

/** The signed fields for one payment, or null when card payments are off. */
export function studioPayfastSigned(c: StudioPayfastConfig, p: StudioPayment): [string, string][] | null {
  if (!c.enabled) return null;
  const f = studioPayFields(c.merchantId, c.merchantKey, p);
  return [...f, ["signature", studioPayfastSignature(f, c.passphrase)]];
}

/** True when an ITN's posted signature matches its fields (in posted order) and our passphrase. */
export function studioPayfastItnValid(fields: [string, string][], passphrase: string): boolean {
  const sig = fields.find(([k]) => k === "signature")?.[1] ?? "";
  if (!/^[0-9a-f]{32}$/i.test(sig)) return false;
  return studioPayfastSignature(fields, passphrase, true) === sig.toLowerCase();
}
