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

// Reads the shell's portfolio list (hosting_sdk 1.11.0), server side only.
//
// The seam is a folder the SHELL owns: `showcase/` at the shell root, one
// `<owner>__<repo>.json` per site, committed to RokctAI/hosting by its own
// robot. No SDK installs anything there and no compose touches it, so it
// survives every compose, and the SDK finds it the way base_sdk finds a
// host-shipped icon (app/lib/site-metadata.ts hostIconExists()): a path
// joined onto process.cwd(), the shell root at build time. The home page
// and /work are static, so the folder is read once, by `next build`.
//
// Nothing here throws: a missing folder, an unreadable file or a file that
// fails studio-showcase.ts's checks is skipped (and named in one build log
// line), and when no site is left the built-in list stands in.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import {
  SHOWCASE_DIR,
  SHOWCASE_MAX_BYTES,
  buildShowcase,
  markOwnSite,
  showcaseOrFallback,
  showcaseOwnRepo,
  showcaseRescueList,
  type ShowcaseSite,
} from "./studio-showcase";

/** Every `*.json` in the folder, name and text; empty when the folder is missing or unreadable. */
export function readShowcaseFiles(dir: string): { name: string; text: string }[] {
  let names: string[];
  try {
    names = readdirSync(dir);
  } catch {
    return [];
  }
  const files: { name: string; text: string }[] = [];
  for (const name of names) {
    if (!name.endsWith(".json")) continue;
    try {
      const p = join(dir, name);
      const st = statSync(p);
      if (!st.isFile() || st.size > SHOWCASE_MAX_BYTES) continue;
      files.push({ name, text: readFileSync(p, "utf8") });
    } catch {
      /* unreadable: skipped like an invalid file */
    }
  }
  return files;
}

/**
 * The portfolio, ranked: the shell's `showcase/` sites, or the built-in
 * list when the folder is missing or gives none. `root` is the shell root
 * (process.cwd() under `next build` and `next start`); `env` names the
 * site's own repo (showcaseOwnRepo), whose card gets no out-link.
 * `rescue` is the stand-in for the browser (showcaseRescueList).
 */
export function loadShowcase(
  root: string = process.cwd(),
  env: Record<string, string | undefined> = process.env,
): { sites: ShowcaseSite[]; fallback: boolean; rescue: ShowcaseSite[] } {
  const files = readShowcaseFiles(join(root, SHOWCASE_DIR));
  const sites = buildShowcase(files);
  const skipped = files.length - sites.length;
  if (skipped > 0) {
    console.warn(`[studio] showcase/: skipped ${skipped} of ${files.length} file(s) that did not pass the checks`);
  }
  const out = showcaseOrFallback(sites);
  // The site this page is served from loses its out-link (showcaseOwnRepo).
  const own = showcaseOwnRepo(env);
  // `rescue`: the built-in list the browser swaps in if every folder site
  // drops at runtime ([] when it is already showing or not bundled).
  return {
    ...out,
    sites: markOwnSite(out.sites, own),
    rescue: markOwnSite(showcaseRescueList(out.fallback), own),
  };
}
