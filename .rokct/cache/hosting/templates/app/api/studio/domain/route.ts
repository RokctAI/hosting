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

// GET /api/studio/domain?name=<domain> (hosting_sdk 1.20.3): the order form's
// "is it free to register?" check for a client who needs a domain. Answers
// { ok, name, result: "available" | "taken" | "unknown", text, note } and
// never throws: a failed check is "unknown", and the form still sends.
// .com asks Verisign's public RDAP; .co.za has no public RDAP that answers
// for it, so a name with nameservers is "taken" and anything else "unknown"
// (studioCheckDomain in studio-order.ts). No keys, no accounts.

import { studioHasNameservers } from "@/components/custom/studio/studio-domain-dns";
import {
  STUDIO_DOMAIN_CHECK_NOTE,
  STUDIO_DOMAIN_CHECK_TEXT,
  STUDIO_DOMAIN_ENDING_ERROR,
  createStudioRateLimiter,
  studioCheckDomain,
  studioRegistrableDomain,
} from "@/components/custom/studio/studio-order";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10;

const limiter = createStudioRateLimiter(30);

function reply(status: number, body: Record<string, unknown>): Response {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

export async function GET(request: Request): Promise<Response> {
  try {
    const fwd = request.headers.get("x-forwarded-for");
    const key = ((fwd ? fwd.split(",")[0] : request.headers.get("x-real-ip")) ?? "").trim() || "unknown";
    const raw = new URL(request.url).searchParams.get("name") ?? "";
    const name = studioRegistrableDomain(raw.slice(0, 253));
    if (!name) return reply(400, { ok: false, message: STUDIO_DOMAIN_ENDING_ERROR });
    const result = limiter.allow(key) ? await studioCheckDomain(name, { hasNameservers: studioHasNameservers }) : "unknown";
    return reply(200, { ok: true, name, result, text: STUDIO_DOMAIN_CHECK_TEXT[result], note: STUDIO_DOMAIN_CHECK_NOTE });
  } catch {
    return reply(200, { ok: true, result: "unknown", text: STUDIO_DOMAIN_CHECK_TEXT.unknown, note: STUDIO_DOMAIN_CHECK_NOTE });
  }
}
