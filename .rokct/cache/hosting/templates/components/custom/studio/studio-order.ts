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

// The studio order form's rules (hosting_sdk 1.18.0): its words, its
// fields, the Terms, the server-side check and a simple rate limit. Shared
// by the form (studio-order-form.tsx), the route
// (app/api/studio/order/route.ts) and the emails (studio-order-mail.ts).
// Imports only studio-copy.ts, which imports nothing, so the tests run it
// under node's type stripping.
//
// The questions are the intake form in website-service/offer-and-intake.md;
// only five answers are required, because "we never ask twice": a missing
// answer is filled with a sensible choice and shown in the render.

import { STUDIO_PRICE_ROWS, STUDIO_WHATSAPP_DISPLAY } from "./studio-copy";

// ---- Words ----------------------------------------------------------------
export const STUDIO_ORDER_HREF = "/order";
export const STUDIO_ORDER_API = "/api/studio/order";

export const STUDIO_ORDER_COPY = {
  kicker: "Order",
  title: "Tell us about your business.",
  lede: "Ten short answers, your logo and your photos. We turn them into a one-page brief and send it back to you to confirm.",
  aside:
    "About two minutes. Only the starred answers are needed: if something is missing we make a sensible choice for your kind of business and show it to you in the render.",
  homeCta: "Fill in the order form",
  submit: "Send my order",
  sending: "Sending…",
  okTitle: "Thank you. Your order is in.",
  okText: "We have emailed you a copy with the terms. Our team replies in office hours, SAST.",
  okNoAck: "We have your order, but we could not email your copy just now. Our team will be in touch in office hours, SAST.",
  okRef: "Your reference",
  failWhatsApp: "Send it on WhatsApp instead",
  termsKicker: "The terms",
  termsTitle: "What you agree to when you order.",
  termsNote: "Draft wording in plain language. Your acknowledgement email carries the same terms.",
  filesHint: "Pictures (PNG, JPG, WEBP, GIF, SVG) or PDF. Up to 8 files and 4 MB in all; larger files can follow by email.",
  outsideSpecial:
    "Online shop and app are not part of the special. We'll pass your request to our team as a favour so you can be included, and we'll come back to you with a quote.",
} as const;

// The messages the route returns, so the form and the tests read the same.
export const STUDIO_ORDER_MESSAGES = {
  invalid: "Some answers need a look. Check the marked fields and send again.",
  tooLarge: "Those files are too big to send here (4 MB in all). Send the order without them and email the files afterwards, or send it on WhatsApp.",
  rateLimited: "That is a lot of orders from one place in a short time. Wait a few minutes and send again, or send it on WhatsApp.",
  notConfigured:
    "Our order form can't send email right now. Nothing was sent. Please send your order on WhatsApp instead and our team will take it from there.",
  sendFailed:
    "We couldn't send your order just now. Nothing was lost on your side: try again in a minute, or send it on WhatsApp.",
} as const;

// ---- Services the form offers: the price table's rows, in its order -------
export const STUDIO_ORDER_SERVICES: readonly string[] = STUDIO_PRICE_ROWS.map((r) => r.name);

export const STUDIO_ORDER_PAGES = ["Home", "About", "Services", "Gallery", "Contact", "Other"] as const;

// ---- Fields -----------------------------------------------------------------
export type StudioOrderFieldKind = "select" | "text" | "email" | "tel" | "textarea";

export interface StudioOrderField {
  name: string;
  label: string;
  kind: StudioOrderFieldKind;
  required?: boolean;
  max: number;
  hint?: string;
  placeholder?: string;
}

/** Text answers in the order the form asks and the emails list them. */
export const STUDIO_ORDER_FIELDS: readonly StudioOrderField[] = [
  { name: "service", label: "What you are ordering", kind: "select", required: true, max: 80 },
  { name: "name", label: "Your name", kind: "text", required: true, max: 120 },
  { name: "email", label: "Your email", kind: "email", required: true, max: 200, hint: "We send your copy and the terms here." },
  { name: "phone", label: "Your WhatsApp number", kind: "tel", max: 40 },
  { name: "business", label: "Business name", kind: "text", required: true, max: 120 },
  { name: "sells", label: "What you sell or do, in one sentence", kind: "text", required: true, max: 300 },
  { name: "area", label: "Town or area you serve", kind: "text", max: 160 },
  { name: "colour", label: "Your brand colour", kind: "text", max: 200, placeholder: "e.g. orange, or three colours or brands you like" },
  { name: "likes", label: "Three websites you like, and what you like about each", kind: "textarea", max: 2000 },
  { name: "pagesOther", label: "Other pages", kind: "text", max: 300 },
  { name: "siteContact", label: "Phone, WhatsApp and email to show on your site", kind: "textarea", max: 500 },
  { name: "asks", label: "Anything customers always ask you", kind: "textarea", max: 2000 },
  { name: "notes", label: "Anything else we should know", kind: "textarea", max: 2000 },
];

/** Yes/no answers (checkboxes), with the label the emails print. */
export const STUDIO_ORDER_FLAGS = [
  { name: "noLogo", label: "I don't have a logo" },
  { name: "designLogo", label: "Design my logo for me (paid add-on, quoted)" },
  { name: "stockPhotos", label: "I need stock photos" },
  { name: "wantShop", label: "I'd like an online shop too" },
  { name: "wantApp", label: "I'd like an app too" },
] as const;
export type StudioOrderFlag = (typeof STUDIO_ORDER_FLAGS)[number]["name"];

/** The honeypot: a field people never see. Filled means a bot. */
export const STUDIO_ORDER_TRAP = "company_url";

// ---- Files ------------------------------------------------------------------
export const STUDIO_ORDER_FILE_FIELDS = ["logo", "photos"] as const;
export type StudioOrderFileField = (typeof STUDIO_ORDER_FILE_FIELDS)[number];
export const STUDIO_ORDER_MAX_FILES = 8;
// Vercel refuses a function request body over 4.5 MB, so the files stay
// under 4 MB in all and the form says so.
export const STUDIO_ORDER_MAX_BYTES = 4 * 1024 * 1024;
export const STUDIO_ORDER_FILE_TYPES: Readonly<Record<string, string>> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "application/pdf": "pdf",
};
export const STUDIO_ORDER_ACCEPT = Object.keys(STUDIO_ORDER_FILE_TYPES).join(",");

export interface StudioOrderUpload {
  field: StudioOrderFileField;
  name: string;
  type: string;
  size: number;
}

// ---- The order ----------------------------------------------------------------
export interface StudioOrder {
  service: string;
  name: string;
  email: string;
  phone: string;
  business: string;
  sells: string;
  area: string;
  colour: string;
  likes: string;
  pages: string[];
  pagesOther: string;
  siteContact: string;
  asks: string;
  notes: string;
  flags: Record<StudioOrderFlag, boolean>;
  files: StudioOrderUpload[];
}

export type StudioOrderInput = Record<string, string | string[] | undefined>;

export type StudioOrderCheck =
  | { ok: true; order: StudioOrder }
  | { ok: false; bot?: true; tooLarge?: true; errors: Record<string, string> };

const EMAIL = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]{2,}$/;

function one(v: string | string[] | undefined): string {
  const s = Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
  // Keep line breaks inside an answer, drop every other control character.
  // eslint-disable-next-line no-control-regex
  return s.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, "").trim();
}

function yes(v: string | string[] | undefined): boolean {
  const s = one(v).toLowerCase();
  return s === "on" || s === "yes" || s === "true" || s === "1";
}

/** A safe attachment name: no path, no control characters, the extension its type allows. */
export function studioSafeFileName(name: string, type: string, index: number): string {
  const ext = STUDIO_ORDER_FILE_TYPES[type] ?? "bin";
  const base =
    name
      .split(/[\\/]/)
      .pop()!
      .replace(/\.[^.]*$/, "")
      .replace(/[^A-Za-z0-9 _-]+/g, "")
      .trim()
      .slice(0, 60) || `file-${index + 1}`;
  return `${base}.${ext}`;
}

/** Checks one submission on the server. Never throws. */
export function validateStudioOrder(input: StudioOrderInput, uploads: StudioOrderUpload[]): StudioOrderCheck {
  const errors: Record<string, string> = {};
  if (one(input[STUDIO_ORDER_TRAP])) return { ok: false, bot: true, errors: { form: "rejected" } };

  const v: Record<string, string> = {};
  for (const f of STUDIO_ORDER_FIELDS) {
    const s = one(input[f.name]);
    if (f.required && !s) errors[f.name] = "Needed";
    else if (s.length > f.max) errors[f.name] = `Keep it under ${f.max} characters`;
    v[f.name] = f.kind === "textarea" ? s : s.replace(/\n+/g, " ");
  }
  if (v.service && !STUDIO_ORDER_SERVICES.includes(v.service)) errors.service = "Pick one from the list";
  if (v.email && !errors.email && !EMAIL.test(v.email)) errors.email = "That email doesn't look right";
  if (v.phone && !/^[+()\d\s-]{6,40}$/.test(v.phone)) errors.phone = "Digits, spaces and + only";

  const rawPages = input.pages;
  const pageList = (Array.isArray(rawPages) ? rawPages : rawPages ? [rawPages] : []).map((p) => one(p));
  const pages = STUDIO_ORDER_PAGES.filter((p) => pageList.includes(p));

  const flags = Object.fromEntries(STUDIO_ORDER_FLAGS.map((f) => [f.name, yes(input[f.name])])) as Record<StudioOrderFlag, boolean>;

  if (!yes(input.terms)) errors.terms = "Please read and accept the terms";

  let tooLarge = false;
  if (uploads.length > STUDIO_ORDER_MAX_FILES) {
    errors.files = `Up to ${STUDIO_ORDER_MAX_FILES} files`;
  }
  const total = uploads.reduce((n, u) => n + (u.size > 0 ? u.size : 0), 0);
  if (total > STUDIO_ORDER_MAX_BYTES) {
    errors.files = "4 MB in all, at most";
    tooLarge = true;
  }
  for (const u of uploads) {
    if (!STUDIO_ORDER_FILE_FIELDS.includes(u.field) || !(u.type in STUDIO_ORDER_FILE_TYPES)) {
      errors.files = "Pictures or PDF only";
    }
  }

  if (Object.keys(errors).length) return tooLarge ? { ok: false, tooLarge: true, errors } : { ok: false, errors };
  return {
    ok: true,
    order: {
      service: v.service,
      name: v.name,
      email: v.email,
      phone: v.phone,
      business: v.business,
      sells: v.sells,
      area: v.area,
      colour: v.colour,
      likes: v.likes,
      pages,
      pagesOther: v.pagesOther,
      siteContact: v.siteContact,
      asks: v.asks,
      notes: v.notes,
      flags,
      files: uploads.map((u, i) => ({ ...u, name: studioSafeFileName(u.name, u.type, i) })),
    },
  };
}

// ---- Rate limit ---------------------------------------------------------------
// Simple and per server instance: a few orders per address per window. On
// Vercel each warm instance keeps its own count, which is enough to stop a
// script hammering the form; it is not a quota.
export const STUDIO_ORDER_RATE = { limit: 5, windowMs: 15 * 60 * 1000 } as const;

export function createStudioRateLimiter(limit: number = STUDIO_ORDER_RATE.limit, windowMs: number = STUDIO_ORDER_RATE.windowMs) {
  const hits = new Map<string, number[]>();
  return {
    /** Records a hit for `key`; false when the key is over its limit. */
    allow(key: string, now: number = Date.now()): boolean {
      const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return false;
      }
      recent.push(now);
      hits.set(key, recent);
      if (hits.size > 5000) {
        for (const [k, ts] of hits) if (!ts.some((t) => now - t < windowMs)) hits.delete(k);
      }
      return true;
    },
  };
}

// ---- The Terms ------------------------------------------------------------------
// website-service/offer-and-intake.md, "Terms" (draft wording, plain
// language; Ray approved the rules on 30 Oct and 1 Nov, the final text is
// his to confirm). Point 6 carries no figure: the values are the slot in
// studio-order-config.ts. Point 10 takes the orders address from config.
export interface StudioOrderTerm {
  b: string;
  t: string;
}

export function studioOrderTerms(ordersEmail: string): StudioOrderTerm[] {
  return [
    { b: "Payment", t: "You pay the full price before work starts." },
    { b: "Phases", t: "We work in phases. After each phase we send you a render. You approve it before we start the next phase." },
    { b: "Due dates", t: "We show the due date of each phase on your status page." },
    {
      b: "First render in 24 hours",
      t: "We send your first render (phase 2) within 24 hours of your confirmed brief. If we miss that, you get a full refund.",
    },
    {
      b: "Later phases",
      t: "Every later phase has a due date on your status page. The clock pauses while we wait for you (a logo, an answer, an approval); that shows as a blocker, and the due date moves. If we miss a due date while the clock was running, that phase is refunded. No refund is due for time lost waiting on you.",
    },
    { b: "Step values", t: "Each phase shows what it is worth, so you always know what you have received." },
    { b: "Cancel anytime", t: "You can cancel at any time. You keep everything we have delivered, but delivered work is not refunded." },
    {
      b: "Domain",
      t: "The first year of a standard domain name (.co.za, .com, .net or .org) is included in the fee. We register and hold it for you and renew it each year you pay the yearly renewal; if a renewal is not paid, we do not renew it.",
    },
    { b: "Hosting", t: "Lifetime hosting is included for the life of the site, for the first 1,000 small business owners, under fair use." },
    { b: "Contact", t: `WhatsApp ${STUDIO_WHATSAPP_DISPLAY}. Briefs, logos and photos: ${ordersEmail}.` },
  ];
}

/** The 24-hour promise, in the words the acknowledgement uses. */
export const STUDIO_ORDER_PROMISE =
  "Your first render comes within 24 hours of your confirmed brief. If we miss that, you get a full refund.";

/** The five phases, in order (studio-copy's process), for the step-values slot. */
export const STUDIO_ORDER_PHASES = ["Brief confirmed", "Colour system and logo", "Page designs", "Site build preview", "Launch"] as const;
