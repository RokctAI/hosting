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

// POST /api/studio/order (hosting_sdk 1.18.0): the studio order form's
// endpoint. Rate-limits, checks every answer and file on the server, then
// sends the order (every answer, every file attached) to the orders address
// and the acknowledgement to the client, over SMTP through our own mail VPS
// (studio-order-send.ts). Settings come from the environment; the orders
// address from the host the request was served on (orders@<host>, *.vercel.app
// and localhost falling back to orders@rokct.ai), STUDIO_ORDERS_EMAIL
// overriding both (studio-order-config.ts).
//
// Always answers JSON and never throws: with SMTP not configured, or any
// failure, the answer is { ok: false, code, message, whatsapp } and the form
// offers WhatsApp instead. Nothing here logs a setting's value.

import {
  STUDIO_ORDER_FILE_FIELDS,
  STUDIO_ORDER_MAX_BYTES,
  STUDIO_ORDER_MESSAGES,
  createStudioRateLimiter,
  studioCheckDomain,
  validateStudioOrder,
  type StudioOrderFileField,
  type StudioOrderInput,
  type StudioOrderUpload,
} from "@/components/custom/studio/studio-order";
import { studioMailConfig, studioRequestHost } from "@/components/custom/studio/studio-order-config";
import { buildStudioOrderMails, type StudioMailAttachment } from "@/components/custom/studio/studio-order-mail";
import { studioHasNameservers } from "@/components/custom/studio/studio-domain-dns";
import { sendStudioOrderMails } from "@/components/custom/studio/studio-order-send";
import { STUDIO_ADDONS, studioOrderZar } from "@/components/custom/studio/studio-copy";
import { studioPayAfterSend } from "@/components/custom/studio/studio-pay-qr";
import { studioOrderRef, studioPayHref } from "@/components/custom/studio/studio-pay";
import { studioBankAccount, studioPayfastConfig } from "@/components/custom/studio/studio-payfast";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const limiter = createStudioRateLimiter();

function reply(status: number, body: Record<string, unknown>): Response {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

// 1.20.7 (Ray): the order goes by email only; a failure says so plainly and
// never falls back to WhatsApp.
function fail(status: number, code: string, message: string, extra: Record<string, unknown> = {}) {
  return reply(status, { ok: false, code, message, ...extra });
}

function clientKey(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  const ip = (fwd ? fwd.split(",")[0] : request.headers.get("x-real-ip")) ?? "";
  return ip.trim() || "unknown";
}

export async function POST(request: Request): Promise<Response> {
  try {
    if (!limiter.allow(clientKey(request))) {
      return fail(429, "rate_limited", STUDIO_ORDER_MESSAGES.rateLimited);
    }
    const length = Number(request.headers.get("content-length") ?? "0");
    if (length > STUDIO_ORDER_MAX_BYTES + 512 * 1024) {
      return fail(413, "too_large", STUDIO_ORDER_MESSAGES.tooLarge);
    }

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return fail(400, "invalid", STUDIO_ORDER_MESSAGES.invalid);
    }

    const fields: StudioOrderInput = {};
    const files: { upload: StudioOrderUpload; file: File }[] = [];
    for (const [key, value] of form.entries()) {
      if (typeof value === "string") {
        const prev = fields[key];
        fields[key] = prev === undefined ? value : Array.isArray(prev) ? [...prev, value] : [prev, value];
      } else if ((STUDIO_ORDER_FILE_FIELDS as readonly string[]).includes(key) && value.size > 0) {
        files.push({ upload: { field: key as StudioOrderFileField, name: value.name, type: value.type, size: value.size }, file: value });
      }
    }

    const check = validateStudioOrder(
      fields,
      files.map((f) => f.upload),
    );
    if (!check.ok) {
      if (check.bot) return reply(200, { ok: true, ref: "", ack: false });
      if (check.tooLarge) return fail(413, "too_large", STUDIO_ORDER_MESSAGES.tooLarge, { errors: check.errors });
      return fail(400, "invalid", STUDIO_ORDER_MESSAGES.invalid, { errors: check.errors });
    }

    // The orders address follows the host this request was served on
    // (orders@<host without www.>), unless STUDIO_ORDERS_EMAIL overrides it.
    const cfg = studioMailConfig(undefined, studioRequestHost(request.headers));
    if (!cfg.configured) {
      // Names only, never values: tells whoever reads the log what to set.
      console.warn("[studio-order] SMTP is not configured; missing:", cfg.missing.join(", "));
      return fail(503, "not_configured", STUDIO_ORDER_MESSAGES.notConfigured, {});
    }

    const attachments: StudioMailAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
      attachments.push({
        filename: check.order.files[i].name,
        contentType: files[i].upload.type,
        content: new Uint8Array(await files[i].file.arrayBuffer()),
      });
    }

    // A wanted domain is checked again here, so the emails carry our own
    // answer, not the browser's. A failed check is "unknown"; it never blocks.
    if (check.order.hasDomain === "no" && check.order.wantedDomain) {
      check.order.domainCheck = await studioCheckDomain(check.order.wantedDomain, { hasNameservers: studioHasNameservers, timeoutMs: 3000 });
    }

    // 1.20.8: one reference ties the order to its payment (studio-pay.ts).
    const ref = studioOrderRef();
    const o = check.order;
    const cardUrl = studioPayfastConfig().enabled
      ? studioPayHref(ref, o.service, STUDIO_ADDONS.filter((a) => o.flags[a.name]).map((a) => a.name), new URL(request.url).origin)
      : null;
    const mails = buildStudioOrderMails(o, attachments, { from: cfg.from, ordersEmail: cfg.ordersEmail }, ref, undefined, { account: studioBankAccount(), cardUrl });
    const sent = await sendStudioOrderMails(cfg, mails);
    if (!sent.ok) {
      return fail(502, "send_failed", STUDIO_ORDER_MESSAGES.sendFailed, {});
    }
    // 1.21.4: the Pay step's account number, PayShap, Capitec QR and QR
    // codes, only now that the order is sent.
    const payInfo = await studioPayAfterSend(ref, studioOrderZar(o.service, STUDIO_ADDONS.filter((a) => o.flags[a.name]).map((a) => a.name)), cardUrl);
    return reply(200, { ok: true, ref, ack: sent.ack, pay: payInfo });
  } catch (err) {
    console.error("[studio-order] unexpected failure:", err instanceof Error ? err.name : "unknown");
    return fail(500, "error", STUDIO_ORDER_MESSAGES.sendFailed);
  }
}
