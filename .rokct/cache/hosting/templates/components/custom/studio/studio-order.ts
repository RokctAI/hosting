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

import { STUDIO_COLOURS_ERROR, studioFormatColourRoles, studioParseColourRoles } from "./studio-shades";
import { STUDIO_PRICE_ROWS, STUDIO_SOURCE_LINE } from "./studio-copy";

// ---- Words ----------------------------------------------------------------
export const STUDIO_ORDER_HREF = "/order";
export const STUDIO_ORDER_API = "/api/studio/order";
/** GET ?name=<domain>: is a wanted domain free to register? (1.20.3) */
export const STUDIO_DOMAIN_API = "/api/studio/domain";

export const STUDIO_ORDER_COPY = {
  kicker: "Order",
  title: "Order your site.",
  lede: "Three steps: your details, a review, then payment. About two minutes. We turn your answers into a brief and send it back to you to confirm.",
  foreverTitle: "Forever hosting, free",
  foreverText: "Your site stays hosted for as long as it is with us. Free for the",
  /** 1.20.8 (Ray): the limit, emphasised on its own. */
  foreverLimit: "first 1,000 businesses",
  moneyBackTitle: "Money-back guarantee",
  moneyBackText: "If your first render is late, you get a full refund.",
  photosNone: "No photos? We use royalty-free photos chosen for your trade, at no extra cost.",
  // 1.20.8 (gatekeeper), 1.21.9 (Ray): PayFast only sends the customer back
  // to /order?paid=<ref> once the payment went through, so the wording now
  // trusts PayFast's return. Work is still matched against PayFast's
  // confirmation (ITN) by reference, so a hand-typed ?paid= link only
  // misleads the person who typed it.
  paidTitle: "Thanks, your payment went through.",
  paidText: "We've started on your order.",
  cancelTitle: "Payment cancelled.",
  cancelText: "Nothing was charged. Your order details reached us; pay below when you are ready.",
  homeCta: "Fill in the order form",
  submit: "Send my order",
  sending: "Sending…",
  okTitle: "Thank you. Your order is in.",
  okText: "We have emailed you a copy with the terms. Our team replies in office hours, SAST.",
  okNoAck: "We have your order, but we could not email your copy just now. Our team will be in touch in office hours, SAST.",
  okRef: "Your reference",
  termsKicker: "The terms",
  termsTitle: "What you agree to when you order.",
  /** 1.21.2: the Review step links the full terms page. */
  termsHref: "/terms",
  termsNote: "Draft wording in plain language. Your acknowledgement email carries the same terms.",
  filesHint: "Pictures (PNG, JPG, WEBP, GIF, SVG) or PDF. Up to 8 files and 4 MB in all; larger files can follow by email.",
} as const;

// The messages the route returns, so the form and the tests read the same.
export const STUDIO_ORDER_MESSAGES = {
  invalid: "Some answers need a look. Check the marked fields and send again.",
  tooLarge: "Those files are too big to send here (4 MB in all). Send the order without them and email the files afterwards.",
  rateLimited: "That is a lot of orders from one place in a short time. Wait a few minutes and send again.",
  notConfigured:
    "Our order email isn't set up on this site yet, so nothing was sent. Please try again later.",
  sendFailed:
    "We couldn't send your order just now. Nothing was lost on your side: try again in a minute.",
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
  { name: "phone", label: "Your phone number", kind: "tel", max: 40 },
  { name: "business", label: "Business name", kind: "text", required: true, max: 120 },
  { name: "sells", label: "What you sell or do, in one sentence", kind: "text", required: true, max: 300 },
  { name: "area", label: "Town or area you serve", kind: "text", max: 160 },
  { name: "colour", label: "Your brand colours", kind: "text", required: true, max: 200 },
  { name: "likes", label: "Three websites you like, and what you like about each", kind: "textarea", max: 2000 },
  // The domain step (1.20.2): read with hasDomain, see STUDIO_ORDER_DOMAIN.
  // 1.21.2 (Ray): one domain box, checked as the client types; the form
  // sends it as `domain` (they own it) or `wantedDomain` (we register it).
  { name: "domain", label: "Your domain name, or the one you want", kind: "text", max: 253, placeholder: "e.g. yourbusiness.co.za", hint: "A .co.za or .com only. We check as you type if it is already registered." },
  // 1.21.2 (Ray): plain free text, no company names suggested.
  { name: "domainManager", label: "Who manages your domain (optional)", kind: "text", max: 200, hint: "So we know who to ask to point it to your new site." },
  { name: "wantedDomain", label: "The domain name you want", kind: "text", max: 253, placeholder: "e.g. yourbusiness.co.za" },
  { name: "pagesOther", label: "Other pages", kind: "text", max: 300 },
  { name: "siteContact", label: "Contact details to show on your site", kind: "textarea", max: 500 },
  { name: "asks", label: "Anything customers always ask you", kind: "textarea", max: 2000 },
  { name: "notes", label: "Anything else we should know", kind: "textarea", max: 2000 },
  // Filled by the stepper from studio-copy.ts, so the email shows the price the client saw.
  { name: "total", label: "Price shown", kind: "text", max: 80 },
];

// ---- Domain -------------------------------------------------------------------
// Ray, 2026-11-05: the form had no way to know if the client already has a
// domain. "Yes" asks for the domain and where it is registered, so we know
// where to point it; "No, I need one" asks for the name they want and checks
// it is free to register (STUDIO_DOMAIN_API, public RDAP). Ray, 2026-11-06:
// only .co.za or .com; the first year is in the deal price, then the client
// pays its yearly renewal; a client who already has a domain gets no
// discount, the deal price stays the same.
export type StudioDomainAnswer = "yes" | "no";
// 1.21.2 (Ray): one domain box with a live RDAP check; when the name is
// already registered (or the check could not tell), the form asks whether
// the client already owns it. "available" means we register it for them.
export const STUDIO_ORDER_DOMAIN = {
  name: "hasDomain",
  question: "I already own this domain",
  options: [
    { value: "yes", label: "Yes, it's mine" },
    { value: "no", label: "No" },
  ] as { value: StudioDomainAnswer; label: string }[],
  hasOne:
    "Only a .co.za or .com. Having your own domain does not lower the price: the deal price stays the same.",
  needsOne:
    "Type the name you want and we check if it is free to register. A .co.za or .com only. The first year is included in the deal price; after that you pay the domain's yearly renewal, or we don't renew it.",
  /** Taken and not theirs: a new name is needed (never blocks sending). */
  notTheirs: "Someone else has registered this name. Try another, or send it as is and we suggest options.",
  pickOwn: "Tell us if you already own this domain",
  rowLabel: "Already has a domain",
  checkLabel: "Free to register?",
} as const;

/** The only domain endings we register or connect (Ray, 2026-11-06). */
export const STUDIO_DOMAIN_ENDINGS = [".co.za", ".com"] as const;
export const STUDIO_DOMAIN_ENDING_ERROR = "Only a .co.za or .com domain, e.g. yourbusiness.co.za";

export type StudioDomainCheck = "available" | "taken" | "unknown";
export const STUDIO_DOMAIN_CHECK_TEXT: Record<StudioDomainCheck, string> = {
  available: "Available",
  taken: "Already registered",
  unknown: "Couldn't check",
};
/** Shown with every result: a check is a guide, not a hold on the name. */
export const STUDIO_DOMAIN_CHECK_NOTE = "The final check happens when we register it.";

const DOMAIN_SHAPE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/;

/**
 * A typed domain, cleaned: no scheme, no www., no path, lower case. "" when
 * it does not look like a domain at all.
 */
export function studioCleanDomain(raw: string): string {
  const s = raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[/?#].*$/, "")
    .replace(/\.$/, "");
  return s.length <= 253 && DOMAIN_SHAPE.test(s) ? s : "";
}

/** The allowed ending of a cleaned domain, or null. */
export function studioDomainEnding(domain: string): (typeof STUDIO_DOMAIN_ENDINGS)[number] | null {
  return STUDIO_DOMAIN_ENDINGS.find((e) => domain.endsWith(e) && domain.length > e.length) ?? null;
}

/** A name one can register: exactly one label before .co.za or .com. */
export function studioRegistrableDomain(raw: string): string {
  const d = studioCleanDomain(raw);
  const end = studioDomainEnding(d);
  if (!end) return "";
  const label = d.slice(0, -end.length);
  return label && !label.includes(".") ? d : "";
}

/** 1.21.2: .com's registry RDAP, as the IANA bootstrap lists it. */
export const STUDIO_RDAP_COM = "https://rdap.verisign.com/com/v1/domain/";
/** 1.21.2: the rdap.org bootstrap (redirects to a registry's RDAP when one exists). */
export const STUDIO_RDAP_BOOTSTRAP = "https://rdap.org/domain/";
/** rdap.org sits behind a bot filter that refuses a blank user agent. */
const RDAP_AGENT = "CORTEX-order-form/1.0 (domain availability check)";

export type StudioFetch = (url: string, init: { signal: AbortSignal; headers: Record<string, string> }) => Promise<{ status: number }>;

/**
 * Is `name` free to register? Never throws; anything it cannot settle is
 * "unknown". 1.21.2: RDAP only. .com asks the registry's RDAP that the IANA
 * bootstrap names for it (Verisign: 404 = available, 200 = registered)
 * directly, one hop and no third-party proxy. .co.za is not in the IANA
 * bootstrap (ZACR's rdap.registry.net.za answers 404 even for registered
 * names), so it asks the rdap.org bootstrap, where only a 200 counts
 * ("taken"; today rdap.org answers "No RDAP service"); otherwise it uses
 * `hasNameservers` when given (NS records = taken) and is "unknown": we
 * never say "Available" unless a registry said so.
 */
export async function studioCheckDomain(
  raw: string,
  opts: { fetch?: StudioFetch; hasNameservers?: (name: string) => Promise<boolean | null>; timeoutMs?: number } = {},
): Promise<StudioDomainCheck> {
  const name = studioRegistrableDomain(raw);
  if (!name) return "unknown";
  const timeoutMs = opts.timeoutMs ?? 4000;
  try {
    const isCom = name.endsWith(".com");
    const f = opts.fetch ?? (globalThis.fetch as unknown as StudioFetch);
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs);
    try {
      const res = await f(`${isCom ? STUDIO_RDAP_COM : STUDIO_RDAP_BOOTSTRAP}${encodeURIComponent(name)}`, {
        signal: ctl.signal,
        headers: { accept: "application/rdap+json", "user-agent": RDAP_AGENT },
      });
      if (res.status === 200) return "taken";
      if (isCom) return res.status === 404 ? "available" : "unknown";
    } catch {
      if (isCom) return "unknown";
    } finally {
      clearTimeout(timer);
    }
    if (opts.hasNameservers) {
      const ns = await Promise.race([
        opts.hasNameservers(name),
        new Promise<null>((done) => setTimeout(() => done(null), timeoutMs)),
      ]);
      if (ns === true) return "taken";
    }
    return "unknown";
  } catch {
    return "unknown";
  }
}

/** Yes/no answers (checkboxes), with the label the emails print. */
export const STUDIO_ORDER_FLAGS = [
  { name: "noLogo", label: "I don't have a logo" },
  { name: "designLogo", label: "Add-on: logo design" },
  { name: "extraPages", label: "Add-on: two extra pages" },
] as const;
export type StudioOrderFlag = (typeof STUDIO_ORDER_FLAGS)[number]["name"];

// ---- Logo: new or redesign (1.20.8) --------------------------------------
// Ray, 2 Nov: "they are asked if its a redesign of existing logo or its new
// design if its redesign we ask them to add existng logo". Asked only when
// the logo add-on is ticked; a redesign needs the current logo uploaded.
export type StudioLogoKind = "new" | "redesign";
export const STUDIO_ORDER_LOGO = {
  name: "logoKind",
  question: "Is this a new logo, or a redesign of the one you have?",
  options: [
    { value: "new", label: "A new logo" },
    { value: "redesign", label: "A redesign of my current logo" },
  ] as { value: StudioLogoKind; label: string }[],
  upload: "Upload your current logo",
  uploadHint: "We redesign from it, so the clearest copy you have works best.",
  pick: "Pick a new logo or a redesign",
  missing: "Upload your current logo, so we can redesign it",
  rowLabel: "Logo design",
  rowText: { new: "A new logo", redesign: "A redesign of the current logo (attached)" } as Record<StudioLogoKind, string>,
} as const;

// ---- Business plan intake: the ten questions (1.20.8) --------------------
// offer-and-intake.md, "Business plan intake" (Ray, 30 Oct). A plan order
// gets these in place of the website questions. Question 1 is the business
// name and what it sells (the `business` and `sells` fields), question 3
// starts with the area (`area`). A missing or "not sure" answer is never
// asked again: we use a figure typical for the business type and label it
// as an assumption in the plan. Starter uses questions 1-3 and 5-7.
export const STUDIO_PLAN_TYPES = ["Retail", "Food", "Services", "Farming", "Transport", "Other"] as const;
export const STUDIO_PLAN_FOR = ["A bank or funder", "A grant", "An investor", "My own use"] as const;

export interface StudioPlanQuestion {
  n: number;
  /** The fields this question posts; plan-only ones are in STUDIO_PLAN_FIELDS. */
  fields: string[];
  label: string;
}
export const STUDIO_PLAN_QUESTIONS: readonly StudioPlanQuestion[] = [
  { n: 1, fields: ["business", "sells"], label: "Business name and what it sells, in one sentence" },
  { n: 2, fields: ["planType"], label: "Business type" },
  { n: 3, fields: ["area", "planCustomers"], label: "Town or area, and who the customers are" },
  { n: 4, fields: ["planTrading"], label: 'How long trading, or "not started"' },
  { n: 5, fields: ["planFor"], label: "What you need the plan for" },
  { n: 6, fields: ["planProducts"], label: 'Main products or services with prices, or "not set"' },
  { n: 7, fields: ["planSales"], label: "Monthly sales now, or expected" },
  { n: 8, fields: ["planCosts"], label: 'Main monthly costs (rent, stock, wages, other), or "not sure"' },
  { n: 9, fields: ["planTeam"], label: "Team size and who does what" },
  { n: 10, fields: ["planFunding"], label: 'Money you need and what it is for, or "not sure"' },
];
export const STUDIO_PLAN_FIELDS: readonly StudioOrderField[] = [
  { name: "planType", label: "Business type", kind: "select", max: 40 },
  { name: "planCustomers", label: "Who your customers are", kind: "text", max: 300 },
  { name: "planTrading", label: "How long you have been trading", kind: "text", max: 120, placeholder: 'e.g. 3 years, or "not started"' },
  { name: "planFor", label: "What you need the plan for", kind: "select", max: 40 },
  { name: "planProducts", label: "Main products or services, with prices", kind: "textarea", max: 1500 },
  { name: "planSales", label: "Monthly sales, now or expected", kind: "text", max: 200 },
  { name: "planCosts", label: "Main monthly costs", kind: "textarea", max: 1500 },
  { name: "planTeam", label: "Team size and who does what", kind: "textarea", max: 1000 },
  { name: "planFunding", label: "Money you need and what it is for", kind: "textarea", max: 1500 },
];
export const STUDIO_PLAN_MISSING = "Not given: we use a typical figure for this business type, labelled as an assumption";

/** True when a package is a business plan tier. */
export function studioIsPlan(service: string): boolean {
  return service.startsWith("Business plan");
}
/** The plan questions a package asks: Starter 1-3 and 5-7, the others all ten; none for other packages. */
export function studioPlanQuestions(service: string): StudioPlanQuestion[] {
  if (!studioIsPlan(service)) return [];
  if (/Starter/.test(service)) return STUDIO_PLAN_QUESTIONS.filter((q) => [1, 2, 3, 5, 6, 7].includes(q.n));
  return [...STUDIO_PLAN_QUESTIONS];
}

// ---- Photo quality (1.20.8) -----------------------------------------------
// Ray, 2 Nov: "we might need to check quality and warn them". A warning,
// never a block: the form measures each picture when it is chosen, and the
// order email repeats the file-size warnings for our team.
export const STUDIO_PHOTO_MIN_EDGE = 1200;
export const STUDIO_PHOTO_MIN_BYTES = 60 * 1024;
const RASTER = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

/** A plain warning for a low-quality picture, or null. Width and height are optional (unknown on the server). */
export function studioPhotoWarning(f: { name: string; type: string; size: number; width?: number; height?: number }): string | null {
  if (!RASTER.has(f.type)) return null;
  const name = f.name.split(/[\\/]/).pop() || "This picture";
  if (f.width && f.height && Math.max(f.width, f.height) < STUDIO_PHOTO_MIN_EDGE) {
    return `${name} is only ${f.width} × ${f.height} pixels, so it may look blurry on a big screen. A larger original works best.`;
  }
  if (f.size > 0 && f.size < STUDIO_PHOTO_MIN_BYTES) {
    return `${name} is a small file (${Math.max(1, Math.round(f.size / 1024))} KB). It may have been compressed, for example by a chat app. The original photo works best.`;
  }
  return null;
}

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
  hasDomain: StudioDomainAnswer | "";
  domain: string;
  /** 1.21.2: free text, who manages their domain; "" when not given. */
  domainManager: string;
  wantedDomain: string;
  /** The server's own availability check of wantedDomain; "" when not asked. */
  domainCheck: StudioDomainCheck | "";
  asks: string;
  notes: string;
  flags: Record<StudioOrderFlag, boolean>;
  files: StudioOrderUpload[];
  /** 1.20.8: "new" or "redesign" when the logo add-on is ticked, else "". */
  logoKind: StudioLogoKind | "";
  /** 1.20.8: the plan answers by field name, for a business plan order; else null. */
  plan: Record<string, string> | null;
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
  const isPlan = studioIsPlan(v.service ?? "");
  // 1.20.7 (Ray): 3 to 5 brand colours, as hex from the shade picker.
  // 1.20.8: a business plan order has no website, so no colours are asked.
  // 1.21.4 (Ray): by role, "Primary #aabbcc, Secondary ..."; Primary needed.
  const picks = studioParseColourRoles(v.colour);
  v.colour = studioFormatColourRoles(picks);
  if (isPlan) delete errors.colour;
  else if (!picks.some((p) => p.role === "Primary")) errors.colour = STUDIO_COLOURS_ERROR;
  if (v.service && !STUDIO_ORDER_SERVICES.includes(v.service)) errors.service = "Pick one from the list";
  if (v.email && !errors.email && !EMAIL.test(v.email)) errors.email = "That email doesn't look right";
  if (v.phone && !/^[+()\d\s-]{6,40}$/.test(v.phone)) errors.phone = "Digits, spaces and + only";

  const hasDomain = one(input[STUDIO_ORDER_DOMAIN.name]).toLowerCase();
  if (hasDomain && hasDomain !== "yes" && hasDomain !== "no") errors[STUDIO_ORDER_DOMAIN.name] = "Pick yes or no";
  if (hasDomain === "yes" && !errors.domain) {
    const d = studioCleanDomain(v.domain);
    if (!v.domain) errors.domain = "Needed: the domain you have";
    else if (!d) errors.domain = "That domain doesn't look right, e.g. yourbusiness.co.za";
    else if (!studioDomainEnding(d)) errors.domain = STUDIO_DOMAIN_ENDING_ERROR;
    else v.domain = d;
  }
  if (hasDomain === "no" && !errors.wantedDomain) {
    const d = studioCleanDomain(v.wantedDomain);
    if (!v.wantedDomain) errors.wantedDomain = "Needed: the name you want";
    else if (!d) errors.wantedDomain = "That domain doesn't look right, e.g. yourbusiness.co.za";
    else if (!studioDomainEnding(d)) errors.wantedDomain = STUDIO_DOMAIN_ENDING_ERROR;
    else if (!studioRegistrableDomain(d)) errors.wantedDomain = "Just the name and its ending, e.g. yourbusiness.co.za";
    else v.wantedDomain = d;
  }
  const rawCheck = one(input.domainCheck);
  const domainCheck: StudioDomainCheck | "" =
    hasDomain !== "no" ? "" : rawCheck === "available" || rawCheck === "taken" ? rawCheck : "unknown";

  const rawPages = input.pages;
  const pageList = (Array.isArray(rawPages) ? rawPages : rawPages ? [rawPages] : []).map((p) => one(p));
  const pages = STUDIO_ORDER_PAGES.filter((p) => pageList.includes(p));

  const flags = Object.fromEntries(STUDIO_ORDER_FLAGS.map((f) => [f.name, yes(input[f.name])])) as Record<StudioOrderFlag, boolean>;

  // 1.20.8: logo new or redesign; a redesign needs the current logo.
  let logoKind: StudioLogoKind | "" = "";
  if (flags.designLogo) {
    const k = one(input[STUDIO_ORDER_LOGO.name]).toLowerCase();
    if (k !== "new" && k !== "redesign") errors[STUDIO_ORDER_LOGO.name] = STUDIO_ORDER_LOGO.pick;
    else {
      logoKind = k;
      if (k === "redesign" && !uploads.some((u) => u.field === "logo")) errors.logo = STUDIO_ORDER_LOGO.missing;
    }
  }

  // 1.20.8: the business plan questions, for a plan order only.
  let plan: Record<string, string> | null = null;
  if (isPlan) {
    plan = {};
    const asked = new Set(studioPlanQuestions(v.service).flatMap((q) => q.fields));
    for (const f of STUDIO_PLAN_FIELDS) {
      if (!asked.has(f.name)) continue;
      const s = one(input[f.name]);
      if (s.length > f.max) errors[f.name] = `Keep it under ${f.max} characters`;
      else if (f.name === "planType" && s && !(STUDIO_PLAN_TYPES as readonly string[]).includes(s)) errors[f.name] = "Pick one from the list";
      else if (f.name === "planFor" && s && !(STUDIO_PLAN_FOR as readonly string[]).includes(s)) errors[f.name] = "Pick one from the list";
      plan[f.name] = f.kind === "textarea" ? s : s.replace(/\n+/g, " ");
    }
  }

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
      hasDomain: hasDomain === "yes" || hasDomain === "no" ? hasDomain : "",
      // A client who needs one keeps no stray answer from the "Yes" boxes.
      domain: hasDomain === "yes" ? v.domain : "",
      domainManager: hasDomain === "yes" ? v.domainManager : "",
      wantedDomain: hasDomain === "no" ? v.wantedDomain : "",
      // The route replaces this with its own check before mailing.
      domainCheck,
      asks: v.asks,
      notes: v.notes,
      flags,
      files: uploads.map((u, i) => ({ ...u, name: studioSafeFileName(u.name, u.type, i) })),
      logoKind,
      plan,
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
      t: "We work with .co.za or .com domains only. The first year of the domain is included in the deal price. We register and hold it for you and renew it each year you pay the yearly renewal; if a renewal is not paid, we do not renew it. If you already have a domain, the deal price stays the same: there is no discount.",
    },
    { b: "Hosting", t: "Lifetime hosting is included for the life of the site, for the first 1,000 small business owners, under fair use." },
    { b: "Your code", t: STUDIO_SOURCE_LINE },
    // 1.20.8 (Ray, 13:31Z): the order flow is email only.
    { b: "Contact", t: `Email ${ordersEmail}, for questions, briefs, logos and photos.` },
  ];
}

/** The 24-hour promise, in the words the acknowledgement uses. */
export const STUDIO_ORDER_PROMISE =
  "Your first render comes within 24 hours of your confirmed brief. If we miss that, you get a full refund.";

/** The five phases, in order (studio-copy's process), for the step-values slot. */
export const STUDIO_ORDER_PHASES = ["Brief confirmed", "Colour system and logo", "Page designs", "Site build preview", "Launch"] as const;

// ---- Status page (1.20.8) ---------------------------------------------------
// Terms points 3 and 5 promise a status page per order. There is no order
// store behind this site yet, so /status says so honestly: it checks the
// reference is well formed (shape and check character) and tells the client how they hear about each
// phase until live status pages are switched on. It never shows made-up
// phases or dates.
export const STUDIO_STATUS_HREF = "/status";
export const STUDIO_STATUS_COPY = {
  kicker: "Order status",
  title: "Your order status.",
  lede: "Type the reference from your order email.",
  label: "Your reference",
  placeholder: "e.g. CX-7KM4-PR9A",
  button: "Check",
  honestTitle: "Live status pages are not switched on yet.",
  honest:
    "This site has no order store behind it yet, so it cannot show your phases here. Until it does, we email you after every phase with the render, its due date and any blocker, quoting your reference.",
  bad: "That reference doesn't look right. Check it against your order email: it looks like CX-XXXX-XXXX.",
  good: (ref: string) => `${ref} is a valid CORTEX reference.`,
} as const;
