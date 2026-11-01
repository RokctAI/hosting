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

// Live site shots on the studio page (hosting_sdk 1.6.0). Ray asked for the
// pictures of each client site to come from that site itself: every shell
// photographs its own first screen from the latest build of main that
// passed its health gate (the shell's "Site shots" workflow) and serves
// the set at <site>/site-shots/ (base_sdk >= 1.55.0). The studio asks each
// client's live site for it through app/studio/shots/[site]/[file]/route.ts,
// which keeps the last good copy and, before there is one, serves the
// pictures committed under public/studio/.
//
// Only the picked option of each "How we design" case and the "Our work"
// proofs are live (1.15.0: the hero's proofs left; see studio-home.tsx).
// Options A and B are fixed, committed images.
//
// A site with no `origin` (its public address is not known yet) always
// shows its committed pictures. STUDIO_SHOTS_ORIGIN_<SITE> (POLARIS,
// SUPACHARGE, SOUTHRIVER, STUDIO) sets or replaces an origin for one
// deployment; "off" turns that site's live pictures off.

import {
  type SiteShotFile,
  isSiteShotFile,
} from "@/components/custom/landing/site-shots";

import { STUDIO_DESIGN_CASES, STUDIO_IMAGES, studioDesignImage } from "./studio-copy";

export type StudioShotSiteId = "polaris" | "supacharge" | "southriver" | "studio";
export type StudioShotTheme = "light" | "dark";

export interface StudioShotSite {
  /** The shell repo the pictures are of (the manifest must name it). */
  repo: string;
  /** The site's public origin, or null while it is not known. */
  origin: string | null;
  /** The pictures the studio page draws of this site. */
  files: SiteShotFile[];
}

const OPTION: SiteShotFile[] = ["option-light.webp", "option-dark.webp"];
const WORK: SiteShotFile[] = ["desktop-light.webp", "desktop-dark.webp", "phone-light.webp", "phone-dark.webp"];

export const STUDIO_SHOT_SITES: Record<StudioShotSiteId, StudioShotSite> = {
  // polaris-web main serves the v3 landing (polaris_sdk 1.8.0); its public
  // address is not recorded anywhere yet, so set it here once it is known.
  polaris: { repo: "RokctAI/polaris-web", origin: null, files: [...OPTION, ...WORK] },
  supacharge: { repo: "RokctAI/supacharge-web", origin: "https://supacharge.school", files: [...OPTION, ...WORK] },
  // southriver-web main has no home page yet ("/" answers 404).
  southriver: { repo: "RokctAI/southriver-web", origin: null, files: OPTION },
  // The studio itself: the hosting shell has no domain yet. Since 1.10.0
  // it is also the first "Our work" card, so it carries the work proofs.
  studio: { repo: "RokctAI/hosting", origin: null, files: [...OPTION, ...WORK] },
};

export function isStudioShotSite(id: string): id is StudioShotSiteId {
  return Object.prototype.hasOwnProperty.call(STUDIO_SHOT_SITES, id);
}

/** Every (site, file) the studio route answers. */
export function studioShotParams(): { site: StudioShotSiteId; file: SiteShotFile }[] {
  return (Object.keys(STUDIO_SHOT_SITES) as StudioShotSiteId[]).flatMap((site) =>
    STUDIO_SHOT_SITES[site].files.map((file) => ({ site, file })),
  );
}

/** The origin to ask, after STUDIO_SHOTS_ORIGIN_<SITE>; null means "use the committed picture". */
export function resolveStudioShotOrigin(
  site: StudioShotSiteId,
  env: Record<string, string | undefined>,
): string | null {
  const set = env[`STUDIO_SHOTS_ORIGIN_${site.toUpperCase()}`]?.trim();
  if (set && set.toLowerCase() === "off") return null;
  const origin = set || STUDIO_SHOT_SITES[site].origin;
  if (!origin) return null;
  try {
    const u = new URL(origin);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    return u.origin;
  } catch {
    return null;
  }
}

/** Where the studio page loads a live picture from. */
export function studioShotSrc(site: StudioShotSiteId, file: SiteShotFile): string {
  return `/studio/shots/${site}/${file}`;
}

/** The theme a file belongs to. */
export function studioShotTheme(file: SiteShotFile): StudioShotTheme {
  return file.endsWith("-dark.webp") ? "dark" : "light";
}

/**
 * The committed picture served while a site has no good live copy: the
 * picked option's thumbnail under public/studio/process/, or the "Our
 * work" proof under public/studio/work/ (one picture for both themes;
 * since 1.15.0 the Polaris and ROKCT ones are their dark first screens).
 */
export function studioShotFallback(site: StudioShotSiteId, file: SiteShotFile): string | null {
  if (!isSiteShotFile(file) || !STUDIO_SHOT_SITES[site].files.includes(file)) return null;
  const theme = studioShotTheme(file);
  if (file.startsWith("option-")) {
    const c = STUDIO_DESIGN_CASES.find((d) => d.id === site);
    const o = c && c.options.find((x) => x.key === c.chosen);
    return c && o ? studioDesignImage(c.id, o, theme) : null;
  }
  const work: Partial<Record<StudioShotSiteId, { desk: string; phone: string }>> = {
    polaris: { desk: STUDIO_IMAGES.polarisDesk, phone: STUDIO_IMAGES.polarisPhone },
    supacharge: { desk: STUDIO_IMAGES.supaDesk, phone: STUDIO_IMAGES.supaPhone },
    studio: { desk: STUDIO_IMAGES.studioDesk, phone: STUDIO_IMAGES.studioPhone },
  };
  const w = work[site];
  if (!w) return null;
  return file.startsWith("desktop-") ? w.desk : w.phone;
}
