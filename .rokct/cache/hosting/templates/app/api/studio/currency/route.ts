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

// GET /api/studio/currency (hosting_sdk 1.20.7): what the currency provider
// needs on first load, from the server: the visitor's default currency by
// IP country (Vercel's x-vercel-ip-country: South Africa, or unknown, is
// rand; anywhere else dollars) and the live rand-to-dollar rate. The rate is
// fetched here, server-side, cached 12 hours (studio-rates.ts), with the
// fixed rate as the fallback; the browser never calls the rate source.

import { getStudioRate } from "@/components/custom/studio/studio-rates";
import { studioCurrencyForCountry } from "@/components/custom/studio/studio-copy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const country = req.headers.get("x-vercel-ip-country");
  const rate = await getStudioRate();
  return Response.json(
    { cur: studioCurrencyForCountry(country), usdPerZar: rate.usdPerZar, live: rate.live },
    { headers: { "cache-control": "private, no-store" } },
  );
}
