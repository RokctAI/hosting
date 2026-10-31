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

// /studio/shots/<site>/<file>.webp (hosting_sdk 1.6.0): a client site's
// live picture of its own first screen, for the studio page. Read from
// <origin>/site-shots/ on the client's live site (base_sdk >= 1.55.0 serves
// it there from the shell repo's site-shots branch), checked against the
// site's manifest: the manifest must name the client's repo, and the image
// must be a WebP of the listed size, length and SHA-256.
//
// Each path is a static route regenerated at most hourly. A regeneration
// that fails - the site is offline or broken, the manifest or the image
// does not check out - THROWS, and Next keeps serving the last picture it
// generated. At build time (no picture yet), and always for a site with no
// known origin, the answer is the picture committed under public/studio/.
// See components/custom/studio/studio-shots.ts for the sites.

import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  SITE_SHOTS_MANIFEST,
  SITE_SHOTS_REVALIDATE_SECONDS,
  checkSiteShot,
  isSiteShotFile,
  parseSiteShotsManifest,
  siteShotHeaders,
} from "@/components/custom/landing/site-shots";
import {
  STUDIO_SHOT_SITES,
  isStudioShotSite,
  resolveStudioShotOrigin,
  studioShotFallback,
  studioShotParams,
  type StudioShotSiteId,
} from "@/components/custom/studio/studio-shots";
import type { SiteShotFile } from "@/components/custom/landing/site-shots";

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return studioShotParams();
}

async function readFrom(origin: string, name: string): Promise<Uint8Array> {
  const res = await fetch(`${origin}/site-shots/${name}`, {
    next: { revalidate: SITE_SHOTS_REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`studio shots: ${origin}/site-shots/${name} answered ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}

async function live(site: StudioShotSiteId, file: SiteShotFile, origin: string): Promise<Response> {
  const raw = await readFrom(origin, SITE_SHOTS_MANIFEST);
  const parsed = parseSiteShotsManifest(JSON.parse(new TextDecoder().decode(raw)), STUDIO_SHOT_SITES[site].repo);
  if (!parsed.ok) throw new Error(`studio shots: ${site} manifest rejected (${parsed.reason})`);
  const checked = checkSiteShot(file, await readFrom(origin, file), parsed.value);
  if (!checked.ok) throw new Error(`studio shots: ${site} ${checked.reason}`);
  return new Response(checked.value as BodyInit, { headers: siteShotHeaders("image/webp", parsed.value.commit) });
}

async function committed(site: StudioShotSiteId, file: SiteShotFile): Promise<Response> {
  const src = studioShotFallback(site, file);
  if (!src) return new Response("Not found", { status: 404 });
  const bytes = await readFile(path.join(process.cwd(), "public", src));
  return new Response(new Uint8Array(bytes) as BodyInit, {
    headers: { ...siteShotHeaders("image/webp", "committed"), "x-studio-shot-source": src },
  });
}

export async function GET(_request: Request, { params }: { params: Promise<{ site: string; file: string }> }) {
  const { site, file } = await params;
  if (!isStudioShotSite(site) || !isSiteShotFile(file) || !STUDIO_SHOT_SITES[site].files.includes(file)) {
    return new Response("Not found", { status: 404 });
  }
  const origin = resolveStudioShotOrigin(site, process.env);
  if (!origin) return committed(site, file);
  try {
    return await live(site, file, origin);
  } catch (error) {
    if (process.env.NEXT_PHASE === "phase-production-build") {
      console.warn(`${error instanceof Error ? error.message : error}; serving the committed picture until a regeneration succeeds`);
      return committed(site, file);
    }
    // Next keeps the last picture it generated for this path.
    throw error;
  }
}
