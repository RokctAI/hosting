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

// `/work` in a shell whose home SDK is hosting_sdk (1.11.0): the studio's
// whole portfolio, ranked, from the shell's own showcase/ folder (read once
// at build time by studio-showcase-load.ts; the built-in list stands in
// when the folder is missing or gives no site). The home page's "See more"
// card opens it.

import type { Metadata } from "next";

import { studioFontClassName } from "@/components/custom/studio/studio-fonts";
import { STUDIO_SHOWCASE_COPY } from "@/components/custom/studio/studio-showcase";
import { loadShowcase } from "@/components/custom/studio/studio-showcase-load";
import { StudioWork } from "@/components/custom/studio/studio-work";

export const metadata: Metadata = {
  title: { absolute: `${STUDIO_SHOWCASE_COPY.page.title} · ROKCT Studio` },
  description: "The ROKCT studio portfolio: every site and logo we have made, best first, filtered by service. Each site live on the web, shown on a phone and a desktop.",
};

export default function Page() {
  const { sites, rescue } = loadShowcase();
  return <StudioWork fontClassName={studioFontClassName} sites={sites} rescue={rescue} />;
}
