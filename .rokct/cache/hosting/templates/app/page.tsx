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

// `/` in a shell whose home SDK is hosting_sdk: the ROKCT studio home
// ("Your brand, taken seriously."): every service with its price, the work,
// the price table, the five phases and the WhatsApp line. The control-site
// plans storefront stays on base_sdk's composed /landing. The page lives in
// components/custom/studio/ (copy in studio-copy.ts, the three faces in
// studio-fonts.ts through next/font).

import type { Metadata } from "next";

import { studioFontClassName } from "@/components/custom/studio/studio-fonts";
import { StudioHome } from "@/components/custom/studio/studio-home";

export const metadata: Metadata = {
  title: { absolute: "ROKCT Studio" },
  description:
    "ROKCT: a design and hosting studio for small businesses. Websites, logos, business plans, pitch decks, print and social posts, with one price before work starts.",
};

export default function Page() {
  return <StudioHome fontClassName={studioFontClassName} />;
}
