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

// POST /api/studio/brief (hosting_sdk 1.20.7; Ray: "both forms submit by
// email"). The home page brief form posts JSON { name, email, phone, addons,
// logo, company_url }; the brief text is rebuilt here from the ticked ids
// (never taken from the browser) and sent through the same SMTP config and
// sender as /order. Not configured: a clear 503, never a WhatsApp fallback.

import {
  STUDIO_INTAKE_FORM,
  studioIntakeMessage,
  type StudioAddonId,
} from "@/components/custom/studio/studio-copy";
import { createStudioRateLimiter } from "@/components/custom/studio/studio-order";
import { studioMailConfig, studioRequestHost } from "@/components/custom/studio/studio-order-config";
import { buildStudioBriefMails } from "@/components/custom/studio/studio-order-mail";
import { sendStudioOrderMails } from "@/components/custom/studio/studio-order-send";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const limiter = createStudioRateLimiter();
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const E = STUDIO_INTAKE_FORM.errors;

function reply(status: number, body: Record<string, unknown>): Response {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function POST(request: Request): Promise<Response> {
  try {
    const fwd = request.headers.get("x-forwarded-for");
    const ip = ((fwd ? fwd.split(",")[0] : request.headers.get("x-real-ip")) ?? "").trim() || "unknown";
    if (!limiter.allow(ip)) return reply(429, { ok: false, code: "rate_limited", message: E.failed });

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return reply(400, { ok: false, code: "invalid", message: E.contact });
    }
    if (str(body.company_url, 200)) return reply(200, { ok: true, ref: "" });

    const name = str(body.name, 120);
    const email = str(body.email, 200);
    const phone = str(body.phone, 40);
    if (!name || !EMAIL.test(email)) return reply(400, { ok: false, code: "invalid", message: E.contact });

    const known = STUDIO_INTAKE_FORM.addons.items.map((a) => a.id);
    const addons = (Array.isArray(body.addons) ? body.addons : []).filter((a): a is StudioAddonId => known.includes(a as StudioAddonId));
    const message = studioIntakeMessage(addons, body.logo === true);

    const cfg = studioMailConfig(undefined, studioRequestHost(request.headers));
    if (!cfg.configured) {
      console.warn("[studio-brief] SMTP is not configured; missing:", cfg.missing.join(", "));
      return reply(503, { ok: false, code: "not_configured", message: E.notConfigured });
    }
    const d = new Date();
    const ref = `BR-${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
    const sent = await sendStudioOrderMails(cfg, buildStudioBriefMails({ name, email, phone, message }, { from: cfg.from, ordersEmail: cfg.ordersEmail }, ref));
    if (!sent.ok) return reply(502, { ok: false, code: "send_failed", message: E.failed });
    return reply(200, { ok: true, ref, ack: sent.ack });
  } catch (err) {
    console.error("[studio-brief] unexpected failure:", err instanceof Error ? err.name : "unknown");
    return reply(500, { ok: false, code: "error", message: E.failed });
  }
}
