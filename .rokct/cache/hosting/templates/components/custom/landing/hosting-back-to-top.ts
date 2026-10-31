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

// The ROKCT studio's Back to top button (hosting_sdk 1.7.0), registered
// with base_sdk >= 1.56.0's style registry
// (components/custom/landing/back-to-top-style.ts) through the hosting
// flavour's integrations, so it is the button on every route of the
// hosting shell: the studio home's framed copy (inside `.st`) and the root
// copy on the sign-in pages and the rPanel. Ray, 2026-10-31: the button
// must not look the same on every site; each site takes its own design
// language.
//
// The studio home is a printed proof sheet: ink rules, a paper
// ground, crisp near-square corners (the 3px of its `.flag` labels), the
// 1.5px ink outline of its `.btn`, one burgundy accent kept for emphasis,
// and quiet 200ms transitions. So the button is a rounded square in that
// outline: ink arrow on the paper, filling with the accent on hover, the
// accent focus ring, the sheet's own shadow - and a quiet fade.
//
// Every value names a studio token from studio.css (`.st`, light and dark),
// falling back to base's shadcn token outside `.st` (the sign-in pages,
// the rPanel): --bg, --ink, --acc / --acc-ink, --acc-text, --shadow. Not
// the studio's --card: outside `.st` that name is shadcn's HSL triplet
// ("0 0% 100%"), not a colour, and would blank the button's ground.

import type { BackToTopConfig } from "@/components/custom/landing/back-to-top";

export const HOSTING_BACK_TO_TOP: BackToTopConfig = {
  shape: "rounded-square",
  icon: "arrow-up",
  position: "bottom-right",
  background: "var(--bg, hsl(var(--background)))",
  foreground: "var(--ink, hsl(var(--foreground)))",
  border: "var(--ink, hsl(var(--foreground)))",
  hoverBackground: "var(--acc, hsl(var(--primary)))",
  hoverForeground: "var(--acc-ink, hsl(var(--primary-foreground)))",
  ring: "var(--acc-text, hsl(var(--ring)))",
  radius: "3px",
  borderWidth: "1.5px",
  shadow: "var(--shadow, 0 6px 16px -8px rgb(0 0 0 / 0.35))",
  duration: "200ms",
  easing: "ease",
};

export default HOSTING_BACK_TO_TOP;
