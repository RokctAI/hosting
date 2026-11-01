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

// The studio's portfolio list (hosting_sdk 1.11.0). Ray: the sites come
// from a list, not from code. The hosting shell keeps one JSON file per
// site in its own `showcase/` folder, named `<owner>__<repo>.json`, filled
// by a robot from each site's site-shots branch:
//
//   {"name":"Polaris","kind":"Lender","tagline":"one line",
//    "url":"https://polaris-web-nu.vercel.app","repo":"RokctAI/polaris-web",
//    "rank":8,"shots":{"branch":"site-shots","desktop":"<path>","phone":"<path>"},
//    "logo_back":"rokct"|null}
//
// Rank is 1-10, 10 the best. A picture is
// https://raw.githubusercontent.com/<repo>/<shots.branch>/<path>.
// `logo_back` is optional; only "rokct" means anything today (the ROKCT
// sketch-sheet back), any other value means the card does not flip.
//
// This file is the rules only - parse, check, order - with no imports, so
// the server loader (studio-showcase-load.ts), the client row and the tests
// all run the same code. A file that fails a check is skipped, never
// thrown; when the folder gives no site at all, STUDIO_SHOWCASE_FALLBACK
// keeps the page from rendering empty.

/** The backs a card can turn to. Unknown `logo_back` values map to null. */
export type ShowcaseLogoBack = "rokct";

export const SHOWCASE_LOGO_BACKS: readonly ShowcaseLogoBack[] = ["rokct"];

/** One site, checked and resolved, as the row and the /work page draw it. */
export interface ShowcaseSite {
  /** `<owner>/<repo>`: the key, unique in the list. */
  repo: string;
  name: string;
  kind: string;
  tagline: string;
  /** The live site (https). */
  url: string;
  /** 1-10, 10 the best. */
  rank: number;
  /** Absolute or root-relative picture addresses. */
  phone: string;
  desktop: string;
  logoBack: ShowcaseLogoBack | null;
  /** The site this page is served from (no out-link on its card); set by markOwnSite. */
  own?: boolean;
}

/** How many sites the home row shows before its "See more" card. */
export const SHOWCASE_HOME_COUNT = 6;

/** Where the full ranked list lives. */
export const SHOWCASE_PAGE_HREF = "/work";

/** The shell folder the list is read from, relative to the shell root. */
export const SHOWCASE_DIR = "showcase";

/** A showcase file larger than this is not a site entry. */
export const SHOWCASE_MAX_BYTES = 16 * 1024;

const REPO_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})\/[A-Za-z0-9._-]{1,100}$/;
const FILE_RE = /^([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}))__([A-Za-z0-9._-]{1,100})\.json$/;
const BRANCH_RE = /^[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*$/;
const PATH_RE = /^[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*\.(?:webp|png|jpe?g|avif)$/i;

function text(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.replace(/\s+/g, " ").trim();
  return t.length > 0 && t.length <= max ? t : null;
}

function safeSegments(p: string): boolean {
  return p.split("/").every((s) => s !== "." && s !== ".." && !s.startsWith("."));
}

/** The live site's address, https only, or null. */
export function showcaseUrl(v: unknown): string | null {
  if (typeof v !== "string" || v.length > 300) return null;
  try {
    const u = new URL(v);
    if (u.protocol !== "https:" || !u.hostname || u.username || u.password) return null;
    return u.pathname === "/" && !u.search && !u.hash ? u.origin : u.href;
  } catch {
    return null;
  }
}

/** A picture on a repo's shots branch, as raw.githubusercontent.com serves it. */
export function showcaseShotUrl(repo: string, branch: string, path: string): string {
  return `https://raw.githubusercontent.com/${repo}/${branch}/${path}`;
}

/** The host a card's browser bar shows. */
export function showcaseHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

/** `"rokct"` stays, anything else (missing, null, unknown, not a string) is no flip. */
export function showcaseLogoBack(v: unknown): ShowcaseLogoBack | null {
  return typeof v === "string" && (SHOWCASE_LOGO_BACKS as readonly string[]).includes(v) ? (v as ShowcaseLogoBack) : null;
}

/** The `<owner>/<repo>` a showcase file name stands for, or null when it is not `<owner>__<repo>.json`. */
export function showcaseFileRepo(fileName: string): string | null {
  const m = FILE_RE.exec(fileName);
  return m ? `${m[1]}/${m[2]}` : null;
}

/**
 * One parsed showcase file, checked against the schema. Returns the
 * resolved site, or null for anything that does not hold: a missing or
 * empty field, a rank outside 1-10, a non-https site, a shots path that
 * climbs out of the branch, or a file name that does not match its repo.
 */
export function parseShowcaseEntry(raw: unknown, fileName?: string): ShowcaseSite | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const name = text(o.name, 60);
  const kind = text(o.kind, 40);
  const tagline = text(o.tagline, 160);
  const url = showcaseUrl(o.url);
  const repo = typeof o.repo === "string" && REPO_RE.test(o.repo) ? o.repo : null;
  const rank = typeof o.rank === "number" && Number.isInteger(o.rank) && o.rank >= 1 && o.rank <= 10 ? o.rank : null;
  if (!name || !kind || !tagline || !url || !repo || rank === null) return null;
  if (fileName !== undefined) {
    const fileRepo = showcaseFileRepo(fileName);
    if (!fileRepo || fileRepo.toLowerCase() !== repo.toLowerCase()) return null;
  }
  const shots = o.shots;
  if (!shots || typeof shots !== "object" || Array.isArray(shots)) return null;
  const s = shots as Record<string, unknown>;
  const branch = typeof s.branch === "string" && s.branch.length <= 100 && BRANCH_RE.test(s.branch) && safeSegments(s.branch) ? s.branch : null;
  const desktop = typeof s.desktop === "string" && s.desktop.length <= 300 && PATH_RE.test(s.desktop) && safeSegments(s.desktop) ? s.desktop : null;
  const phone = typeof s.phone === "string" && s.phone.length <= 300 && PATH_RE.test(s.phone) && safeSegments(s.phone) ? s.phone : null;
  if (!branch || !desktop || !phone) return null;
  return {
    repo,
    name,
    kind,
    tagline,
    url,
    rank,
    phone: showcaseShotUrl(repo, branch, phone),
    desktop: showcaseShotUrl(repo, branch, desktop),
    logoBack: showcaseLogoBack(o.logo_back),
  };
}

/** Rank high to low, then name A to Z, then repo (so the order never depends on the folder's). */
export function sortShowcase(sites: ShowcaseSite[]): ShowcaseSite[] {
  return [...sites].sort(
    (a, b) =>
      b.rank - a.rank ||
      a.name.localeCompare(b.name, "en", { sensitivity: "base" }) ||
      a.repo.toLowerCase().localeCompare(b.repo.toLowerCase(), "en"),
  );
}

/**
 * The checked, ordered list from the folder's files (name and text each).
 * A file that does not parse or check is skipped; a repo listed twice keeps
 * its first file in name order.
 */
export function buildShowcase(files: { name: string; text: string }[]): ShowcaseSite[] {
  const seen = new Set<string>();
  const out: ShowcaseSite[] = [];
  for (const f of [...files].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))) {
    if (!f.name.endsWith(".json") || f.text.length > SHOWCASE_MAX_BYTES) continue;
    let raw: unknown;
    try {
      raw = JSON.parse(f.text);
    } catch {
      continue;
    }
    const site = parseShowcaseEntry(raw, f.name);
    if (!site || seen.has(site.repo.toLowerCase())) continue;
    seen.add(site.repo.toLowerCase());
    out.push(site);
  }
  return sortShowcase(out);
}

/**
 * The built-in list, used only when the shell has no showcase folder or it
 * gives no site: ROKCT, Polaris and Supacharge with their real addresses
 * (studio-shots.ts) and their pictures from the studio's own shots route,
 * which serves each site's live picture or the committed one under
 * public/studio/work/.
 */
export const STUDIO_SHOWCASE_FALLBACK: ShowcaseSite[] = [
  {
    repo: "RokctAI/hosting",
    name: "ROKCT",
    kind: "Our own studio",
    tagline: "Our own site, made the way we make yours.",
    url: "https://hosting-beta-one.vercel.app",
    rank: 10,
    phone: "/studio/shots/studio/phone-light.webp",
    desktop: "/studio/shots/studio/desktop-light.webp",
    logoBack: "rokct",
  },
  {
    repo: "RokctAI/polaris-web",
    name: "Polaris",
    kind: "Lender",
    tagline: "The full cost, on the page before anyone applies.",
    url: "https://polaris-web-nu.vercel.app",
    rank: 9,
    phone: "/studio/shots/polaris/phone-light.webp",
    desktop: "/studio/shots/polaris/desktop-light.webp",
    logoBack: null,
  },
  {
    repo: "RokctAI/supacharge-web",
    name: "Supacharge",
    kind: "Learning app",
    tagline: "Sends learners to the app store in one screen.",
    url: "https://supacharge.school",
    rank: 9,
    phone: "/studio/shots/supacharge/phone-light.webp",
    desktop: "/studio/shots/supacharge/desktop-light.webp",
    logoBack: null,
  },
];

/** The list to draw: the folder's sites, or the built-in three when it gives none. */
export function showcaseOrFallback(sites: ShowcaseSite[]): { sites: ShowcaseSite[]; fallback: boolean } {
  return sites.length > 0 ? { sites, fallback: false } : { sites: sortShowcase(STUDIO_SHOWCASE_FALLBACK), fallback: true };
}

/**
 * A picture the site serves itself: a root-relative path ("/studio/..."),
 * answered by this deployment (the studio shots route, or the picture
 * committed under public/studio/), not fetched from another host.
 */
export function showcaseIsLocal(src: unknown): boolean {
  return typeof src === "string" && src.startsWith("/") && !src.startsWith("//") && !src.includes("\\");
}

/**
 * The runtime stand-in (gatekeeper, hardware#60): when the folder gave
 * sites but the browser drops every one of them (their pictures fail, for
 * instance a site's latest/ shots that are not there yet), the row and the
 * grid swap to the built-in list instead of ending empty. Only when every
 * built-in picture is bundled with the site (showcaseIsLocal); otherwise,
 * and when the built-in list is already the one showing, there is none
 * ([]) and the section hides.
 */
export function showcaseRescueList(
  fallbackInUse: boolean,
  list: ShowcaseSite[] = STUDIO_SHOWCASE_FALLBACK,
): ShowcaseSite[] {
  if (fallbackInUse || list.length === 0) return [];
  if (!list.every((s) => showcaseIsLocal(s.phone) && showcaseIsLocal(s.desktop))) return [];
  return sortShowcase(list);
}

/**
 * What a showcase block does after the browser's checks. "show" while the
 * checks run or any site is left; "rescue" when every site has dropped and
 * a stand-in list is there and not yet tried; "gone" when nothing is left
 * to show: the whole section hides (no empty frame, no See more card).
 */
export type ShowcasePhase = "show" | "rescue" | "gone";

export function showcasePhase(shown: number, ready: boolean, rescued: boolean, rescueCount: number): ShowcasePhase {
  if (!ready || shown > 0) return "show";
  if (!rescued && rescueCount > 0) return "rescue";
  return "gone";
}

/**
 * The repo of the site this page is served from (Ray: the visitor is
 * already on it, so its card shows no out-link). STUDIO_SITE_REPO when
 * set, else base_sdk's site-shots repo rule: SITE_SHOTS_REPO, else the repo
 * Vercel built from (VERCEL_GIT_REPO_OWNER / VERCEL_GIT_REPO_SLUG). Null
 * when none names an owner/name. Nothing here names the hosting repo, so a
 * rename needs no code change.
 */
export function showcaseOwnRepo(env: Record<string, string | undefined>): string | null {
  const vercel =
    env.VERCEL_GIT_REPO_OWNER?.trim() && env.VERCEL_GIT_REPO_SLUG?.trim()
      ? `${env.VERCEL_GIT_REPO_OWNER.trim()}/${env.VERCEL_GIT_REPO_SLUG.trim()}`
      : "";
  const repo = env.STUDIO_SITE_REPO?.trim() || env.SITE_SHOTS_REPO?.trim() || vercel;
  return REPO_RE.test(repo) ? repo : null;
}

/** Marks the card whose repo is the site's own (case-insensitive). */
export function markOwnSite(sites: ShowcaseSite[], ownRepo: string | null): ShowcaseSite[] {
  const own = ownRepo ? ownRepo.toLowerCase() : null;
  return sites.map((s) => ({ ...s, own: own !== null && s.repo.toLowerCase() === own }));
}

/** True when a card's live site is the host the visitor is on (the browser-side check). */
export function showcaseIsHost(url: string, host: string | null | undefined): boolean {
  if (!host) return false;
  try {
    return new URL(url).host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}

/** A card's pictures: pending until both load, then ok, or fail if either does not. */
export type ShotStatus = "pending" | "ok" | "fail";

/**
 * The sites a row or grid shows. Before the pictures are checked (`ready`
 * false: the server render, and the first moments in the browser) every
 * site is drawn; after, only the ones whose two pictures both loaded, so
 * a site with a missing picture leaves the row and the row closes up.
 */
export function visibleShowcase<T extends { repo: string }>(sites: T[], status: Record<string, ShotStatus>, ready: boolean): T[] {
  if (!ready) return sites.filter((s) => status[s.repo] !== "fail");
  return sites.filter((s) => status[s.repo] === "ok");
}

/**
 * The number on the row's "See more" card (1.12.0): the whole list less the
 * row's own sites whose pictures failed, so a card that dropped out is not
 * counted ("All 6" while 5 render). Sites past the row are not checked on
 * the home page and still count; never fewer than the row shows. Once the
 * stand-in has taken over, it is the stand-in's own length.
 */
export function showcaseMoreCount(total: number, rowSites: number, rowShown: number, rescued: boolean, rescueTotal: number): number {
  if (rescued) return rescueTotal;
  return Math.max(rowShown, total - Math.max(0, rowSites - rowShown));
}

/** The words on the row and the /work page. */
export const STUDIO_SHOWCASE_COPY = {
  rowLabel: "Our work, shown as phone screens; point at or focus a card to see the desktop site",
  rowLabelPhone: "Our work: swipe the phones, tap one to see the desktop site",
  roleDescription: "project",
  pause: "Pause the motion",
  play: "Play the motion",
  open: (name: string) => `Open the ${name} site (opens in a new tab)`,
  openTitle: (name: string) => `Open the ${name} site`,
  phoneAlt: (name: string) => `${name} home page on a phone`,
  desktopAlt: (name: string) => `${name} home page on a desktop`,
  turn: "See the logo",
  back: "Back to the site",
  logoKicker: "The logo",
  more: "See more",
  moreSub: (n: number) => (n === 1 ? "One site, ranked" : `All ${n} sites, ranked`),
  allWork: "All our work",
  page: {
    title: "Our work",
    kicker: "ROKCT studio · Portfolio",
    heading: "Every site we have built, best first.",
    lede: "Each one live on the web, shown as it renders on a phone and a desktop. Open any of them in a new tab and click around.",
    count: (n: number) => (n === 1 ? "1 site" : `${n} sites`),
    back: "Back to the studio",
    cta: "Want yours here? Message us on WhatsApp",
  },
};
