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

// The hosting storefront's header menu, for base_sdk's header-menu registry
// (components/custom/landing/header-menu.ts, base_sdk >= 1.14.0), which the
// shared header renders inside itself: inline beside the logo from the `lg`
// breakpoint up, behind a burger below it.
//
// Flat entries only. The two are ANCHORS, not links: hosting-features-
// section.tsx and hosting-pricing-section.tsx register their own
// `{ id, label }` in meta.nav, base resolves each id against the page's live
// nav, lifts the label from there, and drops the entry on a render where the
// section is not on the page (the pricing section turns itself down when the
// platform returns no plan rows), which a hand-written "#pricing" href could
// not do. No groups: a storefront for one product has no product panel. No
// `actions`: the header already draws Log in and Sign up beside the row
// (components/custom/header.tsx, the auth link and the auth pill), and a
// second pair would only repeat them.
//
// `brand: { logo: "none" }` (base_sdk >= 1.21.0's HeaderMenu.brand): the
// home SDK declares whether the header shows a logo (Ray, 2026-09-09,
// 14:15Z), and no hosting artwork exists in any source, so the header draws
// no image and the wordmark (the host's branding.tsx) is the logo.
// `wordmark` is left at its default, true. Against a base_sdk older than
// 1.21.0 the field is unknown to the registry's HeaderMenu type and the
// compose fails to type-check, which is the floor the manifest names.

import type { HeaderMenu } from "@/components/custom/landing/header-menu";

const HOSTING_HEADER_MENU: HeaderMenu = {
  // No hosting icon yet: the wordmark alone (Ray, 2026-09-09).
  brand: { logo: "none" },
  anchors: ["features", "pricing"],
};

export default HOSTING_HEADER_MENU;
