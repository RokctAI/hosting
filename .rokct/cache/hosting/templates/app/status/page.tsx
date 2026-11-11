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

// `/status` in a shell whose home SDK is hosting_sdk (1.20.8): the order
// status page, looked up by ?ref=. Honest until an order store exists
// (studio-status.tsx).

import type { Metadata } from "next";

import { studioFontClassName } from "@/components/custom/studio/studio-fonts";
import { StudioStatus } from "@/components/custom/studio/studio-status";

export const metadata: Metadata = {
  title: { absolute: "Order status · CORTEX" },
  description: "Check a CORTEX order by its reference.",
  robots: { index: false },
};

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = await searchParams;
  const ref = typeof q.ref === "string" ? q.ref.slice(0, 40) : "";
  return <StudioStatus fontClassName={studioFontClassName} refCode={ref} />;
}
