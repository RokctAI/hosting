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

// `/terms` in a shell whose home SDK is hosting_sdk (1.20.8): the Terms on
// their own page, titled for Cortex. Per request, because the contact line
// prints the orders address for the host the site is served on.

import type { Metadata } from "next";
import { headers } from "next/headers";

import { studioFontClassName } from "@/components/custom/studio/studio-fonts";
import { studioOrdersEmail, studioRequestHost } from "@/components/custom/studio/studio-order-config";
import { StudioTerms } from "@/components/custom/studio/studio-terms";

export const metadata: Metadata = {
  title: { absolute: "Terms · CORTEX" },
  description: "The CORTEX terms in plain language: payment, phases, due dates, the 24-hour first render or a full refund, domains, hosting and your code.",
};

export default async function Page() {
  const ordersEmail = studioOrdersEmail(undefined, studioRequestHost(await headers()));
  return <StudioTerms fontClassName={studioFontClassName} ordersEmail={ordersEmail} />;
}
