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

// `/startups`: the website and brand deal for startups
// and SMMEs. The same order form as /order (one implementation, one price
// source); this page only changes the hero and the place PayFast returns to.

import type { Metadata } from "next";
import { headers } from "next/headers";

import { studioFontClassName } from "@/components/custom/studio/studio-fonts";
import { studioOrdersEmail, studioRequestHost } from "@/components/custom/studio/studio-order-config";
import { StudioOrder } from "@/components/custom/studio/studio-order-page";
import { studioCleanRef, studioIsOrderRef } from "@/components/custom/studio/studio-pay";
import { studioPayfastConfig } from "@/components/custom/studio/studio-payfast";

export const metadata: Metadata = {
  title: { absolute: "Startups and SMMEs · CORTEX MEDIA" },
  description: "A website and brand for your startup or small business, hosted free for life for the first 1,000 owners. Order online in a few short steps.",
};

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ordersEmail = studioOrdersEmail(undefined, studioRequestHost(await headers()));
  // PayFast's return_url and cancel_url (api/studio/pay) land back here.
  const q = await searchParams;
  // Same rule as /order: only a well-formed reference is echoed back.
  const rawPaid = typeof q.paid === "string" ? studioCleanRef(q.paid) : null;
  const paid = rawPaid !== null ? (studioIsOrderRef(rawPaid) ? rawPaid : "") : null;
  const back = paid !== null ? { kind: "paid" as const, ref: paid } : q.cancelled ? { kind: "cancelled" as const } : null;
  const pay = { card: studioPayfastConfig().enabled };
  return <StudioOrder fontClassName={studioFontClassName} ordersEmail={ordersEmail} back={back} pay={pay} path="/startups" />;
}
