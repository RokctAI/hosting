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

// The CORTEX tender portfolio (hosting_sdk 1.27.0, Ray 2026-11-21): the
// versioned, printable portfolio at /portfolio and its A4 twin at
// /portfolio/print, which the weekly robot prints to a PDF.
//
// Data: the shell's `portfolio/current.json`, written once a week, and only
// when something changed, by shared-workflows scripts/portfolio/snapshot.py
// from the showcase cards each site announces from its own repo (curation
// lives with the site; `features` names what THAT client's work does) plus
// `portfolio/print.json` (print work, kept on the CORTEX site itself).
// Each version freezes its pictures, so the page never moves between weeks.
//
// Sections never mix (Ray): what every client gets is shown ONCE; then
// websites, apps, and brand work each in their own section, even when one
// client has all three; then print.

import { tx } from "@/app/lib/i18n/phrases";

import {
  parseShowcaseEntry,
  sortShowcase,
  type ShowcaseEntry,
} from "./studio-showcase";

/** The page's address and its A4 twin's. */
export const PORTFOLIO_HREF = "/portfolio";
export const PORTFOLIO_PRINT_HREF = "/portfolio/print";

/** Where the shell keeps the snapshot (beside showcase/). */
export const PORTFOLIO_DIR = "portfolio";
export const PORTFOLIO_MAX_BYTES = 512 * 1024;

/** Where the robot publishes each version's PDF (the registry's assets branch). */
/** The bidder's registered details (CIPC). Only facts on record; nothing typed from memory.
 * These are ROKCT Intelligence's until CORTEX is registered separately (Ray 2026-11-21); swap here then. */
export const PORTFOLIO_COMPANY = {
  legal: "ROKCT Intelligence (Pty) Ltd",
  trading: "CORTEXAGENCY.co",
  reg: "2025/919921/07",
  bbbee: "Level 1",
} as const;

export const PORTFOLIO_ASSETS_BASE = "https://raw.githubusercontent.com/RokctAI/hosting/portfolio-assets";

/**
 * What every client's site gets, shown once and never repeated per client
 * (Ray: "auth can be shown once saying all our client sites get it or
 * security updates"). Each line is true of every site the studio ships:
 * auth_sdk sign-in, the Weekly Site Refresh, trkeys EN+AF, base_sdk's
 * theme switch and install offer, Vercel hosting.
 */
export const PORTFOLIO_SHARED: readonly { title: string; line: string }[] = [
  { title: "Secure sign-in", line: "Accounts, password reset and roles on every site." },
  { title: "Weekly updates", line: "Security fixes and improvements land every week, automatically." },
  { title: "English and Afrikaans", line: "Every word on the site in both languages." },
  { title: "Light and dark", line: "Follows the visitor's device, logos included." },
  { title: "Fast, secure hosting", line: "Global hosting with SSL on your own domain." },
  { title: "Installs like an app", line: "Visitors can add the site to their phone's home screen." },
];

export const PORTFOLIO_COPY = {
  title: "Portfolio",
  kicker: "CORTEX portfolio",
  heading: "Real work for real clients.",
  lede: "Websites, apps, brands and print we have made for clients, with what each one does.",
  updated: "Last updated from live data on",
  version: "Version",
  pdf: "Download PDF",
  pdfLater: "The PDF of this version is being prepared.",
  shared: { n: "01", title: "Every client gets this", note: "Shown once" },
  websites: { n: "02", title: "Websites" },
  apps: { n: "03", title: "Apps" },
  brand: { n: "04", title: "Brand and logo" },
  print: { n: "05", title: "Print" },
  changes: "What changed in this version",
  visit: "Visit site",
  store: "Get the app",
  forClient: "For",
  noVersion: "Not versioned yet: showing the current cards.",
  pages: "Page",
  cover: { line: "Websites · Apps · Brand · Print", by: "ROKCT Intelligence (Pty) Ltd trading as CORTEXAGENCY.co" },
  company: {
    title: "Company",
    legal: "Registered name",
    trading: "Trading as",
    reg: "CIPC registration",
    bbbee: "B-BBEE status",
    services: "Services",
    servicesLine: "Websites, apps, brand and logo design, print",
    refs: "Live work you can check",
    refsNote: "Every site below is public; open it to see the work.",
  },
  copyright: "Copyright reserved. This portfolio may not be copied or used in another bidder's tender.",
  sharedPage: "Included for every client",
  glance: { title: "At a glance", clients: "Brands", sectors: "Brands we have built for" },
  workLink: "Company portfolio and PDF",
} as const;

export interface PortfolioPrintItem {
  client: string;
  title: string;
  line: string;
  /** https picture address. */
  image: string;
}

export interface PortfolioApp {
  name: string;
  client: string;
  phone: string;
  store: string | null;
}

export interface PortfolioLogo {
  client: string;
  kind: string;
  light: string;
  dark: string | null;
}

export interface Portfolio {
  /** "2026.47"; null when the shell has no snapshot yet (cards read live). */
  version: string | null;
  /** ISO date of the version. */
  date: string | null;
  changes: string[];
  sites: ShowcaseEntry[];
  websites: Extract<ShowcaseEntry, { website: true }>[];
  apps: PortfolioApp[];
  logos: PortfolioLogo[];
  print: PortfolioPrintItem[];
  /** The version's PDF, once versioned. */
  pdf: string | null;
}

function httpsUrl(v: unknown): string | null {
  if (typeof v !== "string") return null;
  try {
    const u = new URL(v);
    return u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

function line(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.replace(/\s+/g, " ").trim();
  return t && t.length <= max ? t : null;
}

/** print.json entries that check out; anything else is skipped. */
export function parsePrint(v: unknown): PortfolioPrintItem[] {
  if (!Array.isArray(v)) return [];
  const out: PortfolioPrintItem[] = [];
  for (const x of v) {
    if (!x || typeof x !== "object") continue;
    const o = x as Record<string, unknown>;
    const client = line(o.client, 60);
    const title = line(o.title, 60);
    const l = line(o.line, 160);
    const image = httpsUrl(o.image);
    if (client && title && l && image) out.push({ client, title, line: l, image });
  }
  return out;
}

/**
 * One snapshot item: the card as announced, with the version's frozen
 * pictures put in place of the live ones.
 */
export function parseSnapshotItem(raw: unknown): ShowcaseEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const entry = parseShowcaseEntry(o.card);
  if (!entry) return null;
  const pics = (o.pictures && typeof o.pictures === "object" ? o.pictures : {}) as Record<string, unknown>;
  const pic = (k: string) => httpsUrl(pics[k]);
  const out = { ...entry } as ShowcaseEntry;
  if (out.website) {
    out.desktop = pic("desktop") ?? out.desktop;
    out.phone = pic("phone") ?? out.phone;
  }
  if (out.logo) out.logo = { light: pic("logo-light") ?? out.logo.light, dark: pic("logo-dark") ?? out.logo.dark };
  out.apps = out.apps.map((a, i) => ({ ...a, phone: pic(`app-${i}`) ?? a.phone }));
  return out;
}

/** Splits the cards into the sections, never mixing a client's kinds of work. */
export function buildPortfolio(input: {
  version: string | null;
  date: string | null;
  changes: string[];
  sites: ShowcaseEntry[];
  print: PortfolioPrintItem[];
}): Portfolio {
  const sites = sortShowcase(input.sites);
  const websites = sites.filter((s): s is Extract<ShowcaseEntry, { website: true }> => s.website);
  const apps: PortfolioApp[] = sites.flatMap((s) =>
    s.apps.map((a) => ({ name: a.name, client: s.name, phone: a.phone, store: a.store })),
  );
  const logos: PortfolioLogo[] = sites
    .filter((s) => s.logo !== null)
    .map((s) => ({ client: s.name, kind: s.kind, light: s.logo!.light, dark: s.logo!.dark }));
  return {
    version: input.version,
    date: input.date,
    changes: input.changes,
    sites,
    websites,
    apps,
    logos,
    print: input.print,
    pdf: input.version ? `${PORTFOLIO_ASSETS_BASE}/${input.version}/cortex-portfolio-${input.version}.pdf` : null,
  };
}

/** Parses portfolio/current.json's text; null when it is missing or wrong. */
export function parseSnapshot(text: string | null, print: PortfolioPrintItem[]): Portfolio | null {
  if (!text) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const version = line(o.version, 20);
  const date = typeof o.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(o.date) ? o.date : null;
  if (!version || !date || !Array.isArray(o.items)) return null;
  const sites = o.items.map(parseSnapshotItem).filter((s): s is ShowcaseEntry => s !== null);
  const changes = Array.isArray(o.changes) ? o.changes.map((c) => line(c, 120)).filter((c): c is string => !!c) : [];
  const snapPrint = parsePrint(o.print);
  return buildPortfolio({ version, date, changes, sites, print: snapPrint.length ? snapPrint : print });
}

/** "22 November 2026" from "2026-11-22" (month name through tx, so Afrikaans readers get theirs). */
export function portfolioDate(iso: string | null): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${d} ${tx(months[m - 1])} ${y}`;
}

/** The live site's host for a caption ("polaris-web-nu.vercel.app"). */
export function portfolioHost(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}
