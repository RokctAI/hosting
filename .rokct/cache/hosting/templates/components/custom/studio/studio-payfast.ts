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
  STUDIO_BANK,
  STUDIO_PAYFAST_URL,
  STUDIO_PAYFAST_VALIDATE_URL,
  studioPayFields,
  studioPayfastParamString,
  type StudioPayment,
} from "./studio-pay";
import { studioOrderZar } from "./studio-copy";

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

/** 1.21.4: the PayShap ID (STUDIO_PAYSHAP_ID, e.g. a cellphone@bank ShapID), or null. */
export function studioPayshapId(env: StudioEnvLike = process.env): string | null {
  const v = (env.STUDIO_PAYSHAP_ID ?? "").trim();
  return /^[A-Za-z0-9._+-]{3,64}@[A-Za-z0-9.-]{2,64}$/.test(v) ? v : null;
}

/** 1.21.4: the Capitec "Pay Me" QR image URL (STUDIO_CAPITEC_QR_URL, https or a /path), or null. */
export function studioCapitecQrUrl(env: StudioEnvLike = process.env): string | null {
  const v = (env.STUDIO_CAPITEC_QR_URL ?? "").trim();
  return /^(https:\/\/|\/)[^\s"'<>]{1,500}$/.test(v) ? v : null;
}

/** 1.21.6: the SWIFT code, STUDIO_BANK_SWIFT when it is a valid 8 or 11 character code, else Capitec's (CABLZAJJ). */
export function studioBankSwift(env: StudioEnvLike = process.env): string {
  const v = (env.STUDIO_BANK_SWIFT ?? "").replace(/\s+/g, "").toUpperCase();
  return /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(v) ? v : STUDIO_BANK.swift;
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

// ---- ITN checks (1.20.8, gatekeeper notes on #83) -------------------------

/** PayFast's documented ITN source hosts; their addresses are resolved at check time. */
export const STUDIO_PAYFAST_ITN_HOSTS = ["www.payfast.co.za", "sandbox.payfast.co.za", "w1w.payfast.co.za", "w2w.payfast.co.za"] as const;

/** The caller's IP: the first x-forwarded-for entry (Vercel sets it), else x-real-ip; "" when neither. */
export function studioItnSourceIp(headers: { get(name: string): string | null }): string {
  const fwd = headers.get("x-forwarded-for");
  const ip = (fwd ? fwd.split(",")[0] : headers.get("x-real-ip")) ?? "";
  return ip.trim().replace(/^::ffff:/, "");
}

export type StudioResolve = (host: string) => Promise<string[]>;

/** Every address PayFast's ITN hosts resolve to (a host that fails to resolve adds none). */
export async function studioPayfastItnIps(resolve: StudioResolve): Promise<Set<string>> {
  const all = await Promise.all(STUDIO_PAYFAST_ITN_HOSTS.map((h) => resolve(h).catch(() => [] as string[])));
  return new Set(all.flat().map((a) => a.replace(/^::ffff:/, "")));
}

/** True when `ip` is one of PayFast's ITN addresses. */
export async function studioPayfastIpAllowed(ip: string, resolve: StudioResolve): Promise<boolean> {
  if (!ip) return false;
  return (await studioPayfastItnIps(resolve)).has(ip.replace(/^::ffff:/, ""));
}

/** node:dns lookup of every A/AAAA address for a host. */
export async function studioDnsResolve(host: string): Promise<string[]> {
  const { lookup } = await import("node:dns/promises");
  return (await lookup(host, { all: true })).map((a) => a.address);
}

/**
 * The amount an ITN should carry, recomputed from the order fields our pay
 * route put in custom_str1 (package) and custom_str2 (add-ons); both are
 * covered by the ITN signature. null when they are missing or not payable.
 */
export function studioItnExpectedZar(fields: [string, string][]): number | null {
  const get = (k: string) => fields.find(([f]) => f === k)?.[1];
  const service = get("custom_str1");
  if (!service) return null;
  const addons = (get("custom_str2") ?? "").split(",").filter(Boolean);
  return studioOrderZar(service, addons);
}

/** True when amount_gross equals the recomputed amount, to the cent. */
export function studioItnAmountOk(fields: [string, string][]): boolean {
  const expected = studioItnExpectedZar(fields);
  const gross = Number.parseFloat(fields.find(([f]) => f === "amount_gross")?.[1] ?? "");
  if (expected === null || !Number.isFinite(gross)) return false;
  return Math.abs(gross - expected) < 0.005;
}
