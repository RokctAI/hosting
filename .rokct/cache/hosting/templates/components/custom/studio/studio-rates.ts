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

// Live exchange rates for the price display (hosting_sdk 1.20.7; Ray,
// 2026-11-09: one currency picker, live rates, the whole site reads them).
// Prices are set and CHARGED in rand; the dollar figure is a display
// conversion only, rounded to whole dollars and marked "approx." wherever
// an amount is quoted for payment (order summary, order email).
//
// The rate is fetched ON THE SERVER only (never from the browser), from a
// free, keyless source, cached by Next for 12 hours. Any failure (network,
// bad status, bad body, an absurd figure) falls back to the fixed rate the
// site used before, so a page always has a rate.

import { STUDIO_ZAR_PER_USD } from "./studio-copy";

export const STUDIO_RATES_URL = "https://open.er-api.com/v6/latest/ZAR";
export const STUDIO_RATES_REVALIDATE = 43200;

export interface StudioRate {
  /** US dollars per one rand. */
  usdPerZar: number;
  /** false when this is the fixed fallback. */
  live: boolean;
}

export const STUDIO_RATE_FALLBACK: StudioRate = { usdPerZar: 1 / STUDIO_ZAR_PER_USD, live: false };

/** The USD-per-ZAR figure from an open.er-api.com body, or the fallback. */
export function parseStudioRate(body: unknown): StudioRate {
  if (!body || typeof body !== "object") return STUDIO_RATE_FALLBACK;
  const b = body as { result?: unknown; base_code?: unknown; rates?: { USD?: unknown } };
  if (b.result !== "success" || b.base_code !== "ZAR") return STUDIO_RATE_FALLBACK;
  const usd = b.rates?.USD;
  // Sanity band: R5 to R50 to the dollar. Anything outside is a bad feed.
  if (typeof usd !== "number" || !Number.isFinite(usd) || usd < 1 / 50 || usd > 1 / 5) return STUDIO_RATE_FALLBACK;
  return { usdPerZar: usd, live: true };
}

/** Server-only: the current rate, cached for 12 hours, or the fixed fallback. */
export async function getStudioRate(): Promise<StudioRate> {
  try {
    const res = await fetch(STUDIO_RATES_URL, {
      next: { revalidate: STUDIO_RATES_REVALIDATE },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return STUDIO_RATE_FALLBACK;
    return parseStudioRate(await res.json());
  } catch {
    return STUDIO_RATE_FALLBACK;
  }
}
