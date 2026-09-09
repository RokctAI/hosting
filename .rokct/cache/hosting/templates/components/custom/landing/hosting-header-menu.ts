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

import type { HeaderMenu } from "@/components/custom/landing/header-menu";

const HOSTING_HEADER_MENU: HeaderMenu = {
  anchors: ["features", "pricing"],
};

export default HOSTING_HEADER_MENU;
