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

// The studio order flow's settings (hosting_sdk 1.18.0), read from the
// environment and the request's host, nowhere else. Mail goes out through
// our own mail VPS (mail.rokct.ai, Exim), never a third-party mail API.
//
// The orders address (Ray, 2026-11-01, correcting the first fixed address):
// orders@<the host the studio site is served on, without "www.">, worked
// out at request time, so it moves with the site when the site moves to
// another domain. STUDIO_ORDERS_EMAIL is an optional override and wins when
// set. A host that can't receive mail (*.vercel.app, localhost, an IP
// address, no host at all) falls back to orders@rokct.ai, so no order is
// lost. The defaults below are the only place either address is written;
// everything else (the form page, the route, the emails) asks this file.
// No imports, so the tests run it under node's type stripping.
//
// Secrets: SMTP_PASS is read here and handed to the transport. It is never
// returned by studioMailStatus() and never logged; nothing in this flow
// prints a setting's value.

/** The fallback: where orders go when the site's own host can't receive mail. */
export const STUDIO_ORDERS_EMAIL_DEFAULT = "orders@rokct.ai";
/** The mail VPS, until SMTP_HOST is set. */
export const STUDIO_SMTP_HOST_DEFAULT = "mail.rokct.ai";
/** Submission port with STARTTLS, until SMTP_PORT is set. 465 means TLS from the start. */
export const STUDIO_SMTP_PORT_DEFAULT = 587;

/** Every variable the flow reads, by name (the CHANGELOG and the PR list the same). */
export const STUDIO_ORDER_ENV_VARS = [
  "STUDIO_ORDERS_EMAIL",
  "STUDIO_MAIL_FROM",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
] as const;

export type StudioEnv = Record<string, string | undefined>;

function envOf(env?: StudioEnv): StudioEnv {
  if (env) return env;
  return typeof process !== "undefined" && process.env ? (process.env as StudioEnv) : {};
}

function clean(v: string | undefined): string {
  return (v ?? "").trim();
}

// One address, no display name, no line breaks: enough to refuse a typo
// that would otherwise send every order nowhere.
const ADDRESS = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]+$/;

/**
 * The mail domain a request's host gives, or null when that host can't
 * receive mail: the port and a leading "www." dropped, lower case; null for
 * *.vercel.app, localhost (and *.localhost), an IP address, or anything that
 * is not a plain dotted host name.
 */
export function studioMailDomain(host: string | null | undefined): string | null {
  let h = (host ?? "").split(",")[0].trim().toLowerCase();
  if (h.startsWith("[")) return null; // IPv6 literal
  h = h.replace(/:\d+$/, "").replace(/\.$/, "");
  if (h.startsWith("www.")) h = h.slice(4);
  if (!h || h.length > 253) return null;
  if (!/^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(h)) return null;
  if (h === "vercel.app" || h.endsWith(".vercel.app")) return null;
  if (h === "localhost" || h.endsWith(".localhost")) return null;
  return h;
}

/**
 * The address orders go to: STUDIO_ORDERS_EMAIL when it is set to a valid
 * address (the override wins); else orders@<the site's own host>; else, for
 * a host that can't receive mail, the fallback orders@rokct.ai.
 */
export function studioOrdersEmail(env?: StudioEnv, host?: string | null): string {
  const v = clean(envOf(env).STUDIO_ORDERS_EMAIL);
  if (ADDRESS.test(v)) return v;
  const domain = studioMailDomain(host);
  return domain ? `orders@${domain}` : STUDIO_ORDERS_EMAIL_DEFAULT;
}

/** The host a request was served on: x-forwarded-host (Vercel sets it), else Host. */
export function studioRequestHost(headers: { get(name: string): string | null }): string | null {
  return headers.get("x-forwarded-host") || headers.get("host");
}

export interface StudioMailConfig {
  /** True only when the transport can log in (SMTP_USER and SMTP_PASS are both set). */
  configured: boolean;
  /** The variable names that are missing, never their values. */
  missing: string[];
  host: string;
  port: number;
  /** TLS from the first byte (port 465); otherwise STARTTLS is required. */
  secure: boolean;
  user: string;
  pass: string;
  /** The From header: STUDIO_MAIL_FROM, else the studio name on this request's orders address. */
  from: string;
  ordersEmail: string;
}

/** The full transport settings for a request served on `siteHost`. Server only: the result carries SMTP_PASS. */
export function studioMailConfig(env?: StudioEnv, siteHost?: string | null): StudioMailConfig {
  const e = envOf(env);
  const ordersEmail = studioOrdersEmail(e, siteHost);
  const host = clean(e.SMTP_HOST) || STUDIO_SMTP_HOST_DEFAULT;
  const portRaw = Number.parseInt(clean(e.SMTP_PORT), 10);
  const port = Number.isInteger(portRaw) && portRaw > 0 && portRaw < 65536 ? portRaw : STUDIO_SMTP_PORT_DEFAULT;
  const user = clean(e.SMTP_USER);
  const pass = e.SMTP_PASS ?? "";
  const fromRaw = clean(e.STUDIO_MAIL_FROM).replace(/[\r\n]+/g, " ");
  const from = fromRaw || `Cortex <${ordersEmail}>`;
  const missing: string[] = [];
  if (!user) missing.push("SMTP_USER");
  if (!pass) missing.push("SMTP_PASS");
  return { configured: missing.length === 0, missing, host, port, secure: port === 465, user, pass, from, ordersEmail };
}

/** What is safe to show or log about the settings: no user, no password. */
export function studioMailStatus(env?: StudioEnv): { configured: boolean; missing: string[]; host: string; port: number } {
  const c = studioMailConfig(env, null);
  return { configured: c.configured, missing: c.missing, host: c.host, port: c.port };
}

// ---- Step values: THE SLOT ----------------------------------------------
// @studio-step-values-slot
// Terms point 6: each phase shows what it is worth. Ray has NOT agreed the
// split of the R8,500 site yet (proposal sent 1 Nov: brief 10%, colour and
// logo 25%, page designs 25%, build preview 25%, launch 15%), so every value
// stays null and no email or page prints a figure. Once Ray agrees, set the
// five rand amounts here (whole rand, in phase order); the acknowledgement
// lists them only when ALL five are set.
export const STUDIO_STEP_VALUES_ZAR: readonly (number | null)[] = [null, null, null, null, null];

/** The five values when every one is set to a positive whole number, else null (the slot stays empty). */
export function studioStepValues(values: readonly (number | null)[] = STUDIO_STEP_VALUES_ZAR): number[] | null {
  if (values.length !== 5) return null;
  const out: number[] = [];
  for (const v of values) {
    if (typeof v !== "number" || !Number.isInteger(v) || v <= 0) return null;
    out.push(v);
  }
  return out;
}
