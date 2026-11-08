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

// `/order` in a shell whose home SDK is hosting_sdk (1.18.0): the studio's
// order form. Rendered per request, because the orders address it prints
// follows the host the site is served on (orders@<host without www.>;
// *.vercel.app and localhost fall back to orders@rokct.ai; the
// STUDIO_ORDERS_EMAIL override wins), exactly as the form's route does.

import type { Metadata } from "next";
import { headers } from "next/headers";

import { studioFontClassName } from "@/components/custom/studio/studio-fonts";
import { studioOrdersEmail, studioRequestHost } from "@/components/custom/studio/studio-order-config";
import { StudioOrder } from "@/components/custom/studio/studio-order-page";

export const metadata: Metadata = {
  title: { absolute: "Order · Cortex" },
  description: "Order from Cortex, with forever hosting: five short steps, your logo and photos. We send your brief back to confirm, and your first render within 24 hours of it.",
};

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ordersEmail = studioOrdersEmail(undefined, studioRequestHost(await headers()));
  // PayFast's return_url and cancel_url (studio-pay.ts) land back here.
  const q = await searchParams;
  const paid = typeof q.paid === "string" ? q.paid.replace(/[^A-Za-z0-9-]/g, "").slice(0, 40) : null;
  const back = paid !== null ? { kind: "paid" as const, ref: paid } : q.cancelled ? { kind: "cancelled" as const } : null;
  return <StudioOrder fontClassName={studioFontClassName} ordersEmail={ordersEmail} back={back} />;
}
