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

// Sends one order's two emails over SMTP through our own mail VPS
// (hosting_sdk 1.18.0; Ray, 2026-11-01: mail.rokct.ai, Exim, no third-party
// mail API). nodemailer is the transport: no Rokct SDK carried a mail
// helper, so hosting_sdk declares it in its manifest. Server only.
//
// The order goes first; the acknowledgement only after the studio has it,
// so a client is never told "we have your order" when we do not. A failed
// acknowledgement is reported, not thrown. Errors are logged by their code
// alone: never a setting, never a password, never the server's reply text.

import nodemailer from "nodemailer";

import type { StudioMailConfig } from "./studio-order-config";
import type { StudioMail, StudioOrderMails } from "./studio-order-mail";

export type StudioSendResult = { ok: true; ack: boolean } | { ok: false; code: string };

function errorCode(err: unknown): string {
  if (err && typeof err === "object") {
    const e = err as { code?: unknown; responseCode?: unknown };
    if (typeof e.code === "string" && /^[A-Z_]{2,32}$/.test(e.code)) return e.code;
    if (typeof e.responseCode === "number") return `SMTP_${e.responseCode}`;
  }
  return "UNKNOWN";
}

function toMessage(m: StudioMail) {
  return {
    from: m.from,
    to: m.to,
    replyTo: m.replyTo,
    subject: m.subject,
    text: m.text,
    html: m.html,
    attachments: m.attachments.map((a) => ({ filename: a.filename, contentType: a.contentType, content: Buffer.from(a.content) })),
  };
}

export async function sendStudioOrderMails(cfg: StudioMailConfig, mails: StudioOrderMails): Promise<StudioSendResult> {
  if (!cfg.configured) return { ok: false, code: "NOT_CONFIGURED" };
  let transport: ReturnType<typeof nodemailer.createTransport>;
  try {
    transport = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      requireTLS: !cfg.secure,
      auth: { user: cfg.user, pass: cfg.pass },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
      logger: false,
      debug: false,
    });
  } catch (err) {
    console.error("[studio-order] transport not created:", errorCode(err));
    return { ok: false, code: "TRANSPORT" };
  }
  try {
    await transport.sendMail(toMessage(mails.order));
  } catch (err) {
    const code = errorCode(err);
    console.error("[studio-order] order email not sent:", code);
    transport.close();
    return { ok: false, code };
  }
  let ack = true;
  try {
    await transport.sendMail(toMessage(mails.ack));
  } catch (err) {
    ack = false;
    console.error("[studio-order] acknowledgement not sent:", errorCode(err));
  }
  transport.close();
  return { ok: true, ack };
}
